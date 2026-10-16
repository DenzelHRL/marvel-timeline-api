import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CriarTrilhaDto {
  @ApiProperty({
    example: 'Minha trilha Marvel',
    maxLength: 200,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nome!: string;

  @ApiProperty({
    example: 'minha-trilha-marvel',
    maxLength: 160,
    description: 'Letras minúsculas e números separados por hífen.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'slug deve conter letras minúsculas e números separados por hífen.',
  })
  slug!: string;

  @ApiProperty({
    example: 'Uma seleção de obras para acompanhar a história.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  descricao!: string;
}