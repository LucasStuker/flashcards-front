"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { PageContainer } from "@/components/PageContainer";
import { Bloco, EstadoVazio } from "@/components/dashboard/Bloco";
import { focusRing, alertaErro, botaoPrimario } from "@/components/ui";
import { ResumoVerticalizado, TabelaVerticalizado } from "@/components/verticalizado/TabelaVerticalizado";
import {
  EditalOficialResumo,
  ProgressoTopico,
  Verticalizado,
  getVerticalizado,
  listEditaisOficiais,
  salvarProgressoTopico,
} from "@/lib/api";

export default function VerticalizadoPage() {
  return (
    <Suspense fallback={null}>
      <VerticalizadoConteudo />
    </Suspense>
  );
}

function VerticalizadoConteudo() {
  const router = useRouter();
  const params = useSearchParams();
  const [inscritos, setInscritos] = useState<EditalOficialResumo[] | null>(null);
  const [verticalizado, setVerticalizado] = useState<Verticalizado | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [salvando, setSalvando] = useState<number | null>(null);

  useEffect(() => {
    let ativo = true;
    void listEditaisOficiais()
      .then((editais) => {
        if (ativo) setInscritos(editais.filter((edital) => edital.inscrito));
      })
      .catch((err: unknown) => {
        if (ativo) setErro(err instanceof Error ? err.message : "Falha ao carregar editais");
      });
    return () => {
      ativo = false;
    };
  }, []);

  const pedido = Number(params.get("edital"));
  const editalId =
    inscritos?.find((edital) => edital.id === pedido)?.id ?? inscritos?.[0]?.id ?? null;

  useEffect(() => {
    if (editalId === null) return;
    let ativo = true;
    setVerticalizado(null);
    setErroSalvar(null);
    void getVerticalizado(editalId)
      .then((data) => {
        if (!ativo) return;
        setVerticalizado(data);
        setErro(null);
      })
      .catch((err: unknown) => {
        if (ativo) setErro(err instanceof Error ? err.message : "Falha ao carregar o verticalizado");
      });
    return () => {
      ativo = false;
    };
  }, [editalId]);

  async function salvar(topicoId: number, progresso: ProgressoTopico) {
    if (editalId === null) return false;
    setSalvando(topicoId);
    setErroSalvar(null);
    try {
      setVerticalizado(await salvarProgressoTopico(editalId, topicoId, progresso));
      return true;
    } catch (err) {
      setErroSalvar(err instanceof Error ? err.message : "Falha ao salvar o progresso");
      return false;
    } finally {
      setSalvando(null);
    }
  }

  return (
    <PageContainer maxWidth="wide">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Edital verticalizado
          </h1>
          <p className="text-sm text-muted">
            Marque a teoria e as revisões de cada tópico e lance as questões que você fez.
          </p>
        </div>
        {inscritos && inscritos.length > 1 && editalId !== null ? (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[13px] text-muted">Edital</span>
            <select
              value={editalId}
              onChange={(event) => router.replace(`/verticalizado?edital=${event.target.value}`)}
              className={`rounded-md border border-line bg-panel px-3 py-1.5 text-sm text-ink ${focusRing}`}
            >
              {inscritos.map((edital) => (
                <option key={edital.id} value={edital.id}>
                  {edital.area ? `${edital.cargo} · ${edital.area}` : edital.cargo} ({edital.ano})
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {erro ? (
        <p role="alert" className={alertaErro}>
          {erro}
        </p>
      ) : null}

      {inscritos && inscritos.length === 0 ? (
        <Bloco id="verticalizado-vazio-heading" titulo="Nenhum edital inscrito">
          <EstadoVazio
            icone="checklist"
            titulo="Ainda não há edital para acompanhar"
            texto="Inscreva-se em um edital disponível e o verticalizado dele aparece aqui."
            acao={
              <Link href="/editais" className={botaoPrimario}>
                Ver editais disponíveis
              </Link>
            }
          />
        </Bloco>
      ) : null}

      {!erro && (inscritos === null || (editalId !== null && !verticalizado)) ? (
        <p className="text-sm text-muted" aria-live="polite">
          Carregando…
        </p>
      ) : null}

      {verticalizado ? (
        <>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-ink">
              {verticalizado.area ? `${verticalizado.cargo} · ${verticalizado.area}` : verticalizado.cargo}
            </p>
            <p className="text-[13px] text-muted">
              {verticalizado.orgao} · {verticalizado.banca} · {verticalizado.ano} ·{" "}
              <Link href={`/editais/oficiais/${verticalizado.id}`} className="text-accent hover:text-accent-deep">
                ver edital
              </Link>
            </p>
          </div>
          <ResumoVerticalizado resumo={verticalizado.resumo} />
          {erroSalvar ? (
            <p role="alert" className={`sticky top-2 z-10 bg-panel shadow-card ${alertaErro}`}>
              {erroSalvar}
            </p>
          ) : null}
          <TabelaVerticalizado verticalizado={verticalizado} salvando={salvando} onSalvar={salvar} />
        </>
      ) : null}
    </PageContainer>
  );
}
