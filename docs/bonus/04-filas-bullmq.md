# Implementar filas com BullMQ

[Índice](../plano-bonus.md) · [Contrato compartilhado](00-base-e-integracao.md) · [Serviço de projeção](03-cqrs-mapa.md)

**Primeira ação:** criar um teste do worker com `ProjecaoMapaService` simulado. O worker recebe `trilhaId` e chama `reconstruir(trilhaId)`; não precisa esperar a implementação completa de CQRS para escrever esse teste.

## 1. O trabalho concreto da fila

Depois de mudar uma obra, trilha ou etapa, reconstruir a projeção pública do mapa em segundo plano. A escrita obrigatória continua no PostgreSQL principal. A API não deve reconstruir todos os mapas nem esperar Redis dentro da transação HTTP.

Este guia usa `@nestjs/bullmq` + `bullmq`, não exemplos de `@nestjs/bull` misturados. A biblioteca não cria automaticamente os hooks de domínio, outbox ou método de reconstrução.

## 2. Arquivos e configuração

| Arquivo novo em `backend/` | Responsabilidade |
| --- | --- |
| `src/filas/filas.module.ts` | Conexão e registro da fila |
| `src/filas/mapa.produtor.ts` | Adicionar tarefa com opções e ID determinístico |
| `src/filas/mapa.worker.ts` | Processar um tipo de job e chamar projeção |
| `src/filas/outbox-relay.service.ts` | Encaminhar pendências do PostgreSQL ao Redis |
| `src/filas/filas.spec.ts` | Testes de payload, repetição e falhas |

Reutilizar `src/bonus/contratos.ts`, revisão/outbox e migrations da [base](00-base-e-integracao.md). Não criar outra tabela de eventos por conta própria.

Instalar versões compatíveis de `@nestjs/bullmq` e `bullmq` com `--save-exact`. Conferir peers da integração Nest e a API BullMQ efetivamente instalada; as documentações atuais podem descrever outro major. Usar clientes próprios para produtor e worker; não passar o cliente de cache para operações bloqueantes da fila.

Configurar host, porta e credenciais a partir do ambiente, prefixo exclusivo `mt-filas`, fila `mapa-trilhas` e job `reconstruir-mapa`. `BullModule` registra a conexão/fila; registrar produtor e worker em `providers`. O módulo importa `ProjecaoMapaModule`, nunca `TrilhasModule`.

## 3. Produtor: uma tarefa identificável

O método de produção recebe `ReconstruirMapaJob` do contrato. Seu núcleo é equivalente a:

```ts
await fila.add('reconstruir-mapa', evento, {
  jobId: evento.eventId,
  attempts: 5,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 1000 },
});
```

`fila` é a `Queue` injetada com `@InjectQueue(FILA_MAPA)`, não uma variável global. Os números são parâmetros iniciais do projeto, não garantia de recuperação de qualquer falha.

Usar UUID de evento como `jobId`; evitar `:` em IDs personalizados. A deduplicação do BullMQ vale enquanto aquele job existir. Depois da remoção, ele pode voltar a entrar: idempotência e versão na projeção continuam obrigatórias.

## 4. Não perder a tarefa entre commit e enqueue

A alteração de domínio deve gravar revisão + eventos outbox na mesma transação do principal, conforme a base. Publicar só com `EventBus` em memória ou `queue.add` após o commit deixa uma janela de perda se o processo cair.

Implementar o relay:

1. Ler um lote limitado de eventos com `enfileirado_em IS NULL`, em ordem, no principal.
2. Para cada evento, tentar `queue.add` com `jobId=eventId`, respeitando um prazo limite. Produtor deve falhar rapidamente quando Redis não estiver acessível; não reutilizar a política de reconexão infinita do worker.
3. Somente após confirmação de enqueue, preencher `enfileirado_em`. Se falhar, manter pendente e tentar de novo num próximo ciclo.
4. Se cair entre adicionar e marcar, o evento será reenviado: ID do job e upsert idempotente tornam a repetição segura.
5. Começar com um relay ativo e impedir ciclos sobrepostos no mesmo processo. Para várias instâncias, acrescentar claim/lease ou `SKIP LOCKED`; não presumir exclusividade global a partir de uma variável em memória.

Pode usar um loop com `setTimeout` agendado após terminar o ciclo, cancelado no shutdown, evitando instalar um scheduler só para esse poll. Não usar um `setInterval` que acumule chamadas quando Redis estiver lento. Não manter transação/lock PostgreSQL aberto enquanto aguarda rede Redis.

`enfileirado_em` significa entregue ao Redis, não projeção concluída. Não apagar imediatamente esses registros: definir retenção e permitir reenvio de eventos em caso de perda do Redis, além do rebuild completo. Uma fila persistente ainda exige procedimento de recuperação.

## 5. Worker: executar e permitir tentativas

Com a integração oficial Nest/BullMQ, criar classe com `@Processor(FILA_MAPA)` que estende `WorkerHost`, implementa `process(job)` e é registrada como provider. Não usar `@Process('nome')` de tutoriais Bull antigos.

No `process`:

1. Conferir nome do job e formato de `eventId`, `trilhaId` e `versao`. Não carregar dados pessoais no payload.
2. Chamar `ProjecaoMapaService.reconstruir(job.data.trilhaId)` e aguardar sua conclusão.
3. Em sucesso, registrar IDs e revisão; não registrar o mapa completo.
4. Em falha temporária, lançar `Error` para o BullMQ contabilizar tentativa. Capturar e retornar `{ erro: ... }` faria a tarefa parecer concluída.
5. Registrar tentativa final em failed, com diagnóstico seguro. Não descartar a tarefa silenciosamente.

O reconstrutor lê o estado atual do principal e protege o upsert por versão. Não copiar etapas antigas do payload do job para o banco de leitura. Isso protege de duplicação e processamento fora de ordem.

## 6. API e worker no início

Para a primeira entrega, o worker pode ser provider do mesmo processo Nest: o trabalho já é assíncrono em relação à requisição. Não criar microserviço, novo protocolo e deploy separado apenas para demonstrar a fila.

Para parar o consumo em um teste, pausar a fila pela API de gestão do BullMQ em um script local, gerar alterações e retomá-la. Não criar endpoint público de administração da fila. Se futuramente houver processo separado, extrair um módulo de contexto de worker sem importar `AppModule` inteiro e iniciar consumidores duplicados inadvertidamente.

Com `FILAS_ENABLED=false`, não registrar relay/consumidor nem bloquear startup esperando Redis. O mecanismo de outbox pode continuar guardando eventos se já integrado; o GET usa fallback. Com a fila habilitada e Redis caindo após startup, a escrita PostgreSQL continua concluindo, o relay mantém pendências e o consumidor reconecta. Testar os limites de inicialização da versão escolhida, sem prometer esse comportamento só por definir a flag.

## 7. Conectar com os demais bônus

- **CQRS:** fornece o método de reconstrução e a conexão/tabela de leitura; fila apenas agenda/executa.
- **Cache:** usa a revisão do principal para invalidar imediatamente; não espera o worker reconstruir para deixar de servir uma chave antiga.
- **Logs:** registra produção, início, tentativa, conclusão e falha pelos IDs; auditoria HTTP registra o commit, não a reconstrução como se fosse feita pelo usuário naquele instante.
- **Obras:** qualquer alteração dos campos exibidos ou status deve produzir os eventos de trilhas, mesmo se o controller não estiver no módulo de trilhas.

## 8. Testar os estados e falhas

| Cenário | Resultado esperado |
| --- | --- |
| Worker/fila pausada e escrita válida | Commit e outbox existem; tarefa aguarda; GET continua correto pelo principal |
| Retomar consumo | Tarefa conclui e projeção alcança a revisão atual |
| Redis parado durante escrita | Escrita confirma; outbox pendente não desaparece |
| Redis retorna | Relay entrega e projeção é reconstruída |
| Banco de leitura falha temporariamente | Tentativas com backoff e recuperação, ou failed após o limite |
| Mesmo evento entregue novamente | Projeção sem duplicações |
| Job antigo termina depois de novo | Revisão mais nova não é substituída |
| Transação de domínio faz rollback | Nenhum evento correspondente é enviado |
| Reiniciar aplicação/Redis preservando volume | Pendências continuam recuperáveis |

Conferir build/lint/testes e fazer ao menos um fluxo com PostgreSQL e Redis reais. Um mock de `queue.add` não comprova persistência, consumo ou retry.

## Fontes oficiais

- [Nest: filas](https://docs.nestjs.com/techniques/queues): integração BullMQ, producer e WorkerHost.
- [BullMQ: conexões](https://docs.bullmq.io/guide/connections): diferenças entre produtor e consumidor.
- [BullMQ: tentativas e backoff](https://docs.bullmq.io/guide/retrying-failing-jobs): recuperação limitada de tarefas.
- [BullMQ: IDs](https://docs.bullmq.io/guide/jobs/job-ids): deduplicação e restrições de ID.
- [BullMQ: tarefas idempotentes](https://docs.bullmq.io/patterns/idempotent-jobs): repetição segura.
- [TypeORM: transações](https://typeorm.io/docs/transactions/): atomicidade do domínio com revisão/outbox.

Outbox, contrato do job e reconstrução do mapa são decisões de integração do projeto. Instalar BullMQ não implementa essas garantias automaticamente.
