import {ConflictException, Injectable, NotFoundException} from "@nestjs/common";
import {InjectDataSource} from "@nestjs/typeorm";
import {DataSource, QueryFailedError} from "typeorm";
import{Perfil, Permissao, Usuario, UsuarioPerfil} from "../database/entities";
import{
    AtualizarMinhaContaDTO,
    ConsultarMinhasPermissoesDTO
} from "./dto";

@Injectable()
export class UsuariosService{
    constructor(
        @InjectDataSource() 
        private readonly dataSource: DataSource
    ){}

    //Endpoint: 05 -> GET /usuarios/me
    async consultarMinhaConta(usuarioId: string){
        const usuario = await this.dataSource.getRepository(Usuario).findOne({
            where: {id: usuarioId}
        });

        if(!usuario){
            throw new NotFoundException("Conta não encontrada.");
        }

        //Filtro: Busca códigos ['LEITOR'] ou ['ADMIN'] dos perfis do usuário
        const vinculoPerfis = await this.dataSource
            .getRepository(UsuarioPerfil)
            .find({where: {usuarioId}});
        
        const perfilIds = vinculoPerfis.map((v) => v.perfilId);
        let perfisCodigos: string[] = [];

        if(perfilIds.length > 0){
            const perfis = await this.dataSource
                .getRepository(Perfil)
                .createQueryBuilder("p")
                .where("p.id IN (:...perfilIds)", {perfilIds})
                .getMany();
            
            perfisCodigos = perfis.map((p) => p.codigo);
        }

        return{
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            ativo: usuario.ativo,
            perfis: perfisCodigos,
            criadoEm: usuario.criadoEm,
            atualizadoEm: usuario.atualizadoEm
        };
    }

    //Endpoint: 06 -> PATCH /usuarios/me
    async atualizarMinhaConta(usuarioId: string, dto: AtualizarMinhaContaDTO){
        const usuarioRepo = this.dataSource.getRepository(Usuario);
        const usuario = await usuarioRepo.findOne({where: {id: usuarioId}});

        if(!usuario){
            throw new NotFoundException("Conta de usuário não encontrada.")
        }

        //Filtro Regra de Negócio: verifica se email usuário já está em outra conta antes de aterar.
        const emailNormalizado = dto.email?.trim().toLowerCase();
        if(emailNormalizado && emailNormalizado !== usuario.email){
            const emailEmUso = await usuarioRepo
                .createQueryBuilder("u")
                .where("LOWER(u.email) = :email", {email: emailNormalizado})
                .andWhere("u.id != :usuarioId", {usuarioId})
                .getOne();

            if(emailEmUso){
                throw new ConflictException("Já existe uma conta cadastrada com esse e-mail.");
            }

            usuario.email = emailNormalizado;
        }

        if(dto.nome !== undefined){
            usuario.nome = dto.nome.trim();
        }

        try {
            await usuarioRepo.save(usuario);
        } catch (error) {
            if (this.isEmailUniqueViolation(error)) {
                throw new ConflictException("Já existe uma conta cadastrada com esse e-mail.");
            }
            throw error;
        }

        return this.consultarMinhaConta(usuarioId);
    }

    //Endpoint: 07 -> GET /usuarios/me/permissoes
    async consultarMinhasPermissoes(usuarioId: string, filtros: ConsultarMinhasPermissoesDTO){
        const {codigo, descricao, pagina=1, limite=20} = filtros;

        //Consulta: une usuario_perfis + perfil_permissoes + permissoes
        // Busca as permissões cujo ID esteja vinculado aos perfis do usuário logado
        const query = this.dataSource
            .getRepository(Permissao)
            .createQueryBuilder('perm')
            .where(
                `perm.id IN (
                    SELECT pp.permissao_id 
                    FROM perfil_permissoes pp 
                    JOIN usuario_perfis up ON up.perfil_id = pp.perfil_id 
                    WHERE up.usuario_id = :usuarioId
                )`,
                { usuarioId },
            );
            
        //Filtro: por código
        if(codigo){
            query.andWhere("perm.codigo ILIKE :codigo", {codigo: `%${codigo}%`});
        }

        //Filtro: por descrição
        if(descricao){
            query.andWhere("perm.descricao ILIKE :descricao", {descricao: `%${descricao}%`});
        }

        query.orderBy("perm.codigo", "ASC");

        const total = await query.getCount();
        const dados = await query
            .skip((pagina - 1 ) * limite)
            .take(limite)
            .getMany();

        return{
            dados,
            meta:{
                pagina,
                limite,
                total,
                totalPaginas: Math.ceil(total/limite)
            }
        };
    }

    private isEmailUniqueViolation(error: unknown): boolean {
        if (!(error instanceof QueryFailedError)) {
            return false;
        }

        const driverError: unknown = error.driverError;
        return (
            typeof driverError === "object" &&
            driverError !== null &&
            "code" in driverError &&
            driverError.code === "23505" &&
            "constraint" in driverError &&
            driverError.constraint === "uq_usuarios_email_ci"
        );
    }
}