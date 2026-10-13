import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { AccessControlGuard } from './access-control.guard';
import { AcessoController } from './acesso.controller';
import { AcessoService } from './acesso.service';

describe('AcessoController', () => {
  let app: INestApplication;
  let acessoService: Pick<
    AcessoService,
    'listarUsuarios' | 'buscarUsuarioPorId'
  >;

  const respostaUsuario = {
    id: '01a12345-6789-4abc-8def-0123456789ab',
    nome: 'Maria Silva',
    email: 'maria@exemplo.test',
    ativo: true,
    criadoEm: '2026-10-13T12:00:00.000Z',
    atualizadoEm: '2026-10-13T13:00:00.000Z',
  };

  beforeEach(async () => {
    acessoService = {
      listarUsuarios: jest.fn().mockResolvedValue({
        dados: [respostaUsuario],
        total: 1,
        pagina: 1,
        limite: 20,
        totalPaginas: 1,
      }),
      buscarUsuarioPorId: jest.fn().mockResolvedValue(respostaUsuario),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AcessoController],
      providers: [{ provide: AcessoService, useValue: acessoService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(AccessControlGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('lista contas com os filtros e a paginação informados', async () => {
    await request(app.getHttpServer())
      .get(
        '/admin/usuarios?nome=%20Maria%20&email=exemplo.test&pagina=2&limite=10',
      )
      .expect(200)
      .expect({
        dados: [respostaUsuario],
        total: 1,
        pagina: 1,
        limite: 20,
        totalPaginas: 1,
      });

    expect(acessoService.listarUsuarios).toHaveBeenCalledWith({
      nome: 'Maria',
      email: 'exemplo.test',
      pagina: 2,
      limite: 10,
    });
  });

  it('rejeita filtros e paginação fora dos limites', async () => {
    await request(app.getHttpServer())
      .get('/admin/usuarios?nome=%20&limite=51')
      .expect(400);

    expect(acessoService.listarUsuarios).not.toHaveBeenCalled();
  });

  it('consulta uma conta por UUID sem expor o hash da senha', async () => {
    await request(app.getHttpServer())
      .get(`/admin/usuarios/${respostaUsuario.id}`)
      .expect(200)
      .expect(respostaUsuario);

    expect(acessoService.buscarUsuarioPorId).toHaveBeenCalledWith(
      respostaUsuario.id,
    );
  });

  it('retorna HTTP 400 quando o identificador não é um UUID', async () => {
    await request(app.getHttpServer())
      .get('/admin/usuarios/id-invalido')
      .expect(400);

    expect(acessoService.buscarUsuarioPorId).not.toHaveBeenCalled();
  });

  it('retorna HTTP 404 quando a conta não existe', async () => {
    jest.spyOn(acessoService, 'buscarUsuarioPorId').mockResolvedValue(null);

    await request(app.getHttpServer())
      .get(`/admin/usuarios/${respostaUsuario.id}`)
      .expect(404);
  });
});
