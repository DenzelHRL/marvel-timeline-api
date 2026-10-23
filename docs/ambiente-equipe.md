# Comece aqui — ambiente de desenvolvimento da equipe

**Objetivo:** cada integrante conseguir iniciar o Nest conectado ao seu PostgreSQL, com as tabelas e os dados iniciais do projeto.

## Como vamos trabalhar

Cada pessoa terá **um banco local independente**. Compartilhamos pelo GitHub o código, as migrations (estrutura) e os seeds (dados iniciais). Não é necessário criar uma conta no Render para começar.

| Item | Como funciona |
| --- | --- |
| Código e alterações de esquema | Compartilhados pelo GitHub; cada integrante trabalha em sua branch. |
| Banco e dados de teste | Ficam no computador de cada integrante. Uma alteração local não aparece no banco dos colegas. |
| Dados iniciais | Todos executam as mesmas migrations e seeds da mesma versão do repositório. |
| Conexão | Cada pessoa configura seu próprio `backend/.env`. Usuário, senha e porta podem variar. |
| Hospedagem | Fica para a etapa final de publicação da API. |

**O Compose inclui PostgreSQL e Redis; o Nest roda no terminal do computador.** O PostgreSQL instalado diretamente no Windows também funciona com o mesmo código.

## 1. Preparar o código

Instale Git, **Node.js 24 (24.15 ou superior dentro da linha 24)** e npm. Essa é a linha usada na validação automática do projeto. Confira:

```sh
git --version
node --version
npm --version
```

Se ainda não tem o projeto:

```sh
git clone https://github.com/DenzelHRL/marvel-timeline-api.git
cd marvel-timeline-api
```

Se já tem o clone, entre na pasta `marvel-timeline-api`. Salve suas alterações em sua branch antes de trocar para a principal; não descarte trabalho para atualizar:

```sh
git status
git switch main
git pull --ff-only origin main
```

Nos dois casos, entre no backend:

```sh
cd backend
```

**Todos os comandos npm e Docker deste guia são executados dentro de `backend`.** No Windows, o terminal deve terminar em `marvel-timeline-api\backend>`.

## 2. Criar a configuração individual

Se `.env` ainda não existe, copie o exemplo **uma única vez**. Não sobrescreva um `.env` já configurado.

| Terminal | Comando |
| --- | --- |
| Windows — Prompt de Comando (cmd) | `copy .env.example .env` |
| Windows — PowerShell | `Copy-Item .env.example .env` |
| Linux/macOS | `cp .env.example .env` |

Edite `backend/.env` no VS Code e salve. Esse arquivo já é ignorado pelo Git; `.env.example` é o modelo compartilhado.

Para desenvolvimento local, deixe a linha `DATABASE_URL` comentada com `#`. Se houver uma `DATABASE_URL` ativa, inclusive nas variáveis do terminal, ela terá prioridade sobre `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME`.

Escolha **uma** das opções de banco abaixo.

## 3A. Banco com Docker

Instale e abra o [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/). No Windows, siga os requisitos oficiais de WSL 2 e virtualização. Aguarde o motor do Docker iniciar. Confira no terminal:

```sh
docker compose version
docker info
```

Se o Docker não funcionar nesse computador, use a opção **3B**. A criação dos endpoints continua igual.

No `.env`, configure:

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_USER=marvel
DB_PASSWORD=marvel_dev_only
DB_NAME=marvel_timeline
```

A senha acima é apenas o valor de exemplo para desenvolvimento. Pode escolher outra **antes da primeira criação do banco**; o Compose usa o mesmo `.env` que a API.

Se 5432 já estiver ocupada, escolha uma porta livre em `DB_PORT`, por exemplo 5433. O Compose mantém a porta interna 5432 e publica a porta escolhida para o Nest e o pgAdmin.

Inicie o banco e espere a verificação de saúde:

```sh
docker compose up -d --wait
docker compose ps
```

Os serviços `postgres` e `redis` devem ficar em execução e `healthy` quando usar `docker compose up -d --wait`. O Compose já cria o usuário e o banco `marvel_timeline`; as tabelas serão criadas pelas migrations.

O volume preserva os dados entre reinícios. Alterar usuário, senha ou nome do banco no `.env` **depois** da primeira criação não altera automaticamente o banco já existente. Nesse caso, ajuste o usuário no PostgreSQL e mantenha o `.env` correspondente. Não use `docker compose down -v` na rotina: essa opção apaga o volume do banco.

**Continue na etapa 4.**

## 3B. Banco instalado diretamente no Windows

Instale o **PostgreSQL 16** pelo [download oficial para Windows](https://www.postgresql.org/download/windows/), incluindo o servidor e o pgAdmin. Os complementos do Stack Builder não são necessários para este projeto.

1. Anote a senha definida para o usuário `postgres` e a porta escolhida na instalação.
2. Abra o pgAdmin e conecte à instância **PostgreSQL 16**.
3. Clique com o botão direito em **Databases → Create → Database**.
4. Informe `marvel_timeline` em **Database**, mantenha `postgres` em **Owner** e salve.
5. Configure o `.env` com os dados dessa instância:

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD="SUBSTITUA_PELA_SENHA_DA_INSTALACAO"
DB_NAME=marvel_timeline
```

Substitua o texto ilustrativo pela sua senha. Se a senha contiver `#`, mantenha o valor entre aspas para que esse caractere não inicie um comentário.

**Use a porta real da sua instalação.** Uma instalação local pode usar **5433** se 5432 estiver ocupada; isso não obriga outras máquinas a usar a mesma porta. No pgAdmin, a porta pode ser consultada em **Properties → Connection** do servidor.

Nesta opção, o serviço PostgreSQL do Windows precisa estar em execução; não é necessário manter o pgAdmin aberto. Não execute os comandos Docker.

## 4. Instalar dependências, criar tabelas e carregar dados

Com o banco em execução e o `.env` salvo, rode **uma linha por vez**. Se uma falhar, resolva o erro antes da seguinte:

```sh
npm ci
npm run db:migrate
npm run db:seed
npm run db:verify
```

| Comando | O que faz | Resultado inicial esperado |
| --- | --- | --- |
| `npm ci` | Instala as versões do lockfile. | Instalação termina sem erro. |
| `db:migrate` | Aplica migrations ainda pendentes. | A quantidade depende da versão do repositório e do histórico do banco. |
| `db:seed` | Insere os dados iniciais. | 2 perfis, 26 permissões, 34 obras, 2 trilhas e 54 etapas. |
| `db:verify` | Confere tabelas, migrations e dados mínimos. | `Tabelas do domínio: 16/16` e `Banco pronto para desenvolver rotas`. |

A trilha curta tem 20 etapas e a longa, 34. As contagens podem aumentar conforme o projeto evoluir.

O seed é repetível e evita duplicar os registros iniciais. Ele **não é um reset**: usa principalmente `ON CONFLICT DO NOTHING`, preserva registros já existentes e não restaura automaticamente campos alterados nos testes. Os IDs são UUIDs gerados em cada banco; use slugs e consultas para localizar registros, sem copiar IDs fixos do banco de um colega.

## 5. Iniciar e confirmar a API

```sh
npm run start:dev
```

Espere `Found 0 errors` e `Nest application successfully started`. Mantenha esse terminal aberto e visite [http://localhost:3000](http://localhost:3000).

Acesse também **http://localhost:3000/api** para conferir o Swagger. A `main` já inclui rotas de domínio, autenticação JWT, guards e documentação. O login Google depende das credenciais configuradas no ambiente; as tabelas de perfis e permissões, isoladamente, não protegem rotas.

Se `PORT` estiver configurada com outro valor, use essa porta na URL. Para encerrar o Nest, pressione **Ctrl+C**.

### Confirmação de ambiente pronto

Cada integrante deve confirmar ao grupo:

- `db:verify` terminou com sucesso e mostrou 16/16 tabelas.
- O Nest iniciou sem erro.
- `GET /` respondeu `Hello World!`.
- Qual opção usou: Docker ou PostgreSQL instalado.

Basta compartilhar a saída da verificação, sem enviar o `.env` ou suas credenciais. A validação no computador de um integrante não confirma automaticamente o ambiente dos demais.

## 6. Rotina nos próximos dias

Com o código já instalado, ligue o banco: no Docker, abra o Desktop e rode `docker compose up -d --wait`; na instalação direta, confirme que o serviço PostgreSQL está iniciado. Depois rode `npm run start:dev`.

Quando baixar alterações do grupo:

- Se `package-lock.json` mudou, pare o Nest e rode `npm ci`.
- Se chegaram migrations novas, rode `npm run db:migrate`.
- Se chegaram dados iniciais novos, rode `npm run db:seed`.
- Depois de atualizar o banco, rode `npm run db:verify`.

Não precisa reinstalar pacotes nem executar seeds a cada abertura do projeto. Para parar o PostgreSQL do Docker preservando os dados, use `docker compose stop`.

## 7. Começar os endpoints

Antes de iniciar um módulo:

1. Consulte a [matriz proposta de endpoints](matriz-endpoints.md)
2. Consulte o [modelo do banco e entidades](modelo-banco.md) e o [escopo inicial](escopo-inicial.md).
3. Na raiz do clone, com a `main` atualizada e sem alterações pendentes, crie sua branch:

```sh
git switch -c feat/seu-modulo
```

Troque `seu-modulo` pelo nome acordado, por exemplo `obras`. Se a branch já existe, use `git switch nome-da-branch`.

Use as entidades existentes em `backend/src/database/entities/`, mantendo módulo, controller, DTO, service e repository conforme o padrão da disciplina. Registre seu módulo no `AppModule` e use `TypeOrmModule.forFeature([...])` para disponibilizar os repositórios das entidades necessárias. Os módulos de domínio já integrados servem como referência; confira os contratos e imports atuais antes de adicionar outro.

Em cada entrega, inclua a validação de entrada, regras de negócio, paginação e ao menos dois filtros por campos da tabela nas listagens, além da documentação Swagger já configurada. Use os guards e contratos de autenticação/permissão integrados ao projeto.

Mudanças de estrutura entram em **novas migrations** e nas entidades correspondentes. O projeto usa uma lista explícita de migrations em `backend/src/database/data-source.ts`: importe e acrescente a nova classe nessa lista. Não edite uma migration já aplicada por alguém nem ative `synchronize`. Ao adicionar entidades, atualize também o índice `entities/index.ts`. Ajuste seeds, verificação e modelo do banco quando o esquema ou os dados mínimos mudarem.

Faça commits na sua conta, envie a branch e abra um PR para `main`. Informe as rotas entregues e como testá-las. Confirme os checks do PR antes da integração. Mantenha a documentação da rota coerente com o contrato implementado.

## Contas de demonstração (opcional)

O seed padrão cria perfis e permissões, mas não cria usuários de teste. Para desenvolver conta, progresso ou comentários com autores de exemplo, configure no seu `.env`:

```dotenv
SEED_DEMO_USERS=true
DEMO_ADMIN_PASSWORD="ESCOLHA_UMA_SENHA_LOCAL"
DEMO_READER_PASSWORD="ESCOLHA_OUTRA_SENHA_LOCAL"
```

Use senhas de pelo menos 8 caracteres e execute `npm run db:seed` novamente. O seed cria `admin@marvel-timeline.test` e `leitor@marvel-timeline.test`, além de progresso e comentários de exemplo. Essas contas podem usar o login local já implementado. Elas são diferentes do usuário PostgreSQL configurado em `DB_USER`. O seed não troca a senha de contas já existentes; essa opção é bloqueada em produção.

## Se der erro

| Sintoma | O que conferir primeiro |
| --- | --- |
| `docker não é reconhecido` | Instalação do Docker e um terminal novo; ou use a opção 3B. |
| Docker informa `Engine stopped` ou erro de virtualização | Requisitos do Docker Desktop/WSL; o grupo pode usar a opção 3B. |
| Porta 5432 ocupada no Docker | Escolha uma porta livre em `DB_PORT` e execute o Compose novamente. |
| `ECONNREFUSED` | Banco em execução, host e porta do `.env`; no Docker, veja `docker compose ps`. |
| `password authentication failed` | Usuário/senha da instância correta. Em um volume Docker existente, editar o `.env` não troca a senha do servidor. |
| Banco `marvel_timeline` não existe | Crie-o na instância correta (3B), ou confira o banco inicializado pelo Compose (3A). |
| Relação/tabela não existe ou migration pendente | Execute `npm run db:migrate` antes do seed. |
| `db:verify` aponta dados insuficientes | Execute o seed e confira se testes anteriores alteraram os dados; seed não restaura tudo. |
| Mudou `.env`, mas a API usa dados antigos | Salve o arquivo e reinicie o Nest para reler a configuração; confira também `DATABASE_URL` no terminal. |
| `ENOENT ... package.json` | Entre na pasta `backend` antes de rodar npm. |
| Porta 3000 ocupada (`EADDRINUSE`) | Pare a outra execução da API ou configure uma porta livre em `PORT`. |
| Avisos de auditoria/depreciação no `npm ci` | Distinga aviso de erro de instalação. Leve a auditoria ao grupo antes de atualizar dependências; `npm audit fix --force` pode mudar versões incompatíveis. |
| Erro ao carregar pacote nativo, como bcrypt | Compartilhe o erro e as versões de Node/npm; avalie a dependência específica antes de aprovar scripts de instalação. |

## Referências

- [Docker Compose: iniciar e esperar os serviços](https://docs.docker.com/reference/cli/docker/compose/up/)
- [Requisitos do Docker Desktop para Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
- [PostgreSQL para Windows](https://www.postgresql.org/download/windows/)
- [Publicação futura da API e do banco](publicar-banco.md)

