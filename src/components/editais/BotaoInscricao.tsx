"use client";

import { useState } from "react";
import { NavIcon } from "@/components/NavIcon";
import { botaoPrimario, botaoSecundario } from "@/components/ui";
import { cancelarInscricaoEdital, inscreverEdital } from "@/lib/api";

type BotaoInscricaoProps = {
  editalId: number;
  cargo: string;
  inscrito: boolean;
  onChange: (inscrito: boolean) => void;
};

export function BotaoInscricao({ editalId, cargo, inscrito, onChange }: BotaoInscricaoProps) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function alternar() {
    setEnviando(true);
    setErro(null);
    try {
      if (inscrito) await cancelarInscricaoEdital(editalId);
      else await inscreverEdital(editalId);
      onChange(!inscrito);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao atualizar inscrição");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {inscrito ? (
          <span className="inline-flex items-center gap-1 text-[13px] font-medium text-ok">
            <NavIcon name="check" className="h-4 w-4" />
            Inscrito
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => void alternar()}
          disabled={enviando}
          aria-label={inscrito ? `Cancelar inscrição em ${cargo}` : `Inscrever-se em ${cargo}`}
          className={`${inscrito ? botaoSecundario : botaoPrimario} disabled:opacity-60`}
        >
          {enviando ? "Salvando…" : inscrito ? "Cancelar" : "Inscrever-se"}
        </button>
      </div>
      {erro ? (
        <p role="alert" className="text-[13px] text-bad">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
