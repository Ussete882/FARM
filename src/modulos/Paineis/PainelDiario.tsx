/**
 * BASTET — painel diário do chefe de turma (§11.1).
 *
 * O ecrã responde a três perguntas, por esta ordem, e não a mais nenhuma:
 *
 *   1. Como correu o turno?        → três cartões, um deles preenchido a cor.
 *   2. Como tem corrido a semana?  → a tendência, sobre os registos entregues.
 *   3. O que tenho de resolver?    → as excepções, com etiqueta e acção.
 *
 * Os seis blocos do §11.1 continuam todos presentes — presenças, trabalho do
 * dia, produção, produtividade, bloqueios e segurança — mas arrumados por
 * prioridade de leitura. Um painel que mostra tudo ao mesmo nível não
 * responde: inventaria.
 */

import {
  CalendarCheck,
  Droplet,
  FileWarning,
  HardHat,
  Leaf,
  ShieldAlert,
  Sprout,
  TrendingDown,
  UserX,
  Wrench,
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import {
  jornasDoDia,
  relatoriosDoDia,
  ultimoDiaComRegistos,
  useCiclos,
  useJornas,
  useNomes,
  useOrdens,
  usePesagens,
  useRelatorios,
  useTalhoes,
} from '../../dados/consultas';
import { HOJE } from '../../dados/semente';
import { useFmt, useT } from '../../i18n/contexto';
import { COL, UI } from '../../i18n/comuns';
import type { T } from '../../i18n/nucleo';
import { INDICADOR_POR_CODIGO } from '../../dominio/indicadores';
import { ROTULO_BLOQUEIO, TIPO_OPERACAO_POR_CODIGO } from '../../dominio/operacoes';
import { cumprimentoDoDia, desempenhoDaEquipa, kCol04, kPrd01 } from '../../regras/calculos';
import { avaliar, type Cor } from '../../regras/semaforo';
import { Pagina, Seletor } from '../../design/Pagina';
import {
  Alerta,
  Barra,
  BarraMeta,
  CartaoMetrica,
  Codigo,
  corHex,
  GraficoArea,
  Painel,
  Semaforo,
  Tabela,
  Vazio,
} from '../../design/primitivas';

export function PainelDiario() {
  const tr = useT();
  const fmt = useFmt();
  const relatorios = useRelatorios();
  const jornas = useJornas();
  const pesagens = usePesagens();
  const ordens = useOrdens();
  const talhoes = useTalhoes();
  const ciclos = useCiclos();
  const nomes = useNomes();

  const ultimoDia = ultimoDiaComRegistos(relatorios);
  const [dia, setDia] = React.useState('');
  const [verTodaProdutividade, setVerTodaProdutividade] = React.useState(false);
  // Sem nenhum relatório entregue não há último dia, e o painel cai em hoje.
  // Um selector de data vazio não é «não há registos», é um ecrã avariado.
  const data = dia || ultimoDia || HOJE;

  const doDia = relatoriosDoDia(relatorios, data);
  const jornasHoje = jornasDoDia(jornas, data);

  // ---- 1. Como correu o turno -------------------------------------------
  const previsto = doDia.reduce((s, r) => s + r.efectivo_previsto, 0);
  const presente = doDia.reduce((s, r) => s + r.efectivo_presente, 0);
  const assiduidade = previsto > 0 ? (presente / previsto) * 100 : undefined;

  const cumprimentos = doDia.map(cumprimentoDoDia).filter((v): v is number => v !== undefined);
  const metaDoDia = cumprimentos.length
    ? cumprimentos.reduce((s, v) => s + v, 0) / cumprimentos.length
    : undefined;

  const corDoDia: Cor =
    metaDoDia === undefined
      ? 'cinzento'
      : metaDoDia >= 95
        ? 'verde'
        : metaDoDia >= 80
          ? 'ambar'
          : 'vermelho';

  const legendaDoDia: T =
    metaDoDia === undefined
      ? UI.semDados
      : metaDoDia >= 100
        ? { pt: 'Acima da meta', en: 'Above target', zh: '超出目标' }
        : metaDoDia >= 95
          ? { pt: 'Na meta', en: 'On target', zh: '达成目标' }
          : metaDoDia >= 80
            ? { pt: 'Em alerta', en: 'In alert', zh: '预警' }
            : { pt: 'Abaixo', en: 'Below', zh: '低于目标' };

  // ---- 2. A semana -------------------------------------------------------
  const dias = [...new Set(relatorios.map((r) => r.data))].sort();
  const serieCumprimento = dias.map((d) => {
    const v = relatoriosDoDia(relatorios, d)
      .map(cumprimentoDoDia)
      .filter((x): x is number => x !== undefined);
    return v.length ? v.reduce((s, x) => s + x, 0) / v.length : undefined;
  });
  const serieAssiduidade = dias.map((d) => {
    const rs = relatoriosDoDia(relatorios, d);
    const p = rs.reduce((s, r) => s + r.efectivo_previsto, 0);
    const q = rs.reduce((s, r) => s + r.efectivo_presente, 0);
    return p > 0 ? (q / p) * 100 : undefined;
  });

  // ---- 3. O que tenho de resolver ---------------------------------------
  const faltas = doDia.flatMap((r) => r.faltas);
  const injustificadas = faltas.filter((f) => f.motivo === 'falta_injustificada');
  const bloqueios = doDia.flatMap((r) => r.bloqueios.map((b) => ({ ...b, bloco: r.bloco })));
  const incidentes = doDia.reduce((s, r) => s + r.incidentes_seguranca, 0);
  const epiConforme = doDia.every((r) => r.epi_conforme);
  const semVisto = doDia.filter((r) => !r.visto_tecnico);

  const desempenho = desempenhoDaEquipa(jornasHoje);
  const abaixo = desempenho.filter((d) => d.abaixoLimiar);
  const visiveis = verTodaProdutividade
    ? [...desempenho].sort((a, b) => a.faceMediana - b.faceMediana)
    : abaixo;

  // A contagem tem de bater certo com a lista mostrada por baixo.
  const aResolver =
    incidentes +
    (epiConforme ? 0 : 1) +
    injustificadas.length +
    bloqueios.length +
    abaixo.length +
    semVisto.length;

  // ---- A campanha, como contexto ----------------------------------------
  const arvores = ciclos.reduce((s, c) => s + c.plantas_estabelecidas, 0);
  const rendimento = kPrd01({ pesagens, arvoresPlantadas: arvores });
  const esperadoTotal = ciclos.reduce((s, c) => s + c.producao_prevista.valor, 0);
  const realTotal = ciclos.reduce((s, c) => s + (c.producao_real?.valor ?? 0), 0);
  const realizacao = esperadoTotal > 0 ? (realTotal / esperadoTotal) * 100 : undefined;
  const rejeicao = kCol04(pesagens);

  const fichaPrd03 = INDICADOR_POR_CODIGO.get('K-PRD-03')!;
  const fichaCol04 = INDICADOR_POR_CODIGO.get('K-COL-04')!;
  const fichaPes03 = INDICADOR_POR_CODIGO.get('K-PES-03')!;

  const piores = [...ciclos]
    .map((c) => ({
      ciclo: c,
      kgArvore: (c.producao_real?.valor ?? 0) / c.plantas_estabelecidas,
      realizacao:
        c.producao_prevista.valor > 0
          ? ((c.producao_real?.valor ?? 0) / c.producao_prevista.valor) * 100
          : undefined,
    }))
    .sort((a, b) => (a.realizacao ?? 0) - (b.realizacao ?? 0));

  const diasSelector = [...dias].reverse().slice(0, 14);

  if (doDia.length === 0) {
    return (
      <Pagina accoes={<SeletorDia data={data} setDia={setDia} dias={diasSelector} />}>
        <Painel>
          <Vazio>
            {tr({
              pt: `Sem relatório diário de campo para ${fmt.data(data)}. O F-05 é entregue antes do fim do turno, sem excepção.`,
              en: `No daily field report for ${fmt.data(data)}. The F-05 is submitted before the end of the shift, without exception.`,
              zh: `${fmt.data(data)} 无田间日报。F-05 必须在班次结束前提交，概不例外。`,
            })}
          </Vazio>
        </Painel>
      </Pagina>
    );
  }

  return (
    <Pagina accoes={<SeletorDia data={data} setDia={setDia} dias={diasSelector} />}>
      {/* ================= 1. Como correu o turno ================= */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <CartaoMetrica
          destaque
          icone={Sprout}
          cor={corDoDia}
          rotulo={tr({
            pt: 'Meta do dia',
            en: 'Target of the day',
            zh: '当日目标',
          })}
          valor={metaDoDia === undefined ? '—' : fmt.numero(metaDoDia, 0)}
          unidade="%"
          legenda={tr(legendaDoDia)}
          frase={tr({
            pt: `${fmt.contagem(doDia.length, 'relatório F-05 entregue', 'relatórios F-05 entregues')}, ${doDia.flatMap((r) => r.talhoes).length} talhões trabalhados. É a média das metas do dia.`,
            en: `${fmt.contagem(doDia.length, 'F-05 report submitted', 'F-05 reports submitted')}, ${doDia.flatMap((r) => r.talhoes).length} plots worked. It is the average of the day’s targets.`,
            zh: `已提交 ${fmt.inteiro(doDia.length)} 份 F-05 日报，作业地块 ${doDia.flatMap((r) => r.talhoes).length} 个。此为当日各目标的平均值。`,
          })}
          abaixo={
            <BarraMeta
              claro
              valor={metaDoDia}
              meta={100}
              maximo={130}
              cor={corDoDia}
              rotuloValor={metaDoDia === undefined ? '—' : fmt.percentagem(metaDoDia)}
              rotuloMeta="100%"
            />
          }
        />

        <CartaoMetrica
          icone={CalendarCheck}
          cor={avaliar(assiduidade, fichaPes03).cor}
          rotulo={tr({ pt: 'Presenças', en: 'Attendance', zh: '出勤' })}
          valor={`${presente}/${previsto}`}
          legenda={fmt.percentagem(assiduidade, 0)}
          codigo="K-PES-03"
          frase={
            faltas.length === 0
              ? tr({
                  pt: 'Efectivo completo no turno.',
                  en: 'Full headcount on shift.',
                  zh: '本班人员齐全。',
                })
              : tr({
                  pt: `${fmt.contagem(faltas.length, 'ausência', 'ausências')}, ${fmt.contagem(injustificadas.length, 'injustificada', 'injustificadas')}. Meta de assiduidade: 95%.`,
                  en: `${fmt.contagem(faltas.length, 'absence', 'absences')}, ${fmt.contagem(injustificadas.length, 'unexcused', 'unexcused')}. Attendance target: 95%.`,
                  zh: `缺勤 ${fmt.inteiro(faltas.length)} 人次，其中旷工 ${fmt.inteiro(injustificadas.length)} 人次。出勤率目标：95%。`,
                })
          }
          para="/jornas"
        />

        <CartaoMetrica
          icone={Leaf}
          cor={avaliar(realizacao, fichaPrd03).cor}
          rotulo={tr({
            pt: 'Realização do potencial',
            en: 'Potential realisation',
            zh: '潜力实现率',
          })}
          valor={realizacao === undefined ? '—' : fmt.numero(realizacao, 1)}
          unidade="%"
          codigo="K-PRD-03"
          frase={tr({
            pt: `${fmt.numero(realTotal / 1000, 2)} t de ${fmt.numero(esperadoTotal / 1000, 1)} t esperadas pela curva de referência. Partida do diagnóstico: 24,9%.`,
            en: `${fmt.numero(realTotal / 1000, 2)} t of the ${fmt.numero(esperadoTotal / 1000, 1)} t expected from the reference curve. Diagnosis baseline: 24.9%.`,
            zh: `实际 ${fmt.numero(realTotal / 1000, 2)} 吨，基准曲线应为 ${fmt.numero(esperadoTotal / 1000, 1)} 吨。诊断起点：24.9%。`,
          })}
          para="/indicadores"
        />
      </div>

      {/* ================= 2. A semana ================= */}
      <Painel
        titulo={tr({
          pt: 'Tendência dos últimos registos',
          en: 'Trend across the latest records',
          zh: '最近记录的趋势',
        })}
        descricao={tr({
          pt: 'Cumprimento da meta e assiduidade, dia a dia, a partir dos F-05 entregues.',
          en: 'Target fulfilment and attendance, day by day, from the F-05 reports submitted.',
          zh: '基于已提交的 F-05 日报，逐日展示目标完成率与出勤率。',
        })}
        accao={
          <Link
            to="/relatorios"
            className="botao-abrir"
            title={tr({
              pt: 'Abrir relatórios diários',
              en: 'Open daily reports',
              zh: '打开日报',
            })}
          >
            <span className="text-[15px] leading-none">↗</span>
          </Link>
        }
      >
        <GraficoArea
          etiquetas={dias.map((d) => fmt.dataCurta(d))}
          maximo={130}
          series={[
            {
              nome: tr({
                pt: 'Cumprimento da meta',
                en: 'Target fulfilment',
                zh: '目标完成率',
              }),
              cor: corHex('verde'),
              valores: serieCumprimento,
            },
            {
              nome: tr({ pt: 'Assiduidade', en: 'Attendance', zh: '出勤率' }),
              cor: corHex('ambar'),
              valores: serieAssiduidade,
            },
          ]}
        />
      </Painel>

      {/* ================= 3. O que tenho de resolver ================= */}
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Painel
          titulo={
            aResolver === 0
              ? tr({
                  pt: 'Nada por resolver hoje',
                  en: 'Nothing to resolve today',
                  zh: '今日无待办事项',
                })
              : tr({
                  pt: `${fmt.contagem(aResolver, 'ponto', 'pontos')} por resolver hoje`,
                  en: `${fmt.contagem(aResolver, 'item', 'items')} to resolve today`,
                  zh: `今日 ${fmt.inteiro(aResolver)} 项待办`,
                })
          }
          denso
        >
          {aResolver === 0 ? (
            <Vazio>
              {tr({
                pt: 'Turno sem excepções.',
                en: 'Shift with no exceptions.',
                zh: '本班无例外项。',
              })}
            </Vazio>
          ) : (
            <ul className="flex flex-col gap-2 px-5 pb-5">
              {incidentes > 0 && (
                <Alerta
                  cor="vermelho"
                  icone={ShieldAlert}
                  etiqueta={tr({ pt: 'Segurança', en: 'Safety', zh: '安全' })}
                  titulo={tr({
                    pt: fmt.contagem(incidentes, 'incidente de segurança', 'incidentes de segurança'),
                    en: fmt.contagem(incidentes, 'safety incident', 'safety incidents'),
                    zh: `${fmt.inteiro(incidentes)} 起安全事件`,
                  })}
                  detalhe={tr({
                    pt: 'Escala de imediato a Recursos Humanos e à Direcção Executiva',
                    en: 'Escalates at once to Human Resources and the Executive Board',
                    zh: '立即上报人力资源部门与执行层',
                  })}
                />
              )}
              {!epiConforme && (
                <Alerta
                  cor="ambar"
                  icone={HardHat}
                  etiqueta={tr({ pt: 'EPI', en: 'PPE', zh: '防护' })}
                  titulo={tr({
                    pt: 'Equipamento de protecção com falhas',
                    en: 'Protective equipment with gaps',
                    zh: '防护装备存在缺陷',
                  })}
                  detalhe={tr({
                    pt: 'A cobertura de EPI tem meta de 100%',
                    en: 'PPE coverage has a 100% target',
                    zh: '防护装备覆盖率目标为 100%',
                  })}
                />
              )}
              {injustificadas.map((f) => (
                <Alerta
                  key={f.trabalhador}
                  cor="vermelho"
                  icone={UserX}
                  etiqueta={tr({ pt: 'Falta', en: 'Absence', zh: '缺勤' })}
                  titulo={tr({
                    pt: `Falta injustificada · ${nomes.get(f.trabalhador) ?? f.trabalhador}`,
                    en: `Unexcused absence · ${nomes.get(f.trabalhador) ?? f.trabalhador}`,
                    zh: `旷工 · ${nomes.get(f.trabalhador) ?? f.trabalhador}`,
                  })}
                  detalhe={f.trabalhador}
                  para={`/trabalhadores/${f.trabalhador}`}
                />
              ))}
              {bloqueios.map((b, i) => (
                <Alerta
                  key={i}
                  cor="ambar"
                  icone={Wrench}
                  etiqueta={
                    b.horas_perdidas !== undefined
                      ? `${fmt.numero(b.horas_perdidas, 1)} ${fmt.unidade('h')}`
                      : tr({ pt: 'Bloqueio', en: 'Blocker', zh: '阻碍' })
                  }
                  titulo={`${tr(ROTULO_BLOQUEIO[b.tipo_bloqueio])} · ${b.bloco}`}
                  detalhe={b.descricao}
                />
              ))}
              {abaixo.map((d) => (
                <Alerta
                  key={d.trabalhador}
                  cor="ambar"
                  icone={TrendingDown}
                  etiqueta={fmt.percentagem(d.faceMediana * 100, 0)}
                  titulo={tr({
                    pt: `${nomes.get(d.trabalhador) ?? d.trabalhador} abaixo da mediana da equipa`,
                    en: `${nomes.get(d.trabalhador) ?? d.trabalhador} below the team median`,
                    zh: `${nomes.get(d.trabalhador) ?? d.trabalhador} 低于班组中位数`,
                  })}
                  detalhe={tr({
                    pt: 'Excepção W03 — pede uma explicação, não uma sanção',
                    en: 'Exception W03 — it asks for an explanation, not a sanction',
                    zh: '例外 W03——需要解释，而非处罚',
                  })}
                  para={`/trabalhadores/${d.trabalhador}`}
                />
              ))}
              {semVisto.map((r) => (
                <Alerta
                  key={r.codigo}
                  cor="cinzento"
                  icone={FileWarning}
                  etiqueta={tr({
                    pt: 'Sem visto',
                    en: 'Not countersigned',
                    zh: '未签阅',
                  })}
                  titulo={tr({
                    pt: `Relatório ${r.bloco} sem visto do técnico`,
                    en: `Report ${r.bloco} without the supervisor’s countersignature`,
                    zh: `${r.bloco} 区日报缺主管签阅`,
                  })}
                  detalhe={tr({
                    pt: 'O visto fecha o circuito de dupla assinatura',
                    en: 'The countersignature closes the two-signature loop',
                    zh: '签阅闭合了双签回路',
                  })}
                  para={`/relatorios/${r.codigo}`}
                />
              ))}
            </ul>
          )}
        </Painel>

        <div className="flex flex-col gap-4">
          <Painel
            titulo={tr({
              pt: 'Trabalho do dia',
              en: 'Work of the day',
              zh: '当日作业',
            })}
            denso
          >
            <div className="flex flex-col gap-2 px-5 pb-5">
              {doDia.map((r) => {
                const ot = ordens.find((o) => o.codigo === r.ordens_trabalho[0]);
                const c = cumprimentoDoDia(r);
                const cor: Cor =
                  c === undefined ? 'cinzento' : c >= 95 ? 'verde' : c >= 80 ? 'ambar' : 'vermelho';
                return (
                  <div key={r.codigo} className="bloco px-4 py-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[14px] font-semibold text-texto">
                        {(() => {
                          const tipo = ot && TIPO_OPERACAO_POR_CODIGO.get(ot.tipo_operacao);
                          return tipo ? tr(tipo.designacao) : r.designacao;
                        })()}
                      </span>
                      <Semaforo cor={cor} rotulo={c === undefined ? '—' : fmt.percentagem(c)} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[12px] text-texto-3">
                      <Codigo>{r.talhoes.join(', ')}</Codigo>
                      <span>
                        {tr({
                          pt: `${fmt.quantidade(r.quantidade_realizada)} de ${fmt.quantidade(r.meta_dia)}`,
                          en: `${fmt.quantidade(r.quantidade_realizada)} of ${fmt.quantidade(r.meta_dia)}`,
                          zh: `${fmt.quantidade(r.quantidade_realizada)} / ${fmt.quantidade(r.meta_dia)}`,
                        })}
                      </span>
                      <span>
                        {tr({
                          pt: fmt.contagem(r.efectivo_presente, 'pessoa', 'pessoas'),
                          en: fmt.contagem(r.efectivo_presente, 'person', 'people'),
                          zh: `${fmt.inteiro(r.efectivo_presente)} 人`,
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Painel>

          <Painel
            titulo={tr({
              pt: 'Produtividade individual',
              en: 'Individual productivity',
              zh: '个人生产率',
            })}
            denso
            accao={
              desempenho.length > abaixo.length && (
                <button
                  onClick={() => setVerTodaProdutividade((v) => !v)}
                  className="ligacao text-[12px]"
                >
                  {verTodaProdutividade
                    ? tr({
                        pt: 'só as excepções',
                        en: 'exceptions only',
                        zh: '仅看例外',
                      })
                    : tr({
                        pt: `ver todas (${desempenho.length})`,
                        en: `see all (${desempenho.length})`,
                        zh: `查看全部（${desempenho.length}）`,
                      })}
                </button>
              )
            }
          >
            {visiveis.length === 0 ? (
              <Vazio>
                {tr({
                  pt: 'Ninguém abaixo de 60% da mediana da equipa.',
                  en: 'Nobody below 60% of the team median.',
                  zh: '无人低于班组中位数的 60%。',
                })}
              </Vazio>
            ) : (
              <Tabela
                linhas={visiveis}
                chave={(d) => `${d.grupo}-${d.trabalhador}`}
                colunas={[
                  {
                    chave: 'trab',
                    cabecalho: tr(COL.trabalhador),
                    render: (d) => (
                      <Link to={`/trabalhadores/${d.trabalhador}`} className="ligacao">
                        {nomes.get(d.trabalhador) ?? d.trabalhador}
                      </Link>
                    ),
                  },
                  {
                    chave: 'prod',
                    cabecalho: tr({ pt: 'Produção', en: 'Output', zh: '产量' }),
                    numerica: true,
                    render: (d) => fmt.quantidade(d.producao, 2),
                  },
                  {
                    chave: 'med',
                    cabecalho: tr({ pt: 'Mediana', en: 'Median', zh: '中位数' }),
                    numerica: true,
                    render: (d) => <span className="text-texto-3">{fmt.numero(d.mediana, 2)}</span>,
                  },
                  {
                    chave: 'face',
                    cabecalho: tr({
                      pt: 'Face à mediana',
                      en: 'Against median',
                      zh: '与中位数之比',
                    }),
                    numerica: true,
                    render: (d) => (
                      <Semaforo
                        cor={d.abaixoLimiar ? 'vermelho' : d.faceMediana < 0.85 ? 'ambar' : 'verde'}
                        rotulo={fmt.percentagem(d.faceMediana * 100, 0)}
                      />
                    ),
                  },
                ]}
              />
            )}
          </Painel>
        </div>
      </div>

      {/* ================= A campanha, como contexto ================= */}
      <Painel
        titulo={tr({
          pt: 'Onde é que se perde',
          en: 'Where it is being lost',
          zh: '产量损失在哪里',
        })}
        descricao={tr({
          pt: `Realização por talhão na campanha 2025/26 — ${fmt.numero(rendimento.valor ?? 0, 2)} kg por árvore em ${fmt.inteiro(arvores)} árvores.`,
          en: `Realisation per plot in the 2025/26 season — ${fmt.numero(rendimento.valor ?? 0, 2)} kg per tree across ${fmt.inteiro(arvores)} trees.`,
          zh: `2025/26 生产季各地块实现率——${fmt.inteiro(arvores)} 棵树，单株 ${fmt.numero(rendimento.valor ?? 0, 2)} 公斤。`,
        })}
        accao={
          <Link to="/talhoes" className="ligacao text-[12px]">
            {tr({
              pt: `todos os ${ciclos.length} talhões`,
              en: `all ${ciclos.length} plots`,
              zh: `全部 ${ciclos.length} 个地块`,
            })}
          </Link>
        }
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <ul className="flex flex-col gap-3.5">
            {piores.slice(0, 6).map(({ ciclo, kgArvore, realizacao: r }) => {
              const talhao = talhoes.find((t) => t.codigo === ciclo.talhao);
              const cor: Cor =
                r === undefined ? 'cinzento' : r >= 80 ? 'verde' : r >= 60 ? 'ambar' : 'vermelho';
              return (
                <li
                  key={ciclo.codigo}
                  className="grid grid-cols-[minmax(0,170px)_1fr_132px] items-center gap-4"
                >
                  <Link to={`/talhoes/${ciclo.talhao}`} className="min-w-0 truncate">
                    <span className="text-[13px] font-medium text-texto">{talhao?.designacao}</span>{' '}
                    <Codigo>{ciclo.talhao}</Codigo>
                  </Link>
                  {/* A marca dos 80% é o que transforma «seis barras curtas» em
                      «seis barras longe da meta». */}
                  <div className="relative">
                    <Barra fraccao={(r ?? 0) / 100} cor={cor} />
                    <div
                      className="absolute -top-1 h-3.5 w-px bg-texto-3"
                      style={{ left: '80%' }}
                      title={`${tr(COL.meta)}: 80%`}
                    />
                  </div>
                  <span className="num text-right text-[12.5px] text-texto-2">
                    {fmt.numero(kgArvore, 2)} {fmt.unidade('kg_arvore')} ·{' '}
                    <span className={cor === 'vermelho' ? 'font-semibold text-vermelho' : ''}>
                      {fmt.percentagem(r)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col gap-5">
            <div>
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <span className="text-[12.5px] text-texto-2">
                  {tr({
                    pt: 'Rejeição em triagem',
                    en: 'Rejection at sorting',
                    zh: '分选剔除率',
                  })}
                </span>
                <span className="display num text-[22px] text-ambar">
                  {fmt.percentagem(rejeicao.valor)}
                </span>
              </div>
              <BarraMeta
                valor={rejeicao.valor}
                meta={6}
                maximo={12}
                cor={avaliar(rejeicao.valor, fichaCol04).cor}
                rotuloValor={fmt.percentagem(rejeicao.valor)}
                rotuloMeta="6%"
                menorEhMelhor
              />
            </div>

            <p className="border-t border-fio pt-4 text-[12.5px] leading-relaxed text-texto-3">
              {tr({
                pt: `O pior talhão dá ${fmt.numero(piores[0]?.kgArvore ?? 0, 2)} kg por árvore contra ${fmt.numero(piores.at(-1)?.kgArvore ?? 0, 2)} do melhor — cinco vezes menos, no mesmo bloco e com a mesma idade.`,
                en: `The worst plot gives ${fmt.numero(piores[0]?.kgArvore ?? 0, 2)} kg per tree against ${fmt.numero(piores.at(-1)?.kgArvore ?? 0, 2)} for the best — five times less, in the same block and at the same age.`,
                zh: `最差地块单株 ${fmt.numero(piores[0]?.kgArvore ?? 0, 2)} 公斤，最好的为 ${fmt.numero(piores.at(-1)?.kgArvore ?? 0, 2)} 公斤——相差五倍，而两者同区、同龄。`,
              })}
            </p>

            <Link
              to="/pesagens"
              className="bloco flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-bloco-2"
            >
              <span className="flex items-center gap-2.5 text-[13px] font-medium text-texto">
                <Droplet className="size-4 text-texto-3" />
                {tr({
                  pt: `${pesagens.length} fichas de pesagem F-07`,
                  en: `${pesagens.length} F-07 weighing sheets`,
                  zh: `${pesagens.length} 张 F-07 称重单`,
                })}
              </span>
              <span className="text-[15px] leading-none text-texto-3">↗</span>
            </Link>
          </div>
        </div>
      </Painel>
    </Pagina>
  );
}

function SeletorDia({
  data,
  setDia,
  dias,
}: {
  data: string;
  setDia: (d: string) => void;
  dias: string[];
}) {
  const tr = useT();
  const fmt = useFmt();
  const opcoes = dias.length > 0 ? dias : [data];
  return (
    <Seletor value={data} onChange={setDia}>
      {opcoes.map((d) => (
        <option key={d} value={d}>
          {fmt.diaDaSemana(d)}, {fmt.data(d)}
          {d === HOJE ? ` · ${tr(UI.hoje)}` : ''}
        </option>
      ))}
    </Seletor>
  );
}
