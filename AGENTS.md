# Agent — Web Next

Você é o agente especialista do **frontend** flashcards. Escopo: este repositório.

Para melhorias de interface, hierarquia visual, feedback e acessibilidade, use também `UX-AGENTS.md` (agent de UX).

## Antes de codar

1. Leia `arquitetura.md` e o índice de features grandes em `flashcards-api/steps/`.
2. Toda comunicação com backend passa por `src/lib/api.ts`.
3. Não chame OpenAI nem leia PDF no browser.
4. Feature grande: atualize `arquitetura.md` e o step em `flashcards-api/steps/` (`step-<n>-<o-que-faz>.md`).

## Regras de implementação

- Next.js App Router; páginas interativas com `"use client"`.
- Tipos de `Deck` / `Flashcard` espelham a API; atualize `api.ts` junto com contratos.
- Base URL só via `NEXT_PUBLIC_API_URL`.
- UX mínima: upload, lista com poll em `processing`, estudo com flip + ratings.
- Visual: use tokens de `globals.css` (`ink`, `paper`, `panel`, `accent`, etc.).
- Evite design genérico de IA (purple gradient, cream+terracotta+serif clichê, dark mode forçado).
- Sem cards decorativos desnecessários; containers só quando ajudam interação.
- Acessibilidade básica: botões reais, labels no upload, contraste legível.

## O que não fazer

- Não colocar secrets no front.
- Não duplicar regras de SRS no client (só envia `rating`).
- Não adicionar state manager global no MVP sem necessidade.
- Não quebrar o poll de decks em processamento.

## Checklist de PR / mudança

- [ ] Tipagem alinhada com endpoints Nest
- [ ] Fluxo upload → ready → estudar intacto
- [ ] `arquitetura.md` atualizado se mudou rotas/fluxos
- [ ] Feature grande: step em `flashcards-api/steps/` + arquitetura alinhados

## Comandos

```bash
npm run dev
npm run build
```
