# Arquitetura — Web (`web/`)

Frontend Next.js da **Yorkstudy** — gere e estude flashcards a partir de qualquer PDF.

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
   └── study + review SRS → histórico (acerto / erro / dúvida)
```

- **Porta:** `3000`
- **API:** `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`)
- **Produto:** Yorkstudy (nome provisório) + `public/logo.png`
- **Estilo:** Tailwind CSS v4 + tokens em `globals.css`
- **Auth:** JWT no `localStorage`; rotas autenticadas no route group `src/app/(app)/`, cujo `layout.tsx` aplica `AuthGate` + `Sidebar` + `<main>`
- **UI:** workspace denso (lista Anki); estudo em coluna `max-w-xl`

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
| `/` | `src/app/(app)/page.tsx` | Dashboard: estudos, disciplinas e concursos (auth) |
| `/decks` | `src/app/(app)/decks/page.tsx` | Lista de decks + Novo deck (auth) |
| `/decks/[id]` | `src/app/(app)/decks/[id]/page.tsx` | Fila do dia (auth) |
| `/decks/[id]/cards` | `src/app/(app)/decks/[id]/cards/page.tsx` | Navegador do deck (auth) |
| `/history` | `src/app/(app)/history/page.tsx` | Histórico de fichas avaliadas (auth) |
| `/stats` | `src/app/(app)/stats/page.tsx` | Revisões de hoje, retenção, sequência e previsão |
| `/desempenho` | `src/app/(app)/desempenho/page.tsx` | Semana por dia (tempo, questões, acerto) e comparação por disciplina (step 20) |
| `/editais` | `src/app/(app)/editais/page.tsx` | Editais disponíveis com inscrição (step 21) e planilha própria por CSV (auth) |
| `/editais/[id]` | `src/app/(app)/editais/[id]/page.tsx` | Disciplinas e assuntos da planilha própria, só leitura (auth) |
| `/editais/oficiais/[id]` | `src/app/(app)/editais/oficiais/[id]/page.tsx` | Edital oficial: cabeçalho, inscrição e conteúdo programático (auth) |
| `/disciplinas` | `src/app/(app)/disciplinas/page.tsx` | Catálogo de disciplinas, com a quantidade de tópicos (auth) |
| `/disciplinas/[id]` | `src/app/(app)/disciplinas/[id]/page.tsx` | Árvore de tópicos da disciplina, só leitura (auth) |
| `/account` | `src/app/(app)/account/page.tsx` | Nome e troca da própria senha |
| `/users` | `src/app/(app)/users/page.tsx` | CRUD admins (só super_admin) |

Layout global: `src/app/layout.tsx` (metadata, fontes, CSS). Layout autenticado: `src/app/(app)/layout.tsx` (`AuthGate`, `Sidebar`, `<main>` com rolagem). `/users` tem `src/app/(app)/users/layout.tsx` com `AuthGate requireSuperAdmin`. As URLs não incluem `(app)`.

## Camada de API (`src/lib/api.ts`)

Tipos e funções:

- `login()`, `me()`
- `listDecks()`, `getDeck(id)`, `getFlashcards(deckId, q?)`, `getStudy(deckId)`
- `uploadPdf(file)` — `FormData` campo `file`
- `reviewCard(id, rating)` — `again | hard | good | easy`
- `updateDeck(id, { title?, disciplina? })` (string vazia limpa a disciplina), `renameDeck(id, title)`, `deleteDeck(id)`, `createCard(deckId, front, back)`, `deleteCard(id)`, `updateCard(id, data)`, `undoReview()`, `getStats()`
- `getHistory(outcome?)` — `GET /history`; `correct` (Bom/Fácil), `wrong` (Errei), `unsure` (Dúvida)
- `listUsers()`, `createAdmin()`, `updateUser()`, `changeOwnPassword()`
- `listEditais()`, `getEdital(id)`, `uploadEditalCsv(arquivo, banca, cargo)` — `FormData` com `arquivo`, `banca` e `cargo`
- `listDisciplinasDosEditais()` — nomes de disciplina de todos os editais do aluno, para sugerir no deck
- `listDisciplinas()`, `getDisciplina(id)` — catálogo do step 18; tipos `DisciplinaResumo`, `Disciplina` e `Topico` (com `filhos`)
- `listEditaisOficiais()`, `getEditalOficial(id)`, `inscreverEdital(id)`, `cancelarInscricaoEdital(id)` — step 21; tipos `EditalOficialResumo` (com contagens) e `EditalOficial` (disciplinas com a árvore de tópicos)
- `getDashboard()` — `GET /dashboard`; tipo `Dashboard` (hoje só `resumo`)
- Sessão de estudo (step 16): `iniciarSessao({ disciplina, editalId?, linhaId? })`, `pausarSessao(id)`, `retomarSessao(id)`, `concluirSessao(id, { questoes, acertos })`, `descartarSessao(id)`. Ainda sem tela; o cronômetro entra na Parte 3 do dashboard

Sessão (`src/lib/auth.ts`):

- Token + user em `localStorage`
- Header `Authorization: Bearer …` em requests autenticados
- `401` limpa sessão e redireciona para `/login`

## Fluxos de UI

### Login
1. `POST /auth/login` → guarda token/user.
2. Redirect para `/`.

### Home
1. Depois do login, `/` é o dashboard.
2. No topo, `ResumoPainel` (`src/components/dashboard/`) mostra tempo líquido na semana contra a anterior, acertos de 7 dias, sequência e revisões vencidas, numa faixa 2×2 no celular e de 4 colunas a partir de `md`. Erro de `getDashboard` aparece em texto e não esconde o resto da página.
3. Estudos diz que ainda não há ciclo. Disciplinas leva a `/editais`. Concursos lista primeiro os editais oficiais em que o aluno está inscrito (`listEditaisOficiais`, filtrando `inscrito`) e depois as planilhas próprias (`listEditais`), com cargo, órgão ou banca e link. Sem concurso, o vazio leva aos editais disponíveis em `/editais`.

### Decks
1. `AuthGate` valida sessão (`/auth/me`).
2. Lista decks ao montar (só do usuário).
3. Poll a cada 2s enquanto houver deck `processing` (feedback vivo na UI).
4. “Novo deck” no topo da coluna (file picker); dropzone só se a lista estiver vazia.
5. Lista na coluna, sem rolagem horizontal. O nome quebra a linha; `generationNote` / erro ficam na linha do deck.
6. CTA Estudar só quando `ready`. Novos, Aprender e Revisar aparecem na tabela no desktop e numa linha no celular. Editar, Cards e Excluir ficam com o nome. Editar troca nome e disciplina no mesmo formulário; a disciplina sugere as dos editais e aceita texto livre, e aparece sob o nome. Editar fica bloqueado enquanto `processing`.
7. Em `/decks`, `/history` e `/stats`, uma faixa troca entre Decks, Histórico e Estatísticas. O item Decks da sidebar fica ativo nessas rotas e também no estudo e no navegador de cards.

### Estudo
1. Carrega `GET /decks/:id/study` no modo deck inteiro (API rejeita se não for dono). “Fila do dia” na própria tela pede `?scope=day`.
2. Card clicável (frente/verso) ocupa a coluna. Anterior e próximo ficam acima do card. O rótulo mostra a posição no deck (ou na fila do dia), com uma barra de progresso.
3. Ratings aparecem após revelar o verso, com o intervalo previsto (duas colunas no celular, quatro no desktop). Chamam `PATCH /flashcards/:id/review` e recarregam a lista. No deck inteiro, a posição segue para o próximo card.
4. Botões: Errei, Dúvida, Bom, Fácil. Cada um grava histórico na API.
5. Teclado: `←` `→` trocam o card sem avaliar, `espaço` revela, `A` Errei, `S` Dúvida, `W` Bom, `D` Fácil, `Z` desfaz. Atalhos ignoram campo de texto.
6. Fila do dia vazia: “Deck em dia”, ou a contagem até o próximo card de aprendizado. Deck inteiro sem card ativo: “Nenhum card ativo neste deck.”
7. “Renomear”, “Cards”, “Novo card” e “Excluir card”. Renomear, criar e excluir recusam deck `processing`.
8. “← Decks” volta para `/decks`.

### Histórico
1. Faixa da área de decks → `/history`.
2. Filtros Feitas / Acertou / Errou / Dúvida, com a contagem vinda de `summary`.
3. Toque na ficha alterna pergunta e resposta. O PDF não é exibido nem armazenado.

### Editais
1. Dashboard (Estudos ou Concursos) → `/editais`.
2. "Editais disponíveis" lista os editais oficiais com cargo, área, órgão, banca, ano e a contagem de disciplinas e tópicos. `BotaoInscricao` (`src/components/editais/`) chama `POST` ou `DELETE /editais-oficiais/:id/inscricao` e troca para "Inscrito" + Cancelar sem recarregar. Erro aparece sob o botão.
3. `/editais/oficiais/[id]` mostra o cabeçalho, o mesmo botão e uma disciplina recolhível por linha (`<details>`), com a árvore de tópicos (`ArvoreTopicos`, compartilhado com `/disciplinas/[id]`). `404` mostra a mensagem.
4. "Planilha própria", embaixo: formulário Banca, Cargo e Arquivo CSV chama `POST /editais/csv`. Erro da API, inclusive `503`, aparece em texto. Sem poll. A lista mostra cargo, banca e o link; vazia, não aparece.
5. `/editais/[id]` mostra disciplinas e assuntos com teoria, revisão, questões e horas deste aluno. Zero, negativo e decimal aparecem como a API mandou. `404` mostra a mensagem. Sem editar, renomear ou apagar.

### Disciplinas
1. Sidebar (Planejamento → Disciplinas) → `/disciplinas`. O item fica ativo também em `/disciplinas/[id]`.
2. A lista mostra nome e quantidade de tópicos. Sem catálogo carregado: “Ainda não há disciplina”. Erro da API, inclusive `503`, aparece em texto.
3. `/disciplinas/[id]` mostra os tópicos em árvore, com os subtópicos recuados. `404` mostra a mensagem. Sem editar: o catálogo é carregado por SQL.

### Admins (super_admin)
1. Lista / cria admins.
2. Ativa/desativa e reseta senha.

## Design system (MVP)

Tokens CSS em `:root` / `@theme`:

- `--ink`, `--paper`, `--panel`, `--accent`, `--line`, `--muted`
- Estados: `--ok`, `--warn`, `--bad`
- Sombras: `shadow-card` (superfícies) e `shadow-pop` (menus e drawer)
- Séries de gráfico: `accent` (acerto), `--serie-tempo` (azul) e `--serie-questoes` (âmbar). Só em gráficos; status continua com `ok`/`warn`/`bad`

Direção visual: moderno e denso. Fundo liso `paper`, superfícies brancas `panel` com `rounded-xl`, borda `line` suave e `shadow-card`. Sidebar `w-60` com item ativo em `bg-accent/10`. Números de destaque em Bricolage (`font-display`). Rótulos com no mínimo 12px. Sem landing, purple gradient, cream+terracotta ou dark forçado. Classes de botão, link de ação e alerta ficam em `src/components/ui.ts`.

A sidebar fica à esquerda nas rotas autenticadas. Abaixo de `md`, o botão Menu abre a mesma lista sobre o conteúdo; um link, o fundo escurecido ou Esc fecham. Login não usa o shell. Itens em três grupos (Visão geral, Prática, Planejamento) com ícone; tela ainda não feita aparece desabilitada com "em breve". No rodapé, avatar e "Olá, <nome>" (ou o início do e-mail) abrem o menu com Conta, Admins (só `super_admin`) e Sair. Ver step 17.

## Componentes

`Sidebar` (grupos, rodapé com menu da conta, barra com Menu abaixo de `md`), `NavIcon` (ícones SVG da sidebar), `PageContainer` (largura da coluna — `wide` no Início —, `action` e faixa de decks), `dashboard/Bloco` (seção com título e `EstadoVazio`), `dashboard/ResumoPainel` (indicadores do Início), `desempenho/*` (gráfico da semana, radar, barras e tabela por disciplina, em SVG próprio; step 20), `ImportDeck` (Novo deck / dropzone), `DeckList` (tabela), `StudyCard` (flip + ratings).

## Configuração

| Variável | Uso |
|----------|-----|
| `NEXT_PUBLIC_API_URL` | Base da API Nest (`.env.local` no dev; env de **build** na Vercel; build-arg no Docker). URL HTTPS que o **browser** alcança — hoje `https://yorkstudy.179.236.227.168.sslip.io` até `api.yorkstudy.com.br` existir. |

## Docker (opcional)

Compose no repo da API (serviço `web`); detalhes em `flashcards-api/arquitetura.md`. No browser a API é `http://localhost:3001`, nunca o hostname `api`. `output: "standalone"` só serve à imagem.

## Decisões técnicas

- Páginas de interação são **Client Components** (`"use client"`) — upload, poll e flip precisam de estado no browser.
- Auth JWT + `localStorage` no MVP (sem cookie httpOnly ainda).
- Sem store global; estado local com `useState` / `useEffect`.
- Front **não** lê PDF nem chama OpenAI — só a API.
- Isolamento de dados é responsabilidade da API (`ownerId`).

## Steps

Ficam na API: [`flashcards-api/steps/README.md`](../flashcards-api/steps/README.md). Feature grande no front atualiza este arquivo e o step de lá.
