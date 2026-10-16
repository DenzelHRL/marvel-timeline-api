export class ParticipacaoRespostaDto {
    id: string;
    obraId: string;
    personagemId: string;
    papel: string;
    descricaoPublica: string | null;
    presencaESpoiler: boolean;

    desfechoSpoiler?: string | null;
}