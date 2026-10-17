import { ConflictException, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { DataSource, QueryFailedError } from 'typeorm';
import {
  Perfil,
  Permissao,
  Usuario,
  UsuarioPerfil,
} from '../database/entities';
import { AtualizarMinhaContaDTO, ConsultarMinhasPermissoesDTO } from './dto';
import { UsuariosService } from './usuarios.service';

describe('UsuariosService', () => {
  const usuarioId = '01a12345-6789-4abc-8def-0123456789ab';
  let service: UsuariosService;
  let usuario: Usuario;
  let usuarioRepository: {
    findOne: jest.Mock;
    createQueryBuilder: jest.Mock;
    save: jest.Mock;
  };
  let perfilRepository: { createQueryBuilder: jest.Mock };
  let usuarioPerfilRepository: { find: jest.Mock };
  let permissaoRepository: { createQueryBuilder: jest.Mock };

  beforeEach(() => {
    usuario = {
      id: usuarioId,
      nome: 'Nome original',
      email: 'usuario@exemplo.test',
      senhaHash: 'hash-nao-retornado',
      ativo: true,
      criadoEm: new Date('2026-10-13T12:00:00.000Z'),
      atualizadoEm: new Date('2026-10-13T13:00:00.000Z'),
    };
    usuarioRepository = {
      findOne: jest.fn().mockResolvedValue(usuario),
      createQueryBuilder: jest.fn(),
      save: jest.fn().mockResolvedValue(usuario),
    };
    perfilRepository = { createQueryBuilder: jest.fn() };
    usuarioPerfilRepository = { find: jest.fn().mockResolvedValue([]) };
    permissaoRepository = { createQueryBuilder: jest.fn() };

    const dataSource = {
      getRepository: jest.fn(
        (
          entity:
            | typeof Usuario
            | typeof Perfil
            | typeof UsuarioPerfil
            | typeof Permissao,
        ) => {
          if (entity === Usuario) return usuarioRepository;
          if (entity === UsuarioPerfil) return usuarioPerfilRepository;
          if (entity === Perfil) return perfilRepository;
          return permissaoRepository;
        },
      ),
    };
    service = new UsuariosService(dataSource as unknown as DataSource);
  });

  it('aparar espaços do nome antes de validar e rejeitar nome vazio', () => {
    const dto = plainToInstance(AtualizarMinhaContaDTO, {
      nome: '   ',
    });

    expect(dto.nome).toBe('');
    expect(validateSync(dto).some((error) => error.property === 'nome')).toBe(
      true,
    );
  });

  it('salva o nome já aparado e devolve os dados públicos da conta', async () => {
    const dto = plainToInstance(AtualizarMinhaContaDTO, {
      nome: '  Maria Silva  ',
    });

    await expect(service.atualizarMinhaConta(usuarioId, dto)).resolves.toEqual({
      id: usuarioId,
      nome: 'Maria Silva',
      email: 'usuario@exemplo.test',
      ativo: true,
      perfis: [],
      criadoEm: usuario.criadoEm,
      atualizadoEm: usuario.atualizadoEm,
    });
    expect(usuarioRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'Maria Silva' }),
    );
  });

  it('detecta e-mail duplicado sem diferenciar maiúsculas e minúsculas', async () => {
    const query = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({ id: 'outro-usuario' }),
    };
    usuarioRepository.createQueryBuilder.mockReturnValue(query);
    const dto = plainToInstance(AtualizarMinhaContaDTO, {
      email: '  OUTRO@Exemplo.Test  ',
    });

    await expect(
      service.atualizarMinhaConta(usuarioId, dto),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(query.where).toHaveBeenCalledWith('LOWER(u.email) = :email', {
      email: 'outro@exemplo.test',
    });
    expect(usuarioRepository.save).not.toHaveBeenCalled();
  });

  it('converte conflito concorrente do índice único de e-mail em HTTP 409', async () => {
    const query = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    usuarioRepository.createQueryBuilder.mockReturnValue(query);
    const databaseError = Object.assign(new Error('duplicate key'), {
      code: '23505',
      constraint: 'uq_usuarios_email_ci',
    });
    usuarioRepository.save.mockRejectedValue(
      new QueryFailedError('UPDATE usuarios', [], databaseError),
    );
    const dto = plainToInstance(AtualizarMinhaContaDTO, {
      email: 'novo@exemplo.test',
    });

    await expect(
      service.atualizarMinhaConta(usuarioId, dto),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('retorna 404 quando a conta própria não existe', async () => {
    usuarioRepository.findOne.mockResolvedValue(null);

    await expect(
      service.atualizarMinhaConta(
        usuarioId,
        plainToInstance(AtualizarMinhaContaDTO, { nome: 'Novo nome' }),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(usuarioRepository.save).not.toHaveBeenCalled();
  });

  it('retorna permissões e metadados de paginação com o formato documentado', async () => {
    const permission = {
      id: '02a12345-6789-4abc-8def-0123456789ab',
      codigo: 'conta:consultar_propria',
      descricao: 'Consultar os próprios dados',
    };
    const query = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(1),
      getMany: jest.fn().mockResolvedValue([permission]),
    };
    permissaoRepository.createQueryBuilder.mockReturnValue(query);

    await expect(
      service.consultarMinhasPermissoes(
        usuarioId,
        Object.assign(new ConsultarMinhasPermissoesDTO(), {
          pagina: 1,
          limite: 20,
        }),
      ),
    ).resolves.toEqual({
      dados: [permission],
      meta: { pagina: 1, limite: 20, total: 1, totalPaginas: 1 },
    });
  });
});
