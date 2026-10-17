# Base compartilhada e integração dos bônus

[Voltar ao índice](../plano-bonus.md)

## Resultado esperado

Cache, logs, CQRS e filas devem trabalhar sobre a mesma API. Logs é independente. Cache pode começar só na listagem de trilhas. CQRS e filas compartilham a reconstrução do mapa; precisam concordar com o contrato abaixo antes de integrar.

**Base atualizada em 17/10/2026:** o CQRS e a revisão/outbox já entraram na main pela PR #24, commit `7f4363c`. Redis, cache, relay, worker e contratos de jobs ainda são propostas. Reutilizar os componentes existentes; não criar outra migration de revisão nem outro reconstrutor.

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

### PostgreSQL: configuração já implementada

O banco principal continua usando `DB_*` ou `DATABASE_URL`. O segundo banco usa **o mesmo servidor, porta, usuário e senha**, alterando somente o nome com `READ_DB_NAME`.

1. Criar `marvel_timeline_leitura` no mesmo servidor PostgreSQL do banco principal. Pode ser pelo pgAdmin; não substituir nem apagar o banco existente.
2. Preservar o `.env` local e acrescentar:

```dotenv
READ_DB_NAME=marvel_timeline_leitura
CQRS_MAPA_ENABLED=false
```

3. Com a API parada, dentro de `backend`, executar:

```text
npm ci
npm run db:migrate
npm run db:read:verify
npm run db:read:migrate
npm run db:read:rebuild
```

4. Após a preparação, definir `CQRS_MAPA_ENABLED=true` no próprio `.env` e iniciar a API. O `.env.example` mantém `false` por padrão.

`READ_DB_HOST`, `READ_DB_PORT`, `READ_DB_USER`, `READ_DB_PASSWORD` e uma URL exclusiva de leitura **não são interpretados pela configuração atual**. Não subir uma segunda instância na porta 5434 esperando que esses campos funcionem. Se a infraestrutura exigir outro servidor ou credenciais diferentes, ampliar `leitura-data-source.ts` em uma PR própria e validar a conexão. Atualmente, quando há `DATABASE_URL`, o código preserva suas opções e troca o nome do banco; o provedor precisa permitir criar/acessar esse segundo banco.

O principal precisa da migration de revisão/outbox mesmo com CQRS desligado: as escritas de trilhas e etapas já usam essas tabelas. Atualizar `.env.example` não altera automaticamente o `.env` individual. Não há necessidade de rodar seed para ativar esta entrega.

### Redis: infraestrutura ainda a implementar

Manter o serviço `postgres` e seu volume. Acrescentar somente este serviço ao `backend/compose.yaml`, dentro de `services:`:

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
```

Acrescentar `marvel_redis_data:` na seção `volumes:`. Configuração proposta para os módulos de cache/filas, ainda sem comportamento automático na main:

```dotenv
CACHE_ENABLED=false
CACHE_TTL_SECONDS=60
REDIS_HOST=localhost
REDIS_PORT=6379
FILAS_ENABLED=false
LOG_LEVEL=info
```

Cada módulo deve implementar suas flags e acrescentar as variáveis ao `.env.example`. Comparar `process.env.FLAG === 'true'`; `Boolean('false')` é verdadeiro. Credenciais reais ficam somente no `.env`. Em container, usar o host do serviço e a porta interna conforme a configuração efetivamente implementada.

Depois de alterar o Compose:

```text
docker compose config --quiet
docker compose up -d redis
docker compose ps
docker compose exec redis redis-cli ping
```

Esperado: configuração válida, Redis saudável e `PONG`. Cache e fila precisam de clientes/prefixos separados. Não usar `FLUSHDB`, `FLUSHALL` nem políticas de expulsão que apaguem tarefas. AOF não substitui a outbox.

## 3. Contratos que todos devem usar

Criar `backend/src/bonus/contratos.ts` na PR de filas; este arquivo ainda não existe:

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

Contratos existentes e componentes ainda a implementar:

| Serviço | Contrato | Uso |
| --- | --- | --- |
| `CatalogoRevisaoService` | `bloquear(manager): Promise<void>`; `atual(manager): Promise<string>`; `registrarAlteracao(manager): Promise<string>` | Ler/incrementar revisão persistente e produzir eventos na transação de escrita |
| `ProjecaoMapaService` | `reconstruir(trilhaId: string): Promise<void>` | Worker chama esta função; o serviço lê o estado atual, não confia no conteúdo antigo do job |
| `MapaLeituraService` | `consultarSeAtual(slug, filtros): Promise<MapaTrilhaRespostaDto \| undefined>` | Retorna projeção válida; o `ConsultarMapaHandler` faz fallback por `TrilhasService.consultarMapa` |
| `CacheRedisService` | `getJson<T>(chave): Promise<T \| undefined>`; `setJson(chave, valor, ttlSegundos): Promise<void>` | Ausência/falha de cache nunca vira erro da API |

Os métodos com `manager` recebem o `EntityManager` da transação em andamento. Dentro da transação, não usar um repositório global para salvar revisão/evento fora dela.

## 4. Uma estratégia de versão simples para este catálogo

Implementado: **uma revisão global do catálogo**, na migration `1792237200000-PrepararAtualizacaoMapas.ts`. Não recriar as tabelas:

- `catalogo_revisao`: `id smallint PRIMARY KEY CHECK (id = 1)`, `versao bigint NOT NULL`; inserir `(1, 1)` na migration.
- `mapa_outbox`: `event_id uuid PRIMARY KEY`, `trilha_id uuid NOT NULL`, `versao bigint NOT NULL`, `criado_em timestamptz`, `enfileirado_em timestamptz NULL`; índice dos pendentes e unicidade `(trilha_id, versao)`.

`bloquear(manager)` adquire a linha singleton com `pessimistic_write` no início da transação. Depois de salvar os dados do domínio, `registrarAlteracao(manager)` faz `UPDATE ... SET versao = versao + 1 ... RETURNING versao`; depois insere um evento por trilha existente, dentro da mesma transação. Gerar UUID com `randomUUID()` de `node:crypto`. Não chamar Redis nessa transação. Uma falha da escrita também desfaz revisão e eventos.

**Por que atualizar todas as trilhas?** O seed atual tem duas trilhas e 34 obras; uma obra pode estar em ambas. Reconstruir todas reduz a chance de esquecer uma dependência. É uma simplificação consciente para este catálogo pequeno, não um desenho para milhares de trilhas. Uma revisão global faz todas as projeções anteriores ficarem antigas, portanto todas precisam receber evento. Uma otimização por trilha exige redesenhar conjuntamente cache, versão e produtor.

Usar uma ordem única de locks: em toda escrita de catálogo envolvida, adquirir primeiro a linha de revisão, depois os locks de trilha/obra/etapa existentes. Chamar `bloquear(manager)` no início; chamar `registrarAlteracao(manager)` após as gravações e antes do commit, para incluir também uma trilha recém-criada. Padronizar evita ciclos entre criação, edição de obra e reordenação. Se a operação não mudar nada, não precisa produzir evento.

## 5. Onde registrar mudanças

| Alteração confirmada | Arquivo real/ponto a integrar |
| --- | --- |
| Criar/editar trilha | Já integrado em `src/trilhas/trilhas.service.ts`: `criar`, `atualizar` |
| Alterar status/incluir etapa | Já integrado no mesmo arquivo: `alterarStatus`, `criarEtapa` |
| Editar/remover/reordenar etapa | Já integrado em `src/trilhas/etapas-trilha.service.ts`: `atualizar`, `remover`, `reordenar` |
| Editar/publicar/arquivar/remover obra | Service de obras quando integrado; verificar o nome real na branch atual antes de alterar |
| Operação de série que modifique obras/visibilidade | Integrar a alteração resultante no mesmo mecanismo; não depender só dos controllers de trilhas |

Migrations/seeds e SQL manual que mudem o catálogo também precisam incrementar a revisão e agendar reconstrução ao final. Preferir um script de manutenção que use o mesmo serviço; documentar esse passo. Não executar seeds durante um teste de invalidação sem atualizar a versão.

Revisão/outbox já existem em `src/catalogo-revisao/`. As sete operações de trilhas/etapas da tabela acima já possuem os hooks. A integração de obras/séries e manutenção continua pendente; cache e filas devem reutilizar a mesma base.

## 6. Dependências entre módulos

- `CatalogoRevisaoModule`: usa conexão principal; exporta revisão/outbox; não importa trilhas, cache ou filas.
- `ProjecaoMapaModule`: usa conexão principal e `BancoLeituraService`, que inicializa o datasource `leitura` sob demanda; exporta `ProjecaoMapaService`; não importa `TrilhasModule` nem fila.
- `FilasModule`: importa projeção e revisão; contém relay/produtor/worker; não importa `TrilhasModule`.
- `CacheRedisModule`: cliente próprio; não importa fila; interceptor usa revisão.
- `LogsModule`: infraestrutura global sem dependência dos módulos de domínio.
- `TrilhasModule`: importa os serviços necessários, registra handlers CQRS e preserva Auth/Acesso.

Importar entidades de catálogo não significa importar `TrilhasModule`. Evitar ciclos e `forwardRef()` como remendo para um ciclo desnecessário.

## 7. PRs e validação conjunta

Sequência restante: integrar os hooks de obras → logs/cache inicial e fila/worker → cache do mapa. CQRS, revisão/outbox e reconstrução manual já foram implementados. Algumas podem avançar em paralelo com contratos estáveis. Não habilitar funcionalidade incompleta em `main`.

Para cada PR, rodar os scripts existentes de build, lint e testes. Se houver migration, verificar aplicação duas vezes sem duplicação; testar banco novo e banco existente. `db:verify` valida o domínio atual e não prova que Redis, fila ou projeção funcionam: acrescentar verificações próprias. Preservar `synchronize: false` e registrar migrations novas explicitamente na configuração atual.

## Fontes

- [Docker Compose](https://docs.docker.com/compose/intro/features-uses/): serviços locais e configuração.
- [Nest: módulos e bancos](https://docs.nestjs.com/techniques/database): conexão nomeada e injeção.
- [TypeORM: transações](https://typeorm.io/docs/transactions/): usar o manager transacional.
- [BullMQ: conexões](https://docs.bullmq.io/guide/connections): clientes, persistência e políticas de conexão.

A revisão global, nomes, flags e escopo do mapa são decisões deste projeto; não são configurações fornecidas automaticamente pelas ferramentas.
