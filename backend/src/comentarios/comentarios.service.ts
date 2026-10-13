import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import{Comentario, Obra, Usuario} from '../database/entities';
import{
   ConsultarComentariosDTO,
   CriarComentarioDTO,
   AtualizarComentarioDTO 
}
from './dto';

@Injectable()
export class ComentariosService{
    constructor(
        @InjectRepository(Comentario)
        private readonly comentarioRepo: Repository<Comentario>,

        @InjectRepository(Obra)
        private readonly obraRepo: Repository<Obra>,

        @InjectRepository(Usuario)
        private readonly usuarioRepo: Repository<Usuario>
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

    // Endpoint: 62 -> GET /obras/:obraId/comentarios
    async criar(obraId: string, usuarioId: string, dto: CriarComentarioDTO){
        
        //Regra de negócio R09: Comenta obra PUBLICADA
        const obra = await this.obraRepo.findOne({
            where:{id: obraId, status:'PUBLICADA'}
        });

        if(!obra){
            throw new NotFoundException(
                "Obra não encontrada ou não disponível para comentários."
            );
        }

        //Regra de negócio R09: Conta ATIVA comenta
        const usuario = await this.usuarioRepo.findOne({where:{id: usuarioId}})
        if(!usuario){
            throw new NotFoundException("Usuário não encontrado")
        }
        if(!usuario.ativo){
            throw new NotFoundException("Usuários desativados não podem comentar.")
        }

        //Cria e mantém o comentário com status PUBLICADO
        const novoComentario = this.comentarioRepo.create({
            obraId: obra.id,
            usuarioId: usuario.id,
            texto: dto.texto.trim(),
            contemSpoiler: dto.contemSpoiler ?? false,
            status: 'PUBLICADO'
        })

        const salvo = await this.comentarioRepo.save(novoComentario);

        return{
            id: salvo.id,
            obraId: salvo.obraId,
            usuarioId: salvo.usuarioId,
            texto: salvo.texto,
            contemSpoiler: salvo.contemSpoiler,
            status: salvo.status,
            criadoEm: salvo.criadoEm
        };
    }

    // Endpoint: 63 -> PATCH /comentarios/:id
    async atualizar(id: string, usuarioId: string, dto:AtualizarComentarioDTO){
        const comentario = await this.comentarioRepo.findOne({where: {id}});

        if(!comentario || comentario.status === 'REMOVIDO'){
            throw new NotFoundException("Comentário não encontrado.");
        }

        //Regra de negócio R09: Só o autor pode editar o comentário
        if(comentario.usuarioId !== usuarioId){
            throw new ForbiddenException(
                "Você não tem permissão para editar comentários de outros usuários."
            );
        }

        //Caso os adms ocultem o comentário, o autor não consegue alterar:
        if(dto.texto !== undefined){
            comentario.texto = dto.texto.trim();
        }
        if(dto.contemSpoiler !== undefined){
            comentario.contemSpoiler = dto.contemSpoiler;
        }

        const atualizado = await this.comentarioRepo.save(comentario);

        return{
            id: atualizado.id,
            obraId: atualizado.obraId,
            usuarioId: atualizado.usuarioId,
            texto: atualizado.texto,
            contemSpoiler: atualizado.contemSpoiler,
            status: atualizado.status,
            atualizadoEm: atualizado.atualizadoEm
        };
    }

    // Endpoint: 64 -> DELETE /comentarios/:id (Remoção Lógica)
    async remover(id: string, usuarioId: string){
        const comentario = await this.comentarioRepo.findOne({where: {id}});
        
        if(!comentario || comentario.status === "REMOVIDO"){
            throw new NotFoundException("Comentário não encontrado.");
        }

        //Regra de negócio R09: Só o autor pode editar o comentário
        if(comentario.usuarioId !== usuarioId){
            throw new ForbiddenException(
                "Você não tem permissão para remover comentários de outros usuários."
            )
        };

        //Remoção lógica: marca como REMOVIDO em vez de apagar do banco.
        comentario.status = "REMOVIDO";
        await this.comentarioRepo.save(comentario);

        return{mensagem: "Comentário removido com sucesso."};
    }

}