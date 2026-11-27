"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NavIcon } from "@/components/NavIcon";
import { PageContainer } from "@/components/PageContainer";
import { Bloco, EstadoVazio } from "@/components/dashboard/Bloco";
import { alertaErro } from "@/components/ui";
import { DisciplinaResumo, listDisciplinas } from "@/lib/api";

export default function DisciplinasPage() {
  const [disciplinas, setDisciplinas] = useState<DisciplinaResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void listDisciplinas()
      .then((data) => {
        if (!active) return;
        setDisciplinas(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Falha ao carregar disciplinas");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <PageContainer>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Disciplinas</h1>

      <Bloco id="disciplinas-lista" titulo="Catálogo">
        {error ? (
          <p role="alert" className={`m-4 ${alertaErro}`}>
            {error}
          </p>
        ) : null}
        {loading ? <p className="px-4 py-4 text-sm text-muted">Carregando…</p> : null}
        {!loading && !error && disciplinas.length === 0 ? (
          <EstadoVazio
            icone="folder"
            titulo="Ainda não há disciplina"
            texto="O catálogo aparece aqui assim que for carregado."
          />
        ) : null}
        {disciplinas.length > 0 ? (
          <ul className="text-sm">
            {disciplinas.map((disciplina) => (
              <li key={disciplina.id} className="border-b border-line last:border-0">
                <Link
                  href={`/disciplinas/${disciplina.id}`}
                  className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-paper"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <NavIcon name="folder" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink">{disciplina.nome}</span>
                    <span className="block text-[13px] text-muted">
                      {disciplina.topicos} {disciplina.topicos === 1 ? "tópico" : "tópicos"}
                    </span>
                  </span>
                  <NavIcon
                    name="chevron-right"
                    className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </Bloco>
    </PageContainer>
  );
}
