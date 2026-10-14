import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PersonagensAdminController, PersonagensController } from "./personagens.controller";
import { PersonagensService } from "./personagens.service";
import { PersonagensRepository } from "./personagens.repository";
import { Personagem } from "../database/entities/story.entities";

@Module({
    imports: [TypeOrmModule.forFeature([Personagem])],
    controllers: [PersonagensController, PersonagensAdminController],
    providers: [PersonagensService, PersonagensRepository],
    exports: [PersonagensService, PersonagensRepository]
})
export class PersonagensModule {}