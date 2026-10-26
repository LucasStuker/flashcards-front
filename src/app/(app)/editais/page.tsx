"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { PageContainer } from "@/components/PageContainer";
import { Bloco, EstadoVazio } from "@/components/dashboard/Bloco";
import { BotaoInscricao } from "@/components/editais/BotaoInscricao";
import { alertaErro, botaoPrimario, focusRing, linkAcao } from "@/components/ui";
import {
  EditalOficialResumo,
  EditalResumo,
  listEditais,
  listEditaisOficiais,
  uploadEditalCsv,
} from "@/lib/api";

const campo = `rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-accent ${focusRing}`;

export default function EditaisPage() {
  return (
    <PageContainer>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Editais</h1>
        <p className="text-sm text-muted">
          Escolha os concursos que você vai estudar. As disciplinas e tópicos do edital passam a
          guiar o seu estudo.
        </p>
      </div>
      <EditaisDisponiveis />
      <PlanilhaPropria />
    </PageContainer>
  );
}

function EditaisDisponiveis() {
  const [editais, setEditais] = useState<EditalOficialResumo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    void listEditaisOficiais()
      .then((data) => {
        if (!ativo) return;
        setEditais(data);
        setErro(null);
      })
      .catch((err: unknown) => {
        if (!ativo) return;
        setErro(err instanceof Error ? err.message : "Falha ao carregar editais");
      });
    return () => {
      ativo = false;
    };
  }, []);

  function marcar(id: number, inscrito: boolean) {
    setEditais((atual) =>
      atual ? atual.map((edital) => (edital.id === id ? { ...edital, inscrito } : edital)) : atual,
    );
  }

  const inscritos = editais?.filter((edital) => edital.inscrito).length ?? 0;

  return (
    <Bloco
      id="editais-disponiveis-heading"
      titulo="Editais disponíveis"
      acao={
        editais && editais.length > 0 ? (
          <span className="text-[13px] text-muted" aria-live="polite">
            {inscritos === 0
              ? "Nenhuma inscrição"
              : `${inscritos} ${inscritos === 1 ? "inscrição" : "inscrições"}`}
          </span>
        ) : null
      }
    >
      {erro ? (
        <p role="alert" className={`m-4 ${alertaErro}`}>
          {erro}
        </p>
      ) : null}

      {!editais && !erro ? (
        <p className="px-4 py-5 text-sm text-muted" aria-live="polite">
          Carregando…
        </p>
      ) : null}

      {editais && editais.length === 0 ? (
        <EstadoVazio
          icone="folder"
          titulo="Ainda não há edital disponível"
          texto="Os editais cadastrados pela equipe aparecem aqui para você se inscrever."
        />
      ) : null}

      {editais && editais.length > 0 ? (
        <ul>
          {editais.map((edital) => (
            <li
              key={edital.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-0"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <Link href={`/editais/oficiais/${edital.id}`} className={`w-fit ${linkAcao}`}>
                  {edital.cargo}
                  {edital.area ? <span className="font-normal"> · {edital.area}</span> : null}
                </Link>
                <p className="text-[13px] text-ink/80">
                  {edital.orgao} · {edital.banca} · {edital.ano}
                </p>
                <p className="text-[13px] text-muted">
                  {edital.disciplinas} {edital.disciplinas === 1 ? "disciplina" : "disciplinas"} ·{" "}
                  {edital.topicos} {edital.topicos === 1 ? "tópico" : "tópicos"}
                </p>
              </div>
              <BotaoInscricao
                editalId={edital.id}
                cargo={edital.cargo}
                inscrito={edital.inscrito}
                onChange={(inscrito) => marcar(edital.id, inscrito)}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </Bloco>
  );
}

function PlanilhaPropria() {
  const [editais, setEditais] = useState<EditalResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await listEditais();
      setEditais(data);
      setListError(null);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Falha ao carregar editais");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const banca = String(new FormData(form).get("banca") ?? "");
    const cargo = String(new FormData(form).get("cargo") ?? "");
    const arquivo = fileRef.current?.files?.[0];
    if (!arquivo) {
      setNotice(null);
      setFormError("Envie um CSV");
      return;
    }

    setSending(true);
    setFormError(null);
    setNotice(null);
    try {
      await uploadEditalCsv(arquivo, banca, cargo);
      form.reset();
      setFileName(null);
      setNotice("Edital publicado.");
      await refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Falha ao enviar CSV");
    } finally {
      setSending(false);
    }
  }

  return (
    <Bloco id="planilha-propria-heading" titulo="Planilha própria">
      <div className="flex flex-col gap-4 p-4">
        <p className="text-[13px] text-muted">
          Não achou o seu concurso? Envie um CSV com disciplinas e assuntos para montar um edital só
          seu.
        </p>

        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span>Banca</span>
            <input name="banca" required disabled={sending} className={campo} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Cargo</span>
            <input name="cargo" required disabled={sending} className={campo} />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span>Arquivo CSV</span>
            <span className="inline-flex w-fit cursor-pointer rounded-md border border-line bg-paper px-3 py-1.5 text-ink focus-within:outline-2 focus-within:outline-accent">
              {fileName ?? "Escolher arquivo"}
              <input
                ref={fileRef}
                name="arquivo"
                type="file"
                accept=".csv,text/csv"
                required
                disabled={sending}
                className="sr-only"
                onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
              />
            </span>
          </label>
          <button
            type="submit"
            disabled={sending}
            className={`w-fit disabled:opacity-60 ${botaoPrimario}`}
          >
            {sending ? "Enviando…" : "Enviar CSV"}
          </button>
        </form>

        {formError ? (
          <p role="alert" className={alertaErro}>
            {formError}
          </p>
        ) : null}

        {listError ? (
          <p role="alert" className={alertaErro}>
            {listError}
          </p>
        ) : null}

        {notice ? (
          <p role="status" className="text-sm text-ok">
            {notice}
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted" aria-live="polite">
            Carregando…
          </p>
        ) : null}

        {editais.length > 0 ? (
          <ul className="rounded-md border border-line text-sm">
            {editais.map((edital) => (
              <li
                key={edital.id}
                className="flex items-center justify-between gap-3 border-b border-line px-3 py-2 last:border-0"
              >
                <Link href={`/editais/${edital.id}`} className={linkAcao}>
                  {edital.cargo}
                </Link>
                <span className="text-[13px] text-muted">{edital.banca.nome}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Bloco>
  );
}
