/**
 * F-06 — Folha de presença e produção individual.
 *
 * «Este é o registo mais frequente do sistema. É a base do custo de
 * mão-de-obra, da produtividade e do cumprimento legal do registo de horas.»
 *
 * A folha é um acto único do chefe de turma sobre a equipa inteira, não dez
 * actos independentes — e é preenchida no fim de um turno, debaixo dos três
 * minutos do §25. Daí o desenho: **tudo por omissão presente, com as horas
 * normais da equipa, e só se toca no que foge à norma**. Marcar dez presenças
 * uma a uma seria garantir que a folha não é feita.
 */

import { Check, Users, X } from 'lucide-react';
import React from 'react';

import {
  useEquipas,
  useJornas,
  useOrdens,
  useTalhoes,
  useTrabalhadores,
} from '../../dados/consultas';
import { gravarJornas } from '../../dados/escrever';
import { HOJE } from '../../dados/semente';
import { q, type Unidade } from '@bastet/nucleo/canonico';
import { codigo } from '@bastet/nucleo/codigos';
import { TIPO_OPERACAO_POR_CODIGO } from '@bastet/nucleo/operacoes';
import {
  PRESENCAS,
  ROTULO_PRESENCA,
  idade,
  type Jorna,
  type Presenca,
} from '@bastet/nucleo/pessoas';
import { useFmt, useT } from '../../i18n/contexto';
import { COL } from '../../i18n/comuns';
import { juntar, resumirRepetidas, validarJorna } from '@bastet/nucleo/validacao';
import { Campo, Derivado, Formulario, Grelha, Seleccao } from '../../design/Formulario';
import { Codigo, Semaforo } from '../../design/primitivas';

/** Presenças que o chefe de turma marca a partir da lista, sem escrever. */
const AUSENCIAS: Presenca[] = PRESENCAS.filter((p) => p !== 'presente');

export function FormularioF06({ aoFechar }: { aoFechar: () => void }) {
  const tr = useT();
  const fmt = useFmt();
  const equipas = useEquipas();
  const trabalhadores = useTrabalhadores();
  const talhoes = useTalhoes();
  const ordens = useOrdens();
  const jornas = useJornas();

  const [equipaCod, setEquipaCod] = React.useState('');
  const [talhaoCod, setTalhaoCod] = React.useState('');
  // A folha do turno pode ser lançada na manhã seguinte; nunca no futuro (V25).
  const [data, setData] = React.useState(HOJE);
  const [tarefa, setTarefa] = React.useState('OPT-11');
  const [horaEntrada, setHoraEntrada] = React.useState('06:30');
  const [horaSaida, setHoraSaida] = React.useState('14:00');
  /** Intervalo de descanso do turno. Mínimo legal: 30 min (§19.2). */
  const intervalo = 30;
  /** Só quem foge à norma. Ausente do mapa = presente. */
  const [ausencias, setAusencias] = React.useState<Record<string, Presenca>>({});
  const [producao, setProducao] = React.useState<Record<string, number | ''>>({});
  const [gravado, setGravado] = React.useState<string | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);

  const equipa = equipas.find((e) => e.codigo === equipaCod) ?? equipas[0];
  const membros = React.useMemo(
    () => trabalhadores.filter((t) => t.equipa === equipa?.codigo),
    [trabalhadores, equipa],
  );

  // Valores por omissão: o talhão e a tarefa vêm da ordem de trabalho mais
  // recente do bloco da equipa.
  const doBloco = React.useMemo(
    () =>
      [...ordens]
        .filter((o) => o.talhao.startsWith(equipa?.bloco_habitual ?? '§'))
        .sort((a, b) => (a.data_prevista < b.data_prevista ? 1 : -1)),
    [ordens, equipa],
  );
  const talhaoActivo = talhaoCod || doBloco[0]?.talhao || talhoes[0]?.codigo || '';
  const unidade: Unidade = (doBloco[0]?.quantidade_prevista.unidade ?? 'ha') as Unidade;

  // Horas normais da equipa: entrada a saída, menos o intervalo.
  const horas = React.useMemo(() => {
    const [he, me] = horaEntrada.split(':').map(Number);
    const [hs, ms] = horaSaida.split(':').map(Number);
    const minutos = hs * 60 + ms - (he * 60 + me) - intervalo;
    return Math.max(0, Number((minutos / 60).toFixed(2)));
  }, [horaEntrada, horaSaida, intervalo]);


  const presentes = membros.filter((t) => !ausencias[t.codigo]);

  // Custo-dia de quem tem remuneração registada. Quem não tem conta zero —
  // e o total sai mais baixo do que é, o que o ecrã declara em vez de esconder.
  const custoDiaDe = (t: (typeof membros)[number]) =>
    t.base_calculo === 'mensal' && t.remuneracao_base
      ? Number((t.remuneracao_base.valor / 26).toFixed(2))
      : 0;
  const semRemuneracao = presentes.filter((t) => !t.remuneracao_base).length;
  const custoTotal = presentes.reduce((s, t) => s + custoDiaDe(t), 0);

  // --- Rascunhos: uma jorna por membro da equipa -------------------------
  const rascunhos = React.useMemo(
    () =>
      membros.map((t) => {
        const presenca: Presenca = ausencias[t.codigo] ?? 'presente';
        const presente = presenca === 'presente';
        const cod = codigo.jorna(data, t.codigo);
        const prod = producao[t.codigo];
        const custoDia = custoDiaDe(t);
        return {
          id: cod,
          codigo: cod,
          designacao: `${t.nome_completo} — ${data}`,
          tipo: 'jorna' as const,
          estado: 'concluido' as const,
          dono: equipa?.chefe_turma ?? '',
          criado_em: data,
          criado_por: equipa?.chefe_turma ?? '',
          alterado_em: data,
          alterado_por: equipa?.chefe_turma ?? '',
          versao: 1,
          relacoes: [],
          historico: [],
          anexos: [],
          trabalhador: t.codigo,
          data,
          hora_entrada: horaEntrada,
          hora_saida: horaSaida,
          intervalo_minutos: intervalo,
          horas_normais: q(presente ? horas : 0, 'h'),
          tipo_dia: 'normal' as const,
          presenca,
          talhao: talhaoActivo,
          tarefa,
          producao_individual:
            presente && prod !== '' && prod !== undefined ? q(Number(prod), unidade) : undefined,
          equipa: equipa?.codigo ?? '',
          chefe: equipa?.chefe_turma ?? '',
          validado_por: equipa?.chefe_turma ?? '',
          custo_calculado: q(presente ? custoDia : 0, 'MT'),
          fonte_dados: 'registo_duas_assinaturas' as const,
        };
      }),
    [
      membros,
      ausencias,
      producao,
      equipa,
      data,
      horaEntrada,
      horaSaida,
      intervalo,
      horas,
      talhaoActivo,
      tarefa,
      unidade,
    ],
  );

  // A validação corre jorna a jorna e junta-se: uma folha só fecha se todas
  // as linhas fecharem.
  const validacao = React.useMemo(() => {
    const resultados = rascunhos.map((r) => {
      const t = membros.find((m) => m.codigo === r.trabalhador)!;
      const duplicados = jornas.filter(
        (j) => j.trabalhador === r.trabalhador && j.data === r.data,
      ).length;
      return validarJorna(r as Jorna, {
        hoje: HOJE,
        duplicados,
        horasExtraSemana: 0,
        horasExtraTrimestre: 0,
        horasExtraAno: 0,
        idadeTrabalhador: idade(t, data),
      });
    });
    return resumirRepetidas(juntar(...resultados));
  }, [rascunhos, membros, jornas, data]);

  const gravar = async () => {
    try {
      setErro(null);
      const limpos = rascunhos.map(
        ({
          id: _i,
          criado_em: _c,
          criado_por: _cp,
          alterado_em: _a,
          alterado_por: _ap,
          versao: _v,
          historico: _h,
          ...resto
        }) => resto,
      );
      const guardadas = await gravarJornas(limpos);
      setGravado(
        tr({
          pt: `${guardadas.length} jornas`,
          en: `${guardadas.length} worker-days`,
          zh: `${guardadas.length} 个工日`,
        }),
      );
    } catch (e) {
      setErro(
        e instanceof Error
          ? `${tr({ pt: 'A folha não foi gravada, e nenhuma jorna entrou', en: 'The sheet was not saved, and no worker-day was recorded', zh: '考勤表未保存，无任何工日录入' })}: ${e.message}`
          : tr({
              pt: 'A folha não foi gravada por um erro inesperado.',
              en: 'The sheet was not saved due to an unexpected error.',
              zh: '因意外错误，考勤表未保存。',
            }),
      );
    }
  };

  return (
    <Formulario
      titulo={tr({
        pt: 'Folha de presença e produção',
        en: 'Attendance and output sheet',
        zh: '考勤与产量表',
      })}
      formulario="F-06"
      codigo={`${tr({ pt: `${membros.length} jornas`, en: `${membros.length} worker-days`, zh: `${membros.length} 个工日` })} · ${data}`}
      validacao={validacao}
      aoGravar={gravar}
      aoFechar={aoFechar}
      gravado={gravado}
      erro={erro}
    >
      <Grelha>
        <Campo rotulo={tr(COL.equipa)}>
          <Seleccao value={equipa?.codigo ?? ''} onChange={setEquipaCod}>
            {equipas.map((e) => (
              <option key={e.codigo} value={e.codigo}>
                {e.designacao}
              </option>
            ))}
          </Seleccao>
        </Campo>

        <Campo
          rotulo={tr({ pt: 'Data do turno', en: 'Shift date', zh: '班次日期' })}
          nota={tr({
            pt: 'Pode lançar-se no dia seguinte; nunca no futuro (V25).',
            en: 'It can be entered the next day; never in the future (V25).',
            zh: '可次日录入；但不得填未来日期（V25）。',
          })}
        >
          <input
            type="date"
            value={data}
            max={HOJE}
            onChange={(e) => setData(e.target.value)}
            className="num h-10 w-full rounded-xl bg-bloco px-3.5 text-[13px] text-texto outline-none focus:bg-bloco-2"
          />
        </Campo>

        <Campo rotulo={tr(COL.talhao)}>
          <Seleccao value={talhaoActivo} onChange={setTalhaoCod}>
            {talhoes.map((t) => (
              <option key={t.codigo} value={t.codigo}>
                {t.codigo} · {t.designacao}
              </option>
            ))}
          </Seleccao>
        </Campo>

        <Campo
          rotulo={tr({ pt: 'Tarefa', en: 'Task', zh: '作业' })}
          nota={tr({
            pt: 'Do catálogo de tipos de operação (E-10.1).',
            en: 'From the catalogue of operation types (E-10.1).',
            zh: '来自作业类型目录（E-10.1）。',
          })}
        >
          <Seleccao value={tarefa} onChange={setTarefa}>
            {[...TIPO_OPERACAO_POR_CODIGO.values()].map((t) => (
              <option key={t.codigo} value={t.codigo}>
                {t.codigo} · {tr(t.designacao)}
              </option>
            ))}
          </Seleccao>
        </Campo>

        <Campo rotulo={tr({ pt: 'Entrada', en: 'Clock in', zh: '上工' })}>
          <input
            type="time"
            value={horaEntrada}
            onChange={(e) => setHoraEntrada(e.target.value)}
            className="num h-10 w-full rounded-xl bg-bloco px-3.5 text-[13px] text-texto outline-none focus:bg-bloco-2"
          />
        </Campo>

        <Campo rotulo={tr({ pt: 'Saída', en: 'Clock out', zh: '下工' })}>
          <input
            type="time"
            value={horaSaida}
            onChange={(e) => setHoraSaida(e.target.value)}
            className="num h-10 w-full rounded-xl bg-bloco px-3.5 text-[13px] text-texto outline-none focus:bg-bloco-2"
          />
        </Campo>

        <Campo
          rotulo={tr({ pt: 'Horas normais', en: 'Normal hours', zh: '正常工时' })}
          nota={tr({
            pt: `Intervalo de ${intervalo} min descontado. Máximo legal: 8 h/dia.`,
            en: `A ${intervalo} min break deducted. Legal maximum: 8 h/day.`,
            zh: `已扣除 ${intervalo} 分钟休息。法定上限：每日 8 小时。`,
          })}
        >
          <Derivado>
            {fmt.numero(horas, 1)} {fmt.unidade('h')}
          </Derivado>
        </Campo>
      </Grelha>

      {/* --- A equipa: só se toca no que foge à norma ---------------------- */}
      <div>
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[13px] font-semibold text-texto">
            <Users className="size-4 text-texto-3" />
            {tr({
              pt: `${membros.length} pessoas na equipa`,
              en: `${membros.length} people on the team`,
              zh: `班组共 ${membros.length} 人`,
            })}
          </span>
          <div className="flex items-center gap-2.5">
            <Semaforo
              cor={presentes.length === membros.length ? 'verde' : 'ambar'}
              rotulo={tr({
                pt: fmt.contagem(presentes.length, 'presente', 'presentes'),
                en: fmt.contagem(presentes.length, 'present', 'present'),
                zh: `${fmt.inteiro(presentes.length)} 人出勤`,
              })}
              icone={Check}
            />
            {presentes.length < membros.length && (
              <Semaforo
                cor="vermelho"
                rotulo={tr({
                  pt: fmt.contagem(membros.length - presentes.length, 'ausente', 'ausentes'),
                  en: fmt.contagem(membros.length - presentes.length, 'absent', 'absent'),
                  zh: `${fmt.inteiro(membros.length - presentes.length)} 人缺勤`,
                })}
                icone={X}
              />
            )}
          </div>
        </div>

        <p className="mb-3 text-[12px] text-texto-3">
          Toda a gente entra presente. Toque só em quem faltou, e escreva a produção de quem
          trabalha à tarefa.
        </p>

        <ul className="flex flex-col gap-1.5">
          {membros.map((t) => {
            const presenca = ausencias[t.codigo] ?? 'presente';
            const presente = presenca === 'presente';
            return (
              <li
                key={t.codigo}
                className={`bloco grid grid-cols-1 items-center gap-3 px-4 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto_130px] ${
                  presente ? '' : 'opacity-70'
                }`}
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-texto">
                    {t.nome_completo}
                  </div>
                  <Codigo>{t.codigo}</Codigo>
                </div>

                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() =>
                      setAusencias((a) => {
                        const { [t.codigo]: _, ...resto } = a;
                        return resto;
                      })
                    }
                    className={`rounded-full px-2.5 py-1.5 text-[11.5px] transition-colors ${
                      presente
                        ? 'bg-texto font-semibold text-white'
                        : 'bg-cartao text-texto-2 hover:text-texto'
                    }`}
                  >
                    Presente
                  </button>
                  {AUSENCIAS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setAusencias((a) => ({ ...a, [t.codigo]: p }))}
                      className={`rounded-full px-2.5 py-1.5 text-[11.5px] transition-colors ${
                        presenca === p
                          ? 'bg-texto font-semibold text-white'
                          : 'bg-cartao text-texto-2 hover:text-texto'
                      }`}
                    >
                      {tr(ROTULO_PRESENCA[p])}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    disabled={!presente}
                    value={producao[t.codigo] ?? ''}
                    placeholder={tr({ pt: 'produção', en: 'output', zh: '产量' })}
                    onChange={(e) =>
                      setProducao((p) => ({
                        ...p,
                        [t.codigo]: e.target.value === '' ? '' : Number(e.target.value),
                      }))
                    }
                    className="num h-9 w-full rounded-xl bg-cartao px-3 pr-10 text-[12.5px] text-texto outline-none disabled:opacity-40"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-texto-3">
                    {fmt.unidade(unidade)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-fio pt-3 text-[12.5px]">
          <span className="text-texto-2">
            {tr({ pt: 'Custo da folha', en: 'Cost of the sheet', zh: '本表成本' })}:{' '}
            <span className="num font-semibold text-texto">{fmt.meticais(custoTotal)}</span>
          </span>
          <span className="text-texto-3">
            {tr({
              pt: `Derivado da remuneração de cada pessoa sobre 26 dias. Validado por ${equipa?.chefe_turma}.`,
              en: `Derived from each person’s remuneration over 26 days. Validated by ${equipa?.chefe_turma}.`,
              zh: `由每人报酬按 26 天推算。审核人：${equipa?.chefe_turma}。`,
            })}
            {semRemuneracao > 0 && (
              <span className="text-ambar">
                {' '}
                {tr({
                  pt: `${semRemuneracao} sem remuneração registada entram a zero: o total é um piso, não o custo.`,
                  en: `${semRemuneracao} with no remuneration on record count as zero: the total is a floor, not the cost.`,
                  zh: `有 ${semRemuneracao} 人未登记报酬，按零计入：合计为下限，而非实际成本。`,
                })}
              </span>
            )}
          </span>
        </div>
      </div>
    </Formulario>
  );
}
