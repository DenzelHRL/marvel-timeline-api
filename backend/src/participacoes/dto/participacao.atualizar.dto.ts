import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, Matches, MaxLength, ValidateIf,} from 'class-validator';

export class AtualizarParticipacaoDto {
    @ValidateIf((_objeto, valor) => valor !== undefined)
    @IsString()
    @MaxLength(40)
    @Matches(/\S/, {message: 'O papel não pode estar vazio'})
    @ApiPropertyOptional({
      description: 'Papel desempenhado pelo personagem na obra',
      maxLength: 40,
    })
    papel?: string;

    @IsOptional()
    @IsString()
    @ApiPropertyOptional({
      description: 'Descrição pública da participação, sem spoilers. Envie null para limpar o campo',
    })
    descricaoPublica?: string | null;

    @ValidateIf((_objeto, valor) => valor !== undefined)
    @IsBoolean()
    @ApiPropertyOptional({
      description: 'Indica se a presença do personagem na obra é um spoiler',
    })
    presencaESpoiler?: boolean;

    @IsOptional()
    @IsString()
    @ApiPropertyOptional({
      description: 'Desfecho da participação que contém spoilers. Envie null para limpar o campo',
    })
    desfechoSpoiler?: string | null;

}
