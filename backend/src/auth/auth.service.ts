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
import {
  IdentidadeExterna,
  Perfil,
  Usuario,
  UsuarioPerfil,
} from '../database/entities';
import { CadastroDto } from './dto/cadastro.dto';
import { JWT_EXPIRATION_SECONDS } from './auth.constants';
import { LoginDto } from './dto/login.dto';
import type { CadastroResposta, LoginResposta } from './auth.types';
import type { GoogleAuthProfile } from './google/google.strategy';

const HASH_SENHA_INEXISTENTE =
  '$2b$12$glfVOolzfnAYNHDmgHkXAOdR0w8v10uLm6dFY6aglr0.jbsRHBndO';

@Injectable()
export class AuthService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
  ) {}

  async login(dados: LoginDto): Promise<LoginResposta> {
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

    return this.emitirToken(usuario.id);
  }

  async loginGoogle(perfil: GoogleAuthProfile): Promise<LoginResposta> {
    const email = perfil.email.trim().toLowerCase();
    const nome = perfil.nome.trim().slice(0, 160) || email.split('@')[0];

    if (
      !perfil.id ||
      !email ||
      Buffer.byteLength(email, 'utf8') > 254 ||
      !nome
    ) {
      throw new UnauthorizedException(
        'O perfil recebido do Google está incompleto ou inválido.',
      );
    }

    try {
      const usuarioId = await this.dataSource.transaction(async (manager) => {
        const identidade = await manager.findOneBy(IdentidadeExterna, {
          provedor: 'google',
          idNoProvedor: perfil.id,
        });

        if (identidade) {
          const usuario = await manager.findOneBy(Usuario, {
            id: identidade.usuarioId,
          });

          if (!usuario) {
            throw new InternalServerErrorException(
              'A identidade Google está vinculada a uma conta inexistente.',
            );
          }
          if (!usuario.ativo) {
            throw this.credenciaisInvalidas();
          }

          return usuario.id;
        }

        const usuarioExistente = await manager.findOneBy(Usuario, { email });
        if (usuarioExistente) {
          throw new ConflictException(
            'Este e-mail já pertence a uma conta. O login Google não vincula contas automaticamente.',
          );
        }

        const perfilLeitor = await manager.findOneBy(Perfil, {
          codigo: 'LEITOR',
        });
        if (!perfilLeitor) {
          throw new InternalServerErrorException(
            'O perfil LEITOR não está cadastrado.',
          );
        }

        const usuario = await manager.save(Usuario, {
          nome,
          email,
          senhaHash: null,
          ativo: true,
        });

        await manager.save(IdentidadeExterna, {
          usuarioId: usuario.id,
          provedor: 'google',
          idNoProvedor: perfil.id,
        });
        await manager.save(UsuarioPerfil, {
          usuarioId: usuario.id,
          perfilId: perfilLeitor.id,
        });

        return usuario.id;
      });

      return this.emitirToken(usuarioId);
    } catch (error) {
      if (this.isUniqueViolation(error, 'uq_identidades_provedor_id')) {
        const identidade = await this.dataSource
          .getRepository(IdentidadeExterna)
          .findOneBy({ provedor: 'google', idNoProvedor: perfil.id });

        if (identidade) {
          const usuario = await this.dataSource
            .getRepository(Usuario)
            .findOneBy({ id: identidade.usuarioId });

          if (!usuario) {
            throw new InternalServerErrorException(
              'A identidade Google está vinculada a uma conta inexistente.',
            );
          }
          if (!usuario.ativo) {
            throw this.credenciaisInvalidas();
          }

          return this.emitirToken(usuario.id);
        }
      }

      if (
        this.isEmailUniqueViolation(error) ||
        this.isUniqueViolation(error, 'uq_identidades_usuario_provedor')
      ) {
        throw new ConflictException(
          'Este e-mail ou identidade externa já está vinculado a outra conta.',
        );
      }

      throw error;
    }
  }

  async cadastrar(dados: CadastroDto): Promise<CadastroResposta> {
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

  private async emitirToken(usuarioId: string): Promise<LoginResposta> {
    const accessToken = await this.jwtService.signAsync({ sub: usuarioId });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: JWT_EXPIRATION_SECONDS,
    };
  }

  private isEmailUniqueViolation(error: unknown): boolean {
    return this.isUniqueViolation(error, 'uq_usuarios_email_ci');
  }

  private isUniqueViolation(error: unknown, constraint: string): boolean {
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
      driverError.constraint === constraint
    );
  }
}
