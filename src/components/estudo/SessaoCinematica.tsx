"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { focusRing } from "@/components/ui";
import { OPCOES_RUIDO, TipoRuido } from "@/lib/ruido-estudo";

type Props = {
  disciplina: string;
  tempoPrincipal: string;
  tempoLiquido: string;
  rotuloFase: string | null;
  status: "Rodando" | "Pausada";
  faseAviso: string | null;
  ruido: TipoRuido;
  volumeRuido: number;
  concluindo: boolean;
  questoes: string;
  acertos: string;
  ocupado: boolean;
  onPausar: () => void;
  onRetomar: () => void;
  onConcluirPedido: () => void;
  onConcluirSalvar: () => void;
  onConcluirVoltar: () => void;
  onDescartar: () => void;
  onRuido: (tipo: TipoRuido) => void;
  onVolume: (v: number) => void;
  onQuestoes: (v: string) => void;
  onAcertos: (v: string) => void;
  onFechar: () => void;
};

const btnGhost = `inline-flex items-center justify-center rounded-md border border-white/20 bg-white/10 px-3.5 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/18 ${focusRing}`;
const btnSolid = `inline-flex items-center justify-center rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-panel transition-colors hover:bg-accent-deep ${focusRing}`;
const campoCine = `w-full rounded-md border border-white/20 bg-black/25 px-2.5 py-1.5 text-sm text-white placeholder:text-white/40 ${focusRing}`;

const FRASES_VIGIA = [
  "Meguinha está vigiando seu foco",
  "Ruby está vigiando seu estudo",
  "Meguinha está vigiando seu estudo",
  "Ruby está vigiando seu foco",
  "Meguinha e Ruby estão vigiando seu foco",
  "Ruby e Meguinha estão vigiando seu estudo",
] as const;

export function SessaoCinematica({
  disciplina,
  tempoPrincipal,
  tempoLiquido,
  rotuloFase,
  status,
  faseAviso,
  ruido,
  volumeRuido,
  concluindo,
  questoes,
  acertos,
  ocupado,
  onPausar,
  onRetomar,
  onConcluirPedido,
  onConcluirSalvar,
  onConcluirVoltar,
  onDescartar,
  onRuido,
  onVolume,
  onQuestoes,
  onAcertos,
  onFechar,
}: Props) {
  const [controles, setControles] = useState(true);
  const [fraseIdx, setFraseIdx] = useState(0);
  const [fraseVisivel, setFraseVisivel] = useState(true);
  const esconder = useRef<number | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    let pediuFullscreen = false;
    const id = window.requestAnimationFrame(() => {
      const el = root.current;
      if (!el?.requestFullscreen) return;
      pediuFullscreen = true;
      void el.requestFullscreen().catch(() => {
        pediuFullscreen = false;
      });
    });
    return () => {
      window.cancelAnimationFrame(id);
      document.body.style.overflow = prev;
      if (pediuFullscreen && document.fullscreenElement) {
        void document.exitFullscreen().catch(() => undefined);
      }
    };
  }, []);

  useEffect(() => {
    function onFs() {
      // Esc / sair do fullscreen nativo → volta ao modo compacto
      if (!document.fullscreenElement) onFechar();
    }
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, [onFechar]);

  useEffect(() => {
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setInterval(() => {
      if (reduzir) {
        setFraseIdx((i) => (i + 1) % FRASES_VIGIA.length);
        return;
      }
      setFraseVisivel(false);
      window.setTimeout(() => {
        setFraseIdx((i) => (i + 1) % FRASES_VIGIA.length);
        setFraseVisivel(true);
      }, 380);
    }, 5200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function revelar() {
      setControles(true);
      if (esconder.current) window.clearTimeout(esconder.current);
      if (concluindo) return;
      esconder.current = window.setTimeout(() => setControles(false), 3200);
    }
    revelar();
    const el = root.current;
    el?.addEventListener("pointermove", revelar);
    el?.addEventListener("pointerdown", revelar);
    window.addEventListener("keydown", revelar);
    return () => {
      el?.removeEventListener("pointermove", revelar);
      el?.removeEventListener("pointerdown", revelar);
      window.removeEventListener("keydown", revelar);
      if (esconder.current) window.clearTimeout(esconder.current);
    };
  }, [concluindo]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space" && !concluindo) {
        const t = e.target as HTMLElement | null;
        if (t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA")) {
          return;
        }
        e.preventDefault();
        if (status === "Rodando") onPausar();
        else onRetomar();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, concluindo, onPausar, onRetomar]);

  async function sair() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      // ok
    }
    onFechar();
  }

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[60] flex flex-col text-white"
      role="dialog"
      aria-label="Modo cinematográfico de estudo"
    >
      {/* atmosfera cinematográfica — verde da marca, não dark genérico */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 70% at 50% 35%, rgb(11 110 79 / 0.45), transparent 55%),
            radial-gradient(ellipse 60% 50% at 80% 90%, rgb(8 76 55 / 0.55), transparent 50%),
            linear-gradient(165deg, #0a1f18 0%, #0d2e22 42%, #071510 100%)
          `,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 cine-vinheta"
        aria-hidden
      />

      <header
        className={`relative z-10 flex items-start justify-between gap-4 px-5 pt-5 transition-opacity duration-500 sm:px-8 sm:pt-7 ${
          controles || concluindo ? "opacity-100" : "opacity-0"
        }`}
      >
        <div>
          <p className="text-[12px] font-medium tracking-[0.18em] text-white/55 uppercase">
            Yorkstudy · Estudo
          </p>
          <p className="mt-1 font-display text-lg font-semibold tracking-tight text-white sm:text-xl">
            {disciplina}
          </p>
          <p className="mt-0.5 text-[13px] text-white/55" aria-live="polite">
            {status}
            {rotuloFase ? ` · ${rotuloFase}` : ""}
          </p>
        </div>
        <button type="button" className={btnGhost} onClick={() => void sair()}>
          Sair do modo cinema
        </button>
      </header>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-8">
        {rotuloFase ? (
          <p className="mb-3 text-[13px] font-medium tracking-[0.2em] text-white/50 uppercase">
            {rotuloFase}
          </p>
        ) : (
          <p className="mb-3 text-[13px] font-medium tracking-[0.2em] text-white/50 uppercase">
            Tempo líquido
          </p>
        )}
        <p
          className="font-display text-[clamp(3.5rem,14vw,8.5rem)] leading-none font-semibold tracking-tight tabular-nums text-white"
          aria-live="polite"
        >
          {tempoPrincipal}
        </p>
        {rotuloFase ? (
          <p className="mt-4 text-sm text-white/45">
            Sessão · <span className="tabular-nums text-white/70">{tempoLiquido}</span>
          </p>
        ) : null}

        <p
          className={`mt-8 max-w-lg text-center font-display text-base tracking-tight text-white/70 transition-all duration-300 sm:text-lg ${
            fraseVisivel ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
          }`}
          aria-live="polite"
        >
          {FRASES_VIGIA[fraseIdx]}
        </p>
        <div className="mt-3 flex items-center justify-center gap-1.5" aria-hidden>
          {FRASES_VIGIA.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === fraseIdx ? "w-4 bg-white/70" : "w-1.5 bg-white/25"
              }`}
            />
          ))}
        </div>

        {faseAviso ? (
          <p
            role="status"
            className="mt-6 max-w-md rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-center text-sm text-white/90 backdrop-blur-sm"
          >
            {faseAviso}
          </p>
        ) : null}
      </div>

      {/* Ruby (esquerda) e Meguinha (direita) — vigias do estudo */}
      <aside
        className="pointer-events-none absolute bottom-0 left-0 z-10 flex flex-col items-start pl-2 pb-2 sm:pl-6 sm:pb-4"
      >
        <p className="mb-1 ml-3 text-[11px] leading-snug tracking-wide text-white/50 sm:ml-5">
          Ruby
        </p>
        <div className="york-vigia-float relative h-[min(40vh,300px)] w-[min(30vw,210px)] sm:h-[min(46vh,360px)] sm:w-[min(28vw,230px)]">
          <Image
            src="/york-ruby.png"
            alt="Ruby, york de vigia do estudo"
            fill
            className="object-contain object-bottom drop-shadow-[0_20px_40px_rgb(0_0_0/0.45)]"
            sizes="230px"
            priority
          />
        </div>
      </aside>
      <aside
        className="pointer-events-none absolute right-0 bottom-0 z-10 flex flex-col items-end pr-2 pb-2 sm:pr-6 sm:pb-4"
      >
        <p className="mb-1 mr-3 text-[11px] leading-snug tracking-wide text-white/50 sm:mr-5">
          Meguinha
        </p>
        <div className="york-vigia-float york-vigia-float-delay relative h-[min(40vh,300px)] w-[min(30vw,210px)] sm:h-[min(46vh,360px)] sm:w-[min(28vw,230px)]">
          <Image
            src="/york-meguinha.png"
            alt="Meguinha, york de vigia do estudo"
            fill
            className="object-contain object-bottom drop-shadow-[0_20px_40px_rgb(0_0_0/0.45)]"
            sizes="230px"
            priority
          />
        </div>
      </aside>

      <footer
        className={`relative z-20 mx-auto w-full max-w-3xl px-4 pb-6 transition-opacity duration-500 sm:px-6 ${
          controles || concluindo ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {!concluindo ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-white/12 bg-black/30 p-3 backdrop-blur-md sm:p-4">
            <div className="flex flex-wrap items-center gap-2">
              {status === "Rodando" ? (
                <button type="button" className={btnGhost} disabled={ocupado} onClick={onPausar}>
                  Pausar
                </button>
              ) : (
                <button type="button" className={btnSolid} disabled={ocupado} onClick={onRetomar}>
                  Retomar
                </button>
              )}
              <button
                type="button"
                className={btnSolid}
                disabled={ocupado}
                onClick={onConcluirPedido}
              >
                Concluir
              </button>
              <button
                type="button"
                className={`text-sm font-medium text-red-300/90 hover:underline ${focusRing}`}
                disabled={ocupado}
                onClick={onDescartar}
              >
                Descartar
              </button>
              <span className="ml-auto hidden text-[12px] text-white/35 sm:inline">
                Espaço pausa · move o mouse para controles
              </span>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex min-w-[9rem] flex-1 flex-col gap-1 text-[12px] text-white/60">
                Ruído
                <select
                  className={campoCine}
                  value={ruido}
                  onChange={(e) => onRuido(e.target.value as TipoRuido)}
                >
                  {OPCOES_RUIDO.map((opcao) => (
                    <option key={opcao.valor} value={opcao.valor} className="bg-ink text-white">
                      {opcao.titulo}
                    </option>
                  ))}
                </select>
              </label>
              {ruido !== "off" ? (
                <label className="flex min-w-[8rem] flex-1 flex-col gap-1 text-[12px] text-white/60">
                  Volume
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volumeRuido}
                    onChange={(e) => onVolume(Number(e.target.value))}
                    className="w-full accent-[var(--accent)]"
                  />
                </label>
              ) : null}
            </div>
          </div>
        ) : (
          <form
            className="flex flex-col gap-3 rounded-2xl border border-white/12 bg-black/35 p-4 backdrop-blur-md sm:max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              onConcluirSalvar();
            }}
          >
            <p className="text-sm text-white/70">
              Lance as questões desta sessão. Com tópico, somam no verticalizado.
            </p>
            <label className="flex flex-col gap-1 text-[13px] text-white/70">
              Questões
              <input
                className={campoCine}
                inputMode="numeric"
                value={questoes}
                onChange={(e) => onQuestoes(e.target.value.replace(/\D/g, ""))}
              />
            </label>
            <label className="flex flex-col gap-1 text-[13px] text-white/70">
              Acertos
              <input
                className={campoCine}
                inputMode="numeric"
                value={acertos}
                onChange={(e) => onAcertos(e.target.value.replace(/\D/g, ""))}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className={btnSolid} disabled={ocupado}>
                {ocupado ? "Salvando…" : "Salvar sessão"}
              </button>
              <button
                type="button"
                className={btnGhost}
                disabled={ocupado}
                onClick={onConcluirVoltar}
              >
                Voltar
              </button>
            </div>
          </form>
        )}
      </footer>
    </div>
  );
}
