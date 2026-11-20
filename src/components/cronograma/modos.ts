import type { ModoSessao } from "@/lib/api";

export const MODOS_SESSAO: { valor: ModoSessao; label: string }[] = [
  { valor: "teoria", label: "Teoria" },
  { valor: "questoes", label: "Questões" },
  { valor: "revisao", label: "Revisão SRS" },
  { valor: "misto", label: "Misto" },
];

export function rotuloModo(modo: ModoSessao | undefined | null) {
  return MODOS_SESSAO.find((m) => m.valor === modo)?.label ?? "Misto";
}
