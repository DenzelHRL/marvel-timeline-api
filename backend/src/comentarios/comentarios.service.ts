import {BadRequestException, ForbiddenException, Injectable, NotFoundException} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Obra, StatusConteudo} from "../database/entities/catalog.entities";
import {Comentario, StatusComentario} from "../database/entities/comment.entity";
import {ComentariosRepository} from "./comentarios.repository";
import {Usuario} from "../database/entities";
import {ConsultarComentariosDTO, CriarComentarioDTO, AtualizarComentarioDTO, ConsultarMeusComentariosDTO, ModerarComentarioDTO}from "./dto";

@Injectable()
export class ComentariosService{
    private readonly texto_spoiler = "[Conteúdo oculto por conter spoilers. Para revelar coloque: ?revelarSpoilers=true]";
    constructor(
        private readonly comentarioRepo: ComentariosRepository,

        @InjectRepository(Obra)
        private readonly obraRepo: Repository<Obra>,

        @InjectRepository(Usuario)
        private readonly usuarioRepo: Repository<Usuario>
    ){}

    //Endpoint: 60 -> GET /obras/:slug/comentarios
    async listarPorObra(slugObra: string, filtros: ConsultarComentariosDTO){
        
        //Regra de negócio R01: obra precisa existir e estar PUBLICADA
        const obra = await this.obraRepo.findOne({
            where: {slug: slugObra, status: "PUBLICADA" as StatusConteudo},
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

        const [registros, total] = await this.comentarioRepo.buscarPorObra(obra.id, filtros);
        
        return{
            dados: registros.map((c) => this.formatarComentario(c, revelarSpoilers)),
            meta: this.criarPaginacao(total, pagina, limite)
        };
    }

    // Endpoint: 61 -> GET /comentarios/:id
    async buscarPorId (id: string, revelarSpoilers: boolean){
        const comentario = await this.comentarioRepo.findOne({
            where:{id, status: "PUBLICADO" as StatusComentario},
        });

        if(!comentario){
            throw new NotFoundException(
                "Comentário não encontrado ou não visível."
            );
        }

        return this.formatarComentario(comentario, revelarSpoilers);
    }

    // Endpoint: 62 -> GET /obras/:obraId/comentarios
    async criar(obraId: string, usuarioId: string, dto: CriarComentarioDTO){
        
        //Regra de negócio R09: Comenta obra PUBLICADA
        const obra = await this.obraRepo.findOne({
            where:{id: obraId, status:"PUBLICADA" as StatusConteudo}
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
            status: "PUBLICADO" as StatusComentario
        })

        const salvo = await this.comentarioRepo.save(novoComentario);

        return this.enviarResponse(salvo);
    }

    // Endpoint: 63 -> PATCH /comentarios/:id
    async atualizar(id: string, usuarioId: string, dto:AtualizarComentarioDTO){
        const comentario = await this.buscarComentarioValido(id);
        this.validarPermissao(comentario, usuarioId, "editar");

        //Caso os adms ocultem o comentário, o autor não consegue alterar:
        if(dto.texto !== undefined){
            comentario.texto = dto.texto.trim();
        }
        if(dto.contemSpoiler !== undefined){
            comentario.contemSpoiler = dto.contemSpoiler;
        }

        const atualizado = await this.comentarioRepo.save(comentario);

        return this.enviarResponse(atualizado);
    }

    // Endpoint: 64 -> DELETE /comentarios/:id (Remoção Lógica)
    async remover(id: string, usuarioId: string){
        const comentario = await this.buscarComentarioValido(id);
        this.validarPermissao(comentario, usuarioId, "remover");
        
        comentario.status = "REMOVIDO" as StatusComentario;
        await this.comentarioRepo.save(comentario);
    
        return{mensagem: "Comentário removido com sucesso."};
    }

    // Endpoint: 65 -> GET /usuarios/me/comentarios (Hitórico do autor)
    async listarMeusComentarios(usuarioId: string, filtros: ConsultarMeusComentariosDTO){
        const {pagina = 1, limite = 20} = filtros;
        const [registros, total] = await this.comentarioRepo.buscarPorUsuario(usuarioId, filtros);

        return{
            dados: registros.map((c) => this.enviarResponse(c)),
            meta: this.criarPaginacao(total, pagina, limite)
        };
    }

    // Endpoint: 66 -> GET /admin/comentarios (Fila de moderação)
    async listarFilaModeracao(filtros: ConsultarMeusComentariosDTO){
        const {pagina = 1, limite = 20} = filtros;
        const [registros, total] = await this.comentarioRepo.listarFilaModeracao(filtros);

        return{
            dados: registros.map((c) => this.enviarResponse(c)),
            meta: this.criarPaginacao(total, pagina, limite)
        };
    }   
    
    // Endpoint: 67 -> PATCH /admin/comentarios/:id/moderacao
    async moderar(id: string, dto: ModerarComentarioDTO){
        const comentario = await this.comentarioRepo.findOne({where: {id}});

        if(!comentario){
            throw new NotFoundException("Comentário não encontrado.");
        }

        comentario.status = dto.status;
        const atualizado = await this.comentarioRepo.save(comentario);

        return this.enviarResponse(atualizado);
    }

    //MÉTODOS PRIVADOS HELPERS

    //Valida o comentário
    private async buscarComentarioValido(id: string): Promise<Comentario> {
        const comentario = await this.comentarioRepo.findOne({ where: { id } });

        if (!comentario || comentario.status === ('REMOVIDO' as StatusComentario)) {
            throw new NotFoundException('Comentário não encontrado.');
        }

        return comentario;
    }

    //Restringe usuario de editar ou remover outros comentarios (Só adm pode)
    private validarPermissao(comentario: Comentario, usuarioId: string, acao: 'editar' | 'remover'): void {
        if (comentario.usuarioId !== usuarioId) {
            throw new ForbiddenException(
                `Você não tem permissão para ${acao} comentários de outros usuários.`,
            );
        }
    }

    //Exibe mensagem de spoiler
    private formatarComentario(comentario: Comentario, revelarSpoilers: boolean) {
        const dto = this.enviarResponse(comentario);
        return {
            ...dto,
            texto:
            comentario.contemSpoiler && !revelarSpoilers
                ? this.texto_spoiler
                : comentario.texto,
        };
    }

    //Envia todos os dados para Response
    private enviarResponse(comentario: Comentario) {
        return {
            id: comentario.id,
            obraId: comentario.obraId,
            usuarioId: comentario.usuarioId,
            texto: comentario.texto,
            contemSpoiler: comentario.contemSpoiler,
            status: comentario.status,
            criadoEm: comentario.criadoEm,
            atualizadoEm: comentario.atualizadoEm,
        };
    }

    //Cria offset paginação
    private criarPaginacao(total: number, pagina: number, limite: number) {
        return {
            pagina,
            limite,
            total,
            totalPaginas: Math.ceil(total / limite) || 1,
        };
    }
}
