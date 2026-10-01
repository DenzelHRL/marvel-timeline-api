import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('personagens')
export class Personagem {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 160, unique: true }) slug: string;
  @Column({ type: 'varchar', length: 200 }) nome: string;
  @Column({ name: 'descricao_publica', type: 'text', nullable: true })
  descricaoPublica: string | null;
  @Column({ name: 'imagem_url', type: 'text', nullable: true }) imagemUrl:
    string | null;
  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' }) criadoEm: Date;
  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamptz' })
  atualizadoEm: Date;
}

@Entity('participacoes')
export class Participacao {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'obra_id', type: 'uuid' }) obraId: string;
  @Column({ name: 'personagem_id', type: 'uuid' }) personagemId: string;
  @Column({ type: 'varchar', length: 40 }) papel: string;
  @Column({ name: 'descricao_publica', type: 'text', nullable: true })
  descricaoPublica: string | null;
  @Column({ name: 'presenca_e_spoiler', type: 'boolean', default: false })
  presencaESpoiler: boolean;
  @Column({ name: 'desfecho_spoiler', type: 'text', nullable: true })
  desfechoSpoiler: string | null;
  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' }) criadoEm: Date;
  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamptz' })
  atualizadoEm: Date;
}

@Entity('acontecimentos')
export class Acontecimento {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'obra_id', type: 'uuid' }) obraId: string;
  @Column({ type: 'varchar', length: 200 }) titulo: string;
  @Column({ type: 'text' }) descricao: string;
  @Column({ type: 'varchar', length: 40 }) categoria: string;
  @Column({ type: 'integer' }) posicao: number;
  @Column({ name: 'contem_spoiler', type: 'boolean', default: false })
  contemSpoiler: boolean;
  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' }) criadoEm: Date;
  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamptz' })
  atualizadoEm: Date;
}

@Entity('acontecimento_personagens')
export class AcontecimentoPersonagem {
  @PrimaryColumn({ name: 'acontecimento_id', type: 'uuid' })
  acontecimentoId: string;
  @PrimaryColumn({ name: 'personagem_id', type: 'uuid' }) personagemId: string;
}
