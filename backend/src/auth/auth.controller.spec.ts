import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const respostaCadastro = {
  id: '01a12345-6789-4abc-8def-0123456789ab',
  nome: 'Maria Silva',
  email: 'maria@exemplo.test',
  ativo: true,
  criadoEm: '2026-10-13T12:00:00.000Z',
};

const respostaLogin = {
  accessToken: 'jwt-de-teste',
  tokenType: 'Bearer',
  expiresIn: 3600,
};

describe('Controlador de autenticação', () => {
  let app: INestApplication;
  let authService: Pick<AuthService, 'cadastrar' | 'login'>;

  beforeEach(async () => {
    authService = {
      cadastrar: jest.fn().mockResolvedValue(respostaCadastro),
      login: jest.fn().mockResolvedValue(respostaLogin),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

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

  it('cria uma conta e retorna HTTP 201 com os dados públicos', async () => {
    await request(app.getHttpServer())
      .post('/auth/cadastro')
      .send({
        nome: '  Maria Silva  ',
        email: ' maria@exemplo.test ',
        senha: 'senha-segura-123',
      })
      .expect(201)
      .expect(respostaCadastro);

    expect(authService.cadastrar).toHaveBeenCalledWith({
      nome: 'Maria Silva',
      email: 'maria@exemplo.test',
      senha: 'senha-segura-123',
    });
  });

  it('retorna HTTP 400 quando os dados do cadastro são inválidos', async () => {
    await request(app.getHttpServer())
      .post('/auth/cadastro')
      .send({
        nome: 'Maria Silva',
        email: 'not-an-email',
        senha: 'senha-segura-123',
      })
      .expect(400);

    expect(authService.cadastrar).not.toHaveBeenCalled();
  });

  it('autentica pelo endpoint de login e retorna HTTP 200 com o token', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: ' maria@exemplo.test ',
        senha: 'senha-segura-123',
      })
      .expect(200)
      .expect(respostaLogin);

    expect(authService.login).toHaveBeenCalledWith({
      email: 'maria@exemplo.test',
      senha: 'senha-segura-123',
    });
  });

  it('retorna HTTP 400 quando o e-mail de login é inválido', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'email-invalido',
        senha: 'senha-segura-123',
      })
      .expect(400);

    expect(authService.login).not.toHaveBeenCalled();
  });
});
