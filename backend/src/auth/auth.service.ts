import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { hash } from 'bcrypt';
import { DataSource, QueryFailedError } from 'typeorm';
import { Perfil, Usuario, UsuarioPerfil } from '../database/entities';
import { CadastroDto } from './dto/cadastro.dto';
import { CadastroRespostaDto } from './dto/cadastro-resposta.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async cadastrar(dados: CadastroDto): Promise<CadastroRespostaDto> {
    const email = dados.email.trim().toLowerCase();

    if (Buffer.byteLength(dados.senha, 'utf8') > 72) {
      throw new UnprocessableEntityException(
        'A senha não pode exceder 72 bytes em UTF-8.',
      );
    }

    const usuarioExistente = await this.dataSource
      .getRepository(Usuario)
      .findOneBy({ email });

    if (usuarioExistente) {
      throw this.emailJaCadastrado();
    }

    const senhaHash = await hash(dados.senha, 12);

    try {
      return await this.dataSource.transaction(async (manager) => {
        const perfilLeitor = await manager.findOneBy(Perfil, {
          codigo: 'LEITOR',
        });

        if (!perfilLeitor) {
          throw new InternalServerErrorException(
            'O perfil LEITOR não está cadastrado.',
          );
        }

        const usuario = await manager.save(Usuario, {
          nome: dados.nome.trim(),
          email,
          senhaHash,
          ativo: true,
        });

        await manager.save(UsuarioPerfil, {
          usuarioId: usuario.id,
          perfilId: perfilLeitor.id,
        });

        return {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          ativo: usuario.ativo,
          criadoEm: usuario.criadoEm.toISOString(),
        };
      });
    } catch (error) {
      if (this.isEmailUniqueViolation(error)) {
        throw this.emailJaCadastrado();
      }

      throw error;
    }
  }

  private emailJaCadastrado(): ConflictException {
    return new ConflictException('Já existe uma conta com esse e-mail.');
  }

  private isEmailUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError: unknown = error.driverError;

    return (
      typeof driverError === 'object' &&
      driverError !== null &&
      'code' in driverError &&
      driverError.code === '23505' &&
      'constraint' in driverError &&
      driverError.constraint === 'uq_usuarios_email_ci'
    );
  }
}
