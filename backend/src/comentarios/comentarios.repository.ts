import {Injectable} from "@nestjs/common";
import {DataSource, Repository} from "typeorm";
import {Comentario, StatusComentario} from ".././database/entities/comment.entity";
import { ConsultarComentariosDTO, ConsultarMeusComentariosDTO} from "./dto";

@Injectable()
export class ComentariosRepository extends Repository<Comentario>{
    constructor(private readonly dataSource: DataSource){
        super(Comentario, dataSource.createEntityManager());
    }

    //Filtro: comentários públicos

    async buscarPorObra(obraId: string, filtros: ConsultarComentariosDTO): Promise<[Comentario[], number]>{
        const {contemSpoiler, usuarioId, pagina = 1, limite = 20} = filtros;

        const query = this.createQueryBuilder("c")
            .where("c.obraId = :obraId", {obraId})
            .andWhere("c.status = :status", {status: "PUBLICADO" as StatusComentario});

        if (typeof contemSpoiler === "boolean") {
            query.andWhere("c.contemSpoiler = :contemSpoiler", {contemSpoiler});
        }

        if (usuarioId) {
            query.andWhere("c.usuarioId = :usuarioId", {usuarioId});
        }

        return query
            .orderBy("c.criadoEm", "DESC")
            .skip((pagina - 1) * limite)
            .take(limite)
            .getManyAndCount();
    }

    //Filtro: comentários do próprio usuário
    async buscarPorUsuario(usuarioId: string, filtros: ConsultarMeusComentariosDTO): Promise<[Comentario[], number]> {
        const {status, contemSpoiler, pagina = 1, limite = 20} = filtros;

        const query = this.createQueryBuilder("c")
            .where("c.usuarioId = :usuarioId", {usuarioId});

        if (status) {
            query.andWhere("c.status = :status", {status});
        }

        if (typeof contemSpoiler === "boolean") {
            query.andWhere("c.contemSpoiler = :contemSpoiler", {contemSpoiler});
        }

        return query
            .orderBy("c.criadoEm", "DESC")
            .skip((pagina - 1) * limite)
            .take(limite)
            .getManyAndCount();
    }

    //Filtro: lista moderação
    async listarFilaModeracao(filtros: ConsultarMeusComentariosDTO): Promise<[Comentario[], number]> {
        const {status, contemSpoiler, pagina = 1, limite = 20} = filtros;

        const query = this.createQueryBuilder("c");

        if (status) {
            query.andWhere("c.status = :status", {status});
        }

        if (typeof contemSpoiler === "boolean") {
            query.andWhere("c.contemSpoiler = :contemSpoiler", {contemSpoiler});
        }

        return query
            .orderBy("c.criadoEm", "DESC")
            .skip((pagina - 1) * limite)
            .take(limite)
            .getManyAndCount();
    }
}