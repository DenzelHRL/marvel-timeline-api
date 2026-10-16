import { Inject, Injectable } from "@nestjs/common";
import { AcontecimentosRepository } from "./acontecimentos.repository";
import { ListarEventosEmObrasDto } from "./dto/acontecimentos.listar-eventos.dto";
import { CriarEventoDto } from "./dto/acontecimentos.criar-evento.dto";
import { AtualizarEventoDto } from "./dto/acontecimentos.atualizar-evento.dto";
import { BuscarPersonagensEmEventosDto } from "./dto/acontecimentos.buscar-personagem.dto";

@Injectable()
export class AcontecimentosService{
    constructor(private readonly repository: AcontecimentosRepository){}
    
    async listarEventos(slug: string, consulta: ListarEventosEmObrasDto){
        return;
    }

    async buscarEvento(id: string){
        return;
    }

    async criarEvento(obraId: string, dados: CriarEventoDto){
        return;
    }
    
    async editarEvento(id: string, dados: AtualizarEventoDto){
        return;
    }

    async removerEvento(id: string){}

    async buscarPersonagensAssociados(id: string, consulta: BuscarPersonagensEmEventosDto){
        return;
    }

    async associar(id: string, personagemId: string){
        return;
    }

    async retirar(id: string, personagemId: string){}
}