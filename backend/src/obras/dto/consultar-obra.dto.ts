import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class ConsultarObraDto {
  @ApiPropertyOptional({
    description: 'Se true, inclui os resumos e detalhes com spoiler na resposta (Regra R03)',
    type: Boolean,
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  incluirSpoilers?: boolean;
}
