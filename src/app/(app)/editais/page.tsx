"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageContainer } from "@/components/PageContainer";
import { Bloco, EstadoVazio } from "@/components/dashboard/Bloco";
import { BotaoInscricao } from "@/components/editais/BotaoInscricao";
import { alertaErro, linkAcao } from "@/components/ui";
import { EditalOficialResumo, listEditaisOficiais } from "@/lib/api";

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
