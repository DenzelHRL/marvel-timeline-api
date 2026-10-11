import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import{Comentario, Obra} from '../database/entities';
import {ConsultarComentariosDTO} from './dto/consultar-comentarios.dto';

@Injectable()
export class ComentariosService{
    constructor(
        @InjectRepository(Comentario)
        private readonly comentarioRepo: Repository<Comentario>,

        @InjectRepository(Obra)
        private readonly obraRepo: Repository<Obra>,
    ){}

    //Endpoint: 60 -> GET /obras/:slug/comentarios
    async listarPorObra(slugObra: string, filtros: ConsultarComentariosDTO){
        
        //Regra de negócio R01: obra precisa existir e estar PUBLICADA
        const obra = await this.obraRepo.findOne({
            where: {slug: slugObra, status: 'PUBLICADA'},
        });

        if(!obra){
            throw new NotFoundException(
                `Obra com slug"${slugObra}" não encontrada ou não publicada.`,
            );
        }

        const{
            contemSpoiler,
            usuarioId,
            revelarSpoilers = false,
            pagina = 1,
            limite = 20,
        } = filtros;

        //Regra de negócio R09: Só exibir comentários com status PUBLICADO
        const query = this.comentarioRepo
            .createQueryBuilder('c')
            .where('c.obra_id = :obraId', {obraId: obra.id})
            .andWhere('c.status = :status', {status: 'PUBLICADO'});

        //Propriedade Filtro: contemSpoiler
        if(typeof contemSpoiler === 'boolean'){
            query.andWhere('c.contem_spoiler = :contemSpoiler', {contemSpoiler});
        }

        //Propriedade Filtro: usuarioId
        if(usuarioId){
            query.andWhere('c.usuarioId = :usuarioId', {usuarioId});
        }

        //Ordenação
        query.orderBy('c.criado_em', 'DESC');

        //Total de registros antes da paginação
        const total = await query.getCount();

        //Paginação com offset
        const registros = await query
        .skip((pagina - 1) * limite)
        .take(limite)
        .getMany();

        //Regra de negócio R03: Não mostrar texto de spoilers se não for selecionado
        const dados = registros.map((c) => ({
            id: c.id,
            obraId: c.obraId,
            usuarioId: c.usuarioId,
            texto:
                c.contemSpoiler && !revelarSpoilers
                    ? '[Conteúdo oculto por conter spoilers. Envie ?revelarSpoilers=true para visualizar.]'
                    : c.texto,
            contemSpoiler: c.contemSpoiler,
            criadoEm: c.criadoEm
        }));

        return{
            dados,
            meta:{
                pagina,
                limite,
                total,
                totalPaginas: Math.ceil(total/limite),
            },
        };
    }

    // Endpoint: 61 -> GET /comentarios/:id
    async buscarPorId (id: string, revelarSpoilers: boolean){
        const comentario = await this.comentarioRepo.findOne({
            where:{id, status: 'PUBLICADO'},
        });

        if(!comentario){
            throw new NotFoundException(
                'Comentário não encontrado ou não visível.'
            );
        }

        return {
            id: comentario.id,
            obraId: comentario.obraId,
            usuarioId: comentario.usuarioId,
            texto:
                comentario.contemSpoiler && !revelarSpoilers
                ? '[Conteúdo oculto por conter spoilers. Envie ?revelarSpoilers=true para visualizar.]'
                : comentario.texto,
            contemSpoiler: comentario.contemSpoiler,
            criadoEm: comentario.criadoEm,
        };
    }
}