import { IsBoolean, IsOptional, IsString, IsUUID, Matches, MaxLength, ValidateIf,} from 'class-validator';

export class AtualizarParticipacaoDto {
    @ValidateIf((_objeto, valor) => valor !== undefined)
    @IsString()
    @MaxLength(40)
    @Matches(/\S/, {message: 'O papel não pode estar vazio.'})
    papel?: string;

    @IsOptional()
    @IsString()
    descricaoPublica?: string | null;

    @ValidateIf((_objeto, valor) => valor !== undefined)
    @IsBoolean()
    presencaESpoiler?: boolean;

    @IsOptional()
    @IsString()
    desfechoSpoiler?: string | null;

}