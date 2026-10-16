import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { ParticipacaoRepository } from "./participacao.repository";
import { ListarParticipacoesEmObrasDto } from "./dto/participacao.listar-participacao.dto";
import { Participacao, Personagem } from "../database/entities";
import { CriarParticipacaoDto } from "./dto/participacao.criar.dto";
import { ParticipacaoRespostaDto } from "./dto/participacao.resposta.dto";
import { AtualizarParticipacaoDto } from "./dto/participacao.atualizar.dto";

@Injectable()
export class ParticipacaoService{
    constructor (private readonly participacaoRepository: ParticipacaoRepository){}

    async listarParticipacoes(slug: string, consulta: ListarParticipacoesEmObrasDto){
        const obra = await this.participacaoRepository.findObraBySlug(slug);

        if(!obra || obra.status !== 'PUBLICADA'){
            throw new NotFoundException('Obra não encontrada');
        }
        const incluirSpoilers = consulta.incluirSpoilers === true;
        
        const [participacoes, total] = await this.participacaoRepository.findAll({
            obraId: obra.id,
            pagina: consulta.pagina,
            limite: consulta.limite,
            papel: consulta.papel,
            presencaESpoiler: consulta.presencaESpoiler,
            incluirSpoilers,
        });

        return {
            itens: participacoes.map((participacoes: Participacao) => this.toRespostaDto(participacoes, incluirSpoilers)),
            meta:{
                pagina: consulta.pagina,
                limite: consulta.limite,
                total,
                totalPaginas: Math.ceil(total / consulta.limite),
            }
        };
    }

    async buscar(id: string, incluirSpoilers = false): Promise<ParticipacaoRespostaDto>{
        const participacao = await this.participacaoRepository.findById(id);
        
        if(!participacao){
            throw new NotFoundException('Participação não encontrada');
        }

        const obra = await this.participacaoRepository.findObraById(participacao.obraId);

        if(!obra || obra.status !== 'PUBLICADA'){
            throw new NotFoundException('Obra não encontrada');
        }

        if(participacao.presencaESpoiler && !incluirSpoilers){
            throw new NotFoundException('Participação não encontrada');
        }

        return this.toRespostaDto(participacao, incluirSpoilers);
    }

    private toRespostaDto(participacao: Participacao, incluirSpoilers = false): ParticipacaoRespostaDto{
        const resposta: ParticipacaoRespostaDto = {
            id: participacao.id,
            obraId: participacao.obraId,
            personagemId: participacao.personagemId,
            papel: participacao.papel,
            descricaoPublica: participacao.descricaoPublica,
            presencaESpoiler: participacao.presencaESpoiler,
        };
        if(incluirSpoilers){
            resposta.desfechoSpoiler = participacao.desfechoSpoiler;
        }

        return resposta; 
    }

    async criar(obraId: string, dto: CriarParticipacaoDto) {
        const obra = await this.participacaoRepository.findObraById(obraId);
        if(!obra){
            throw new NotFoundException('Obra não encontrada');
        }
        
        const personagem = await this.participacaoRepository.findPersonagemById(dto.personagemId);
        
        if(!personagem){
            throw new NotFoundException('Personagem não encontrado');
        }

        const existente = await this.participacaoRepository.findVinculo(obraId, dto.personagemId);

        if(existente){
            throw new ConflictException('Este personagem já possui uma participação na obra');
        }

        try {
            const participacao = await this.participacaoRepository.create({
                obraId,
                personagemId: dto.personagemId,
                papel: dto.papel,
                descricaoPublica: dto.descricao_publica ?? null,
                presencaESpoiler: dto.presenca_e_spoiler,
                desfechoSpoiler: dto.desfecho_spoiler ?? null,
            });
            return this.toRespostaDto(participacao, true);
        } catch (error) {
            throw new InternalServerErrorException('Erro ao cadastrar participação');
        }
    }

    async editar(id: string, dto: AtualizarParticipacaoDto){
        const participacao = await this.participacaoRepository.findById(id);
        
        if(!participacao){
            throw new NotFoundException('Participação não encontrada');
        }

        if (dto.papel !== undefined) {
            participacao.papel = dto.papel;
        }

        if (dto.descricaoPublica !== undefined) {
            participacao.descricaoPublica = dto.descricaoPublica;
        }

        if (dto.presencaESpoiler !== undefined) {
            participacao.presencaESpoiler = dto.presencaESpoiler;
        }

        if (dto.desfechoSpoiler !== undefined) {
            participacao.desfechoSpoiler = dto.desfechoSpoiler;
        }

        try {
            const atualizada = await this.participacaoRepository.edit(participacao);
            return this.toRespostaDto(atualizada, true);
        } catch (error) {
            throw new InternalServerErrorException('Erro ao atualizar participação');
        }
    }

    async remover(id: string): Promise<void>{
        const participacao = await this.participacaoRepository.findById(id);
        
        if(!participacao){
            throw new NotFoundException('Participação não encontrada');
        }

        try {
            await this.participacaoRepository.remove(participacao);
        } catch (error) {
            throw new InternalServerErrorException('Erro ao remover participação');
        }
    }
}