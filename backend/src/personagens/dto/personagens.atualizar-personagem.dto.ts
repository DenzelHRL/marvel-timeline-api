import { PartialType } from "@nestjs/swagger";
import {CriarPersonagemDto} from './personagens.criar-personagem.dto'

export class AtualizarPersonagemDto extends PartialType(CriarPersonagemDto, { skipNullProperties: false}) {}