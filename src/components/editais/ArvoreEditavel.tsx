"use client";

import { NavIcon } from "@/components/NavIcon";
import { focusRing } from "@/components/ui";
import { NoExtraido, NoPrevia } from "@/lib/api";

export const PROFUNDIDADE_MAXIMA = 4;

type Props = {
  nos: NoExtraido[];
  /** Conferência com o catálogo do último salvamento; ausente quando há edição pendente. */
  previa?: NoPrevia[];
  profundidade?: number;
  onChange: (nos: NoExtraido[]) => void;
};

const botaoIcone = `flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted transition-colors hover:bg-paper hover:text-ink ${focusRing}`;

export function ArvoreEditavel({ nos, previa, profundidade = 1, onChange }: Props) {
  function trocar(indice: number, no: NoExtraido) {
    onChange(nos.map((atual, i) => (i === indice ? no : atual)));
  }

  return (
    <ul className={profundidade > 1 ? "ml-3.5 border-l border-line pl-2" : ""}>
      {nos.map((no, indice) => {
        const conferido = previa?.[indice];
        const rotulo = no.nome || "tópico sem nome";
        return (
          <li key={indice}>
            <div className="flex items-center gap-1.5">
              <Marcador conferido={conferido} />
              <input
                aria-label={`Tópico: ${rotulo}`}
                value={no.nome}
                autoFocus={no.nome === ""}
                onChange={(e) => trocar(indice, { ...no, nome: e.target.value })}
                className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1.5 py-1 text-sm text-ink hover:border-line focus:border-accent focus:bg-panel focus:outline-none"
              />
              {profundidade < PROFUNDIDADE_MAXIMA ? (
                <button
                  type="button"
                  title="Adicionar subtópico"
                  aria-label={`Adicionar subtópico em ${rotulo}`}
                  className={botaoIcone}
                  onClick={() =>
                    trocar(indice, { ...no, filhos: [...no.filhos, { nome: "", filhos: [] }] })
                  }
                >
                  <NavIcon name="plus" className="h-3.5 w-3.5" />
                </button>
              ) : null}
              <button
                type="button"
                title="Remover tópico e subtópicos"
                aria-label={`Remover ${rotulo}`}
                className={`${botaoIcone} hover:text-bad`}
                onClick={() => onChange(nos.filter((_, i) => i !== indice))}
              >
                <NavIcon name="close" className="h-3.5 w-3.5" />
              </button>
            </div>
            {no.filhos.length > 0 ? (
              <ArvoreEditavel
                nos={no.filhos}
                previa={conferido?.filhos}
                profundidade={profundidade + 1}
                onChange={(filhos) => trocar(indice, { ...no, filhos })}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function Marcador({ conferido }: { conferido?: NoPrevia }) {
  if (!conferido) return <span aria-hidden="true" className="h-2 w-2 shrink-0" />;
  const existe = conferido.topicoId !== null;
  return (
    <span
      title={existe ? "Já existe no catálogo" : "Tópico novo"}
      className={`h-2 w-2 shrink-0 rounded-full ${existe ? "bg-ok" : "border border-accent"}`}
    >
      <span className="sr-only">{existe ? "já existe no catálogo" : "novo"}</span>
    </span>
  );
}
