# Roteiro — Marvel Timeline API
---

## Etapa 0

1. **Tokens JWT:**
   - login **Leitor**: 
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiMDExOTZlYS03YjQ4LTRkYTAtYWJlNi1lMjk5ODFiZDMxODAiLCJpYXQiOjE3OTIzNzUzMjksImV4cCI6MTc5MjM3ODkyOX0.e5FwgYlnGvNMCP6Bak36dvZVhI6DAnwYxBIIOE_GDc4
   - login **Admin**: 
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmOTc4MTA3ZC1jMmM3LTRkYzItYTA2OS0zOWU5MGQ5NjAzOTMiLCJpYXQiOjE3OTIzNzUzNTksImV4cCI6MTc5MjM3ODk1OX0.bL7l_V0yfoCQ8VO177N4ZHFi3ONV1aVaZoVu3myb9aM

2. **Terminal:**
   - Comando: `docker exec -it marvel-redis redis-cli` (chave cache).

---

## Etapa 1

### Feitos
* **Conta Própria**, 
* **Comentários**,
* **Progresso Pessoal**,
      totalizando 16 endpoints integrados com controle de acesso RBAC e JWT. 
* **Cache com Redis** 
      Invalidação atômica pela revisão do catálogo CQRS e fallback gracioso."

---

### Etapa 2: Swagger
*Autenticação **Leitor**  `Authorize`.*

#### 1. `GET /usuarios/me` (Endpoint 05)
* Clicar em *Try it out* -> *Execute*.
* Resposta `200 OK` com dados do usuário logado e a lista de perfis `["LEITOR"]`.

#### 2. `PATCH /usuarios/me` (Endpoint 06)
* **(Falha)** Enviar `{"nome": "   "}` (espaços em branco).
  *  Erro `400 Bad Request` com mensagem clara de que o nome não pode ser vazio.
* **(Sucesso):** Enviar `{"nome": "Leitor Oficial Marvel"}`.
  * `200 OK` com o nome atualizado.
  * **Duplicidade:** Criar outro user com mesmo email.

#### 3. `GET /usuarios/me/permissoes` (Endpoint 07)
* Executar a consulta.
* Lista paginada das permissões que o perfil LEITOR possui (ex: `progresso:consultar_proprio`, `comentarios:criar`).

---

### Etapa 3

#### 1. `POST /obras/{slug}/comentarios`
* Criar um comentário na obra `homem-de-ferro` com o Leitor:
  ```json
  {
    "texto": "O início de todo o MCU! Filme espetacular.",
    "contemSpoiler": false
  }
  ```
* Resposta `201 Created` e copiar o `id` do comentário gerado.

#### 2. Tentar remoção indevida | Moderação (65 a 67)
* **Processo:** 
  * Tentar apagar o comentário com outro usuário não-autorizado (gera `403 Forbidden`).
  * Trocar a autorização no Swagger para o token do **ADMIN**.
  * Chamar `DELETE /comentarios/{id}/moderar` (Endpoint 67).
* Resposta `200 OK` com o comentário moderado/removido.

---

### Etapa 4

*Reautorizar o Swagger com o usuário **Leitor**.*

#### 1. `PUT /usuarios/me/progresso/{obraId}` (Endpoint 70)
* Marcar a obra como `CONCLUIDO`.
  * `200 OK` com o campo `concluidoEm` preenchido com timestamp atual.
* Mudar o status da mesma obra para `ASSISTINDO`.
  * O campo `concluidoEm` volta automaticamente para `null`.

#### 2. `GET /usuarios/me/trilhas/curta/progresso` (Endpoint 72)
* Executar a consulta do progresso da trilha `curta`.
* Objeto com métricas consolidadas:
  ```json
  {
    "trilhaSlug": "curta",
    "totalObras": 20,
    "concluidas": 1,
    "emAndamento": 0,
    "queroVer": 0,
    "naoIniciadas": 19,
    "percentualConclusao": 5
  }
  ```

---

### Etapa 5 cache

#### 1. Hit e Miss com Armazenamento no Redis
1. No Swagger, chame `GET /trilhas` (Endpoint 31).
2. Mostre no terminal do Docker o comando:
   ```bash
   docker exec -it marvel-redis redis-cli keys "*"
   ```
3. **Mostrar a chave:** `trilhas:v1:publicadas:...`.
#### 2. Invalidação Atômica pela Revisão do Catálogo (CQRS)
  > *"Integramos o cache à revisão do catálogo CQRS, as chaves são versionadas (`trilhas:v${versao}:...`). Quando qualquer administrador altera, publica ou reordena uma trilha ou etapa, o banco incrementa a versão para `v2`. A próxima consulta já busca pela chave `v2`, sem necessidade de comandos SCAN lentos no Redis e sem travar transações do PostgreSQL."*

#### 3. Teste de Fallback Gracioso (Resiliência)
1. No terminal, pause o container:
   ```bash
   docker stop marvel-redis
   ```
2. Swagger: `GET /trilhas` novamente.
3.  A API responde com **`200 OK`** normalmente.
4. Ligue o Redis novamente: `docker start marvel-redis`.

---

### Etapa 6 testes
* **O que mostrar:** Terminal rodando `npm test -- --runInBand` com os 120 testes passando.
* garantia dos testes.
