import { Controller, Get, Param, Post, Body, ParseUUIDPipe, ValidationPipe, Query, Patch, Delete, HttpCode, HttpStatus, DefaultValuePipe, ParseBoolPipe } from '@nestjs/common';
import { ParticipacaoService } from './participacao.service';
import { CriarParticipacaoDto } from './dto/participacao.criar.dto';
import { ListarParticipacoesEmObrasDto } from './dto/participacao.listar-participacao.dto';
import { Authorize } from '../acesso/autorizacao.decorators';
import { AtualizarParticipacaoDto } from './dto/participacao.atualizar.dto';

@Controller()
export class ParticipacaoController{
    constructor(private readonly participacaoService: ParticipacaoService){}
    
    @Get('/obras/:slug/participacoes')
    async listarParticipacoesNasObras(
        @Param('slug') slug: string,
        @Query(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true
            })
        )
        consulta: ListarParticipacoesEmObrasDto,
    ){
        return await this.participacaoService.listarParticipacoes(slug, consulta);
    }

    @Get('/participacoes/:id')
    async buscarParticipacoes(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Query(
            'incluirSpoilers',
            new DefaultValuePipe(false),
            new ParseBoolPipe(),
        )
        incluirSpoilers: boolean
    ){
        return await this.participacaoService.buscar(id, incluirSpoilers);
    }
    
    @Post('/obras/:obraId/participacoes')
    @HttpCode(HttpStatus.CREATED)
    @Authorize({
        roles: ['ADMIN'],
        permissions: ['participacoes:editar'],
    })
    async criarParticipacao(
        @Param('obraId', new ParseUUIDPipe()) obraId: string, 
        @Body(new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true
        })) createParticipacaoDto: CriarParticipacaoDto
    ){
        return await this.participacaoService.criar(obraId, createParticipacaoDto);
    }

    @Patch('/participacoes/:id')
    @Authorize({
        roles: ['ADMIN'],
        permissions: ['participacoes:editar'],
    })
    async atualizarParticipacao(
        @Param('id', new ParseUUIDPipe()) id: string, 
        @Body(new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true
        })) updateParticipacaoDto: AtualizarParticipacaoDto
    ){
        return await this.participacaoService.editar(id, updateParticipacaoDto)
    }

    @Delete('/participacoes/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Authorize({
        roles: ['ADMIN'],
        permissions: ['participacoes:editar'],
    })
    async deletarParticipacao(@Param('id', new ParseUUIDPipe()) id: string): Promise<void>{
        await this.participacaoService.remover(id);
    }
}