import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Participacao, Personagem } from "../database/entities";
import { AuthModule } from "../auth/auth.module";
import { AcessoModule } from "../acesso/acesso.module";
import { ParticipacaoController } from "./participacoes.controller";
import { ParticipacaoService } from "./participacao.service";
import { ParticipacaoRepository } from "./participacao.repository";

@Module({
    imports: [
        TypeOrmModule.forFeature([Participacao]),
        AuthModule,
        AcessoModule,
    ],
    controllers: [ParticipacaoController],
    providers: [ParticipacaoService, ParticipacaoRepository],
    exports: [ParticipacaoService, ParticipacaoRepository]
})
export class ParticipacaoModule {}