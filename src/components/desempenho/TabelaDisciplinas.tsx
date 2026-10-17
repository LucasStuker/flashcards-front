import { DesempenhoDisciplinas } from "@/lib/api";
import { formatDuracao, formatPct } from "./formato";

const th = "px-4 py-2 text-right text-[12px] font-medium text-muted";
const td = "px-4 py-2 text-right tabular-nums";

export function TabelaDisciplinas({ dados }: { dados: DesempenhoDisciplinas }) {
  const { disciplinas, totais } = dados;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] text-sm">
        <caption className="sr-only">Números por disciplina nos últimos {dados.periodo.dias} dias</caption>
        <thead className="border-y border-line bg-paper/60">
          <tr>
            <th scope="col" className={`${th} text-left`}>
              Disciplina
            </th>
            <th scope="col" className={th}>
              Tempo
            </th>
            <th scope="col" className={th}>
              Questões
            </th>
            <th scope="col" className={th}>
              Acertos
            </th>
            <th scope="col" className={th}>
              Erros e dúvidas
            </th>
            <th scope="col" className={th}>
              Acerto
            </th>
          </tr>
        </thead>
        <tbody>
          {disciplinas.map((d) => (
            <tr key={d.disciplina} className="border-b border-line last:border-0">
              <th scope="row" className="px-4 py-2 text-left font-normal text-ink">
                {d.disciplina}
                {d.poucosDados ? <span className="ml-1.5 text-[12px] text-muted">poucos dados</span> : null}
              </th>
              <td className={td}>{formatDuracao(d.segundos)}</td>
              <td className={td}>{d.questoes}</td>
              <td className={`${td} text-ok`}>{d.corretas}</td>
              <td className={`${td} text-bad`}>{d.naoAcertou}</td>
              <td className={`${td} font-medium text-ink`}>{formatPct(d.taxa)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-line bg-paper/60 font-medium">
          <tr>
            <th scope="row" className="px-4 py-2 text-left text-ink">
              Total
            </th>
            <td className={td}>{formatDuracao(totais.segundos)}</td>
            <td className={td}>{totais.questoes}</td>
            <td className={td}>{totais.corretas}</td>
            <td className={td}>{totais.questoes - totais.corretas}</td>
            <td className={td}>{formatPct(totais.taxa)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
