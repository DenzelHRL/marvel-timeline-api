import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { CadastroDto } from './dto/cadastro.dto';
import { CadastroRespostaDto } from './dto/cadastro-resposta.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginRespostaDto } from './dto/login-resposta.dto';

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
    description: 'E-mail ou senha incorretos, conta inativa ou conta sem senha local.',
  })
  login(@Body() dados: LoginDto): Promise<LoginRespostaDto> {
    return this.authService.login(dados);
  }
}
