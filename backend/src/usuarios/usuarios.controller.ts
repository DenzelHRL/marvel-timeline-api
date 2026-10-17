import{
    Body,
    Get,
    Patch,
    Controller,
    Query 
} from "@nestjs/common";
import {ApiBearerAuth, ApiConflictResponse, ApiOperation, ApiResponse, ApiTags} from "@nestjs/swagger";
import {UsuariosService} from "./usuarios.service";
import {CurrentUser} from "../auth/auth.decorators";
import {Authorize} from "../acesso/autorizacao.decorators";
import{
    AtualizarMinhaContaDTO,
    ConsultarMinhasPermissoesDTO,
    ListaMinhasPermissoesRespostaDTO,
    MinhaContaRespostaDTO
} from "./dto";

@ApiTags("Conta própria")
@ApiBearerAuth()
@Controller("usuarios/me")
export class UsuariosController{
    constructor(private readonly usuariosService: UsuariosService){}

    //Endpoint: 05 -> GET /usuario/me
    @Get()
    @Authorize({permissions: ["conta:consultar_propria"]})
    @ApiOperation({
        summary: "Consultar dados da própria conta",
        description: "Retorna os dados cadastrais e perfis do usuário logado a partir do token JWT. Nunca retorna o hash da senha."
    })
    @ApiResponse({status: 200, type: MinhaContaRespostaDTO})
    @ApiResponse({status: 401, description: "Usuário não identificado"})
    @ApiResponse({status: 404, description: "Obra não encontrada ou não publicada"})
    async consultarMinhaConta(@CurrentUser("id") usuarioId: string){
        return this.usuariosService.consultarMinhaConta(usuarioId);
    }

    //Endpoint: 06 -> PACTH /usuario/me
    @Patch()
    @Authorize({permissions: ["conta:editar_propria"]})
    @ApiOperation({
        summary: "Alterar nome ou email próprio",
        description: "Atualiza o dados cadastrais da própria conta."
    })
    @ApiResponse({status: 200, type: MinhaContaRespostaDTO})
    @ApiResponse({status: 401, description: "Usuário não identificado"})
    @ApiResponse({status: 404, description: "Obra não encontrada ou não publicada"})
    async atualizarMinhaConta(
        @CurrentUser("id") usuarioId: string,
        @Body() dto: AtualizarMinhaContaDTO
    ){
        return this.usuariosService.atualizarMinhaConta(usuarioId, dto);
    }

    //Endpoint: 07 -> GET /usuario/me/permissoes
    @Get("permissoes")
    @Authorize({permissions: ["conta:consultar_propria"]})
    @ApiOperation({
        summary: "Consultar permissoes da conta",
        description: "Retorna a lista de permissões entre os perfis."
    })
    @ApiResponse({status: 200, type: ListaMinhasPermissoesRespostaDTO})
    @ApiResponse({status: 404, description: "Obra não encontrada ou não publicada"})
    async consultarMinhasPermissoes(
        @CurrentUser("id") usuarioId: string,
        @Query() filtros: ConsultarMinhasPermissoesDTO
    ){
        return this.usuariosService.consultarMinhasPermissoes(usuarioId, filtros);
    }
}