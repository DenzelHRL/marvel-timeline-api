import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { DataSource, QueryFailedError } from 'typeorm';
import { Perfil, Usuario, UsuarioPerfil } from '../database/entities';
import { CadastroDto } from './dto/cadastro.dto';
import { CadastroRespostaDto } from './dto/cadastro-resposta.dto';
import { JWT_EXPIRATION_SECONDS } from './auth.constants';
import { LoginDto } from './dto/login.dto';
import { LoginRespostaDto } from './dto/login-resposta.dto';

const HASH_SENHA_INEXISTENTE =
  '$2b$12$glfVOolzfnAYNHDmgHkXAOdR0w8v10uLm6dFY6aglr0.jbsRHBndO';

@Injectable()
export class AuthService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
  ) {}

  async login(dados: LoginDto): Promise<LoginRespostaDto> {
    const email = dados.email.trim().toLowerCase();

    if (Buffer.byteLength(dados.senha, 'utf8') > 72) {
      throw this.credenciaisInvalidas();
    }

    const usuario = await this.dataSource
      .getRepository(Usuario)
      .findOneBy({ email });

    const senhaCorreta = await compare(
      dados.senha,
      usuario?.senhaHash ?? HASH_SENHA_INEXISTENTE,
    );

    if (!usuario?.ativo || !usuario.senhaHash || !senhaCorreta) {
      throw this.credenciaisInvalidas();
    }

    const accessToken = await this.jwtService.signAsync({
      sub: usuario.id,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: JWT_EXPIRATION_SECONDS,
    };
  }

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

  private credenciaisInvalidas(): UnauthorizedException {
    return new UnauthorizedException('E-mail ou senha inválidos.');
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
