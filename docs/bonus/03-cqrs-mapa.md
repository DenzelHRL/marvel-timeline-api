# Implementar CQRS no mapa de uma trilha

[Índice](../plano-bonus.md) · [Contrato compartilhado](00-base-e-integracao.md)

**Primeira ação:** extrair e testar a consulta atual de `TrilhasService.consultarMapa` sem alterar seu resultado. Ela será a comparação de referência e a alternativa quando a projeção estiver atrasada.

## 1. O que muda e o que permanece

CQRS separa o caminho que executa alterações do caminho que atende consultas. Neste projeto, vamos começar com **um comando de reordenação** e **uma consulta de mapa**, em vez de reescrever todas as rotas. Depois é possível ampliar o mesmo padrão.

Para seguir o exemplo apresentado na aula, o PostgreSQL principal continua como fonte oficial de escrita e um **segundo banco PostgreSQL** armazena a projeção de leitura. Neste ambiente local, o Compose oferece uma segunda instância, mas dois bancos não exigem universalmente dois servidores. Só renomear services para Command/Query sem usar a projeção não entrega esse escopo.

Não mudar `GET /explorar/trilhas/:slug/mapa`, seus filtros ou `MapaTrilhaRespostaDto`. Não consultar a projeção para autenticação, permissão ou progresso pessoal.

## 2. Arquivos a criar e preservar

| Arquivo novo em `backend/` | Responsabilidade |
| --- | --- |
| `src/trilhas/commands/reordenar-etapas.command.ts` | Dados do comando |
| `src/trilhas/commands/reordenar-etapas.handler.ts` | Delegar à regra/transação já existente |
| `src/trilhas/queries/consultar-mapa.query.ts` | Slug e filtros da consulta |
| `src/trilhas/queries/consultar-mapa.handler.ts` | Chamar o serviço de leitura |
| `src/projecao-mapa/projecao-mapa.module.ts` | Conexões/providers de projeção, sem importar trilhas |
| `src/projecao-mapa/projecao-mapa.service.ts` | Reconstruir snapshot e salvar versão |
| `src/projecao-mapa/mapa-leitura.service.ts` | Ler projeção válida ou consulta original |
| `src/database/leitura-data-source.ts` | Configuração da conexão nomeada `leitura` |
| `src/database/leitura-migrations/` | Migrations exclusivas do segundo banco |
| `src/database/run-leitura-migrations.ts` | Executar/verificar/reverter migrations de leitura |
| `src/database/reconstruir-mapas.ts` | Reconstrução inicial e reparo, usando o serviço de projeção |

Instalar versão compatível de `@nestjs/cqrs`, com `--save-exact`. Reutilizar `pg`/TypeORM instalados. Registrar `CqrsModule` conforme a API da versão escolhida e handlers em `providers`; não presumir que instalar o pacote registra os handlers.

Preservar em `TrilhasModule`: Auth/Acesso, controllers e services atuais. `EtapasTrilhaService.reordenar` já valida lista completa, duplicações, vínculo com a trilha, limites e usa transação com duas fases de posições. Não reimplementar essas regras no handler.

## 3. Separar um comando e uma consulta

Fluxos a implementar:

```text
Controller de reordenação → CommandBus → ReordenarEtapasHandler
    → EtapasTrilhaService.reordenar → commit principal

ExplorarController.consultarMapa → QueryBus → ConsultarMapaHandler
    → MapaLeituraService.consultar → projeção ou consulta original
```

1. Comando recebe `trilhaId` e `ReordenarEtapasDto`; handler chama `reordenar` exatamente uma vez e devolve o mesmo array.
2. Controller mantém `@Authorize`, `ParseUUIDPipe`, body e Swagger existentes. CQRS não substitui autorização.
3. Query recebe `slug` e `ListarEtapasDto` já validados; handler devolve a mesma resposta paginada.
4. Extrair a consulta original para um provider independente, por exemplo `ConsultaMapaOriginalService`, no módulo de projeção. `TrilhasService.consultarMapa` pode delegar a ele. Evitar que o fallback chame o QueryBus novamente e entre em recursão.
5. Testar cada handler com dependências simuladas; em seguida testar com PostgreSQL real. Não encadear duas transações independentes para uma única escrita.

## 4. Criar o banco de leitura

Criar `mapas_leitura`, com uma linha por trilha:

| Coluna | Tipo | Finalidade |
| --- | --- | --- |
| `trilha_id` | uuid PK | Identidade da trilha |
| `versao` | bigint | Revisão global usada na montagem |
| `publicada` | boolean | Tombstone lógico para trilha não pública |
| `itens` | jsonb | Array completo ordenado de `ItemMapaDto`, sem campos extras |
| `atualizado_em` | timestamptz | Diagnóstico interno |

Não guardar só uma página; filtrar e paginar a coleção completa. Para o catálogo atual pequeno, uma projeção JSONB reduz a implementação. Se crescer, a modelagem por linhas pode ser revista.

1. Configurar a conexão com nome `leitura`, entidades e migrations próprias, `synchronize: false` e `migrationsRun: false`.
2. Registrar a conexão apenas quando habilitada. Com a integração Nest/TypeORM, declarar o nome no nível da configuração `forRootAsync` e usar esse mesmo nome nos tokens de injeção.
3. O datasource CLI também precisa ser nomeado/configurado, apontando para o banco de leitura. Não reutilizar as migrations de domínio nele.
4. Implementar os scripts novos `db:read:migrate`, `db:read:show` e `db:read:rebuild` no package.json. Copiar o padrão de encerramento em `run-migrations.ts` e fechar conexões no `finally`.
5. Se a conexão nomeada for inicializada pelo Nest no startup, sua indisponibilidade impede esse startup quando habilitada. Documentar isso; iniciar com `CQRS_MAPA_ENABLED=false` permite continuar pelo principal. Fallback em execução não elimina essa dependência de inicialização. Inicialização tardia exige implementação adicional explícita.

Depois de criar os scripts:

```text
npm run db:read:migrate
npm run db:read:show
npm run db:read:rebuild
```

Não editar migrations já aplicadas. Registrar cada nova migration nos arrays explícitos do datasource correspondente. Não habilitar `synchronize` para pular essa etapa.

## 5. Reconstruir sem gravar versões antigas

`ProjecaoMapaService.reconstruir(trilhaId)` executa:

1. Abrir transação **somente de leitura**, isolamento `REPEATABLE READ`, no principal. Ler revisão, status da trilha e suas etapas com obras publicadas usando o mesmo `manager`. Montar o snapshot completo com seleção explícita dos campos de `ItemMapaDto`.
2. Encerrar a leitura do principal. Guardar a revisão capturada junto com o snapshot; não buscar revisão nova depois e atribuí-la a dados antigos.
3. Em uma transação separada no banco de leitura, fazer upsert atômico que aceite só revisão maior que a persistida. Os dois bancos não participam de uma transação distribuída.
4. Se a trilha estiver arquivada/em rascunho, gravar `publicada=false`, itens vazios e revisão atual. Preservar esse tombstone para uma tarefa atrasada não ressuscitar conteúdo antigo.
5. Para remoção física futura, enviar também o ID removido à reconstrução/outbox e manter o mesmo tombstone. A estratégia padrão de percorrer trilhas existentes não encontra um ID que já foi apagado.

Esboço SQL do controle de versão, com parâmetros preparados:

```sql
INSERT INTO mapas_leitura (trilha_id, versao, publicada, itens, atualizado_em)
VALUES ($1, $2::bigint, $3, $4::jsonb, now())
ON CONFLICT (trilha_id) DO UPDATE
SET versao = EXCLUDED.versao,
    publicada = EXCLUDED.publicada,
    itens = EXCLUDED.itens,
    atualizado_em = EXCLUDED.atualizado_em
WHERE mapas_leitura.versao < EXCLUDED.versao;
```

O job carrega uma revisão para rastreabilidade; o reconstrutor lê a situação atual. Se um job antigo rodar depois de um novo, não deve reproduzir os dados antigos do payload. Repetir a reconstrução da mesma revisão é inofensivo. Revisões e conteúdo só mudam juntos no principal.

## 6. Consultar com segurança enquanto a fila está atrasada

1. Validar existência/publicação da trilha e ler a revisão atual no principal, em um snapshot coerente. A projeção não autoriza expor algo arquivado.
2. Buscar `mapas_leitura` e aceitar somente `publicada=true` e revisão igual ao snapshot atual. Revisão menor ou maior não deve ser tratada como igual.
3. Se estiver ausente, atrasada, banco de leitura falhar ou flag estiver desligada, executar a consulta original no principal. Nunca responder uma projeção velha apenas porque a fila ainda não rodou.
4. Na projeção válida, aplicar prioridade/obraId antes de contar e paginar; ordenar por posição e ID, preservando a ordem do service atual. Recalcular `total`/`totalPaginas` com os filtros aplicados.
5. Não devolver versão, timestamp ou campos internos dentro do DTO público. Se outro bônus precisar da revisão, passá-la internamente.

O fallback pode reutilizar o mesmo manager/snapshot da checagem; se for abrir uma consulta nova, repetir as checagens de publicação. Uma alteração concorrente após a leitura é tratada como uma leitura de snapshot, não como promessa de consistência instantânea entre dois bancos.

## 7. Entrega inicial sem depender da fila pronta

O script `db:read:rebuild` permite criar/testar a projeção inicialmente. Enquanto não existir atualização automática, manter a flag desligada por padrão; o leitor sempre tem a consulta original como alternativa.

A fila será conectada **somente** ao método público `reconstruir(trilhaId)`. Não colocar código BullMQ neste serviço nem obrigar o worker a conhecer controller, JWT ou filtros HTTP. Isso permite desenvolver CQRS e fila em paralelo.

## 8. Validação

| Cenário | Resultado |
| --- | --- |
| Projeção criada em segundo banco | Mesmos dados, filtros e paginação da consulta original |
| Reordenação pelo CommandBus | Mesmas regras, resposta e rollback existentes |
| Alteração principal, worker parado | GET usa principal; não retorna mapa antigo |
| Dois snapshots gravados fora de ordem | Upsert mantém a versão mais nova |
| Trilhas/obras não publicadas | Conteúdo oculto, mesmo com projeção antiga |
| Leitura indisponível após startup | Fallback mantém resposta pelo principal |
| Reconstrução repetida | Não duplica mapas ou etapas |
| Entrada inválida / ausência de autorização | Mantém 400/401/403 das rotas atuais |

Build, lint e testes passam; migration funciona em banco vazio e na segunda execução. Comparar respostas reais da rota, não só a existência das tabelas.

## Fontes oficiais

- [Nest CQRS](https://docs.nestjs.com/recipes/cqrs): buses, comandos, consultas e handlers.
- [Nest: banco de dados](https://docs.nestjs.com/techniques/database): configuração/injeção de conexões.
- [TypeORM: múltiplos datasources](https://typeorm.io/docs/data-source/multiple-data-sources/): isolamento das conexões.
- [PostgreSQL 16: isolamento](https://www.postgresql.org/docs/16/transaction-iso.html): snapshot coerente.
- [PostgreSQL 16: INSERT/ON CONFLICT](https://www.postgresql.org/docs/16/sql-insert.html): upsert com condição atômica.

Dois bancos, projeção JSONB, escopo inicial de um comando e fallback são escolhas deste projeto, alinhadas ao material da aula e ao código existente.
