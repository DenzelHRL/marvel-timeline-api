# Bônus: por onde começar

Este é o índice dos guias de implementação. Cada bônus tem um arquivo próprio, com etapas, arquivos a criar, pontos reais de integração e validações. Não há atribuição de pessoas: qualquer integrante pode assumir um bônus seguindo o respectivo guia.

**Estado em 17/10/2026:** CQRS, banco de leitura, revisão/outbox e reconstrução manual integrados pela [PR #24](https://github.com/DenzelHRL/marvel-timeline-api/pull/24). Logs/auditoria, cache e filas continuam como guias de implementação. Hooks de obras e validação integrada permanecem pendentes. Exemplos propostos não substituem arquivos existentes.

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

Uma pessoa por vez integra mudanças em `backend/package.json`, `backend/package-lock.json`, `backend/compose.yaml`, `backend/.env.example` e na configuração principal. Os demais desenvolvem seus módulos em branches próprias e incorporam a PR de base depois. Não copiar um `AppModule` antigo por cima do atual.

## 3. Ordem prática

1. Corrigir e validar as funcionalidades obrigatórias utilizadas. Não é necessário esperar todos os módulos da API terminarem para desenvolver um bônus isolado.
2. Atualizar a branch com a main e preparar a base CQRS já existente. Logs pode começar independentemente; cache pelos testes de chave/cliente; filas pelo contrato do job e pelos testes de produtor/worker.
3. Entregar logs e o primeiro cache em `GET /trilhas`. Reutilizar a projeção e o comando CQRS existentes, sem reescrever os demais endpoints.
4. Conectar outbox, fila e reconstrução da projeção. Só habilitar leitura pela projeção após existir reconstrução inicial e alternativa para projeção atrasada.
5. Habilitar cache do mapa por último e validar alterações, falhas e concorrência em conjunto.

O objetivo é preservar as URLs, DTOs de resposta, autenticação, paginação e regras de publicação existentes. Nenhum bônus justifica remover uma validação já implementada.

## 4. Base consultada

Revisão em 17/10/2026 sobre a main no commit [`7f4363c`](https://github.com/DenzelHRL/marvel-timeline-api/commit/7f4363cde7f5dea7b1f7e7136c01d9a93a6f0965). A configuração de leitura implementada troca apenas o nome do banco, preservando servidor e credenciais do principal. O guia diferencia componentes já existentes de propostas de Redis/filas.

Referências internas: [matriz de endpoints](matriz-endpoints.md), [ambiente da equipe](ambiente-equipe.md), [autenticação e autorização](guia-autenticacao-e-autorizacao.md), [modelo do banco](modelo-banco.md) e [ordem das trilhas](ordem-das-trilhas.md).

Material da disciplina: [repositório do professor](https://github.com/profdiegocbcastro/programacao-web/tree/main/Backend), [exemplo de logs/auditoria](https://github.com/profdiegocbcastro/programacao-web/tree/main/Backend/Logs_e_Auditoria) e aula de NestJS disponibilizada ao grupo. A transcrição consultada descreve cache em interceptor e o exemplo de CQRS com banco de escrita e banco de leitura. Ela não está versionada neste repositório; não há link interno inventado para esse arquivo.

Dois bancos são a escolha deste guia para acompanhar o exemplo da aula, não uma exigência universal da definição de CQRS. Não é possível garantir pontuação apenas por adotar uma biblioteca. As fontes oficiais e sua aplicação estão em cada guia.
