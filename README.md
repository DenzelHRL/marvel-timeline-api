# Marvel Timeline API

API para explorar uma seleção de filmes e séries da Marvel por meio de uma linha do tempo. A proposta é relacionar obras, personagens e acontecimentos importantes, com informações que possam ser consultadas sem spoilers e detalhes revelados separadamente.

Este repositório contém o **backend do Trabalho P1** de Programação Web. A interface visual será uma etapa posterior.

## Situação atual

- Banco PostgreSQL modelado em 16 tabelas com TypeORM e duas migrations versionadas, incluindo comentários por obra.
- Seed repetível: duas trilhas (curta como principal), 34 obras, quatro temporadas, 26 permissões e dois perfis (`LEITOR`, `ADMIN`). Personagens e acontecimentos foram preparados apenas para quatro obras, o suficiente para demonstrar o fluxo de spoilers. Com contas fictícias habilitadas, há dois comentários de exemplo.
- A Action **Banco PostgreSQL** valida build, lint, teste inicial, migrations, seed repetido e verificação do esquema em PostgreSQL 16 temporário. Isso não substitui a criação de uma instância remota para o grupo.
- A API já inclui cadastro local (`POST /auth/cadastro`), login com e-mail e senha (`POST /auth/login`) e autenticação Google (`GET /auth/google` e `GET /auth/google/callback`), que retorna JWT quando as credenciais OAuth estão configuradas. Também inclui o módulo de comentários e Swagger em `/api`; os demais endpoints planejados e as regras de negócio restantes da P1 ainda estão em andamento.

## Comece aqui

**Todo integrante deve seguir o [guia de preparação do ambiente](docs/ambiente-equipe.md).** Ele inclui clonagem, configuração individual, PostgreSQL com Docker ou instalado no Windows, migrations, seeds, validação e solução de erros.

Padrão do grupo: **Node.js 24 (24.15+) + PostgreSQL 16**. Cada pessoa terá seu próprio banco local e usará os mesmos arquivos versionados para criar tabelas e dados iniciais. Mudanças em um banco local não aparecem automaticamente nos outros. A hospedagem fica para a etapa final.

Depois de preparar o banco e o `backend/.env`, execute dentro de `backend`, uma linha por vez:

```sh
npm ci
npm run db:migrate
npm run db:seed
npm run db:verify
npm run start:dev
```

Ambiente pronto = verificação com **16/16 tabelas**, Nest iniciado sem erro e [GET /](http://localhost:3000) respondendo **Hello World!**. Cada colega precisa confirmar esses resultados no próprio computador. As contas de demonstração são opcionais e estão explicadas no guia.

**Onde está cada coisa:** `backend/src/database/entities/` descreve as 16 tabelas para o TypeORM; `migrations/` cria suas restrições e relações no PostgreSQL; `seeds/` prepara os dados; `data-source.ts` fornece a mesma conexão ao Nest e aos comandos de banco. O próximo módulo pode usar uma entidade com `TypeOrmModule.forFeature([Obra])` e implementá-la em controller, service e repository. Cada listagem precisará de paginação e dois filtros documentados no Swagger.

Comentários ficam ligados à obra e ao autor: a mesma obra pode aparecer nas duas trilhas sem duplicar a conversa. O banco registra se o comentário contém spoiler e seu estado de moderação. O módulo de comentários inclui rotas para consultar, criar, editar, remover e moderar comentários; na listagem, textos com spoilers ficam ocultos por padrão.

O recorte para começar a API está em [Escopo inicial](docs/escopo-inicial.md).

Para trabalhar em grupo: [guia das 16 tabelas e exemplo de rota](docs/modelo-banco.md), [matriz proposta de 78 endpoints](docs/matriz-endpoints.md) e [guia de publicação futura da API e do banco](docs/publicar-banco.md). A matriz é planejamento: **os 60 endpoints ainda não estão implementados**.

O [modelo lógico em imagem](docs/modelo-logico.png) mostra os campos, chaves e relações do esquema preparado; o [SVG](docs/modelo-logico.svg) permite ampliar sem perder nitidez.

## Requisitos da P1

Entrega até **16/10/2026**. O backend deverá incluir pelo menos 60 endpoints funcionais, Swagger/OpenAPI, autenticação, perfis e permissões, paginação e pelo menos dois filtros por campos da tabela em cada listagem, migrations, seeds e pelo menos 10 regras de negócio do domínio. As regras serão entregues em PDF junto com o link do repositório.

Cada integrante deverá ter commits que comprovem sua participação e gravar um vídeo individual de pelo menos 10 minutos explicando e demonstrando sua parte.

## Bônus planejados

O [plano de implementação dos bônus](docs/plano-bonus.md) mapeia cache, CQRS, filas e logs estruturados com auditoria: endpoints envolvidos, integração entre blocos, ordem de trabalho e critérios de demonstração. As quatro implementações ainda estão planejadas; os requisitos obrigatórios da P1 têm prioridade.

## Equipe

Denzel, Daniel, Matheus, Pedro e Guilherme.
