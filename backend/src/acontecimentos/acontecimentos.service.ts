import { ConflictException, Inject, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { AcontecimentosRepository } from "./acontecimentos.repository";
import { ListarEventosEmObrasDto } from "./dto/acontecimentos.listar-eventos.dto";
import { CriarEventoDto } from "./dto/acontecimentos.criar-evento.dto";
import { AtualizarEventoDto } from "./dto/acontecimentos.atualizar-evento.dto";
import { BuscarPersonagensEmEventosDto } from "./dto/acontecimentos.buscar-personagem.dto";
import { Acontecimento } from "../database/entities";
import { AcontecimentoRespostaDto } from "./dto/acontecimentos.evento-resposta.dto";

@Injectable()
export class AcontecimentosService{
    constructor(private readonly repository: AcontecimentosRepository){}

    private toRespostaDto(acontecimento: Acontecimento): AcontecimentoRespostaDto{
        const resposta: AcontecimentoRespostaDto = {
            id: acontecimento.id,
            obraId: acontecimento.obraId,
            titulo: acontecimento.titulo,
            categoria: acontecimento.categoria,
            posicao: acontecimento.posicao,
            descricao: acontecimento.descricao,
            contemSpoiler: acontecimento.contemSpoiler,
        };
        return resposta; 
    }
    
    async listarEventos(slug: string, consulta: ListarEventosEmObrasDto){
        const obra = await this.repository.findObraBySlug(slug);

        if(!obra || obra.status !== 'PUBLICADA'){
            throw new NotFoundException('Obra não encontrada');
        }
        const incluirSpoilers = consulta.incluirSpoilers === true;

        const [evento, total] = await this.repository.findAll({
            obraId: obra.id,
            pagina: consulta.pagina,
            limite: consulta.limite,
            categoria: consulta.categoria, 
            contemSpoiler: consulta.contemSpoiler, 
            incluirSpoilers
        });
        return{
            obra: {
                id: obra.id,
                titulo: obra.titulo,
                slug: obra.slug
            },
            itens: evento.map((acontecimento: Acontecimento) => this.toRespostaDto(acontecimento)),
            meta:{
                pagina: consulta.pagina,
                limite: consulta.limite,
                total,
                totalPaginas: Math.ceil(total / consulta.limite),
            }
        };
    }

    async buscarEvento(id: string, incluirSpoilers = false){
        const evento = await this.repository.findById(id);

        if(!evento){
            throw new NotFoundException('Acontecimento não encontrado');
        }

        if(evento.contemSpoiler && !incluirSpoilers){
            throw new NotFoundException('Acontecimento não encontrado');
        }

        const obra = await this.repository.findObraById(evento.obraId);

        if (!obra || obra.status !== 'PUBLICADA') {
            throw new NotFoundException('Obra não encontrada');
        }
        return this.toRespostaDto(evento);
    }

    async criarEvento(obraId: string, dados: CriarEventoDto){
        const obra = await this.repository.findObraById(obraId);
        if(!obra){
            throw new NotFoundException('Obra não encontrada');
        }

        const existente = await this.repository.findByObraPosicao(obraId, dados.posicao);

        if(existente){
            throw new ConflictException('Posição já ocupada nesta obra');
        }

        try {
            const evento =  await this.repository.create({
                obraId: obraId,
                titulo: dados.titulo,
                categoria: dados.categoria,
                posicao: dados.posicao,
                descricao: dados.descricao,
                contemSpoiler: dados.spoiler,
            })
            return this.toRespostaDto(evento);
        } catch (error) {
            throw new InternalServerErrorException('Erro ao cadastrar evento');
        }
    }
    
    async editarEvento(id: string, dados: AtualizarEventoDto){
        const evento = await this.repository.findById(id);

        if(!evento){
            throw new NotFoundException('Acontecimento não encontrado');
        }

        if (dados.posicao !== undefined && dados.posicao !== evento.posicao) {
            const existente = await this.repository.findByObraPosicao(evento.obraId, dados.posicao);
            if (existente && existente.id !== evento.id) {
                throw new ConflictException('Posição já ocupada nesta obra');
            }
        }

        if (dados.titulo !== undefined) {
            evento.titulo = dados.titulo;
        }

        if (dados.categoria !== undefined) {
            evento.categoria = dados.categoria;
        }

        if (dados.descricao !== undefined) {
            evento.descricao = dados.descricao;
        }

        if (dados.posicao !== undefined) {
            evento.posicao = dados.posicao;
        }

        if(dados.spoiler !== undefined){
            evento.contemSpoiler = dados.spoiler;
        }

        try {
            const atualizado = await this.repository.edit(evento);
            return this.toRespostaDto(atualizado);
        } catch (error) {
            throw new InternalServerErrorException('Erro ao atualizar evento');
        }
    }

    async removerEvento(id: string){
        const evento = await this.repository.findById(id);

        if(!evento){
            throw new NotFoundException('Acontecimento não encontrado');
        }

        try {
            await this.repository.remove(evento)
        } catch (error) {
            throw new InternalServerErrorException('Erro ao remover evento');
        }
    }

    async buscarPersonagensAssociados(id: string, consulta: BuscarPersonagensEmEventosDto){
        const evento = await this.repository.findById(id);
        if (!evento) {
            throw new NotFoundException('Acontecimento não encontrado');
        }

        if(evento.contemSpoiler && consulta.incluirSpoilers !== true){
            throw new NotFoundException('Acontecimento não encontrado');
        }

        const obra = await this.repository.findObraById(evento.obraId);
        if (!obra || obra.status !== 'PUBLICADA') {
            throw new NotFoundException('Obra não encontrada');
        }

        const [personagens, total] = await this.repository.findPersonagem(id, consulta);
        return {
            itens: personagens.map(personagem => ({
                id: personagem.id,
                slug: personagem.slug,
                nome: personagem.nome,
                descricaoPublica: personagem.descricaoPublica,
                imagemUrl: personagem.imagemUrl,
            })),
            meta: {
                pagina: consulta.pagina,
                limite: consulta.limite,
                total,
                totalPaginas: Math.ceil(total / consulta.limite),
            },
        };
    }

    async associar(id: string, personagemId: string){
        const evento = await this.repository.findById(id);
        if (!evento) {
            throw new NotFoundException('Acontecimento não encontrado');
        }

        const personagem = await this.repository.findPersonagemById(personagemId);
        if (!personagem) {
            throw new NotFoundException('Personagem não encontrado');
        }

        const existente = await this.repository.findVinculo(id, personagemId);
        if (existente) {
            throw new ConflictException('Este personagem já está associado ao acontecimento');
        }

        try {
            return await this.repository.createVinculo(id, personagemId);
        } catch (error) {
            throw new InternalServerErrorException('Erro ao associar personagem ao acontecimento');

        }
    }

    async retirar(id: string, personagemId: string){
        const evento = await this.repository.findById(id);
        if (!evento) {
            throw new NotFoundException('Acontecimento não encontrado');
        }

        const personagem = await this.repository.findPersonagemById(personagemId);
        if (!personagem) {
            throw new NotFoundException('Personagem não encontrado');
        }

        const vinculo = await this.repository.findVinculo(id, personagemId);
        if (!vinculo) {
            throw new NotFoundException('Personagem não associado a este acontecimento');
        }

        try {
            await this.repository.removeVinculo(id, personagemId);
        } catch (error) {
            throw new InternalServerErrorException('Erro ao retirar associação do personagem');
        }
    }
}
