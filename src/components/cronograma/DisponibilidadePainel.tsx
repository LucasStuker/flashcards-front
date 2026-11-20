"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  SlotLivre,
  getDisponibilidadeCronograma,
  salvarDisponibilidadeCronograma,
} from "@/lib/api";
import { alertaErro, botaoPrimario, botaoSecundario, focusRing } from "@/components/ui";
import { formatHora } from "./datas";

const DIAS = [
  { weekday: 0, label: "Seg" },
  { weekday: 1, label: "Ter" },
  { weekday: 2, label: "Qua" },
  { weekday: 3, label: "Qui" },
  { weekday: 4, label: "Sex" },
  { weekday: 5, label: "Sáb" },
  { weekday: 6, label: "Dom" },
] as const;

const campo = `rounded-md border border-line bg-panel px-2 py-1 text-sm text-ink ${focusRing}`;

type Props = {
  onSalvo?: () => void;
};

export function DisponibilidadePainel({ onSalvo }: Props) {
  const [slots, setSlots] = useState<SlotLivre[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    void getDisponibilidadeCronograma()
      .then((res) => setSlots(res.slots))
      .catch((err: unknown) => {
        setErro(err instanceof Error ? err.message : "Falha ao carregar horários");
      });
  }, []);

  function adicionar() {
    setSlots((atual) => [
      ...atual,
      { weekday: 0, inicioMin: 19 * 60, fimMin: 22 * 60 },
    ]);
  }

  function atualizar(i: number, mudanca: Partial<SlotLivre>) {
    setSlots((atual) => atual.map((s, idx) => (idx === i ? { ...s, ...mudanca } : s)));
  }

  function remover(i: number) {
    setSlots((atual) => atual.filter((_, idx) => idx !== i));
  }

  async function salvar() {
    setOcupado(true);
    setErro(null);
    setAviso(null);
    try {
      const res = await salvarDisponibilidadeCronograma(slots);
      setSlots(res.slots);
      setAviso("Horários livres salvos.");
      onSalvo?.();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao salvar");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="rounded-xl border border-line bg-panel p-3 shadow-card">
      <h2 className="text-sm font-semibold text-ink">Horários livres</h2>
      <p className="mt-0.5 text-[12px] text-muted">
        A geração da semana só usa estas janelas. Salve antes de gerar.
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

      <ul className="mt-3 flex flex-col gap-2">
        {slots.length === 0 ? (
          <li className="text-[13px] text-muted">Nenhum horário ainda.</li>
        ) : (
          slots.map((slot, i) => (
            <li key={i} className="flex flex-wrap items-center gap-1.5">
              <select
                className={campo}
                value={slot.weekday}
                onChange={(e) => atualizar(i, { weekday: Number(e.target.value) })}
                aria-label="Dia da semana"
              >
                {DIAS.map((d) => (
                  <option key={d.weekday} value={d.weekday}>
                    {d.label}
                  </option>
                ))}
              </select>
              <input
                type="time"
                className={campo}
                value={formatHora(slot.inicioMin)}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(":").map(Number);
                  atualizar(i, { inicioMin: h * 60 + m });
                }}
                aria-label="Início"
              />
              <span className="text-[12px] text-muted">até</span>
              <input
                type="time"
                className={campo}
                value={formatHora(slot.fimMin)}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(":").map(Number);
                  atualizar(i, { fimMin: h * 60 + m });
                }}
                aria-label="Fim"
              />
              <button
                type="button"
                className={`rounded-md p-1.5 text-muted hover:bg-paper hover:text-bad ${focusRing}`}
                onClick={() => remover(i)}
                aria-label="Remover horário"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))
        )}
      </ul>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={botaoSecundario} onClick={adicionar}>
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Adicionar
        </button>
        <button type="button" className={botaoPrimario} disabled={ocupado} onClick={() => void salvar()}>
          {ocupado ? "Salvando…" : "Salvar horários"}
        </button>
      </div>
    </section>
  );
}
