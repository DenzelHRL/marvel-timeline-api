import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, Matches, MaxLength } from "class-validator";

export class CriarParticipacaoDto{
    @IsUUID()
    @ApiProperty({
      description: 'Identificador do personagem que será vinculado à obra',
      format: 'uuid',
    })
    personagemId: string;

    @IsString()
    @MaxLength(40)
    @Matches(/\S/, {message: 'O papel não pode estar vazio'})
    @ApiProperty({
      description: 'Papel desempenhado pelo personagem na obra',
      maxLength: 40,
    })
    papel: string;

    @IsOptional()
    @IsString()
    @ApiPropertyOptional({
      description: 'Descrição pública da participação, sem spoilers. Aceita null',
    })
    descricao_publica?: string | null;

    @IsBoolean()
    @ApiPropertyOptional({
      description: 'Indica se a presença do personagem na obra é um spoiler. Padrão: false',
    })
    presenca_e_spoiler = false;

    @IsOptional()
    @IsString()
    @ApiPropertyOptional({
      description: 'Desfecho da participação que contém spoilers. Aceita null',
    })
    desfecho_spoiler?: string | null;
}
