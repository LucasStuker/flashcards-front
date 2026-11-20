export type ModoPomodoro = "livre" | "25-5" | "50-10";
export type FasePomodoro = "foco" | "pausa";

export type PresetPomodoro = {
  focoSegundos: number;
  pausaSegundos: number;
};

export const PRESETS_POMODORO: Record<Exclude<ModoPomodoro, "livre">, PresetPomodoro> = {
  "25-5": { focoSegundos: 25 * 60, pausaSegundos: 5 * 60 },
  "50-10": { focoSegundos: 50 * 60, pausaSegundos: 10 * 60 },
};

export const OPCOES_POMODORO: { valor: ModoPomodoro; titulo: string; texto: string }[] = [
  { valor: "livre", titulo: "Cronômetro livre", texto: "Conta o tempo sem meta de ciclo" },
  { valor: "25-5", titulo: "Pomodoro 25 + 5", texto: "25 min de foco e 5 min de pausa" },
  { valor: "50-10", titulo: "Pomodoro 50 + 10", texto: "50 min de foco e 10 min de pausa" },
];

export type EstadoPomodoro = {
  sessaoId: string;
  modo: Exclude<ModoPomodoro, "livre">;
  fase: FasePomodoro;
  /** Epoch ms em que a fase atual termina, se estiver rodando. */
  terminaEm: number | null;
  /** Segundos restantes quando a sessão está pausada. */
  restantePausado: number | null;
};

const CHAVE = "yorkstudy.pomodoro";

export function restanteSegundos(terminaEm: number, agora: number): number {
  return Math.max(0, Math.ceil((terminaEm - agora) / 1000));
}

export function duracaoFase(
  modo: Exclude<ModoPomodoro, "livre">,
  fase: FasePomodoro,
): number {
  const preset = PRESETS_POMODORO[modo];
  return fase === "foco" ? preset.focoSegundos : preset.pausaSegundos;
}

export function proximaFase(fase: FasePomodoro): FasePomodoro {
  return fase === "foco" ? "pausa" : "foco";
}

export function iniciarPomodoro(
  sessaoId: string,
  modo: Exclude<ModoPomodoro, "livre">,
  agora: number,
): EstadoPomodoro {
  return {
    sessaoId,
    modo,
    fase: "foco",
    terminaEm: agora + duracaoFase(modo, "foco") * 1000,
    restantePausado: null,
  };
}

export function pausarPomodoro(estado: EstadoPomodoro, agora: number): EstadoPomodoro {
  if (estado.terminaEm === null) return estado;
  return {
    ...estado,
    restantePausado: restanteSegundos(estado.terminaEm, agora),
    terminaEm: null,
  };
}

export function retomarPomodoro(estado: EstadoPomodoro, agora: number): EstadoPomodoro {
  const restante = estado.restantePausado ?? duracaoFase(estado.modo, estado.fase);
  return {
    ...estado,
    terminaEm: agora + restante * 1000,
    restantePausado: null,
  };
}

export function avancarPomodoro(estado: EstadoPomodoro, agora: number): EstadoPomodoro {
  const fase = proximaFase(estado.fase);
  return {
    ...estado,
    fase,
    terminaEm: agora + duracaoFase(estado.modo, fase) * 1000,
    restantePausado: null,
  };
}

export function salvarPomodoro(estado: EstadoPomodoro | null) {
  if (typeof sessionStorage === "undefined") return;
  if (!estado) sessionStorage.removeItem(CHAVE);
  else sessionStorage.setItem(CHAVE, JSON.stringify(estado));
}

export function lerPomodoro(sessaoId: string): EstadoPomodoro | null {
  if (typeof sessionStorage === "undefined") return null;
  const bruto = sessionStorage.getItem(CHAVE);
  if (!bruto) return null;
  try {
    const estado = JSON.parse(bruto) as EstadoPomodoro;
    return estado.sessaoId === sessaoId ? estado : null;
  } catch {
    return null;
  }
}
