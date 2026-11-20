"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageContainer } from "@/components/PageContainer";
import { Bloco, EstadoVazio } from "@/components/dashboard/Bloco";
import { StatusImportacaoTag } from "@/components/editais/StatusImportacaoTag";
import { alertaErro, botaoPrimario, linkAcao } from "@/components/ui";
import { ImportacaoResumo, enviarArquivoEdital, listImportacoes } from "@/lib/api";

const ACEITOS = ".pdf,.xlsx,.csv,.txt,application/pdf";
const INTERVALO_POLL = 4000;

export default function ImportarEditaisPage() {
  const [importacoes, setImportacoes] = useState<ImportacaoResumo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setImportacoes(await listImportacoes());
      setErro(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao carregar importações");
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const processando = importacoes?.some((item) => item.status === "processando") ?? false;
  useEffect(() => {
    if (!processando) return;
    const timer = window.setInterval(() => void carregar(), INTERVALO_POLL);
    return () => window.clearInterval(timer);
  }, [processando, carregar]);

  async function enviar(file: File | null) {
    if (!file) return;
    setEnviando(true);
    setErro(null);
    try {
      const criada = await enviarArquivoEdital(file);
      setImportacoes((atual) => [criada, ...(atual ?? [])]);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao enviar o arquivo");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-1">
        <Link href="/editais" className={`w-fit text-sm ${linkAcao}`}>
          ← Editais
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
          Importar editais
        </h1>
        <p className="max-w-2xl text-sm text-muted">
          Envie o edital como saiu: PDF da banca, edital verticalizado ou planilha em qualquer
          formato. O sistema lê o conteúdo programático e monta disciplinas e tópicos. Você revisa
          e publica; só então o edital aparece para os alunos.
        </p>
      </div>

      <label
        htmlFor="edital-upload"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void enviar(e.dataTransfer.files?.[0] ?? null);
        }}
        className={`flex cursor-pointer flex-col items-start gap-1 rounded-xl border border-dashed border-line bg-panel px-4 py-5 text-sm transition-colors hover:border-accent focus-within:border-accent ${
          enviando ? "pointer-events-none opacity-70" : ""
        }`}
      >
        <span className="font-medium text-ink">
          {enviando ? "Enviando arquivo…" : "Arraste o arquivo do edital ou clique para escolher"}
        </span>
        <span className="text-muted">PDF, .xlsx, .csv ou .txt, até 40 MB.</span>
        <input
          id="edital-upload"
          type="file"
          accept={ACEITOS}
          className="sr-only"
          disabled={enviando}
          onChange={(e) => {
            void enviar(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
      </label>

      {erro ? (
        <p role="alert" className={alertaErro}>
          {erro}
        </p>
      ) : null}

      <Bloco id="importacoes-heading" titulo="Importações">
        {!importacoes && !erro ? (
          <p className="px-4 py-5 text-sm text-muted" aria-live="polite">
            Carregando…
          </p>
        ) : null}

        {importacoes && importacoes.length === 0 ? (
          <EstadoVazio
            icone="folder"
            titulo="Nenhum arquivo enviado"
            texto="Cada arquivo vira um rascunho para revisar antes de publicar."
          />
        ) : null}

        {importacoes && importacoes.length > 0 ? (
          <ul aria-live="polite">
            {importacoes.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-0"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="truncate text-sm font-medium text-ink" title={item.arquivo}>
                    {item.arquivo}
                  </p>
                  <p className="text-[13px] text-muted">
                    {new Date(item.criadoEm).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                    {item.orgao ? ` · ${item.orgao}` : ""}
                    {item.cargos > 1 ? ` · ${item.cargos} cargos` : ""}
                  </p>
                  {item.nota ? (
                    <p
                      className={`text-[13px] ${item.status === "erro" ? "text-bad" : "text-ink/70"}`}
                    >
                      {item.nota}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <StatusImportacaoTag status={item.status} />
                  {item.status === "rascunho" ? (
                    <Link href={`/editais/importar/${item.id}`} className={botaoPrimario}>
                      Revisar
                    </Link>
                  ) : null}
                  {item.status === "publicado" ? (
                    <Link href={`/editais/importar/${item.id}`} className={`text-sm ${linkAcao}`}>
                      Ver
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </Bloco>
    </PageContainer>
  );
}
