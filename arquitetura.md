# Arquitetura — Web (`web/`)

Frontend Next.js do MVP de flashcards (estudo a partir de PDFs do Estratégia).

## Visão geral

```
Browser
   │
   ▼
Next.js App Router (client components)
   │  src/lib/api.ts
   ▼
Nest API http://localhost:3001
   │
   ├── upload PDF → cria deck
   ├── poll lista até status ready
   └── study + review SRS
```

- **Porta:** `3000`
- **API:** `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`)
- **Estilo:** Tailwind CSS v4 + tokens em `globals.css`

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
| `/` | `src/app/page.tsx` | Upload PDF + lista de decks |
| `/decks/[id]` | `src/app/decks/[id]/page.tsx` | Modo estudo (virar card + rating) |

Layout global: `src/app/layout.tsx` (metadata, fontes, CSS).

## Camada de API (`src/lib/api.ts`)

Tipos e funções:

- `listDecks()`, `getDeck(id)`, `getFlashcards(deckId)`
- `uploadPdf(file)` — `FormData` campo `file`
- `reviewCard(id, rating)` — `again | hard | good | easy`

Regras:

- `cache: 'no-store'`
- Erros HTTP viram `Error` com body/texto da API
- Base URL só por env pública (nunca secrets no front)

## Fluxos de UI

### Home
1. Lista decks ao montar.
2. Poll a cada 2s enquanto houver deck `processing` (feedback vivo na UI).
3. Upload por input ou drag-and-drop (label acessível + estado enviando).
4. Mostra status, método (`IA OpenAI` / `heurística`) e `generationNote` se houver.
5. CTA Estudar só quando `ready`.

### Estudo
1. Carrega deck + cards.
2. Card clicável (frente/verso) com motion leve; progresso textual + barra.
3. Ratings aparecem após revelar o verso; chamam `PATCH /flashcards/:id/review` e avançam índice.

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
    globals.css
    decks/[id]/page.tsx     # estudo
  lib/
    api.ts                   # client HTTP + tipos
```

## Configuração

| Variável | Uso |
|----------|-----|
| `NEXT_PUBLIC_API_URL` | Base da API Nest (`.env.local`) |

## Decisões técnicas

- Páginas de interação são **Client Components** (`"use client"`) — upload, poll e flip precisam de estado no browser.
- Sem auth no MVP.
- Sem store global; estado local com `useState` / `useEffect`.
- Front **não** lê PDF nem chama OpenAI — só a API.

## Evolução sugerida

- Loading skeletons / toast de erro
- Filtro por matéria/tags
- Progresso do deck (cards vencidos)
- Dark mode opt-in alinhado aos tokens
- React Query ou SWR se a lista crescer
