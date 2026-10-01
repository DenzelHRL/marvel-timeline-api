import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 160 }) nome: string;
  @Column({ type: 'varchar', length: 254 }) email: string;
  @Column({ name: 'senha_hash', type: 'text', nullable: true }) senhaHash:
    string | null;
  @Column({ type: 'boolean', default: true }) ativo: boolean;
  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' }) criadoEm: Date;
  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamptz' })
  atualizadoEm: Date;
}

@Entity('identidades_externas')
export class IdentidadeExterna {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'usuario_id', type: 'uuid' }) usuarioId: string;
  @Column({ type: 'varchar', length: 30 }) provedor: string;
  @Column({ name: 'id_no_provedor', type: 'varchar', length: 255 })
  idNoProvedor: string;
}

@Entity('perfis')
export class Perfil {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 60, unique: true }) codigo: string;
  @Column({ type: 'text' }) descricao: string;
}

@Entity('permissoes')
export class Permissao {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 100, unique: true }) codigo: string;
  @Column({ type: 'text' }) descricao: string;
}

@Entity('usuario_perfis')
export class UsuarioPerfil {
  @PrimaryColumn({ name: 'usuario_id', type: 'uuid' }) usuarioId: string;
  @PrimaryColumn({ name: 'perfil_id', type: 'uuid' }) perfilId: string;
}

@Entity('perfil_permissoes')
export class PerfilPermissao {
  @PrimaryColumn({ name: 'perfil_id', type: 'uuid' }) perfilId: string;
  @PrimaryColumn({ name: 'permissao_id', type: 'uuid' }) permissaoId: string;
}
