"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import {
  PlanoCronograma,
  criarPlanoCronograma,
  getPlanoCronograma,
} from "@/lib/api";
import { alertaErro, botaoPrimario, focusRing } from "@/components/ui";

type Props = {
  editalId: number | null;
  segunda: string;
  disabled?: boolean;
  onGerado: (blocosInicio: string) => void;
};

const faseLabel: Record<string, string> = {
  base: "Base",
  intensivo: "Intensivo",
  revisao: "Revisão",
};

export function PlanoPainel({ editalId, segunda, disabled, onGerado }: Props) {
  const [plano, setPlano] = useState<PlanoCronograma | null>(null);
  const [dataProva, setDataProva] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    void getPlanoCronograma()
      .then((p) => {
        setPlano(p);
        if (p?.dataProva) setDataProva(p.dataProva);
      })
      .catch(() => setPlano(null));
  }, []);

  async function gerar() {
    if (editalId == null) return;
    setOcupado(true);
    setErro(null);
    try {
      const res = await criarPlanoCronograma({
        editalId,
        dataProva: dataProva || null,
        segunda,
      });
      setPlano(res.plano);
      onGerado(res.plano.segundaInicio);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao gerar o plano");
    } finally {
      setOcupado(false);
    }
  }

  const semanaAtual = plano?.semanas.find((s) => s.segunda === segunda) ?? null;

  return (
    <section className="rounded-xl border border-line bg-panel p-3 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-ink">Plano até a prova</h2>
          <p className="mt-0.5 text-[12px] text-muted">
            A IA (ou heurística) define a estratégia por semana; os horários livres montam a grade.
          </p>
        </div>
        <button
          type="button"
          className={botaoPrimario}
          disabled={disabled || ocupado || editalId == null}
          onClick={() => void gerar()}
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          {ocupado ? "Gerando plano…" : "Gerar plano"}
        </button>
      </div>

      <label className="mt-3 flex max-w-xs flex-col gap-1 text-[13px] font-medium text-ink/80">
        Data da prova (opcional)
        <input
          type="date"
          className={`rounded-md border border-line bg-panel px-2.5 py-1.5 text-sm text-ink ${focusRing}`}
          value={dataProva}
          onChange={(e) => setDataProva(e.target.value)}
        />
        <span className="text-[12px] font-normal text-muted">
          Sem data: plano de 8 semanas. Com data: até 16 semanas.
        </span>
      </label>

      {erro ? (
        <p className={`mt-2 ${alertaErro}`} role="alert">
          {erro}
        </p>
      ) : null}

      {plano ? (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-[13px] text-ink/90">{plano.justificativa}</p>
          <p className="text-[12px] text-muted">
            Método: {plano.metodo === "openai" ? "IA" : "heurística"}
            {plano.generationNote ? ` · ${plano.generationNote}` : ""}
            {" · "}
            {plano.semanas.length} semana{plano.semanas.length === 1 ? "" : "s"}
          </p>

          {semanaAtual ? (
            <p className="rounded-lg border border-accent/25 bg-accent/5 px-3 py-2 text-[13px] text-ink">
              <span className="font-medium">
                {faseLabel[semanaAtual.fase] ?? semanaAtual.fase} · {semanaAtual.titulo}
              </span>
              <span className="mt-0.5 block text-muted">{semanaAtual.resumo}</span>
            </p>
          ) : null}

          <ol className="flex max-h-40 flex-col gap-1 overflow-y-auto text-[12px] text-muted">
            {plano.semanas.map((s) => (
              <li
                key={s.indice}
                className={s.segunda === segunda ? "font-medium text-ink" : ""}
              >
                {s.segunda} — {faseLabel[s.fase] ?? s.fase}: {s.titulo}
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="mt-3 text-[13px] text-muted">
          Ainda sem plano. Salve os horários livres e gere um plano completo.
        </p>
      )}
    </section>
  );
}
