import type { CorMateria } from "@/lib/cronograma-mock";

/** Classes completas por cor: o Tailwind só gera o que aparece literal no código. */
export const corDaMateria: Record<CorMateria, { ponto: string; bloco: string; borda: string; texto: string }> = {
  1: { ponto: "bg-materia-1", bloco: "bg-materia-1/12 hover:bg-materia-1/18", borda: "border-materia-1", texto: "text-materia-1" },
  2: { ponto: "bg-materia-2", bloco: "bg-materia-2/12 hover:bg-materia-2/18", borda: "border-materia-2", texto: "text-materia-2" },
  3: { ponto: "bg-materia-3", bloco: "bg-materia-3/12 hover:bg-materia-3/18", borda: "border-materia-3", texto: "text-materia-3" },
  4: { ponto: "bg-materia-4", bloco: "bg-materia-4/12 hover:bg-materia-4/18", borda: "border-materia-4", texto: "text-materia-4" },
  5: { ponto: "bg-materia-5", bloco: "bg-materia-5/12 hover:bg-materia-5/18", borda: "border-materia-5", texto: "text-materia-5" },
  6: { ponto: "bg-materia-6", bloco: "bg-materia-6/12 hover:bg-materia-6/18", borda: "border-materia-6", texto: "text-materia-6" },
};
