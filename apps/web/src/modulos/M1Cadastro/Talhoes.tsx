/**
 * M1 — Blocos e talhões. Formulário F-01, entidade E-01.
 *
 * O talhão é a unidade mínima de gestão agronómica. Sem ele decomposto, a
 * pergunta «onde é que se perde» não tem sujeito.
 */

import { Map, Pencil, Plus, TreeDeciduous } from 'lucide-react';
import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import {
  cicloDoTalhao,
  pesagensDoTalhao,
  useBlocos,
  useCiclos,
  useNomes,
  usePesagens,
  useTalhoes,
} from '../../dados/consultas';
import { HOJE } from '../../dados/semente';
import { useFmt, useT } from '../../i18n/contexto';
import { COL } from '../../i18n/comuns';
import { CULTURAS } from '@bastet/nucleo/codigos';
import { ROTULO_SISTEMA_REGA, type Talhao } from '@bastet/nucleo/territorio';
import { kCol01, kCol04, kPrd01 } from '@bastet/nucleo/calculos';
import { validarTalhao } from '@bastet/nucleo/validacao';
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
import { FormularioF01 } from './FormularioF01';

export function Talhoes() {
  const tr = useT();
  const fmt = useFmt();
  const { codigo } = useParams();
  const navegar = useNavigate();
  const talhoes = useTalhoes();
  const blocos = useBlocos();
  const ciclos = useCiclos();
  const pesagens = usePesagens();
  const nomes = useNomes();
  const [aCriar, setACriar] = React.useState(false);
  const [aAlterar, setAAlterar] = React.useState(false);

  const seleccionado = talhoes.find((t) => t.codigo === codigo);

  const areaTalhoes = talhoes.reduce((s, t) => s + t.area_plantada_ha.valor, 0);
  const areaBlocos = blocos.reduce((s, b) => s + b.area_total_ha.valor, 0);
  const arvoresTotal = talhoes.reduce((s, t) => s + (t.total_plantas_estabelecidas ?? 0), 0);
  const comExcepcao = talhoes.filter((t) => validarTalhao(t, HOJE).constatacoes.length > 0).length;

  // Sem talhão nenhum, a área que existe é a das zonas — e essa é do plano de
  // negócios, não de levantamento. O cartão mostra-a, mas a cinzento e a
  // dizer de onde vem: um número por medir não é um número verde.
  const porDecompor = talhoes.length === 0;
  const areaTotal = porDecompor ? areaBlocos : areaTalhoes;
  const densidadeMedia = areaTotal > 0 ? Math.round(arvoresTotal / areaTotal) : 0;

  return (
    <Pagina
      accoes={
        !aCriar &&
        !aAlterar && (
          <Botao variante="primario" onClick={() => setACriar(true)}>
            <Plus className="size-3.5" />
            {tr({ pt: 'Novo talhão', en: 'New plot', zh: '新建地块' })}
          </Botao>
        )
      }
    >
      {aCriar && <FormularioF01 aoFechar={() => setACriar(false)} />}
      {aAlterar && seleccionado && (
        <FormularioF01 talhao={seleccionado} aoFechar={() => setAAlterar(false)} />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <CartaoMetrica
          destaque
          icone={Map}
          cor={porDecompor ? 'cinzento' : 'verde'}
          rotulo={tr({ pt: 'Área plantada', en: 'Planted area', zh: '种植面积' })}
          valor={fmt.numero(areaTotal, 1)}
          unidade={fmt.unidade('ha')}
          legenda={tr(
            porDecompor
              ? { pt: 'por medir', en: 'unmeasured', zh: '未实测' }
              : {
                  pt: `${talhoes.length} talhões`,
                  en: `${talhoes.length} plots`,
                  zh: `${talhoes.length} 个地块`,
                },
          )}
          frase={tr(
            porDecompor
              ? {
                  pt: `${blocos.length} zonas, zero talhões. A área é a do plano de negócios; o levantamento está por obter. Decompor as zonas em talhões de gestão é o primeiro acto do sistema (§7.1).`,
                  en: `${blocos.length} zones, zero plots. The area is the business plan’s; the survey is still to be obtained. Breaking the zones into management plots is the system’s first act (§7.1).`,
                  zh: `${blocos.length} 个区，地块为零。面积取自商业计划，实测资料尚未到手。将区划分为管理地块，是系统的第一项工作（§7.1）。`,
                }
              : {
                  pt: 'De 700 ha de propriedade: menos de 16% está plantado. O problema da Farma Alcinda não é de área nem de capital, é de execução medida.',
                  en: 'Out of 700 ha owned: under 16% is planted. Farma Alcinda’s problem is neither land nor capital — it is measured execution.',
                  zh: '拥有 700 公顷，已种植不足 16%。Farma Alcinda 的问题既不在土地，也不在资金，而在于可度量的执行。',
                },
          )}
        />

        <CartaoMetrica
          icone={TreeDeciduous}
          cor={arvoresTotal === 0 ? 'cinzento' : 'ambar'}
          rotulo={tr({ pt: 'Densidade', en: 'Density', zh: '种植密度' })}
          valor={arvoresTotal === 0 ? '—' : fmt.inteiro(densidadeMedia)}
          unidade={tr({ pt: 'árv./ha', en: 'trees/ha', zh: '株/公顷' })}
          frase={tr(
            arvoresTotal === 0
              ? {
                  pt: 'Nenhuma árvore contada. O plano fala de 10 780 a 10 × 10 m; o gestor responde «por contar». Sem contagem não há denominador para o rendimento por árvore, que nesta cultura é o indicador primário.',
                  en: 'No trees counted. The plan speaks of 10,780 at 10 × 10 m; the manager answers «to be counted». Without a count there is no denominator for yield per tree, which in this crop is the primary indicator.',
                  zh: '尚未清点任何树木。计划称按 10 × 10 米种有 10,780 株，而经理答复「尚待清点」。没有清点，单株产量就没有分母，而它正是该作物的主指标。',
                }
              : {
                  pt: `${fmt.inteiro(arvoresTotal)} árvores a 10 × 10 m. Um terço da referência mundial de 312 — é o que torna o t/ha enganador e o kg por árvore o indicador primário.`,
                  en: `${fmt.inteiro(arvoresTotal)} trees at 10 × 10 m. A third of the world reference of 312 — which is what makes t/ha misleading and kg per tree the primary indicator.`,
                  zh: `${fmt.inteiro(arvoresTotal)} 棵树，株行距 10 × 10 米。仅为国际基准 312 株的三分之一——这正是吨/公顷易令人误读、而单株公斤数才是主指标的原因。`,
                },
          )}
        />

        <CartaoMetrica
          icone={Map}
          cor={porDecompor ? 'cinzento' : comExcepcao === 0 ? 'verde' : 'ambar'}
          rotulo={tr({
            pt: 'Talhões com excepção',
            en: 'Plots with exceptions',
            zh: '存在例外的地块',
          })}
          valor={fmt.inteiro(comExcepcao)}
          unidade={tr({
            pt: `de ${talhoes.length}`,
            en: `of ${talhoes.length}`,
            zh: `共 ${talhoes.length} 个`,
          })}
          frase={tr({
            pt: 'Análise de solo caducada, polígono por levantar ou áreas incoerentes. São excepções de relatório, não bloqueios.',
            en: 'Expired soil analysis, unsurveyed polygon or inconsistent areas. These are reporting exceptions, not blocks.',
            zh: '土壤检测过期、边界未测绘或面积不一致。属于报表例外，而非阻断。',
          })}
        />
      </div>

      <ListaDetalhe
        semSeleccao={tr({
          pt: 'Escolha um talhão para abrir a ficha F-01.',
          en: 'Pick a plot to open its F-01 sheet.',
          zh: '选择一个地块以打开 F-01 表单。',
        })}
        lista={
          <div className="flex flex-col gap-4">
            {blocos.map((b) => {
              const doBloco = talhoes.filter((t) => t.bloco === b.codigo);
              return (
                <Painel
                  key={b.codigo}
                  titulo={
                    <span className="flex items-baseline gap-2">
                      <Codigo forte>{b.codigo}</Codigo>
                      {b.designacao}
                    </span>
                  }
                  descricao={tr({
                    pt: `${fmt.quantidade(b.area_total_ha)} · estabelecido em ${b.ano_estabelecimento} · responsável ${nomes.get(b.responsavel) ?? b.responsavel}`,
                    en: `${fmt.quantidade(b.area_total_ha)} · established in ${b.ano_estabelecimento} · supervisor ${nomes.get(b.responsavel) ?? b.responsavel}`,
                    zh: `${fmt.quantidade(b.area_total_ha)} · ${b.ano_estabelecimento} 年建园 · 负责人 ${nomes.get(b.responsavel) ?? b.responsavel}`,
                  })}
                  denso
                >
                  <Tabela
                    linhas={doBloco}
                    chave={(t) => t.codigo}
                    activa={(t) => t.codigo === codigo}
                    aoClicar={(t) => navegar(`/talhoes/${t.codigo}`)}
                    colunas={[
                      {
                        chave: 'codigo',
                        cabecalho: tr(COL.codigo),
                        render: (t) => <Codigo forte>{t.codigo}</Codigo>,
                      },
                      { chave: 'nome', cabecalho: tr(COL.designacao), render: (t) => t.designacao },
                      {
                        chave: 'area',
                        cabecalho: tr({ pt: 'Plantada', en: 'Planted', zh: '种植面积' }),
                        numerica: true,
                        render: (t) => fmt.quantidade(t.area_plantada_ha),
                        ordenarPor: (t) => t.area_plantada_ha.valor,
                      },
                      {
                        chave: 'arvores',
                        cabecalho: tr({ pt: 'Árvores', en: 'Trees', zh: '树木' }),
                        numerica: true,
                        render: (t) => fmt.inteiro(t.total_plantas_estabelecidas ?? 0),
                        ordenarPor: (t) => t.total_plantas_estabelecidas ?? 0,
                      },
                      {
                        chave: 'kgarv',
                        cabecalho: fmt.unidade('kg_arvore'),
                        numerica: true,
                        render: (t) => {
                          const c = cicloDoTalhao(ciclos, t.codigo);
                          if (!c?.producao_real) return <span className="text-texto-3">—</span>;
                          return fmt.numero(c.producao_real.valor / c.plantas_estabelecidas, 2);
                        },
                        ordenarPor: (t) => {
                          const c = cicloDoTalhao(ciclos, t.codigo);
                          return c?.producao_real ? c.producao_real.valor / c.plantas_estabelecidas : 0;
                        },
                      },
                      {
                        chave: 'realizacao',
                        cabecalho: tr({
                          pt: 'Realização',
                          en: 'Realisation',
                          zh: '实现率',
                        }),
                        numerica: true,
                        render: (t) => {
                          const c = cicloDoTalhao(ciclos, t.codigo);
                          if (!c?.producao_real || c.producao_prevista.valor <= 0)
                            return <Semaforo cor="cinzento" rotulo="—" />;
                          const pct = (c.producao_real.valor / c.producao_prevista.valor) * 100;
                          return (
                            <Semaforo
                              cor={pct >= 80 ? 'verde' : pct >= 60 ? 'ambar' : 'vermelho'}
                              rotulo={fmt.percentagem(pct)}
                            />
                          );
                        },
                      },
                      {
                        chave: 'excepcoes',
                        cabecalho: tr({
                          pt: 'Excepções',
                          en: 'Exceptions',
                          zh: '例外',
                        }),
                        numerica: true,
                        render: (t) => {
                          const r = validarTalhao(t, HOJE);
                          const n = r.constatacoes.length;
                          if (n === 0)
                            return (
                              <Semaforo
                                cor="verde"
                                rotulo={tr({
                                  pt: 'conforme',
                                  en: 'compliant',
                                  zh: '合规',
                                })}
                              />
                            );
                          return (
                            <Semaforo
                              cor={r.gravavel ? 'ambar' : 'vermelho'}
                              rotulo={`${n}`}
                            />
                          );
                        },
                      },
                    ]}
                  />
                </Painel>
              );
            })}
          </div>
        }
        detalhe={
          seleccionado ? (
            <FichaTalhao
              aoAlterar={() => setAAlterar(true)}
              talhao={seleccionado}
              ciclo={cicloDoTalhao(ciclos, seleccionado.codigo)}
              pesagens={pesagensDoTalhao(pesagens, seleccionado.codigo)}
              nomeDono={nomes.get(seleccionado.dono)}
            />
          ) : null
        }
      />
    </Pagina>
  );
}

function FichaTalhao({
  talhao,
  ciclo,
  pesagens,
  nomeDono,
  aoAlterar,
}: {
  talhao: Talhao;
  aoAlterar: () => void;
  ciclo?: ReturnType<typeof useCiclos>[number];
  pesagens: ReturnType<typeof usePesagens>;
  nomeDono?: string;
}) {
  const tr = useT();
  const fmt = useFmt();
  const validacao = validarTalhao(talhao, HOJE);
  const rendimento = kPrd01({
    pesagens,
    arvoresPlantadas: talhao.total_plantas_estabelecidas ?? 0,
  });
  const rejeicao = kCol04(pesagens);
  const intervalo = kCol01(pesagens.map((p) => p.data_colheita));

  return (
    <FichaObjecto
      objecto={talhao}
      nomeDono={nomeDono}
      acoes={
        <Botao onClick={aoAlterar}>
          <Pencil className="size-3.5" />
          {tr({ pt: 'Alterar', en: 'Edit', zh: '修改' })}
        </Botao>
      }
      subtitulo={
        <>
          {tr(COL.bloco)} <Codigo forte>{talhao.bloco}</Codigo>
          {' · '}
          {tr({
            pt: `macadâmia plantada em ${talhao.ano_plantio}`,
            en: `macadamia planted in ${talhao.ano_plantio}`,
            zh: `${talhao.ano_plantio} 年定植澳洲坚果`,
          })}
        </>
      }
      grupos={[
        {
          titulo: tr({ pt: 'Áreas', en: 'Areas', zh: '面积' }),
          campos: [
            {
              rotulo: tr({ pt: 'Área bruta', en: 'Gross area', zh: '毛面积' }),
              valor: fmt.quantidade(talhao.area_bruta_ha),
            },
            {
              rotulo: tr({ pt: 'Área plantada', en: 'Planted area', zh: '种植面积' }),
              valor: fmt.quantidade(talhao.area_plantada_ha),
            },
            {
              rotulo: tr({ pt: 'Área útil', en: 'Usable area', zh: '有效面积' }),
              valor: fmt.quantidade(talhao.area_util_ha),
              nota: tr({
                pt: 'Menor ou igual à plantada — validação bloqueante.',
                en: 'At most the planted area — a blocking validation.',
                zh: '不得大于种植面积——阻断性校验。',
              }),
            },
            {
              rotulo: tr({ pt: 'Polígono', en: 'Polygon', zh: '边界' }),
              valor: tr({
                pt: `${talhao.poligono.length} vértices, WGS84`,
                en: `${talhao.poligono.length} vertices, WGS84`,
                zh: `${talhao.poligono.length} 个顶点，WGS84`,
              }),
              nota: `${fmt.numero(talhao.poligono[0]?.lat ?? 0, 4)}, ${fmt.numero(talhao.poligono[0]?.lon ?? 0, 4)}`,
            },
            {
              rotulo: tr({ pt: 'Declive', en: 'Slope', zh: '坡度' }),
              valor: fmt.quantidade(talhao.declive_percent),
              nota: tr({
                pt: 'Acima de ~13% dificulta a colheita mecanizada.',
                en: 'Above ~13% mechanised harvesting becomes difficult.',
                zh: '超过约 13% 后，机械化采收困难。',
              }),
            },
            {
              rotulo: tr({
                pt: 'Distância à sede',
                en: 'Distance to base',
                zh: '距场部距离',
              }),
              valor: fmt.quantidade(talhao.distancia_sede_km),
            },
          ],
        },
        {
          titulo: tr({ pt: 'Solo e água', en: 'Soil and water', zh: '土壤与水' }),
          campos: [
            {
              rotulo: tr({ pt: 'Tipo de solo', en: 'Soil type', zh: '土壤类型' }),
              valor: tr({ pt: 'Ferralsolo', en: 'Ferralsol', zh: '铁铝土' }),
            },
            {
              rotulo: tr({ pt: 'Análise de solo', en: 'Soil analysis', zh: '土壤检测' }),
              valor: fmt.data(talhao.data_analise_solo),
              nota: tr({
                pt: 'Validade de 24 meses (§19.2).',
                en: 'Valid for 24 months (§19.2).',
                zh: '有效期 24 个月（§19.2）。',
              }),
            },
            {
              rotulo: tr({ pt: 'pH em água', en: 'pH in water', zh: '水浸 pH' }),
              valor: fmt.numero(talhao.ph_agua ?? 0, 1),
              nota: tr({
                pt: 'Alvo para macadâmia: 5,5 a 6,5.',
                en: 'Target for macadamia: 5.5 to 6.5.',
                zh: '澳洲坚果目标值：5.5 至 6.5。',
              }),
            },
            {
              rotulo: tr({
                pt: 'Carbono orgânico',
                en: 'Organic carbon',
                zh: '有机碳',
              }),
              valor: fmt.percentagem(talhao.carbono_organico_percent),
              nota: tr({ pt: 'Alvo: 4%.', en: 'Target: 4%.', zh: '目标：4%。' }),
            },
            {
              rotulo: tr({
                pt: 'Sistema de rega',
                en: 'Irrigation system',
                zh: '灌溉方式',
              }),
              valor: tr(ROTULO_SISTEMA_REGA[talhao.sistema_rega]),
            },
            {
              rotulo: tr({ pt: 'Fonte de água', en: 'Water source', zh: '水源' }),
              valor: <Codigo forte>{talhao.fonte_agua ?? '—'}</Codigo>,
            },
          ],
        },
        {
          titulo: tr({
            pt: 'Cultura instalada',
            en: 'Crop in place',
            zh: '已种作物',
          }),
          campos: [
            {
              rotulo: tr(COL.cultura),
              valor: tr(talhao.cultura ? CULTURAS[talhao.cultura] : CULTURAS.MAC),
            },
            {
              rotulo: tr({ pt: 'Variedade', en: 'Variety', zh: '品种' }),
              valor: <Codigo forte>{talhao.variedade ?? '—'}</Codigo>,
            },
            {
              rotulo: tr({
                pt: 'Ano de plantio',
                en: 'Year planted',
                zh: '定植年份',
              }),
              valor: String(talhao.ano_plantio ?? '—'),
            },
            {
              rotulo: tr({ pt: 'Compasso', en: 'Spacing', zh: '株行距' }),
              valor: `${talhao.compasso_m?.entre_linhas} × ${talhao.compasso_m?.na_linha} m`,
            },
            {
              rotulo: tr({ pt: 'Densidade', en: 'Density', zh: '密度' }),
              valor: `${fmt.quantidade(talhao.densidade_plantas_ha, 0)}/${fmt.unidade('ha')}`,
            },
            {
              rotulo: tr({
                pt: 'Plantas estabelecidas',
                en: 'Established plants',
                zh: '定植株数',
              }),
              valor: fmt.inteiro(talhao.total_plantas_estabelecidas ?? 0),
              nota: tr({
                pt: 'Contagem física, não estimativa.',
                en: 'A physical count, not an estimate.',
                zh: '实数清点，非估算。',
              }),
            },
          ],
        },
      ]}
      extra={
        <div className="flex flex-col gap-5">
          {validacao.constatacoes.length > 0 && (
            <section>
              <Rotulo className="mb-2">
                {tr({
                  pt: 'Constatações do motor de regras',
                  en: 'Findings from the rules engine',
                  zh: '规则引擎的检查结果',
                })}
              </Rotulo>
              <Constatacoes lista={validacao.constatacoes} />
            </section>
          )}

          <section>
            <Rotulo className="mb-2">
              {tr({
                pt: 'Desempenho da campanha 2025/26',
                en: 'Performance in the 2025/26 season',
                zh: '2025/26 生产季表现',
              })}
            </Rotulo>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              <Valor
                rotulo="K-PRD-01"
                valor={
                  rendimento.valor === undefined
                    ? '—'
                    : `${fmt.numero(rendimento.valor, 2)} ${fmt.unidade('kg_arvore')}`
                }
              />
              <Valor
                rotulo="K-PRD-03"
                valor={
                  ciclo && ciclo.producao_prevista.valor > 0
                    ? fmt.percentagem(((ciclo.producao_real?.valor ?? 0) / ciclo.producao_prevista.valor) * 100)
                    : '—'
                }
              />
              <Valor rotulo="K-COL-04" valor={fmt.percentagem(rejeicao.valor)} />
              <Valor
                rotulo="K-COL-01"
                valor={
                  intervalo.valor === undefined
                    ? '—'
                    : `${fmt.numero(intervalo.valor, 1)} ${fmt.unidade('dia')}`
                }
              />
              <Valor
                rotulo={tr({ pt: 'Rondas', en: 'Rounds', zh: '采收轮次' })}
                valor={fmt.inteiro(pesagens.length)}
              />
              <Valor
                rotulo={tr({ pt: 'Produção', en: 'Output', zh: '产量' })}
                valor={ciclo?.producao_real ? fmt.quantidade(ciclo.producao_real, 0) : '—'}
              />
            </dl>
            <p className="mt-2 text-[11px] text-texto-3">
              {tr({
                pt: `Proveniência: ${pesagens.length} fichas F-07.`,
                en: `Provenance: ${pesagens.length} F-07 sheets.`,
                zh: `数据来源：${pesagens.length} 张 F-07 单据。`,
              })}{' '}
              <Link to="/pesagens" className="text-texto hover:underline">
                {tr({
                  pt: 'Abrir pesagens',
                  en: 'Open weighings',
                  zh: '打开称重记录',
                })}
              </Link>
            </p>
          </section>
        </div>
      }
    />
  );
}

function Valor({ rotulo, valor }: { rotulo: React.ReactNode; valor: React.ReactNode }) {
  return (
    <div>
      <Codigo>{rotulo}</Codigo>
      <div className="num mt-0.5 text-[14px] font-medium text-texto">{valor}</div>
    </div>
  );
}
