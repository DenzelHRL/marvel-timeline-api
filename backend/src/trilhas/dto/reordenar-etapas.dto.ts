import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsUUID,
} from 'class-validator';

export class ReordenarEtapasDto {
  @ApiProperty({
    description:
      'IDs de todas as etapas da trilha, exatamente uma vez, na ordem desejada. Use o ID da etapa, não o ID da obra.',
    type: 'array',
    items: {
      type: 'string',
      format: 'uuid',
    },
    minItems: 1,
    uniqueItems: true,
    example: [
      'e1f8988c-cddf-4923-987b-e15cd5b1ea57',
      'a03e0160-d226-412d-b751-f0d72b14f2a3',
    ],
  })
  @IsArray({
    message: 'etapaIds deve ser uma lista.',
  })
  @ArrayNotEmpty({
    message: 'Informe pelo menos uma etapa para reordenar.',
  })
  @ArrayUnique({
    message: 'A lista não pode conter etapas repetidas.',
  })
  @IsUUID('all', {
    each: true,
    message: 'Cada etapaId deve ser um UUID válido.',
  })
  etapaIds: string[];
}