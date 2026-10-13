import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { CadastroDto } from './dto/cadastro.dto';
import { CadastroRespostaDto } from './dto/cadastro-resposta.dto';
import { AuthService } from './auth.service';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('cadastro')
  @ApiOperation({
    summary: 'Cadastrar uma conta local',
    description:
      'Cria uma conta ativa com o perfil LEITOR. A senha é armazenada somente como hash.',
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
}
