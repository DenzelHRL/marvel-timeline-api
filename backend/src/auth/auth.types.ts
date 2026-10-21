export interface AuthenticatedUser {
  id: string;
  roles: string[];
  permissions: string[];
}

export interface AuthenticatedRequest {
  user?: AuthenticatedUser;
}

export interface CadastroResposta {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  criadoEm: string;
}

export interface LoginResposta {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}
