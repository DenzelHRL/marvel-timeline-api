# Publicação futura da API e do PostgreSQL

**Para começar a desenvolver, use o [guia de ambiente da equipe](ambiente-equipe.md).** A fundação do banco já foi integrada à `main`. O grupo trabalha com PostgreSQL local por integrante; não precisa criar um banco remoto nesta fase.

A hospedagem será preparada na etapa final, quando a API estiver pronta para demonstração. O provedor e o plano devem ser confirmados nessa ocasião, considerando prazo de uso e persistência dos dados.

## O que será publicado

| Componente | Função |
| --- | --- |
| PostgreSQL remoto | Armazena os dados da aplicação publicada. |
| API Nest hospedada | Recebe requisições HTTP e acessa o PostgreSQL remoto. |
| Bancos locais | Continuam servindo ao desenvolvimento e aos testes de cada integrante. |

Publicar um banco não cria endpoints. Na fundação atual, apenas `GET /` está implementado; autenticação, rotas de domínio e Swagger ainda precisam ser entregues.

## Configurar o banco remoto quando chegar a hora

Crie uma instância PostgreSQL 16 no provedor escolhido. Configure `DATABASE_URL` com a URL de conexão fornecida pelo provedor e os parâmetros de TLS exigidos. Use credenciais em variáveis de ambiente, sem adicioná-las ao repositório.

O projeto dá prioridade a `DATABASE_URL` sobre as variáveis `DB_*`. Verifique o destino antes de executar comandos: migrations e seeds atuam no banco indicado pela configuração.

Dentro de `backend`, com as dependências instaladas e a configuração apontando para o destino desejado:

```sh
npm run db:migrate
npm run db:seed
npm run db:verify
```

Mantenha `SEED_DEMO_USERS=false` no banco publicado. O seed inicial é repetível, mas não substitui backup dos dados criados pela aplicação.

## Publicar a API

Configuração prevista para um serviço Node:

| Campo | Valor |
| --- | --- |
| Diretório do projeto | `backend` |
| Versão do Node | Linha 24, a partir de 24.15 |
| Build | `npm ci && npm run build` |
| Inicialização | `npm run start:prod` |
| Ambiente | `NODE_ENV=production` |
| Banco | `DATABASE_URL` configurada no serviço |
| Porta HTTP | O `main.ts` lê `PORT`; o provedor pode fornecê-la. |

As migrations não rodam automaticamente ao iniciar o Nest: `migrationsRun` e `synchronize` estão desligados. Prepare uma etapa de migrations com as dependências de desenvolvimento necessárias ao comando atual (ele usa `ts-node`), antes de iniciar a nova versão da API. O comando de produção pressupõe que o build já foi gerado.

Depois de implementar autenticação, configure também os segredos JWT e de OAuth conforme o código entregue pelo grupo. Confirme as rotas HTTP e o Swagger nos caminhos realmente configurados.

Para voltar a trabalhar localmente, remova a `DATABASE_URL` ativa do ambiente de desenvolvimento e use o `.env` do banco local. Reinicie o Nest após mudar a configuração.

## Critérios para publicar

- Endpoints e regras de negócio implementados e testados.
- Autenticação, perfis, permissões e Swagger verificados na API.
- Migrations e seed validados no banco de destino.
- Plano de hospedagem compatível com o prazo do trabalho e a continuidade desejada.
- Backup adequado para preservar dados que não podem ser reconstruídos pelo seed.
