import { Inject, Injectable } from "@nestjs/common";
import { Acontecimento } from "../database/entities";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class AcontecimentosRepository{
    constructor(
        @InjectRepository(Acontecimento)
        private readonly repository: Repository<Acontecimento>
    ){}
}