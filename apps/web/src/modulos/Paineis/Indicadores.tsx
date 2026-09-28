/**
 * Catálogo de indicadores (§9, §10, Anexo B).
 *
 * §9.2: «Não pode existir indicador sem registo primário que o alimente.»
 * Cada ficha declara o formulário de origem e os campos utilizados, e o valor
 * apresentado abre até às fichas que o produziram (§5.4).
 */

import { CircleAlert, CircleHelp, TriangleAlert } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import {
  useCiclos,
  useJornas,
  usePesagens,
  useRelatorios,
  useTalhoes,
  useTrabalhadores,
} from '../../dados/consultas';
import { HOJE } from '../../dados/semente';
import { useFmt, useT } from '../../i18n/contexto';
import { COL, UI } from '../../i18n/comuns';
import {
  CATALOGO_INDICADORES,
  FAMILIAS_INDICADOR,
  ROTULO_FREQUENCIA,
  type FamiliaIndicador,
  type FichaIndicador,
} from '@bastet/nucleo/indicadores';
import {
  kCol01,
  kCol02,
  kCol04,
  kCol05,
  kGov01,
  kGov02,
  kPes01,
  kPes02,
  kPes03,
  kPrd01,
  kPrd02,
  kPrd04,
  type ValorCalculado,
} from '@bastet/nucleo/calculos';
import { contaParaIndicadores } from '@bastet/nucleo/historico';
import { validarRelatorioDiario } from '@bastet/nucleo/validacao';
import { avaliar, ROTULO_CURTO } from '@bastet/nucleo/semaforo';
import { Pagina } from '../../design/Pagina';
import {
  Barra,
  CartaoMetrica,
  Codigo,
  Painel,
  Rotulo,
  Semaforo,
  Tabela,
  Vazio,
} from '../../design/primitivas';

export function Indicadores() {
  const tr = useT();
  const fmt = useFmt();
  const pesagens = usePesagens().filter(contaParaIndicadores);
  const ciclos = useCiclos();
  const talhoes = useTalhoes();
  const jornas = useJornas();
  const relatorios = useRelatorios();
  const trabalhadores = useTrabalhadores();
  const [aberto, setAberto] = React.useState<string | null>('K-PRD-03');

  const valores = React.useMemo(() => {
    const arvores = ciclos.reduce((s, c) => s + c.plantas_estabelecidas, 0);
    const hectares = talhoes.reduce((s, t) => s + t.area_plantada_ha.valor, 0);
    const esperado = ciclos.reduce((s, c) => s + c.producao_prevista.valor, 0);
    const real = ciclos.reduce((s, c) => s + (c.producao_real?.valor ?? 0), 0);
    const realizacao: ValorCalculado =
      esperado > 0
        ? {
            valor: (real / esperado) * 100,
            proveniencia: ciclos.map((c) => c.codigo),
            ressalva: {
              pt: 'Realização ponderada: cada ciclo é confrontado com o esperado da sua própria idade.',
              en: 'Weighted realisation: each cycle is measured against what is expected at its own age.',
              zh: '加权实现率：每个生长周期均与其自身树龄应有值对比。',
            },
          }
        : {
            valor: undefined,
            proveniencia: [],
            ressalva: {
              pt: 'Sem produção esperada.',
              en: 'No expected production.',
              zh: '无预期产量。',
            },
          };

    const pessoasDia = pesagens.reduce((s, p) => s + p.n_pessoas, 0);
    const activos = trabalhadores.filter((t) => t.estado === 'activo');
    const comInss = activos.filter((t) => t.numero_beneficiario_inss);
    const comApolice = activos.filter((t) => t.apolice_acidentes_trabalho);
    const pct = (n: number, total: number): ValorCalculado =>
      total === 0
        ? { valor: undefined, proveniencia: [] }
        : { valor: (n / total) * 100, proveniencia: [`${n}/${total} F-03`] };

    const dias = [...new Set(relatorios.map((r) => r.data))];

    const mapa: Record<string, ValorCalculado> = {
      'K-PRD-01': kPrd01({ pesagens, arvoresPlantadas: arvores }),
      'K-PRD-02': kPrd02(pesagens, hectares),
      'K-PRD-03': realizacao,
      'K-PRD-04': kPrd04(realizacao.valor),
      'K-COL-01': kCol01([...new Set(pesagens.map((p) => p.data_colheita))]),
      'K-COL-02': kCol02(pesagens),
      'K-COL-04': kCol04(pesagens),
      'K-COL-05': kCol05(pesagens, pessoasDia),
      'K-COL-06': {
        valor: talhoes.length
          ? pesagens.length / talhoes.length
          : undefined,
        proveniencia: pesagens.map((p) => p.codigo),
      },
      'K-PES-01': kPes01(jornas, hectares),
      'K-PES-02': kPes02(jornas, real),
      'K-PES-03': kPes03(jornas),
      'K-PES-09': pct(comInss.length, activos.length),
      'K-PES-10': pct(comApolice.length, activos.length),
      'K-GOV-01': kGov01(dias.length * 2, relatorios.length),
      'K-GOV-02': kGov02(
        relatorios.map((r) => {
          const v = validarRelatorioDiario(r, HOJE);
          return { gravavel: v.gravavel, temBloqueante: !v.gravavel };
        }),
      ),
    };
    return mapa;
  }, [pesagens, ciclos, talhoes, jornas, relatorios, trabalhadores]);

  const porFamilia = React.useMemo(() => {
    const m = new Map<string, FichaIndicador[]>();
    for (const f of CATALOGO_INDICADORES) {
      m.set(f.familia, [...(m.get(f.familia) ?? []), f]);
    }
    return m;
  }, []);

  const semDados = CATALOGO_INDICADORES.filter((f) => valores[f.codigo]?.valor === undefined);

  // Resumo por cor do semáforo — é a única leitura que este ecrã deve dar de
  // relance: quantos estão fora, quantos em alerta, quantos sem dados.
  const leituras = CATALOGO_INDICADORES.map((f) => avaliar(valores[f.codigo]?.valor, f).cor);
  const foraDoLimiar = leituras.filter((c) => c === 'vermelho').length;
  const emAlerta = leituras.filter((c) => c === 'ambar').length;
  const noAlvo = leituras.filter((c) => c === 'verde').length;

  // Cinzento tem duas causas, e são problemas diferentes: o registo não foi
  // entregue, ou ninguém fixou a meta. Contá-los juntos e listar só uns
  // deixava o cartão a dizer «8» sobre cinco códigos.
  const semMeta = CATALOGO_INDICADORES.filter(
    (f) => f.meta === undefined && valores[f.codigo]?.valor !== undefined,
  );
  const cinzentos = semDados.length + semMeta.length;

  return (
    <Pagina
      descricao={tr({
        pt: 'Apenas os indicadores que os registos da Fase 1 alimentam de facto. Um indicador sem registo primário não é um indicador, é uma opinião — por isso as famílias Qualidade, Processamento e Financeira não aparecem aqui: os seus formulários entram na Fase 2.',
        en: 'Only the indicators that Phase 1 records actually feed. An indicator without a primary record is not an indicator, it is an opinion — which is why the Quality, Processing and Financial families do not appear here: their forms arrive in Phase 2.',
        zh: '仅列出第一阶段记录真正支撑的指标。没有原始记录的指标不是指标，而是意见——因此质量、加工与财务三个系列未列入：它们的表单将在第二阶段上线。',
      })}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <CartaoMetrica
          destaque
          icone={CircleAlert}
          cor={foraDoLimiar > 0 ? 'vermelho' : emAlerta > 0 ? 'ambar' : 'verde'}
          rotulo={tr({
            pt: 'Fora do limiar',
            en: 'Past threshold',
            zh: '超出阈值',
          })}
          valor={fmt.inteiro(foraDoLimiar)}
          unidade={tr({
            pt: `de ${CATALOGO_INDICADORES.length}`,
            en: `of ${CATALOGO_INDICADORES.length}`,
            zh: `共 ${CATALOGO_INDICADORES.length} 项`,
          })}
          legenda={tr({
            pt: `${noAlvo} no alvo`,
            en: `${noAlvo} on target`,
            zh: `${noAlvo} 项达标`,
          })}
          frase={tr({
            pt: 'Um indicador em vermelho por dois períodos consecutivos escala ao nível superior e cria acção obrigatória (§4.3).',
            en: 'An indicator in red for two consecutive periods escalates to the level above and creates a mandatory action (§4.3).',
            zh: '连续两期为红的指标会上报上级，并生成强制措施（§4.3）。',
          })}
        />

        <CartaoMetrica
          icone={TriangleAlert}
          cor={emAlerta > 0 ? 'ambar' : 'verde'}
          rotulo={tr({ pt: 'Em alerta', en: 'In alert', zh: '预警中' })}
          valor={fmt.inteiro(emAlerta)}
          frase={tr({
            pt: 'Entre a meta e o limiar de alerta. Exige comentário do dono na revisão do período.',
            en: 'Between target and alert threshold. Requires a comment from the owner at the period review.',
            zh: '介于目标与预警阈值之间。要求责任人在本期复盘时作出说明。',
          })}
        />

        <CartaoMetrica
          icone={CircleHelp}
          cor={cinzentos > 0 ? 'cinzento' : 'verde'}
          rotulo={tr(UI.semDados)}
          valor={fmt.inteiro(cinzentos)}
          frase={
            cinzentos === 0 ? (
              tr({
                pt: 'Todos os indicadores do catálogo têm valor e meta.',
                en: 'Every indicator in the catalogue has a value and a target.',
                zh: '目录中的每个指标都有取值与目标。',
              })
            ) : (
              <>
                {semDados.length > 0 && (
                  <>
                    <strong className="font-semibold">
                      {tr({
                        pt: `${semDados.length} sem valor no período`,
                        en: `${semDados.length} with no value in the period`,
                        zh: `${semDados.length} 项本期无取值`,
                      })}
                    </strong>{' '}
                    ({semDados.map((f) => f.codigo).join(', ')}){' '}
                    {tr({
                      pt: '— o registo devido não foi entregue.',
                      en: '— the record that was due was not submitted.',
                      zh: '— 应报的记录未提交。',
                    })}{' '}
                  </>
                )}
                {semMeta.length > 0 && (
                  <>
                    <strong className="font-semibold">
                      {tr({
                        pt: `${semMeta.length} com meta por fixar`,
                        en: `${semMeta.length} with a target still to set`,
                        zh: `${semMeta.length} 项目标待定`,
                      })}
                    </strong>{' '}
                    ({semMeta.map((f) => f.codigo).join(', ')}){' '}
                    {tr({
                      pt: '— medem-se, mas ainda não se julgam.',
                      en: '— they are measured, but not yet judged.',
                      zh: '— 已在度量，但尚不作判定。',
                    })}
                  </>
                )}
              </>
            )
          }
        />
      </div>

      {[...porFamilia.entries()].map(([familia, fichas]) => (
        <Painel
          key={familia}
          titulo={tr({
            pt: `Família ${FAMILIAS_INDICADOR[familia as FamiliaIndicador].pt} (${familia})`,
            en: `${FAMILIAS_INDICADOR[familia as FamiliaIndicador].en} family (${familia})`,
            zh: `${FAMILIAS_INDICADOR[familia as FamiliaIndicador].zh}系列（${familia}）`,
          })}
          denso
        >
          <Tabela
            linhas={fichas}
            chave={(f) => f.codigo}
            activa={(f) => f.codigo === aberto}
            aoClicar={(f) => setAberto(f.codigo === aberto ? null : f.codigo)}
            colunas={[
              {
                chave: 'cod',
                cabecalho: tr(COL.codigo),
                render: (f) => <Codigo forte>{f.codigo}</Codigo>,
              },
              { chave: 'nome', cabecalho: tr(COL.indicador), render: (f) => tr(f.designacao) },
              {
                chave: 'freq',
                cabecalho: tr(COL.frequencia),
                render: (f) => (
                  <span className="text-texto-2">{tr(ROTULO_FREQUENCIA[f.frequencia])}</span>
                ),
              },
              {
                chave: 'dono',
                cabecalho: tr(COL.dono),
                render: (f) => <span className="text-texto-2">{tr(f.dono)}</span>,
              },
              {
                chave: 'base',
                cabecalho: tr({ pt: 'Valor base', en: 'Baseline', zh: '基准值' }),
                numerica: true,
                render: (f) =>
                  f.valor_base === undefined ? (
                    <span className="text-texto-3">—</span>
                  ) : (
                    <span className="text-texto-3">{fmt.numero(f.valor_base, 2)}</span>
                  ),
              },
              {
                chave: 'valor',
                cabecalho: tr({
                  pt: 'Valor actual',
                  en: 'Current value',
                  zh: '当前值',
                }),
                numerica: true,
                render: (f) => {
                  const v = valores[f.codigo];
                  return (
                    <span className="font-medium text-texto">
                      {v?.valor === undefined ? '—' : fmt.numero(v.valor, 2)}
                    </span>
                  );
                },
              },
              {
                chave: 'meta',
                cabecalho: tr(COL.meta),
                numerica: true,
                render: (f) =>
                  f.meta === undefined ? (
                    <span className="text-texto-3">
                      {tr({ pt: 'a estabelecer', en: 'to be set', zh: '待定' })}
                    </span>
                  ) : (
                    <span className="text-texto-3">{fmt.numero(f.meta, 1)}</span>
                  ),
              },
              {
                chave: 'semaforo',
                cabecalho: tr({
                  pt: 'Semáforo',
                  en: 'Traffic light',
                  zh: '信号灯',
                }),
                numerica: true,
                render: (f) => {
                  const leitura = avaliar(valores[f.codigo]?.valor, f);
                  return (
                    <div className="flex min-w-[104px] flex-col items-end gap-1">
                      <Semaforo cor={leitura.cor} rotulo={tr(ROTULO_CURTO[leitura.cor])} />
                      {f.meta !== undefined && valores[f.codigo]?.valor !== undefined && (
                        <Barra
                          fraccao={
                            f.sentido === 'maior_melhor'
                              ? valores[f.codigo]!.valor! / f.meta
                              : f.meta / Math.max(valores[f.codigo]!.valor!, 0.0001)
                          }
                          cor={leitura.cor}
                        />
                      )}
                    </div>
                  );
                },
              },
            ]}
          />
          {fichas.some((f) => f.codigo === aberto) && (
            <FichaDetalhe
              ficha={fichas.find((f) => f.codigo === aberto)!}
              valor={valores[aberto!]}
            />
          )}
        </Painel>
      ))}
    </Pagina>
  );
}

function FichaDetalhe({ ficha, valor }: { ficha: FichaIndicador; valor?: ValorCalculado }) {
  const tr = useT();
  const fmt = useFmt();
  const leitura = avaliar(valor?.valor, ficha);
  return (
    <div className="border-t border-fio-forte bg-bloco p-5">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Rotulo className="mb-1">
            {tr({ pt: 'Fórmula', en: 'Formula', zh: '公式' })}
          </Rotulo>
          <p className="text-[12.5px] leading-relaxed text-texto">{tr(ficha.formula)}</p>

          <Rotulo className="mb-1 mt-4">
            {tr({
              pt: 'Meta e limiares',
              en: 'Target and thresholds',
              zh: '目标与阈值',
            })}
          </Rotulo>
          <p className="text-[12.5px] text-texto-2">{tr(ficha.metaTexto)}</p>
          {ficha.limiar_alerta !== undefined && ficha.meta !== undefined && (
            <p className="mt-1 text-[11.5px] text-texto-3">
              {tr({
                pt: `Verde a partir de ${fmt.numero(ficha.meta, 1)}; âmbar entre ${fmt.numero(ficha.meta, 1)} e ${fmt.numero(ficha.limiar_alerta, 1)}; vermelho além disso.`,
                en: `Green from ${fmt.numero(ficha.meta, 1)}; amber between ${fmt.numero(ficha.meta, 1)} and ${fmt.numero(ficha.limiar_alerta, 1)}; red beyond that.`,
                zh: `达到 ${fmt.numero(ficha.meta, 1)} 为绿色；介于 ${fmt.numero(ficha.meta, 1)} 与 ${fmt.numero(ficha.limiar_alerta, 1)} 之间为黄色；超出则为红色。`,
              })}
            </p>
          )}

          {ficha.accao_vermelho && (
            <>
              <Rotulo className="mb-1 mt-4">
                {tr({
                  pt: 'Acção associada ao vermelho',
                  en: 'Action attached to red',
                  zh: '红色对应措施',
                })}
              </Rotulo>
              <p className="text-[12.5px] text-vermelho">{tr(ficha.accao_vermelho)}</p>
            </>
          )}
        </div>

        <div>
          <Rotulo className="mb-1">
            {tr({
              pt: 'Proveniência (§5.4)',
              en: 'Provenance (§5.4)',
              zh: '数据来源（§5.4）',
            })}
          </Rotulo>
          <p className="text-[12.5px] text-texto-2">
            {tr({
              pt: 'Formulários de origem',
              en: 'Source forms',
              zh: '来源表单',
            })}
            : {ficha.formularios_origem.join(', ')}
          </p>
          <p className="mt-1 text-[11.5px] text-texto-3">
            {tr({ pt: 'Campos', en: 'Fields', zh: '字段' })}: {tr(ficha.campos_utilizados)}
          </p>

          {valor && valor.proveniencia.length > 0 && (
            <p className="mt-2 text-[11.5px] text-texto-3">
              {tr({
                pt: `O valor actual abre até ${fmt.contagem(valor.proveniencia.length, 'registo primário', 'registos primários')}.`,
                en: `The current value opens down to ${fmt.contagem(valor.proveniencia.length, 'primary record', 'primary records')}.`,
                zh: `当前值可下钻至 ${fmt.inteiro(valor.proveniencia.length)} 条原始记录。`,
              })}
            </p>
          )}
          {valor?.ressalva && (
            <p className="mt-2 rounded-xl bg-ambar-pastel px-2.5 py-2 text-[11.5px] leading-snug text-ambar">
              {tr(valor.ressalva)}
            </p>
          )}

          <Rotulo className="mb-1 mt-4">
            {tr({ pt: 'Leitura', en: 'Reading', zh: '解读' })}
          </Rotulo>
          <Semaforo cor={leitura.cor} rotulo={tr(leitura.significado)} />
          <p className="mt-1.5 text-[11.5px] leading-snug text-texto-3">
            {tr(leitura.consequencia)}
          </p>

          {ficha.codigo === 'K-PRD-01' && (
            <p className="mt-3 text-[11px] text-texto-3">
              <Link to="/pesagens" className="text-texto hover:underline">
                {tr({
                  pt: 'Abrir as fichas F-07',
                  en: 'Open the F-07 sheets',
                  zh: '打开 F-07 单据',
                })}
              </Link>{' '}
              {tr({
                pt: 'que produzem este número.',
                en: 'that produce this number.',
                zh: '——它们产生了这个数字。',
              })}
            </p>
          )}
        </div>
      </div>
      {valor?.valor === undefined && (
        <div className="mt-4">
          <Vazio>
            {tr({
              pt: 'Sem valor no período. Cinzento é falha de processo: o registo devido não foi entregue, ou a meta ainda não foi fixada.',
              en: 'No value in the period. Grey is a process failure: either the record that was due was not submitted, or the target has not been set.',
              zh: '本期无取值。灰色意味着流程失效：要么应报的记录未提交，要么目标尚未设定。',
            })}
          </Vazio>
        </div>
      )}
    </div>
  );
}
