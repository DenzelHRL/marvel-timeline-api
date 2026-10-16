import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class AtualizarTrilhaDto {
  @ApiPropertyOptional({
    example: 'Trilha Marvel atualizada',
    maxLength: 200,
  })
  @ValidateIf((_objeto, valor) => valor !== undefined)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nome?: string;

  @ApiPropertyOptional({
    example: 'trilha-marvel-atualizada',
    maxLength: 160,
  })
  @ValidateIf((_objeto, valor) => valor !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'slug deve conter letras minúsculas e números separados por hífen.',
  })
  slug?: string;

  @ApiPropertyOptional({
    example: 'Descrição atualizada da seleção de obras.',
  })
  @ValidateIf((_objeto, valor) => valor !== undefined)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  descricao?: string;
}