import { Injectable } from "@nestjs/common";
import { Personagem } from "../database/entities";
import { ListarPersonagensDto } from "./dto/personagens.listar-Personagens.dto";
import { FindOptionsWhere, ILike, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

type DadosCriacaoPersonagem = Pick<
    Personagem,
    'slug' | 'nome' | 'descricaoPublica' | 'imagemUrl'
>;

@Injectable()
export class PersonagensRepository{
    constructor(
        @InjectRepository(Personagem)
        private readonly repository: Repository<Personagem>
    ){}

    findAll(consulta: ListarPersonagensDto): Promise<[Personagem[], number]>{
        const where: FindOptionsWhere<Personagem> = {};
        if(consulta.nome !== undefined){
            where.nome = ILike(`%${consulta.nome}%`);
        }

        if(consulta.slug !== undefined){
            where.slug = consulta.slug;
        }

        return this.repository.findAndCount({
            where,
            order: {nome: 'ASC', id: 'ASC'},
            skip: (consulta.pagina - 1) * consulta.limite,
            take: consulta.limite
        });
    }

    findBySlug(slug: string): Promise<Personagem | null>{
        return this.repository.findOne({ where: {slug}});
    }

    findById(id: string): Promise<Personagem | null>{
        return this.repository.findOne({ where: {id}});
    }

    create(dados: DadosCriacaoPersonagem): Promise<Personagem>{
        const personagem = this.repository.create(dados);

        return this.repository.save(personagem);
    }

    edit(personagem: Personagem): Promise<Personagem>{
        return this.repository.save(personagem);
    }
}