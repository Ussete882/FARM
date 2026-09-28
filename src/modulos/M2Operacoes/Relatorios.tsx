/**
 * M2 — Relatório diário de campo (F-05).
 *
 * §3.1, nível 4: «O relatório diário de campo é entregue antes do fim do
 * turno. Sem excepção. É a fonte primária de quase todos os indicadores
 * operacionais.» Por isso o ecrã abre com a taxa de cumprimento à vista.
 */

import { FileCheck, FileText, Plus, Wrench } from 'lucide-react';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useNomes, useOrdens, useRelatorios } from '../../dados/consultas';
import { HOJE } from '../../dados/semente';
import { useFmt, useT } from '../../i18n/contexto';
import { COL } from '../../i18n/comuns';
import { PERFIL_FONTE } from '../../dominio/canonico';
import { INDICADOR_POR_CODIGO } from '../../dominio/indicadores';
import {
  ROTULO_BLOQUEIO,
  ROTULO_FALTA,
  ROTULO_METEO,
  TIPO_OPERACAO_POR_CODIGO,
} from '../../dominio/operacoes';
import { cumprimentoDoDia, kGov01 } from '../../regras/calculos';
import { avaliar } from '../../regras/semaforo';
import { validarRelatorioDiario } from '../../regras/validacao';
import { FichaObjecto } from '../../design/FichaObjecto';
import { Botao, ListaDetalhe, Pagina } from '../../design/Pagina';
import {
  CartaoMetrica,
  Codigo,
  Constatacoes,
  Painel,
  Rotulo,
  Semaforo,
  Tabela,
} from '../../design/primitivas';
import { FormularioF05 } from './FormularioF05';

export function Relatorios() {
  const tr = useT();
  const fmt = useFmt();
  const { codigo } = useParams();
  const navegar = useNavigate();
  const relatorios = useRelatorios();
  const ordens = useOrdens();
  const nomes = useNomes();
  const [aPreencher, setAPreencher] = React.useState(false);

  const seleccionado = relatorios.find((r) => r.codigo === codigo);

  // Dois blocos × dias úteis das últimas duas semanas = registos devidos.
  const dias = [...new Set(relatorios.map((r) => r.data))];
  const devidos = dias.length * 2;
  const cumprimento = kGov01(devidos, relatorios.length);
  const fichaGov01 = INDICADOR_POR_CODIGO.get('K-GOV-01')!;

  const comVisto = relatorios.filter((r) => r.visto_tecnico).length;
  const bloqueiosTotais = relatorios.reduce((s, r) => s + r.bloqueios.length, 0);

  return (
    <Pagina
      accoes={
        !aPreencher && (
          <Botao variante="primario" onClick={() => setAPreencher(true)}>
            <Plus className="size-3.5" />
            {tr({ pt: 'Preencher F-05', en: 'Fill in F-05', zh: '填写 F-05' })}
          </Botao>
        )
      }
    >
      {aPreencher && (
        <div className="cartao overflow-hidden">
          <FormularioF05 aoFechar={() => setAPreencher(false)} />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <CartaoMetrica
          destaque
          icone={FileText}
          cor={avaliar(cumprimento.valor, fichaGov01).cor}
          rotulo={tr({
            pt: 'Cumprimento de registo',
            en: 'Record compliance',
            zh: '记录完成率',
          })}
          valor={cumprimento.valor === undefined ? '—' : fmt.numero(cumprimento.valor, 0)}
          unidade="%"
          legenda="K-GOV-01"
          frase={tr({
            pt: `${relatorios.length} de ${devidos} registos devidos, em ${dias.length} dias. O critério de saída da Fase 1 é 90% durante quatro semanas seguidas.`,
            en: `${relatorios.length} of ${devidos} records due, over ${dias.length} days. The Phase 1 exit criterion is 90% for four consecutive weeks.`,
            zh: `${dias.length} 天内应报 ${devidos} 份，已报 ${relatorios.length} 份。第一阶段验收标准为连续四周达到 90%。`,
          })}
        />

        <CartaoMetrica
          icone={FileCheck}
          cor={comVisto === relatorios.length ? 'verde' : 'ambar'}
          rotulo={tr({
            pt: 'Com visto do técnico',
            en: 'Countersigned by the supervisor',
            zh: '已经主管签阅',
          })}
          valor={`${comVisto}/${relatorios.length}`}
          frase={tr({
            pt: 'O visto do técnico encarregado fecha o circuito de dupla assinatura — é o que dá fiabilidade média-alta ao registo (§5.5).',
            en: 'The field supervisor’s countersignature closes the two-signature loop — that is what gives the record medium-high reliability (§5.5).',
            zh: '现场技术主管的签阅闭合了双签回路——这正是记录具备中高可靠性的原因（§5.5）。',
          })}
        />

        <CartaoMetrica
          icone={Wrench}
          cor={bloqueiosTotais > 0 ? 'ambar' : 'verde'}
          rotulo={tr({
            pt: 'Bloqueios registados',
            en: 'Blockers recorded',
            zh: '已登记阻碍',
          })}
          valor={fmt.inteiro(bloqueiosTotais)}
          frase={tr({
            pt: 'Falta de material, avaria ou meteorologia assinalados nos relatórios do período.',
            en: 'Missing materials, breakdowns or weather flagged in the period’s reports.',
            zh: '本期日报中标注的物资短缺、设备故障或天气因素。',
          })}
        />
      </div>

      <ListaDetalhe
        semSeleccao={tr({
          pt: 'Escolha um relatório para abrir a ficha F-05.',
          en: 'Pick a report to open its F-05 sheet.',
          zh: '选择一份日报以打开 F-05 表单。',
        })}
        lista={
          <Painel
            titulo={tr({
              pt: `${relatorios.length} relatórios`,
              en: `${relatorios.length} reports`,
              zh: `${relatorios.length} 份日报`,
            })}
            denso
          >
            <Tabela
              linhas={[...relatorios].sort((a, b) => (a.data < b.data ? 1 : -1))}
              chave={(r) => r.codigo}
              activa={(r) => r.codigo === codigo}
              aoClicar={(r) => navegar(`/relatorios/${r.codigo}`)}
              colunas={[
                {
                  chave: 'data',
                  cabecalho: tr(COL.data),
                  render: (r) => (
                    <span className="num">
                      {fmt.data(r.data)}
                      <span className="ml-2 text-[11px] text-texto-3">{fmt.diaDaSemana(r.data)}</span>
                    </span>
                  ),
                  ordenarPor: (r) => r.data,
                },
                {
                  chave: 'bloco',
                  cabecalho: tr(COL.bloco),
                  render: (r) => <Codigo forte>{r.bloco}</Codigo>,
                },
                {
                  chave: 'tarefa',
                  cabecalho: tr({ pt: 'Tarefa', en: 'Task', zh: '作业' }),
                  render: (r) => {
                    const ot = ordens.find((o) => o.codigo === r.ordens_trabalho[0]);
                    const tipo = ot && TIPO_OPERACAO_POR_CODIGO.get(ot.tipo_operacao);
                    return (
                      <span className="text-texto-2">{tipo ? tr(tipo.designacao) : '—'}</span>
                    );
                  },
                },
                {
                  chave: 'efectivo',
                  cabecalho: tr({ pt: 'Efectivo', en: 'Headcount', zh: '出勤人数' }),
                  numerica: true,
                  render: (r) => (
                    <span className={r.efectivo_presente < r.efectivo_previsto ? 'text-ambar' : ''}>
                      {r.efectivo_presente}/{r.efectivo_previsto}
                    </span>
                  ),
                },
                {
                  chave: 'cumprimento',
                  cabecalho: tr({
                    pt: 'Meta do dia',
                    en: 'Target of the day',
                    zh: '当日目标',
                  }),
                  numerica: true,
                  render: (r) => {
                    const c = cumprimentoDoDia(r);
                    if (c === undefined) return <Semaforo cor="cinzento" rotulo="—" />;
                    return (
                      <Semaforo
                        cor={c >= 95 ? 'verde' : c >= 80 ? 'ambar' : 'vermelho'}
                        rotulo={fmt.percentagem(c)}
                      />
                    );
                  },
                  ordenarPor: (r) => cumprimentoDoDia(r) ?? 0,
                },
                {
                  chave: 'bloqueios',
                  cabecalho: tr({ pt: 'Bloqueios', en: 'Blockers', zh: '阻碍' }),
                  numerica: true,
                  render: (r) =>
                    r.bloqueios.length === 0 ? (
                      <span className="text-texto-3">—</span>
                    ) : (
                      <Semaforo cor="ambar" rotulo={String(r.bloqueios.length)} />
                    ),
                },
                {
                  chave: 'seguranca',
                  cabecalho: tr({ pt: 'Segurança', en: 'Safety', zh: '安全' }),
                  numerica: true,
                  render: (r) =>
                    r.incidentes_seguranca > 0 ? (
                      <Semaforo
                        cor="vermelho"
                        rotulo={tr({
                          pt: fmt.contagem(r.incidentes_seguranca, 'incidente', 'incidentes'),
                          en: fmt.contagem(r.incidentes_seguranca, 'incident', 'incidents'),
                          zh: `${fmt.inteiro(r.incidentes_seguranca)} 起事件`,
                        })}
                      />
                    ) : (
                      <Semaforo
                        cor="verde"
                        rotulo={tr({
                          pt: 'sem incidentes',
                          en: 'no incidents',
                          zh: '无事件',
                        })}
                      />
                    ),
                },
                {
                  chave: 'visto',
                  cabecalho: tr({ pt: 'Visto', en: 'Countersign', zh: '签阅' }),
                  render: (r) =>
                    r.visto_tecnico ? (
                      <Codigo>{r.visto_tecnico}</Codigo>
                    ) : (
                      <Semaforo
                        cor="ambar"
                        rotulo={tr({ pt: 'em falta', en: 'missing', zh: '缺失' })}
                      />
                    ),
                },
              ]}
            />
          </Painel>
        }
        detalhe={seleccionado ? <FichaRelatorio relatorio={seleccionado} nomes={nomes} ordens={ordens} /> : null}
      />
    </Pagina>
  );
}

function FichaRelatorio({
  relatorio,
  nomes,
  ordens,
}: {
  relatorio: ReturnType<typeof useRelatorios>[number];
  nomes: Map<string, string>;
  ordens: ReturnType<typeof useOrdens>;
}) {
  const tr = useT();
  const fmt = useFmt();
  const validacao = validarRelatorioDiario(relatorio, HOJE);
  const ot = ordens.find((o) => o.codigo === relatorio.ordens_trabalho[0]);
  const cumprimento = cumprimentoDoDia(relatorio);

  return (
    <FichaObjecto
      objecto={relatorio}
      nomeDono={nomes.get(relatorio.dono)}
      subtitulo={tr({
        pt: `${fmt.diaDaSemana(relatorio.data)}, ${fmt.dataExtenso(relatorio.data)} · turno ${relatorio.turno} · ${relatorio.hora_inicio} às ${relatorio.hora_fim}`,
        en: `${fmt.diaDaSemana(relatorio.data)}, ${fmt.dataExtenso(relatorio.data)} · shift ${relatorio.turno} · ${relatorio.hora_inicio} to ${relatorio.hora_fim}`,
        zh: `${fmt.dataExtenso(relatorio.data)}（${fmt.diaDaSemana(relatorio.data)}） · ${relatorio.turno} 班 · ${relatorio.hora_inicio} 至 ${relatorio.hora_fim}`,
      })}
      grupos={[
        {
          titulo: tr({ pt: 'Trabalho', en: 'Work', zh: '作业' }),
          campos: [
            { rotulo: tr(COL.bloco), valor: <Codigo forte>{relatorio.bloco}</Codigo> },
            {
              rotulo: tr({ pt: 'Talhões', en: 'Plots', zh: '地块' }),
              valor: <Codigo forte>{relatorio.talhoes.join(', ')}</Codigo>,
            },
            {
              rotulo: tr({ pt: 'Ordem de trabalho', en: 'Work order', zh: '工单' }),
              valor: <Codigo forte>{relatorio.ordens_trabalho.join(', ')}</Codigo>,
            },
            {
              rotulo: tr({ pt: 'Tarefa', en: 'Task', zh: '作业内容' }),
              valor: (() => {
                const tipo = ot && TIPO_OPERACAO_POR_CODIGO.get(ot.tipo_operacao);
                return tipo ? tr(tipo.designacao) : '—';
              })(),
            },
            {
              rotulo: tr({ pt: 'Meta do dia', en: 'Target of the day', zh: '当日目标' }),
              valor: fmt.quantidade(relatorio.meta_dia),
            },
            {
              rotulo: tr({ pt: 'Realizado', en: 'Achieved', zh: '实际完成' }),
              valor: fmt.quantidade(relatorio.quantidade_realizada),
            },
            {
              rotulo: tr({ pt: 'Cumprimento', en: 'Fulfilment', zh: '完成率' }),
              valor:
                cumprimento === undefined ? (
                  '—'
                ) : (
                  <Semaforo
                    cor={cumprimento >= 95 ? 'verde' : cumprimento >= 80 ? 'ambar' : 'vermelho'}
                    rotulo={fmt.percentagem(cumprimento)}
                  />
                ),
            },
            {
              rotulo: tr({ pt: 'Condições', en: 'Conditions', zh: '天气' }),
              valor: tr(ROTULO_METEO[relatorio.condicoes_meteorologicas]),
            },
          ],
        },
        {
          titulo: tr({ pt: 'Pessoas', en: 'People', zh: '人员' }),
          campos: [
            {
              rotulo: tr({
                pt: 'Efectivo previsto',
                en: 'Planned headcount',
                zh: '计划人数',
              }),
              valor: String(relatorio.efectivo_previsto),
            },
            {
              rotulo: tr({
                pt: 'Efectivo presente',
                en: 'Actual headcount',
                zh: '实到人数',
              }),
              valor: String(relatorio.efectivo_presente),
            },
            {
              rotulo: tr({ pt: 'Chefe de turma', en: 'Shift leader', zh: '班组长' }),
              valor: nomes.get(relatorio.chefe_turma) ?? relatorio.chefe_turma,
            },
            {
              rotulo: tr({
                pt: 'Visto do técnico',
                en: 'Supervisor countersign',
                zh: '主管签阅',
              }),
              valor: relatorio.visto_tecnico
                ? (nomes.get(relatorio.visto_tecnico) ?? relatorio.visto_tecnico)
                : tr({ pt: 'Em falta', en: 'Missing', zh: '缺失' }),
            },
          ],
        },
        {
          titulo: tr({ pt: 'Segurança', en: 'Safety', zh: '安全' }),
          campos: [
            {
              rotulo: tr({ pt: 'Incidentes', en: 'Incidents', zh: '事件' }),
              valor: String(relatorio.incidentes_seguranca),
            },
            {
              rotulo: tr({
                pt: 'Equipamento de protecção',
                en: 'Protective equipment',
                zh: '防护装备',
              }),
              valor: (
                <Semaforo
                  cor={relatorio.epi_conforme ? 'verde' : 'ambar'}
                  rotulo={
                    relatorio.epi_conforme
                      ? tr({ pt: 'Conforme', en: 'Compliant', zh: '合规' })
                      : tr({ pt: 'Com falhas', en: 'With gaps', zh: '有缺陷' })
                  }
                />
              ),
            },
            {
              rotulo: tr({
                pt: 'Fonte de dados',
                en: 'Data source',
                zh: '数据来源',
              }),
              valor: tr(PERFIL_FONTE.registo_duas_assinaturas.rotulo),
            },
          ],
        },
      ]}
      extra={
        <div className="flex flex-col gap-5">
          {relatorio.faltas.length > 0 && (
            <section>
              <Rotulo className="mb-2">
                {tr({ pt: 'Faltas', en: 'Absences', zh: '缺勤' })}
              </Rotulo>
              <ul className="divide-y divide-fio">
                {relatorio.faltas.map((f, i) => (
                  <li key={i} className="flex items-baseline gap-3 py-2">
                    <Codigo forte>{f.trabalhador}</Codigo>
                    <span className="min-w-0 flex-1 truncate text-[12px] text-texto-2">
                      {nomes.get(f.trabalhador) ?? '—'}
                    </span>
                    <Semaforo
                      cor={f.motivo === 'falta_injustificada' ? 'vermelho' : 'ambar'}
                      rotulo={tr(ROTULO_FALTA[f.motivo])}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {relatorio.bloqueios.length > 0 && (
            <section>
              <Rotulo className="mb-2">
                {tr({ pt: 'Bloqueios', en: 'Blockers', zh: '阻碍' })}
              </Rotulo>
              <ul className="divide-y divide-fio">
                {relatorio.bloqueios.map((b, i) => (
                  <li key={i} className="py-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[12px] font-medium text-texto">
                        {tr(ROTULO_BLOQUEIO[b.tipo_bloqueio])}
                      </span>
                      {b.horas_perdidas !== undefined && (
                        <span className="num ml-auto text-[11.5px] text-ambar">
                          {tr({
                            pt: `${fmt.numero(b.horas_perdidas, 1)} h perdidas`,
                            en: `${fmt.numero(b.horas_perdidas, 1)} h lost`,
                            zh: `损失 ${fmt.numero(b.horas_perdidas, 1)} 小时`,
                          })}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11.5px] text-texto-2">{b.descricao}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {validacao.constatacoes.length > 0 && (
            <section>
              <Rotulo className="mb-2">
                {tr({ pt: 'Constatações', en: 'Findings', zh: '检查结果' })}
              </Rotulo>
              <Constatacoes lista={validacao.constatacoes} />
            </section>
          )}
        </div>
      }
    />
  );
}
