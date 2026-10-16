import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsString,
  ValidateIf,
} from 'class-validator';
import type { PrioridadeEtapa } from '../../database/entities/catalog.entities';

export class AtualizarEtapaDto {
  @ApiPropertyOptional({
    description: 'Nova prioridade da etapa.',
    enum: ['PRINCIPAL', 'CONTEXTO'],
    example: 'CONTEXTO',
  })
  @ValidateIf((_objeto, valor) => valor !== undefined)
  @IsIn(['PRINCIPAL', 'CONTEXTO'])
  prioridade?: PrioridadeEtapa;

  @ApiPropertyOptional({
    description:
      'Justificativa da etapa. Envie null para remover.',
    type: String,
    nullable: true,
    example: 'Complementa o contexto da história.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ValidateIf(
    (_objeto, valor) => valor !== undefined && valor !== null,
  )
  @IsString()
  justificativa?: string | null;
}