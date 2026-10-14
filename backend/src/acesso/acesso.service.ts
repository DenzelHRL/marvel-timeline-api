import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  FindOptionsWhere,
  ILike,
  Repository,
} from 'typeorm';
import {
  Perfil,
  Permissao,
  Usuario,
  UsuarioPerfil,
} from '../database/entities';
import {
  AtribuirPerfilRespostaDto,
  ListarPerfisDto,
  ListarPerfisRespostaDto,
  ListarPermissoesDto,
  ListarPermissoesRespostaDto,
  ListarUsuariosDto,
  ListarUsuariosRespostaDto,
  PermissaoAdminRespostaDto,
  PerfilAdminRespostaDto,
  UsuarioAdminRespostaDto,
} from './dto';

const PERMISSOES_RECUPERACAO_ACESSO = [
  'acessos:atribuir_perfil',
  'acessos:alterar_permissoes',
];

interface UsuarioIdRow {
  id: string;
}

@Injectable()
export class AcessoService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
    @InjectRepository(Perfil)
    private readonly perfisRepository: Repository<Perfil>,
    @InjectRepository(Permissao)
    private readonly permissoesRepository: Repository<Permissao>,
    private readonly dataSource: DataSource,
  ) {}

  async listarUsuarios(
    filtros: ListarUsuariosDto,
  ): Promise<ListarUsuariosRespostaDto> {
    const where: FindOptionsWhere<Usuario> = {};
    if (filtros.nome) {
      where.nome = ILike(`%${filtros.nome}%`);
    }
    if (filtros.email) {
      where.email = ILike(`%${filtros.email}%`);
    }

    const [usuarios, total] = await this.usuariosRepository.findAndCount({
      where,
      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true,
        criadoEm: true,
        atualizadoEm: true,
      },
      order: { nome: 'ASC', id: 'ASC' },
      take: filtros.limite,
      skip: (filtros.pagina - 1) * filtros.limite,
    });

    return {
      dados: usuarios.map((usuario) => this.toResposta(usuario)),
      total,
      pagina: filtros.pagina,
      limite: filtros.limite,
      totalPaginas: Math.ceil(total / filtros.limite),
    };
  }

  async buscarUsuarioPorId(
    id: string,
  ): Promise<UsuarioAdminRespostaDto | null> {
    const usuario = await this.usuariosRepository.findOne({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true,
        criadoEm: true,
        atualizadoEm: true,
      },
    });

    return usuario ? this.toResposta(usuario) : null;
  }

  async buscarPerfilPorId(id: string): Promise<PerfilAdminRespostaDto | null> {
    const perfil = await this.perfisRepository.findOne({
      where: { id },
      select: { id: true, codigo: true, descricao: true },
    });

    return perfil;
  }

  async listarPerfis(
    filtros: ListarPerfisDto,
  ): Promise<ListarPerfisRespostaDto> {
    const where: FindOptionsWhere<Perfil> = {};
    if (filtros.codigo) {
      where.codigo = ILike(`%${filtros.codigo}%`);
    }
    if (filtros.descricao) {
      where.descricao = ILike(`%${filtros.descricao}%`);
    }

    const [perfis, total] = await this.perfisRepository.findAndCount({
      where,
      select: { id: true, codigo: true, descricao: true },
      order: { codigo: 'ASC', id: 'ASC' },
      take: filtros.limite,
      skip: (filtros.pagina - 1) * filtros.limite,
    });

    return {
      dados: perfis,
      total,
      pagina: filtros.pagina,
      limite: filtros.limite,
      totalPaginas: Math.ceil(total / filtros.limite),
    };
  }

  async listarPermissoes(
    filtros: ListarPermissoesDto,
  ): Promise<ListarPermissoesRespostaDto> {
    const where: FindOptionsWhere<Permissao> = {};
    if (filtros.codigo) {
      where.codigo = ILike(`%${filtros.codigo}%`);
    }
    if (filtros.descricao) {
      where.descricao = ILike(`%${filtros.descricao}%`);
    }

    const [permissoes, total] = await this.permissoesRepository.findAndCount({
      where,
      select: { id: true, codigo: true, descricao: true },
      order: { codigo: 'ASC', id: 'ASC' },
      take: filtros.limite,
      skip: (filtros.pagina - 1) * filtros.limite,
    });

    return {
      dados: permissoes,
      total,
      pagina: filtros.pagina,
      limite: filtros.limite,
      totalPaginas: Math.ceil(total / filtros.limite),
    };
  }

  async buscarPermissaoPorId(
    id: string,
  ): Promise<PermissaoAdminRespostaDto | null> {
    const permissao = await this.permissoesRepository.findOne({
      where: { id },
      select: { id: true, codigo: true, descricao: true },
    });

    return permissao;
  }

  async alterarStatusUsuario(
    id: string,
    ativo: boolean,
  ): Promise<UsuarioAdminRespostaDto> {
    return this.dataSource.transaction(async (manager) => {
      const perfilAdmin = await this.bloquearPerfilAdmin(manager);
      const usuario = await manager.findOne(Usuario, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!usuario) {
        throw new NotFoundException('Usuário não encontrado.');
      }

      if (!ativo && usuario.ativo) {
        const possuiPerfilAdmin = await manager.findOne(UsuarioPerfil, {
          where: { usuarioId: id, perfilId: perfilAdmin.id },
        });
        if (
          possuiPerfilAdmin &&
          !(await this.existeAdministradorRecuperavel(manager, id, null))
        ) {
          throw this.ultimoAdministradorException();
        }
      }

      await manager.update(Usuario, { id }, { ativo });
      const usuarioAtualizado = await manager.findOne(Usuario, {
        where: { id },
        select: {
          id: true,
          nome: true,
          email: true,
          ativo: true,
          criadoEm: true,
          atualizadoEm: true,
        },
      });

      if (!usuarioAtualizado) {
        throw new InternalServerErrorException(
          'Não foi possível recuperar a conta após alterar o status.',
        );
      }

      return this.toResposta(usuarioAtualizado);
    });
  }

  async atribuirPerfil(
    usuarioId: string,
    perfilId: string,
  ): Promise<AtribuirPerfilRespostaDto> {
    return this.dataSource.transaction(async (manager) => {
      await this.bloquearPerfilAdmin(manager);

      const usuario = await manager.findOne(Usuario, {
        where: { id: usuarioId },
        select: { id: true },
      });
      if (!usuario) {
        throw new NotFoundException('Usuário não encontrado.');
      }

      const perfil = await manager.findOne(Perfil, {
        where: { id: perfilId },
      });
      if (!perfil) {
        throw new NotFoundException('Perfil não encontrado.');
      }

      const vinculoExistente = await manager.findOne(UsuarioPerfil, {
        where: { usuarioId, perfilId },
      });
      if (vinculoExistente) {
        throw new ConflictException(
          'Esse perfil já está atribuído ao usuário.',
        );
      }

      await manager.insert(UsuarioPerfil, { usuarioId, perfilId });
      return { usuarioId, perfilId, codigo: perfil.codigo };
    });
  }

  async revogarPerfil(usuarioId: string, perfilId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const perfilAdmin = await this.bloquearPerfilAdmin(manager);

      const usuario = await manager.findOne(Usuario, {
        where: { id: usuarioId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!usuario) {
        throw new NotFoundException('Usuário não encontrado.');
      }

      const perfil = await manager.findOne(Perfil, { where: { id: perfilId } });
      if (!perfil) {
        throw new NotFoundException('Perfil não encontrado.');
      }

      const vinculo = await manager.findOne(UsuarioPerfil, {
        where: { usuarioId, perfilId },
      });
      if (!vinculo) {
        throw new NotFoundException('O perfil não está atribuído ao usuário.');
      }

      if (
        usuario.ativo &&
        (await manager.findOne(UsuarioPerfil, {
          where: { usuarioId, perfilId: perfilAdmin.id },
        })) &&
        !(await this.existeAdministradorRecuperavel(manager, null, perfilId))
      ) {
        throw this.ultimoAdministradorException();
      }

      await manager.delete(UsuarioPerfil, { usuarioId, perfilId });
    });
  }

  private async bloquearPerfilAdmin(manager: EntityManager): Promise<Perfil> {
    const perfilAdmin = await manager.findOne(Perfil, {
      where: { codigo: 'ADMIN' },
      lock: { mode: 'pessimistic_write' },
    });
    if (!perfilAdmin) {
      throw new InternalServerErrorException(
        'O perfil ADMIN não está configurado no banco de dados.',
      );
    }
    return perfilAdmin;
  }

  private async existeAdministradorRecuperavel(
    manager: EntityManager,
    excluirUsuarioId: string | null,
    excluirPerfilId: string | null,
  ): Promise<boolean> {
    const administradores = await manager.query<UsuarioIdRow[]>(
      `
        SELECT u.id
        FROM usuarios u
        JOIN usuario_perfis up_admin ON up_admin.usuario_id = u.id
        JOIN perfis perfil_admin ON perfil_admin.id = up_admin.perfil_id
        JOIN usuario_perfis up_permissao ON up_permissao.usuario_id = u.id
        JOIN perfil_permissoes pp ON pp.perfil_id = up_permissao.perfil_id
        JOIN permissoes permissao ON permissao.id = pp.permissao_id
        WHERE u.ativo = TRUE
          AND perfil_admin.codigo = 'ADMIN'
          AND ($1::uuid IS NULL OR u.id <> $1::uuid)
          AND ($2::uuid IS NULL OR up_admin.perfil_id <> $2::uuid)
          AND ($2::uuid IS NULL OR up_permissao.perfil_id <> $2::uuid)
          AND permissao.codigo = ANY($3::varchar[])
        GROUP BY u.id
        HAVING COUNT(DISTINCT permissao.codigo) = $4
      `,
      [
        excluirUsuarioId,
        excluirPerfilId,
        PERMISSOES_RECUPERACAO_ACESSO,
        PERMISSOES_RECUPERACAO_ACESSO.length,
      ],
    );
    return administradores.length > 0;
  }

  private ultimoAdministradorException(): ConflictException {
    return new ConflictException(
      'A operação deixaria o sistema sem um administrador ativo capaz de recuperar o acesso.',
    );
  }

  private toResposta(usuario: Usuario): UsuarioAdminRespostaDto {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      ativo: usuario.ativo,
      criadoEm: usuario.criadoEm.toISOString(),
      atualizadoEm: usuario.atualizadoEm.toISOString(),
    };
  }
}
