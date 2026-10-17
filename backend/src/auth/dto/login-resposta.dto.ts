import { ApiProperty } from '@nestjs/swagger';

export class LoginRespostaDto {
  @ApiProperty({
    description: 'Token de acesso JWT com HS256.',
    format: 'JWT',
  })
  accessToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: string;

  @ApiProperty({
    description: 'Validade do token em segundos.',
    example: 3600,
  })
  expiresIn: number;
}
