import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type StatusComentario = 'PUBLICADO' | 'OCULTO' | 'REMOVIDO';

@Entity('comentarios')
export class Comentario {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'obra_id', type: 'uuid' }) obraId: string;
  @Column({ name: 'usuario_id', type: 'uuid' }) usuarioId: string;
  @Column({ type: 'text' }) texto: string;
  @Column({ name: 'contem_spoiler', type: 'boolean', default: false })
  contemSpoiler: boolean;
  @Column({ type: 'varchar', length: 20, default: 'PUBLICADO' })
  status: StatusComentario;
  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' }) criadoEm: Date;
  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamptz' })
  atualizadoEm: Date;
}
