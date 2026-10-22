import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class AlterarStatusUsuarioDto {
  @ApiProperty({
    description: 'Define se a conta do usuário deve ficar ativa ou não.',
    example: false,
  })
  @IsBoolean()
  ativo!: boolean;
}
