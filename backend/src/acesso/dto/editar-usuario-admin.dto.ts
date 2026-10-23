import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class EditarUsuarioAdminDto {
  @ApiPropertyOptional({
    description: 'Novo nome exibido na conta.',
    example: 'Maria Silva',
    maxLength: 160,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  nome?: string;

  @ApiPropertyOptional({
    description:
      'Novo e-mail da conta.',
    example: 'maria@exemplo.test',
    format: 'email',
    maxLength: 254,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((_object, value) => value !== undefined)
  @IsEmail()
  @MaxLength(254)
  email?: string;
}
