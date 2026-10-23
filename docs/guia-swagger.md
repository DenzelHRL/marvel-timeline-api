# Guia de Swagger: documentar e testar endpoints

O Swagger mostra as rotas da API, explica seus parâmetros e permite executar requisições pelo navegador. Cada endpoint precisa descrever o que recebe, o que retorna e quais erros pode produzir.

A configuração inicial é compartilhada. Cada integrante documenta os controllers e DTOs da sua parte.

## 1. Abrir o Swagger

Com o banco preparado e o `backend/.env` configurado, execute dentro de `backend`:

```sh
npm run start:dev
```

Mantenha esse terminal aberto e acesse:

**http://localhost:3000/api**

Se a porta foi alterada no ambiente, use a porta correspondente.

O Swagger só funciona enquanto a API estiver rodando. Se o navegador não conectar, confira o terminal: o Nest precisa iniciar sem erros.

### Configuração compartilhada

O Swagger já está configurado em `backend/src/main.ts` na `main`, com `ValidationPipe`, `DocumentBuilder.addBearerAuth()` e `SwaggerModule.setup('api', ...)`. Uma branch desatualizada pode não mostrar rotas recentes; incorpore a versão atual da `main` preservando alterações locais e execute `npm ci` dentro de `backend` quando o lockfile mudar. Não duplique o bootstrap nem instale novamente dependências já registradas no projeto.

## 2. Entender o que aparece na tela

| Parte | Significado |
| --- | --- |
| Parameters | Campos enviados na URL, como filtros e paginação. |
| Request body | JSON enviado em rotas de criação ou alteração. |
| Try it out | Libera os campos para preencher uma requisição. |
| Execute | Envia a requisição para a API e pode alterar o banco em rotas de escrita. |
| Request URL | Endereço realmente enviado. Confira quais filtros estão presentes. |
| Server response | Status e resposta reais depois de executar. |
| Response body | Dados retornados pelo seu código nessa execução. |
| Responses → Example Value | Exemplo ilustrativo gerado pela documentação. |
| Responses → Schema | Estrutura e tipos que a rota declara retornar. |

**Para avaliar um teste, olhe Server response.** O exemplo da documentação não é uma consulta ao banco e pode mostrar números diferentes.

## 3. Documentar o controller

Use `@ApiTags()` acima da classe para agrupar as rotas. Em cada método, documente a operação e suas respostas.

Exemplo baseado no GET de trilhas; os DTOs e o service importados são os arquivos desse módulo:

```ts
import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { TrilhasService } from './trilhas.service';
import { ListarTrilhasDto } from './dto/listar-trilhas.dto';
import { ListarTrilhasRespostaDto } from './dto/listar-trilhas-resposta.dto';

@ApiTags('Trilhas')
@Controller('trilhas')
export class TrilhasController {
  constructor(private readonly trilhasService: TrilhasService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar trilhas publicadas',
    description:
      'Retorna trilhas publicadas com filtros por nome e slug, além de paginação.',
  })
  @ApiOkResponse({
    description: 'Trilhas retornadas com os dados da paginação.',
    type: ListarTrilhasRespostaDto,
  })
  @ApiBadRequestResponse({
    description: 'Parâmetros de filtro ou paginação inválidos.',
  })
  listarPublicadas(@Query() filtros: ListarTrilhasDto) {
    return this.trilhasService.listarPublicadas(filtros);
  }
}
```

Troque os nomes, as descrições e os DTOs para representar sua rota. Escrever uma resposta no Swagger não implementa esse comportamento: o controller, o service, os pipes e os guards precisam produzir o status documentado.

| Resposta | Decorator | Quando documentar |
| --- | --- | --- |
| 200 | `@ApiOkResponse()` | Consulta ou alteração que retorna dados com esse status. |
| 201 | `@ApiCreatedResponse()` | Criação de um recurso. É o padrão do Nest para POST. |
| 204 | `@ApiNoContentResponse()` | Operação sem corpo de resposta; configure também o status real, por exemplo com `@HttpCode(204)`. |
| 400 | `@ApiBadRequestResponse()` | Entrada inválida. |
| 401 | `@ApiUnauthorizedResponse()` | Autenticação ausente ou inválida. |
| 403 | `@ApiForbiddenResponse()` | Usuário autenticado sem permissão. |
| 404 | `@ApiNotFoundResponse()` | Recurso individual não encontrado. |
| 409 | `@ApiConflictResponse()` | Conflito, como um slug duplicado. |

Documente os casos que a rota realmente trata. Uma listagem sem resultados normalmente retorna `200` com um array vazio.

## 4. Documentar e validar os parâmetros

Use classes DTO para representar a entrada. Os decorators do Swagger descrevem os campos; os de `class-validator` validam os valores em execução.

Exemplo de um DTO de consulta:

```ts
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsInt, Min, Max } from 'class-validator';

export class ListarTrilhasDto {
  @ApiPropertyOptional({
    description: 'Busca por parte do nome, sem diferenciar maiúsculas.',
    type: String,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nome?: string;

  @ApiPropertyOptional({
    description: 'Filtro pelo slug exato.',
    type: String,
    example: 'curta',
    maxLength: 160,
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  slug?: string;

  @ApiPropertyOptional({ type: Number, default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina: number = 1;

  @ApiPropertyOptional({
    type: Number,
    default: 20,
    minimum: 1,
    maximum: 50,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limite: number = 20;
}
```

A descrição precisa corresponder à consulta do service. Nesse exemplo, o nome usa busca parcial sem diferenciar maiúsculas; o slug usa igualdade exata. Essa diferença não é criada pelo Swagger.

### Parâmetros de caminho e body

Para uma rota como `GET /trilhas/:slug`, documente o caminho:

```ts
@ApiParam({
  name: 'slug',
  description: 'Slug exato da trilha.',
  example: 'curta',
})
```

Importe `ApiParam` de `@nestjs/swagger` e mantenha o parâmetro correspondente no método, por exemplo `@Param('slug') slug: string`.

Para POST e PATCH, receba uma classe DTO com `@Body()`. Campos obrigatórios usam `@ApiProperty()`; opcionais usam `@ApiPropertyOptional()`. Acrescente também os validadores adequados.

Exemplo de campo obrigatório dentro de um DTO de criação:

```ts
@ApiProperty({ example: 'Trilha curta', maxLength: 200 })
@IsString()
@IsNotEmpty()
@MaxLength(200)
nome!: string;
```

Importe os decorators usados. O `!` é uma indicação para o TypeScript; não substitui a validação.

## 5. Documentar a resposta

Crie um DTO de resposta que represente o JSON realmente retornado. Use `@ApiProperty()` em seus campos e informe esse DTO no `type` da resposta do controller.

Exemplo reduzido de uma listagem que retorna apenas id e nome de cada item:

```ts
import { ApiProperty } from '@nestjs/swagger';

export class ItemRespostaDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Trilha curta' })
  nome!: string;
}

export class ListagemRespostaDto {
  @ApiProperty({ type: [ItemRespostaDto] })
  dados!: ItemRespostaDto[];

  @ApiProperty({ example: 1, minimum: 0 })
  total!: number;

  @ApiProperty({ example: 1, minimum: 1 })
  pagina!: number;

  @ApiProperty({ example: 20, minimum: 1 })
  limite!: number;

  @ApiProperty({ example: 1, minimum: 0 })
  totalPaginas!: number;
}
```

Se sua rota retorna outros campos, documente todos os campos públicos correspondentes. O DTO de resposta não remove automaticamente campos da entidade: para ocultar senha, segredos ou dados internos, faça o mapeamento ou a serialização apropriada no código.

Documente arrays com seu tipo, datas como `string` com `format: 'date-time'`, enums com os valores possíveis e campos que podem ser nulos com `nullable: true`.

## 6. Testar uma rota pelo Swagger

1. Expanda a rota correta e clique em **Try it out**.
2. Preencha apenas os filtros do teste. Apague exemplos preenchidos em outros campos.
3. Clique em **Execute**.
4. Confira a **Request URL** para saber o que foi enviado.
5. Compare o status e o **Response body** com o resultado esperado.

Antes de executar, formule uma expectativa simples: “vou filtrar pelo nome CURTA; deve retornar só a trilha curta”.

### Exemplo: GET /trilhas

Use o banco de desenvolvimento. Os testes abaixo consideram os seeds com as duas trilhas publicadas e o comportamento da implementação inicial.

| Teste | Entrada | Resultado esperado |
| --- | --- | --- |
| Sem filtros | nome e slug vazios | 200; as trilhas publicadas, respeitando a paginação. |
| Slug exato | `slug=curta` | Apenas a trilha curta. |
| Nome parcial | `nome=CURTA`, slug vazio | Apenas a trilha curta, ignorando maiúsculas. |
| Nenhum resultado | `slug=nao-existe` | 200; `dados: []`, total 0. |
| Paginação | filtros vazios, página 2, limite 1 | Segundo item; o total reflete as trilhas publicadas existentes no banco de teste. |
| Filtros combinados | `nome=CURTA&slug=longa` | Nenhum item, porque os dois filtros precisam ser atendidos. |
| Limite inválido | `limite=0` ou `limite=51` | 400. |
| Página inválida | `pagina=0` | 400. |
| Número inválido | `pagina=abc` ou `pagina=1.5` | 400. |

`limite=4` significa **até quatro itens por página**, não uma obrigação de retornar quatro. `total` conta os itens que atendem aos filtros antes da paginação.

Para verificar a regra de publicação, também teste um registro em estado RASCUNHO ou ARQUIVADA: ele não deve aparecer na listagem pública. Faça isso com um registro de teste no banco local, preservando os dados compartilhados dos seeds.

Nas rotas de escrita, confira também a mudança no banco ou consulte o recurso depois. Nas rotas protegidas, teste sem autenticação, com permissão correta e com usuário sem permissão.

## 7. Testar rotas autenticadas

O `DocumentBuilder` já inclui `.addBearerAuth()`, e as rotas protegidas documentam o esquema bearer.

As rotas protegidas usam `@ApiBearerAuth()` e documentam os erros 401 e 403. No Swagger, clique em **Authorize** e informe o token JWT no campo do esquema bearer.

**`@ApiBearerAuth()` apenas documenta a autenticação.** A proteção real depende dos guards e das permissões. Não acrescente autenticação a uma rota que deve ser pública.

## 8. Problemas comuns

| Sintoma | O que conferir |
| --- | --- |
| Não abre /api | API rodando, porta correta e configuração do Swagger presente na branch. |
| Rota não aparece | Controller registrado no módulo e módulo importado pela aplicação. |
| No parameters | Método recebendo o DTO com `@Query()` e campos documentados com `@ApiPropertyOptional()`. |
| Schema vazio | Campos do DTO de resposta com `@ApiProperty()` e `type` informado no controller. |
| Mudanças não aparecem | Arquivos salvos, compilação sem erros e página atualizada. |
| Lista vazia inesperada | Request URL, filtros combinados, estado do recurso e conteúdo do banco local. |
| 400 ao consultar | Corpo do erro para identificar qual valor não passou na validação. |

## 9. Antes de abrir o Pull Request

- Rotas com resumo, parâmetros, body quando necessário e respostas documentadas.
- Schema correspondente aos campos públicos retornados.
- Testes manuais de sucesso, entrada inválida e regras de negócio relevantes.
- Em listagens, paginação e filtros testados separadamente e em conjunto.
- `npm run build` sem erros.
- Commit na branch da funcionalidade e descrição do PR indicando o que foi testado.

A configuração de `main.ts` e as dependências são compartilhadas. Ao integrar branches, preserve os módulos e as configurações já adicionados. Evite duplicar a configuração do Swagger.

## Referências

- [Swagger no NestJS](https://docs.nestjs.com/openapi/introduction)
- [DTOs e parâmetros](https://docs.nestjs.com/openapi/types-and-parameters)
- [Respostas das operações](https://docs.nestjs.com/openapi/operations)
- [Autenticação no Swagger](https://docs.nestjs.com/openapi/security)
