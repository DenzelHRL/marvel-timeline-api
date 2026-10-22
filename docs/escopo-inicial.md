# Escopo inicial — Marvel Timeline API

> Registro do planejamento inicial. Para o estado atual da implementação, consulte o [README](../README.md) e o Swagger da versão em execução.

Entrega P1: backend NestJS + PostgreSQL/TypeORM até 16/10/2026. A **trilha curta**, iniciada em *Guerra Infinita*, será a experiência principal. A trilha longa continua cadastrada; ambas usam as mesmas obras. A interface visual fica para a entrega posterior.

## O que já existe no PR de banco

- Entidades e migrations versionadas para catálogo, trilhas, personagens, acontecimentos, usuários, perfis, permissões, progresso e comentários.
- Seeds repetíveis para duas trilhas, 34 obras e uma amostra pequena de conteúdo. As contas e os dois comentários de demonstração dependem de `SEED_DEMO_USERS=true`.
- Nenhuma dessas tabelas por si só cria rotas HTTP. Por enquanto a API expõe somente a rota inicial do Nest.

## Primeira funcionalidade completa

1. `GET /obras`: consultar as obras publicadas que já vieram do seed; paginação (`pagina=1`, `limite=20`, máximo 50), filtros `tipo` e `anoLancamento`, metadados (`pagina`, `limite`, `total`, `totalPaginas`), DTO de consulta, Swagger e testes. Filtros inválidos devolvem 400.
2. `GET /obras/:slug`: detalhes de uma obra publicada, resumo sem spoiler por padrão. A opção explícita `incluirSpoilers=true` permite os dados marcados como spoiler; sem essa opção, não incluir os campos de spoiler na resposta.
3. `GET /trilhas`: consultar as duas trilhas publicadas e identificar a curta como recomendada na apresentação/documentação; paginação e filtros `slug` e `nome`. Na gestão administrativa, `status` pode ser filtrado para incluir rascunhos e arquivadas.
4. `GET /trilhas/:slug/etapas`: percorrer obras da trilha com paginação e filtros `prioridade` e `obraId`. A ordem é `posicao`; não duplicar obras entre as duas trilhas.

Esses quatro exemplos são o **primeiro fluxo de leitura**, ainda a implementar. O método + rota só conta para a P1 depois de funcionar, constar na matriz de endpoints, ter Swagger e poder ser demonstrado.

## Adaptação da referência One Piece

O projeto de referência oferece operações de cadastro/gestão e consultas que reúnem dados de várias tabelas para a experiência do mapa. Na Marvel, a unidade que o leitor visita é a **obra**; o percurso fica em `trilhas` + `etapas_trilha`. Cada chamada a uma rota parametrizada atende qualquer obra cadastrada. As 34 obras não se tornam 34 endpoints.

| Ideia da referência | Estrutura equivalente neste projeto |
| --- | --- |
| Arco, ilha e vínculo para definir percurso | `trilhas`, `etapas_trilha` e `obras`; a mesma obra pode estar nas duas trilhas |
| Personagem em contexto narrativo | `personagens` e `participacoes` por obra; sem versões separadas neste recorte |
| Eventos e participantes | `acontecimentos` e `acontecimento_personagens` |
| Contas, perfis e permissões | `usuarios`, `usuario_perfis`, `perfis`, `permissoes` e `perfil_permissoes` |
| Consultas de Wiki voltadas ao mapa | Respostas agregadas de exploração, montadas pela camada de serviço a partir das tabelas existentes |

Duas consultas de exploração a especificar na matriz, além das rotas de catálogo:
## Estrutura da experiência de exploração

A unidade que o leitor visita é a **obra**; o percurso fica em `trilhas` + `etapas_trilha`. As consultas de exploração reúnem dados das tabelas para apresentar cada etapa do mapa. Cada rota parametrizada atende qualquer obra cadastrada: as 34 obras não se tornam 34 endpoints.

| Funcionalidade | Estrutura no projeto |
| --- | --- |
| Percurso e ordem das obras | `trilhas`, `etapas_trilha` e `obras`; a mesma obra pode estar nas duas trilhas |
| Personagens em cada obra | `personagens` e `participacoes`; sem versões separadas neste recorte |
| Acontecimentos e participantes | `acontecimentos` e `acontecimento_personagens` |
| Contas, perfis e permissões | `usuarios`, `usuario_perfis`, `perfis`, `permissoes` e `perfil_permissoes` |
| Dados do mapa | Respostas agregadas de exploração, montadas pela camada de serviço a partir das tabelas existentes |

Duas consultas de exploração planejadas na matriz, além das rotas de catálogo:

- `GET /explorar/trilhas/:slug/mapa`: páginas de etapas já acompanhadas do título, imagem e resumo da obra. Filtrar pelos campos `prioridade` e `obraId` da etapa, com paginação e metadados. Difere de `GET /trilhas/:slug/etapas`, que consulta os dados próprios das etapas para gestão e navegação simples.
- `GET /explorar/trilhas/:slug/obras/:obraSlug`: conferir que a obra pertence à trilha e reunir resumo, posição, obra anterior/próxima e links para as listagens de participações e acontecimentos daquela obra. Essas listagens terão paginação e dois filtros cada uma. Por padrão, omitir conteúdo marcado como spoiler; liberar apenas com opção explícita. A rota atende todas as obras e as duas trilhas.

Essas consultas **ainda não estão implementadas** e não pedem tabelas novas. O catálogo inicial vem dos seeds; a API o consulta ou permite manutenção autorizada. O fluxo inicial usa HTTP com Nest e PostgreSQL; mensageria poderá ser avaliada depois, se houver uma tarefa assíncrona real.
## Funcionalidades seguintes

| Bloco | Entrega observável | Acesso |
| --- | --- | --- |
| Contas e acesso | cadastro local, login JWT, `/usuarios/me`, perfil `LEITOR`/`ADMIN`, guards e permissões por ação; depois entrada Google | público ou dono da conta |
| Catálogo | administrar obras, séries e temporadas; consultar personagens, participações e acontecimentos com opção de spoiler | leitura pública; edição `ADMIN` |
| Trilhas | criar, editar, publicar e ordenar etapas; consultar trilha curta/longa | leitura pública; edição `ADMIN` |
| Exploração | montar o mapa de obras da trilha e os detalhes narrativos de uma obra a partir de relações existentes | leitura pública, com proteção de spoiler |
| Comentários por obra | listar, publicar, editar/remover comentário próprio e moderar; texto marcado como spoiler fica oculto por padrão | leitura pública; escrita autenticada; moderação `ADMIN` |
| Progresso | marcar obra como quero ver/assistindo/concluída e consultar o próprio histórico | próprio usuário autenticado |
| Administração | gerenciar contas, perfis, permissões e moderação | `ADMIN` com permissão correspondente |
| Consultas úteis | indicadores de conclusão e participação por obra/trilha, se houver tempo depois das rotas principais | conforme dados expostos |

Comentários são registros persistidos por obra (`comentarios.obra_id`) e autor (`usuario_id`), ordenados por criação. A primeira versão consulta a lista via HTTP; atualização em tempo real é uma melhoria futura. A API deve impedir comentar obras não publicadas, conferir dono/permissão nas alterações, preservar o estado de moderação e nunca devolver texto marcado como spoiler na leitura padrão. Essas regras só estarão prontas quando serviço e testes forem implementados.

## Ordem de trabalho sugerida

1. Validar a migration e o seed no PostgreSQL do grupo; implementar o primeiro fluxo de leitura completo, com DTOs, Swagger e testes.
2. Montar login local/JWT, guards de perfil/permissão e testes de acesso negado; integrar Google como escolha do grupo depois que o fluxo local funcionar.
3. Implementar comentários e moderação; depois progresso, administração e manutenção do catálogo e trilhas.
4. Fechar **pelo menos 60 endpoints úteis**, com margem de segurança, matriz, 10 regras de negócio com testes, PDF, commits de cada integrante e vídeos individuais. Não contar rotas esboçadas.
5. Somente após os obrigatórios: cache para consultas públicas do catálogo/trilhas (TTL e invalidação após edição); avaliar fila BullMQ/Redis para uma tarefa assíncrona real, como avisos de moderação; CQRS se ainda houver tempo e um fluxo que justifique separar comandos de consultas.

Antes de começar os módulos HTTP em paralelo, completar a matriz exigida: método, rota, finalidade, body/parâmetros, dois filtros e paginação em toda listagem, autenticação, permissão, regra, responsável e estados de código, Swagger e teste. Distribuir responsáveis após alinhamento com os cinco integrantes; autoria deve refletir trabalho real.
