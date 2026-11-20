/**
 * Alarme do Pomodoro: Web Audio (relógio de áudio, funciona com aba em 2º plano
 * no desktop) + Notification API (aviso do SO, se o usuário autorizar no clique).
 */

let contexto: AudioContext | null = null;
let agendado: OscillatorNode[] = [];

/** Contexto compartilhado com ruído ambiente e alarme (um só resume no clique). */
export function obterContextoAudio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!contexto) contexto = new AC();
  return contexto;
}

function obterContexto(): AudioContext | null {
  return obterContextoAudio();
}

/** Chamar no clique de Iniciar (gesto do usuário): destrava áudio e pede notificação. */
export async function prepararAlarme(): Promise<void> {
  const ctx = obterContexto();
  if (ctx?.state === "suspended") await ctx.resume();
  if (typeof Notification !== "undefined" && Notification.permission === "default") {
    try {
      await Notification.requestPermission();
    } catch {
      // permissão negada ou indisponível
    }
  }
}

function cancelarAgendados() {
  for (const fonte of agendado) {
    try {
      fonte.stop();
    } catch {
      // já parou
    }
  }
  agendado = [];
}

/** Agenda bipes no relógio de áudio daqui a `segundos` (melhor que setTimeout em aba oculta). */
export function agendarAlarme(segundos: number): () => void {
  cancelarAgendados();
  const ctx = obterContexto();
  if (!ctx || segundos <= 0) return () => undefined;

  const inicio = ctx.currentTime + segundos;
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const ganho = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = i === 1 ? 880 : 660;
    ganho.gain.value = 0.0001;
    const t = inicio + i * 0.35;
    ganho.gain.setValueAtTime(0.0001, t);
    ganho.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
    ganho.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    osc.connect(ganho);
    ganho.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
    agendado.push(osc);
  }

  return cancelarAgendados;
}

export function tocarAlarmeAgora() {
  const ctx = obterContexto();
  if (!ctx) return;
  void ctx.resume().then(() => {
    cancelarAgendados();
    const inicio = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const ganho = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = i === 1 ? 880 : 660;
      const t = inicio + i * 0.35;
      ganho.gain.setValueAtTime(0.0001, t);
      ganho.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      ganho.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      osc.connect(ganho);
      ganho.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    }
  });
}

export function notificarEstudo(titulo: string, corpo: string) {
  tocarAlarmeAgora();
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    new Notification(titulo, { body: corpo, silent: true });
  } catch {
    // mobile / contexto sem construtor
  }
}
