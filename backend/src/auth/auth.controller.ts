import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { CadastroDto } from './dto/cadastro.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import type { CadastroResposta, LoginResposta } from './auth.types';
import { GoogleAuthGuard } from './google/google-auth.guard';
import type { GoogleAuthProfile } from './google/google.strategy';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('cadastro')
  @ApiOperation({
    summary: 'Cadastrar uma conta local',
    description:
      'Cria uma conta ativa com o perfil LEITOR.',
  })
  @ApiCreatedResponse({
    description: 'Conta criada.',
  })
  @ApiBadRequestResponse({
    description: 'Nome, e-mail ou senha inválidos.',
  })
  @ApiConflictResponse({
    description: 'Já existe uma conta com esse e-mail.',
  })
  @ApiUnprocessableEntityResponse({
    description: 'A senha excedeu o limite.',
  })
  cadastrar(@Body() dados: CadastroDto): Promise<CadastroResposta> {
    return this.authService.cadastrar(dados);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sessão com e-mail e senha',
    description:
      'Autentica uma conta local ativa e retorna um token JWT com o identificador do usuário.',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Autenticação concluída.',
  })
  @ApiBadRequestResponse({
    description: 'E-mail ou senha em formato inválido.',
  })
  @ApiUnauthorizedResponse({
    description:
      'E-mail ou senha incorretos, conta inativa ou conta sem senha local.',
  })
  login(@Body() dados: LoginDto): Promise<LoginResposta> {
    return this.authService.login(dados);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Iniciar autenticação com Google',
    description:
      'Copie http://localhost:3000/auth/google em uma nova guia do navegador. Escolha sua conta de google que eu tinha pedido antes (Corretor, passe o email pelo chat do teams de um dos membros que adicionamos você no OAuth). O endpoint de callback é o que vai aparecer depois de escolher a conta, junto dele o token. Cole esse token no authorize e você estará logado com sua conta',
  })
  @ApiFoundResponse({
    description: 'Redirecionamento para a autorização do Google.',
  })
  @ApiServiceUnavailableResponse({
    description: 'As credenciais OAuth do Google não estão configuradas.',
  })
  iniciarLoginGoogle(): void {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Concluir autenticação com Google',
    description:
      'Valida o retorno OAuth, associa a identidade Google e retorna um token JWT.',
  })
  @ApiOkResponse({
    description: 'Autenticação Google concluída.',
  })
  @ApiConflictResponse({
    description:
      'O e-mail já pertence a uma conta existente; o login Google não vincula contas automaticamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'A identidade Google está inválida ou a conta está inativa.',
  })
  @ApiServiceUnavailableResponse({
    description: 'As credenciais OAuth do Google não estão configuradas.',
  })
  concluirLoginGoogle(
    @Req() request: Request & { user: GoogleAuthProfile },
  ): Promise<LoginResposta> {
    return this.authService.loginGoogle(request.user);
  }
}
