import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';
import type { PrioridadeEtapa } from '../../database/entities/catalog.entities';

export class CriarEtapaDto {
  @ApiProperty({
    format: 'uuid',
    description: 'ID da obra que será vinculada à trilha.',
  })
  @IsUUID()
  obraId!: string;

  @ApiProperty({
    example: 1,
    minimum: 1,
    description: 'Posição em que a obra será inserida.',
  })
  @IsInt()
  @Min(1)
  posicao!: number;

  @ApiProperty({
    enum: ['PRINCIPAL', 'CONTEXTO'],
    example: 'PRINCIPAL',
  })
  @IsIn(['PRINCIPAL', 'CONTEXTO'])
  prioridade!: PrioridadeEtapa;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Ajuda a compreender os acontecimentos seguintes.',
  })
  @ValidateIf((_objeto, valor) =>
    valor !== undefined && valor !== null,
  )
  @IsString()
  justificativa?: string | null;
}