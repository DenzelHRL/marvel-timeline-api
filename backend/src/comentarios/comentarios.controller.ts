import {
    Body,
    Controller, 
    Get,
    Post,
    Patch,
    Delete,
    HttpCode,
    HttpStatus, 
    Param, 
    ParseUUIDPipe,
    Query
} from '@nestjs/common';
import {ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags} from '@nestjs/swagger';
import {ComentariosService} from './comentarios.service';
import {UsuarioId} from './usuario-id.decorator';
import {
    ConsultarComentariosDTO,
    ComentarioItemDTO,
    ListaComentariosRespostaDTO,
    CriarComentarioDTO,
    AtualizarComentarioDTO,
    ConsultarMeusComentariosDTO,
    ModerarComentarioDTO
} from './dto';


@ApiTags('Comentários')
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

    //Endpoint: 62 -> POST /obras/:obraId/comentarios
    @Post("obras/:obraId/comentarios")
    @ApiOperation({
        summary: "Publicar comentário em uma obra",
        description: "Cria um novo comentário para um obra publicada" + 
        "Requer conta ativa do usuario."
    })
    @ApiParam({name: "obraId", description: "UUID da obra publicada"})
    @ApiHeader({
        name: "x-usuario-id",
        required: true,
        description: "UUID do usuário autenticado"
    })
    @ApiResponse({status: 201, description: "Comentário publicado com sucesso"})
    @ApiResponse({status: 400, description: "Dados inválidos no corpo da requisição"})
    @ApiResponse({status: 401, description: "Usuário não identificado"})
    @ApiResponse({status: 403, description: "Usuário desativado não pode comentar"})
    @ApiResponse({status: 404, description: "Obra não encontrada ou não publicada"})
    async criar(
        @Param("obraId", ParseUUIDPipe) obraId: string,
        @UsuarioId() usuarioId: string,
        @Body() dto: CriarComentarioDTO
    ){
        return this.comentariosService.criar(obraId, usuarioId, dto);
    }

    //Endpoint: 63 -> PATCH /comentarios/:id
    @Patch("comentarios/:id")
    @ApiOperation({
        summary: "Editar o próprio comentário",
        description: "Permite ao autor alterar o texto ou aviso de spoiler do comentário"
    })
    @ApiParam({name: "id", description:"UUID do comentário"})
    @ApiHeader({
        name: "x-usuario-id",
        required: true,
        description: "UUID do usuário autenticado"
    })
    @ApiResponse({status: 201, description: "Comentário atualizado com sucesso"})
    @ApiResponse({status: 400, description: "Dados inválidos"})
    @ApiResponse({status: 401, description: "Usuário não identificado"})
    @ApiResponse({status: 403, description: "Apenas o autor pode editar"})
    @ApiResponse({status: 404, description: "Comentário não encontrado"})
    async atualizar(
        @Param("id", ParseUUIDPipe) id: string,
        @UsuarioId() usuarioId: string,
        @Body() dto: AtualizarComentarioDTO
    ){
        return this.comentariosService.atualizar(id, usuarioId, dto);
    }

    //Endpoint: 64 -> DELETE /comentarios/:id
    @Delete("comentarios/:id")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: "Remover o próprio comentário (Remoção Lógica)",
        description: "Marca o comentário como REMOVIDO para que não apareça na leitura pública."
    })
    @ApiParam({ name: "id", description: "UUID do comentário"})
    @ApiHeader({
        name: "x-usuario-id",
        required: true,
        description: "UUID do autor do comentário",
    })
    @ApiResponse({status: 200, description: "Comentário removido com sucesso."})
    @ApiResponse({status: 401, description: "Usuário não identificado."})
    @ApiResponse({status: 403, description: "Apenas o autor pode remover."})
    @ApiResponse({status: 404, description: "Comentário não encontrado."})
    async remover(
        @Param("id", ParseUUIDPipe) id: string,
        @UsuarioId() usuarioId: string
    ){
        return this.comentariosService.remover(id, usuarioId);
    }

    // Endpoint: 65 -> GET /usuarios/me/comentarios
    @Get("usuarios/me/comentarios")
    @ApiOperation({
        summary: "Consultar histórico de comentários do próprio autor",
        description: "Retorna todos os comentários postados pelo usuário logado com paginação e filtros.",
    })
    @ApiHeader({
        name: "x-usuario-id",
        required: true,
        description: "UUID do usuário autenticado",
    })
    @ApiResponse({ status: 200, description: "Histórico retornado com sucesso" })
    @ApiResponse({ status: 401, description: "Usuário não identificado" })
    async listarMeusComentarios(
        @UsuarioId() usuarioId: string,
        @Query() filtros: ConsultarMeusComentariosDTO,
    ) {
        return this.comentariosService.listarMeusComentarios(usuarioId, filtros);
    }

    // Endpoint: 66 -> GET /admin/comentarios
    @Get("admin/comentarios")
    @ApiOperation({
        summary: "Fila de moderação de comentários (Admin)",
        description: "Lista comentários de toda a plataforma para fins de moderação, com paginação e filtros.",
    })
    @ApiResponse({ status: 200, description: "Fila de moderação retornada com sucesso" })
    async listarFilaModeracao(
        @Query() filtros: ConsultarMeusComentariosDTO,
    ) {
        return this.comentariosService.listarFilaModeracao(filtros);
    }

    // Endpoint: 67 -> PATCH /admin/comentarios/:id/moderacao
    @Patch("admin/comentarios/:id/moderacao")
    @ApiOperation({
        summary: "Moderar comentário (Admin)",
        description: "Altera o status de um comentário para OCULTO ou PUBLICADO (Regra R09).",
    })
    @ApiParam({ name: "id", description: "UUID do comentário a ser moderado" })
    @ApiResponse({ status: 200, description: "Status de moderação atualizado com sucesso" })
    @ApiResponse({ status: 400, description: "Status inválido" })
    @ApiResponse({ status: 404, description: "Comentário não encontrado" })
    async moderar(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: ModerarComentarioDTO,
    ) {
        return this.comentariosService.moderar(id, dto);
    }
}