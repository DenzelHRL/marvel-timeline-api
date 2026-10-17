import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import type { StatusConteudo } from '../../database/entities/catalog.entities';

export class AlterarStatusTrilhaDto {
  @ApiProperty({
    description: 'Novo status da trilha.',
    enum: ['RASCUNHO', 'PUBLICADA', 'ARQUIVADA'],
    example: 'PUBLICADA',
  })
  @IsIn(['RASCUNHO', 'PUBLICADA', 'ARQUIVADA'], {
    message:
      'status deve ser RASCUNHO, PUBLICADA ou ARQUIVADA.',
  })
  status!: StatusConteudo;
}