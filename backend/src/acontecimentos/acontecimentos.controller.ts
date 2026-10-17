import { Body, Controller, DefaultValuePipe, Delete, Get, HttpCode, HttpStatus, Param, ParseBoolPipe, ParseUUIDPipe, Patch, Post, Query, ValidationPipe } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiOkResponse, ApiCreatedResponse, ApiNoContentResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiConflictResponse, ApiInternalServerErrorResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { AcontecimentoRespostaDto } from './dto/acontecimentos.evento-resposta.dto';
import { PersonagemRespostaDto } from '../personagens/dto/personagens.resposta.dto';
import { ListarEventosEmObrasDto } from "./dto/acontecimentos.listar-eventos.dto";
import { AcontecimentosService } from "./acontecimentos.service";
import { CriarEventoDto } from "./dto/acontecimentos.criar-evento.dto";
import { AtualizarEventoDto } from "./dto/acontecimentos.atualizar-evento.dto";
import { BuscarPersonagensEmEventosDto } from "./dto/acontecimentos.buscar-personagem.dto";
import { Authorize } from "../acesso/autorizacao.decorators";

@Controller()
@ApiTags('Acontecimentos')
@ApiExtraModels(AcontecimentoRespostaDto, PersonagemRespostaDto)
export class AcontecimentosController{
    constructor(private readonly service: AcontecimentosService){}

    @Get('obras/:slug/acontecimentos')
    @ApiOperation({ summary: 'Listar acontecimentos de uma obra', description: 'Consulta pública em ordem de posição, com paginação e filtros por categoria e contemSpoiler. Exige obra publicada. Spoilers ficam ocultos por padrão.' })
    @ApiParam({ name: 'slug', description: 'Slug da obra.', type: String })
    @ApiOkResponse({
        description: 'Resultados paginados.',
        schema: {
            type: 'object', required: ['obra', 'itens', 'meta'],
            properties: {
                obra: {
                    type: 'object', required: ['id', 'titulo', 'slug'],
                    properties: { id: { type: 'string', format: 'uuid' }, titulo: { type: 'string' }, slug: { type: 'string' } },
                },
                itens: { type: 'array', items: { $ref: getSchemaPath(AcontecimentoRespostaDto) } },
                meta: {
                    type: 'object', required: ['pagina', 'limite', 'total', 'totalPaginas'],
                    properties: {
                        pagina: { type: 'integer', minimum: 1 }, limite: { type: 'integer', minimum: 1, maximum: 50 },
                        total: { type: 'integer', minimum: 0 }, totalPaginas: { type: 'integer', minimum: 0 },
                    },
                },
            },
        },
    })
    @ApiBadRequestResponse({ description: 'Paginação ou filtros inválidos.' })
    @ApiNotFoundResponse({ description: 'Obra inexistente ou não publicada.' })
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
    @ApiOperation({ summary: 'Consultar acontecimento', description: 'Retorna um acontecimento de obra publicada. Acontecimentos com spoiler exigem incluirSpoilers=true.' })
    @ApiParam({ name: 'id', description: 'Identificador do acontecimento.', format: 'uuid' })
    @ApiQuery({ name: 'incluirSpoilers', required: false, type: Boolean, description: 'Autoriza revelar acontecimentos com spoilers. Padrão: false.' })
    @ApiOkResponse({ description: 'Acontecimento encontrado.', type: AcontecimentoRespostaDto })
    @ApiBadRequestResponse({ description: 'Identificador inválido.' })
    @ApiNotFoundResponse({ description: 'Acontecimento inexistente, oculto por spoiler ou obra não publicada.' })
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
    @ApiOperation({ summary: 'Criar acontecimento', description: 'Cria um acontecimento em posição livre dentro da obra. Exige ADMIN e acontecimentos:criar.' })
    @ApiBearerAuth()
    @ApiUnauthorizedResponse({ description: 'Token ausente, inválido ou expirado, ou conta inativa.' })
    @ApiForbiddenResponse({ description: 'Exige ADMIN e permissão acontecimentos:criar.' })
    @ApiParam({ name: 'obraId', description: 'Identificador da obra.', format: 'uuid' })
    @ApiBody({ type: CriarEventoDto })
    @ApiCreatedResponse({ description: 'Acontecimento criado.', type: AcontecimentoRespostaDto })
    @ApiBadRequestResponse({ description: 'Identificador ou corpo inválido.' })
    @ApiNotFoundResponse({ description: 'Obra não encontrada.' })
    @ApiConflictResponse({ description: 'Posição já ocupada nesta obra.' })
    @ApiInternalServerErrorResponse({ description: 'Falha ao cadastrar acontecimento.' })
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
    @ApiOperation({ summary: 'Atualizar acontecimento', description: 'Atualiza somente os campos enviados. Posição deve estar livre na mesma obra; campos omitidos são preservados. Exige ADMIN e acontecimentos:editar.' })
    @ApiBearerAuth()
    @ApiUnauthorizedResponse({ description: 'Token ausente, inválido ou expirado, ou conta inativa.' })
    @ApiForbiddenResponse({ description: 'Exige ADMIN e permissão acontecimentos:editar.' })
    @ApiParam({ name: 'id', description: 'Identificador do acontecimento.', format: 'uuid' })
    @ApiBody({ type: AtualizarEventoDto })
    @ApiOkResponse({ description: 'Acontecimento atualizado.', type: AcontecimentoRespostaDto })
    @ApiBadRequestResponse({ description: 'Identificador ou corpo inválido.' })
    @ApiNotFoundResponse({ description: 'Acontecimento não encontrado.' })
    @ApiConflictResponse({ description: 'Posição já ocupada nesta obra.' })
    @ApiInternalServerErrorResponse({ description: 'Falha ao atualizar acontecimento.' })
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
    @ApiOperation({ summary: 'Excluir acontecimento', description: 'Exclui o acontecimento e seus vínculos com personagens na mesma transação. Exige ADMIN e acontecimentos:editar.' })
    @ApiBearerAuth()
    @ApiUnauthorizedResponse({ description: 'Token ausente, inválido ou expirado, ou conta inativa.' })
    @ApiForbiddenResponse({ description: 'Exige ADMIN e permissão acontecimentos:editar.' })
    @ApiParam({ name: 'id', description: 'Identificador do acontecimento.', format: 'uuid' })
    @ApiNoContentResponse({ description: 'Acontecimento excluído, sem corpo de resposta.' })
    @ApiBadRequestResponse({ description: 'Identificador inválido.' })
    @ApiNotFoundResponse({ description: 'Acontecimento não encontrado.' })
    @ApiInternalServerErrorResponse({ description: 'Falha ao excluir acontecimento.' })
    @Authorize({
        roles: ['ADMIN'],
        permissions: ['acontecimentos:editar'],
    })
    @HttpCode(HttpStatus.NO_CONTENT)
    async removerEvento(@Param('id', new ParseUUIDPipe()) id: string){
        await this.service.removerEvento(id);
    }

    @Get('acontecimentos/:id/personagens')
    @ApiOperation({ summary: 'Listar personagens associados', description: 'Lista personagens vinculados com paginação e filtros por nome e slug. Exige obra publicada; acontecimentos com spoiler exigem incluirSpoilers=true.' })
    @ApiParam({ name: 'id', description: 'Identificador do acontecimento.', format: 'uuid' })
    @ApiOkResponse({
        description: 'Resultados paginados.',
        schema: {
            type: 'object', required: ['itens', 'meta'],
            properties: {
                itens: { type: 'array', items: { $ref: getSchemaPath(PersonagemRespostaDto) } },
                meta: {
                    type: 'object', required: ['pagina', 'limite', 'total', 'totalPaginas'],
                    properties: {
                        pagina: { type: 'integer', minimum: 1 }, limite: { type: 'integer', minimum: 1, maximum: 50 },
                        total: { type: 'integer', minimum: 0 }, totalPaginas: { type: 'integer', minimum: 0 },
                    },
                },
            },
        },
    })
    @ApiBadRequestResponse({ description: 'Identificador, paginação ou filtros inválidos.' })
    @ApiNotFoundResponse({ description: 'Acontecimento inexistente, oculto por spoiler ou obra não publicada.' })
    async buscarPersonagens(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
        consulta: BuscarPersonagensEmEventosDto
    ){
        return await this.service.buscarPersonagensAssociados(id, consulta);
    }

    @Post('acontecimentos/:id/personagens')
    @ApiOperation({ summary: 'Associar personagem', description: 'Vincula um personagem existente ao acontecimento, sem duplicar associações. Exige ADMIN e acontecimentos:editar.' })
    @ApiBearerAuth()
    @ApiUnauthorizedResponse({ description: 'Token ausente, inválido ou expirado, ou conta inativa.' })
    @ApiForbiddenResponse({ description: 'Exige ADMIN e permissão acontecimentos:editar.' })
    @ApiParam({ name: 'id', description: 'Identificador do acontecimento.', format: 'uuid' })
    @ApiBody({ schema: {
        type: 'object', required: ['personagemId'],
        properties: { personagemId: { type: 'string', format: 'uuid', description: 'Identificador do personagem existente.' } },
    } })
    @ApiCreatedResponse({ description: 'Associação criada.', schema: {
        type: 'object', required: ['acontecimentoId', 'personagemId'],
        properties: { acontecimentoId: { type: 'string', format: 'uuid' }, personagemId: { type: 'string', format: 'uuid' } },
    } })
    @ApiBadRequestResponse({ description: 'Identificador do acontecimento ou personagem inválido.' })
    @ApiNotFoundResponse({ description: 'Acontecimento ou personagem não encontrado.' })
    @ApiConflictResponse({ description: 'Personagem já associado ao acontecimento.' })
    @ApiInternalServerErrorResponse({ description: 'Falha ao criar associação.' })
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
    @ApiOperation({ summary: 'Retirar associação de personagem', description: 'Remove somente o vínculo, preservando personagem e acontecimento. Exige ADMIN e acontecimentos:editar.' })
    @ApiBearerAuth()
    @ApiUnauthorizedResponse({ description: 'Token ausente, inválido ou expirado, ou conta inativa.' })
    @ApiForbiddenResponse({ description: 'Exige ADMIN e permissão acontecimentos:editar.' })
    @ApiParam({ name: 'id', description: 'Identificador do acontecimento.', format: 'uuid' })
    @ApiParam({ name: 'personagemId', description: 'Identificador do personagem.', format: 'uuid' })
    @ApiNoContentResponse({ description: 'Associação removida, sem corpo de resposta.' })
    @ApiBadRequestResponse({ description: 'Identificadores inválidos.' })
    @ApiNotFoundResponse({ description: 'Acontecimento, personagem ou associação não encontrado.' })
    @ApiInternalServerErrorResponse({ description: 'Falha ao retirar associação.' })
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
