import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AtribuirPerfilDto {
  @ApiProperty({
    description: 'UUID do perfil.',
    format: 'uuid',
  })
  @IsUUID()
  perfilId!: string;
}
