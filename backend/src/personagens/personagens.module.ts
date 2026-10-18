import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PersonagensAdminController, PersonagensController } from "./personagens.controller";
import { PersonagensService } from "./personagens.service";
import { PersonagensRepository } from "./personagens.repository";
import { Personagem } from "../database/entities/story.entities";
import { AuthModule } from "../auth/auth.module";
import { AcessoModule } from "../acesso/acesso.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Personagem]),
        AuthModule,
        AcessoModule,
    ],
    controllers: [PersonagensController, PersonagensAdminController],
    providers: [PersonagensService, PersonagensRepository],
    exports: [PersonagensService, PersonagensRepository]
})
export class PersonagensModule {}