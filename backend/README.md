# Backend — Marvel Timeline API

O guia de instalação e o estado do trabalho estão no [README principal](../README.md).

## Banco de dados

- `src/database/entities/`: mapeamento das 16 tabelas para o TypeORM.
- `src/database/migrations/`: criação versionada das tabelas, chaves e restrições PostgreSQL.
- `src/database/seeds/`: catálogo, duas trilhas, dados de demonstração, perfis e permissões.
- `src/database/data-source.ts`: configuração usada pelo Nest e pelos comandos de banco.

Rode estes comandos **nesta pasta** depois de configurar o PostgreSQL e copiar `.env.example` para `.env`:

```bash
npm ci
npm run db:migrate
npm run db:seed
npm run db:verify
npm run start:dev
```

O seed de contas fictícias é optativo: defina `SEED_DEMO_USERS=true`, `DEMO_ADMIN_PASSWORD` e `DEMO_READER_PASSWORD` no `.env`. Nenhuma senha vai para o repositório. As migrations usam `synchronize: false`.

A rota inicial do Nest ainda serve apenas para verificar que a aplicação inicia. Endpoints do domínio, autenticação, documentação Swagger e testes de API serão implementados nas próximas etapas.

Os comentários estão preparados no banco, com autor, obra, indicador de spoiler e estado de moderação. A trilha curta será o caminho principal; a trilha longa permanece disponível no mesmo catálogo.

Quem for implementar um módulo deve ler o [guia das entidades](../docs/modelo-banco.md), a [matriz de rotas](../docs/matriz-endpoints.md) e o [guia de publicação](../docs/publicar-banco.md).
