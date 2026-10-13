import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'E-mail da conta; espaços externos são ignorados.',
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
    description: 'Senha da conta.',
    format: 'password',
    writeOnly: true,
  })
  @IsString()
  @IsNotEmpty()
  senha: string;
}
