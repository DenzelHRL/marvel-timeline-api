# Plano de implementação dos bônus

**Estado: planejamento; nenhuma das quatro implementações está concluída por este documento.**

O grupo escolheu quatro implementações adicionais: cache, CQRS, filas e logs estruturados com auditoria. O enunciado concede 0,25 por implementação adicional de performance ou resiliência; a meta é 1,00 ponto com as quatro implementadas e demonstradas. Logs e auditoria foram definidos como o quarto bônus conforme a orientação confirmada por Denzel.

Os requisitos obrigatórios da P1 têm prioridade. O plano pode começar quando os endpoints envolvidos estiverem funcionando, sem esperar todas as rotas do projeto. Os responsáveis pelos bônus ainda serão definidos pelo grupo, sem atribuição automática ao responsável pelo bloco 3.

## Visão geral

Os números correspondem à [matriz de endpoints](matriz-endpoints.md).

| Bônus | Onde entra | Implementação proposta | Benefício a demonstrar | Estado |
| --- | --- | --- | --- | --- |
| Cache | GET /trilhas (31), etapas (33) e mapa (58) | Respostas públicas armazenadas no Redis, com chave por consulta, expiração e invalidação após mudanças | Reduzir consultas repetidas ao banco e tempo de resposta | Planejado |
| CQRS | Consultas do mapa (58) e comandos de trilhas/etapas (34–40) | Separar handlers de leitura/escrita e preparar um modelo de leitura do mapa | Consultas especializadas que evitem reconstruir relacionamentos em cada requisição | Planejado |
| Filas | Atualização do modelo de leitura após alterações de obras, trilhas e etapas | Fila persistente no Redis com produtor, worker, tentativas limitadas e tratamento de falhas | Processamento desacoplado, recuperação após interrupções e tratamento de picos | Planejado |
| Logs estruturados e auditoria | Infraestrutura comum; publicação (25, 30, 36), reordenação (40), moderação (66–67) e alterações de acesso | Logs de requisição/erro e auditoria das ações administrativas | Rastreabilidade de alterações e diagnóstico de falhas | Planejado |

## 1. Cache

**Integração:** módulo de trilhas/exploração e infraestrutura comum de cache.

- Adicionar uma camada de cache às consultas públicas já concluídas, usando o fluxo de interceptor apresentado na disciplina.
- A chave precisa distinguir rota, slug, filtros, paginação e opção de spoilers, quando aplicável. Não usar uma chave única para todas as trilhas.
- Definir tempo de expiração e uma versão do catálogo/trilha para evitar reutilizar respostas inválidas.
- Invalidar os dados afetados depois que uma alteração no PostgreSQL for confirmada: metadados/publicação de obras e trilhas, inclusão/edição/remoção/reordenação de etapas.
- Se o cache estiver indisponível, consultar o PostgreSQL e manter a resposta correta.
- Não armazenar tokens, senhas ou respostas pessoais nessa primeira implementação.
- Respostas públicas devem continuar respeitando publicação e spoilers.

**Alinhamento:** blocos 2 e 3, pois alterações de obras também afetam o mapa.

**Critério de conclusão:** demonstrar cache miss e hit, redução das consultas repetidas ao banco, atualização após uma edição e funcionamento sem o cache. Medir com a mesma consulta e ambiente; não inventar ganhos numéricos.

## 2. CQRS

**Integração:** leitura e escrita de trilhas/etapas, com foco em GET /explorar/trilhas/:slug/mapa.

Os slides separam leitura e escrita no nível da aplicação e apresentam o pacote `@nestjs/cqrs`. A proposta é implementar essa separação com comandos e consultas, usando handlers, e acrescentar um modelo de leitura otimizado para o mapa.

- Manter as tabelas normalizadas como fonte de verdade para as alterações.
- Criar comandos para as operações escolhidas de escrita e consultas próprias para leitura.
- Preparar uma projeção de leitura com as etapas ordenadas e os dados das obras necessários ao mapa.
- Uma projeção é um conjunto de dados preparado para leitura; não deve substituir as regras de negócio das tabelas originais.
- Registrar a versão da projeção para saber se ela corresponde ao catálogo/trilha atuais.
- A primeira proposta usa o mesmo PostgreSQL, com estruturas de leitura e escrita separadas. CQRS não exige obrigatoriamente dois servidores de banco.
- Separar nomes ou classes, sozinho, não comprova melhoria de performance. Comparar a consulta original com a consulta da projeção.
- Uma obra arquivada ou conteúdo com spoiler não pode continuar exposto por uma projeção antiga.

**Alinhamento:** blocos 2 e 3; compartilhar com o bloco 5 a definição de etapas válidas para que o resumo de progresso continue coerente.

**Critério de conclusão:** demonstrar comando alterando a fonte de verdade, atualização do modelo de leitura, consulta pela projeção e tratamento explícito de dados desatualizados.

## 3. Filas

**Integração:** serviço produtor das alterações de catálogo/trilhas e worker de reconstrução das projeções.

- Usar a fila baseada em Redis apresentada na disciplina: Bull com a integração Nest correspondente. Fixar versões compatíveis com o projeto na implementação.
- Depois de uma alteração confirmada, registrar uma tarefa para reconstruir a projeção das trilhas afetadas.
- Para evitar perda de uma atualização entre o commit no PostgreSQL e o envio ao Redis, prever um registro pendente durável, como outbox gravada na mesma transação, e encaminhamento posterior à fila.
- O worker processa a tarefa fora da requisição HTTP.
- Identificar a trilha e a versão dos dados na tarefa. O processamento deve tolerar repetição e impedir que uma tarefa antiga substitua uma projeção mais nova.
- Definir número máximo de tentativas, intervalo entre tentativas e registro das falhas.
- A indisponibilidade do worker não desfaz uma alteração já confirmada. A API deve tratar o mapa pendente/desatualizado de forma explícita, usando a fonte de verdade como alternativa quando necessário.
- Configurar Redis e worker no ambiente da equipe e documentar como iniciá-los.

**Alinhamento:** blocos 2 e 3, além do responsável pela infraestrutura. Combinar quais alterações disparam tarefas e como informar/atender uma consulta enquanto a reconstrução está pendente.

**Critério de conclusão:** demonstrar tarefa persistente, worker interrompido e retomado, falha temporária com nova tentativa e repetição da tarefa sem corromper dados.

## 4. Logs estruturados e auditoria

**Integração:** infraestrutura comum de logs, interceptor/filtro de erros e serviços administrativos.

- Seguir o exemplo de Winston do professor e adaptar a integração ao Nest.
- Registrar identificador da requisição, método, rota, duração, status e horário.
- Registrar erros com contexto suficiente para diagnóstico.
- Nas ações administrativas, registrar autor autenticado, ação, entidade afetada, horário e resultado. Usar o padrão de identidade definido pelo bloco 1.
- Auditar alterações relevantes: publicação/arquivamento, reordenação, moderação e mudanças de perfis/permissões.
- Diferenciar ações concluídas, rejeitadas e falhas. Registrar uma alteração como concluída apenas depois da confirmação no banco.
- Evitar senhas, JWTs, segredos do .env e corpos completos que exponham dados pessoais. Usar lista explícita de campos permitidos.
- Definir armazenamento, rotação/retenção e controle de acesso aos registros.
- Logs não são backup nem substituem transações; o benefício demonstrado aqui é rastreabilidade e diagnóstico operacional.

**Alinhamento:** bloco 1 para identidade autenticada; blocos 2–5 para integrar as ações relevantes.

**Critério de conclusão:** provocar uma falha, rastreá-la pelo identificador da requisição e demonstrar uma ação administrativa auditada, sem expor credenciais.

## Ordem de trabalho e dependências

1. Concluir os endpoints necessários: DTOs, filtros/paginação, regras, Swagger e guards das operações protegidas.
2. Definir responsáveis e acordos compartilhados: Redis, identidade autenticada, publicação/spoilers e versões de dados.
3. Implementar cache sobre consultas prontas.
4. Implementar CQRS e a projeção do mapa.
5. Implementar a fila persistente para reconstrução da projeção.
6. Implementar logs e auditoria em paralelo após a definição da identidade e das ações administrativas.
7. Integrar e testar as quatro implementações juntas.

O cache pode começar sem todas as rotas do projeto. A fila depende da definição do trabalho de reconstrução. Os logs podem avançar sem aguardar cache/CQRS/filas. Cada implementação pode ser feita por um integrante diferente; trabalhar nos endpoints do bloco 3 não atribui todos os bônus à mesma pessoa.

## Entrega de cada bônus

- Branch própria, commits individuais e PR com o benefício descrito.
- Dependências/configuração compartilhadas coordenadas com a equipe.
- Migrations versionadas para novas estruturas, sem alterar migrations já aplicadas.
- Documentação de ambiente e Swagger atualizada quando o comportamento HTTP mudar.
- Evidências reproduzíveis de funcionamento normal e de falha.
- Demonstração no vídeo de quem implementou, distinguindo planejamento de código entregue.
- Atualizar o estado da tabela somente após implementação e verificação.

## Fontes da disciplina

- [Slides 8 — Aprimorando nossa API: CQRS, queues e caching](https://github.com/profdiegocbcastro/programacao-web/blob/main/Backend/_Slides/8%20-%20Aprimorando%20nossa%20API.pdf).
- [Exemplo de Logs e Auditoria](https://github.com/profdiegocbcastro/programacao-web/tree/main/Backend/Logs_e_Auditoria).
- [README do exemplo de logs](https://github.com/profdiegocbcastro/programacao-web/blob/main/Backend/Logs_e_Auditoria/README.md).
- Enunciado atual da P1 fornecido pelo grupo: 0,25 por implementação adicional de performance ou resiliência.

## Situação do GET /trilhas

A consulta inicial de trilhas publicadas é uma etapa de desenvolvimento. Para concluir o endpoint 31, ainda são necessários filtros por nome e slug, paginação com metadados, validação por DTO, Swagger e verificação dos cenários. Um commit pode registrar essa etapa inicial sem declarar o endpoint concluído.

Este plano documenta as próximas implementações; não aplica Redis, CQRS, filas, logs ou mudanças de schema por si só.
