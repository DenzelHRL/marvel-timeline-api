<<<<<<< HEAD
# Publicar o PostgreSQL e preparar a API para deploy

**Estado agora:** o código do banco está no PR de fundação, não existe uma instância remota criada por este repositório. As instruções abaixo são para Denzel realizar no provedor que escolher. O banco publicado não gera endpoints públicos: a API Nest deve ser publicada separadamente.

## Três ambientes diferentes

| Ambiente | O que a equipe usa | O que está disponível na internet |
| --- | --- | --- |
| PostgreSQL local de cada integrante | Migrations e seed do mesmo repositório, com `backend/.env` individual | Nada; desenvolvimento sem disputar alterações no banco comum. |
| PostgreSQL compartilhado de demonstração | Uma instância gerenciada com o mesmo esquema e seed; conectar com credenciais protegidas | Banco acessível só com URL/usuário/senha; não é o endereço da API. |
| API Nest hospedada | Código em execução conectado ao banco compartilhado | Endereço HTTP com `/obras`, Swagger etc., **quando as rotas forem implementadas**. Hoje só existe o `GET /` inicial do Nest. |

## 1. Testar localmente antes do banco remoto

No Prompt de Comando do Windows, dentro do clone do repositório e da pasta `backend`:

```bat
copy .env.example .env
npm ci
docker compose up -d
=======
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
>>>>>>> main
npm run db:migrate
npm run db:seed
npm run db:verify
```

<<<<<<< HEAD
`db:verify` confere 16 tabelas, nenhuma migration pendente, o mínimo de dados das duas trilhas e as permissões de moderação. `npm run db:show` permite ver se falta alguma migration. Rodar `db:seed` de novo não deve duplicar os dados iniciais. Se a porta 5432 já está ocupada, altere **a mesma** `DB_PORT` no `.env` e no acesso local. A criação de contas fictícias é opcional e está explicada no README; não habilite em produção.

## 2. Criar uma instância remota para a demonstração

Uma opção simples para o prazo é [Render Postgres](https://render.com/docs/postgresql-creating-connecting): no painel, `New` → `Postgres`, escolher um nome como `marvel-timeline-p1`, PostgreSQL 16 e a mesma região do futuro serviço Web. Ao criar, o painel fornece **External Database URL** (para seu PC) e **Internal Database URL** (para uma API hospedada no mesmo provedor/região). O plano Free do Render expira após 30 dias, tem 1 GB e não traz backups gerenciados; confira essas limitações antes de depender dele depois da entrega: [regras atuais do Free](https://render.com/docs/free).

No seu PC, edite **somente** `backend/.env` (arquivo ignorado pelo Git): acrescente `DATABASE_URL=` seguida da **External Database URL**. Se o provedor exigir TLS, use os parâmetros indicados por ele; no Render, `?sslmode=require` exige TLS na conexão externa. O código prioriza `DATABASE_URL` em relação às variáveis `DB_*`. Não cole a URL real em arquivo versionado, issue, mensagem nem captura de tela pública.

Com o `.env` apontando para o banco remoto, no diretório `backend`:

```bat
npm run db:migrate
npm run db:seed
npm run db:verify
```

Esses comandos **alteram o banco indicado por `DATABASE_URL`**. Confira o destino antes de rodar. O seed inicial não liga `SEED_DEMO_USERS` por padrão; mantenha `false` no banco compartilhado. Uma verificação de sucesso imprime `Tabelas do domínio: 16/16`, `Obras: 34` ou mais, `Etapas: 55` ou mais, e `Banco pronto para desenvolver rotas`.

Para voltar ao banco Docker local, remova `DATABASE_URL` do `.env` e rode `npm run db:verify`; ele volta a utilizar as variáveis `DB_*`. Cada integrante pode usar sua própria instância local e popular os mesmos dados, a partir do mesmo repositório.

## 3. Quando publicar a API

Com as rotas e o Swagger implementados, crie um serviço Web Node no mesmo provedor e região, vinculado ao repositório. Se o painel tiver campo **Root Directory**, use `backend`; **Build Command:** `npm ci && npm run build`; **Start Command:** `npm run start:prod`. Configure `NODE_ENV=production` e `DATABASE_URL` como variável secreta com a **Internal Database URL**. O `main.ts` já usa `PORT` quando o provedor fornece essa variável. Credenciais de Google e segredo JWT serão outras variáveis de ambiente **após** esses recursos serem implementados. Não definir senha de demo em produção.

As migrations **não rodam automaticamente ao iniciar a API** (`migrationsRun: false`). Aplique migrations no banco correto antes de cada deploy que mudar o esquema; não ative `synchronize`. Verifique o endereço HTTP da API e seu `/api` ou outra rota Swagger **apenas quando configurados**. Atualmente o deploy da aplicação só mostraria a resposta inicial do Nest, portanto não serviria como demonstração dos 60 endpoints.

Se usar serviço Web gratuito do Render, ele pode entrar em repouso após 15 minutos sem tráfego e levar cerca de um minuto para voltar. Para uma apresentação, abra a API antes de demonstrá-la; veja [a documentação de limites](https://render.com/docs/free). Acompanhe expiração do banco e mantenha cópia dos dados se forem importantes após a P1.

## 4. Evidência para a equipe

- PR/commit das migrations e seeds; resultado verde da Action **Banco PostgreSQL**, que usa uma instância PostgreSQL 16 temporária e roda migration, seed duas vezes e `db:verify` sem segredo externo.
- Print do painel do banco com estado `Available`, **ocultando URL, host privado e senha**; saída de `npm run db:verify` sem credenciais.
- Link da API HTTP e do Swagger quando publicados, separadamente do banco.
- [Modelo das 16 tabelas](modelo-banco.md) e [matriz de endpoints](matriz-endpoints.md) para quem for escrever rotas.
=======
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
>>>>>>> main
