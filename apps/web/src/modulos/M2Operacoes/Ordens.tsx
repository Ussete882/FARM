/**
 * M2 — Ordens de trabalho (E-10) e operações executadas (E-11).
 *
 * R5: «Toda a operação existe primeiro como plano e depois como execução. O
 * desvio entre os dois é o indicador mais útil do sistema.» O desvio é sempre
 * derivado; não há campo onde alguém o possa escrever.
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useNomes, useOperacoes, useOrdens } from '../../dados/consultas';
import { useFmt, useT } from '../../i18n/contexto';
import { COL } from '../../i18n/comuns';
import { ROTULO_METEO, TIPO_OPERACAO_POR_CODIGO } from '@bastet/nucleo/operacoes';
import { desviosDaOrdem } from '@bastet/nucleo/desvio';
import { ClipboardList, Plus, Target, TrendingUp } from 'lucide-react';
import { FichaObjecto } from '../../design/FichaObjecto';
import { Botao, ListaDetalhe, Pagina } from '../../design/Pagina';
import {
  CartaoMetrica,
  Codigo,
  Painel,
  PlanoVsExecucao,
  Rotulo,
  Semaforo,
  Tabela,
} from '../../design/primitivas';
import { FormularioOT } from './FormularioOT';

export function Ordens() {
  const tr = useT();
  const fmt = useFmt();
  const { codigo } = useParams();
  const navegar = useNavigate();
  const ordens = useOrdens();
  const operacoes = useOperacoes();
  const nomes = useNomes();
  const [aEmitir, setAEmitir] = React.useState(false);

  const seleccionada = ordens.find((o) => o.codigo === codigo);
  const operacaoDa = (cod: string) => operacoes.find((op) => op.ordem_trabalho === cod);

  const fechadas = ordens.filter((o) => operacaoDa(o.codigo)).length;
  const porFechar = ordens.length - fechadas;
  const cumprimentos = ordens
    .map((o) => {
      const op = operacaoDa(o.codigo);
      if (!op || o.quantidade_prevista.valor <= 0) return undefined;
      return (op.quantidade_real.valor / o.quantidade_prevista.valor) * 100;
    })
    .filter((v): v is number => v !== undefined);
  const cumprimentoMedio = cumprimentos.length
    ? cumprimentos.reduce((s, v) => s + v, 0) / cumprimentos.length
    : undefined;

  return (
    <Pagina
      accoes={
        !aEmitir && (
          <Botao variante="primario" onClick={() => setAEmitir(true)}>
            <Plus className="size-3.5" />
            {tr({ pt: 'Emitir ordem', en: 'Issue an order', zh: '开具工单' })}
          </Botao>
        )
      }
    >
      {aEmitir && <FormularioOT aoFechar={() => setAEmitir(false)} />}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <CartaoMetrica
          destaque
          icone={TrendingUp}
          cor={cumprimentoMedio === undefined ? 'cinzento' : cumprimentoMedio >= 95 ? 'verde' : cumprimentoMedio >= 80 ? 'ambar' : 'vermelho'}
          rotulo={tr({
            pt: 'Cumprimento médio',
            en: 'Average fulfilment',
            zh: '平均完成率',
          })}
          valor={cumprimentoMedio === undefined ? '—' : fmt.numero(cumprimentoMedio, 0)}
          unidade="%"
          legenda={tr({
            pt: `${fechadas} de ${ordens.length} fechadas`,
            en: `${fechadas} of ${ordens.length} closed`,
            zh: `${ordens.length} 张中已结案 ${fechadas} 张`,
          })}
          frase={tr({
            pt: 'Quantidade real sobre quantidade prevista, nas ordens com execução registada. O desvio entre plano e execução é o indicador mais útil do sistema (R5).',
            en: 'Actual quantity over planned quantity, on orders with execution recorded. The deviation between plan and execution is the most useful indicator in the system (R5).',
            zh: '已登记执行的工单中，实际数量与计划数量之比。计划与执行之间的偏差，是本系统最有用的指标（R5）。',
          })}
        />

        <CartaoMetrica
          icone={ClipboardList}
          cor="cinzento"
          rotulo={tr({
            pt: 'Ordens no período',
            en: 'Orders in the period',
            zh: '本期工单',
          })}
          valor={fmt.inteiro(ordens.length)}
          frase={tr({
            pt: 'Trabalho executado sem ordem de trabalho fechada não é pago nem contabilizado (R1). A validação V23 impede que exista.',
            en: 'Work done without a closed work order is neither paid nor counted (R1). Validation V23 stops it from existing.',
            zh: '无已结案工单的作业，既不计酬也不计入统计（R1）。校验 V23 从源头阻止其发生。',
          })}
        />

        <CartaoMetrica
          icone={Target}
          cor={porFechar > 0 ? 'ambar' : 'verde'}
          rotulo={tr({ pt: 'Por fechar', en: 'Open', zh: '待结案' })}
          valor={fmt.inteiro(porFechar)}
          frase={tr({
            pt: 'Ordens emitidas sem operação registada. Um plano sem execução não tem desvio: tem espera.',
            en: 'Orders issued with no operation recorded. A plan without execution has no deviation: it has waiting.',
            zh: '已开具但尚未登记作业的工单。没有执行的计划不产生偏差，只产生等待。',
          })}
        />
      </div>

      <ListaDetalhe
        semSeleccao={tr({
          pt: 'Escolha uma ordem para ver o plano contra a execução.',
          en: 'Pick an order to see plan against execution.',
          zh: '选择一张工单，查看计划与执行对比。',
        })}
        lista={
          <Painel
            titulo={tr({
              pt: `${ordens.length} ordens`,
              en: `${ordens.length} orders`,
              zh: `${ordens.length} 张工单`,
            })}
            denso
          >
            <Tabela
              linhas={[...ordens].sort((a, b) => (a.data_prevista < b.data_prevista ? 1 : -1))}
              chave={(o) => o.codigo}
              activa={(o) => o.codigo === codigo}
              aoClicar={(o) => navegar(`/ordens/${o.codigo}`)}
              colunas={[
                {
                  chave: 'cod',
                  cabecalho: tr({ pt: 'Ordem', en: 'Order', zh: '工单' }),
                  render: (o) => <Codigo forte>{o.codigo}</Codigo>,
                },
                {
                  chave: 'data',
                  cabecalho: tr({ pt: 'Prevista', en: 'Planned', zh: '计划日' }),
                  numerica: true,
                  render: (o) => fmt.data(o.data_prevista),
                  ordenarPor: (o) => o.data_prevista,
                },
                {
                  chave: 'tipo',
                  cabecalho: tr(COL.operacao),
                  render: (o) => {
                    const t = TIPO_OPERACAO_POR_CODIGO.get(o.tipo_operacao);
                    return (
                      <span className="flex items-baseline gap-2">
                        <Codigo>{o.tipo_operacao}</Codigo>
                        <span className="text-texto-2">{t ? tr(t.designacao) : ''}</span>
                      </span>
                    );
                  },
                },
                {
                  chave: 'talhao',
                  cabecalho: tr(COL.talhao),
                  render: (o) => <Codigo>{o.talhao}</Codigo>,
                },
                {
                  chave: 'meta',
                  cabecalho: tr(COL.previsto),
                  numerica: true,
                  render: (o) => fmt.quantidade(o.quantidade_prevista),
                },
                {
                  chave: 'real',
                  cabecalho: tr(COL.real),
                  numerica: true,
                  render: (o) => {
                    const op = operacaoDa(o.codigo);
                    return op ? (
                      fmt.quantidade(op.quantidade_real)
                    ) : (
                      <span className="text-texto-3">—</span>
                    );
                  },
                },
                {
                  chave: 'desvio',
                  cabecalho: tr({
                    pt: 'Cumprimento',
                    en: 'Fulfilment',
                    zh: '完成率',
                  }),
                  numerica: true,
                  render: (o) => {
                    const op = operacaoDa(o.codigo);
                    const d = desviosDaOrdem(o, op).find((x) => x.dimensao === 'quantidade');
                    if (!d?.relativo)
                      return (
                        <Semaforo
                          cor="cinzento"
                          rotulo={tr({
                            pt: 'sem execução',
                            en: 'not executed',
                            zh: '未执行',
                          })}
                        />
                      );
                    const cor = d.relativo >= 95 ? 'verde' : d.relativo >= 80 ? 'ambar' : 'vermelho';
                    return <Semaforo cor={cor} rotulo={fmt.percentagem(d.relativo)} />;
                  },
                },
              ]}
            />
          </Painel>
        }
        detalhe={
          seleccionada ? (
            <FichaOrdem
              ordem={seleccionada}
              operacao={operacaoDa(seleccionada.codigo)}
              nomes={nomes}
            />
          ) : null
        }
      />
    </Pagina>
  );
}

function FichaOrdem({
  ordem,
  operacao,
  nomes,
}: {
  ordem: ReturnType<typeof useOrdens>[number];
  operacao?: ReturnType<typeof useOperacoes>[number];
  nomes: Map<string, string>;
}) {
  const tr = useT();
  const fmt = useFmt();
  const desvios = desviosDaOrdem(ordem, operacao);
  const tipo = TIPO_OPERACAO_POR_CODIGO.get(ordem.tipo_operacao);

  return (
    <FichaObjecto
      objecto={ordem}
      nomeDono={nomes.get(ordem.dono)}
      subtitulo={
        <>
          <Codigo forte>{ordem.tipo_operacao}</Codigo>
          {' · '}
          {tipo ? tr(tipo.designacao) : ''}
          {' · '}
          {tr({
            pt: 'unidade de trabalho',
            en: 'unit of work',
            zh: '计量单位',
          })}
          : {tipo ? tr(tipo.unidadeTrabalho) : ''}
        </>
      }
      grupos={[
        {
          titulo: tr({ pt: 'Plano', en: 'Plan', zh: '计划' }),
          campos: [
            {
              rotulo: tr({ pt: 'Data prevista', en: 'Planned date', zh: '计划日期' }),
              valor: fmt.data(ordem.data_prevista),
            },
            { rotulo: tr(COL.talhao), valor: <Codigo forte>{ordem.talhao}</Codigo> },
            {
              rotulo: tr({ pt: 'Ciclo', en: 'Cycle', zh: '生长周期' }),
              valor: <Codigo>{ordem.ciclo_cultura ?? '—'}</Codigo>,
            },
            {
              rotulo: tr({ pt: 'Equipa prevista', en: 'Planned team', zh: '计划班组' }),
              valor: <Codigo forte>{ordem.equipa_prevista}</Codigo>,
            },
            {
              rotulo: tr({
                pt: 'Jornas previstas',
                en: 'Planned worker-days',
                zh: '计划工日',
              }),
              valor: fmt.quantidade(ordem.jornas_previstas, 0),
            },
            {
              rotulo: tr({
                pt: 'Quantidade prevista',
                en: 'Planned quantity',
                zh: '计划数量',
              }),
              valor: fmt.quantidade(ordem.quantidade_prevista),
            },
            {
              rotulo: tr({
                pt: 'Custo orçamentado',
                en: 'Budgeted cost',
                zh: '预算成本',
              }),
              valor: fmt.meticais(ordem.custo_orcamentado.valor),
              nota: tr({
                pt: 'Calculado a partir de jornas, insumos e horas-máquina.',
                en: 'Computed from worker-days, inputs and machine-hours.',
                zh: '由工日、投入品与机时推算而来。',
              }),
            },
            {
              rotulo: tr({ pt: 'Emitida por', en: 'Issued by', zh: '开单人' }),
              valor: nomes.get(ordem.emitida_por) ?? ordem.emitida_por,
            },
          ],
        },
        ...(operacao
          ? [
              {
                titulo: tr({ pt: 'Execução', en: 'Execution', zh: '执行' }),
                campos: [
                  {
                    rotulo: tr({ pt: 'Data real', en: 'Actual date', zh: '实际日期' }),
                    valor: fmt.data(operacao.data_real),
                  },
                  {
                    rotulo: tr({ pt: 'Horário', en: 'Hours', zh: '作业时段' }),
                    valor: tr({
                      pt: `${operacao.hora_inicio} às ${operacao.hora_fim}`,
                      en: `${operacao.hora_inicio} to ${operacao.hora_fim}`,
                      zh: `${operacao.hora_inicio} 至 ${operacao.hora_fim}`,
                    }),
                  },
                  {
                    rotulo: tr({ pt: 'Executantes', en: 'Executors', zh: '作业人员' }),
                    valor: tr({
                      pt: fmt.contagem(operacao.executantes.length, 'pessoa', 'pessoas'),
                      en: fmt.contagem(operacao.executantes.length, 'person', 'people'),
                      zh: `${fmt.inteiro(operacao.executantes.length)} 人`,
                    }),
                  },
                  {
                    rotulo: tr(COL.responsavel),
                    valor: nomes.get(operacao.responsavel) ?? operacao.responsavel,
                  },
                  {
                    rotulo: tr({
                      pt: 'Jornas reais',
                      en: 'Actual worker-days',
                      zh: '实际工日',
                    }),
                    valor: fmt.quantidade(operacao.jornas_reais, 0),
                  },
                  {
                    rotulo: tr({
                      pt: 'Quantidade real',
                      en: 'Actual quantity',
                      zh: '实际数量',
                    }),
                    valor: fmt.quantidade(operacao.quantidade_real),
                  },
                  {
                    rotulo: tr({ pt: 'Condições', en: 'Conditions', zh: '天气' }),
                    valor: operacao.condicoes_meteorologicas
                      ? tr(ROTULO_METEO[operacao.condicoes_meteorologicas])
                      : '—',
                  },
                  {
                    rotulo: tr({ pt: 'Assinaturas', en: 'Signatures', zh: '签字' }),
                    valor: (
                      <span className="flex gap-2">
                        <Semaforo
                          cor={operacao.assinatura_executante ? 'verde' : 'vermelho'}
                          rotulo={tr({
                            pt: 'Executante',
                            en: 'Executor',
                            zh: '作业人',
                          })}
                        />
                        <Semaforo
                          cor={operacao.assinatura_responsavel ? 'verde' : 'vermelho'}
                          rotulo={tr(COL.responsavel)}
                        />
                      </span>
                    ),
                    largo: true,
                  },
                ],
              },
            ]
          : []),
      ]}
      extra={
        <section>
          <Rotulo className="mb-1">
            {tr({
              pt: 'Desvio entre plano e execução',
              en: 'Deviation between plan and execution',
              zh: '计划与执行的偏差',
            })}
          </Rotulo>
          {desvios.length === 0 ? (
            <p className="text-[12px] text-texto-3">
              {tr({
                pt: 'Plano sem execução não tem desvio: tem espera.',
                en: 'A plan without execution has no deviation: it has waiting.',
                zh: '没有执行的计划不产生偏差，只产生等待。',
              })}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b border-fio-forte pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-texto-3">
                <span>{tr({ pt: 'Dimensão', en: 'Dimension', zh: '维度' })}</span>
                <span className="text-right">{tr(COL.previsto)}</span>
                <span className="text-right">{tr(COL.real)}</span>
                <span className="text-right">{tr(COL.desvio)}</span>
              </div>
              {desvios.map((d) => (
                <PlanoVsExecucao
                  key={d.dimensao}
                  rotulo={tr(d.rotulo)}
                  previsto={fmt.numero(d.previsto, 1)}
                  real={fmt.numero(d.real, 1)}
                  desvio={tr(d.leitura)}
                  sentido={d.sentido}
                />
              ))}
            </>
          )}
        </section>
      }
    />
  );
}
