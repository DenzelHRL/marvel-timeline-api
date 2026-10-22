# Bônus: por onde começar

Este é o índice dos guias de implementação e validação. Os guias preservam decisões do planejamento inicial; para verificar o comportamento atual, consulte também os módulos implementados e as configurações do ambiente.

**Estado da main em 22/10/2026:** CQRS e banco de leitura pela [PR #24](https://github.com/DenzelHRL/marvel-timeline-api/pull/24); cache Redis pela [PR #26](https://github.com/DenzelHRL/marvel-timeline-api/pull/26); logs e auditoria pela [PR #28](https://github.com/DenzelHRL/marvel-timeline-api/pull/28); relay da outbox e worker BullMQ pela [PR #27](https://github.com/DenzelHRL/marvel-timeline-api/pull/27). Todos esses componentes estão no código; o funcionamento da fila depende de Redis, banco de leitura e `FILAS_ENABLED=true` no ambiente. O CI com PostgreSQL não substitui uma validação integrada com Redis.

## 1. Escolher uma parte

| Bônus | Afinidade com os blocos existentes | Dificuldade relativa neste escopo | Primeiro resultado |
| --- | --- | --- | --- |
| [Logs e auditoria](bonus/01-logs-e-auditoria.md) | Autenticação, autorização e operações administrativas de todos os módulos | Menor | Uma requisição e uma alteração rastreáveis pelo mesmo identificador |
| [Cache Redis](bonus/02-cache-redis.md) | Consultas de trilhas e exploração | Intermediária | Repetir `GET /trilhas` e reutilizar a resposta, mantendo invalidação correta |
| [Filas BullMQ](bonus/04-filas-bullmq.md) | Atualizações de obras, trilhas e etapas | Intermediária a alta | Uma alteração gerar uma tarefa persistente, executada por um worker |
| [CQRS do mapa](bonus/03-cqrs-mapa.md) | Escritas de trilhas/etapas e consulta do mapa | Maior | Escrever no banco principal e consultar uma projeção em outro banco |

A afinidade ajuda a aproveitar conhecimento, mas não determina propriedade. Filas é infraestrutura compartilhada, não uma consequência natural do bloco de comentários/progresso. CQRS também envolve mais de um bloco. A dificuldade considera integração e falhas, não apenas quantidade de arquivos.

## 2. Ler o contrato compartilhado antes de programar

Leia [base, infraestrutura e contratos](bonus/00-base-e-integracao.md). Esse guia define nomes de módulos, versão dos dados, mensagem da fila, configuração e ordem das PRs. Os quatro guias dependem dessas definições, mas não precisam ser implementados por uma única pessoa.

Ao alterar `backend/package.json`, `backend/package-lock.json`, `backend/compose.yaml`, `backend/.env.example` ou `AppModule`, incorpore primeiro a versão atual da `main` e preserve as configurações dos demais módulos.

## 3. Validar a integração

1. Preparar o PostgreSQL principal, o banco de leitura e o Redis. Aplicar as migrations dos dois bancos e executar `npm run db:read:rebuild` para criar a projeção inicial.
2. Habilitar `FILAS_ENABLED=true` para iniciar o relay e o worker. Habilitar `CQRS_MAPA_ENABLED=true` após preparar o banco de leitura. A fila e a leitura pela projeção têm configurações independentes.
3. Alterar uma trilha ou obra publicada e verificar outbox, enfileiramento, processamento e atualização do mapa. Repetir a consulta após reordenação, arquivamento e falha temporária do Redis.
4. Confirmar que o mapa recorre ao banco principal quando a projeção estiver ausente ou atrasada. A leitura pública deve respeitar os filtros, a paginação e a publicação.

Os exemplos de implementação nos guias registram o desenho inicial; os nomes e métodos em produção estão em `backend/src/`. Nenhum bônus altera os contratos HTTP ou as regras de negócio das rotas existentes.

## 4. Base consultada

Revisão em 17/10/2026 sobre a main no commit [`7f4363c`](https://github.com/DenzelHRL/marvel-timeline-api/commit/7f4363cde7f5dea7b1f7e7136c01d9a93a6f0965). A configuração de leitura implementada troca apenas o nome do banco, preservando servidor e credenciais do principal. O guia diferencia componentes já existentes de propostas de Redis/filas.

Referências internas: [matriz de endpoints](matriz-endpoints.md), [ambiente da equipe](ambiente-equipe.md), [autenticação e autorização](guia-autenticacao-e-autorizacao.md), [modelo do banco](modelo-banco.md) e [ordem das trilhas](ordem-das-trilhas.md).

Material da disciplina: [repositório do professor](https://github.com/profdiegocbcastro/programacao-web/tree/main/Backend), [exemplo de logs/auditoria](https://github.com/profdiegocbcastro/programacao-web/tree/main/Backend/Logs_e_Auditoria) e aula de NestJS disponibilizada ao grupo. A transcrição consultada descreve cache em interceptor e o exemplo de CQRS com banco de escrita e banco de leitura. Ela não está versionada neste repositório; não há link interno inventado para esse arquivo.

Dois bancos são a escolha deste guia para acompanhar o exemplo da aula, não uma exigência universal da definição de CQRS. Não é possível garantir pontuação apenas por adotar uma biblioteca. As fontes oficiais e sua aplicação estão em cada guia.

### Evidências e Instruções de Execução do Bônus de Logs e Auditoria

- **Branch da entrega:** `feat/logs-auditoria`
- **Módulo e Serviços:**
  - `LoggerService` (`src/logs/logger.service.ts`): Logging estruturado JSON via Winston para console e arquivos rotativos locais (`logs/app.log`, `logs/error.log` e `logs/audit.log`) com limite de 5 MB e retenção de até 5 arquivos.
  - `RequestContextMiddleware` (`src/logs/request-context.middleware.ts`): Geração do header `X-Request-Id` (UUID), rastreamento de duração com relógio monotônico (`performance.now()`), sanitização de rotas sem query params e registro de acessos HTTP normais ou desconexões prematuras do cliente (código 499).
  - Decorator `@Auditar` (`src/logs/auditoria.decorator.ts`) e `AuditoriaInterceptor` (`src/logs/auditoria.interceptor.ts`): Captura de ações administrativas confirmando `concluido` após sucesso no banco, `rejeitado` para validações/regras de negócio 4xx e `falhou` para erros internos 5xx.
  - Sanitização automática de dados confidenciais (`senha`, `password`, `token`, `secret`, `authorization`, etc.).
- **Como executar os testes:**
  ```bash
  npm run test -- logs.spec.ts
  ```
