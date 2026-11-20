import { StatusImportacao } from "@/lib/api";

const ROTULO: Record<StatusImportacao, string> = {
  processando: "Lendo arquivo…",
  rascunho: "Para revisar",
  publicado: "Publicado",
  erro: "Falhou",
};

const COR: Record<StatusImportacao, string> = {
  processando: "bg-paper text-muted",
  rascunho: "bg-accent/10 text-accent-deep",
  publicado: "bg-ok/10 text-ok",
  erro: "bg-bad/10 text-bad",
};

export function StatusImportacaoTag({ status }: { status: StatusImportacao }) {
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${COR[status]}`}>
      {ROTULO[status]}
    </span>
  );
}
