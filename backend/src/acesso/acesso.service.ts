import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Usuario } from '../database/entities';
import {
  ListarUsuariosDto,
  ListarUsuariosRespostaDto,
  UsuarioAdminRespostaDto,
} from './dto';

@Injectable()
export class AcessoService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
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
