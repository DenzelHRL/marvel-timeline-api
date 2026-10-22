import { ApiProperty } from '@nestjs/swagger';

export class UsuarioAdminRespostaDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Maria Silva', maxLength: 160 })
  nome!: string;

  @ApiProperty({ example: 'maria@exemplo.test', maxLength: 254 })
  email!: string;

  @ApiProperty({ example: true })
  ativo!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  criadoEm!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  atualizadoEm!: string;
}

export class PerfilAdminRespostaDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'ADMIN', maxLength: 60 })
  codigo!: string;

  @ApiProperty({ example: 'Edita catálogo, trilhas, contas e acessos.' })
  descricao!: string;
}

export class PermissaoAdminRespostaDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'usuarios:consultar_todos', maxLength: 100 })
  codigo!: string;

  @ApiProperty({ example: 'Consultar a lista de usuários para administração.' })
  descricao!: string;
}

export class PerfilPermissaoRespostaDto {
  @ApiProperty({ format: 'uuid' })
  perfilId!: string;

  @ApiProperty({ format: 'uuid' })
  permissaoId!: string;

  @ApiProperty({ example: 'acessos:alterar_permissoes' })
  codigo!: string;
}

export class AtribuirPerfilRespostaDto {
  @ApiProperty({ format: 'uuid' })
  usuarioId!: string;

  @ApiProperty({ format: 'uuid' })
  perfilId!: string;

  @ApiProperty({ example: 'LEITOR' })
  codigo!: string;
}

export class ListarUsuariosRespostaDto {
  @ApiProperty({ type: [UsuarioAdminRespostaDto] })
  dados!: UsuarioAdminRespostaDto[];

  @ApiProperty({ example: 42, minimum: 0 })
  total!: number;

  @ApiProperty({ example: 1, minimum: 1 })
  pagina!: number;

  @ApiProperty({ example: 20, minimum: 1, maximum: 50 })
  limite!: number;

  @ApiProperty({ example: 3, minimum: 0 })
  totalPaginas!: number;
}

export class ListarPerfisRespostaDto {
  @ApiProperty({ type: [PerfilAdminRespostaDto] })
  dados!: PerfilAdminRespostaDto[];

  @ApiProperty({ example: 2, minimum: 0 })
  total!: number;

  @ApiProperty({ example: 1, minimum: 1 })
  pagina!: number;

  @ApiProperty({ example: 20, minimum: 1, maximum: 50 })
  limite!: number;

  @ApiProperty({ example: 1, minimum: 0 })
  totalPaginas!: number;
}

export class ListarPermissoesRespostaDto {
  @ApiProperty({ type: [PermissaoAdminRespostaDto] })
  dados!: PermissaoAdminRespostaDto[];

  @ApiProperty({ example: 26, minimum: 0 })
  total!: number;

  @ApiProperty({ example: 1, minimum: 1 })
  pagina!: number;

  @ApiProperty({ example: 20, minimum: 1, maximum: 50 })
  limite!: number;

  @ApiProperty({ example: 2, minimum: 0 })
  totalPaginas!: number;
}
