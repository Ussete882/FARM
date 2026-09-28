/**
 * F-05 — Relatório diário de campo.
 *
 * «É o formulário mais importante do sistema.» Entregue antes do fim do turno,
 * sem excepção; é a fonte primária de quase todos os indicadores operacionais.
 *
 * Requisitos de desenho do §25, que não são estéticos mas de sobrevivência:
 *   · máximo de sete campos por ecrã
 *   · listas em vez de texto livre
 *   · valores por omissão inteligentes
 *   · nenhum formulário de campo pode exigir mais de 3 minutos
 *
 * «Se o registo custar mais de três minutos ao chefe de turma no fim de um dia
 * de calor, o registo não vai ser feito, e o sistema inteiro cai.»
 */

import { Check, ChevronLeft, ChevronRight, Timer } from 'lucide-react';
import React from 'react';

import { useEquipas, useOrdens, useRelatorios, useTalhoes, useTrabalhadores } from '../../dados/consultas';
import { gravarRelatorio } from '../../dados/escrever';
import { HOJE } from '../../dados/semente';
import { q } from '@bastet/nucleo/canonico';
import { codigo } from '@bastet/nucleo/codigos';
import { useFmt, useT } from '../../i18n/contexto';
import { COL } from '../../i18n/comuns';
import type { T } from '@bastet/nucleo/i18n';
import {
  CONDICOES_METEO,
  MOTIVOS_FALTA,
  ROTULO_BLOQUEIO,
  ROTULO_FALTA,
  ROTULO_METEO,
  TIPOS_BLOQUEIO,
  TIPO_OPERACAO_POR_CODIGO,
  type Bloqueio,
  type CondicaoMeteo,
  type MotivoFalta,
  type TipoBloqueio,
} from '@bastet/nucleo/operacoes';
import { validarRelatorioDiario } from '@bastet/nucleo/validacao';
import { Botao } from '../../design/Pagina';
import { Codigo, Constatacoes, Rotulo, Semaforo } from '../../design/primitivas';

const PASSOS: T[] = [
  { pt: 'Onde e quem', en: 'Where and who', zh: '地点与人员' },
  { pt: 'Faltas', en: 'Absences', zh: '缺勤' },
  { pt: 'Produção e ocorrências', en: 'Output and events', zh: '产量与事件' },
];

export function FormularioF05({ aoFechar }: { aoFechar: () => void }) {
  const tr = useT();
  const fmt = useFmt();
  const ordens = useOrdens();
  const relatorios = useRelatorios();
  const talhoes = useTalhoes();
  const equipas = useEquipas();
  const trabalhadores = useTrabalhadores();

  // --- Cronómetro: o desenho é verificado contra os 3 minutos do §25 ------
  const [inicio] = React.useState(() => performance.now());
  const [decorrido, setDecorrido] = React.useState(0);
  React.useEffect(() => {
    const id = window.setInterval(() => setDecorrido((performance.now() - inicio) / 1000), 1000);
    return () => window.clearInterval(id);
  }, [inicio]);

  const [passo, setPasso] = React.useState(0);

  // --- Valores por omissão inteligentes ----------------------------------
  const [bloco, setBloco] = React.useState('FA-B01');
  const equipa = equipas.find((e) => e.bloco_habitual === bloco);
  const membros = React.useMemo(
    () => trabalhadores.filter((t) => t.equipa === equipa?.codigo),
    [trabalhadores, equipa],
  );

  const ordensDoBloco = React.useMemo(
    () =>
      [...ordens]
        .filter((o) => o.talhao.startsWith(bloco))
        .sort((a, b) => (a.data_prevista < b.data_prevista ? 1 : -1))
        .slice(0, 12),
    [ordens, bloco],
  );

  const [ordemCod, setOrdemCod] = React.useState('');
  const ordem = ordens.find((o) => o.codigo === ordemCod) ?? ordensDoBloco[0];

  const [presentes, setPresentes] = React.useState<number | ''>('');
  const [meteo, setMeteo] = React.useState<CondicaoMeteo>('seco');
  const [faltas, setFaltas] = React.useState<Record<string, MotivoFalta>>({});
  const [realizado, setRealizado] = React.useState<number | ''>('');
  const [rejeitado, setRejeitado] = React.useState<number | ''>('');
  const [bloqueios, setBloqueios] = React.useState<Bloqueio[]>([]);
  const [incidentes, setIncidentes] = React.useState(0);
  const [epi, setEpi] = React.useState(true);
  const [gravado, setGravado] = React.useState<string | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);

  const previstos = membros.length;
  const presentesN = presentes === '' ? previstos : Number(presentes);
  const emFalta = previstos - presentesN;
  const unidade = ordem?.quantidade_prevista.unidade ?? 'ha';

  const rascunho = React.useMemo(
    () => ({
      id: '',
      codigo: codigo.relatorioDiario(HOJE, bloco),
      designacao: `${tr({ pt: 'Relatório diário', en: 'Daily report', zh: '田间日报' })} — ${bloco} — ${HOJE}`,
      tipo: 'relatorio_diario' as const,
      estado: 'concluido' as const,
      dono: equipa?.chefe_turma ?? '',
      criado_em: HOJE,
      criado_por: equipa?.chefe_turma ?? '',
      alterado_em: HOJE,
      alterado_por: equipa?.chefe_turma ?? '',
      versao: 1,
      relacoes: [],
      historico: [],
      anexos: [],
      data: HOJE,
      turno: 'completo' as const,
      bloco,
      talhoes: ordem ? [ordem.talhao] : [],
      ordens_trabalho: ordem ? [ordem.codigo] : [],
      efectivo_previsto: previstos,
      efectivo_presente: presentesN,
      faltas: Object.entries(faltas).map(([trabalhador, motivo]) => ({ trabalhador, motivo })),
      hora_inicio: '06:30',
      hora_fim: '14:00',
      meta_dia: ordem?.quantidade_prevista ?? q(0, unidade),
      quantidade_realizada: q(realizado === '' ? 0 : Number(realizado), unidade),
      quantidade_rejeitada: rejeitado === '' ? undefined : q(Number(rejeitado), unidade),
      condicoes_meteorologicas: meteo,
      bloqueios,
      incidentes_seguranca: incidentes,
      epi_conforme: epi,
      chefe_turma: equipa?.chefe_turma ?? '',
      fonte_dados: 'registo_duas_assinaturas' as const,
    }),
    [bloco, equipa, ordem, previstos, presentesN, faltas, realizado, rejeitado, unidade, meteo, bloqueios, incidentes, epi],
  );

  const duplicados = relatorios.filter((r) => r.bloco === bloco && r.data === HOJE).length;
  const validacao = validarRelatorioDiario(rascunho, HOJE, { duplicados });

  const gravar = async () => {
    const { id: _id, criado_em: _c, criado_por: _cp, alterado_em: _a, alterado_por: _ap, versao: _v, historico: _h, ...resto } =
      rascunho;
    try {
      setErro(null);
      const guardado = await gravarRelatorio(resto);
      setGravado(guardado.codigo);
    } catch (e) {
      // Uma gravação recusada nunca falha em silêncio: o chefe de turma tem de
      // saber que o registo não ficou entregue.
      setErro(
        e instanceof Error
          ? `${tr({ pt: 'O registo não foi gravado', en: 'The record was not saved', zh: '记录未保存' })}: ${e.message}`
          : tr({
              pt: 'O registo não foi gravado por um erro inesperado.',
              en: 'The record was not saved due to an unexpected error.',
              zh: '因意外错误，记录未保存。',
            }),
      );
    }
  };

  if (gravado) {
    return (
      <div className="flex flex-col items-start gap-3 p-6">
        <Semaforo
          cor="verde"
          rotulo={tr({ pt: 'Registo entregue', en: 'Record submitted', zh: '记录已提交' })}
        />
        <h3 className="text-[15px] font-semibold text-texto">
          {tr({ pt: 'F-05 gravado como', en: 'F-05 saved as', zh: 'F-05 已保存为' })}{' '}
          <Codigo forte>{gravado}</Codigo>
        </h3>
        <p className="text-[12px] text-texto-2">
          {tr({
            pt: `Preenchido em ${fmt.numero(decorrido, 0)} segundos.`,
            en: `Filled in in ${fmt.numero(decorrido, 0)} seconds.`,
            zh: `用时 ${fmt.numero(decorrido, 0)} 秒填写完成。`,
          })}{' '}
          {decorrido <= 180 ? (
            <span className="text-texto">
              {tr({
                pt: 'Dentro dos 3 minutos exigidos pelo §25.',
                en: 'Within the 3 minutes required by §25.',
                zh: '符合 §25 规定的 3 分钟要求。',
              })}
            </span>
          ) : (
            <span className="text-ambar">
              {tr({
                pt: 'Acima dos 3 minutos do §25 — o formulário está errado, não quem o preenche.',
                en: 'Over the 3 minutes of §25 — the form is wrong, not the person filling it in.',
                zh: '超过 §25 规定的 3 分钟——问题出在表单，而不是填表的人。',
              })}
            </span>
          )}
        </p>
        <Botao onClick={aoFechar}>{tr({ pt: 'Fechar', en: 'Close', zh: '关闭' })}</Botao>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* --- Cabeçalho: passo e cronómetro --------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-fio px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {PASSOS.map((p, i) => (
            <button
              key={p.pt}
              onClick={() => setPasso(i)}
              className={`flex items-center gap-1.5 text-[12px] transition-colors ${
                i === passo ? 'font-medium text-texto' : 'text-texto-3 hover:text-texto-2'
              }`}
            >
              <span
                className={`grid size-4 place-items-center rounded-full text-[10px] ${
                  i === passo ? 'bg-acento text-[#04140b]' : 'bg-bloco-2 text-texto-3'
                }`}
              >
                {i + 1}
              </span>
              {tr(p)}
            </button>
          ))}
        </div>
        <div
          className={`flex items-center gap-1.5 text-[11.5px] ${
            decorrido > 180 ? 'text-vermelho' : decorrido > 120 ? 'text-ambar' : 'text-texto-3'
          }`}
          title={tr({
            pt: '§25 — nenhum formulário de campo pode exigir mais de 3 minutos',
            en: '§25 — no field form may take more than 3 minutes',
            zh: '§25 — 任何田间表单填写时间不得超过 3 分钟',
          })}
        >
          <Timer className="size-3.5" />
          <span className="num">
            {String(Math.floor(decorrido / 60)).padStart(2, '0')}:
            {String(Math.floor(decorrido % 60)).padStart(2, '0')}
          </span>
          <span className="text-texto-3">/ 03:00</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4 sm:p-5">
        {/* ================= Passo 1: onde e quem ==================== */}
        {passo === 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo rotulo={tr(COL.bloco)}>
              <Seleccao value={bloco} onChange={setBloco}>
                <option value="FA-B01">
                  FA-B01 · {tr({ pt: 'Bloco Norte', en: 'North Block', zh: '北区' })}
                </option>
                <option value="FA-B02">
                  FA-B02 · {tr({ pt: 'Bloco Sul', en: 'South Block', zh: '南区' })}
                </option>
              </Seleccao>
            </Campo>

            <Campo
              rotulo={tr({ pt: 'Ordem de trabalho', en: 'Work order', zh: '工单' })}
              nota={tr({
                pt: 'R1 — sem ordem não há operação.',
                en: 'R1 — no order, no operation.',
                zh: 'R1 — 无工单则无作业。',
              })}
            >
              <Seleccao value={ordem?.codigo ?? ''} onChange={setOrdemCod}>
                {ordensDoBloco.map((o) => {
                  const tipo = TIPO_OPERACAO_POR_CODIGO.get(o.tipo_operacao);
                  return (
                    <option key={o.codigo} value={o.codigo}>
                      {o.codigo} · {tipo ? tr(tipo.designacao) : o.tipo_operacao}
                    </option>
                  );
                })}
              </Seleccao>
            </Campo>

            <Campo
              rotulo={tr(COL.talhao)}
              nota={tr({
                pt: 'Herdado da ordem de trabalho.',
                en: 'Inherited from the work order.',
                zh: '继承自工单。',
              })}
            >
              <div className="flex h-[34px] items-center">
                <Codigo forte>{ordem?.talhao ?? '—'}</Codigo>
                <span className="ml-2 text-[12px] text-texto-2">
                  {talhoes.find((t) => t.codigo === ordem?.talhao)?.designacao}
                </span>
              </div>
            </Campo>

            <Campo
              rotulo={tr({ pt: 'Chefe de turma', en: 'Shift leader', zh: '班组长' })}
              nota={tr({
                pt: 'Herdado da equipa do bloco.',
                en: 'Inherited from the block’s team.',
                zh: '继承自本区班组。',
              })}
            >
              <div className="flex h-[34px] items-center gap-2">
                <Codigo forte>{equipa?.chefe_turma ?? '—'}</Codigo>
                <span className="text-[12px] text-texto-2">
                  {trabalhadores.find((t) => t.codigo === equipa?.chefe_turma)?.nome_completo}
                </span>
              </div>
            </Campo>

            <Campo
              rotulo={tr({
                pt: 'Efectivo previsto',
                en: 'Planned headcount',
                zh: '计划人数',
              })}
            >
              <div className="num flex h-[34px] items-center text-[15px] font-medium text-texto">
                {previstos}
              </div>
            </Campo>

            <Campo
              rotulo={tr({
                pt: 'Efectivo presente',
                en: 'Actual headcount',
                zh: '实到人数',
              })}
            >
              <Numero valor={presentes} aoMudar={setPresentes} sugestao={previstos} max={previstos} />
            </Campo>

            <Campo
              rotulo={tr({
                pt: 'Condições meteorológicas',
                en: 'Weather conditions',
                zh: '天气情况',
              })}
              largo
            >
              <div className="flex flex-wrap gap-1.5">
                {CONDICOES_METEO.map((c) => (
                  <Pastilha key={c} activa={meteo === c} aoClicar={() => setMeteo(c)}>
                    {tr(ROTULO_METEO[c])}
                  </Pastilha>
                ))}
              </div>
            </Campo>
          </div>
        )}

        {/* ================= Passo 2: faltas ========================= */}
        {passo === 1 && (
          <div className="flex flex-col gap-3">
            {emFalta <= 0 ? (
              <p className="text-[12.5px] text-texto">
                {tr({
                  pt: `Efectivo completo: ${presentesN} de ${previstos}. Nada a explicar.`,
                  en: `Full headcount: ${presentesN} of ${previstos}. Nothing to explain.`,
                  zh: `人员齐全：${presentesN}/${previstos}。无需说明。`,
                })}
              </p>
            ) : (
              <>
                <p className="text-[12.5px] text-texto-2">
                  {tr({
                    pt: `${fmt.contagem(emFalta, 'ausência', 'ausências')} por explicar. Toda a falta tem motivo — sem eles o registo não fecha.`,
                    en: `${fmt.contagem(emFalta, 'absence', 'absences')} to explain. Every absence has a reason — without them the record does not close.`,
                    zh: `${fmt.inteiro(emFalta)} 人缺勤待说明。每一次缺勤都要有原因——否则记录无法结案。`,
                  })}
                </p>
                <ul className="flex flex-col divide-y divide-fio">
                  {membros.map((t) => (
                    <li key={t.codigo} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
                      <Codigo forte>{t.codigo}</Codigo>
                      <span className="min-w-0 flex-1 truncate text-[12.5px] text-texto-2">
                        {t.nome_completo}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        <Pastilha
                          activa={!faltas[t.codigo]}
                          aoClicar={() =>
                            setFaltas((f) => {
                              const { [t.codigo]: _, ...resto } = f;
                              return resto;
                            })
                          }
                        >
                          {tr({ pt: 'Presente', en: 'Present', zh: '出勤' })}
                        </Pastilha>
                        {MOTIVOS_FALTA.slice(0, 3).map((m) => (
                          <Pastilha
                            key={m}
                            activa={faltas[t.codigo] === m}
                            aoClicar={() => setFaltas((f) => ({ ...f, [t.codigo]: m }))}
                          >
                            {tr(ROTULO_FALTA[m])}
                          </Pastilha>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="text-[11.5px] text-texto-3">
                  {tr({
                    pt: `Assinalados: ${Object.keys(faltas).length} de ${emFalta}.`,
                    en: `Marked: ${Object.keys(faltas).length} of ${emFalta}.`,
                    zh: `已标注：${Object.keys(faltas).length}/${emFalta}。`,
                  })}
                </p>
              </>
            )}
          </div>
        )}

        {/* ============ Passo 3: produção e ocorrências ============== */}
        {passo === 2 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo
              rotulo={tr({
                pt: 'Meta do dia',
                en: 'Target of the day',
                zh: '当日目标',
              })}
              nota={tr({
                pt: 'Herdada da ordem de trabalho.',
                en: 'Inherited from the work order.',
                zh: '继承自工单。',
              })}
            >
              <div className="num flex h-[34px] items-center text-[15px] font-medium text-texto">
                {fmt.quantidade(ordem?.quantidade_prevista)}
              </div>
            </Campo>

            <Campo
              rotulo={tr({
                pt: `Quantidade realizada (${fmt.unidade(unidade)})`,
                en: `Quantity achieved (${fmt.unidade(unidade)})`,
                zh: `实际完成量（${fmt.unidade(unidade)}）`,
              })}
            >
              <Numero
                valor={realizado}
                aoMudar={setRealizado}
                sugestao={ordem?.quantidade_prevista.valor}
              />
            </Campo>

            <Campo
              rotulo={tr({
                pt: `Quantidade rejeitada (${fmt.unidade(unidade)})`,
                en: `Quantity rejected (${fmt.unidade(unidade)})`,
                zh: `剔除量（${fmt.unidade(unidade)}）`,
              })}
              nota={tr({
                pt: 'Deixar vazio se não houve rejeição.',
                en: 'Leave empty if there was no rejection.',
                zh: '若无剔除，留空即可。',
              })}
            >
              <Numero valor={rejeitado} aoMudar={setRejeitado} />
            </Campo>

            <Campo
              rotulo={tr({
                pt: 'Incidentes de segurança',
                en: 'Safety incidents',
                zh: '安全事件',
              })}
            >
              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map((n) => (
                  <Pastilha key={n} activa={incidentes === n} aoClicar={() => setIncidentes(n)}>
                    {n === 3 ? '3+' : n}
                  </Pastilha>
                ))}
              </div>
            </Campo>

            <Campo
              rotulo={tr({
                pt: 'Equipamento de protecção',
                en: 'Protective equipment',
                zh: '防护装备',
              })}
            >
              <div className="flex gap-1.5">
                <Pastilha activa={epi} aoClicar={() => setEpi(true)}>
                  {tr({ pt: 'Conforme', en: 'Compliant', zh: '合规' })}
                </Pastilha>
                <Pastilha activa={!epi} aoClicar={() => setEpi(false)}>
                  {tr({ pt: 'Com falhas', en: 'With gaps', zh: '有缺陷' })}
                </Pastilha>
              </div>
            </Campo>

            <Campo
              rotulo={tr({ pt: 'Bloqueios', en: 'Blockers', zh: '阻碍' })}
              largo
            >
              <div className="flex flex-wrap gap-1.5">
                {TIPOS_BLOQUEIO.map((t) => {
                  const activo = bloqueios.some((b) => b.tipo_bloqueio === t);
                  return (
                    <Pastilha
                      key={t}
                      activa={activo}
                      aoClicar={() =>
                        setBloqueios((bs) =>
                          activo
                            ? bs.filter((b) => b.tipo_bloqueio !== t)
                            : [
                                ...bs,
                                {
                                  tipo_bloqueio: t as TipoBloqueio,
                                  descricao: tr(ROTULO_BLOQUEIO[t]),
                                },
                              ],
                        )
                      }
                    >
                      {tr(ROTULO_BLOQUEIO[t])}
                    </Pastilha>
                  );
                })}
              </div>
            </Campo>
          </div>
        )}

        {erro && (
          <p className="rounded-xl bg-vermelho-pastel px-3 py-2.5 text-[12px] text-vermelho">{erro}</p>
        )}

        {/* --- Constatações do motor de regras, em tempo real -------- */}
        {validacao.constatacoes.length > 0 && (
          <div>
            <Rotulo className="mb-2">
              {tr({ pt: 'Verificação', en: 'Checks', zh: '校验' })}
            </Rotulo>
            <Constatacoes lista={validacao.constatacoes} />
          </div>
        )}
      </div>

      {/* --- Navegação ----------------------------------------------- */}
      <div className="flex items-center justify-between gap-2 border-t border-fio px-4 py-3 sm:px-5">
        <Botao onClick={() => (passo === 0 ? aoFechar() : setPasso(passo - 1))}>
          <ChevronLeft className="size-3.5" />
          {passo === 0 ? tr({ pt: 'Cancelar', en: 'Cancel', zh: '取消' }) : tr(PASSOS[passo - 1])}
        </Botao>

        {passo < PASSOS.length - 1 ? (
          <Botao variante="primario" onClick={() => setPasso(passo + 1)}>
            {tr(PASSOS[passo + 1])}
            <ChevronRight className="size-3.5" />
          </Botao>
        ) : (
          <Botao variante="primario" onClick={gravar} disabled={!validacao.gravavel}>
            <Check className="size-3.5" />
            {validacao.gravavel
              ? tr({
                  pt: 'Entregar relatório',
                  en: 'Submit report',
                  zh: '提交日报',
                })
              : tr({
                  pt: 'Corrigir para entregar',
                  en: 'Correct before submitting',
                  zh: '更正后方可提交',
                })}
          </Botao>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Controlos
// ============================================================================

function Campo({
  rotulo,
  nota,
  largo,
  children,
}: {
  rotulo: React.ReactNode;
  nota?: React.ReactNode;
  largo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={largo ? 'sm:col-span-2' : ''}>
      <Rotulo className="mb-1.5">{rotulo}</Rotulo>
      {children}
      {nota && <p className="mt-1 text-[11px] text-texto-3">{nota}</p>}
    </div>
  );
}

function Seleccao({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-[34px] w-full rounded-xl border border-fio bg-bloco px-2.5 text-[12.5px] text-texto"
    >
      {children}
    </select>
  );
}

function Numero({
  valor,
  aoMudar,
  sugestao,
  max,
}: {
  valor: number | '';
  aoMudar: (v: number | '') => void;
  sugestao?: number;
  max?: number;
}) {
  const tr = useT();
  const fmt = useFmt();
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={valor}
        max={max}
        placeholder={sugestao !== undefined ? String(sugestao) : ''}
        onChange={(e) => aoMudar(e.target.value === '' ? '' : Number(e.target.value))}
        className="num h-[34px] w-full rounded-xl border border-fio bg-bloco px-2.5 text-[13px] text-texto placeholder:text-texto-3"
      />
      {sugestao !== undefined && valor === '' && (
        <button
          onClick={() => aoMudar(sugestao)}
          className="shrink-0 rounded-xl border border-fio px-2 py-1 text-[11px] text-texto-3 hover:text-texto"
        >
          {tr({ pt: 'usar', en: 'use', zh: '采用' })} {fmt.numero(sugestao, 1)}
        </button>
      )}
    </div>
  );
}

function Pastilha({
  activa,
  aoClicar,
  children,
}: {
  activa: boolean;
  aoClicar: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={aoClicar}
      className={`rounded-xl border px-2 py-1 text-[11.5px] transition-colors ${
        activa
          ? 'border-acento bg-bloco text-texto'
          : 'border-fio text-texto-3 hover:border-fio-forte hover:text-texto-2'
      }`}
    >
      {children}
    </button>
  );
}
