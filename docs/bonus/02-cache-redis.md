# Implementar cache Redis nas consultas públicas

[Índice](../plano-bonus.md) · [Contrato compartilhado](00-base-e-integracao.md)

**Primeira ação:** escrever testes para a chave de `GET /trilhas` variando nome, slug, página e limite. Não começar pelo cache global de todos os GETs.

## 1. Escopo incremental

1. Primeiro: `GET /trilhas`, implementado por `TrilhasService.listarPublicadas`.
2. Depois: `GET /trilhas/:slug/etapas`, com prioridade e obraId.
3. Por último: `GET /explorar/trilhas/:slug/mapa`, depois de integrar a leitura CQRS.

Os endpoints de perfil, administração, comentários e progresso não entram neste cache compartilhado. Não armazenar respostas autenticadas indiscriminadamente. O mapa continua usando `MapaTrilhaRespostaDto` e não inclui `resumoComSpoiler`.

A aula sugere consultar o cache antes do handler e guardar a resposta depois, usando interceptor. Vamos usar um interceptor específico, com revisão dos dados e fallback; a implementação não exige `@CacheKey` fixo ou `CacheInterceptor` global.

## 2. Arquivos e dependências

| Arquivo novo em `backend/` | Responsabilidade |
| --- | --- |
| `src/cache-redis/cache-redis.module.ts` | Cliente próprio e providers |
| `src/cache-redis/cache-redis.service.ts` | Ler/escrever JSON com prazo e tolerância a falhas |
| `src/cache-redis/cache-publico.interceptor.ts` | Chave, hit/miss e composição do handler |
| `src/cache-redis/chave-cache.ts` | Normalização e hash dos parâmetros |
| `src/cache-redis/cache-redis.spec.ts` | Chaves, falhas, invalidação e concorrência |

Instalar uma versão compatível de `redis` (`node-redis`), com `--save-exact`. Este guia escolhe um cliente explícito para controlar o comportamento; não instalar simultaneamente várias bibliotecas de cache sem necessidade. Se a equipe trocar por `@nestjs/cache-manager`, revisar conjuntamente TTL, stores, tipos e tratamento de falha, em vez de misturar exemplos de versões diferentes.

## 3. Fazer o cliente funcionar isoladamente

1. Criar cliente com host/porta da configuração compartilhada. Registrar listener `error` antes de conectar.
2. Implementar conexão e reconexão limitadas, fila offline desabilitada e orçamento de tempo para cada acesso. No cliente escolhido, conferir opções e API de cancelamento da versão instalada. Só `try/catch` não resolve uma Promise pendente indefinidamente.
3. Tratar conexão indisponível, timeout e JSON inválido como cache miss. Escrita de cache falha apenas gera log seguro.
4. Usar `SET` com expiração em segundos; por exemplo `client.set(chave, JSON.stringify(valor), { EX: ttlSegundos })`. Validar TTL inteiro positivo. Não misturar segundos desse comando com milissegundos de outras bibliotecas.
5. Fechar conexões no shutdown; não bloquear a inicialização HTTP indefinidamente se Redis não estiver disponível.

`client.isReady` ajuda a evitar comandos durante reconexão, mas não garante que o comando seguinte terá sucesso. O teste com Redis parado precisa comprovar tempo de resposta limitado.

## 4. Construir uma chave que represente a consulta

Usar formato `mt:cache:v1:catalogo:<revisao>:<recurso>:<hash>`. O hash SHA-256 recebe um objeto de campos permitidos em ordem fixa. Não usar token, URL bruta, corpo ou parâmetros desconhecidos.

| Recurso | Campos do objeto canônico |
| --- | --- |
| `trilhas` | nome, slug, pagina, limite |
| `etapas` | slug da trilha, prioridade, obraId, pagina, limite |
| `mapa` | mesmos filtros de etapas e marcador fixo de resposta sem spoilers |

Normalizar somente o que a API já normaliza. Não colocar nome em minúsculas ou remover acentos se isso mudar a semântica atual. Se a revisão ou o formato do DTO mudar, a chave deve mudar.

**Cuidado com pipes:** interceptors entram antes dos pipes do handler. Não ler `request.query` presumindo que já virou `ListarTrilhasDto`. Extrair validação/normalização compartilhada com `plainToInstance` + `validateOrReject`, usando as mesmas opções da API, antes de qualquer hit. Se a entrada for inválida, não consultar cache e deixar o fluxo normal produzir o 400. O handler ainda recebe os pipes atuais.

Assim `pagina=abc` não consegue reutilizar indevidamente a resposta da página 1. Testar parâmetros ausentes, valores padrão e entradas inválidas com cache quente.

## 5. Fluxo do interceptor

Implementar o fluxo abaixo; é pseudocódigo, não arquivo pronto:

```text
se desabilitado ou entrada inválida: executar handler normal
ler revisão A no PostgreSQL principal
montar chave com A e filtros normalizados
tentar ler cache
se encontrou:
    ler revisão B no principal
    se A == B: devolver resposta válida
executar handler existente
se resposta foi sucesso:
    ler revisão C
    se C == A: guardar resposta sob a chave de A com TTL
devolver resposta original
```

Se a revisão mudar, não salvar a resposta antiga sob uma chave nova. Uma requisição que começou antes de um commit pode observar um snapshot anterior; a estratégia não promete linearização absoluta com escritas simultâneas. Ela impede reutilizar a chave antiga em requisições iniciadas depois da revisão atualizada. Testar uma consulta lenta concorrendo com uma alteração.

No Nest/RxJS, compor a leitura assíncrona e `next.handle()` com operadores como `defer`, `switchMap` e `concatMap`; não criar assinatura manual, não converter a resposta em outro formato e não engolir exceções do domínio. Só falhas do cliente de cache são toleradas silenciosamente.

## 6. Invalidação após alterações

Usar `CatalogoRevisaoService`, definido na base. Toda alteração relevante incrementa a revisão na **mesma transação** da escrita. A consulta posterior passa a usar outra chave; as antigas expiram pelo TTL. Não precisa varrer Redis nem apagar fila.

Integrar todos os pontos listados na base, incluindo dados/status de obras e seeds/manutenção. Se faltar um desses hooks, o bônus ainda está incompleto. Na primeira entrega de listagem, integrar ao menos todas as escritas de metadados/status/criação de trilhas antes de habilitar `CACHE_ENABLED`.

Antes de habilitar etapas/mapa, integrar também alterações de obras e etapas. A revisão é lida no PostgreSQL justamente para não depender de uma invalidação Redis que pode falhar após um commit.

## 7. Testes que comprovam a entrega

| Cenário | Verificação |
| --- | --- |
| Mesma consulta duas vezes | Primeiro miss, depois hit; montagem/listagem do domínio executa uma vez |
| Outra página/filtro | Chave diferente; não mistura resultados |
| Entrada inválida com cache quente | Mantém 400; não transforma entrada inválida em sucesso |
| Alteração confirmada | Próxima requisição usa nova revisão e dados atuais |
| Alteração revertida | Revisão não avança nem cria invalidação falsa |
| Redis parado ou conexão degradada | PostgreSQL responde dentro do limite configurado |
| Obra arquivada / trilha em rascunho | Não reaparece em cache antigo; status HTTP mantém o contrato |
| Resposta antiga termina depois da escrita | Não contamina a chave da revisão nova |
| Cache expira / JSON inválido | Miss e recuperação sem erro HTTP |

Uma pequena consulta de revisão ao principal ainda ocorre em hits; o ganho é evitar a consulta e montagem mais caras. Medir essas duas coisas separadamente, sem alegar que cache elimina todo acesso ao banco.

## Fontes oficiais

- [Redis: node-redis](https://redis.io/docs/latest/develop/clients/nodejs/): instalação, cliente e comandos.
- [Redis: conexão](https://redis.io/docs/latest/develop/clients/nodejs/connect/): estado e ciclo de conexão.
- [Configuração do node-redis](https://github.com/redis/node-redis/blob/master/docs/client-configuration.md): opções da versão utilizada.
- [Nest: cache](https://docs.nestjs.com/techniques/caching): abordagem de cache e interceptor; não copiar configuração de store sem conferir versão.
- [Nest: execution context](https://docs.nestjs.com/fundamentals/execution-context): parâmetros do interceptor.

A revisão global e o objeto canônico de chave são a adaptação deste projeto para preservar publicação, filtros e paginação.
