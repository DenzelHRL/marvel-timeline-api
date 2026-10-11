import {Controller, Get, Param, ParseUUIDPipe, Query} from '@nestjs/common';
import {ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags} from '@nestjs/swagger';
import {ComentariosService} from './comentarios.service';
import {ConsultarComentariosDTO} from './dto/consultar-comentarios.dto';
import {ComentarioItemDTO, ListaComentariosRespostaDTO} from './dto/comentario-resposta.dto';

ApiTags('Comentários')
@Controller()
export class ComentariosController {
    constructor(private readonly comentariosService: ComentariosService){}

    //Endpoint: 60 -> GET /obras/:slug/comentarios
    @Get('obras/:slug/comentarios')
    @ApiOperation({
        summary: "Listar comentários publicados de uma obra",
        description: "Retorna comentários com paginação e filtros." + 
        "Por padrão, esconde textos com spoilers.",
    })
    @ApiParam({
        name: "slug",
        example: "vingadores-guerra-infinita",
        description: "Slug legível da obra publicada",
    })
    @ApiResponse({status: 200, type: ListaComentariosRespostaDTO})
    @ApiResponse({status: 404, description: "Obra não encontrada ou não publicada"})
    async listarPorObra(
        @Param("slug") slug: string,
        @Query() filtros: ConsultarComentariosDTO
    ){
        return this.comentariosService.listarPorObra(slug, filtros);
    }

    //Endpoint: 61 -> GET /comentarios/:id
    @Get('comentarios/:id')
    @ApiOperation({
        summary: "Consultar comentário específico, público, com proteção de spoiler."
    })
    @ApiParam({name: "id", description: "UUID do comentário"})
    @ApiQuery({
        name: "revelarSpoilers",
        required: false,
        type: Boolean,
        description: "Se 'true', exibe o texto caso seja spoiler"
    })
    @ApiResponse({status:200, type: ComentarioItemDTO})
    @ApiResponse({status: 404, description: "Comentário não encontrado"})
    async buscarPorId(
        @Param("id", ParseUUIDPipe) id: string,
        @Query("revelarSpoilers") revelarSpoilers?: string
    ){
        const comSpoiler = revelarSpoilers === 'true';
        return this.comentariosService.buscarPorId(id, comSpoiler);
    }
}