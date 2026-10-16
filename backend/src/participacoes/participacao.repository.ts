import { Injectable } from "@nestjs/common";
import { Obra, Participacao, Personagem } from "../database/entities";

type ConsultaParticipacoes = {
    obraId: string;
    pagina: number;
    limite: number;
    papel?: string;
    presencaESpoiler?: boolean;
    incluirSpoilers: boolean;
}

type DadosCriacaoParticipacao  = Pick<
    Participacao,
  | 'obraId'
  | 'personagemId'
  | 'papel'
  | 'descricaoPublica'
  | 'presencaESpoiler'
  | 'desfechoSpoiler'

>;
@Injectable()
export class ParticipacaoRepository{
    // Obra
    findObraBySlug(slug:string): Promise<Obra | null>{
        
    }

    findObraById(obraId:string): Promise<Obra | null>{}

    // Personagens
    findPersonagemById(personagemId: string): Promise<Personagem | null>{}
    
    // Participações
    findAll(consulta: ConsultaParticipacoes): Promise<Participacao[], number>{}

    findById(id: string): Promise<Participacao | null>{}

    findVinculo(obraId:string, personagemId: string): Promise<Participacao | null>{}

    create(dados: DadosCriacaoParticipacao): Promise<Participacao>{}

    edit(participacao: Participacao): Promise<Participacao>{}

    remove(participacao: Participacao): void{}
}