import { ApiProperty } from '@nestjs/swagger';
import { ItemMapaDto } from './mapa-trilha-resposta.dto';

export class ObraNaTrilhaRespostaDto {
  @ApiProperty({
    type: () => ItemMapaDto,
    description: 'Obra publicada consultada dentro da trilha.',
  })
  atual!: ItemMapaDto;

  @ApiProperty({
    type: () => ItemMapaDto,
    nullable: true,
    description:
      'Obra publicada anterior, ou null quando não houver.',
  })
  anterior!: ItemMapaDto | null;

  @ApiProperty({
    type: () => ItemMapaDto,
    nullable: true,
    description:
      'Próxima obra publicada, ou null quando não houver.',
  })
  proxima!: ItemMapaDto | null;
}