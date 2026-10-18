# Implementar logs e auditoria

[Índice](../plano-bonus.md) · [Contrato compartilhado](00-base-e-integracao.md)

**Primeira ação:** ler o exemplo do professor e criar um serviço Winston que escreva um objeto JSON no console. Esta é a parte com menor dependência dos demais bônus. Não precisa de Redis ou outro banco.

## 1. Escopo e referência existente

Há três necessidades: acesso HTTP, erros e ações administrativas. O Nest já imprime inicialização e rotas, mas isso não identifica quem publicou uma trilha ou qual requisição falhou.

Consultar [Logs_e_Auditoria do professor](https://github.com/profdiegocbcastro/programacao-web/tree/main/Backend/Logs_e_Auditoria), especialmente `src/logger.js` e o README. O exemplo é Express/CommonJS; aproveitar conceitos e campos, adaptando a injeção de dependência do Nest. Não substituir `main.ts` por um `app.js` Express.

## 2. Arquivos a criar

Todos os caminhos abaixo ficam em `backend/`:

| Arquivo novo | Responsabilidade |
| --- | --- |
| `src/logs/logs.module.ts` | Registrar/exportar o logger e aplicar middleware |
| `src/logs/logger.service.ts` | Encapsular Winston, níveis, formato e transports |
| `src/logs/request-context.middleware.ts` | Gerar identificador e medir término da resposta |
| `src/logs/auditoria.decorator.ts` | Metadata com ação e tipo de recurso |
| `src/logs/auditoria.interceptor.ts` | Registrar ações decoradas e seus resultados |
| `src/logs/logs.spec.ts` | Testar campos permitidos, resultados e falhas do logger |

Instalar somente a versão compatível de `winston`, com `--save-exact`, e atualizar lockfile. Um provider próprio é suficiente; não é obrigatório instalar `nest-winston`. Se optar pelo wrapper, validar seus peers antes de adotá-lo.

## 3. Construir o logger primeiro

1. Criar `LoggerService` com `createLogger`, `format.timestamp()`, `format.json()` e `transports.Console`.
2. Expor métodos `acesso`, `erro` e `auditoria` com tipos próprios. Receber objetos explícitos, nunca a requisição inteira.
3. Acrescentar arquivos locais com limite de tamanho/quantidade (`maxsize` e `maxFiles`), por exemplo até cinco arquivos de 5 MB. Excluir `logs/` e `*.log` do Git. Console continua disponível para ambiente hospedado.
4. Tratar o evento de erro do transport sem entrar em recursão no próprio logger. Uma falha de observabilidade não deve transformar uma escrita já confirmada em HTTP 500.
5. Definir e documentar retenção e acesso. Log de auditoria em arquivo é o escopo inicial, não um registro imutável com garantia transacional. Não anunciar essa garantia.

Formato de evento proposto, com valores ilustrativos:

```json
{
  "tipo": "auditoria",
  "requestId": "UUID-gerado-pelo-servidor",
  "usuarioId": "UUID-validado-pelo-JWT",
  "acao": "trilhas.alterar_status",
  "recursoTipo": "trilha",
  "recursoId": "UUID-da-trilha",
  "resultado": "concluido",
  "statusHttp": 200
}
```

Winston acrescenta timestamp e nível. IDs do exemplo não são dados para testar uma rota real.

## 4. Medir requisições, inclusive as bloqueadas

1. No middleware, gerar `randomUUID()` e colocar em `request.requestId`; devolver em `X-Request-Id`. Usar um tipo Express estendido ou declaration merging para tipar o campo.
2. Medir com relógio monotônico (`performance.now()`), registrar no evento `response.finish` método, rota, status, duração e identificador. Registrar desconexão por `close` somente se não terminou; evitar evento duplicado.
3. Ler `request.user?.id` no término. O tipo real é `AuthenticatedUser`, de `src/auth/auth.types.ts`, e usa `id`, não `usuarioId` ou `sub` no objeto da requisição.
4. Usar template de rota quando disponível; evitar `originalUrl` completa e query string, principalmente no callback OAuth. Não registrar cabeçalhos, corpo ou e-mail.
5. Registrar o middleware pelo `LogsModule` e importar esse módulo em `src/app.module.ts`. Preservar sessão OAuth, Passport, pipes e Swagger em `src/main.ts`.

O middleware roda antes dos guards; o interceptor roda depois. Por isso um interceptor sozinho não cobre todas as respostas 401/403. Uma tentativa sem identidade validada deve ficar com `usuarioId: null`, sem confiar em um ID enviado pelo cliente.

## 5. Auditar operações administrativas

Criar um decorator como `@Auditar({ acao: 'trilhas.reordenar', recurso: 'trilha', idParam: 'id' })`. É um novo decorator de metadata; ele **não** substitui `@Authorize`, nem concede acesso.

Aplicar inicialmente em publicação de trilhas, reordenação, mudanças de acesso e moderação, nos controllers reais. O interceptor usa `Reflector` para ler metadata e `ExecutionContext` para obter request/response.

- `concluido`: somente quando o handler resolveu e a transação do service já foi confirmada. Para criação, extrair o ID do objeto retornado; para remoção, usar o parâmetro validado.
- `rejeitado`: regra/validação rejeitada; preservar status e exceção originais.
- `falhou`: erro inesperado; registrar nome/classe e identificador. Não copiar `error.message` ou SQL bruto se puder conter entrada ou credenciais.

Não usar callback assíncrono em `tap` presumindo que o RxJS aguardará. Se houver persistência assíncrona, usar um operador que componha a Promise e preservar o retorno; capturar falhas do logger separadamente. Não usar `subscribe()` manual para responder HTTP.

Guards podem bloquear antes de chegar à auditoria decorada: o acesso HTTP registra essas rejeições. Se for necessário o nome da ação administrativa nesse evento, implementar um mapeamento explícito e testado; não afirmar que metadata do interceptor cobriu um guard que não executou.

## 6. Validar antes da PR

| Teste | Resultado esperado |
| --- | --- |
| GET público bem-sucedido | Um acesso com duração, status e requestId |
| Escrita ADMIN válida | Auditoria com ID autenticado e resultado concluído |
| Sem token / LEITOR sem permissão | HTTP 401/403 e acesso registrado; nenhuma auditoria de sucesso |
| Service rejeita regra ou falha | Status original preservado; nenhum falso sucesso |
| Requisição contendo senha/token/OAuth code | Nenhum desses valores aparece nos logs |
| Transport falha / resposta fecha cedo | Sem recursão, sem duplicar acesso, sem alterar resultado já confirmado |

Rodar os scripts existentes de build, lint e testes. Acrescentar testes de middleware com um fluxo HTTP real: mocks de interceptor não provam a cobertura dos guards.

## Fontes oficiais e aplicação

- [Winston](https://github.com/winstonjs/winston): criação do logger, formatos e transports.
- [Nest: middleware](https://docs.nestjs.com/middleware): registro de acesso no ciclo HTTP.
- [Nest: execution context](https://docs.nestjs.com/fundamentals/execution-context): request e metadata usados na auditoria.
- [Nest: interceptors](https://docs.nestjs.com/interceptors): execução antes/depois do handler.
- [Nest: ciclo da requisição](https://docs.nestjs.com/faq/request-lifecycle): posição de guards, interceptors e tratamento de falhas.

Também foram consultados os arquivos-fonte oficiais de [interceptors](https://github.com/nestjs/docs.nestjs.com/blob/master/content/interceptors.md) e [ciclo HTTP](https://github.com/nestjs/docs.nestjs.com/blob/master/content/faq/request-lifecycle.md). Nomes de eventos, campos e retenção são decisões deste projeto.
