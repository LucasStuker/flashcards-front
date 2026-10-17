import { DesempenhoDisciplina } from "@/lib/api";
import { formatPct, series, valorDaSerie } from "./formato";

const LIMITE_ROTULO = 18;

function cortar(nome: string) {
  return nome.length > LIMITE_ROTULO ? `${nome.slice(0, LIMITE_ROTULO - 1)}…` : nome;
}

export function Legenda() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted">
      {series.map((serie) => (
        <li key={serie.id} className="flex items-center gap-1.5">
          <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${serie.bg}`} />
          {serie.rotulo}
          <span className="text-muted/70">
            {serie.id === "taxa" ? "(% de acerto)" : "(% do total)"}
          </span>
        </li>
      ))}
    </ul>
  );
}

const L = 560;
const A = 400;
const cx = L / 2;
const cy = A / 2;
const raio = 140;
const aneis = [0.25, 0.5, 0.75, 1];

export function GraficoRadar({ disciplinas }: { disciplinas: DesempenhoDisciplina[] }) {
  const n = disciplinas.length;
  const angulo = (i: number) => (2 * Math.PI * i) / n - Math.PI / 2;
  const ponto = (i: number, valor: number) => {
    const a = angulo(i);
    return [cx + Math.cos(a) * raio * valor, cy + Math.sin(a) * raio * valor] as const;
  };
  const poligono = (valores: number[]) =>
    valores.map((valor, i) => ponto(i, valor).join(",")).join(" ");

  return (
    <svg
      viewBox={`0 0 ${L} ${A}`}
      className="mx-auto h-auto w-full max-w-xl"
      role="img"
      aria-label="Radar por disciplina. Os números estão na tabela abaixo."
    >
      {aneis.map((anel) => (
        <polygon
          key={anel}
          points={poligono(disciplinas.map(() => anel))}
          className="fill-none stroke-line"
        />
      ))}
      {aneis.map((anel) => (
        <text key={`r${anel}`} x={cx + 4} y={cy - raio * anel} className="fill-muted/70 text-[12px]">
          {formatPct(anel)}
        </text>
      ))}
      {disciplinas.map((d, i) => {
        const [x, y] = ponto(i, 1);
        const [lx, ly] = ponto(i, 1.12);
        const cos = Math.cos(angulo(i));
        const ancora = cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";
        return (
          <g key={d.disciplina}>
            <line x1={cx} y1={cy} x2={x} y2={y} className="stroke-line" />
            <text
              x={lx}
              y={ly}
              textAnchor={ancora}
              dominantBaseline="middle"
              className={`text-[12px] ${d.poucosDados ? "fill-muted" : "fill-ink"}`}
            >
              <title>{d.disciplina}</title>
              {cortar(d.disciplina)}
            </text>
          </g>
        );
      })}
      {series.map((serie) => (
        <g key={serie.id}>
          <polygon
            points={poligono(disciplinas.map((d) => valorDaSerie(d, serie.id) ?? 0))}
            className={`${serie.fill} ${serie.stroke}`}
            fillOpacity={0.15}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {disciplinas.map((d, i) => {
            const valor = valorDaSerie(d, serie.id);
            if (valor === null) return null;
            const [x, y] = ponto(i, valor);
            return <circle key={d.disciplina} cx={x} cy={y} r={3} className={serie.fill} />;
          })}
        </g>
      ))}
    </svg>
  );
}

export function GraficoBarras({ disciplinas }: { disciplinas: DesempenhoDisciplina[] }) {
  return (
    <ul className="flex flex-col gap-4">
      {disciplinas.map((d) => (
        <li key={d.disciplina} className="grid gap-1.5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center sm:gap-4">
          <p className="truncate text-sm text-ink" title={d.disciplina}>
            {d.disciplina}
            {d.poucosDados ? <span className="ml-1.5 text-[12px] text-muted">poucos dados</span> : null}
          </p>
          <div className="flex flex-col gap-1">
            {series.map((serie) => {
              const valor = valorDaSerie(d, serie.id);
              return (
                <div key={serie.id} className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper">
                    <div
                      className={`h-full rounded-full ${serie.bg}`}
                      style={{ width: `${Math.round((valor ?? 0) * 100)}%` }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right text-[12px] tabular-nums text-muted">
                    <span className="sr-only">{serie.rotulo}: </span>
                    {formatPct(valor)}
                  </span>
                </div>
              );
            })}
          </div>
        </li>
      ))}
    </ul>
  );
}
