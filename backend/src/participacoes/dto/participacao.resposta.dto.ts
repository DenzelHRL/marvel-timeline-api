import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class ParticipacaoRespostaDto {
    @ApiProperty({
      description: 'Identificador da participação',
      format: 'uuid',
    })
    id: string;
    @ApiProperty({
      description: 'Identificador da obra vinculada à participação',
      format: 'uuid',
    })
    obraId: string;
    @ApiProperty({
      description: 'Identificador do personagem vinculado à participação',
      format: 'uuid',
    })
    personagemId: string;
    @ApiProperty({
      description: 'Papel desempenhado pelo personagem na obra',
      maxLength: 40,
    })
    papel: string;
    @ApiProperty({
      description: 'Descrição pública da participação, sem spoilers. Pode retornar null',
    })
    descricaoPublica: string | null;
    @ApiProperty({
      description: 'Indica se a presença do personagem na obra é um spoiler',
    })
    presencaESpoiler: boolean;

    @ApiPropertyOptional({
      description: 'Desfecho com spoilers, incluído nas consultas quando incluirSpoilers=true e nas respostas de criação e atualização. Pode retornar null',
    })
    desfechoSpoiler?: string | null;
}
