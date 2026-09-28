/**
 * E-10 — Emitir ordem de trabalho.
 *
 * R5: «Toda a operação existe primeiro como plano e depois como execução.»
 * Até agora o plano só existia na semente; sem este ecrã, o sistema não
 * conseguia nascer um dia de trabalho — e sem ordem, a operação é recusada
 * pela V23.
 *
 * O custo orçamentado é derivado das jornas pela remuneração média da equipa:
 * um orçamento escrito à mão deixa de ser confrontável com a folha.
 */

import React from 'react';

import { useCiclos, useEquipas, useOrdens, useTalhoes, useTrabalhadores } from '../../dados/consultas';
import { gravarOrdem, proximoSequencial } from '../../dados/escrever';
import { HOJE } from '../../dados/semente';
import { q, type Unidade } from '@bastet/nucleo/canonico';
import { codigo } from '@bastet/nucleo/codigos';
import { TIPOS_OPERACAO, TIPO_OPERACAO_POR_CODIGO } from '@bastet/nucleo/operacoes';
import { useFmt, useT } from '../../i18n/contexto';
import { COL } from '../../i18n/comuns';
import { validarOrdemTrabalho } from '@bastet/nucleo/validacao';
import {
  Campo,
  Derivado,
  Formulario,
  Grelha,
  Numero,
  Seleccao,
} from '../../design/Formulario';

/** Unidade de medida do trabalho, por tipo de operação (E-10.1). */
const UNIDADE_POR_TIPO: Record<string, Unidade> = {
  'OPT-15': 'm3',
  'OPT-18': 'un',
  'OPT-19': 'un',
  'OPT-06': 'un',
  'OPT-08': 'planta',
  'OPT-16': 'arvore',
  'OPT-20': 'kg',
  'OPT-17': 'kg',
  'OPT-32': 'dia',
};
const unidadeDe = (tipo: string): Unidade => UNIDADE_POR_TIPO[tipo] ?? 'ha';

export function FormularioOT({ aoFechar }: { aoFechar: () => void }) {
  const tr = useT();
  const fmt = useFmt();
  const talhoes = useTalhoes();
  const ciclos = useCiclos();
  const equipas = useEquipas();
  const trabalhadores = useTrabalhadores();
  const ordens = useOrdens();

  const [tipoOperacao, setTipoOperacao] = React.useState('OPT-11');
  const [talhao, setTalhao] = React.useState('');
  const [dataPrevista, setDataPrevista] = React.useState(HOJE);
  const [jornas, setJornas] = React.useState<number | ''>('');
  const [quantidade, setQuantidade] = React.useState<number | ''>('');
  const [gravado, setGravado] = React.useState<string | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);

  const talhaoActivo = talhao || talhoes[0]?.codigo || '';
  const ciclo = ciclos.find((c) => c.talhao === talhaoActivo);
  const equipa = equipas.find((e) => talhaoActivo.startsWith(e.bloco_habitual ?? '§'));
  const tecnico = talhaoActivo.startsWith('FA-B01') ? 'TR-00003' : 'TR-00004';
  const unidade = unidadeDe(tipoOperacao);

  // O efectivo da equipa é a sugestão de jornas: é o que existe para trabalhar.
  const efectivo = trabalhadores.filter((t) => t.equipa === equipa?.codigo).length;

  // Custo-dia a partir da remuneração média da própria equipa, sobre 26 dias
  // úteis. Um orçamento escrito à mão não é confrontável com a folha.
  const daEquipa = trabalhadores.filter((t) => t.equipa === equipa?.codigo);
  const custoDia =
    daEquipa.length > 0
      ? daEquipa.reduce((s, t) => s + (t.remuneracao_base?.valor ?? 0), 0) / daEquipa.length / 26
      : 0;
  const jornasN = jornas === '' ? 0 : Number(jornas);
  const custo = Number((jornasN * custoDia).toFixed(2));

  const sequencia = proximoSequencial(
    ordens.map((o) => o.codigo),
    'OT-2026-',
  );
  const cod = codigo.ordemTrabalho(2026, sequencia);
  // A designação gravada fica em português: é dado, não apresentação.
  const designacao = TIPO_OPERACAO_POR_CODIGO.get(tipoOperacao)?.designacao.pt ?? tipoOperacao;

  const rascunho = React.useMemo(
    () => ({
      id: cod,
      codigo: cod,
      designacao,
      tipo: 'ordem_trabalho' as const,
      estado: 'planeado' as const,
      dono: tecnico,
      criado_em: HOJE,
      criado_por: tecnico,
      alterado_em: HOJE,
      alterado_por: tecnico,
      versao: 1,
      relacoes: [],
      historico: [],
      anexos: [],
      tipo_operacao: tipoOperacao,
      ciclo_cultura: ciclo?.codigo,
      talhao: talhaoActivo,
      data_prevista: dataPrevista,
      equipa_prevista: equipa?.codigo ?? '',
      jornas_previstas: q(jornasN, 'jorna'),
      quantidade_prevista: q(quantidade === '' ? 0 : Number(quantidade), unidade),
      custo_orcamentado: q(custo, 'MT'),
      emitida_por: tecnico,
    }),
    [
      cod,
      designacao,
      tecnico,
      tipoOperacao,
      ciclo,
      talhaoActivo,
      dataPrevista,
      equipa,
      jornasN,
      quantidade,
      unidade,
      custo,
    ],
  );

  const validacao = validarOrdemTrabalho(rascunho);

  const gravar = async () => {
    const {
      id: _i,
      criado_em: _c,
      criado_por: _cp,
      alterado_em: _a,
      alterado_por: _ap,
      versao: _v,
      historico: _h,
      ...resto
    } = rascunho;
    try {
      setErro(null);
      const guardado = await gravarOrdem(resto);
      setGravado(guardado.codigo);
    } catch (e) {
      setErro(
        e instanceof Error
          ? `${tr({ pt: 'A ordem não foi emitida', en: 'The order was not issued', zh: '工单未开具' })}: ${e.message}`
          : tr({
              pt: 'A ordem não foi emitida por um erro inesperado.',
              en: 'The order was not issued due to an unexpected error.',
              zh: '因意外错误，工单未开具。',
            }),
      );
    }
  };

  return (
    <Formulario
      titulo={tr({
        pt: 'Emitir ordem de trabalho',
        en: 'Issue a work order',
        zh: '开具工单',
      })}
      formulario="E-10"
      codigo={cod}
      validacao={validacao}
      aoGravar={gravar}
      aoFechar={aoFechar}
      gravado={gravado}
      erro={erro}
      // O plano faz-se ao secretária, não no fim de um turno: sem cronómetro.
      limiteSegundos={0}
    >
      <Grelha>
        <Campo
          rotulo={tr(COL.operacao)}
          nota={(() => {
            const u = TIPO_OPERACAO_POR_CODIGO.get(tipoOperacao)?.unidadeTrabalho;
            return `${tr({ pt: 'Unidade de trabalho', en: 'Unit of work', zh: '计量单位' })}: ${u ? tr(u) : '—'}`;
          })()}
        >
          <Seleccao value={tipoOperacao} onChange={setTipoOperacao}>
            {TIPOS_OPERACAO.map((t) => (
              <option key={t.codigo} value={t.codigo}>
                {t.codigo} · {tr(t.designacao)}
              </option>
            ))}
          </Seleccao>
        </Campo>

        <Campo rotulo={tr(COL.talhao)}>
          <Seleccao value={talhaoActivo} onChange={setTalhao}>
            {talhoes.map((t) => (
              <option key={t.codigo} value={t.codigo}>
                {t.codigo} · {t.designacao}
              </option>
            ))}
          </Seleccao>
        </Campo>

        <Campo
          rotulo={tr({ pt: 'Data prevista', en: 'Planned date', zh: '计划日期' })}
        >
          <input
            type="date"
            value={dataPrevista}
            onChange={(e) => setDataPrevista(e.target.value)}
            className="num h-10 w-full rounded-xl bg-bloco px-3.5 text-[13px] text-texto outline-none focus:bg-bloco-2"
          />
        </Campo>

        <Campo
          rotulo={tr(COL.equipa)}
          nota={tr({
            pt: `${efectivo} pessoas no efectivo.`,
            en: `${efectivo} people on the roster.`,
            zh: `编制内 ${efectivo} 人。`,
          })}
        >
          <Derivado>{equipa?.designacao ?? '—'}</Derivado>
        </Campo>

        <Campo
          rotulo={tr({
            pt: 'Jornas previstas',
            en: 'Planned worker-days',
            zh: '计划工日',
          })}
          nota={tr({
            pt: 'É o denominador da produtividade.',
            en: 'It is the denominator of productivity.',
            zh: '它是生产率的分母。',
          })}
        >
          <Numero valor={jornas} aoMudar={setJornas} passo="1" sugestao={efectivo || 10} />
        </Campo>

        <Campo
          rotulo={`${tr(COL.meta)} (${fmt.unidade(unidade)})`}
          nota={tr({
            pt: 'Sem meta não há desvio, e o desvio é o indicador mais útil do sistema.',
            en: 'Without a target there is no deviation, and deviation is the most useful indicator in the system.',
            zh: '没有目标就没有偏差，而偏差是本系统最有用的指标。',
          })}
        >
          <Numero valor={quantidade} aoMudar={setQuantidade} passo="0.1" />
        </Campo>

        <Campo
          rotulo={tr({
            pt: 'Custo orçamentado',
            en: 'Budgeted cost',
            zh: '预算成本',
          })}
          largo
          nota={
            custoDia > 0
              ? tr({
                  pt: `Derivado: ${jornasN} jornas × ${fmt.meticais(custoDia)}/dia, da remuneração média de ${equipa?.designacao ?? 'equipa'} sobre 26 dias úteis.`,
                  en: `Derived: ${jornasN} worker-days × ${fmt.meticais(custoDia)}/day, from the average remuneration of ${equipa?.designacao ?? 'the team'} over 26 working days.`,
                  zh: `推算值：${jornasN} 工日 × ${fmt.meticais(custoDia)}/天，取自${equipa?.designacao ?? '班组'}按 26 个工作日折算的平均报酬。`,
                })
              : tr({
                  pt: 'Sem equipa com remuneração registada — o custo orçamentado fica a zero.',
                  en: 'No team with remuneration on record — the budgeted cost stays at zero.',
                  zh: '无已登记报酬的班组——预算成本为零。',
                })
          }
        >
          <Derivado>{fmt.meticais(custo)}</Derivado>
        </Campo>
      </Grelha>
    </Formulario>
  );
}
