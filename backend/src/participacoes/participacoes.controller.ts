import { Controller, Get, Param, Post, Body, ParseUUIDPipe, ValidationPipe, Query, Patch, Delete, HttpCode, HttpStatus, DefaultValuePipe, ParseBoolPipe } from '@nestjs/common';
import { ParticipacaoService } from './participacao.service';
import { CriarParticipacaoDto } from './dto/participacao.criar.dto';
import { ListarParticipacoesEmObrasDto } from './dto/participacao.listar-participacao.dto';
import { Authorize } from '../acesso/autorizacao.decorators';
import { AtualizarParticipacaoDto } from './dto/participacao.atualizar.dto';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiNoContentResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiConflictResponse, ApiInternalServerErrorResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { ParticipacaoRespostaDto } from './dto/participacao.resposta.dto';

@Controller()
@ApiTags('Participações')
@ApiExtraModels(ParticipacaoRespostaDto)
export class ParticipacaoController{
    constructor(private readonly participacaoService: ParticipacaoService){}
    
    @Get('/obras/:slug/participacoes')
    @ApiOperation({
        summary: 'Listar participações de uma obra',
        description: 'Consulta pública de obra publicada, com paginação e filtros por papel e presencaESpoiler'
    })
    @ApiOkResponse({
        description: 'Consulta concluída com itens e metadados de paginação',
        schema: {
            type: 'object',
            required: ['itens', 'meta'],
            properties: {
                itens: { type: 'array', items: { $ref: getSchemaPath(ParticipacaoRespostaDto) } },
                meta: {
                    type: 'object',
                    required: ['pagina', 'limite', 'total', 'totalPaginas'],
                    properties: {
                        pagina: { type: 'integer', minimum: 1 },
                        limite: { type: 'integer', minimum: 1, maximum: 50 },
                        total: { type: 'integer', minimum: 0 },
                        totalPaginas: { type: 'integer', minimum: 0 },
                    },
                },
            },
        },
    })
    @ApiBadRequestResponse({ description: 'Paginação ou filtros inválidos' })
    @ApiNotFoundResponse({ description: 'Obra inexistente ou não publicada' })
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
    @ApiOperation({
        summary: 'Consultar participação',
        description: 'Consulta participação de uma obra publicada',
    })
    @ApiOkResponse({ description: 'Participação encontrada'})
    @ApiBadRequestResponse({ description: 'Identificador inválido' })
    @ApiNotFoundResponse({ description: 'Participação inexistente, oculta por spoiler ou vinculada a obra não publicada' })
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
    @ApiOperation({
        summary: 'Vincular personagem a uma obra',
        description: 'Cria uma participação única para uma obra e um personagem existentes. Exige perfil ADMIN'
    })
    @ApiUnauthorizedResponse({ description: 'Token ausente, inválido ou expirado; ou conta inativa' })
    @ApiForbiddenResponse({ description: 'Exige perfil ADMIN'})
    @ApiCreatedResponse({ description: 'Participação criada'})
    @ApiBadRequestResponse({ description: 'Identificador ou dados da participação inválidos' })
    @ApiNotFoundResponse({ description: 'Obra ou personagem não encontrado' })
    @ApiConflictResponse({ description: 'O personagem já possui participação nesta obra' })
    @ApiInternalServerErrorResponse({ description: 'Erro ao cadastrar participação' })
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
    @ApiOperation({
        summary: 'Atualizar participação',
        description: 'Atualiza os campos enviados sem alterar os vínculos com obra e personagem. Exige perfil ADMIN',
    })
    @ApiUnauthorizedResponse({ description: 'Token ausente, inválido ou expirado; ou conta inativa' })
    @ApiForbiddenResponse({ description: 'Exige perfil ADMIN' })
    @ApiOkResponse({ description: 'Participação atualizada'})
    @ApiBadRequestResponse({ description: 'Identificador ou dados da participação inválidos' })
    @ApiNotFoundResponse({ description: 'Participação não encontrada' })
    @ApiInternalServerErrorResponse({ description: 'Erro ao atualizar participação' })
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
    @ApiOperation({
        summary: 'Remover participação',
        description: 'Desvincula o personagem da obra removendo a participação. Exige perfil ADMIN',
    })
    @ApiUnauthorizedResponse({ description: 'Token ausente, inválido ou expirado; ou conta inativa' })
    @ApiForbiddenResponse({ description: 'Exige perfil ADMIN' })
    @ApiNoContentResponse({ description: 'Participação removida; resposta sem corpo' })
    @ApiBadRequestResponse({ description: 'Identificador inválido' })
    @ApiNotFoundResponse({ description: 'Participação não encontrada' })
    @ApiInternalServerErrorResponse({ description: 'Erro ao remover participação' })
    @HttpCode(HttpStatus.NO_CONTENT)
    @Authorize({
        roles: ['ADMIN'],
        permissions: ['participacoes:editar'],
    })
    async deletarParticipacao(@Param('id', new ParseUUIDPipe()) id: string): Promise<void>{
        await this.participacaoService.remover(id);
    }
}
