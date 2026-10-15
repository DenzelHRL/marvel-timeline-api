import { Personagem } from "../database/entities";
import { ListarPersonagensDto } from "./dto/personagens.listar-Personagens.dto";

type DadosCriacaoPersonagem = Pick<
    Personagem,
    'slug' | 'nome' | 'descricaoPublica' | 'imagemUrl'
>;

export class PersonagensRepository{
    findAll(consulta: ListarPersonagensDto): Promise<[Personagem[], number]>{
        return;
    }

    findBySlug(slug: string): Promise<Personagem | null>{
        return;
    }

    findById(id: string): Promise<Personagem | null>{
        return;
    }

    create(dados: DadosCriacaoPersonagem): Promise<Personagem>{
        return;
    }

    save(personagem: Personagem): Promise<Personagem>{
        return;
    }
}