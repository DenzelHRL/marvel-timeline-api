import { Controller, Get, Param, Post, Body, ParseUUIDPipe, ValidationPipe } from '@nestjs/common';
import { participacaoService } from './participacao.service';
import { ParticipacaoDto } from './dto/participacao.dto';

@Controller()
export class PersonagemParticipacoes{
    constructor(private readonly participacaoService: participacaoService){}
    
    @Get('/obras/:slug/participacoes')
    async listarParticipacoesNasObras(@Param('slug') slug: string){
        return await this.participacaoService.listarParticipacoes(slug);
    }


    @Get('/participacoes/:id')
    async listarParticipacoes(@Param('id', new ParseUUIDPipe()) id: string){
        return await this.participacaoService.listarParticipacoesPorId(id);
    }
    
    @Post('/obras/:obraId/participacoes')
    async criarParticipacao(@Param('obraId', new ParseUUIDPipe()) obraId: string, @Body(new ValidationPipe()) createParticipacaoDto: ParticipacaoDto){
        return await this.participacaoService.criarParticipacao(obraId, createParticipacaoDto);
    }
}