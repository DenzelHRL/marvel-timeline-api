import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, throwError } from 'rxjs';
import { LoggerService } from './logger.service';
import { RequestContextMiddleware } from './request-context.middleware';
import {
  Auditar,
  AUDITORIA_METADATA_KEY,
} from './auditoria.decorator';
import { AuditoriaInterceptor } from './auditoria.interceptor';

describe('Logs e Auditoria', () => {
  describe('LoggerService', () => {
    let service: LoggerService;

    beforeEach(() => {
      service = new LoggerService();
    });

    it('deve estar definido', () => {
      expect(service).toBeDefined();
    });

    it('deve registrar evento de acesso sem erros', () => {
      const spy = jest.spyOn((service as any).winstonLogger, 'info');

      service.acesso({
        tipo: 'acesso',
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        metodo: 'GET',
        rota: '/obras',
        statusHttp: 200,
        duracaoMs: 15.42,
        usuarioId: null,
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: 'acesso',
          metodo: 'GET',
          rota: '/obras',
          statusHttp: 200,
        }),
      );
    });

    it('deve registrar evento de auditoria com resultado concluido', () => {
      const spy = jest.spyOn((service as any).winstonLogger, 'info');

      service.auditoria({
        tipo: 'auditoria',
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        usuarioId: 'user-uuid-1',
        acao: 'obras.alterar_status',
        recursoTipo: 'obra',
        recursoId: 'obra-uuid-1',
        resultado: 'concluido',
        statusHttp: 200,
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: 'auditoria',
          acao: 'obras.alterar_status',
          recursoTipo: 'obra',
          resultado: 'concluido',
          statusHttp: 200,
        }),
      );
    });

    it('deve registrar evento de erro estruturado', () => {
      const spy = jest.spyOn((service as any).winstonLogger, 'error');

      service.erro({
        tipo: 'erro',
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        metodo: 'PATCH',
        rota: '/obras/1/status',
        mensagem: 'Erro inesperado',
        erroNome: 'InternalServerErrorException',
        statusHttp: 500,
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: 'erro',
          mensagem: 'Erro inesperado',
          statusHttp: 500,
        }),
      );
    });

    it('deve sanitizar campos sensiveis como senha, token e secret', () => {
      const spy = jest.spyOn((service as any).winstonLogger, 'info');

      service.auditoria({
        tipo: 'auditoria',
        requestId: 'req-1',
        usuarioId: 'u-1',
        acao: 'auth.login',
        recursoTipo: 'usuario',
        resultado: 'concluido',
        statusHttp: 200,
        detalhes: {
          senha: '123456@SecretPassword',
          token: 'jwt.token.secret',
          nome: 'Guilherme',
        },
      });

      expect(spy).toHaveBeenCalled();
    });

    it('nao deve lancar erro caso o winstonLogger lance uma excecao interna', () => {
      jest.spyOn((service as any).winstonLogger, 'info').mockImplementation(() => {
        throw new Error('Falha de escrita no disco');
      });

      expect(() => {
        service.acesso({
          tipo: 'acesso',
          requestId: 'req-1',
          metodo: 'GET',
          rota: '/series',
          statusHttp: 200,
          duracaoMs: 10,
        });
      }).not.toThrow();
    });
  });

  describe('RequestContextMiddleware', () => {
    let middleware: RequestContextMiddleware;
    let logger: LoggerService;

    beforeEach(() => {
      logger = new LoggerService();
      middleware = new RequestContextMiddleware(logger);
    });

    it('deve gerar novo requestId quando o header X-Request-Id nao for enviado', () => {
      const req: any = {
        headers: {},
        method: 'GET',
        url: '/obras',
      };
      const res: any = {
        setHeader: jest.fn(),
        on: jest.fn(),
      };
      const next = jest.fn();

      middleware.use(req, res, next);

      expect(req.requestId).toBeDefined();
      expect(typeof req.requestId).toBe('string');
      expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', req.requestId);
      expect(next).toHaveBeenCalled();
    });

    it('deve preservar o requestId enviado no header X-Request-Id', () => {
      const customId = 'cliente-id-customizado-123';
      const req: any = {
        headers: { 'x-request-id': customId },
        method: 'GET',
        url: '/obras',
      };
      const res: any = {
        setHeader: jest.fn(),
        on: jest.fn(),
      };
      const next = jest.fn();

      middleware.use(req, res, next);

      expect(req.requestId).toBe(customId);
      expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', customId);
    });

    it('deve registrar acesso no evento finish removendo query params para proteger dados', () => {
      const acessoSpy = jest.spyOn(logger, 'acesso').mockImplementation(() => {});

      let finishCallback: () => void = () => {};
      const req: any = {
        headers: {},
        method: 'GET',
        originalUrl: '/auth/google/callback?code=super-secret-oauth-code',
        url: '/auth/google/callback?code=super-secret-oauth-code',
        user: { id: 'user-1' },
      };
      const res: any = {
        statusCode: 200,
        setHeader: jest.fn(),
        on: jest.fn((evento, cb) => {
          if (evento === 'finish') finishCallback = cb;
        }),
      };
      const next = jest.fn();

      middleware.use(req, res, next);
      finishCallback();

      expect(acessoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: 'acesso',
          metodo: 'GET',
          rota: '/auth/google/callback',
          statusHttp: 200,
          usuarioId: 'user-1',
        }),
      );
    });

    it('deve registrar status 499 se o cliente fechar a conexao antes do termino', () => {
      const acessoSpy = jest.spyOn(logger, 'acesso').mockImplementation(() => {});

      let closeCallback: () => void = () => {};
      const req: any = {
        headers: {},
        method: 'GET',
        url: '/series',
      };
      const res: any = {
        writableEnded: false,
        setHeader: jest.fn(),
        on: jest.fn((evento, cb) => {
          if (evento === 'close') closeCallback = cb;
        }),
      };
      const next = jest.fn();

      middleware.use(req, res, next);
      closeCallback();

      expect(acessoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          statusHttp: 499,
        }),
      );
    });
  });

  describe('AuditoriaInterceptor', () => {
    let interceptor: AuditoriaInterceptor;
    let logger: LoggerService;
    let reflector: Reflector;

    beforeEach(() => {
      logger = new LoggerService();
      reflector = new Reflector();
      interceptor = new AuditoriaInterceptor(reflector, logger);
    });

    it('deve ignorar rotas sem o decorator @Auditar', (done) => {
      jest.spyOn(reflector, 'get').mockReturnValue(null);
      const auditoriaSpy = jest.spyOn(logger, 'auditoria');

      const mockContext: any = {
        getHandler: () => {},
      };
      const mockCallHandler: CallHandler = {
        handle: () => of({ ok: true }),
      };

      interceptor.intercept(mockContext, mockCallHandler).subscribe((resultado) => {
        expect(resultado).toEqual({ ok: true });
        expect(auditoriaSpy).not.toHaveBeenCalled();
        done();
      });
    });

    it('deve registrar auditoria com resultado concluido em operacao bem-sucedida', (done) => {
      jest.spyOn(reflector, 'get').mockReturnValue({
        acao: 'series.alterar_status',
        recurso: 'serie',
        idParam: 'id',
      });
      const auditoriaSpy = jest.spyOn(logger, 'auditoria').mockImplementation(() => {});

      const mockReq: any = {
        requestId: 'req-abc',
        params: { id: 'serie-uuid-1' },
        user: { id: 'admin-uuid-1' },
      };
      const mockRes: any = { statusCode: 200 };

      const mockContext: any = {
        getHandler: () => {},
        switchToHttp: () => ({
          getRequest: () => mockReq,
          getResponse: () => mockRes,
        }),
      };
      const mockCallHandler: CallHandler = {
        handle: () => of({ id: 'serie-uuid-1', status: 'PUBLICADA' }),
      };

      interceptor.intercept(mockContext, mockCallHandler).subscribe(() => {
        expect(auditoriaSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            tipo: 'auditoria',
            requestId: 'req-abc',
            usuarioId: 'admin-uuid-1',
            acao: 'series.alterar_status',
            recursoTipo: 'serie',
            recursoId: 'serie-uuid-1',
            resultado: 'concluido',
            statusHttp: 200,
          }),
        );
        done();
      });
    });

    it('deve extrair id do objeto de resposta na criacao quando nao houver param de rota', (done) => {
      jest.spyOn(reflector, 'get').mockReturnValue({
        acao: 'obras.criar',
        recurso: 'obra',
      });
      const auditoriaSpy = jest.spyOn(logger, 'auditoria').mockImplementation(() => {});

      const mockReq: any = {
        requestId: 'req-criar',
        params: {},
        user: { id: 'admin-uuid-2' },
      };
      const mockRes: any = { statusCode: 201 };

      const mockContext: any = {
        getHandler: () => {},
        switchToHttp: () => ({
          getRequest: () => mockReq,
          getResponse: () => mockRes,
        }),
      };
      const mockCallHandler: CallHandler = {
        handle: () => of({ id: 'nova-obra-uuid', titulo: 'Nova Obra' }),
      };

      interceptor.intercept(mockContext, mockCallHandler).subscribe(() => {
        expect(auditoriaSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            recursoId: 'nova-obra-uuid',
            resultado: 'concluido',
            statusHttp: 201,
          }),
        );
        done();
      });
    });

    it('deve registrar auditoria como rejeitado e preservar excecao original em erros 4xx', (done) => {
      jest.spyOn(reflector, 'get').mockReturnValue({
        acao: 'obras.alterar_status',
        recurso: 'obra',
        idParam: 'id',
      });
      const auditoriaSpy = jest.spyOn(logger, 'auditoria').mockImplementation(() => {});

      const mockReq: any = {
        requestId: 'req-rejeitado',
        params: { id: 'obra-uuid-3' },
        user: { id: 'admin-uuid-3' },
      };
      const mockRes: any = { statusCode: 200 };

      const mockContext: any = {
        getHandler: () => {},
        switchToHttp: () => ({
          getRequest: () => mockReq,
          getResponse: () => mockRes,
        }),
      };
      const mockCallHandler: CallHandler = {
        handle: () =>
          throwError(
            () =>
              new BadRequestException(
                'Nao e possivel arquivar obra em trilha publicada.',
              ),
          ),
      };

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        error: (err) => {
          expect(err).toBeInstanceOf(BadRequestException);
          expect(err.message).toBe(
            'Nao e possivel arquivar obra em trilha publicada.',
          );
          expect(auditoriaSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              resultado: 'rejeitado',
              statusHttp: 400,
              recursoId: 'obra-uuid-3',
            }),
          );
          done();
        },
      });
    });

    it('deve registrar auditoria como falhou e emitir log de erro em falhas 5xx inesperadas', (done) => {
      jest.spyOn(reflector, 'get').mockReturnValue({
        acao: 'trilhas.reordenar',
        recurso: 'trilha',
        idParam: 'id',
      });
      const auditoriaSpy = jest.spyOn(logger, 'auditoria').mockImplementation(() => {});
      const erroSpy = jest.spyOn(logger, 'erro').mockImplementation(() => {});

      const mockReq: any = {
        requestId: 'req-500',
        method: 'PUT',
        url: '/trilhas/123/ordem',
        params: { id: 'trilha-uuid' },
        user: { id: 'admin-1' },
      };
      const mockRes: any = { statusCode: 200 };

      const mockContext: any = {
        getHandler: () => {},
        switchToHttp: () => ({
          getRequest: () => mockReq,
          getResponse: () => mockRes,
        }),
      };
      const mockCallHandler: CallHandler = {
        handle: () => throwError(() => new Error('Falha de conexao com PostgreSQL')),
      };

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        error: (err) => {
          expect(err.message).toBe('Falha de conexao com PostgreSQL');
          expect(auditoriaSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              resultado: 'falhou',
              statusHttp: 500,
            }),
          );
          expect(erroSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              tipo: 'erro',
              statusHttp: 500,
            }),
          );
          done();
        },
      });
    });
  });
});
