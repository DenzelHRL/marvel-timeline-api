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
import { CadastroRespostaDto } from './dto/cadastro-resposta.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginRespostaDto } from './dto/login-resposta.dto';
import { GoogleAuthGuard } from './google-auth.guard';
import type { GoogleAuthProfile } from './google.strategy';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('cadastro')
  @ApiOperation({
    summary: 'Cadastrar uma conta local',
    description:
      'Cria uma conta ativa com o perfil LEITOR. A senha armazenada como hash.',
  })
  @ApiCreatedResponse({
    description: 'Conta criada.',
    type: CadastroRespostaDto,
  })
  @ApiBadRequestResponse({
    description: 'Nome, e-mail ou senha inválidos.',
  })
  @ApiConflictResponse({
    description: 'Já existe uma conta com esse e-mail.',
  })
  @ApiUnprocessableEntityResponse({
    description: 'A senha excede o limite de 72 bytes em UTF-8 do bcrypt.',
  })
  cadastrar(@Body() dados: CadastroDto): Promise<CadastroRespostaDto> {
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
    type: LoginRespostaDto,
  })
  @ApiBadRequestResponse({
    description: 'E-mail ou senha em formato inválido.',
  })
  @ApiUnauthorizedResponse({
    description:
      'E-mail ou senha incorretos, conta inativa ou conta sem senha local.',
  })
  login(@Body() dados: LoginDto): Promise<LoginRespostaDto> {
    return this.authService.login(dados);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Iniciar autenticação com Google',
    description:
      'Inicia o fluxo OAuth 2.0 e redireciona o navegador para a página de autorização do Google.',
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
    type: LoginRespostaDto,
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
  ): Promise<LoginRespostaDto> {
    return this.authService.loginGoogle(request.user);
  }
}
