"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ItemAutoavaliacao,
  MateriaCronograma,
  NivelDominio,
  getAutoavaliacaoCronograma,
  listMateriasCronograma,
  salvarAutoavaliacaoCronograma,
} from "@/lib/api";
import { alertaErro, botaoPrimario, focusRing } from "@/components/ui";

type Props = {
  editalId: number | null;
  disabled?: boolean;
};

const NIVEIS: { valor: NivelDominio; label: string }[] = [
  { valor: "fraco", label: "Fraco" },
  { valor: "ok", label: "Ok" },
  { valor: "forte", label: "Forte" },
];

export function AutoavaliacaoPainel({ editalId, disabled }: Props) {
  const [materias, setMaterias] = useState<MateriaCronograma[]>([]);
  const [dominio, setDominio] = useState<Record<string, NivelDominio>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (editalId == null) {
      setMaterias([]);
      setDominio({});
      return;
    }
    let ativo = true;
    setCarregando(true);
    void Promise.all([
      listMateriasCronograma(editalId),
      getAutoavaliacaoCronograma(editalId),
    ])
      .then(([lista, auto]) => {
        if (!ativo) return;
        setMaterias(lista);
        const mapa: Record<string, NivelDominio> = {};
        for (const m of lista) mapa[m.id] = "ok";
        for (const item of auto.itens) mapa[item.materiaId] = item.dominio;
        setDominio(mapa);
        setErro(null);
      })
      .catch((err: unknown) => {
        if (ativo) {
          setErro(err instanceof Error ? err.message : "Falha ao carregar");
        }
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [editalId]);

  const respondidas = useMemo(
    () => materias.filter((m) => dominio[m.id]).length,
    [materias, dominio],
  );

  async function salvar() {
    if (editalId == null) return;
    setOcupado(true);
    setErro(null);
    setAviso(null);
    const itens: ItemAutoavaliacao[] = materias.map((m) => ({
      materiaId: m.id,
      dominio: dominio[m.id] ?? "ok",
    }));
    try {
      const res = await salvarAutoavaliacaoCronograma(editalId, itens);
      const mapa: Record<string, NivelDominio> = {};
      for (const item of res.itens) mapa[item.materiaId] = item.dominio;
      setDominio((atual) => ({ ...atual, ...mapa }));
      setAviso("Autoavaliação salva. Use Gerar plano para aplicar.");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao salvar");
    } finally {
      setOcupado(false);
    }
  }

  if (editalId == null) return null;

  return (
    <section className="rounded-xl border border-line bg-panel p-3 shadow-card">
      <h2 className="text-sm font-semibold text-ink">Como você está?</h2>
      <p className="mt-0.5 text-[12px] text-muted">
        Marque fraco / ok / forte em cada matéria. Isso entra 50/50 com o desempenho no
        plano.
      </p>

      {erro ? (
        <p className={`mt-2 ${alertaErro}`} role="alert">
          {erro}
        </p>
      ) : null}
      {aviso ? (
        <p className="mt-2 rounded-lg border border-ok/25 bg-ok/5 px-2.5 py-1.5 text-[13px] text-ink">
          {aviso}
        </p>
      ) : null}

      {carregando ? (
        <p className="mt-3 text-[13px] text-muted">Carregando matérias…</p>
      ) : (
        <ul className="mt-3 flex max-h-72 flex-col gap-2 overflow-y-auto">
          {materias.map((m) => (
            <li
              key={m.id}
              className="flex flex-col gap-1.5 rounded-lg border border-line px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="min-w-0 text-sm font-medium break-words text-ink">{m.nome}</span>
              <div
                role="radiogroup"
                aria-label={`Domínio em ${m.nome}`}
                className="flex shrink-0 gap-1"
              >
                {NIVEIS.map((n) => {
                  const marcado = (dominio[m.id] ?? "ok") === n.valor;
                  return (
                    <label
                      key={n.valor}
                      className={`cursor-pointer rounded-md border px-2 py-1 text-[12px] font-medium transition-colors ${
                        marcado
                          ? n.valor === "fraco"
                            ? "border-bad/40 bg-bad/10 text-bad"
                            : n.valor === "forte"
                              ? "border-ok/40 bg-ok/10 text-ok"
                              : "border-accent/40 bg-accent/10 text-accent"
                          : "border-line bg-panel text-muted hover:bg-paper"
                      }`}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        name={`dom-${m.id}`}
                        checked={marcado}
                        disabled={disabled}
                        onChange={() =>
                          setDominio((atual) => ({ ...atual, [m.id]: n.valor }))
                        }
                      />
                      {n.label}
                    </label>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={botaoPrimario}
          disabled={disabled || ocupado || materias.length === 0}
          onClick={() => void salvar()}
        >
          {ocupado ? "Salvando…" : "Salvar autoavaliação"}
        </button>
        <span className={`text-[12px] text-muted ${focusRing}`}>
          {respondidas}/{materias.length} matérias
        </span>
      </div>
    </section>
  );
}
