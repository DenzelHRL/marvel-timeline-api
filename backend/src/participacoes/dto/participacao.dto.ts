import { IsBoolean, IsString, IsUUID } from "class-validator";

export class ParticipacaoDto{
    @IsUUID()
    obraId: string;

    @IsUUID()
    personagemId: string;

    @IsString()
    papel: string;

    @IsString()
    descricao_publica: string;

    @IsBoolean()
    presenca_e_spoiler: boolean;

    @IsString()
    desfecho_spoiler: string;
}