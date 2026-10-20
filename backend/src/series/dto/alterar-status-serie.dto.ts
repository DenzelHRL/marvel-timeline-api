import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty } from 'class-validator';
import type { StatusConteudo } from '../../database/entities/catalog.entities';

export class AlterarStatusSerieDto {
  @ApiProperty({
    description: 'Novo status da serie',
    enum: ['RASCUNHO', 'PUBLICADA', 'ARQUIVADA'],
    example: 'PUBLICADA',
  })
  @IsNotEmpty()
  @IsIn(['RASCUNHO', 'PUBLICADA', 'ARQUIVADA'])
  status!: StatusConteudo;
}
