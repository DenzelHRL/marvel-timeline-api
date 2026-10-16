import { ApiProperty } from '@nestjs/swagger';
export class PersonagemRespostaDto {
  @ApiProperty({
    description: 'Identificador do personagem',
    format: 'uuid',
  })
  id: string;
  @ApiProperty({
    description: 'Identificador textual do personagem',
    maxLength: 160,
  })
  slug: string;
  @ApiProperty({
    description: 'Nome do personagem',
    maxLength: 200,
  })
  nome: string;
  @ApiProperty({
    description: 'Descrição pública do personagem, sem spoilers. Pode retornar null',
  })
  descricaoPublica: string | null;
  @ApiProperty({
    description: 'URL da imagem do personagem. Pode retornar null',
  })
  imagemUrl: string | null;
}
