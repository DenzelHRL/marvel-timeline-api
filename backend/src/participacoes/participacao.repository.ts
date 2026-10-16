import { Injectable } from "@nestjs/common";
import { Obra, Participacao, Personagem } from "../database/entities";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, ILike, Repository } from "typeorm";
import { ForeignKey } from "typeorm/browser";

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
    constructor(
        @InjectRepository(Participacao)
        private readonly participacaoRepository: Repository<Participacao>,
        
        @InjectRepository(Personagem)
        private readonly personagemRepository: Repository<Personagem>,

        @InjectRepository(Obra)
        private readonly obraRepository: Repository<Obra>
    ){}

    // Obra
    findObraBySlug(slug:string): Promise<Obra | null>{
        return this.obraRepository.findOne({where: {slug}});
    }

    findObraById(obraId:string): Promise<Obra | null>{
        const id = obraId;
        return this.obraRepository.findOne({where: {id}});
    }

    // Personagens
    findPersonagemById(personagemId: string): Promise<Personagem | null>{
        const id = personagemId;
        return this.personagemRepository.findOne({where: {id}});
    }
    
    // Participações
    findAll(consulta: ConsultaParticipacoes): Promise<[Participacao[], number]>{
        const incluirSpoilers = consulta.incluirSpoilers === true;

        if(!incluirSpoilers && consulta.presencaESpoiler === true){
            return Promise.resolve<[Participacao[], number]>([[], 0]);
        }

        const where: FindOptionsWhere<Participacao> = {};
        
        if(consulta.papel !== undefined){
            where.papel = ILike(`%${consulta.papel}%`);
        }

        if(consulta.obraId !== undefined){
            where.obraId = consulta.obraId;
        }

        if(!incluirSpoilers){
            where.presencaESpoiler = false;
        }else if(consulta.presencaESpoiler !== undefined){
            where.presencaESpoiler = consulta.presencaESpoiler;
        }
        
        return this.participacaoRepository.findAndCount({
            where,
            order: {papel: 'ASC', id: 'ASC'},
            skip: (consulta.pagina - 1) * consulta.limite,
            take: consulta.limite
        });
    }

    findById(id: string): Promise<Participacao | null>{
        return this.participacaoRepository.findOne({where: {id}});
    }

    findVinculo(obraId:string, personagemId: string): Promise<Participacao | null>{
        return this.participacaoRepository.findOne({
            where: {obraId, personagemId}
        });
    }

    create(dados: DadosCriacaoParticipacao): Promise<Participacao>{
        const participacao = this.participacaoRepository.create(dados);
        
        return this.participacaoRepository.save(participacao);
    }

    edit(participacao: Participacao): Promise<Participacao>{
        return this.participacaoRepository.save(participacao);
    }

    async remove(participacao: Participacao): Promise<void>{
        await this.participacaoRepository.delete(participacao.id);
    }
}