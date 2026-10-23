import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CadastroDto {
  @ApiProperty({
    description: 'Nome exibido na conta.',
    example: 'Maria Silva',
    maxLength: 160,
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  nome: string;

  @ApiProperty({
    description:
      'E-mail da conta. Espaços externos são removidos.',
    example: 'maria@exemplo.test',
    format: 'email',
    maxLength: 254,
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({
    description:
      'Senha com pelo menos 8 caracteres.',
    minLength: 8,
    format: 'password',
    writeOnly: true,
  })
  @IsString()
  @MinLength(8)
  senha: string;
}
