/**
 * BASTET — o fluxo de trabalho, de ponta a ponta.
 *
 * O sistema tem uma ordem natural, e quem chega pela primeira vez precisa de a
 * ver: sem terreno não há onde planear; sem tarefa (ordem de trabalho) a V23
 * recusa a execução; sem presenças não há jornas para pagar; sem relatório e
 * pesagem não há indicador. Esta faixa mostra os passos, o que já tem registos
 * e qual é o próximo — e cada formulário, ao gravar, oferece o passo seguinte.
 */

import {
  ArrowRight,
  CalendarCheck,
  Check,
  ClipboardList,
  FileText,
  Map,
  PieChart,
  Scale,
  type LucideIcon,
} from 'lucide-react';
import React from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import type { T } from '@bastet/nucleo/i18n';
import {
  useJornas,
  useOrdens,
  usePesagens,
  useRelatorios,
  useTalhoes,
} from '../dados/consultas';
import { useT } from '../i18n/contexto';

export interface Passo {
  chave: string;
  /** Rota da página onde o passo vive. */
  para: string;
  /** O formulário que o passo grava; liga o ecrã de sucesso ao passo seguinte. */
  formulario: string;
  icone: LucideIcon;
  rotulo: T;
  /** O verbo do botão que cria o registo. */
  accao: T;
  /** O que diz o passo a quem nunca o fez. */
  explicacao: T;
}

export const PASSOS: Passo[] = [
  {
    chave: 'terreno',
    para: '/talhoes',
    formulario: 'F-01',
    icone: Map,
    rotulo: { pt: 'Terreno', en: 'Land', zh: '地块' },
    accao: { pt: 'Criar terreno', en: 'Create land plot', zh: '新建地块' },
    explicacao: {
      pt: 'Registe o terreno (talhão): onde fica, a área e o que está plantado.',
      en: 'Record the land plot: where it is, its area and what is planted.',
      zh: '登记地块：位置、面积和种植内容。',
    },
  },
  {
    chave: 'tarefa',
    para: '/ordens',
    formulario: 'E-10',
    icone: ClipboardList,
    rotulo: { pt: 'Tarefa', en: 'Task', zh: '任务' },
    accao: { pt: 'Criar tarefa', en: 'Create task', zh: '新建任务' },
    explicacao: {
      pt: 'Planeie o trabalho nesse terreno: que operação, que equipa, quantas jornas e qual a meta.',
      en: 'Plan the work on that plot: which operation, which team, how many worker-days and what target.',
      zh: '为该地块计划作业：作业类型、班组、工日与目标。',
    },
  },
  {
    chave: 'presencas',
    para: '/jornas',
    formulario: 'F-06',
    icone: CalendarCheck,
    rotulo: { pt: 'Presenças', en: 'Attendance', zh: '出勤' },
    accao: { pt: 'Marcar presenças', en: 'Take attendance', zh: '登记出勤' },
    explicacao: {
      pt: 'No dia, marque quem veio trabalhar. É daqui que saem as jornas a pagar.',
      en: 'On the day, mark who came to work. Payable worker-days come from here.',
      zh: '当天登记到岗人员，应付工日由此产生。',
    },
  },
  {
    chave: 'execucao',
    para: '/relatorios',
    formulario: 'F-05',
    icone: FileText,
    rotulo: { pt: 'Execução', en: 'Execution', zh: '执行' },
    accao: { pt: 'Registar execução', en: 'Record execution', zh: '登记执行' },
    explicacao: {
      pt: 'No fim do turno, diga o que foi feito contra o que a tarefa previa.',
      en: 'At the end of the shift, record what was done against what the task planned.',
      zh: '收工时，对照任务计划登记完成情况。',
    },
  },
  {
    chave: 'colheita',
    para: '/pesagens',
    formulario: 'F-07',
    icone: Scale,
    rotulo: { pt: 'Colheita', en: 'Harvest', zh: '采收' },
    accao: { pt: 'Registar pesagem', en: 'Record weighing', zh: '登记称重' },
    explicacao: {
      pt: 'Se houve colheita, pese-a e registe por terreno.',
      en: 'If there was a harvest, weigh it and record it per plot.',
      zh: '如有采收，按地块称重登记。',
    },
  },
  {
    chave: 'resultados',
    para: '/indicadores',
    formulario: '§10',
    icone: PieChart,
    rotulo: { pt: 'Resultados', en: 'Results', zh: '结果' },
    accao: { pt: 'Ver resultados', en: 'See results', zh: '查看结果' },
    explicacao: {
      pt: 'Os indicadores calculam-se sozinhos a partir do que foi registado.',
      en: 'Indicators are calculated on their own from what was recorded.',
      zh: '指标根据已登记数据自动计算。',
    },
  },
];

/** Quantos registos há em cada passo. Os resultados nunca contam: derivam. */
function useContagens(): Record<string, number | undefined> {
  const talhoes = useTalhoes();
  const ordens = useOrdens();
  const jornas = useJornas();
  const relatorios = useRelatorios();
  const pesagens = usePesagens();
  return {
    terreno: talhoes.length,
    tarefa: ordens.length,
    presencas: jornas.length,
    execucao: relatorios.length,
    colheita: pesagens.length,
    resultados: undefined,
  };
}

export function passoDaRota(caminho: string): number {
  const raiz = `/${caminho.split('/').filter(Boolean)[0] ?? ''}`;
  return PASSOS.findIndex((p) => p.para === raiz);
}

/**
 * Abre o formulário de uma página quando se chega com `?novo=1` — é assim que o
 * menu «Criar» e o «próximo passo» levam a pessoa directamente ao registo.
 */
export function useAbrirNovo(abrir: () => void) {
  const [params, setParams] = useSearchParams();
  const novo = params.get('novo');
  React.useEffect(() => {
    if (!novo) return;
    abrir();
    const resto = new URLSearchParams(params);
    resto.delete('novo');
    setParams(resto, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novo]);
}

// ============================================================================
// Faixa de passos
// ============================================================================

export function FaixaFluxo() {
  const tr = useT();
  const local = useLocation();
  const contagens = useContagens();
  const actual = passoDaRota(local.pathname);
  const naInicio = local.pathname === '/';

  if (actual < 0 && !naInicio) return null;

  // O próximo passo é o primeiro sem registos (os resultados não contam).
  const proximo = PASSOS.findIndex((p) => contagens[p.chave] === 0);
  // Um passo cujo anterior está vazio ainda não se pode fazer bem.
  const anterior = actual > 0 ? PASSOS[actual - 1] : undefined;
  const faltaAnterior =
    anterior && contagens[anterior.chave] === 0 && PASSOS[actual].chave !== 'resultados';

  return (
    <section className="cartao flex flex-col gap-3 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rotulo">
          {tr({ pt: 'Fluxo de trabalho', en: 'Workflow', zh: '工作流程' })}
        </span>
        {proximo >= 0 && actual !== proximo && (
          <Link
            to={`${PASSOS[proximo].para}?novo=1`}
            className="flex items-center gap-1.5 rounded-full bg-texto px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90"
          >
            {tr({ pt: 'Próximo passo', en: 'Next step', zh: '下一步' })}:{' '}
            {tr(PASSOS[proximo].accao)}
            <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>

      <ol className="-mx-1 flex items-stretch gap-1 overflow-x-auto px-1 pb-1">
        {PASSOS.map((p, i) => {
          const n = contagens[p.chave];
          const feito = n !== undefined && n > 0;
          const eActual = i === actual;
          const eProximo = i === proximo;
          return (
            <li key={p.chave} className="flex min-w-[118px] flex-1 items-center gap-1">
              <Link
                to={p.para}
                title={tr(p.explicacao)}
                className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2.5 py-2 transition-colors ${
                  eActual
                    ? 'bg-texto text-white'
                    : eProximo
                      ? 'bg-verde-pastel text-texto ring-1 ring-verde/40'
                      : 'bg-bloco text-texto-2 hover:bg-bloco-2 hover:text-texto'
                }`}
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                    feito
                      ? 'bg-verde text-white'
                      : eActual
                        ? 'bg-white/20 text-white'
                        : 'bg-cartao text-texto-2'
                  }`}
                >
                  {feito ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-[12.5px] font-semibold">{tr(p.rotulo)}</span>
                  <span
                    className={`block truncate text-[10.5px] ${eActual ? 'text-white/70' : 'text-texto-3'}`}
                  >
                    {n === undefined
                      ? tr({ pt: 'automático', en: 'automatic', zh: '自动' })
                      : n === 0
                        ? eProximo
                          ? tr({ pt: 'a seguir', en: 'up next', zh: '下一步' })
                          : tr({ pt: 'por fazer', en: 'to do', zh: '待办' })
                        : n === 1
                          ? tr({ pt: '1 registo', en: '1 record', zh: '1 条记录' })
                          : tr({ pt: `${n} registos`, en: `${n} records`, zh: `${n} 条记录` })}
                  </span>
                </span>
              </Link>
              {i < PASSOS.length - 1 && (
                <ArrowRight className="size-3.5 shrink-0 text-texto-3" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>

      {actual >= 0 && (
        <p className="text-[12px] text-texto-2">
          <span className="font-semibold text-texto">
            {tr({ pt: `Passo ${actual + 1}`, en: `Step ${actual + 1}`, zh: `第 ${actual + 1} 步` })}
            {' · '}
            {tr(PASSOS[actual].rotulo)}.
          </span>{' '}
          {tr(PASSOS[actual].explicacao)}
        </p>
      )}

      {faltaAnterior && anterior && (
        <p className="flex flex-wrap items-center gap-2 rounded-xl bg-ambar-pastel px-3 py-2 text-[12px] text-ambar">
          {tr({
            pt: `Ainda não há registos no passo anterior (${tr(anterior.rotulo)}). Comece por aí.`,
            en: `There are no records in the previous step yet (${tr(anterior.rotulo)}). Start there.`,
            zh: `上一步（${tr(anterior.rotulo)}）尚无记录，请先完成。`,
          })}
          <Link
            to={`${anterior.para}?novo=1`}
            className="font-semibold text-texto underline underline-offset-2"
          >
            {tr(anterior.accao)}
          </Link>
        </p>
      )}
    </section>
  );
}

// ============================================================================
// Depois de gravar: o passo seguinte
// ============================================================================

export function ProximoPasso({ formulario, codigo }: { formulario: string; codigo: string }) {
  const tr = useT();
  const navegar = useNavigate();
  const i = PASSOS.findIndex((p) => p.formulario === formulario);
  if (i < 0 || i >= PASSOS.length - 1) return null;
  const seguinte = PASSOS[i + 1];
  // Uma tarefa criada a partir de um terreno já leva o terreno escolhido.
  const extra = formulario === 'F-01' ? `&talhao=${encodeURIComponent(codigo)}` : '';
  const destino =
    seguinte.chave === 'resultados' ? seguinte.para : `${seguinte.para}?novo=1${extra}`;

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl bg-verde-pastel px-4 py-3">
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-verde">
          {tr({ pt: 'Próximo passo', en: 'Next step', zh: '下一步' })} · {i + 2}/{PASSOS.length}
        </div>
        <div className="text-[13px] text-texto">{tr(seguinte.explicacao)}</div>
      </div>
      <button
        onClick={() => navegar(destino)}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-texto px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90"
      >
        <seguinte.icone className="size-3.5" />
        {tr(seguinte.accao)}
        <ArrowRight className="size-3.5" />
      </button>
    </div>
  );
}
