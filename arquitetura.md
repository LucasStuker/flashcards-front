# Arquitetura — Web (`web/`)

Frontend Next.js do MVP de flashcards (estudo a partir de PDFs do Estratégia).

## Visão geral

```
Browser
   │  Bearer JWT (localStorage)
   ▼
Next.js App Router (client components)
   │  src/lib/api.ts + src/lib/auth.ts
   ▼
Nest API http://localhost:3001
   │
   ├── login → token
   ├── upload PDF → cria deck do usuário
   ├── poll lista até status ready
   └── study + review SRS
```

- **Porta:** `3000`
- **API:** `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`)
- **Estilo:** Tailwind CSS v4 + tokens em `globals.css`
- **Auth:** JWT no `localStorage`; rotas protegidas com `AuthGate`

## Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js 15 (App Router) |
| UI | React 19 + Tailwind 4 |
| Fontes | Bricolage Grotesque + IBM Plex Sans |
| Dados | `fetch` client-side via `src/lib/api.ts` (sem React Query no MVP) |

## Rotas

| Rota | Arquivo | Função |
|------|---------|--------|
| `/login` | `src/app/login/page.tsx` | Login |
| `/` | `src/app/page.tsx` | Upload PDF + lista de decks (auth) |
| `/decks/[id]` | `src/app/decks/[id]/page.tsx` | Modo estudo (auth) |
| `/account` | `src/app/account/page.tsx` | Trocar própria senha |
| `/users` | `src/app/users/page.tsx` | CRUD admins (só super_admin) |

Layout global: `src/app/layout.tsx` (metadata, fontes, CSS).

## Camada de API (`src/lib/api.ts`)

Tipos e funções:

- `login()`, `me()`
- `listDecks()`, `getDeck(id)`, `getFlashcards(deckId)`
- `uploadPdf(file)` — `FormData` campo `file`
- `reviewCard(id, rating)` — `again | hard | good | easy`
- `listUsers()`, `createAdmin()`, `updateUser()`, `changeOwnPassword()`

Sessão (`src/lib/auth.ts`):

- Token + user em `localStorage`
- Header `Authorization: Bearer …` em requests autenticados
- `401` limpa sessão e redireciona para `/login`

## Fluxos de UI

### Login
1. `POST /auth/login` → guarda token/user.
2. Redirect para `/`.

### Home
1. `AuthGate` valida sessão (`/auth/me`).
2. Lista decks ao montar (só do usuário).
3. Poll a cada 2s enquanto houver deck `processing` (feedback vivo na UI).
4. Upload por input ou drag-and-drop (label acessível + estado enviando).
5. Mostra status, método (`IA OpenAI` / `heurística`) e `generationNote` se houver.
6. CTA Estudar só quando `ready`.

### Estudo
1. Carrega deck + cards (API rejeita se não for dono).
2. Card clicável (frente/verso) com motion leve; progresso textual + barra.
3. Ratings aparecem após revelar o verso; chamam `PATCH /flashcards/:id/review` e avançam índice.

### Admins (super_admin)
1. Lista / cria admins.
2. Ativa/desativa e reseta senha.

## Design system (MVP)

Tokens CSS em `:root` / `@theme`:

- `--ink`, `--paper`, `--panel`, `--accent`, `--line`, `--muted`
- Estados: `--ok`, `--warn`, `--bad`

Direção visual: grade clara + verde (`accent`), tipografia expressiva sem tema “AI default” (evitar purple gradient / cream+terracotta genérico).

## Estrutura de pastas

```
web/src/
  app/
    layout.tsx
    page.tsx                 # home
    login/page.tsx
    account/page.tsx
    users/page.tsx
    globals.css
    decks/[id]/page.tsx     # estudo
  components/
    AuthGate.tsx
    AppHeader.tsx
  lib/
    api.ts                   # client HTTP + tipos
    auth.ts                  # localStorage session
```

## Configuração

| Variável | Uso |
|----------|-----|
| `NEXT_PUBLIC_API_URL` | Base da API Nest (`.env.local`) |

## Decisões técnicas

- Páginas de interação são **Client Components** (`"use client"`) — upload, poll e flip precisam de estado no browser.
- Auth JWT + `localStorage` no MVP (sem cookie httpOnly ainda).
- Sem store global; estado local com `useState` / `useEffect`.
- Front **não** lê PDF nem chama OpenAI — só a API.
- Isolamento de dados é responsabilidade da API (`ownerId`).

## Steps (features grandes)

O diário de features grandes do sistema fica na API:

[`flashcards-api/steps/`](../flashcards-api/steps/README.md) → `step-<número>-<o-que-faz>.md`

Feature grande no front: atualize este `arquitetura.md` e garanta o step correspondente no repo da API (contexto cross-repo).

## Evolução sugerida

- Loading skeletons / toast de erro
- Filtro por matéria/tags
- Progresso do deck (cards vencidos)
- Dark mode opt-in alinhado aos tokens
- React Query ou SWR se a lista crescer
- Cookie httpOnly se quiser endurecer XSS
