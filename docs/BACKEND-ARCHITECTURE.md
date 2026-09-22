# Raios: auditoria de backend e arquitetura de contexto

## 1. Resumo executivo

### Estado atual observado

- O login por email chama `supabase.auth.signInWithPassword` no browser.
- O login Google chama `signInWithOAuth` no browser.
- O browser observa apenas `getSession()` e `onAuthStateChange()` em `app/page.tsx`.
- Não existe endpoint de contexto, resumo de perfil, preferências ou clubes.
- `lib/supabase-server.ts` cria um cliente com `SUPABASE_SERVICE_ROLE_KEY`, mas esse cliente ainda não é usado por uma API. A service role nunca deve ser enviada ao browser e não deve ser usada para substituir RLS em rotas normais.
- A única API de negócio existente é moderação (`/api/moderate`); criação de time ainda é simulada no frontend.
- A tabela `users` mistura identidade de aplicação com email e não separa perfil público, preferências ou personalização.

### Riscos

1. O frontend pode mostrar menus errados porque conhece apenas `authenticated: boolean`.
2. Um token válido não significa que o utilizador tenha clube, onboarding concluído ou permissão de moderador.
3. O endpoint de contexto inexistente força cada ecrã a fazer consultas e decisões próprias.
4. O primeiro carregamento pode trazer dados privados desnecessários.
5. Uma futura API que use service role sem reconstruir o contexto do utilizador pode ignorar RLS.

## 2. Contrato de sessão e User Context

O Supabase continua responsável por autenticar e emitir a sessão. Depois do login, o frontend deve chamar `GET /api/user/context`. O endpoint valida o bearer token e devolve apenas o contexto de produto necessário para navegação.

### JSON canónico

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "Nome público",
    "avatarUrl": null,
    "emailVerified": true
  },
  "account": {
    "status": "active",
    "onboarding": "complete",
    "createdAt": "2026-09-22T18:30:00Z"
  },
  "capabilities": {
    "canCreateClub": true,
    "canEditClub": false,
    "canRequestMatch": true,
    "canModerate": false,
    "canManageSettings": true
  },
  "navigation": [
    { "id": "explore", "href": "/", "label": "Explorar" },
    { "id": "club", "href": "/clube/club-id", "label": "Meu clube" },
    { "id": "profile", "href": "/perfil", "label": "Perfil" }
  ],
  "clubs": [
    {
      "id": "uuid",
      "name": "Raios FC",
      "logoUrl": "https://...",
      "role": "owner",
      "status": "active"
    }
  ],
  "meta": {
    "contextVersion": 1,
    "generatedAt": "2026-09-22T18:30:01Z",
    "requestId": "uuid"
  }
}
```

### Regras do contrato

- `user` contém identidade mínima; nunca incluir password, refresh token, service role, segredos ou dados de auditoria.
- `capabilities` é a fonte de verdade para ações de UI, mas a API deve validar autorização novamente em cada mutação.
- `navigation` é uma conveniência de produto, não um mecanismo de segurança.
- `clubs` traz apenas o necessário para trocar de contexto; detalhes completos ficam em `/api/clubs/:clubId`.
- `account.onboarding` deve vir do banco (`not_started`, `in_progress`, `complete`), nunca de um `useState` local isolado.
- A resposta deve ter cache curto por sessão, mas dados de permissão devem ser invalidados após login, logout, troca de clube e alteração de role.

## 3. Matriz de permissões

| Capacidade | Anónimo | Utilizador | Owner de clube | Admin |
| --- | --- | --- | --- | --- |
| Ler explorar | sim | sim | sim | sim |
| Ver próprio resumo | não | sim | sim | sim |
| Criar clube | não | sim | sim | sim |
| Editar clube | não | não | sim | sim |
| Criar jogo/pedido | não | sim | sim | sim |
| Moderar conteúdo | não | não | não | sim |
| Alterar definições da conta | não | sim | sim | sim |
| Ler auditoria | não | não | não | sim |

A role deve vir de uma relação `club_memberships` ou de claims verificadas. Nunca confiar num campo enviado pelo browser.

## 4. Modelo de dados separado

```text
auth.users                         Supabase Auth; email, providers, sessão
    1 ─── 1 profiles                identidade pública mínima
    1 ─── 1 user_settings            notificações, idioma, privacidade
    1 ─── 1 user_personalization     tema, densidade, preferências de UI
    1 ─── N club_memberships         relação utilizador-clube-role
                    N ─── 1 clubs    identidade do clube
clubs 1 ─── N teams?                manter uma entidade, ou renomear para clubs
clubs 1 ─── N matches               jogos e pedidos
```

### Tabelas

#### `profiles`

- `id uuid primary key references auth.users(id)`
- `display_name text not null`
- `avatar_url text`
- `email_verified_at timestamptz`
- `onboarding_status text check in ('not_started','in_progress','complete')`
- `created_at`, `updated_at`

#### `user_settings`

- `user_id uuid primary key`
- `locale text not null default 'pt-AO'`
- `timezone text not null default 'Africa/Luanda'`
- `notifications_enabled boolean not null default true`
- `profile_visibility text check in ('public','members')`
- `updated_at`

#### `user_personalization`

- `user_id uuid primary key`
- `theme text check in ('system','dark','light')`
- `accent text not null default 'lime'`
- `reduced_motion boolean not null default false`
- `updated_at`

#### `clubs`

- `id uuid primary key`
- `name`, `slug`, `logo_path`, `description`
- `location_id`, `modality`
- `created_by uuid references profiles(id)`
- `created_at`, `updated_at`

#### `club_memberships`

- `club_id uuid`
- `user_id uuid`
- `role text check in ('owner','manager','member')`
- `status text check in ('active','invited','removed')`
- primary key `(club_id, user_id)`

RLS deve permitir ao utilizador ler e alterar apenas o seu `profiles`, `user_settings` e `user_personalization`; clubes e memberships devem ser validados pela relação. Moderation audits continuam apenas para service role/admin.

## 5. Mapa de APIs por caso de uso

### Contexto e conta

#### `GET /api/user/context`

- Auth: bearer obrigatório.
- Entrada: nenhum body; header `Authorization: Bearer <access_token>`.
- Saída: User Context canónico acima.
- Não inclui: password, tokens, preferências completas, logs ou todos os jogos.

#### `GET /api/user/summary`

- Auth: bearer obrigatório.
- Saída: nome, avatar, onboarding, contagem de clubes, próximos 3 itens relevantes.

#### `PATCH /api/user/profile`

- Auth: bearer obrigatório.
- Body: `{ "displayName": "...", "avatarPath": "..." }`.
- Saída: profile atualizado.

#### `GET /api/user/settings`

- Auth: bearer obrigatório.
- Saída: settings completos do próprio utilizador.

#### `PATCH /api/user/settings`

- Auth: bearer obrigatório.
- Body validado por whitelist; nunca aceitar colunas arbitrárias.

#### `GET /api/user/personalization`

- Auth: bearer obrigatório.
- Saída: preferências de UI, sem dados de conta.

#### `PATCH /api/user/personalization`

- Auth: bearer obrigatório.
- Body: tema, accent e reduced motion validados por enum.

### Clubes

#### `POST /api/clubs`

- Auth: bearer obrigatório.
- Body: `{ "name": "...", "modality": "Futsal", "locationId": "uuid", "description": "..." }`.
- Pipeline: validar schema -> moderar texto -> inserir clube -> criar membership owner -> devolver clube.

#### `GET /api/clubs`

- Auth: bearer obrigatório.
- Saída: clubes onde o utilizador tem membership ativa, campos resumidos.

#### `GET /api/clubs/:clubId`

- Auth: público para campos públicos; bearer para campos privados.
- Saída: detalhe do clube + `viewerRole` + capabilities daquele clube.

#### `PATCH /api/clubs/:clubId`

- Auth: owner/manager conforme campo.
- Body whitelist; logo usa `logoPath` já carregado no bucket.

#### `POST /api/clubs/:clubId/logo`

- Auth: owner/manager.
- Preferir signed upload URL ou upload direto para Storage com path `<userId>/<clubId>/<file>`.
- Saída: `{ "path": "...", "publicUrl": "..." }`.

### Dashboard

#### `GET /api/dashboard/summary`

- Auth: bearer obrigatório.
- Query: `clubId` opcional, `limit` limitado a 1..20.
- Saída: métricas e itens resumidos, não entidades completas.

#### `GET /api/matches`

- Auth: público para explorar; filtros paginados.
- Query: `cursor`, `locationId`, `modality`, `from`.
- Saída: `{ "items": [], "nextCursor": null }`.

### Regras transversais

- Respostas de erro: `{ "error": { "code": "...", "message": "...", "requestId": "..." } }`.
- Validação de input com schema runtime; limites de tamanho e paginação obrigatórios.
- `401` para sessão ausente/expirada, `403` para role insuficiente, `404` para recurso inexistente, `409` para conflito, `422` para input inválido.
- `requestId` em logs e respostas; nunca logar bearer token, password ou service role.
- Rate limit por user/IP em auth, upload, moderação e criação de clube.

## 6. Plano de migração seguro

### Fase 0 — Contrato

1. Congelar o JSON User Context e os códigos de erro.
2. Criar types compartilhados em `lib/contracts/user-context.ts`.
3. Adicionar testes de contrato para estados anónimo, novo utilizador, sem clube e owner.

### Fase 1 — Dados

1. Criar `profiles`, `user_settings`, `user_personalization`, `clubs` e `club_memberships`.
2. Backfill de `public.users` para `profiles`.
3. Migrar `teams` para `clubs` ou documentar `teams` como nome legado.
4. Criar índices e RLS antes de mudar o frontend.
5. Manter trigger idempotente para criar perfil base; nunca criar preferências secretas no client.

### Fase 2 — API

1. Implementar `GET /api/user/context` usando o token do request e cliente Supabase com RLS.
2. Implementar summary/settings/personalization separados.
3. Implementar `POST /api/clubs` como única entrada de criação.
4. Tirar a criação simulada de `CreateTeamFlow` e usar a API.
5. Adicionar observabilidade: request ID, duração, código de resposta e motivo de falha.

### Fase 3 — Frontend

1. Trocar `isAuthenticated` por `sessionState` + `userContext`.
2. Renderizar navegação a partir de `context.navigation`.
3. Perfil consome somente `/api/user/summary`.
4. Configurações consomem settings/personalization apenas quando abertas.
5. Clube consome `/api/clubs/:id`; onboarding deixa de existir dentro de Perfil.

### Fase 4 — Corte e limpeza

1. Comparar métricas do caminho antigo e novo.
2. Ativar feature flag por utilizador.
3. Remover consultas e tipos legados após estabilização.
4. Revogar qualquer acesso service role fora de rotas server-only.
5. Adicionar testes E2E para login, logout, expired token, sem clube, owner e role insuficiente.

## 7. Definition of Done

- O backend devolve contexto de produto em uma chamada pequena e versionada.
- Nenhuma decisão de autorização depende apenas de estado React.
- Perfil, settings e personalização são recursos separados.
- Criação de clube é transacional e server-side.
- RLS e autorização de API concordam.
- O frontend consegue ocultar menus sem receber dados que não precisa.
- Logs, erros e métricas permitem investigar um request sem expor segredos.
