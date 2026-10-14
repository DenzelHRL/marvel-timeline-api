import { ApiProperty } from '@nestjs/swagger';

export class EtapaRespostaDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  trilhaId!: string;

  @ApiProperty({ format: 'uuid' })
  obraId!: string;

  @ApiProperty({ example: 1, minimum: 1 })
  posicao!: number;

  @ApiProperty({
    enum: ['PRINCIPAL', 'CONTEXTO'],
    example: 'PRINCIPAL',
  })
  prioridade!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: null,
  })
  justificativa!: string | null;
}

export class ListarEtapasRespostaDto {
  @ApiProperty({ type: [EtapaRespostaDto] })
  dados!: EtapaRespostaDto[];

  @ApiProperty({ example: 21, minimum: 0 })
  total!: number;

  @ApiProperty({ example: 1, minimum: 1 })
  pagina!: number;

  @ApiProperty({ example: 20, minimum: 1, maximum: 50 })
  limite!: number;

  @ApiProperty({ example: 2, minimum: 0 })
  totalPaginas!: number;
}