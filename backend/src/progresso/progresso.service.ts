import {Injectable, NotFoundException} from "@nestjs/common";
import {InjectDataSource} from "@nestjs/typeorm";
import {DataSource} from "typeorm";
import {EtapaTrilha, Obra, Progresso, Trilha} from "../database/entities";
import {ConsultarProgressoDTO, DefinirProgressoDTO} from "./dto";

@Injectable()
export class ProgressoService{
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource
    ){}

    //Endpoint: 68 -> GET /usuarios/me/progresso
    async listarMeuProgresso(usuarioId: string, filtros: ConsultarProgressoDTO){
        const {status, obraId, pagina=1, limite=20} = filtros;

        const query = this.dataSource
            .getRepository(Progresso)
            .createQueryBuilder("p")
            .where("p.usuario_id = :usuarioId", {usuarioId});

        if(status){
            query.andWhere("p.status = :status", {status});
        }

        if(obraId){
            query.andWhere("p.obra_id = :obraId", {obraId});
        }

        query.orderBy("p.atualizado_em", "DESC");

        const total = await query.getCount();
        const dados = await query
            .skip((pagina-1)*limite)
            .take(limite)
            .getMany();

        return {
            dados,
            meta:{
                pagina,
                limite,
                total,
                totalPaginas: Math.ceil(total/limite)
            }
        };
    }

    //Endpoint: 69 -> GET /usuarios/me/progresso/:obraId
    async consultarPorObra(usuarioId: string, obraId: string){
        const progresso = await this.dataSource.getRepository(Progresso).findOne({
            where:{usuarioId, obraId}
        })

        if(!progresso){
            throw new NotFoundException("Obra não possui progresso registrado  para este usuário.");
        }

        return progresso;
    }

    //Endpoint: 70 -> PUT /usuarios/me/progresso/:obraId
    async definirProgresso(usuarioId: string, obraId: string, dto: DefinirProgressoDTO){
        const obra = await this.dataSource.getRepository(Obra).findOne({
            where:{id: obraId}
        });

        if(!obra){
            throw new NotFoundException("Obra não encontrada.");
        }

        const progressoRepo = this.dataSource.getRepository(Progresso);
        let progresso = await progressoRepo.findOne({
            where:{usuarioId, obraId}
        });

        //Filtro Regra de Negóicio: concluido_em se CONCLUIDO, tirar caso for outro status
        const concluidoEm = dto.status === "CONCLUIDO" ? new Date(): null;

        if(!progresso){
            progresso = progressoRepo.create({
                usuarioId,
                obraId,
                status: dto.status,
                concluidoEm
            });
        }else{
            progresso.status = dto.status;
            progresso.concluidoEm = concluidoEm;
        }

        return progressoRepo.save(progresso);
    }

    //Endpoint: 71 -> DELETE  /usuarios/me/progresso/:obraId
    async removerProgresso(usuarioId: string, obraId: string){
        const progressoRepo = this.dataSource.getRepository(Progresso);
        const progresso = await progressoRepo.findOne({
            where:{usuarioId, obraId}
        });

        if(!progresso){
            throw new NotFoundException("Progresso não encontrado para esta obra.");
        }

        await progressoRepo.delete({usuarioId, obraId});
        return {message: "Progresso da obra removido com sucesso."};
    }

    //Endpoint: 72 -> GET /usuarios/me/trilhas/:slug/progresso
    async consultarProgressoTrilha(usuarioId: string, slugTrilha: string){
        
        //Filtro: trilha publicada
        const  trilha = await this.dataSource.getRepository(Trilha).findOne({
            where:{slug: slugTrilha, status: "PUBLICADA"}
        });

        if(!trilha){
            throw new NotFoundException(`Trilha "${slugTrilha}" não encontrada ou não publicada.`);
        }

        //Filtro: todas as etapas da trilha
        const etapas = await this.dataSource.getRepository(EtapaTrilha).find({
            where:{trilhaId: trilha.id}
        });

        const obraIds = Array.from(new Set(etapas.map((e) => e.obraId)));
        const totalObras = obraIds.length;

        if(totalObras === 0){
            return{
                trilhaSlug: trilha.slug,
                trilhaNome: trilha.nome,
                totalObras: 0,
                concluidas: 0,
                emAndamento: 0,
                queroVer: 0,
                naoIniciadas: 0,
                percentualConclusao: 0
            };
        }

        //Filtro: progresso usuário pra obras dessa trilha
        const progressos = await this.dataSource
            .getRepository(Progresso)
            .createQueryBuilder("p")
            .where("p.usuario_id = :usuarioId", {usuarioId})
            .andWhere("p.obra_id IN (:...obraIds)", {obraIds})
            .getMany();

            let concluidas = 0;
            let emAndamento = 0;
            let queroVer = 0;

            for(const p of progressos){
                if(p.status === "CONCLUIDO") concluidas++;
                else if(p.status === "ASSISTINDO") emAndamento++;
                else if(p.status === "QUERO_VER") queroVer++;
            }

            const naoIniciadas = totalObras - (concluidas + emAndamento + queroVer);
            const percentualConclusao = Math.round((concluidas/totalObras) * 1000)/10;

        return{
            trilhaSlug: trilha.slug,
            trilhaNome: trilha.nome,
            totalObras,
            concluidas,
            emAndamento,
            queroVer,
            naoIniciadas,
            percentualConclusao  
        };
    }

}