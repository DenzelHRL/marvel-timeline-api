import { ApiProperty } from '@nestjs/swagger';
import { EtapaRespostaDto } from './listar-etapas-resposta.dto';

export class ItemMapaDto extends EtapaRespostaDto {
  @ApiProperty({ example: 'vingadores-guerra-infinita' })
  obraSlug!: string;

  @ApiProperty({ example: 'Vingadores: Guerra Infinita' })
  titulo!: string;

  @ApiProperty({ type: String, nullable: true })
  imagemUrl!: string | null;

  @ApiProperty({
    example: 'Os Vingadores enfrentam uma ameaça de escala universal.',
  })
  resumoSemSpoiler!: string;
}

export class MapaTrilhaRespostaDto {
  @ApiProperty({ type: [ItemMapaDto] })
  dados!: ItemMapaDto[];

  @ApiProperty({ example: 21, minimum: 0 })
  total!: number;

  @ApiProperty({ example: 1, minimum: 1 })
  pagina!: number;

  @ApiProperty({ example: 20, minimum: 1, maximum: 50 })
  limite!: number;

  @ApiProperty({ example: 2, minimum: 0 })
  totalPaginas!: number;
}