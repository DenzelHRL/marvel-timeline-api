import {ApiProperty} from "@nestjs/swagger";
import {IsIn, IsNotEmpty} from "class-validator";

export class DefinirProgressoDTO{
    @ApiProperty({
        description: "Estado pessoal do usuário em relação à obra",
        enum: ["QUERO_VER", "ASSISTINDO", "CONCLUIDO"],
        example: "CONCLUIDO",
    })
    @IsNotEmpty({message: "status não pode ser vazio"})
    @IsIn(["QUERO_VER", "ASSISTINDO", "CONCLUIDO"], {
        message: "status deve ser QUERO_VER, ASSISTINDO ou CONCLUIDO",
    })
    status: "QUERO_VER" | "ASSISTINDO" | "CONCLUIDO";

}