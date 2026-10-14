import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Perfil, Usuario, UsuarioPerfil } from '../database/entities';
import { ListarUsuariosDto } from './dto';
import { AcessoService } from './acesso.service';

describe('AcessoService', () => {
  let service: AcessoService;
  let usuariosRepository: jest.Mocked<
    Pick<Repository<Usuario>, 'findAndCount' | 'findOne'>
  >;
  let manager: {
    findOne: jest.Mock;
    query: jest.Mock;
    update: jest.Mock;
    insert: jest.Mock;
    delete: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };

  const usuario = {
    id: '01a12345-6789-4abc-8def-0123456789ab',
    nome: 'Maria Silva',
    email: 'maria@exemplo.test',
    senhaHash: 'hash-que-nao-pode-ser-retornado',
    ativo: true,
    criadoEm: new Date('2026-10-13T12:00:00.000Z'),
    atualizadoEm: new Date('2026-10-13T13:00:00.000Z'),
  } satisfies Usuario;
  const perfilAdmin = {
    id: '02a12345-6789-4abc-8def-0123456789ab',
    codigo: 'ADMIN',
    descricao: 'Administrador',
  } satisfies Perfil;

  beforeEach(() => {
    usuariosRepository = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
    };
    manager = {
      findOne: jest.fn(),
      query: jest.fn(),
      update: jest.fn(),
      insert: jest.fn(),
      delete: jest.fn(),
    };
    dataSource = {
      transaction: jest.fn(
        (callback: (transactionManager: EntityManager) => Promise<unknown>) =>
          callback(manager as unknown as EntityManager),
      ),
    };
    service = new AcessoService(
      usuariosRepository as unknown as Repository<Usuario>,
      dataSource as unknown as DataSource,
    );
  });

  it('lista contas com filtros, paginação e ordenação estável', async () => {
    usuariosRepository.findAndCount.mockResolvedValue([[usuario], 21]);
    const filtros = Object.assign(new ListarUsuariosDto(), {
      nome: 'Maria',
      email: 'exemplo.test',
      pagina: 2,
      limite: 10,
    });

    const resposta = await service.listarUsuarios(filtros);

    expect(usuariosRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          nome: expect.objectContaining({ _type: 'ilike', _value: '%Maria%' }),
          email: expect.objectContaining({
            _type: 'ilike',
            _value: '%exemplo.test%',
          }),
        },
        select: {
          id: true,
          nome: true,
          email: true,
          ativo: true,
          criadoEm: true,
          atualizadoEm: true,
        },
        order: { nome: 'ASC', id: 'ASC' },
        take: 10,
        skip: 10,
      }),
    );
    expect(resposta).toEqual({
      dados: [
        {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          ativo: true,
          criadoEm: '2026-10-13T12:00:00.000Z',
          atualizadoEm: '2026-10-13T13:00:00.000Z',
        },
      ],
      total: 21,
      pagina: 2,
      limite: 10,
      totalPaginas: 3,
    });
    expect(JSON.stringify(resposta)).not.toContain(usuario.senhaHash);
  });

  it('retorna conta pelo ID sem consultar nem expor o hash da senha', async () => {
    usuariosRepository.findOne.mockResolvedValue(usuario);

    const resposta = await service.buscarUsuarioPorId(usuario.id);

    expect(usuariosRepository.findOne).toHaveBeenCalledWith({
      where: { id: usuario.id },
      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true,
        criadoEm: true,
        atualizadoEm: true,
      },
    });
    expect(resposta).toEqual({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      ativo: true,
      criadoEm: '2026-10-13T12:00:00.000Z',
      atualizadoEm: '2026-10-13T13:00:00.000Z',
    });
    expect(resposta).not.toHaveProperty('senhaHash');
  });

  it('retorna null quando o ID não corresponde a uma conta', async () => {
    usuariosRepository.findOne.mockResolvedValue(null);

    await expect(service.buscarUsuarioPorId(usuario.id)).resolves.toBeNull();
  });

  it('altera o status de conta existente sem retornar o hash', async () => {
    manager.findOne
      .mockResolvedValueOnce(perfilAdmin)
      .mockResolvedValueOnce(usuario)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...usuario, ativo: false });
    manager.update.mockResolvedValue({ affected: 1 });

    const resposta = await service.alterarStatusUsuario(usuario.id, false);

    expect(manager.update).toHaveBeenCalledWith(
      Usuario,
      { id: usuario.id },
      { ativo: false },
    );
    expect(resposta.ativo).toBe(false);
    expect(resposta).not.toHaveProperty('senhaHash');
  });

  it('impede desativar o último administrador recuperável', async () => {
    manager.findOne
      .mockResolvedValueOnce(perfilAdmin)
      .mockResolvedValueOnce(usuario)
      .mockResolvedValueOnce({
        usuarioId: usuario.id,
        perfilId: perfilAdmin.id,
      });
    manager.query.mockResolvedValue([]);

    await expect(
      service.alterarStatusUsuario(usuario.id, false),
    ).rejects.toThrow(ConflictException);
    expect(manager.update).not.toHaveBeenCalled();
  });

  it('permite desativar um administrador se outro administrador recuperável permanecer', async () => {
    manager.findOne
      .mockResolvedValueOnce(perfilAdmin)
      .mockResolvedValueOnce(usuario)
      .mockResolvedValueOnce({
        usuarioId: usuario.id,
        perfilId: perfilAdmin.id,
      })
      .mockResolvedValueOnce({ ...usuario, ativo: false });
    manager.query.mockResolvedValue([
      { id: '03a12345-6789-4abc-8def-0123456789ab' },
    ]);
    manager.update.mockResolvedValue({ affected: 1 });

    await expect(
      service.alterarStatusUsuario(usuario.id, false),
    ).resolves.toMatchObject({ ativo: false });
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining("perfil_admin.codigo = 'ADMIN'"),
      [
        usuario.id,
        null,
        ['acessos:atribuir_perfil', 'acessos:alterar_permissoes'],
        2,
      ],
    );
  });

  it('atribui perfil existente à conta', async () => {
    const perfilLeitor = {
      ...perfilAdmin,
      id: '03a12345-6789-4abc-8def-0123456789ab',
      codigo: 'LEITOR',
    };
    manager.findOne
      .mockResolvedValueOnce(perfilAdmin)
      .mockResolvedValueOnce({ id: usuario.id })
      .mockResolvedValueOnce(perfilLeitor)
      .mockResolvedValueOnce(null);
    manager.insert.mockResolvedValue({ identifiers: [] });

    await expect(
      service.atribuirPerfil(usuario.id, perfilLeitor.id),
    ).resolves.toEqual({
      usuarioId: usuario.id,
      perfilId: perfilLeitor.id,
      codigo: 'LEITOR',
    });
    expect(manager.insert).toHaveBeenCalledWith(UsuarioPerfil, {
      usuarioId: usuario.id,
      perfilId: perfilLeitor.id,
    });
  });

  it('rejeita atribuir um perfil que já existe na conta', async () => {
    manager.findOne
      .mockResolvedValueOnce(perfilAdmin)
      .mockResolvedValueOnce({ id: usuario.id })
      .mockResolvedValueOnce(perfilAdmin)
      .mockResolvedValueOnce({
        usuarioId: usuario.id,
        perfilId: perfilAdmin.id,
      });

    await expect(
      service.atribuirPerfil(usuario.id, perfilAdmin.id),
    ).rejects.toThrow(ConflictException);
    expect(manager.insert).not.toHaveBeenCalled();
  });

  it('retorna não encontrado ao atribuir perfil a uma conta inexistente', async () => {
    manager.findOne
      .mockResolvedValueOnce(perfilAdmin)
      .mockResolvedValueOnce(null);

    await expect(
      service.atribuirPerfil(usuario.id, perfilAdmin.id),
    ).rejects.toThrow(NotFoundException);
    expect(manager.insert).not.toHaveBeenCalled();
  });

  it('revoga vínculo de perfil existente', async () => {
    const perfilLeitor = {
      ...perfilAdmin,
      id: '03a12345-6789-4abc-8def-0123456789ab',
      codigo: 'LEITOR',
    };
    manager.findOne
      .mockResolvedValueOnce(perfilAdmin)
      .mockResolvedValueOnce(usuario)
      .mockResolvedValueOnce(perfilLeitor)
      .mockResolvedValueOnce({
        usuarioId: usuario.id,
        perfilId: perfilLeitor.id,
      });
    manager.delete.mockResolvedValue({ affected: 1 });

    await expect(
      service.revogarPerfil(usuario.id, perfilLeitor.id),
    ).resolves.toBeUndefined();
    expect(manager.delete).toHaveBeenCalledWith(UsuarioPerfil, {
      usuarioId: usuario.id,
      perfilId: perfilLeitor.id,
    });
  });

  it('impede revogar o último perfil ADMIN recuperável', async () => {
    manager.findOne
      .mockResolvedValueOnce(perfilAdmin)
      .mockResolvedValueOnce(usuario)
      .mockResolvedValueOnce(perfilAdmin)
      .mockResolvedValueOnce({
        usuarioId: usuario.id,
        perfilId: perfilAdmin.id,
      })
      .mockResolvedValueOnce({
        usuarioId: usuario.id,
        perfilId: perfilAdmin.id,
      });
    manager.query.mockResolvedValue([]);

    await expect(
      service.revogarPerfil(usuario.id, perfilAdmin.id),
    ).rejects.toThrow(ConflictException);
    expect(manager.delete).not.toHaveBeenCalled();
  });

  it('permite revogar outro perfil do ADMIN se ele mantiver as permissões de recuperação', async () => {
    const perfilLeitor = {
      ...perfilAdmin,
      id: '03a12345-6789-4abc-8def-0123456789ab',
      codigo: 'LEITOR',
    };
    manager.findOne
      .mockResolvedValueOnce(perfilAdmin)
      .mockResolvedValueOnce(usuario)
      .mockResolvedValueOnce(perfilLeitor)
      .mockResolvedValueOnce({
        usuarioId: usuario.id,
        perfilId: perfilLeitor.id,
      })
      .mockResolvedValueOnce({
        usuarioId: usuario.id,
        perfilId: perfilAdmin.id,
      });
    manager.query.mockResolvedValue([{ id: usuario.id }]);
    manager.delete.mockResolvedValue({ affected: 1 });

    await expect(
      service.revogarPerfil(usuario.id, perfilLeitor.id),
    ).resolves.toBeUndefined();
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('up_permissao.perfil_id <> $2::uuid'),
      [
        null,
        perfilLeitor.id,
        ['acessos:atribuir_perfil', 'acessos:alterar_permissoes'],
        2,
      ],
    );
    expect(manager.delete).toHaveBeenCalledWith(UsuarioPerfil, {
      usuarioId: usuario.id,
      perfilId: perfilLeitor.id,
    });
  });

  it('retorna não encontrado ao revogar vínculo inexistente', async () => {
    manager.findOne
      .mockResolvedValueOnce(perfilAdmin)
      .mockResolvedValueOnce(usuario)
      .mockResolvedValueOnce({ ...perfilAdmin, codigo: 'LEITOR' })
      .mockResolvedValueOnce(null);

    await expect(
      service.revogarPerfil(usuario.id, perfilAdmin.id),
    ).rejects.toThrow(NotFoundException);
    expect(manager.delete).not.toHaveBeenCalled();
  });
});
