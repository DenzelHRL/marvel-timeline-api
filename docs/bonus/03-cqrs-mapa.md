# CQRS do mapa: implementação e operação

[Índice](../plano-bonus.md) · [Contrato compartilhado](00-base-e-integracao.md) · [Filas](04-filas-bullmq.md)

## 1. Estado atual

Integrado na main pela [PR #24](https://github.com/DenzelHRL/marvel-timeline-api/pull/24), commit `7f4363c`. Dependência instalada: `@nestjs/cqrs` 12.1.0, com NestJS 12 e TypeORM 0.3 existentes.

O PostgreSQL principal mantém os dados oficiais. Outro banco, `marvel_timeline_leitura`, armazena a projeção JSONB do mapa. Na configuração atual, os dois bancos ficam no mesmo servidor e usam as mesmas credenciais; isso não exige outra instância PostgreSQL.

Há **um comando de reordenação** e **uma consulta de mapa** encaminhados pelos buses. Os demais endpoints preservam seus services. As sete escritas de trilhas e etapas atualizam revisão/outbox em transação. Não afirmar que todos os endpoints foram convertidos em handlers CQRS.

## 2. Arquivos existentes e fluxo

Todos os caminhos abaixo são relativos a `backend/`.

| Arquivo/componente | Responsabilidade real |
| --- | --- |
| `src/trilhas/commands/reordenar-etapas.command.ts` | Transporta trilhaId e DTO |
| `src/trilhas/commands/reordenar-etapas.handler.ts` | Delega a `EtapasTrilhaService.reordenar` |
| `src/trilhas/queries/consultar-mapa.query.ts` | Transporta slug e filtros |
| `src/trilhas/queries/consultar-mapa.handler.ts` | Consulta projeção quando habilitada; faz fallback pelo service original |
| `src/trilhas/trilhas.module.ts` | Registra `CqrsModule.forRoot()` e os dois handlers |
| `src/catalogo-revisao/catalogo-revisao.service.ts` | Lock global, revisão persistente e outbox transacional |
| `src/projecao-mapa/banco-leitura.service.ts` | Inicialização tardia, compartilhamento e encerramento da conexão de leitura |
| `src/projecao-mapa/projecao-mapa.service.ts` | `reconstruir(trilhaId)` monta e persiste snapshot versionado |
| `src/projecao-mapa/mapa-leitura.service.ts` | `consultarSeAtual(slug, filtros)` retorna mapa válido ou undefined |
| `src/database/leitura-data-source.ts` | Troca apenas o banco da configuração principal; impede usar o mesmo nome |
| `src/database/leitura-migrations/1792233000000-CriarMapasLeitura.ts` | Cria `mapas_leitura` no segundo banco |
| `src/database/migrations/1792237200000-PrepararAtualizacaoMapas.ts` | Cria revisão/outbox no principal |
| `src/database/reconstruir-mapas.ts` | Reconstrói todas as trilhas usando o serviço público da projeção |

```text
PUT /trilhas/:id/ordem → CommandBus → ReordenarEtapasHandler
  → EtapasTrilhaService.reordenar → domínio + revisão + outbox → commit

GET /explorar/trilhas/:slug/mapa → QueryBus → ConsultarMapaHandler
  → MapaLeituraService.consultarSeAtual → mapa válido
  → se desabilitado/ausente/atrasado/indisponível: TrilhasService.consultarMapa
```

Controllers preservam autorização, UUIDs, filtros, paginação e Swagger. O fallback não chama o QueryBus de novo. `ProjecaoMapaModule` não importa `TrilhasModule`; não criar esse ciclo para conectar a fila.

## 3. Preparar e ativar

Seguir a [configuração compartilhada](00-base-e-integracao.md#2-infraestrutura-local). Criar previamente `marvel_timeline_leitura` no mesmo servidor do principal e acrescentar ao `.env` local:

```dotenv
READ_DB_NAME=marvel_timeline_leitura
CQRS_MAPA_ENABLED=false
```

Dentro de `backend`, com a API parada:

```text
npm ci
npm run db:migrate
npm run db:read:verify
npm run db:read:migrate
npm run db:read:rebuild
```

Após preparar os bancos, mudar `CQRS_MAPA_ENABLED=true` e iniciar a API. O padrão compartilhado permanece false. O banco principal precisa da migration mesmo com a leitura otimizada desligada.

Os scripts implementados são `db:read:verify`, `db:read:migrate` e `db:read:rebuild`. Não há `db:read:show` nem comando de reversão de leitura nesta entrega. Não editar migrations já aplicadas; criar novas se a estrutura mudar.

`BancoLeituraService` conecta sob demanda, com limites de conexão/consulta de dois segundos. A indisponibilidade do banco de leitura não exige conectar a ele no startup; a consulta usa fallback. Falha do banco principal não é coberta por esse fallback.

## 4. Reconstrução e consistência

`ProjecaoMapaService.reconstruir(trilhaId)`:

1. Abre transação de leitura `REPEATABLE READ` no principal e captura revisão, publicação e etapas pelo mesmo manager.
2. Seleciona somente os campos de `ItemMapaDto`, com obras publicadas, ordenando por posição e ID.
3. Finaliza o snapshot do principal e faz um único upsert atômico no segundo banco. Não há transação distribuída.
4. Grava `publicada=false` e itens vazios para trilhas não públicas ou inexistentes.
5. Rejeita snapshots de versões antigas. Reconstruir a mesma versão substitui o mapa, inclusive para corrigir uma projeção danificada, sem duplicar registros.

A tabela contém `trilha_id`, `versao`, `publicada`, `itens` e `atualizado_em`, sem chave estrangeira entre bancos. Armazena a coleção completa, nunca apenas uma página.

A consulta verifica publicação e revisão no principal, aceita somente projeção pública com versão igual, filtra antes de contar/paginar e mantém o DTO sem versão interna ou spoilers. A verificação é por snapshot; não promete linearização absoluta com escritas simultâneas.

## 5. O que ainda precisa ser integrado

- **Obras:** alterações de campos usados no mapa e de publicação precisam usar `CatalogoRevisaoService` na mesma transação. Primeiro `bloquear(manager)`, depois consultas/locks/gravações pelo manager e, por fim, `registrarAlteracao(manager)` antes do commit. Não salvar domínio em uma transação e revisão em outra.
- **Séries:** alterações que modifiquem obras ou sua visibilidade precisam manter as mesmas garantias e regras de dependência.
- **Filas:** relay encaminha `mapa_outbox`; worker chama `reconstruir(trilhaId)`. Este serviço não depende de Redis/BullMQ.
- **Cache:** usa a revisão do principal na chave; não espera a fila para invalidar dados antigos.
- **Seeds/SQL manual:** devem participar da revisão em um procedimento de manutenção. Um rebuild da mesma versão corrige o registro de leitura, mas mudar dados oficiais por fora sem avançar revisão deixa cache e outbox inconsistentes.

Até integrar as filas, a atualização das projeções é manual por `npm run db:read:rebuild`. Esse comando não marca eventos como enfileirados. Uma reconstrução não significa entrega ao Redis; pendências na outbox são esperadas.

Para uma remoção física futura de trilha, o evento deve preservar também o ID removido: percorrer apenas trilhas existentes não gera esse tombstone.

## 6. Evidências e validações restantes

Na entrega da PR #24: build aprovado; lint com zero erros e três avisos no módulo de comentários; 89 testes automatizados existentes passaram. Essas suítes existentes não são testes automatizados específicos do CQRS.

Validações manuais relatadas: consulta original e projeção; filtros e paginação; reordenação pelo CommandBus; fallback com projeção antiga; reconstrução após alteração; trilha arquivada retornando 404; rejeição de reordenação inválida sem avançar revisão/outbox; resposta preservada com banco de leitura indisponível e configuração restaurada.

Para integração final, acrescentar testes automatizados dos handlers, dos hooks de obras e do fallback; validar worker/retry com Redis real e snapshots concorrentes fora de ordem. Esses cenários não estão comprovados apenas pelos 89 testes existentes.

## Fontes oficiais

- [Nest CQRS](https://docs.nestjs.com/recipes/cqrs): buses e handlers.
- [TypeORM: transações](https://typeorm.io/docs/transactions/): manager transacional da versão do projeto.
- [PostgreSQL 16: isolamento](https://www.postgresql.org/docs/16/transaction-iso.html): snapshot coerente.
- [PostgreSQL 16: INSERT/ON CONFLICT](https://www.postgresql.org/docs/16/sql-insert.html): upsert condicional.

O escopo com dois bancos, JSONB, revisão global e fallback é uma decisão do projeto alinhada ao exemplo da aula; não é imposto pela definição universal de CQRS.
