/**
 * M2 — Ficha de pesagem de colheita (F-07).
 *
 * É o registo primário do K-PRD-01, do K-PRD-02 e de toda a família COL. É
 * também o sítio onde se demonstra o §24.5: um peso mal lido não se apaga —
 * anula-se com motivo e substitui-se, e ambos ficam visíveis.
 */

import { Plus, Scale, Sprout, Timer, Undo2 } from 'lucide-react';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useCiclos, useNomes, usePesagens, useTalhoes } from '../../dados/consultas';
import { corrigirPesagem } from '../../dados/escrever';
import { HOJE } from '../../dados/semente';
import { q, ROTULO_BASE } from '@bastet/nucleo/canonico';
import { useFmt, useT } from '../../i18n/contexto';
import { COL } from '../../i18n/comuns';
import { INDICADOR_POR_CODIGO } from '@bastet/nucleo/indicadores';
import { ROTULO_REJEICAO, type PesagemColheita } from '@bastet/nucleo/operacoes';
import { kCol04, kCol05, kPrd01 } from '@bastet/nucleo/calculos';
import { contaParaIndicadores } from '@bastet/nucleo/historico';
import { avaliar } from '@bastet/nucleo/semaforo';
import { horasEntre, taxaRejeicao, validarPesagem } from '@bastet/nucleo/validacao';
import { FichaObjecto } from '../../design/FichaObjecto';
import { Botao, ListaDetalhe, Pagina, Seletor } from '../../design/Pagina';
import {
  CartaoMetrica,
  Codigo,
  Constatacoes,
  Painel,
  Rotulo,
  Semaforo,
  Tabela,
} from '../../design/primitivas';
import { FormularioF07 } from './FormularioF07';

export function Pesagens() {
  const tr = useT();
  const fmt = useFmt();
  const { codigo } = useParams();
  const navegar = useNavigate();
  const pesagens = usePesagens();
  const ciclos = useCiclos();
  const talhoes = useTalhoes();
  const nomes = useNomes();
  const [talhaoFiltro, setTalhaoFiltro] = React.useState('');
  const [aRegistar, setARegistar] = React.useState(false);

  const validas = pesagens.filter(contaParaIndicadores);
  const filtradas = talhaoFiltro ? pesagens.filter((p) => p.talhao === talhaoFiltro) : pesagens;
  const seleccionada = pesagens.find((p) => p.codigo === codigo);

  const arvores = ciclos.reduce((s, c) => s + c.plantas_estabelecidas, 0);
  const rendimento = kPrd01({ pesagens: validas, arvoresPlantadas: arvores });
  const rejeicao = kCol04(validas);
  const pessoasDia = validas.reduce((s, p) => s + p.n_pessoas, 0);
  const produtividade = kCol05(validas, pessoasDia);
  const liquido = validas.reduce((s, p) => s + p.quantidade_liquida.valor, 0);

  const foraPrazo = validas.filter(
    (p) =>
      p.hora_entrada_processamento &&
      horasEntre(`${p.data_colheita}T${p.hora}`, p.hora_entrada_processamento) > 24,
  ).length;

  return (
    <Pagina
      accoes={
        <div className="flex items-center gap-2">
          <Seletor value={talhaoFiltro} onChange={setTalhaoFiltro}>
            <option value="">
              {tr({ pt: 'Todos os talhões', en: 'All plots', zh: '全部地块' })}
            </option>
            {talhoes.map((t) => (
              <option key={t.codigo} value={t.codigo}>
                {t.codigo}
              </option>
            ))}
          </Seletor>
          {!aRegistar && (
            <Botao variante="primario" onClick={() => setARegistar(true)}>
              <Plus className="size-3.5" />
              {tr({ pt: 'Registar pesagem', en: 'Record a weighing', zh: '登记称重' })}
            </Botao>
          )}
        </div>
      }
    >
      {aRegistar && <FormularioF07 aoFechar={() => setARegistar(false)} />}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <CartaoMetrica
          destaque
          icone={Sprout}
          cor={avaliar(rendimento.valor, INDICADOR_POR_CODIGO.get('K-PRD-01')!).cor}
          rotulo={tr({
            pt: 'Rendimento por árvore',
            en: 'Yield per tree',
            zh: '单株产量',
          })}
          valor={rendimento.valor === undefined ? '—' : fmt.numero(rendimento.valor, 2)}
          unidade={fmt.unidade('kg_arvore')}
          legenda="K-PRD-01"
          frase={tr({
            pt: `${fmt.numero(liquido / 1000, 2)} t líquidas em ${validas.length} fichas F-07.${rendimento.ressalva ? ` ${rendimento.ressalva.pt}` : ''}`,
            en: `${fmt.numero(liquido / 1000, 2)} t net across ${validas.length} F-07 sheets.${rendimento.ressalva ? ` ${rendimento.ressalva.en}` : ''}`,
            zh: `${validas.length} 张 F-07 单据合计净重 ${fmt.numero(liquido / 1000, 2)} 吨。${rendimento.ressalva ? rendimento.ressalva.zh : ''}`,
          })}
        />

        <CartaoMetrica
          icone={Scale}
          cor={avaliar(rejeicao.valor, INDICADOR_POR_CODIGO.get('K-COL-04')!).cor}
          rotulo={tr({
            pt: 'Rejeição em triagem',
            en: 'Rejection at sorting',
            zh: '分选剔除率',
          })}
          valor={fmt.numero(rejeicao.valor ?? 0, 1)}
          unidade="%"
          legenda={tr({ pt: 'meta ≤ 6%', en: 'target ≤ 6%', zh: '目标 ≤ 6%' })}
          codigo="K-COL-04"
          frase={
            pesagens.length > validas.length
              ? tr({
                  pt: `${fmt.contagem(pesagens.length - validas.length, 'ficha anulada, visível', 'fichas anuladas, visíveis')} mas fora dos indicadores (§24.5).`,
                  en: `${fmt.contagem(pesagens.length - validas.length, 'sheet annulled, visible', 'sheets annulled, visible')} but outside the indicators (§24.5).`,
                  zh: `${fmt.inteiro(pesagens.length - validas.length)} 张单据已作废，仍可见但不计入指标（§24.5）。`,
                })
              : tr({
                  pt: 'Peso rejeitado sobre peso apanhado. Toda a rejeição tem motivo registado.',
                  en: 'Rejected weight over picked weight. Every rejection has a recorded reason.',
                  zh: '剔除重量与采摘重量之比。每一次剔除都登记了原因。',
                })
          }
        />

        <CartaoMetrica
          icone={Timer}
          cor={foraPrazo === 0 ? 'verde' : 'ambar'}
          rotulo={tr({ pt: 'Fora das 24 h', en: 'Past 24 h', zh: '超过 24 小时' })}
          valor={fmt.inteiro(foraPrazo)}
          unidade={tr({
            pt: `de ${validas.length}`,
            en: `of ${validas.length}`,
            zh: `共 ${validas.length} 张`,
          })}
          codigo="K-COL-02"
          frase={
            produtividade.valor === undefined
              ? tr({
                  pt: 'Horas entre a apanha e a entrada no descascador.',
                  en: 'Hours between picking and entry into the dehusker.',
                  zh: '采摘至进入脱皮机的小时数。',
                })
              : tr({
                  pt: `Produtividade da apanha: ${fmt.numero(produtividade.valor, 1)} kg por pessoa-dia.`,
                  en: `Picking productivity: ${fmt.numero(produtividade.valor, 1)} kg per worker-day.`,
                  zh: `采摘生产率：每工日 ${fmt.numero(produtividade.valor, 1)} 公斤。`,
                })
          }
        />
      </div>

      <ListaDetalhe
        semSeleccao={tr({
          pt: 'Escolha uma pesagem para abrir a ficha F-07.',
          en: 'Pick a weighing to open its F-07 sheet.',
          zh: '选择一条称重记录以打开 F-07 表单。',
        })}
        lista={
          <Painel
            titulo={tr({
              pt: `${filtradas.length} pesagens`,
              en: `${filtradas.length} weighings`,
              zh: `${filtradas.length} 条称重记录`,
            })}
            denso
          >
            <Tabela
              linhas={[...filtradas].sort((a, b) => (a.data_colheita < b.data_colheita ? 1 : -1))}
              chave={(p) => p.codigo}
              activa={(p) => p.codigo === codigo}
              aoClicar={(p) => navegar(`/pesagens/${p.codigo}`)}
              colunas={[
                {
                  chave: 'cod',
                  cabecalho: tr({ pt: 'Ficha', en: 'Sheet', zh: '单据' }),
                  render: (p) => (
                    <span className="flex items-center gap-2">
                      <Codigo forte>{p.codigo}</Codigo>
                      {p.anulado && (
                        <Semaforo
                          cor="vermelho"
                          rotulo={tr({
                            pt: 'anulada',
                            en: 'annulled',
                            zh: '已作废',
                          })}
                        />
                      )}
                    </span>
                  ),
                },
                {
                  chave: 'data',
                  cabecalho: tr(COL.data),
                  numerica: true,
                  render: (p) => fmt.data(p.data_colheita),
                  ordenarPor: (p) => p.data_colheita,
                },
                {
                  chave: 'talhao',
                  cabecalho: tr(COL.talhao),
                  render: (p) => <Codigo>{p.talhao}</Codigo>,
                },
                {
                  chave: 'ronda',
                  cabecalho: tr({ pt: 'Ronda', en: 'Round', zh: '轮次' }),
                  numerica: true,
                  render: (p) => p.ronda_numero ?? '—',
                },
                {
                  chave: 'liquido',
                  cabecalho: tr({ pt: 'Líquido', en: 'Net', zh: '净重' }),
                  numerica: true,
                  render: (p) => fmt.quantidade(p.quantidade_liquida),
                  ordenarPor: (p) => p.quantidade_liquida.valor,
                },
                {
                  chave: 'rejeicao',
                  cabecalho: tr({ pt: 'Rejeição', en: 'Rejection', zh: '剔除率' }),
                  numerica: true,
                  render: (p) => {
                    const taxa = taxaRejeicao(p);
                    return (
                      <Semaforo
                        cor={taxa <= 6 ? 'verde' : taxa <= 8 ? 'ambar' : 'vermelho'}
                        rotulo={fmt.percentagem(taxa)}
                      />
                    );
                  },
                  ordenarPor: (p) => taxaRejeicao(p),
                },
                {
                  chave: 'prazo',
                  cabecalho: tr({
                    pt: 'Até ao descasque',
                    en: 'To dehusking',
                    zh: '至脱皮',
                  }),
                  numerica: true,
                  render: (p) => {
                    if (!p.hora_entrada_processamento) return <Semaforo cor="cinzento" rotulo="—" />;
                    const h = horasEntre(`${p.data_colheita}T${p.hora}`, p.hora_entrada_processamento);
                    return (
                      <Semaforo
                        cor={h <= 24 ? 'verde' : h <= 48 ? 'ambar' : 'vermelho'}
                        rotulo={`${fmt.numero(h, 1)} ${fmt.unidade('h')}`}
                      />
                    );
                  },
                },
                {
                  chave: 'equipa',
                  cabecalho: tr(COL.equipa),
                  render: (p) => <Codigo>{p.equipa}</Codigo>,
                },
              ]}
            />
          </Painel>
        }
        detalhe={
          seleccionada ? (
            <FichaPesagem pesagem={seleccionada} todas={pesagens} nomes={nomes} />
          ) : null
        }
      />
    </Pagina>
  );
}

function FichaPesagem({
  pesagem,
  todas,
  nomes,
}: {
  pesagem: PesagemColheita;
  todas: PesagemColheita[];
  nomes: Map<string, string>;
}) {
  const tr = useT();
  const fmt = useFmt();
  const [aCorrigir, setACorrigir] = React.useState(false);
  const [novoLiquido, setNovoLiquido] = React.useState<number | ''>('');
  const [motivo, setMotivo] = React.useState('');

  const anteriores = todas
    .filter((p) => p.talhao === pesagem.talhao && p.data_colheita < pesagem.data_colheita)
    .map((p) => p.data_colheita)
    .sort();

  const validacao = validarPesagem(pesagem, {
    hoje: HOJE,
    dataRondaAnterior: anteriores.at(-1),
  });

  const horas = pesagem.hora_entrada_processamento
    ? horasEntre(`${pesagem.data_colheita}T${pesagem.hora}`, pesagem.hora_entrada_processamento)
    : undefined;

  const corrigir = async () => {
    if (novoLiquido === '') return;
    const sufixo = String(Number(pesagem.codigo.split('-').at(-1)) + 500).padStart(3, '0');
    const substituto: PesagemColheita = {
      ...pesagem,
      id: `${pesagem.codigo.slice(0, -3)}${sufixo}`,
      codigo: `${pesagem.codigo.slice(0, -3)}${sufixo}`,
      quantidade_liquida: q(Number(novoLiquido), 'kg', 'NIH'),
      quantidade_bruta: q(Number(novoLiquido) + pesagem.tara.valor, 'kg', 'NIH'),
      versao: 1,
      historico: [],
      anulado: undefined,
    };
    await corrigirPesagem(pesagem, substituto, motivo);
    setACorrigir(false);
    setMotivo('');
    setNovoLiquido('');
  };

  return (
    <FichaObjecto
      objecto={pesagem}
      nomeDono={nomes.get(pesagem.dono)}
      subtitulo={
        <>
          {tr({
            pt: `Ronda ${pesagem.ronda_numero} · ${fmt.dataExtenso(pesagem.data_colheita)} às ${pesagem.hora} · equipa`,
            en: `Round ${pesagem.ronda_numero} · ${fmt.dataExtenso(pesagem.data_colheita)} at ${pesagem.hora} · team`,
            zh: `第 ${pesagem.ronda_numero} 轮 · ${fmt.dataExtenso(pesagem.data_colheita)} ${pesagem.hora} · 班组`,
          })}{' '}
          <Codigo forte>{pesagem.equipa}</Codigo>{' '}
          {tr({
            pt: `com ${pesagem.n_pessoas} pessoas`,
            en: `with ${pesagem.n_pessoas} people`,
            zh: `共 ${pesagem.n_pessoas} 人`,
          })}
        </>
      }
      acoes={
        !pesagem.anulado && (
          <Botao onClick={() => setACorrigir((v) => !v)}>
            <Undo2 className="size-3.5" />
            {tr({ pt: 'Corrigir', en: 'Correct', zh: '更正' })}
          </Botao>
        )
      }
      grupos={[
        {
          titulo: tr({ pt: 'Pesagem', en: 'Weighing', zh: '称重' }),
          campos: [
            {
              rotulo: tr({ pt: 'Peso bruto', en: 'Gross weight', zh: '毛重' }),
              valor: fmt.quantidade(pesagem.quantidade_bruta),
            },
            {
              rotulo: tr({ pt: 'Tara', en: 'Tare', zh: '皮重' }),
              valor: fmt.quantidade(pesagem.tara),
            },
            {
              rotulo: tr({ pt: 'Peso líquido', en: 'Net weight', zh: '净重' }),
              valor: (
                <span className="font-semibold">{fmt.quantidade(pesagem.quantidade_liquida)}</span>
              ),
              nota: tr({
                pt: 'Calculado: bruto menos tara.',
                en: 'Derived: gross minus tare.',
                zh: '推算值：毛重减皮重。',
              }),
            },
            {
              rotulo: tr({
                pt: 'Rejeitado em triagem',
                en: 'Rejected at sorting',
                zh: '分选剔除',
              }),
              valor: fmt.quantidade(pesagem.quantidade_rejeitada),
              nota: pesagem.motivo_rejeicao
                ? tr(ROTULO_REJEICAO[pesagem.motivo_rejeicao])
                : undefined,
            },
            {
              rotulo: tr({
                pt: 'Taxa de rejeição',
                en: 'Rejection rate',
                zh: '剔除率',
              }),
              valor: (
                <Semaforo
                  cor={taxaRejeicao(pesagem) <= 6 ? 'verde' : taxaRejeicao(pesagem) <= 8 ? 'ambar' : 'vermelho'}
                  rotulo={fmt.percentagem(taxaRejeicao(pesagem))}
                />
              ),
            },
            {
              rotulo: tr({ pt: 'Humidade', en: 'Moisture', zh: '含水率' }),
              valor: fmt.percentagem(pesagem.humidade_percent),
            },
            {
              rotulo: tr({
                pt: 'Base de medida',
                en: 'Measurement basis',
                zh: '计量基准',
              }),
              valor: `NIH — ${tr(ROTULO_BASE.NIH)}`,
              nota: tr({
                pt: 'A conversão para NIS é sempre explícita, nunca implícita (§5.3).',
                en: 'Conversion to NIS is always explicit, never implicit (§5.3).',
                zh: '向 NIS 的换算始终显式声明，不得隐含（§5.3）。',
              }),
            },
          ],
        },
        {
          titulo: tr({ pt: 'Rastreio', en: 'Traceability', zh: '追溯' }),
          campos: [
            { rotulo: tr(COL.talhao), valor: <Codigo forte>{pesagem.talhao}</Codigo> },
            {
              rotulo: tr({
                pt: 'Ciclo de cultura',
                en: 'Crop cycle',
                zh: '生长周期',
              }),
              valor: <Codigo forte>{pesagem.ciclo_cultura}</Codigo>,
            },
            {
              rotulo: tr({
                pt: 'Dias desde a ronda anterior',
                en: 'Days since previous round',
                zh: '距上轮天数',
              }),
              valor:
                pesagem.dias_desde_ronda_anterior === undefined
                  ? tr({ pt: 'Primeira ronda', en: 'First round', zh: '首轮' })
                  : `${pesagem.dias_desde_ronda_anterior} ${fmt.unidade('dia')}`,
              nota: tr({
                pt: 'Alvo K-COL-01: 7 a 14 dias.',
                en: 'K-COL-01 target: 7 to 14 days.',
                zh: 'K-COL-01 目标：7 至 14 天。',
              }),
            },
            {
              rotulo: tr({
                pt: 'Entrada em processamento',
                en: 'Entry into processing',
                zh: '进厂时间',
              }),
              valor:
                horas === undefined ? (
                  '—'
                ) : (
                  <Semaforo
                    cor={horas <= 24 ? 'verde' : horas <= 48 ? 'ambar' : 'vermelho'}
                    rotulo={`${fmt.numero(horas, 1)} ${fmt.unidade('h')}`}
                  />
                ),
              nota: tr({
                pt: 'Meta K-COL-02: 24 horas.',
                en: 'K-COL-02 target: 24 hours.',
                zh: 'K-COL-02 目标：24 小时。',
              }),
            },
            {
              rotulo: tr({ pt: 'Pesador', en: 'Weigher', zh: '称重人' }),
              valor: nomes.get(pesagem.pesador) ?? pesagem.pesador,
            },
            {
              rotulo: tr({ pt: 'Conferente', en: 'Checker', zh: '复核人' }),
              valor: nomes.get(pesagem.conferente) ?? pesagem.conferente,
              nota: tr({
                pt: 'Pessoa distinta do pesador — validação V27.',
                en: 'A different person from the weigher — validation V27.',
                zh: '必须与称重人为不同的人——校验 V27。',
              }),
            },
          ],
        },
      ]}
      extra={
        <div className="flex flex-col gap-5">
          {aCorrigir && (
            <section className="rounded-xl border border-transparent bg-ambar-pastel p-4">
              <Rotulo className="mb-2">
                {tr({
                  pt: 'Correcção por anulação e substituição',
                  en: 'Correction by annulment and replacement',
                  zh: '以作废并替代的方式更正',
                })}
              </Rotulo>
              <p className="mb-3 text-[11.5px] leading-snug text-texto-2">
                {tr({
                  pt: 'Nenhum papel apaga registos (§24.5). A ficha actual passa a anulada, com o motivo registado, e é criada uma nova que a substitui. As duas ficam visíveis no histórico e só a nova conta para indicadores.',
                  en: 'No role deletes records (§24.5). The current sheet becomes annulled, with the reason recorded, and a new one is created to replace it. Both stay visible in the history and only the new one counts towards indicators.',
                  zh: '任何角色都不能删除记录（§24.5）。当前单据作废并登记原因，同时新建一张替代单据。两者均在历史中可见，但仅新单据计入指标。',
                })}
              </p>
              <div className="flex flex-col gap-2.5">
                <div>
                  <Rotulo className="mb-1">
                    {tr({
                      pt: 'Peso líquido correcto (kg)',
                      en: 'Correct net weight (kg)',
                      zh: '正确净重（kg）',
                    })}
                  </Rotulo>
                  <input
                    type="number"
                    value={novoLiquido}
                    onChange={(e) => setNovoLiquido(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={String(pesagem.quantidade_liquida.valor)}
                    className="num h-[34px] w-full rounded-xl border border-fio bg-cartao px-2.5 text-[13px] text-texto"
                  />
                </div>
                <div>
                  <Rotulo className="mb-1">
                    {tr({
                      pt: 'Motivo (obrigatório)',
                      en: 'Reason (required)',
                      zh: '原因（必填）',
                    })}
                  </Rotulo>
                  <input
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder={tr({
                      pt: 'Peso mal lido na balança; conferido com o talão.',
                      en: 'Weight misread on the scale; checked against the docket.',
                      zh: '磅秤读数有误，已与磅单核对。',
                    })}
                    className="h-[34px] w-full rounded-xl border border-fio bg-cartao px-2.5 text-[12.5px] text-texto placeholder:text-texto-3"
                  />
                </div>
                <div className="flex gap-2">
                  <Botao
                    variante="primario"
                    onClick={corrigir}
                    disabled={novoLiquido === '' || motivo.trim().length < 5}
                  >
                    {tr({
                      pt: 'Anular e substituir',
                      en: 'Annul and replace',
                      zh: '作废并替代',
                    })}
                  </Botao>
                  <Botao onClick={() => setACorrigir(false)}>
                    {tr({ pt: 'Cancelar', en: 'Cancel', zh: '取消' })}
                  </Botao>
                </div>
                {motivo.trim().length > 0 && motivo.trim().length < 5 && (
                  <p className="text-[11px] text-vermelho">
                    {tr({
                      pt: 'Um registo anulado sem explicação é um registo apagado com outro nome.',
                      en: 'A record annulled without an explanation is a deleted record under another name.',
                      zh: '没有说明的作废，只是换个名字的删除。',
                    })}
                  </p>
                )}
              </div>
            </section>
          )}

          {validacao.constatacoes.length > 0 && (
            <section>
              <Rotulo className="mb-2">
                {tr({
                  pt: 'Constatações',
                  en: 'Findings',
                  zh: '检查结果',
                })}
              </Rotulo>
              <Constatacoes lista={validacao.constatacoes} />
            </section>
          )}
        </div>
      }
    />
  );
}
