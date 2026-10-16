import { BadRequestException, ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PersonagensRepository } from "./personagens.repository";
import { ListarPersonagensDto } from "./dto/personagens.listar-Personagens.dto";
import { PersonagemRespostaDto } from "./dto/personagens.resposta.dto";
import { Personagem } from "../database/entities";
import { CriarPersonagemDto } from "./dto/personagens.criar-personagem.dto";
import { AtualizarPersonagemDto } from "./dto/personagens.atualizar-personagem.dto";

@Injectable()
export class PersonagensService{
    constructor(private readonly personagensRepository: PersonagensRepository){}

    async listarTodos(consulta: ListarPersonagensDto){
        const [personagens, total] = await this.personagensRepository.findAll(consulta);

        return {
            itens: personagens.map((personagem: Personagem) => this.toRespostaDto(personagem)),
            meta:{
                pagina: consulta.pagina,
                limite: consulta.limite,
                total,
                totalPag: Math.ceil(total / consulta.limite),
            }
        };
    }

    async buscar(slug: string): Promise<PersonagemRespostaDto>{
        const personagem = await this.personagensRepository.findBySlug(slug);

        if(!personagem){
            throw new NotFoundException('Personagem não encontrado');
        }

        return this.toRespostaDto(personagem);
    }

    private toRespostaDto(personagem: Personagem): PersonagemRespostaDto{
        return{
            id: personagem.id,
            slug: personagem.slug,
            nome: personagem.nome,
            descricaoPublica: personagem.descricaoPublica,
            imagemUrl: personagem.imagemUrl
        };
    }

    async criar(dto: CriarPersonagemDto): Promise<PersonagemRespostaDto>{
        
        const existente = await this.personagensRepository.findBySlug(dto.slug);

        if(existente){
            throw new ConflictException('Personagem já existente');
        }

        try{
            const personagem = await this.personagensRepository.create({
                slug: dto.slug,
                nome: dto.nome,
                descricaoPublica: dto.descricaoPublica ?? null,
                imagemUrl: dto.imagemUrl ?? null
            });
            return this.toRespostaDto(personagem);
        } catch(erro: unknown){
            throw new InternalServerErrorException('Erro ao realizar a persistência');
        }
    }

    async atualizar(id: string, dto: AtualizarPersonagemDto): Promise<PersonagemRespostaDto>{
        const personagem = await this.personagensRepository.findById(id);

        if(!personagem){
            throw new NotFoundException('Personagem não encontrado');
        }

        if(dto.slug !== undefined && dto.slug !== personagem.slug){
            const slugExistente = await this.personagensRepository.findBySlug(dto.slug);
            if(slugExistente){
                throw new ConflictException('Slug já utilizado');
            }

            personagem.slug = dto.slug;
        }
        try{
            // Atualizar outros campos do personagem
            if(dto.nome !== undefined) personagem.nome = dto.nome;
            if(dto.descricaoPublica !== undefined) personagem.descricaoPublica = dto.descricaoPublica;
            if(dto.imagemUrl !== undefined) personagem.imagemUrl = dto.imagemUrl;

            const atualizado = await this.personagensRepository.edit(personagem);

            return this.toRespostaDto(atualizado);
        }catch(erro: unknown){
            throw new InternalServerErrorException('Erro ao realizar a persistência da atualização');
        }
    }

    async adminBuscar(id:string): Promise<PersonagemRespostaDto>{
        const personagem = await this.personagensRepository.findById(id);

        if(!personagem){
            throw new NotFoundException('Personagem não encontrado');
        }

        return this.toRespostaDto(personagem);
    }
}