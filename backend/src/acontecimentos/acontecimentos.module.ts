import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Acontecimento, AcontecimentoPersonagem, Obra, Personagem,  } from "../database/entities";
import { AuthModule } from "../auth/auth.module";
import { AcessoModule } from "../acesso/acesso.module";
import { AcontecimentosController } from "./acontecimentos.controller";
import { AcontecimentosService } from "./acontecimentos.service";
import { AcontecimentosRepository } from "./acontecimentos.repository";

@Module({
    imports: [
            TypeOrmModule.forFeature([
                Acontecimento,
                Personagem,
                Obra,
                AcontecimentoPersonagem,

            ]),
            AuthModule,
            AcessoModule,
        ],
        controllers: [AcontecimentosController],
        providers: [AcontecimentosService, AcontecimentosRepository],
        exports: [AcontecimentosService, AcontecimentosRepository]
})
export class AcontecimentosModule {}