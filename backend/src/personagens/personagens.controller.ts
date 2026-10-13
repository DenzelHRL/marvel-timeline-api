import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, ValidationPipe, Headers, Patch, ParseUUIDPipe } from '@nestjs/common';
import { PERSONAGENS_ROUTES } from './personagens.routes';
import { PersonagensService } from './personagens.service';
import {PersonagemRespostaDto} from './dto/personagens.busca-respostas.dto';
import {CriarPersonagemDto} from './dto/personagens.criar-personagem.dto';
import { ParticipacaoDto } from '../participacoes/dto/participacao.dto';
import {ListarPersonagensDto} from './dto/personagens.listar-Personagens.dto';
import {atualizarPersonagemDto} from './dto/personagens.atualizar-personagem.dto';

@Controller(PERSONAGENS_ROUTES.base)
export class PersonagensController{
    constructor(private readonly personagensService: PersonagensService){}

    @Get(PERSONAGENS_ROUTES.listar)
    @HttpCode(HttpStatus.OK)
    listarTodos(
        @Query(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true
            })
        )

        consulta: ListarPersonagensDto,
    ){
        return this.personagensService.listarTodos();
    }

    @Get(PERSONAGENS_ROUTES.buscarPorSlug)
    async buscar(@Param('slug') slug:string): Promise<PersonagemRespostaDto>{
        return await this.personagensService.buscar(slug);
    }

    @Post()
    async criar(
        @Body(new ValidationPipe()) createPersonagemDto: CriarPersonagemDto, 
        @Headers('Authorization') authHeader: string
    ): Promise<PersonagemRespostaDto> {
        return await this.personagensService.criar(createPersonagemDto, authHeader);
    }

    @Patch(PERSONAGENS_ROUTES.atualizar)
    async atualizar(
        @Param('id', new ParseUUIDPipe()) id: string, 
        @Body(new ValidationPipe()) updatePersonagemDto: atualizarPersonagemDto, 
        @Headers('Authorization') authHeader: string
    ): Promise<PersonagemRespostaDto>{
        return await this.personagensService.atualizar(id, updatePersonagemDto, authHeader);
    }
}