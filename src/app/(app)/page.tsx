"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useStoredUser } from "@/components/AuthGate";
import { NavIcon } from "@/components/NavIcon";
import { PageContainer } from "@/components/PageContainer";
import { Bloco, EstadoVazio } from "@/components/dashboard/Bloco";
import { ResumoPainel } from "@/components/dashboard/ResumoPainel";
import { alertaErro, botaoPrimario, botaoSecundario, linkAcao } from "@/components/ui";
import { Dashboard, getDashboard, listEditais, listEditaisOficiais } from "@/lib/api";
import { AuthUser } from "@/lib/auth";

type Concurso = { chave: string; href: string; titulo: string; detalhe: string };

async function listConcursos(): Promise<Concurso[]> {
  const [oficiais, proprios] = await Promise.all([listEditaisOficiais(), listEditais()]);
  return [
    ...oficiais
      .filter((edital) => edital.inscrito)
      .map((edital) => ({
        chave: `oficial-${edital.id}`,
        href: `/editais/oficiais/${edital.id}`,
        titulo: edital.area ? `${edital.cargo} · ${edital.area}` : edital.cargo,
        detalhe: `${edital.orgao} · ${edital.banca} · ${edital.ano}`,
      })),
    ...proprios.map((edital) => ({
      chave: `proprio-${edital.id}`,
      href: `/editais/${edital.id}`,
      titulo: edital.cargo,
      detalhe: `${edital.banca.nome} · planilha própria`,
    })),
  ];
}

export default function HomePage() {
  const user = useStoredUser();
  const [editais, setEditais] = useState<Concurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [painel, setPainel] = useState<Dashboard | null>(null);
  const [painelLoading, setPainelLoading] = useState(true);
  const [painelError, setPainelError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getDashboard()
      .then((data) => {
        if (!active) return;
        setPainel(data);
        setPainelError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setPainelError(err instanceof Error ? err.message : "Falha ao carregar o resumo");
      })
      .finally(() => {
        if (active) setPainelLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void listConcursos()
      .then((data) => {
        if (!active) return;
        setEditais(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Falha ao carregar concursos");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const cardsVencidos = painel?.resumo.revisoesHoje.cards ?? 0;

  return (
    <PageContainer maxWidth="wide">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] text-muted first-letter:uppercase">{hojePorExtenso()}</p>
          <h1 className="mt-0.5 font-display text-2xl font-semibold tracking-tight text-ink">
            {saudacao(user)}
          </h1>
        </div>
        {cardsVencidos > 0 ? (
          <Link href="/decks" className={botaoPrimario}>
            Revisar {cardsVencidos} {cardsVencidos === 1 ? "card" : "cards"}
          </Link>
        ) : (
          <Link href="/decks" className={botaoSecundario}>
            Ver decks
          </Link>
        )}
      </header>

      {painelError ? (
        <p role="alert" className={alertaErro}>
          {painelError}
        </p>
      ) : (
        <ResumoPainel resumo={painel?.resumo ?? null} loading={painelLoading} />
      )}

      <div className="grid gap-3 md:grid-cols-5">
        <Bloco id="estudos-heading" titulo="Ciclo de estudos" className="md:col-span-3">
          <EstadoVazio
            icone="timer"
            titulo="Ainda não há ciclo de estudos"
            texto="O ciclo segue as disciplinas do concurso que você estuda."
            acao={
              <Link href="/editais" className={botaoSecundario}>
                Escolher concurso
              </Link>
            }
          />
        </Bloco>
        <Bloco id="disciplinas-heading" titulo="Disciplinas" className="md:col-span-2">
          <EstadoVazio
            icone="folder"
            titulo="Elas ficam no concurso"
            texto="Cada edital traz as matérias e os assuntos cobrados."
          />
        </Bloco>
      </div>

      <Bloco
        id="concursos-heading"
        titulo="Concursos"
        acao={
          editais.length > 0 ? (
            <Link href="/editais" className={`text-[13px] ${linkAcao}`}>
              Ver todos
              <NavIcon name="chevron-right" className="h-3.5 w-3.5" />
            </Link>
          ) : null
        }
      >
        {error ? (
          <p role="alert" className={`m-4 ${alertaErro}`}>
            {error}
          </p>
        ) : null}
        {loading ? <p className="px-4 py-4 text-sm text-muted">Carregando…</p> : null}
        {!loading && !error && editais.length === 0 ? (
          <EstadoVazio
            icone="target"
            titulo="Ainda não há concurso"
            texto="Inscreva-se em um edital disponível para acompanhar banca, cargo e disciplinas."
            acao={
              <Link href="/editais" className={botaoPrimario}>
                Ver editais disponíveis
              </Link>
            }
          />
        ) : null}
        {editais.length > 0 ? (
          <ul className="text-sm">
            {editais.map((edital) => (
              <li key={edital.chave} className="border-b border-line last:border-0">
                <Link
                  href={edital.href}
                  className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-paper"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <NavIcon name="target" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink">{edital.titulo}</span>
                    <span className="block truncate text-[13px] text-muted">{edital.detalhe}</span>
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

function saudacao(user: AuthUser | null) {
  const primeiroNome = user?.nome?.split(" ")[0];
  return primeiroNome ? `Olá, ${primeiroNome}` : "Início";
}

function hojePorExtenso() {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}
