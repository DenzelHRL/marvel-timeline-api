import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type StatusConteudo = 'RASCUNHO' | 'PUBLICADA' | 'ARQUIVADA';
export type TipoObra = 'FILME' | 'TEMPORADA';
export type PrioridadeEtapa = 'PRINCIPAL' | 'CONTEXTO';

@Entity('series')
export class Serie {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 160, unique: true }) slug: string;
  @Column({ type: 'varchar', length: 200 }) titulo: string;
  @Column({ type: 'text' }) descricao: string;
  @Column({ name: 'imagem_url', type: 'text', nullable: true }) imagemUrl:
    string | null;
  @Column({ type: 'varchar', length: 20, default: 'RASCUNHO' })
  status: StatusConteudo;
  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' }) criadoEm: Date;
  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamptz' })
  atualizadoEm: Date;
}

@Entity('obras')
export class Obra {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 180, unique: true }) slug: string;
  @Column({ type: 'varchar', length: 220 }) titulo: string;
  @Column({ type: 'varchar', length: 20 }) tipo: TipoObra;
  @Column({ name: 'ano_lancamento', type: 'smallint' }) anoLancamento: number;
  @Column({ name: 'serie_id', type: 'uuid', nullable: true }) serieId:
    string | null;
  @Column({ name: 'numero_temporada', type: 'smallint', nullable: true })
  numeroTemporada: number | null;
  @Column({ name: 'resumo_sem_spoiler', type: 'text' })
  resumoSemSpoiler: string;
  @Column({ name: 'resumo_com_spoiler', type: 'text', nullable: true })
  resumoComSpoiler: string | null;
  @Column({ name: 'imagem_url', type: 'text', nullable: true }) imagemUrl:
    string | null;
  @Column({ type: 'varchar', length: 20, default: 'RASCUNHO' })
  status: StatusConteudo;
  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' }) criadoEm: Date;
  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamptz' })
  atualizadoEm: Date;
}

@Entity('trilhas')
export class Trilha {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 160, unique: true }) slug: string;
  @Column({ type: 'varchar', length: 200 }) nome: string;
  @Column({ type: 'text' }) descricao: string;
  @Column({ type: 'varchar', length: 20, default: 'RASCUNHO' })
  status: StatusConteudo;
  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' }) criadoEm: Date;
  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamptz' })
  atualizadoEm: Date;
}

@Entity('etapas_trilha')
export class EtapaTrilha {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'trilha_id', type: 'uuid' }) trilhaId: string;
  @Column({ name: 'obra_id', type: 'uuid' }) obraId: string;
  @Column({ type: 'integer' }) posicao: number;
  @Column({ type: 'varchar', length: 20 }) prioridade: PrioridadeEtapa;
  @Column({ type: 'text', nullable: true }) justificativa: string | null;
}
