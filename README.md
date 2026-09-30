# Marvel Timeline API

API para explorar uma seleção de filmes e séries da Marvel por meio de uma linha do tempo. A proposta é relacionar obras, personagens e acontecimentos importantes, com informações que possam ser consultadas sem spoilers e detalhes revelados separadamente.

Este repositório contém o **backend do Trabalho P1** de Programação Web. A interface visual será uma etapa posterior.

## Situação atual

- Banco PostgreSQL modelado em 16 tabelas com TypeORM e duas migrations versionadas, incluindo comentários por obra.
- Seed repetível: duas trilhas (curta como principal), 34 obras, quatro temporadas, 25 permissões e dois perfis (`LEITOR`, `ADMIN`). Personagens e acontecimentos foram preparados apenas para quatro obras, o suficiente para demonstrar o fluxo de spoilers. Com contas fictícias habilitadas, há dois comentários de exemplo.
- A API ainda contém somente a rota de teste do Nest. Autenticação, endpoints do domínio, Swagger e as regras de negócio da P1 **ainda não foram implementados**.

## Como executar

Requisitos: Node.js 24.15+, npm e PostgreSQL 13+ (ou Docker Desktop).

```bash
cd backend
npm ci
```

No Windows (Prompt de Comando), prepare o banco local:

```bat
copy .env.example .env
docker compose up -d
npm run db:migrate
npm run db:seed
npm run start:dev
```

Se não usar Docker, crie no seu PostgreSQL um usuário e um banco de dados, depois ajuste `backend/.env` com seus dados e execute os mesmos comandos `db:migrate` e `db:seed`. A rota inicial responde em `http://localhost:3000` somente após a conexão com o banco. `synchronize` permanece desligado: mudanças de estrutura devem entrar em novas migrations.

Para incluir **contas fictícias** de ADMIN e LEITOR, altere `SEED_DEMO_USERS=true` no `.env` e defina `DEMO_ADMIN_PASSWORD` e `DEMO_READER_PASSWORD` (mínimo 8 caracteres); execute `npm run db:seed` novamente. O arquivo `.env` não deve ir para o Git. O seed não cria identidades Google, não altera a senha de contas existentes e é bloqueado em produção.

**Onde está cada coisa:** `backend/src/database/entities/` descreve as 16 tabelas para o TypeORM; `migrations/` cria suas restrições e relações no PostgreSQL; `seeds/` prepara os dados; `data-source.ts` fornece a mesma conexão ao Nest e aos comandos de banco. O próximo módulo pode usar uma entidade com `TypeOrmModule.forFeature([Obra])` e implementá-la em controller, service e repository. Cada listagem precisará de paginação e dois filtros documentados no Swagger.

Comentários ficam ligados à obra e ao autor: a mesma obra pode aparecer nas duas trilhas sem duplicar a conversa. O banco já registra se o comentário contém spoiler e seu estado de moderação. As rotas e a regra que impede spoilers de aparecerem por padrão ainda precisam ser implementadas.

O recorte para começar a API está em [Escopo inicial](docs/escopo-inicial.md).

Para trabalhar em grupo: [guia das 16 tabelas e exemplo de rota](docs/modelo-banco.md), [matriz proposta de 74 endpoints](docs/matriz-endpoints.md) e [passo a passo para banco local/remoto e futuro deploy da API](docs/publicar-banco.md). A matriz é planejamento: **os 60 endpoints ainda não estão implementados**.

## Requisitos da P1

Entrega até **16/10/2026**. O backend deverá incluir pelo menos 60 endpoints funcionais, Swagger/OpenAPI, autenticação, perfis e permissões, paginação e dois filtros por campo em cada listagem, migrations, seeds e pelo menos 10 regras de negócio do domínio. As regras serão entregues em PDF junto com o link do repositório.

Cada integrante deverá ter commits que comprovem sua participação e gravar um vídeo individual de pelo menos 10 minutos explicando e demonstrando sua parte.

## Equipe

Denzel, Daniel, Matheus, Pedro e Guilherme.
