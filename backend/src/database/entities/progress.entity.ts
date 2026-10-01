import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export type StatusProgresso = 'QUERO_VER' | 'ASSISTINDO' | 'CONCLUIDO';

@Entity('progresso')
export class Progresso {
  @PrimaryColumn({ name: 'usuario_id', type: 'uuid' }) usuarioId: string;
  @PrimaryColumn({ name: 'obra_id', type: 'uuid' }) obraId: string;
  @Column({ type: 'varchar', length: 20 }) status: StatusProgresso;
  @Column({ name: 'concluido_em', type: 'timestamptz', nullable: true })
  concluidoEm: Date | null;
  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamptz' })
  atualizadoEm: Date;
}
