import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Acontecimento, AcontecimentoPersonagem, Obra, Personagem } from "../database/entities";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, ILike, Repository } from "typeorm";
import { BuscarPersonagensEmEventosDto } from "./dto/acontecimentos.buscar-personagem.dto";

type ConsultaEventos = {
    obraId: string;
    pagina: number;
    limite: number;
    categoria?: string;
    contemSpoiler?: boolean;
    incluirSpoilers: boolean;
}

type DadosCriacaoEvento  = Pick<
    Acontecimento,
  | 'titulo'
  | 'obraId'
  | 'categoria'
  | 'contemSpoiler'
  | 'descricao'
  | 'posicao'

>;
@Injectable()
export class AcontecimentosRepository{
    constructor(
        @InjectRepository(Acontecimento)
        private readonly acontecimentoRepository: Repository<Acontecimento>,

        @InjectRepository(Personagem)
        private readonly personagemRepository: Repository<Personagem>,

        @InjectRepository(AcontecimentoPersonagem)
        private readonly vinculoRepository: Repository<AcontecimentoPersonagem>,

        @InjectRepository(Obra)
        private readonly obraRepository: Repository<Obra>
    ){}

    // Obra
    findObraBySlug(slug:string): Promise<Obra | null>{
        return this.obraRepository.findOne({where: {slug}});
    }
    findObraById(obraId: string): Promise<Obra | null>{
        const id = obraId;
        return this.obraRepository.findOne({where: {id}});
    }

    // Acontecimentos
    findById(id: string): Promise<Acontecimento | null>{
        return this.acontecimentoRepository.findOne({where: {id}});
    }
    
    findByObraPosicao(obraId: string, posicao: number): Promise<Acontecimento | null>{
        return this.acontecimentoRepository.findOne({where: {obraId, posicao}});
    }

    findAll(consulta: ConsultaEventos): Promise<[Acontecimento[], number]>{
        const incluirSpoilers = consulta.incluirSpoilers === true;

        if(!incluirSpoilers && consulta.contemSpoiler === true){
            return Promise.resolve<[Acontecimento[], number]>([[], 0]);
        }

        const where: FindOptionsWhere<Acontecimento> = {};

        if(consulta.categoria !== undefined){
            where.categoria = ILike(`%${consulta.categoria}%`);
        }

        if(consulta.obraId !== undefined){
            where.obraId = consulta.obraId;
        }

        if(!incluirSpoilers){
            where.contemSpoiler = false;
        }else if(consulta.contemSpoiler !== undefined){
            where.contemSpoiler = consulta.contemSpoiler;
        }
        
        return this.acontecimentoRepository.findAndCount({
            where,
            order: {posicao: 'ASC', id: 'ASC'},
            skip: (consulta.pagina - 1) * consulta.limite,
            take: consulta.limite
        });
    }

    create(dados: DadosCriacaoEvento): Promise<Acontecimento>{
        const evento = this.acontecimentoRepository.create(dados);
        
        return this.acontecimentoRepository.save(evento);
    }

    edit(evento: Acontecimento): Promise<Acontecimento>{
        return this.acontecimentoRepository.save(evento);
    }

    async remove(evento: Acontecimento): Promise<void>{
        await this.acontecimentoRepository.manager.transaction(async (manager) => {
            await manager.delete(AcontecimentoPersonagem, { acontecimentoId: evento.id });
            await manager.delete(Acontecimento, { id: evento.id });
        });
    }

    // Associação
    findPersonagem(
        idEvento: string, consulta: BuscarPersonagensEmEventosDto
    ): Promise<[Personagem[], number]>{
        const associacao = this.personagemRepository
        .createQueryBuilder('personagem')
        .innerJoin(
            AcontecimentoPersonagem,
            'vinculo',
            'vinculo.personagemId = personagem.id'
        )
        .where('vinculo.acontecimentoId = :idEvento', {
            idEvento
        });

        if(consulta.nome !== undefined){
            associacao.andWhere('personagem.nome ILIKE :nome',{
                nome: `%${consulta.nome}%`
            });
        }

        if (consulta.slug !== undefined) {
            associacao.andWhere('personagem.slug ILIKE :slug', {
                slug: `%${consulta.slug}%`,
            });
        }

        return associacao.orderBy('personagem.nome', 'ASC')
        .addOrderBy('personagem.id', 'ASC')
        .skip((consulta.pagina - 1) * consulta.limite)
        .take(consulta.limite)
        .getManyAndCount();
    }

    findPersonagemById(id: string): Promise<Personagem | null>{
        return this.personagemRepository.findOne({where: {id}});
    }

    findVinculo(
        acontecimentoId: string, personagemId: string
    ):  Promise<AcontecimentoPersonagem | null>{
        return this.vinculoRepository.findOne({
            where: {acontecimentoId, personagemId}
        });
    }

    async createVinculo(
        acontecimentoId: string, personagemId: string
    ): Promise<AcontecimentoPersonagem>{
        const vinculo = this.vinculoRepository.create({acontecimentoId, personagemId});

        return await this.vinculoRepository.save(vinculo);
    }
    
    async removeVinculo(
        acontecimentoId: string, personagemId: string
    ): Promise<void>{
        await this.vinculoRepository.delete({acontecimentoId, personagemId});
    }
}
