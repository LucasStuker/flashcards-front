import { ReactNode } from "react";
import { NavIcon, NavIconName } from "../NavIcon";

type BlocoProps = {
  id: string;
  titulo: string;
  acao?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function Bloco({ id, titulo, acao, className = "", children }: BlocoProps) {
  return (
    <section
      aria-labelledby={id}
      className={`flex flex-col overflow-hidden rounded-xl border border-line bg-panel shadow-card ${className}`}
    >
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 id={id} className="text-sm font-semibold text-ink">
          {titulo}
        </h2>
        {acao}
      </header>
      <div className="flex-1">{children}</div>
    </section>
  );
}

type EstadoVazioProps = {
  icone: NavIconName;
  titulo: string;
  texto: string;
  acao?: ReactNode;
};

export function EstadoVazio({ icone, titulo, texto, acao }: EstadoVazioProps) {
  return (
    <div className="flex flex-col items-start gap-1 px-4 py-5">
      <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-paper text-muted">
        <NavIcon name={icone} className="h-[18px] w-[18px]" />
      </span>
      <p className="text-sm font-medium text-ink">{titulo}</p>
      <p className="text-[13px] text-muted">{texto}</p>
      {acao ? <div className="mt-3">{acao}</div> : null}
    </div>
  );
}
