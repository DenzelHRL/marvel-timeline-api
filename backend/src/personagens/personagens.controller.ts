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
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiConflictResponse, ApiInternalServerErrorResponse, ApiBearerAuth, ApiParam, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';

@Controller(PERSONAGENS_ROUTES.base)
@ApiTags('Personagens')
@ApiExtraModels(PersonagemRespostaDto)
export class PersonagensController{
    constructor(private readonly personagensService: PersonagensService){}

    @Get(PERSONAGENS_ROUTES.listar)
    @ApiOperation({
        summary: 'Listar personagens',
        description: 'Consulta pública paginada, com filtros por parte do nome e do slug. Página padrão 1 e limite padrão 20, com máximo de 50 itens',
    })
    @ApiOkResponse({
        description: 'Consulta concluída com itens e metadados de paginação',
        schema: {
            type: 'object',
            required: ['itens', 'meta'],
            properties: {
                itens: { type: 'array', items: { $ref: getSchemaPath(PersonagemRespostaDto) } },
                meta: {
                    type: 'object',
                    required: ['pagina', 'limite', 'total', 'totalPag'],
                    properties: {
                        pagina: { type: 'integer', minimum: 1 },
                        limite: { type: 'integer', minimum: 1, maximum: 50 },
                        total: { type: 'integer', minimum: 0 },
                        totalPag: { type: 'integer', minimum: 0 },
                    },
                },
            },
        },
    })
    @ApiBadRequestResponse({ description: 'Paginação ou filtros inválidos' })
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
    @ApiOperation({
        summary: 'Consultar personagem pelo slug',
        description: 'Retorna os dados públicos de um personagem pelo identificador textual',
    })
    @ApiParam({ name: 'slug', description: 'Slug do personagem', type: String })
    @ApiOkResponse({ description: 'Personagem encontrado', type: PersonagemRespostaDto })
    @ApiBadRequestResponse({ description: 'Slug inválido' })
    @ApiNotFoundResponse({ description: 'Personagem não encontrado' })
    async buscar(@Param(new ValidationPipe()) params: BuscarPersonagemParamsDto): Promise<PersonagemRespostaDto>{
        return await this.personagensService.buscar(params.slug);
    }

    @Post()
    @ApiOperation({
        summary: 'Cadastrar personagem',
        description: 'Cria um personagem com slug único. Exige perfil ADMIN e permissão personagens:criar',
    })
    @ApiBearerAuth()
    @ApiUnauthorizedResponse({ description: 'Token ausente, inválido ou expirado; ou conta inativa' })
    @ApiForbiddenResponse({ description: 'Exige perfil ADMIN e permissão personagens:criar' })
    @ApiCreatedResponse({ description: 'Personagem criado', type: PersonagemRespostaDto })
    @ApiBadRequestResponse({ description: 'Dados do personagem inválidos' })
    @ApiConflictResponse({ description: 'Já existe um personagem com esse slug' })
    @ApiInternalServerErrorResponse({ description: 'Erro ao persistir o personagem' })
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
    @ApiOperation({
        summary: 'Atualizar personagem',
        description: 'Atualiza os campos enviados, preservando a unicidade do slug. Exige perfil ADMIN e permissão personagens:editar',
    })
    @ApiBearerAuth()
    @ApiUnauthorizedResponse({ description: 'Token ausente, inválido ou expirado; ou conta inativa' })
    @ApiForbiddenResponse({ description: 'Exige perfil ADMIN e permissão personagens:editar' })
    @ApiParam({ name: 'id', description: 'Identificador do personagem', format: 'uuid' })
    @ApiOkResponse({ description: 'Personagem atualizado', type: PersonagemRespostaDto })
    @ApiBadRequestResponse({ description: 'Identificador ou dados do personagem inválidos' })
    @ApiNotFoundResponse({ description: 'Personagem não encontrado' })
    @ApiConflictResponse({ description: 'O slug informado já está em uso' })
    @ApiInternalServerErrorResponse({ description: 'Erro ao persistir a atualização' })
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
@ApiTags('Personagens')
export class PersonagensAdminController{
    constructor(private readonly personagensService: PersonagensService){}
    @Get('/:id')
    @ApiOperation({
        summary: 'Consultar personagem por identificador',
        description: 'Consulta administrativa por UUID. Exige perfil ADMIN e permissão personagens:editar',
    })
    @ApiBearerAuth()
    @ApiUnauthorizedResponse({ description: 'Token ausente, inválido ou expirado; ou conta inativa' })
    @ApiForbiddenResponse({ description: 'Exige perfil ADMIN e permissão personagens:editar' })
    @ApiParam({ name: 'id', description: 'Identificador do personagem', format: 'uuid' })
    @ApiOkResponse({ description: 'Personagem encontrado', type: PersonagemRespostaDto })
    @ApiBadRequestResponse({ description: 'Identificador inválido' })
    @ApiNotFoundResponse({ description: 'Personagem não encontrado' })
    @Authorize({
        roles: ['ADMIN'],
        permissions: ['personagens:editar'],
    })
    async buscar(@Param('id', new ParseUUIDPipe()) id: string): Promise<PersonagemRespostaDto>{
        return await this.personagensService.adminBuscar(id);
    }
}
