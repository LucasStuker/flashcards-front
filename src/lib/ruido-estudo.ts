/**
 * Ruído ambiente sintético (Web Audio) — focado em foco: graves, pouco agudo,
 * loop suave. Sem samples externos.
 */

import { obterContextoAudio } from "@/lib/alarme-estudo";

export type TipoRuido = "off" | "rosa" | "marrom" | "ventilador" | "chuva";

export const OPCOES_RUIDO: ReadonlyArray<{
  valor: TipoRuido;
  titulo: string;
  texto: string;
}> = [
  { valor: "off", titulo: "Sem ruído", texto: "Só o bipe do Pomodoro, se houver." },
  { valor: "rosa", titulo: "Rosa", texto: "Fundo macio, sem chiado alto." },
  { valor: "marrom", titulo: "Marrom", texto: "Grave e constante, tipo longe." },
  { valor: "ventilador", titulo: "Ventilador", texto: "Zumbido baixo, quase sem estática." },
  { valor: "chuva", titulo: "Chuva", texto: "Chuva distante, gotas suaves." },
];

const DURACAO_BUFFER = 10;
const VOLUME_PADRAO = 0.45;

let master: GainNode | null = null;
let fontes: AudioNode[] = [];
let tipoAtual: TipoRuido = "off";
let volumeAtual = VOLUME_PADRAO;

function branco(): number {
  return Math.random() * 2 - 1;
}

/** Rosa (Paul Kellet), depois normaliza suave. */
function preencherRosa(amostras: Float32Array) {
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  let pico = 0.0001;
  for (let i = 0; i < amostras.length; i++) {
    const w = branco();
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.016898;
    const p = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
    amostras[i] = p;
    const a = Math.abs(p);
    if (a > pico) pico = a;
  }
  const escala = 0.55 / pico;
  for (let i = 0; i < amostras.length; i++) amostras[i] *= escala;
}

/** Marrom bem grave (passo pequeno + leak). */
function preencherMarrom(amostras: Float32Array) {
  let last = 0;
  let pico = 0.0001;
  for (let i = 0; i < amostras.length; i++) {
    last += branco() * 0.008;
    last *= 0.9985;
    amostras[i] = last;
    const a = Math.abs(last);
    if (a > pico) pico = a;
  }
  const escala = 0.7 / pico;
  for (let i = 0; i < amostras.length; i++) amostras[i] *= escala;
}

/**
 * Base de chuva: rosa já filtrada na cadeia + “gotas” muito suaves
 * (envelopes longos, sem clicks).
 */
function preencherChuva(amostras: Float32Array) {
  preencherRosa(amostras);
  for (let i = 0; i < amostras.length; i++) {
    amostras[i] *= 0.35;
    if (Math.random() > 0.0012) continue;
    const pico = 0.08 + Math.random() * 0.12;
    const largura = 180 + Math.floor(Math.random() * 320);
    for (let j = 0; j < largura && i + j < amostras.length; j++) {
      const t = j / largura;
      const env = Math.sin(Math.PI * t);
      amostras[i + j] += branco() * pico * env * env;
    }
  }
  let pico = 0.0001;
  for (let i = 0; i < amostras.length; i++) {
    const a = Math.abs(amostras[i]);
    if (a > pico) pico = a;
  }
  const escala = 0.5 / pico;
  for (let i = 0; i < amostras.length; i++) amostras[i] *= escala;
}

/** Crossfade nas bordas para o loop não estalar. */
function costurarLoop(amostras: Float32Array, fade: number) {
  const n = Math.min(fade, Math.floor(amostras.length / 4));
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const inicio = amostras[i];
    const fim = amostras[amostras.length - n + i];
    amostras[i] = inicio * t + fim * (1 - t);
  }
}

function bufferRuido(
  ctx: AudioContext,
  preencher: (data: Float32Array) => void,
): AudioBuffer {
  const n = Math.floor(ctx.sampleRate * DURACAO_BUFFER);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const data = buf.getChannelData(0);
  preencher(data);
  costurarLoop(data, Math.floor(ctx.sampleRate * 0.35));
  return buf;
}

function limparFontes() {
  for (const no of fontes) {
    try {
      if ("stop" in no && typeof (no as AudioScheduledSourceNode).stop === "function") {
        (no as AudioScheduledSourceNode).stop();
      }
    } catch {
      // já parou
    }
    try {
      no.disconnect();
    } catch {
      // ok
    }
  }
  fontes = [];
}

function garantirMaster(ctx: AudioContext): GainNode {
  if (!master) {
    master = ctx.createGain();
    master.gain.value = volumeAtual;
    master.connect(ctx.destination);
  }
  return master;
}

/** Dois lowpass + shelf: corta chiado. Retorna o nó de entrada da cadeia. */
function cadeiaMacias(
  ctx: AudioContext,
  destino: AudioNode,
  corteHz: number,
  shelfDb = -10,
): AudioNode {
  const lp1 = ctx.createBiquadFilter();
  lp1.type = "lowpass";
  lp1.frequency.value = corteHz;
  lp1.Q.value = 0.5;

  const lp2 = ctx.createBiquadFilter();
  lp2.type = "lowpass";
  lp2.frequency.value = corteHz * 0.85;
  lp2.Q.value = 0.5;

  const shelf = ctx.createBiquadFilter();
  shelf.type = "highshelf";
  shelf.frequency.value = Math.min(1800, corteHz * 1.2);
  shelf.gain.value = shelfDb;

  lp1.connect(lp2);
  lp2.connect(shelf);
  shelf.connect(destino);
  fontes.push(lp1, lp2, shelf);
  return lp1;
}

function ligarBuffer(
  ctx: AudioContext,
  buffer: AudioBuffer,
  destino: AudioNode,
  ganho: number,
) {
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const g = ctx.createGain();
  g.gain.value = ganho;
  src.connect(g);
  g.connect(destino);
  src.start();
  fontes.push(src, g);
}

function tomSuave(
  ctx: AudioContext,
  destino: AudioNode,
  freq: number,
  ganho: number,
  tipo: OscillatorType = "sine",
) {
  const osc = ctx.createOscillator();
  osc.type = tipo;
  osc.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.value = ganho;
  osc.connect(g);
  g.connect(destino);
  osc.start();
  fontes.push(osc, g);
}

/**
 * Inicia ou troca o ruído. `off` para. Chamar após gesto do usuário (mesmo do Iniciar).
 */
export async function definirRuido(tipo: TipoRuido, volume = volumeAtual): Promise<void> {
  volumeAtual = Math.max(0, Math.min(1, volume));
  const ctx = obterContextoAudio();
  if (!ctx) {
    tipoAtual = "off";
    return;
  }
  if (ctx.state === "suspended") await ctx.resume();

  limparFontes();
  tipoAtual = tipo;
  if (tipo === "off") {
    if (master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
    return;
  }

  const out = garantirMaster(ctx);
  out.gain.setTargetAtTime(volumeAtual, ctx.currentTime, 0.08);

  if (tipo === "rosa") {
    const entrada = cadeiaMacias(ctx, out, 900, -14);
    ligarBuffer(ctx, bufferRuido(ctx, preencherRosa), entrada, 0.55);
    return;
  }

  if (tipo === "marrom") {
    const entrada = cadeiaMacias(ctx, out, 320, -12);
    ligarBuffer(ctx, bufferRuido(ctx, preencherMarrom), entrada, 0.7);
    return;
  }

  if (tipo === "ventilador") {
    // Quase só drone: ruído bem abafado + harmônicos baixos.
    const misture = ctx.createGain();
    misture.gain.value = 1;
    misture.connect(out);
    fontes.push(misture);

    const entrada = cadeiaMacias(ctx, misture, 200, -18);
    ligarBuffer(ctx, bufferRuido(ctx, preencherMarrom), entrada, 0.18);
    tomSuave(ctx, misture, 58, 0.032);
    tomSuave(ctx, misture, 116, 0.016);
    tomSuave(ctx, misture, 174, 0.007);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.06;
    lfo.connect(lfoGain);
    lfoGain.connect(misture.gain);
    misture.gain.value = 0.92;
    lfo.start();
    fontes.push(lfo, lfoGain);
    return;
  }

  // chuva distante: pouco agudo, gotas macias
  const entrada = cadeiaMacias(ctx, out, 1400, -8);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 700;
  bp.Q.value = 0.55;
  bp.connect(entrada);
  fontes.push(bp);
  ligarBuffer(ctx, bufferRuido(ctx, preencherChuva), bp, 0.6);
}

export function definirVolumeRuido(volume: number) {
  volumeAtual = Math.max(0, Math.min(1, volume));
  const ctx = obterContextoAudio();
  if (master && ctx) {
    master.gain.setTargetAtTime(
      tipoAtual === "off" ? 0 : volumeAtual,
      ctx.currentTime,
      0.08,
    );
  }
}

export function pararRuido() {
  void definirRuido("off");
}

export function ruidoAtual(): TipoRuido {
  return tipoAtual;
}

export function volumeRuidoAtual(): number {
  return volumeAtual;
}
