"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BlocoEstudo,
  MateriaCronograma,
  NovoBloco,
  atualizarBlocoCronograma,
  criarBlocoCronograma,
  gerarCronogramaSemana,
  listBlocosCronograma,
  listMateriasCronograma,
  removerBlocoCronograma,
} from "@/lib/api";

export type Arrasto =
  | { tipo: "materia"; materiaId: string }
  | { tipo: "bloco"; blocoId: string; duracao: number; deslocamentoMin: number };

/** Carrega matérias e blocos do intervalo via API (step 27). */
export function useCronograma(inicio: string, fim: string, editalId?: number | null) {
  const [materias, setMaterias] = useState<MateriaCronograma[]>([]);
  const [blocos, setBlocos] = useState<BlocoEstudo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);

  const recarregar = useCallback(async () => {
    try {
      const [listaMaterias, listaBlocos] = await Promise.all([
        listMateriasCronograma(editalId ?? undefined),
        listBlocosCronograma(inicio, fim),
      ]);
      setMaterias(listaMaterias);
      setBlocos(listaBlocos);
      setErro(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao carregar o cronograma");
    } finally {
      setCarregando(false);
    }
  }, [inicio, fim, editalId]);

  useEffect(() => {
    setCarregando(true);
    void recarregar();
  }, [recarregar]);

  const porId = useMemo(() => new Map(materias.map((m) => [m.id, m])), [materias]);

  const criar = useCallback(async (novo: NovoBloco) => {
    const temporario = { ...novo, id: `temp-${Date.now()}` };
    setBlocos((atual) => [...atual, temporario]);
    try {
      const salvo = await criarBlocoCronograma(novo);
      setBlocos((atual) => atual.map((b) => (b.id === temporario.id ? salvo : b)));
      return salvo;
    } catch (err) {
      setBlocos((atual) => atual.filter((b) => b.id !== temporario.id));
      setErro(err instanceof Error ? err.message : "Falha ao criar o bloco");
      return null;
    }
  }, []);

  const atualizar = useCallback(
    async (id: string, mudancas: Partial<NovoBloco>) => {
      setBlocos((atual) => atual.map((b) => (b.id === id ? { ...b, ...mudancas } : b)));
      try {
        await atualizarBlocoCronograma(id, mudancas);
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Falha ao salvar o bloco");
        void recarregar();
      }
    },
    [recarregar],
  );

  const remover = useCallback(
    async (id: string) => {
      setBlocos((atual) => atual.filter((b) => b.id !== id));
      try {
        await removerBlocoCronograma(id);
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Falha ao remover o bloco");
        void recarregar();
      }
    },
    [recarregar],
  );

  const gerar = useCallback(
    async (segunda: string) => {
      setGerando(true);
      setErro(null);
      try {
        const res = await gerarCronogramaSemana(segunda, editalId ?? undefined);
        setMaterias(res.materias);
        await recarregar();
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Falha ao gerar a semana");
      } finally {
        setGerando(false);
      }
    },
    [editalId, recarregar],
  );

  return {
    materias,
    porId,
    blocos,
    carregando,
    gerando,
    erro,
    criar,
    atualizar,
    remover,
    gerar,
    recarregar,
  };
}
