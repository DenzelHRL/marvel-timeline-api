import { IsOptional, IsString, IsUrl, Matches, MaxLength } from "class-validator";

export class CriarPersonagemDto{
    @IsString()
    @MaxLength(160)
    @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'O slug deve conter letras minúsculas, números e hífens entre palavras.' })
    slug: string;
    
    @IsString()
    @MaxLength(200)
    @Matches(/\S/, { message: 'O nome não pode ser vazio ou conter apenas espaços em branco.' })
    nome: string;
    
    @IsString()
    @IsOptional()
    descricaoPublica?: string | null;
    
    @IsOptional()
    @IsUrl({protocols: ['http', 'https'], require_protocol: true}, { message: 'A URL da imagem deve ser válida e começar com http:// ou https://.' })
    imagemUrl?: string | null;
}