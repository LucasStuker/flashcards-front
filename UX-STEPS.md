# UX Pass — Steps

Passagem de UX nas superfícies home (`/`) e estudo (`/decks/[id]`), alinhada a `UX-AGENTS.md`.

## Diagnóstico (antes)

- Marca fraca na home: eyebrow “DataPrev 2026” perde para o headline.
- Poll de `processing` sem feedback vivo além do status estático.
- Ratings no estudo aparecem antes de revelar o verso.
- Flip sem motion; progresso só textual.
- Loading / empty / erro com hierarquia fraca.

## Steps

### Home

- [x] Reforçar marca do produto como sinal hero (nome forte + headline de apoio)
- [x] Melhorar upload: label acessível, estado `Enviando…` e zona drag mais clara
- [x] Feedback vivo do poll enquanto houver deck `processing`
- [x] Lista de decks: status legível, CTA `Estudar` com `accent`, empty/loading melhores

### Estudo

- [x] Card de estudo como foco único com motion de flip
- [x] Mostrar ratings só depois de revelar o verso
- [x] Progresso simples (texto + barra)
- [x] Loading / erro / empty com hierarquia e link de volta claros

### Global

- [x] Microinterações CSS (hover, focus, transição de status) sem ruído
- [x] Preservar tokens, poll e fluxo upload → ready → estudar

## Arquivos tocados

- `src/app/page.tsx`
- `src/app/decks/[id]/page.tsx`
- `src/app/globals.css`
- `UX-AGENTS.md` / `.cursor/rules/ux-agent.mdc` (agent UX)
- `AGENTS.md` (link para o agent UX)
