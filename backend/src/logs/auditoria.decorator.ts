import { SetMetadata } from '@nestjs/common';

export const AUDITORIA_METADATA_KEY = 'AUDITORIA_METADATA_KEY';

export interface AuditoriaOpcoes {
  acao: string;
  recurso: string;
  idParam?: string;
}

export const Auditar = (opcoes: AuditoriaOpcoes) =>
  SetMetadata(AUDITORIA_METADATA_KEY, opcoes);
