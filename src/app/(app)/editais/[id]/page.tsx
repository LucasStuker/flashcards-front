"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageContainer } from "@/components/PageContainer";
import { Edital, getEdital } from "@/lib/api";

function formatNumero(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 20,
    useGrouping: false,
  }).format(value);
}

const colunas = [
  { key: "teoria", label: "Teoria" },
  { key: "revisao", label: "Revisão" },
  { key: "questoes", label: "Questões" },
  { key: "horas", label: "Horas" },
] as const;

export default function EditalPage() {
  const params = useParams<{ id: string }>();
  const [edital, setEdital] = useState<Edital | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) {
      setEdital(null);
      setError("Edital não encontrado");
      return;
    }

    let active = true;
    void getEdital(id)
      .then((data) => {
        if (!active) return;
        setEdital(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setEdital(null);
        setError(err instanceof Error ? err.message : "Falha ao carregar edital");
      });

    return () => {
      active = false;
    };
  }, [params.id]);

  return (
    <PageContainer>
      <Link href="/editais" className="text-sm font-medium text-accent hover:text-accent-deep">
        ← Editais
      </Link>

      {error ? (
        <p role="alert" className="border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">
          {error}
        </p>
      ) : null}

      {!edital && !error ? (
        <p className="text-sm text-muted" aria-live="polite">
          Carregando…
        </p>
      ) : null}

      {edital ? (
        <>
          <header>
            <h1
              className="text-xl text-ink"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              {edital.cargo}
            </h1>
            <p className="mt-1 text-sm text-muted">{edital.banca.nome}</p>
          </header>

          {edital.disciplinas.length === 0 ? (
            <p className="text-sm text-muted">Nenhum assunto neste edital.</p>
          ) : (
            edital.disciplinas.map((disciplina) => (
              <section key={disciplina.id} className="border border-line bg-panel">
                <h2 className="border-b border-line px-3 py-2 text-sm font-semibold text-ink">
                  {disciplina.nome}
                </h2>
                <ul>
                  {disciplina.assuntos.map((assunto) => (
                    <li
                      key={assunto.id}
                      className="border-b border-line/70 px-3 py-2 last:border-0"
                    >
                      <p className="text-sm text-ink">{assunto.nome}</p>
                      <dl className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                        {colunas.map((coluna) => (
                          <div key={coluna.key}>
                            <dt className="text-muted">{coluna.label}</dt>
                            <dd className="tabular-nums text-ink">
                              {formatNumero(assunto[coluna.key])}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </>
      ) : null}
    </PageContainer>
  );
}
