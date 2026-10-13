# Matriz inicial de endpoints — proposta para discussão do grupo

**Situação em 13/10/2026:** são **78 combinações de método + rota planejadas**, com 76 de produto/gestão e 2 analíticas opcionais. O objetivo é implementar **pelo menos 60 válidas e demonstráveis**, com margem, e ajustar a seleção junto aos responsáveis. O enunciado define o mínimo, não um teto. Consideramos método + rota como endpoint conforme a confirmação relatada pelo grupo.

`E` = essencial; `C` = complementar; `A` = administrativo; `N` = analítico; `O` = opcional. `P[filtro1, filtro2]` = listagem **com paginação**, `pagina=1`, `limite=20`, máximo 50, metadados, validação de filtros e os dois filtros mínimos indicados por **colunas do banco**. `—` = não se aplica. `Público` = sem token; `JWT` = autenticado, com o perfil e a permissão indicados. `AD` = responsável a definir pelo grupo, nunca crédito de autoria presumido. `P/P/P` = implementação/Swagger/teste **pendentes**; `I/I/I` = implementação, documentação Swagger e testes automatizados concluídos. A validação OAuth com o provedor real depende de credenciais configuradas. Alterar os estados e o responsável conforme entregas reais. Os caminhos `:id`, `:slug`, `:obraId` etc. são parâmetros, não endpoints separados por registro.

Permissões estão no [seed](../backend/src/database/seeds/seed-data.ts). Para listas públicas, só dados publicados e sem spoilers por padrão. Para listas administrativas, o filtro de estado pode incluir rascunhos e arquivados; campos de senha nunca saem da API. Todos os bodies terão DTOs e validações. A coluna de regra indica uma **candidata de regra de serviço** para o catálogo que será detalhado e testado; `—` não dispensa validação.

## Autenticação e conta própria — 7

| # | Classe | Método e rota | Finalidade; body/parâmetros | Filtros/paginação | Acesso | Regra | Resp. | Código/Swagger/Teste |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | E | `POST /auth/cadastro` | Criar conta local; nome, e-mail, senha | — | Público | R11 | AD | P/P/P |
| 02 | E | `POST /auth/login` | Conferir credenciais e emitir JWT; e-mail, senha | — | Público | R11 | AD | P/P/P |
| 03 | C | `GET /auth/google` | Iniciar OAuth Google; redirecionamento | — | Público | R12 | AD | I/I/I |
| 04 | C | `GET /auth/google/callback` | Concluir OAuth, associar identidade e emitir JWT; `code`, `state` | — | Público | R12 | AD | I/I/I |
| 05 | E | `GET /usuarios/me` | Consultar conta atual; token | — | JWT `LEITOR/ADMIN`, `conta:consultar_propria` | — | AD | P/P/P |
| 06 | E | `PATCH /usuarios/me` | Alterar nome/e-mail próprios; DTO | — | JWT `LEITOR/ADMIN`, `conta:editar_propria` | R11 | AD | P/P/P |
| 07 | C | `GET /usuarios/me/permissoes` | Ver permissões efetivas da conta, sem duplicar por perfil | P[`codigo`, `descricao`] | JWT `LEITOR/ADMIN`, `conta:consultar_propria` | — | AD | P/P/P |

## Administração de usuários e acesso — 12

| # | Classe | Método e rota | Finalidade; body/parâmetros | Filtros/paginação | Acesso | Regra | Resp. | Código/Swagger/Teste |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 08 | A | `GET /admin/usuarios` | Localizar contas | P[`nome`, `email`] | JWT `ADMIN`, `usuarios:consultar_todos` | — | AD | P/P/P |
| 09 | A | `GET /admin/usuarios/:id` | Detalhes de uma conta, sem hash | — | JWT `ADMIN`, `usuarios:consultar_todos` | — | AD | P/P/P |
| 10 | A | `PATCH /admin/usuarios/:id/status` | Ativar/desativar; `{ ativo }` | — | JWT `ADMIN`, `usuarios:alterar_status` | R10 | AD | P/P/P |
| 11 | A | `POST /admin/usuarios/:id/perfis` | Atribuir perfil; `{ perfilId }` | — | JWT `ADMIN`, `acessos:atribuir_perfil` | R10 | AD | P/P/P |
| 12 | A | `DELETE /admin/usuarios/:id/perfis/:perfilId` | Revogar perfil atribuído | — | JWT `ADMIN`, `acessos:revogar_perfil` | R10 | AD | P/P/P |
| 13 | A | `GET /admin/perfis` | Listar perfis | P[`codigo`, `descricao`] | JWT `ADMIN`, `acessos:alterar_permissoes` | — | AD | P/P/P |
| 14 | A | `GET /admin/perfis/:id` | Consultar um perfil | — | JWT `ADMIN`, `acessos:alterar_permissoes` | — | AD | P/P/P |
| 15 | A | `GET /admin/permissoes` | Listar permissões | P[`codigo`, `descricao`] | JWT `ADMIN`, `acessos:alterar_permissoes` | — | AD | P/P/P |
| 16 | A | `GET /admin/permissoes/:id` | Consultar uma permissão | — | JWT `ADMIN`, `acessos:alterar_permissoes` | — | AD | P/P/P |
| 17 | A | `GET /admin/perfis/:id/permissoes` | Ações de um perfil | P[`codigo`, `descricao`] | JWT `ADMIN`, `acessos:alterar_permissoes` | — | AD | P/P/P |
| 18 | A | `PUT /admin/perfis/:id/permissoes/:permissaoId` | Conceder ação ao perfil | — | JWT `ADMIN`, `acessos:alterar_permissoes` | R10 | AD | P/P/P |
| 19 | A | `DELETE /admin/perfis/:id/permissoes/:permissaoId` | Revogar ação do perfil | — | JWT `ADMIN`, `acessos:alterar_permissoes` | R10 | AD | P/P/P |

## Séries e temporadas — 6

| # | Classe | Método e rota | Finalidade; body/parâmetros | Filtros/paginação | Acesso | Regra | Resp. | Código/Swagger/Teste |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 20 | E | `GET /series` | Descobrir séries publicadas | P[`titulo`, `slug`] | Público | R01 | AD | P/P/P |
| 21 | E | `GET /series/:slug` | Dados de uma série | — | Público | R01 | AD | P/P/P |
| 22 | E | `GET /series/:slug/temporadas` | Temporadas da série, como obras | P[`numeroTemporada`, `anoLancamento`] | Público | R01 | AD | P/P/P |
| 23 | A | `POST /series` | Cadastrar série; título, slug, descrição | — | JWT `ADMIN`, `series:criar` | — | AD | P/P/P |
| 24 | A | `PATCH /series/:id` | Alterar metadados; DTO parcial sem status | — | JWT `ADMIN`, `series:editar` | — | AD | P/P/P |
| 25 | A | `PATCH /series/:id/status` | Publicar/arquivar; `{ status }` | — | JWT `ADMIN`, `series:editar` | R02 | AD | P/P/P |

## Obras — 5

| # | Classe | Método e rota | Finalidade; body/parâmetros | Filtros/paginação | Acesso | Regra | Resp. | Código/Swagger/Teste |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 26 | E | `GET /obras` | Filmes e temporadas do catálogo | P[`tipo`, `anoLancamento`] | Público | R01 | AD | P/P/P |
| 27 | E | `GET /obras/:slug` | Resumo e dados de uma obra; `incluirSpoilers` explícito | — | Público | R01, R03 | AD | P/P/P |
| 28 | A | `POST /obras` | Criar filme/temporada; DTO de obra | — | JWT `ADMIN`, `obras:criar` | R04 | AD | P/P/P |
| 29 | A | `PATCH /obras/:id` | Editar obra; DTO parcial sem status | — | JWT `ADMIN`, `obras:editar` | R04 | AD | P/P/P |
| 30 | A | `PATCH /obras/:id/status` | Publicar/arquivar obra; `{ status }` | — | JWT `ADMIN`, `obras:editar` | R02 | AD | P/P/P |

## Trilhas e ordenação — 10

| # | Classe | Método e rota | Finalidade; body/parâmetros | Filtros/paginação | Acesso | Regra | Resp. | Código/Swagger/Teste |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 31 | E | `GET /trilhas` | Escolher trilha curta ou longa | P[`nome`, `slug`] | Público | R01 | AD | P/P/P |
| 32 | E | `GET /trilhas/:slug` | Detalhes da trilha | — | Público | R01 | AD | P/P/P |
| 33 | E | `GET /trilhas/:slug/etapas` | Percorrer etapas simples na ordem | P[`prioridade`, `obraId`] | Público | R01 | AD | P/P/P |
| 34 | A | `POST /trilhas` | Criar trilha; nome, slug, descrição | — | JWT `ADMIN`, `trilhas:criar` | — | AD | P/P/P |
| 35 | A | `PATCH /trilhas/:id` | Editar metadados, sem status/etapas | — | JWT `ADMIN`, `trilhas:editar` | — | AD | P/P/P |
| 36 | A | `PATCH /trilhas/:id/status` | Publicar/arquivar; `{ status }` | — | JWT `ADMIN`, `trilhas:editar` | R05 | AD | P/P/P |
| 37 | A | `POST /trilhas/:id/etapas` | Inserir obra em posição; `{ obraId, posicao, prioridade }` | — | JWT `ADMIN`, `etapas:editar` | R06 | AD | P/P/P |
| 38 | A | `PATCH /trilhas/:id/etapas/:etapaId` | Alterar prioridade/justificativa, sem posição | — | JWT `ADMIN`, `etapas:editar` | R06 | AD | P/P/P |
| 39 | A | `DELETE /trilhas/:id/etapas/:etapaId` | Retirar obra da trilha | — | JWT `ADMIN`, `etapas:editar` | R05 | AD | P/P/P |
| 40 | A | `PUT /trilhas/:id/ordem` | Reordenar tudo em transação; lista de `etapaId` | — | JWT `ADMIN`, `etapas:editar` | R07 | AD | P/P/P |

## Personagens e participações — 9

| # | Classe | Método e rota | Finalidade; body/parâmetros | Filtros/paginação | Acesso | Regra | Resp. | Código/Swagger/Teste |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 41 | E | `GET /personagens` | Descobrir personagens | P[`nome`, `slug`] | Público | — | AD | P/P/P |
| 42 | E | `GET /personagens/:slug` | Dados públicos de personagem | — | Público | — | AD | P/P/P |
| 43 | A | `POST /personagens` | Cadastrar; nome, slug, descrição | — | JWT `ADMIN`, `personagens:criar` | — | AD | P/P/P |
| 44 | A | `PATCH /personagens/:id` | Editar personagem; DTO parcial | — | JWT `ADMIN`, `personagens:editar` | — | AD | P/P/P |
| 45 | E | `GET /obras/:slug/participacoes` | Participantes da obra, spoiler controlado | P[`papel`, `presencaESpoiler`] | Público | R03 | AD | P/P/P |
| 46 | C | `GET /participacoes/:id` | Ver participação individual, sem spoiler padrão | — | Público | R03 | AD | P/P/P |
| 47 | A | `POST /obras/:obraId/participacoes` | Vincular personagem; `{ personagemId, papel, ... }` | — | JWT `ADMIN`, `participacoes:editar` | R08 | AD | P/P/P |
| 48 | A | `PATCH /participacoes/:id` | Editar papel/desfecho; DTO parcial | — | JWT `ADMIN`, `participacoes:editar` | R03 | AD | P/P/P |
| 49 | A | `DELETE /participacoes/:id` | Desvincular personagem da obra | — | JWT `ADMIN`, `participacoes:editar` | R08 | AD | P/P/P |

## Acontecimentos e elenco do acontecimento — 8

| # | Classe | Método e rota | Finalidade; body/parâmetros | Filtros/paginação | Acesso | Regra | Resp. | Código/Swagger/Teste |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 50 | E | `GET /obras/:slug/acontecimentos` | Eventos da obra em ordem | P[`categoria`, `contemSpoiler`] | Público | R03 | AD | P/P/P |
| 51 | C | `GET /acontecimentos/:id` | Um evento, spoiler controlado | — | Público | R03 | AD | P/P/P |
| 52 | A | `POST /obras/:obraId/acontecimentos` | Criar evento; título, descrição, categoria, posição, spoiler | — | JWT `ADMIN`, `acontecimentos:criar` | R08 | AD | P/P/P |
| 53 | A | `PATCH /acontecimentos/:id` | Editar evento/posição; DTO parcial | — | JWT `ADMIN`, `acontecimentos:editar` | R08 | AD | P/P/P |
| 54 | A | `DELETE /acontecimentos/:id` | Retirar evento, após tratar vínculos | — | JWT `ADMIN`, `acontecimentos:editar` | R08 | AD | P/P/P |
| 55 | C | `GET /acontecimentos/:id/personagens` | Personagens associados ao evento | P[`nome`, `slug`] | Público | R03 | AD | P/P/P |
| 56 | A | `POST /acontecimentos/:id/personagens` | Associar personagem; `{ personagemId }` | — | JWT `ADMIN`, `acontecimentos:editar` | — | AD | P/P/P |
| 57 | A | `DELETE /acontecimentos/:id/personagens/:personagemId` | Retirar associação | — | JWT `ADMIN`, `acontecimentos:editar` | — | AD | P/P/P |

## Exploração para a experiência do mapa — 2

| # | Classe | Método e rota | Finalidade; body/parâmetros | Filtros/paginação | Acesso | Regra | Resp. | Código/Swagger/Teste |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 58 | E | `GET /explorar/trilhas/:slug/mapa` | Etapas + imagem/título/resumo da obra, prontas para um mapa | P[`prioridade`, `obraId`] | Público | R01, R03 | AD | P/P/P |
| 59 | E | `GET /explorar/trilhas/:slug/obras/:obraSlug` | Checar obra na trilha; resumo, posição e obras vizinhas | — | Público | R01, R03 | AD | P/P/P |

`/trilhas/:slug/etapas` fornece dados das etapas; `/explorar/trilhas/:slug/mapa` agrega os dados da obra numa consulta de apresentação. Não criar uma rota por filme. A tela poderá chamar as listas de personagens, eventos e comentários separadamente.

## Comentários — 8

| # | Classe | Método e rota | Finalidade; body/parâmetros | Filtros/paginação | Acesso | Regra | Resp. | Código/Swagger/Teste |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 60 | E | `GET /obras/:slug/comentarios` | Conversa publicada da obra; spoiler oculto por padrão | P[`contemSpoiler`, `usuarioId`] | Público | R01, R03 | AD | P/P/P |
| 61 | C | `GET /comentarios/:id` | Ver comentário visível, spoiler controlado | — | Público | R03 | AD | P/P/P |
| 62 | E | `POST /obras/:obraId/comentarios` | Publicar comentário; `{ texto, contemSpoiler }` | — | JWT `LEITOR/ADMIN`, `comentarios:criar` | R09 | AD | P/P/P |
| 63 | E | `PATCH /comentarios/:id` | Alterar texto/spoiler do próprio comentário | — | JWT `LEITOR/ADMIN`, `comentarios:editar_proprio` | R09 | AD | P/P/P |
| 64 | E | `DELETE /comentarios/:id` | Remoção lógica pelo autor | — | JWT `LEITOR/ADMIN`, `comentarios:remover_proprio` | R09 | AD | P/P/P |
| 65 | C | `GET /usuarios/me/comentarios` | Histórico do próprio autor | P[`status`, `contemSpoiler`] | JWT `LEITOR/ADMIN`, `conta:consultar_propria` | — | AD | P/P/P |
| 66 | A | `GET /admin/comentarios` | Fila de moderação | P[`status`, `contemSpoiler`] | JWT `ADMIN`, `comentarios:moderar` | — | AD | P/P/P |
| 67 | A | `PATCH /admin/comentarios/:id/moderacao` | Ocultar/republicar; `{ status }` | — | JWT `ADMIN`, `comentarios:moderar` | R09 | AD | P/P/P |

## Progresso pessoal — 5

| # | Classe | Método e rota | Finalidade; body/parâmetros | Filtros/paginação | Acesso | Regra | Resp. | Código/Swagger/Teste |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 68 | C | `GET /usuarios/me/progresso` | Minhas obras acompanhadas | P[`status`, `obraId`] | JWT `LEITOR/ADMIN`, `progresso:consultar_proprio` | — | AD | P/P/P |
| 69 | C | `GET /usuarios/me/progresso/:obraId` | Estado pessoal de uma obra | — | JWT `LEITOR/ADMIN`, `progresso:consultar_proprio` | — | AD | P/P/P |
| 70 | C | `PUT /usuarios/me/progresso/:obraId` | Definir estado; `{ status }` | — | JWT `LEITOR/ADMIN`, `progresso:alterar_proprio` | R13 | AD | P/P/P |
| 71 | C | `DELETE /usuarios/me/progresso/:obraId` | Limpar estado pessoal de uma obra | — | JWT `LEITOR/ADMIN`, `progresso:alterar_proprio` | — | AD | P/P/P |
| 72 | C | `GET /usuarios/me/trilhas/:slug/progresso` | Resumo agregado pessoal da trilha; totais | — | JWT `LEITOR/ADMIN`, `progresso:consultar_proprio` | R13 | AD | P/P/P |

## Indicadores opcionais — 2

| # | Classe | Método e rota | Finalidade; body/parâmetros | Filtros/paginação | Acesso | Regra | Resp. | Código/Swagger/Teste |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 73 | O/N | `GET /indicadores/obras/:slug/comentarios` | Totais de comentários publicados por obra, sem texto | — | Público | R01 | AD | P/P/P |
| 74 | O/N | `GET /indicadores/trilhas/:slug/conclusoes` | Totais agregados de progresso por trilha, sem expor usuários | — | JWT `ADMIN`, `usuarios:consultar_todos` | R01 | AD | P/P/P |

## Ampliação administrativa para edição por ID — 4

| # | Classe | Método e rota | Finalidade; body/parâmetros | Filtros/paginação | Acesso | Regra | Resp. | Código/Swagger/Teste |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 75 | A | `PATCH /admin/usuarios/:id` | Editar nome/e-mail de outra conta; DTO parcial, sem senha/perfil/status | — | JWT `ADMIN`, `usuarios:editar` | R11 | AD | P/P/P |
| 76 | A | `GET /admin/obras` | Encontrar obras para editar, incluindo rascunhos | P[`tipo`, `status`] | JWT `ADMIN`, `obras:editar` | — | AD | P/P/P |
| 77 | A | `GET /admin/obras/:id` | Abrir obra por ID para edição, mesmo em rascunho | — | JWT `ADMIN`, `obras:editar` | — | AD | P/P/P |
| 78 | A | `GET /admin/personagens/:id` | Abrir personagem por ID para edição | — | JWT `ADMIN`, `personagens:editar` | — | AD | P/P/P |

Essas operações administrativas têm um propósito distinto de `GET /obras/:slug` e `GET /personagens/:slug`: as públicas usam um identificador legível para o leitor; a administração abre registros internos pelo ID, inclusive uma obra ainda não publicada. As edições de obra e personagem já estão nas linhas 29 e 44. Uma rota parametrizada atende todos os registros.

## Regras candidatas referenciadas acima

| Código | Decisão de domínio que o serviço deverá tomar |
| --- | --- |
| R01 | Leituras públicas nunca incluem obras, séries ou trilhas em rascunho/arquivadas; a obra visitada deve pertencer à trilha publicada. |
| R02 | Publicar/arquivar conteúdo verifica dependências, como série/obra e obra/etapas publicadas; uma transição inválida é rejeitada. |
| R03 | Spoiler de resumos, presença de personagem, eventos ou comentários não aparece na resposta padrão; opção explícita governa a revelação, sem mostrar comentários moderados. |
| R04 | Filme não tem série/temporada; temporada pertence à série e não repete o número nela; verificar coerência antes de salvar. |
| R05 | Trilha publicada precisa manter ao menos uma etapa válida; remoção/publicação não pode deixá-la sem percurso. |
| R06 | Uma obra entra uma vez em cada trilha, com posição e prioridade consistentes; inserção trata posição ocupada de forma transacional. |
| R07 | Reordenação recebe todas as etapas da trilha exatamente uma vez e aplica mudanças em transação, sem colisões temporárias na chave única de posição. |
| R08 | Mudanças em participação/acontecimentos preservam unicidade, ordem e vínculos válidos; retirada de evento com personagens exige remoção dos vínculos na mesma transação. |
| R09 | Só conta ativa comenta obra publicada; edição/remoção exige autor, moderação exige ADMIN; comentário removido/oculto não vaza na leitura pública. |
| R10 | Não desativar/remover o último ADMIN efetivo, nem deixar a administração sem as permissões necessárias para recuperar o acesso. |
| R11 | Cadastro/login respeita contas ativas, unicidade de e-mail normalizado e tipo de credencial; conta apenas Google não faz login por senha. |
| R12 | Login Google associa `(provedor, id_no_provedor)` de forma única; e-mail coincidente, por si só, não toma conta de outro usuário. |
| R13 | Progresso `CONCLUIDO` grava data; saída desse estado limpa a data; resumo de trilha conta cada obra da trilha uma vez. |

As regras precisam ser refinadas com cenários positivo/negativo e evidência de teste antes do PDF. As validações simples de DTO/banco não contam por si só como regras de negócio. Contar apenas endpoints implementados e verificáveis; em cada PR atualizar esta matriz, o Swagger e os testes. Dividir responsáveis após o grupo concordar com os módulos; os commits devem refletir autoria real.
