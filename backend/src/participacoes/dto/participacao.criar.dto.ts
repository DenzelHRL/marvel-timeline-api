import { IsBoolean, IsOptional, IsString, IsUUID, Matches, MaxLength } from "class-validator";

export class CriarParticipacaoDto{
    @IsUUID()
    personagemId: string;

    @IsString()
    @MaxLength(40)
    @Matches(/\S/, {message: 'O papel não pode estar vazio.'})
    papel: string;

    @IsOptional()
    @IsString()
    descricao_publica?: string | null;

    @IsBoolean()
    presenca_e_spoiler = false;

    @IsOptional()
    @IsString()
    desfecho_spoiler?: string | null;
}