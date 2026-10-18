import { BadRequestException, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject, ResponseObject, SchemaObject } from '@nestjs/swagger';
import { AcontecimentosController } from './acontecimentos.controller';
import { AcontecimentosService } from './acontecimentos.service';
import { AtualizarEventoDto } from './dto/acontecimentos.atualizar-evento.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { ControleAcessoGuard } from '../acesso/controle-acesso.guard';

describe('Validação do PATCH de acontecimentos', () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });
  const validar = (body: object) => pipe.transform(body, { type: 'body', metatype: AtualizarEventoDto });

  it.each([{ categoria: 'CONFLITO' }, { posicao: 3 }, { titulo: 'Novo título' }])(
    'aceita atualização parcial %j', async (body) => {
      await expect(validar(body)).resolves.toMatchObject(body);
    },
  );

  it.each([null, '', '   ', 123, 'a'.repeat(201)])(
    'rejeita título inválido %j', async (titulo) => {
      await expect(validar({ titulo })).rejects.toBeInstanceOf(BadRequestException);
    },
  );
});

describe('OpenAPI de acontecimentos', () => {
  let app: INestApplication;
  let doc: OpenAPIObject;
  const eventos = '/acontecimentos/{id}';
  const obra = '/obras/{obraId}/acontecimentos';
  const personagens = '/acontecimentos/{id}/personagens';
  const vinculo = '/acontecimentos/{id}/personagens/{personagemId}';
  const schema = (name: string) => doc.components!.schemas![name] as SchemaObject;

  beforeAll(async () => {
    // Serviços e guards substituídos: este teste verifica documentação, não autorização.
    const module = await Test.createTestingModule({
      controllers: [AcontecimentosController],
      providers: [{ provide: AcontecimentosService, useValue: {} }],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(ControleAcessoGuard).useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication();
    doc = SwaggerModule.createDocument(app, new DocumentBuilder().addBearerAuth().build());
  });

  afterAll(async () => { await app?.close(); });

  it('documenta as oito operações e associa Bearer somente às cinco escritas', () => {
    const operations = [doc.paths[obra].post!, doc.paths[eventos].patch!, doc.paths[eventos].delete!,
      doc.paths[personagens].post!, doc.paths[vinculo].delete!];
    operations.forEach((operation) => {
      expect(operation.security).toContainEqual({ bearer: [] });
      expect(operation.responses['401']).toBeDefined();
      expect(operation.responses['403']).toBeDefined();
    });
    const reads = [doc.paths['/obras/{slug}/acontecimentos'].get!, doc.paths[eventos].get!, doc.paths[personagens].get!];
    reads.forEach((operation) => expect(operation.security ?? []).toHaveLength(0));
    [...operations, ...reads].forEach((operation) => {
      expect(operation.summary).toBeTruthy();
      expect(operation.description).toBeTruthy();
      expect(operation.tags).toContain('Acontecimentos');
    });
  });

  it('documenta campos obrigatórios na criação e opcionais no PATCH', () => {
    expect(schema('CriarEventoDto').required).toEqual(expect.arrayContaining(['titulo', 'descricao', 'categoria', 'posicao']));
    expect(schema('CriarEventoDto').required).not.toContain('spoiler');
    expect(schema('AtualizarEventoDto').required ?? []).toEqual([]);
    expect(schema('AtualizarEventoDto').properties?.titulo).toMatchObject({ type: 'string', maxLength: 200 });
    expect(doc.paths[eventos].patch!.requestBody).toMatchObject({ content: { 'application/json': {
      schema: { $ref: '#/components/schemas/AtualizarEventoDto' },
    } } });
    expect(doc.paths[obra].post!.requestBody).toMatchObject({ content: { 'application/json': {
      schema: { $ref: '#/components/schemas/CriarEventoDto' },
    } } });
  });

  it('documenta o corpo e a resposta da associação', () => {
    expect(doc.paths[personagens].post!.requestBody).toMatchObject({ content: { 'application/json': {
      schema: { type: 'object', required: ['personagemId'], properties: { personagemId: { type: 'string', format: 'uuid' } } },
    } } });
    expect(doc.paths[personagens].post!.responses['201']).toMatchObject({ content: { 'application/json': {
      schema: { required: ['acontecimentoId', 'personagemId'] },
    } } });
  });

  it('documenta exclusões sem corpo e conflitos de posição', () => {
    for (const path of [eventos, vinculo]) {
      expect(doc.paths[path].delete!.responses['204']).toBeDefined();
      expect((doc.paths[path].delete!.responses['204'] as ResponseObject).content).toBeUndefined();
    }
    expect(doc.paths[eventos].patch!.responses['409']).toBeDefined();
    expect(doc.paths[obra].post!.responses['409']).toBeDefined();
  });

  it('documenta envelopes paginados e filtros das listagens', () => {
    for (const [path, filters] of [
      ['/obras/{slug}/acontecimentos', ['categoria', 'contemSpoiler']],
      [personagens, ['nome', 'slug']],
    ] as const) {
      const operation = doc.paths[path].get!;
      const response = operation.responses['200'] as ResponseObject;
      const result = response.content!['application/json'].schema as SchemaObject;
      expect(result.required).toEqual(expect.arrayContaining(['itens', 'meta']));
      expect(result.properties?.meta).toMatchObject({ required: ['pagina', 'limite', 'total', 'totalPaginas'] });
      for (const name of ['pagina', 'limite', 'incluirSpoilers', ...filters]) {
        expect(operation.parameters).toEqual(expect.arrayContaining([expect.objectContaining({ name, in: 'query', required: false })]));
      }
    }
    const response = doc.paths['/obras/{slug}/acontecimentos'].get!.responses['200'] as ResponseObject;
    expect((response.content!['application/json'].schema as SchemaObject).required).toContain('obra');
  });
});
