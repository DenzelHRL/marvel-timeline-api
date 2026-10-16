import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, ValidationPipe, Headers, Patch, ParseUUIDPipe } from '@nestjs/common';
import { PERSONAGENS_ROUTES } from './personagens.routes';
import { PersonagensService } from './personagens.service';
import {PersonagemRespostaDto} from './dto/personagens.resposta.dto';
import {CriarPersonagemDto} from './dto/personagens.criar-personagem.dto';
import {ListarPersonagensDto} from './dto/personagens.listar-Personagens.dto';
import {AtualizarPersonagemDto} from './dto/personagens.atualizar-personagem.dto';
import { BuscarPersonagemParamsDto } from './dto/personagens.buscar-personagens.dto';
import { Authenticated } from '../auth/auth.decorators';
import { Authorize } from '../acesso/autorizacao.decorators';

@Controller(PERSONAGENS_ROUTES.base)
export class PersonagensController{
    constructor(private readonly personagensService: PersonagensService){}

    @Get(PERSONAGENS_ROUTES.listar)
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
        return this.personagensService.listarTodos(consulta);
    }

    @Get(PERSONAGENS_ROUTES.buscarPorSlug)
    async buscar(@Param(new ValidationPipe()) params: BuscarPersonagemParamsDto): Promise<PersonagemRespostaDto>{
        return await this.personagensService.buscar(params.slug);
    }

    @Post()
    @Authorize({
        roles: ['ADMIN'],
        permissions: ['personagens:criar'],
    })
    async criar(
        @Body(new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true
        })) createPersonagemDto: CriarPersonagemDto, 
    ): Promise<PersonagemRespostaDto> {
        return await this.personagensService.criar(createPersonagemDto);
    }

    @Patch(PERSONAGENS_ROUTES.atualizar)
    @Authorize({
        roles: ['ADMIN'],
        permissions: ['personagens:editar'],
    })
    async atualizar(
        @Param('id', new ParseUUIDPipe()) id: string, 
        @Body(new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true
        })) updatePersonagemDto: AtualizarPersonagemDto, 
    ): Promise<PersonagemRespostaDto>{
        return await this.personagensService.atualizar(id, updatePersonagemDto);
    }
}

@Controller('admin/personagens')
export class PersonagensAdminController{
    constructor(private readonly personagensService: PersonagensService){}
    @Get('/:id')
    @Authorize({
        roles: ['ADMIN'],
        permissions: ['personagens:editar'],
    })
    async buscar(@Param('id', new ParseUUIDPipe()) id: string): Promise<PersonagemRespostaDto>{
        return await this.personagensService.adminBuscar(id);
    }
}