import { Topico } from "@/lib/api";

export function ArvoreTopicos({ topicos, nivel = 0 }: { topicos: Topico[]; nivel?: number }) {
  return (
    <ul className={nivel === 0 ? "text-sm" : "border-l border-line pl-3"}>
      {topicos.map((topico) => (
        <li
          key={topico.id}
          className={nivel === 0 ? "border-b border-line px-4 py-2.5 last:border-0" : "pt-1.5"}
        >
          <span className={nivel === 0 ? "font-medium text-ink" : "text-ink/80"}>{topico.nome}</span>
          {topico.filhos.length > 0 ? (
            <div className="mt-1.5">
              <ArvoreTopicos topicos={topico.filhos} nivel={nivel + 1} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
