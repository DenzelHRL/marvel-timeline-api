import { Repository } from 'typeorm';
import { Usuario } from '../database/entities';
import { ListarUsuariosDto } from './dto';
import { AcessoService } from './acesso.service';

describe('AcessoService', () => {
  let service: AcessoService;
  let usuariosRepository: jest.Mocked<
    Pick<Repository<Usuario>, 'findAndCount' | 'findOne'>
  >;

  const usuario = {
    id: '01a12345-6789-4abc-8def-0123456789ab',
    nome: 'Maria Silva',
    email: 'maria@exemplo.test',
    senhaHash: 'hash-que-nao-pode-ser-retornado',
    ativo: true,
    criadoEm: new Date('2026-10-13T12:00:00.000Z'),
    atualizadoEm: new Date('2026-10-13T13:00:00.000Z'),
  } satisfies Usuario;

  beforeEach(() => {
    usuariosRepository = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
    };
    service = new AcessoService(
      usuariosRepository as unknown as Repository<Usuario>,
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
});
