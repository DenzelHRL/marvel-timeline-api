import {
    Body,
    Controller, 
    Get,
    Post,
    Patch,
    Put,
    Delete,
    HttpCode,
    HttpStatus, 
    Param, 
    ParseUUIDPipe,
    Query
} from "@nestjs/common";
import {ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags} from "@nestjs/swagger";
import {ProgressoService} from "./progresso.service";
import {CurrentUser} from "../auth/auth.decorators";
import {Authorize} from "../acesso/autorizacao.decorators";
import {
    ConsultarProgressoDTO,
    DefinirProgressoDTO,
    ItemProgressoDTO,
    ListaProgressoRespostaDTO,
    ResumoProgressoTrilhaDTO,
} from "./dto";

@ApiTags("Progresso pessoal")
@ApiBearerAuth()
@Controller("usuarios/me")
export class ProgressoController{
    constructor(private readonly progressoService: ProgressoService){}

    //Endpoint: 68 -> GET /usuarios/me/progresso
    @Get("progresso")
    @Authorize({permissions: ["progresso:consultar_proprio"]})
    @ApiOperation({
        summary: "Listar as obras que to acompanhando.",
        description: "Retorna a lista de obras com progresso do usuário logado."
    })
    @ApiResponse({status: 200, type: ListaProgressoRespostaDTO})
    @ApiResponse({status: 401, description: "Token JWT ausente ou inválido."})
    async listarMeuProgresso(
        @CurrentUser("id") usuarioId: string,
        @Query() filtros: ConsultarProgressoDTO
    ){
        return this.progressoService.listarMeuProgresso(usuarioId, filtros);
    }

    //Endpoint: 69 -> GET /usuarios/me/progresso/:obraId
    @Get("progresso/:obraId")
    @Authorize({permissions: ["progresso:consultar_proprio"]})
    @ApiOperation({
        summary: "Consultar estado pessoal de uma obra.",
        description: "Retorna o progresso do usuário em uma obra específica."
    })
    @ApiParam({name: "obraId", description: "UUID da obra."})
    @ApiResponse({status: 200, type: ItemProgressoDTO})
    @ApiResponse({status: 401, description: "Token JWT ausente ou inválido."})
    @ApiResponse({status: 404, description: "Obra sem progresso registrado."})
    async consultarPorObra(
        @CurrentUser("id") usuarioId: string,
        @Param("obraId", ParseUUIDPipe) obraId: string
    ){
        return this.progressoService.consultarPorObra(usuarioId, obraId);
    }

    //Endpoint: 70 -> PUT /usuarios/me/progresso/:obraId
    @Put("progresso/:obraId")
    @Authorize({permissions: ["progresso:alterar_proprio"]})
    @ApiOperation({
        summary: "Definir estado pessoal de uma obra.",
        description: "Define se a obra está como QUERO_VER, ASSISTINDO ou CONCLUIDO."
    })
    @ApiParam({name: "obraId", description: "UUID da obra."})
    @ApiResponse({status: 200, type: ItemProgressoDTO})
    @ApiResponse({status: 400, description: "Status inválido."})
    @ApiResponse({status: 401, description: "Token JWT ausente ou inválido."})
    @ApiResponse({status: 404, description: "Obra não encotrada."})
    async definirPorObra(
        @CurrentUser("id") usuarioId: string,
        @Param("obraId", ParseUUIDPipe) obraId: string,
        @Body() dto: DefinirProgressoDTO
    ){
        return this.progressoService.definirProgresso(usuarioId, obraId, dto);
    }

    //Endpoint: 71 -> DELETE /usuarios/me/progresso/:obraId
    @Delete("progresso/:obraId")
    @HttpCode(HttpStatus.OK)
    @Authorize({permissions: ["progresso:alterar_proprio"]})
    @ApiOperation({
        summary: "Limpar estado pessoal de uma obra",
        description: "Remove o registro de progresso do usuário para a obra em específico.",
    })
    @ApiParam({name: "obraId", description: "UUID da obra."})
    @ApiResponse({status: 200, description: "Progresso removido com sucesso."})
    @ApiResponse({status: 401, description: "Token JWT ausente ou inválido."})
    @ApiResponse({status: 404, description: "Progresso não encontrado."})
    async removerProgresso(
        @CurrentUser("id") usuarioId: string,
        @Param("obraId", ParseUUIDPipe) obraId: string,
    ) {
        return this.progressoService.removerProgresso(usuarioId, obraId);
    }

    //Endpoint: 72 -> GET /usuarios/me/trilhas/:slug/progresso
    @Get("trilhas/:slug/progresso")
    @Authorize({permissions: ["progresso:consultar_proprio"]})
    @ApiOperation({
        summary: "Consultar resumo anexado do progresso de uma trilha.",
        description: "Calcula o total de obras concluídas, em andamento e a procentagem de conclusão da trilha."
    })
    @ApiParam({name: "slug", description: "Slug da trilha publicada.", example: "curta"})
    @ApiResponse({status: 200, type: ResumoProgressoTrilhaDTO})
    @ApiResponse({status: 401, description: "Token JWT ausente ou inválido."})
    @ApiResponse({status: 404, description: "Trilha não encotrada ou não publicada."})
    async consultarProgressoTrilha(
        @CurrentUser("id") usuarioId: string,
        @Param("slug") slug: string
    ){
        return this.progressoService.consultarProgressoTrilha(usuarioId, slug);
    }
}