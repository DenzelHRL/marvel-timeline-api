export const FILA_MAPA = 'mapa-trilhas';
export const JOB_RECONSTRUIR_MAPA = 'reconstruir-mapa';

export interface ReconstruirMapaJob {
  eventId: string;
  trilhaId: string;
  versao: string;
}