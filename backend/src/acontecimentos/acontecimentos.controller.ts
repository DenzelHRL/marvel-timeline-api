import { Body, Controller, DefaultValuePipe, Delete, Get, HttpCode, HttpStatus, Param, ParseBoolPipe, ParseUUIDPipe, Patch, Post, Query, ValidationPipe } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ListarEventosEmObrasDto } from "./dto/acontecimentos.listar-eventos.dto";
import { AcontecimentosService } from "./acontecimentos.service";
import { CriarEventoDto } from "./dto/acontecimentos.criar-evento.dto";
import { AtualizarEventoDto } from "./dto/acontecimentos.atualizar-evento.dto";
import { BuscarPersonagensEmEventosDto } from "./dto/acontecimentos.buscar-personagem.dto";
import { Authorize } from "../acesso/autorizacao.decorators";

@Controller()
@ApiTags('Acontecimentos')
export class AcontecimentosController{
    constructor(private readonly service: AcontecimentosService){}

    @Get('obras/:slug/acontecimentos')
    async listarEventos(
        @Param('slug') slug: string,
        @Query(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true
            })
        )
        consulta: ListarEventosEmObrasDto
    ){
        return await this.service.listarEventos(slug, consulta);
    }

    @Get('acontecimentos/:id')
    async buscarEvento(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Query(
            'incluirSpoilers',
            new DefaultValuePipe(false),
            new ParseBoolPipe(),
        )
        incluirSpoilers: boolean
    ){
        return await this.service.buscarEvento(id, incluirSpoilers);
    }
    
    @Post('obras/:obraId/acontecimentos')
    @HttpCode(HttpStatus.CREATED)
    @Authorize({
        roles: ['ADMIN'],
        permissions: ['acontecimentos:criar'],
    })
    async criarEvento(
        @Param('obraId', new ParseUUIDPipe()) obraId: string,
        @Body(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true
            })
        )
        dados: CriarEventoDto
    ){
        return await this.service.criarEvento(obraId, dados);
    }

    @Patch('acontecimentos/:id')
    @Authorize({
        roles: ['ADMIN'],
        permissions: ['acontecimentos:editar'],
    })
    async editarEvento(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true
            })
        )
        dados: AtualizarEventoDto
    ){
        return await this.service.editarEvento(id, dados);
    }

    @Delete('acontecimentos/:id')
    @Authorize({
        roles: ['ADMIN'],
        permissions: ['acontecimentos:editar'],
    })
    @HttpCode(HttpStatus.NO_CONTENT)
    async removerEvento(@Param('id', new ParseUUIDPipe()) id: string){
        await this.service.removerEvento(id);
    }

    @Get('acontecimentos/:id/personagens')
    async buscarPersonagens(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
        consulta: BuscarPersonagensEmEventosDto
    ){
        return await this.service.buscarPersonagensAssociados(id, consulta);
    }

    @Post('acontecimentos/:id/personagens')
    @Authorize({
        roles: ['ADMIN'],
        permissions: ['acontecimentos:editar'],
    })
    async associarPersonagens(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body('personagemId', new ParseUUIDPipe()) personagemId: string
    ){
        return await this.service.associar(id, personagemId);
    }

    @Delete('acontecimentos/:id/personagens/:personagemId')
    @Authorize({
        roles: ['ADMIN'],
        permissions: ['acontecimentos:editar'],
    })
    @HttpCode(HttpStatus.NO_CONTENT)
    async retirarAssociacao(
        @Param('id', new ParseUUIDPipe()) id: string, 
        @Param('personagemId', new ParseUUIDPipe()) personagemId: string
    ){
        await this.service.retirar(id, personagemId)
    }
}
