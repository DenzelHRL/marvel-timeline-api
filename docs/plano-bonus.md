# Plano dos bônus

Implementar quatro melhorias: **cache, CQRS, filas e logs com auditoria**. A meta é 1,00 ponto, com cada implementação funcionando e demonstrada.

Primeiro, concluir as funcionalidades que cada melhoria vai utilizar. Não é necessário esperar todos os endpoints ficarem prontos.

## Onde cada bônus entra

Os números são os da [matriz de endpoints](matriz-endpoints.md).

| Bônus | Endpoints envolvidos | O que fazer | Quem precisa alinhar |
| --- | --- | --- | --- |
| Cache | Trilhas (31), etapas (33) e mapa (58) | Reutilizar respostas de consultas repetidas e atualizar o cache quando os dados mudarem | Blocos 2 e 3 |
| CQRS | Mapa (58) e criação/alteração de trilhas e etapas (34–40) | Separar o processamento de consultas e alterações; preparar os dados do mapa para leitura | Blocos 2 e 3; bloco 5 para manter o cálculo de progresso coerente |
| Filas | Alterações de obras, trilhas e etapas que afetam o mapa | Atualizar os dados preparados do mapa em segundo plano | Blocos 2 e 3 |
| Logs e auditoria | Requisições, erros, publicação (25, 30, 36), reordenação (40), moderação (66–67) e mudanças de acesso | Registrar falhas e ações administrativas para identificar o que aconteceu | Bloco 1 para identificar o usuário; demais blocos para registrar as ações |

Os responsáveis por implementar os bônus podem ser diferentes dos responsáveis pelos endpoints. Definir a divisão antes de começar.

## 1. Cache

**Objetivo:** evitar que a mesma consulta busque e monte os mesmos dados no PostgreSQL repetidamente.

**Como fazer:**

1. Configurar Redis e o serviço de cache.
2. Antes de consultar trilhas, etapas ou mapa, verificar se existe uma resposta válida no cache.
3. Se existir, retornar essa resposta. Se não existir, consultar o banco, guardar o resultado por um período definido e responder.
4. Usar uma chave que identifique a rota, a trilha, os filtros, a página e a opção de spoilers.
5. Após uma alteração confirmada em obras, trilhas ou etapas, invalidar as respostas afetadas. Usar uma versão dos dados para impedir que uma consulta antiga recoloque uma resposta desatualizada no cache.
6. Se o Redis estiver indisponível, consultar o PostgreSQL normalmente.

**Teste:** repetir uma consulta e mostrar que a segunda usa o cache. Alterar os dados e confirmar que a próxima resposta está atualizada. Verificar também o funcionamento sem Redis.

## 2. CQRS

**Objetivo:** separar as consultas das operações que alteram dados e facilitar a leitura do mapa.

**Como fazer:**

1. Criar handlers de consultas para leitura e handlers de comandos para criação, edição, publicação, remoção e reordenação.
2. Usar a integração CQRS do Nest para encaminhar cada operação ao handler correspondente.
3. Manter as tabelas atuais como a fonte dos dados oficiais.
4. Criar uma estrutura de leitura com os dados necessários ao mapa: trilha, etapas ordenadas e informações públicas das obras. Essa estrutura é chamada de projeção.
5. Fazer o endpoint do mapa consultar essa projeção, evitando montar todos os relacionamentos novamente a cada requisição.
6. Atualizar a projeção quando os dados originais mudarem e registrar sua versão.

Essa separação começa no código da aplicação. A projeção pode ficar no mesmo PostgreSQL; não é necessário criar outro servidor de banco. Os controllers e caminhos dos endpoints podem permanecer iguais.

**Teste:** alterar uma trilha, atualizar a projeção e consultar o mapa. Comparar a consulta original com a nova para demonstrar o benefício.

## 3. Filas

**Objetivo:** reconstruir os dados de leitura do mapa em segundo plano e recuperar tarefas após falhas temporárias.

**Como fazer:**

1. Configurar uma fila persistente com Bull e Redis.
2. Quando uma obra, trilha ou etapa mudar, registrar uma tarefa de atualização das trilhas afetadas.
3. Guardar no PostgreSQL um registro pendente junto com a alteração, na mesma transação. Um processo encaminha esse registro à fila, evitando perder a tarefa se o Redis estiver indisponível.
4. Criar um worker, que é o processo responsável por consumir a tarefa e reconstruir a projeção.
5. Configurar tentativas limitadas com intervalo entre elas e registrar tarefas que falharem.
6. Permitir que uma tarefa seja repetida sem duplicar ou corromper os dados. Impedir que uma tarefa antiga substitua uma versão mais recente.
7. Enquanto a projeção estiver desatualizada, usar os dados atuais do PostgreSQL como alternativa para responder corretamente.

**Teste:** interromper o worker, criar uma tarefa e retomá-lo. Demonstrar que a tarefa foi preservada e processada. Simular uma falha temporária e verificar a nova tentativa.

## 4. Logs e auditoria

**Objetivo:** localizar erros e identificar quem realizou alterações administrativas.

**Como fazer:**

1. Configurar Winston para produzir logs estruturados.
2. Dar um identificador a cada requisição e registrar método, rota, horário, duração e status.
3. Registrar erros com esse identificador para relacionar a falha à requisição.
4. Nas ações administrativas, registrar usuário autenticado, ação, registro afetado, horário e resultado.
5. Distinguir ações concluídas, rejeitadas e falhas. Registrar sucesso somente depois da confirmação no banco.
6. Definir armazenamento e rotação dos logs, prazo de retenção e quem pode consultá-los.
7. Registrar apenas os campos necessários; excluir senhas, tokens, segredos e dados pessoais desnecessários.

**Teste:** executar uma alteração administrativa e localizar seu registro. Provocar um erro e rastrear a requisição que falhou.

## Ordem de implementação

1. Concluir e testar os endpoints envolvidos, com validação, Swagger e proteção das rotas administrativas.
2. Definir responsáveis, configuração do Redis e formato das tarefas e dos registros.
3. Adicionar cache às consultas prontas.
4. Separar leitura e escrita com CQRS e criar a projeção do mapa.
5. Adicionar a fila para atualizar a projeção.
6. Integrar logs e auditoria. Essa parte pode avançar em paralelo quando a identificação do usuário estiver definida.
7. Testar tudo integrado e preparar a demonstração.

Cache, CQRS e filas devem manter as regras de publicação e spoilers. Uma resposta antiga não pode expor uma obra arquivada ou revelar conteúdo que deveria estar oculto.

## O que entregar

Para cada bônus: implementação em branch própria, commits individuais, PR, instruções de execução e demonstração do benefício.

Coordenar mudanças nas dependências e no ambiente. Se houver novas tabelas, criar migrations. Documentar Redis e worker para que qualquer integrante consiga executar a API.

| Implementação | Responsável | Estado |
| --- | --- | --- |
| Cache | A definir | Planejado |
| CQRS | A definir | Planejado |
| Filas | A definir | Planejado |
| Logs e auditoria | Guilherme Peclat | Concluído |

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
