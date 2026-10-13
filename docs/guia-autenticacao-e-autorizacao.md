# Guia compartilhado de autenticação e autorização

`AuthModule` fornece a estratégia e o guard JWT, além do decorator de
autenticação e da identidade atual. `AcessoModule` fornece o guard e o decorator
de autorização por perfil/permissão. Eles não protegem rotas automaticamente:
cada módulo importa o módulo correspondente e cada responsável aplica a
proteção nas próprias rotas, de acordo com a
[matriz de endpoints](matriz-endpoints.md).

Dentro de `auth/`, os arquivos específicos do JWT ficam em `jwt/` e os
específicos do OAuth Google ficam em `google/`. Tipos e decorators usados pelos
dois fluxos permanecem diretamente em `auth/`.

## Exigir somente JWT

Importe `AuthModule` no módulo que declara o controller e use o decorator
`Authenticated`:

```ts
import { Controller, Get } from '@nestjs/common';
import { Authenticated, CurrentUser } from '../auth/auth.decorators';
import { AuthenticatedUser } from '../auth/auth.types';

@Controller('usuarios')
export class UsuariosController {
  @Get('me')
  @Authenticated()
  consultarPropriaConta(@CurrentUser() usuario: AuthenticatedUser) {
    return { id: usuario.id };
  }
}
```

O cliente envia o token em `Authorization: Bearer <JWT>`. O guard valida
assinatura, algoritmo e expiração; a estratégia rejeita conta inexistente ou
inativa e carrega os perfis e permissões efetivos atuais do banco. A identidade
fica em `request.user`, disponível também como `@CurrentUser('id')`.

## Exigir perfil e/ou permissão

Importe `AcessoModule` junto de `AuthModule` no módulo que declara o controller.
Use `Authorize` para proteger a rota com JWT e verificar os requisitos:

```ts
import { Authorize } from '../acesso/access.decorators';
import { CurrentUser } from '../auth/auth.decorators';
import { AuthenticatedUser } from '../auth/auth.types';

@Get()
@Authorize({
  roles: ['ADMIN'],
  permissions: ['usuarios:consultar_todos'],
})
listarUsuarios(@CurrentUser() usuario: AuthenticatedUser) {
  return this.usuariosService.listar();
}
```

- `roles` aceita qualquer um dos perfis listados (`OR`).
- `permissions` exige todas as permissões listadas (`AND`).
- Se ambos forem declarados, o usuário precisa satisfazer os dois critérios.
- A ausência de perfil ou permissão exigidos retorna `403`; token ausente,
  inválido, expirado ou conta inativa retorna `401`.
- Use os códigos exatos do seed e da matriz. Não confie em IDs ou perfis enviados
  pelo cliente.

Os módulos que usam `Authorize` devem importar `AuthModule` e `AcessoModule`;
`AcessoModule` fornece o guard de autorização e `AuthModule` fornece o guard
JWT. Para usar somente `Authenticated`, importe `AuthModule`. Não use o
`GoogleAuthGuard` para proteger APIs: ele só inicia e conclui o fluxo OAuth
Google.

## Responsabilidade por rota

Os decorators são infraestrutura compartilhada, não atribuem responsabilidade
de endpoint. Cada responsável protege suas próprias rotas conforme a coluna
Acesso da matriz. Rotas públicas, como cadastro, login e OAuth, não recebem
`Authenticated` nem `Authorize`.
