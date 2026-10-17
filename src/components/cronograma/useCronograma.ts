"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BlocoEstudo,
  Materia,
  NovoBloco,
  atualizarBloco,
  criarBloco,
  listBlocos,
  listMaterias,
  removerBloco,
  restaurarExemplo,
} from "@/lib/cronograma-mock";

export type Arrasto =
  | { tipo: "materia"; materiaId: string }
  | { tipo: "bloco"; blocoId: string; duracao: number; deslocamentoMin: number };

/** Carrega matérias e blocos do intervalo e aplica as mudanças primeiro na tela. */
export function useCronograma(inicio: string, fim: string) {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [blocos, setBlocos] = useState<BlocoEstudo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    try {
      const [listaMaterias, listaBlocos] = await Promise.all([listMaterias(), listBlocos(inicio, fim)]);
      setMaterias(listaMaterias);
      setBlocos(listaBlocos);
      setErro(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao carregar o cronograma");
    } finally {
      setCarregando(false);
    }
  }, [inicio, fim]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const porId = useMemo(() => new Map(materias.map((m) => [m.id, m])), [materias]);

  const criar = useCallback(async (novo: NovoBloco) => {
    const temporario = { ...novo, id: `temp-${Date.now()}` };
    setBlocos((atual) => [...atual, temporario]);
    try {
      const salvo = await criarBloco(novo);
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
        await atualizarBloco(id, mudancas);
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
        await removerBloco(id);
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Falha ao remover o bloco");
        void recarregar();
      }
    },
    [recarregar],
  );

  const restaurar = useCallback(async () => {
    await restaurarExemplo();
    await recarregar();
  }, [recarregar]);

  return { materias, porId, blocos, carregando, erro, criar, atualizar, remover, restaurar };
}
