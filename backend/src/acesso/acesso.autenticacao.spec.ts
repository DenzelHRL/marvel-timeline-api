import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcrypt';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { JwtStrategy } from '../auth/jwt/jwt.strategy';
import { AcessoController } from './acesso.controller';
import { AcessoService } from './acesso.service';
import { ControleAcessoGuard } from './controle-acesso.guard';

describe('Autenticação e autorização de acesso administrativo', () => {
  const jwtSecret = 'secret-for-access-integration-tests-32-bytes';
  const leitorId = '01a12345-6789-4abc-8def-0123456789ab';
  const adminId = '02a12345-6789-4abc-8def-0123456789ab';
  let app: INestApplication;
  let originalJwtSecret: string | undefined;

  beforeAll(() => {
    originalJwtSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = jwtSecret;
  });

  beforeEach(async () => {
    const localUsers = new Map<
      string,
      { id: string; email: string; senhaHash: string; ativo: boolean }
    >([
      [
        'leitor@exemplo.test',
        {
          id: leitorId,
          email: 'leitor@exemplo.test',
          senhaHash: await hash('senha-leitor', 4),
          ativo: true,
        },
      ],
      [
        'admin@exemplo.test',
        {
          id: adminId,
          email: 'admin@exemplo.test',
          senhaHash: await hash('senha-admin', 4),
          ativo: true,
        },
      ],
    ]);
    const principals = new Map([
      [
        leitorId,
        {
          id: leitorId,
          roles: ['LEITOR'],
          permissions: ['conta:consultar_propria'],
        },
      ],
      [
        adminId,
        {
          id: adminId,
          roles: ['ADMIN'],
          permissions: ['usuarios:consultar_todos', 'usuarios:editar'],
        },
      ],
    ]);
    const dataSource = {
      getRepository: jest.fn(() => ({
        findOneBy: jest.fn(({ email }: { email: string }) =>
          Promise.resolve(localUsers.get(email) ?? null),
        ),
      })),
      query: jest.fn((_sql: string, [id]: [string]) =>
        Promise.resolve(principals.has(id) ? [principals.get(id)] : []),
      ),
    };
    const acessoService = {
      listarUsuarios: jest.fn().mockResolvedValue({
        dados: [],
        total: 0,
        pagina: 1,
        limite: 20,
        totalPaginas: 0,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ session: false }),
        JwtModule.register({
          secret: jwtSecret,
          signOptions: { algorithm: 'HS256', expiresIn: 3600 },
        }),
      ],
      controllers: [AuthController, AcessoController],
      providers: [
        {
          provide: DataSource,
          useValue: dataSource as unknown as DataSource,
        },
        {
          provide: AuthService,
          useFactory: (source: DataSource, jwt: JwtService) =>
            new AuthService(source, jwt),
          inject: [DataSource, JwtService],
        },
        { provide: AcessoService, useValue: acessoService },
        JwtStrategy,
        JwtAuthGuard,
        ControleAcessoGuard,
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(() => {
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  it('nega a rota administrativa sem token', async () => {
    await request(app.getHttpServer()).get('/admin/usuarios').expect(401);
  });

  it('retorna 403 para LEITOR autenticado sem permissão administrativa', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'leitor@exemplo.test', senha: 'senha-leitor' })
      .expect(200);

    await request(app.getHttpServer())
      .get('/admin/usuarios')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(403);
  });

  it('permite que ADMIN com permissão consulte a rota administrativa', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@exemplo.test', senha: 'senha-admin' })
      .expect(200);

    await request(app.getHttpServer())
      .get('/admin/usuarios')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200)
      .expect({
        dados: [],
        total: 0,
        pagina: 1,
        limite: 20,
        totalPaginas: 0,
      });
  });

  it('documenta bearer nas rotas administrativas e deixa o login público', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('teste')
        .addBearerAuth()
        .build(),
    );

    expect(document.paths['/admin/usuarios']?.get?.security).toEqual([
      { bearer: [] },
    ]);
    expect(document.paths['/auth/login']?.post?.security).toBeUndefined();
  });
});
