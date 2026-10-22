# Marvel Timeline API

API NestJS para explorar obras, personagens, acontecimentos e trilhas da linha do tempo Marvel, com autenticação, autorização, controle de spoilers e documentação Swagger.

Este repositório contém o backend do Trabalho P1 de Programação Web. A entrega das regras de negócio em PDF e os vídeos individuais são feitas conforme as instruções da atividade.

## Estado da main

A API tem rotas de autenticação, administração de usuários, catálogo, comentários, progresso, trilhas e exploração. O Swagger está em `http://localhost:3000/api`. Os módulos de logs/auditoria, cache Redis e CQRS do mapa já estão integrados. A integração automática da outbox com BullMQ está em desenvolvimento na [PR #27](https://github.com/DenzelHRL/marvel-timeline-api/pull/27).

As escritas de trilhas usam o banco PostgreSQL principal. A consulta do mapa pode usar a projeção em um segundo banco quando `CQRS_MAPA_ENABLED=true` e a versão está atual; caso contrário, consulta o banco principal. Até integrar a fila, execute a reconstrução manual após alterações para atualizar a projeção.

## Preparar o ambiente

Leia o [guia da equipe](docs/ambiente-equipe.md) e configure `backend/.env` a partir de `backend/.env.example`. Padrão da equipe: Node.js 24 e PostgreSQL 16. Cada integrante usa seu próprio banco local.

Dentro de `backend`:

```sh
npm ci
npm run db:migrate
npm run db:seed
npm run db:verify
npm run build
npm run start:dev
```

Para usar a projeção do CQRS, crie o banco `marvel_timeline_leitura` e siga o [guia do mapa](docs/bonus/03-cqrs-mapa.md): `npm run db:read:verify`, `npm run db:read:migrate` e `npm run db:read:rebuild`. Só então habilite `CQRS_MAPA_ENABLED=true`. Redis e fila requerem suas próprias configurações, descritas nos [guias dos bônus](docs/plano-bonus.md).

A Action [Banco PostgreSQL](.github/workflows/database-ci.yml) executa instalação, build, lint, testes, migrations, seed duas vezes e verificação do esquema. Ela não comprova, sozinha, o comportamento de Redis, banco de leitura ou worker BullMQ em execução.

## Documentação

- [Guia do Swagger e dos testes](docs/guia-swagger.md)
- [Modelo do banco](docs/modelo-banco.md) e [diagrama lógico](docs/modelo-logico.svg)
- [Matriz de endpoints](docs/matriz-endpoints.md) — planejamento original; confira as rotas implementadas no Swagger
- [Regras de ordenação das trilhas](docs/ordem-das-trilhas.md)
- [Guias de logs, cache, CQRS e filas](docs/plano-bonus.md)

## Equipe

Denzel, Daniel, Matheus, Pedro e Guilherme.
