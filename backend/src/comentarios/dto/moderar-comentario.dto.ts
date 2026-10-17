import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty } from 'class-validator';

export class ModerarComentarioDTO{
    @ApiProperty({
        description: "Novo status aplicado pela moderação",
        enum: ['PUBLICADO', 'OCULTO'],
        example:'OCULTO'
    })
    @IsNotEmpty({message: "status não pode ser vazio"})
    @IsIn(['PUBLICADO', 'OCULTO'], {
        message: "status para nmoderação deve ser PUBLICADO ou OCULTO"
    })
    status: 'PUBLICADO' | 'OCULTO';
}