import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, Matches, MaxLength } from "class-validator";

export class CriarPersonagemDto{
    @IsString()
    @MaxLength(160)
    @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'O slug deve conter letras minúsculas, números e hífens entre palavras' })
    @ApiProperty({
      description: 'Identificador textual do personagem, com letras minúsculas, números e hífens',
      maxLength: 160,
    })
    slug: string;
    
    @IsString()
    @MaxLength(200)
    @Matches(/\S/, { message: 'O nome não pode ser vazio ou conter apenas espaços em branco' })
    @ApiProperty({
      description: 'Nome do personagem',
      maxLength: 200,
    })
    nome: string;
    
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({
      description: 'Descrição pública do personagem, sem spoilers. Aceita null',
    })
    descricaoPublica?: string | null;
    
    @IsOptional()
    @IsUrl({protocols: ['http', 'https'], require_protocol: true}, { message: 'A URL da imagem deve ser válida e começar com http:// ou https://' })
    @ApiPropertyOptional({
      description: 'URL da imagem do personagem, iniciada por http:// ou https://. Aceita null',
    })
    imagemUrl?: string | null;
}
