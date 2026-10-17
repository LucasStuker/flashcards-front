"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { PageContainer } from "@/components/PageContainer";
import { EditalResumo, listEditais, uploadEditalCsv } from "@/lib/api";

export default function EditaisPage() {
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
    <PageContainer>
      <h1
        className="text-xl text-ink"
        style={{ fontFamily: "var(--font-display), sans-serif" }}
      >
        Editais
      </h1>

      <form onSubmit={onSubmit} className="grid gap-3 border border-line bg-panel p-4">
        <h2 className="text-sm font-semibold text-ink">Enviar CSV</h2>
        <label className="flex flex-col gap-1 text-sm">
          <span>Banca</span>
          <input
            name="banca"
            required
            disabled={sending}
            className="border border-line bg-white px-3 py-2 outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Cargo</span>
          <input
            name="cargo"
            required
            disabled={sending}
            className="border border-line bg-white px-3 py-2 outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Arquivo CSV</span>
          <span className="inline-flex w-fit cursor-pointer border border-line bg-paper px-3 py-1.5 text-ink">
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
          className="w-fit bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60"
        >
          {sending ? "Enviando…" : "Enviar"}
        </button>
      </form>

      {formError ? (
        <p role="alert" className="border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">
          {formError}
        </p>
      ) : null}

      {listError ? (
        <p role="alert" className="border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">
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

      {!loading && !listError && editais.length === 0 ? (
        <p className="text-sm text-muted">Ainda não há edital.</p>
      ) : null}

      {editais.length > 0 ? (
        <table className="w-full border border-line bg-panel text-left text-sm">
          <thead className="border-b border-line text-xs text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Banca</th>
              <th className="px-3 py-2 font-medium">Cargo</th>
            </tr>
          </thead>
          <tbody>
            {editais.map((edital) => (
              <tr key={edital.id} className="border-b border-line/70 last:border-0">
                <td className="px-3 py-2 text-ink">{edital.banca.nome}</td>
                <td className="px-3 py-2">
                  <Link
                    href={`/editais/${edital.id}`}
                    className="font-medium text-accent hover:text-accent-deep"
                  >
                    {edital.cargo}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </PageContainer>
  );
}
