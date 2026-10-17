import { SetMetadata } from '@nestjs/common';

export const AUDITORIA_METADATA_KEY = 'AUDITORIA_METADATA_KEY';

export interface AuditoriaOpcoes {
  acao: string;
  recurso: string;
  idParam?: string;
}

/**
 * Decorator para marcar acoes administrativas que devem ser auditadas.
 * Registra o usuario autenticado, recurso, acao e o resultado (concluido, rejeitado ou falhou).
 * Nao substitui o @Authorize e nao concede permissoes.
 */
export const Auditar = (opcoes: AuditoriaOpcoes) =>
  SetMetadata(AUDITORIA_METADATA_KEY, opcoes);
