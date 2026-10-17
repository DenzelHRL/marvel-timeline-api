# Base compartilhada e integração dos bônus

[Voltar ao índice](../plano-bonus.md)

## Resultado esperado

Cache, logs, CQRS e filas devem trabalhar sobre a mesma API. Logs é independente. Cache pode começar só na listagem de trilhas. CQRS e filas compartilham a reconstrução do mapa; precisam concordar com o contrato abaixo antes de integrar.

**Tudo nesta seção é proposta de implementação.** As tabelas, variáveis, arquivos e scripts novos ainda precisam ser criados. Não executar um script novo antes de ele existir na PR correspondente.

## 1. Preparar uma branch sem perder trabalho

Na raiz do projeto, confira `git status`. Se houver alterações, preserve-as em commit ou stash antes de trocar de branch. Com o trabalho preservado:

```text
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c feat/bonus-MINHA-PARTE
cd backend
npm ci
npm run build
npm run lint
npm test -- --runInBand
```

Troque `MINHA-PARTE` por `base`, `logs`, `cache`, `cqrs` ou `filas`. Um comando por vez. Não usar `npm audit fix --force` para resolver compatibilidade das novas dependências.

O projeto usa NestJS 12. Antes de instalar qualquer pacote Nest complementar, confira `peerDependencies`, `engines` e a versão efetivamente escolhida:

```text
npm view @nestjs/bullmq peerDependencies engines
npm view @nestjs/cqrs peerDependencies engines
npm view redis engines
npm view bullmq engines
npm view winston engines
```

Selecionar versões compatíveis, instalar com `--save-exact` e versionar o lockfile. Os comandos dos guias mostram nomes de pacotes; não autorizam forçar uma árvore incompatível com `--legacy-peer-deps`. Após integrar uma alteração no lockfile, os demais usam `npm ci`.

A documentação oficial também evolui: o TypeORM deste projeto é 0.3.31, enquanto o site atual já apresenta a versão 1.0. Manter o ORM existente; verificar assinaturas nos tipos instalados e nas referências da versão 0.3 antes de copiar opções novas. Os exemplos de transação deste guia usam o manager já empregado no projeto.

## 2. Infraestrutura local

Manter o serviço `postgres` e seu volume atuais. Acrescentar estes serviços ao `backend/compose.yaml`, sem substituir o arquivo inteiro:

```yaml
  redis:
    image: redis:7.4
    command: ["redis-server", "--appendonly", "yes", "--maxmemory-policy", "noeviction"]
    ports:
      - "127.0.0.1:${REDIS_PORT:-6379}:6379"
    volumes:
      - marvel_redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      retries: 10

  postgres-leitura:
    image: postgres:16
    environment:
      POSTGRES_USER: ${READ_DB_USER:-marvel_read}
      POSTGRES_PASSWORD: ${READ_DB_PASSWORD:-marvel_read_dev_only}
      POSTGRES_DB: ${READ_DB_NAME:-marvel_timeline_leitura}
    ports:
      - "127.0.0.1:${READ_DB_PORT:-5434}:5432"
    volumes:
      - marvel_postgres_read_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${READ_DB_USER:-marvel_read} -d ${READ_DB_NAME:-marvel_timeline_leitura}"]
      interval: 5s
      retries: 10
```

Na seção `volumes:` já existente, acrescentar `marvel_redis_data:` e `marvel_postgres_read_data:`. São exemplos de desenvolvimento local; credenciais reais ficam no `.env` local. Não alterar a porta do PostgreSQL já usado por cada integrante. Quem usa PostgreSQL instalado no Windows pode subir somente os dois serviços novos.

Adicionar ao `.env.example` e copiar os campos novos para o próprio `.env`, preservando DB/JWT/OAuth atuais:

```dotenv
# Bônus — inicialmente desligados até cada módulo estar implementado.
CACHE_ENABLED=false
CACHE_TTL_SECONDS=60
REDIS_HOST=localhost
REDIS_PORT=6379
READ_DB_HOST=localhost
READ_DB_PORT=5434
READ_DB_USER=marvel_read
READ_DB_PASSWORD=marvel_read_dev_only
READ_DB_NAME=marvel_timeline_leitura
CQRS_MAPA_ENABLED=false
FILAS_ENABLED=false
LOG_LEVEL=info
```

As flags precisam ser implementadas; só existir no `.env` não produz comportamento. Comparar `process.env.FLAG === 'true'`, pois `Boolean('false')` é verdadeiro. Para ambiente hospedado, acrescentar tratamento de URL/TLS na configuração de cada cliente; nunca desativar validação TLS indiscriminadamente. Nest executado em container usa os nomes dos serviços como hosts e portas internas, não `localhost`.

Depois que o Compose for alterado, dentro de `backend`:

```text
docker compose config --quiet
docker compose up -d redis postgres-leitura
docker compose ps
docker compose exec redis redis-cli ping
```

Esperado: configuração válida, serviços saudáveis e `PONG`. A persistência AOF ajuda a recuperar tarefas após reinício; não substitui a outbox. Como cache e fila compartilham servidor, usar clientes/prefixos separados e TTL nas chaves de cache. Não usar `FLUSHDB`, `FLUSHALL` nem política de expulsão que possa apagar tarefas.

## 3. Contratos que todos devem usar

Criar `backend/src/bonus/contratos.ts` na PR de base:

```ts
export const FILA_MAPA = 'mapa-trilhas';
export const JOB_RECONSTRUIR_MAPA = 'reconstruir-mapa';

export interface ReconstruirMapaJob {
  eventId: string;
  trilhaId: string;
  versao: string;
}
```

`versao` é um `bigint` PostgreSQL serializado como string decimal. Não converter para `number`, nem serializar `bigint` JavaScript diretamente em JSON. Comparar numericamente, não por ordem alfabética.

Interfaces de serviços a implementar:

| Serviço | Contrato | Uso |
| --- | --- | --- |
| `CatalogoRevisaoService` | `bloquear(manager): Promise<void>`; `atual(manager): Promise<string>`; `registrarAlteracao(manager): Promise<string>` | Ler/incrementar revisão persistente e produzir eventos na transação de escrita |
| `ProjecaoMapaService` | `reconstruir(trilhaId: string): Promise<void>` | Worker chama esta função; o serviço lê o estado atual, não confia no conteúdo antigo do job |
| `MapaLeituraService` | `consultar(slug, filtros): Promise<MapaTrilhaRespostaDto>` | Retorna projeção válida ou usa a consulta original |
| `CacheRedisService` | `getJson<T>(chave): Promise<T \| undefined>`; `setJson(chave, valor, ttlSegundos): Promise<void>` | Ausência/falha de cache nunca vira erro da API |

Os métodos com `manager` recebem o `EntityManager` da transação em andamento. Dentro da transação, não usar um repositório global para salvar revisão/evento fora dela.

## 4. Uma estratégia de versão simples para este catálogo

Escolha deste guia: **uma revisão global do catálogo**, para não obrigar cada bônus a inventar invalidação diferente. Criar, por migration nova no banco principal:

- `catalogo_revisao`: `id smallint PRIMARY KEY CHECK (id = 1)`, `versao bigint NOT NULL`; inserir `(1, 1)` na migration.
- `mapa_outbox`: `event_id uuid PRIMARY KEY`, `trilha_id uuid NOT NULL`, `versao bigint NOT NULL`, `criado_em timestamptz`, `enfileirado_em timestamptz NULL`; índice dos pendentes e unicidade `(trilha_id, versao)`.

`bloquear(manager)` adquire a linha singleton com `pessimistic_write` no início da transação. Depois de salvar os dados do domínio, `registrarAlteracao(manager)` faz `UPDATE ... SET versao = versao + 1 ... RETURNING versao`; depois insere um evento por trilha existente, dentro da mesma transação. Gerar UUID com `randomUUID()` de `node:crypto`. Não chamar Redis nessa transação. Uma falha da escrita também desfaz revisão e eventos.

**Por que atualizar todas as trilhas?** O seed atual tem duas trilhas e 34 obras; uma obra pode estar em ambas. Reconstruir todas reduz a chance de esquecer uma dependência. É uma simplificação consciente para este catálogo pequeno, não um desenho para milhares de trilhas. Uma revisão global faz todas as projeções anteriores ficarem antigas, portanto todas precisam receber evento. Uma otimização por trilha exige redesenhar conjuntamente cache, versão e produtor.

Usar uma ordem única de locks: em toda escrita de catálogo envolvida, adquirir primeiro a linha de revisão, depois os locks de trilha/obra/etapa existentes. Chamar `bloquear(manager)` no início; chamar `registrarAlteracao(manager)` após as gravações e antes do commit, para incluir também uma trilha recém-criada. Padronizar evita ciclos entre criação, edição de obra e reordenação. Se a operação não mudar nada, não precisa produzir evento.

## 5. Onde registrar mudanças

| Alteração confirmada | Arquivo real/ponto a integrar |
| --- | --- |
| Criar/editar trilha | `src/trilhas/trilhas.service.ts`: `criar`, `atualizar`; envolver gravação, revisão e outbox em uma transação |
| Alterar status/incluir etapa | Mesmo arquivo: `alterarStatus`, `criarEtapa`; aproveitar a transação existente |
| Editar/remover/reordenar etapa | `src/trilhas/etapas-trilha.service.ts`: `atualizar`, `remover`, `reordenar`; aproveitar a transação existente |
| Editar/publicar/arquivar/remover obra | Service de obras quando integrado; verificar o nome real na branch atual antes de alterar |
| Operação de série que modifique obras/visibilidade | Integrar a alteração resultante no mesmo mecanismo; não depender só dos controllers de trilhas |

Migrations/seeds e SQL manual que mudem o catálogo também precisam incrementar a revisão e agendar reconstrução ao final. Preferir um script de manutenção que use o mesmo serviço; documentar esse passo. Não executar seeds durante um teste de invalidação sem atualizar a versão.

Revisão/outbox são uma entrega compartilhada pequena. A implementação de filas assume esse componente; cache pode entregá-lo primeiro se precisar habilitar a listagem antes. Criar **uma única migration e um único serviço**, não duas versões em PRs diferentes.

## 6. Dependências entre módulos

- `CatalogoRevisaoModule`: usa conexão principal; exporta revisão/outbox; não importa trilhas, cache ou filas.
- `ProjecaoMapaModule`: usa conexão principal e a nomeada `leitura`; exporta `ProjecaoMapaService`; não importa `TrilhasModule` nem fila.
- `FilasModule`: importa projeção e revisão; contém relay/produtor/worker; não importa `TrilhasModule`.
- `CacheRedisModule`: cliente próprio; não importa fila; interceptor usa revisão.
- `LogsModule`: infraestrutura global sem dependência dos módulos de domínio.
- `TrilhasModule`: importa os serviços necessários, registra handlers CQRS e preserva Auth/Acesso.

Importar entidades de catálogo não significa importar `TrilhasModule`. Evitar ciclos e `forwardRef()` como remendo para um ciclo desnecessário.

## 7. PRs e validação conjunta

PRs sugeridas: base/configuração → revisão/outbox → logs/cache inicial → CQRS/projeção → fila/worker → cache do mapa. Algumas podem avançar em paralelo com contratos estáveis. Não habilitar funcionalidade incompleta em `main`.

Para cada PR, rodar os scripts existentes de build, lint e testes. Se houver migration, verificar aplicação duas vezes sem duplicação; testar banco novo e banco existente. `db:verify` valida o domínio atual e não prova que Redis, fila ou projeção funcionam: acrescentar verificações próprias. Preservar `synchronize: false` e registrar migrations novas explicitamente na configuração atual.

## Fontes

- [Docker Compose](https://docs.docker.com/compose/intro/features-uses/): serviços locais e configuração.
- [Nest: módulos e bancos](https://docs.nestjs.com/techniques/database): conexão nomeada e injeção.
- [TypeORM: transações](https://typeorm.io/docs/transactions/): usar o manager transacional.
- [BullMQ: conexões](https://docs.bullmq.io/guide/connections): clientes, persistência e políticas de conexão.

A revisão global, nomes, flags e escopo do mapa são decisões deste projeto; não são configurações fornecidas automaticamente pelas ferramentas.
