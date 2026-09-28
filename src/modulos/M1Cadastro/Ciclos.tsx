/**
 * M1 — Culturas, variedades e ciclos de cultura (E-05, E-06, E-07).
 *
 * «O ciclo de cultura é a entidade central do domínio agronómico. Tudo o que
 * acontece no campo pendura-se aqui.»
 */

import { Leaf, Sprout, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useCiclos, useCulturas, useTalhoes, useVariedades } from '../../dados/consultas';
import { HOJE } from '../../dados/semente';
import {
  idadeAnos,
  ROTULO_AMBITO,
  ROTULO_CICLO_VIDA,
  ROTULO_ORIGEM,
} from '../../dominio/biologico';
import { CULTURAS } from '../../dominio/codigos';
import { useFmt, useT } from '../../i18n/contexto';
import { COL, UI } from '../../i18n/comuns';
import { CURVA_MACADAMIA, esperadoPorIdade, FONTE_CURVA } from '../../dominio/indicadores';
import { Pagina } from '../../design/Pagina';
import { Barra, CartaoMetrica, Codigo, Painel, Semaforo, Tabela } from '../../design/primitivas';

export function Ciclos() {
  const tr = useT();
  const fmt = useFmt();
  const ciclos = useCiclos();
  const culturas = useCulturas();
  const variedades = useVariedades();
  const talhoes = useTalhoes();

  const plantasTotal = ciclos.reduce((s, c) => s + c.plantas_estabelecidas, 0);
  const esperadoTotal = ciclos.reduce((s, c) => s + c.producao_prevista.valor, 0);
  const realTotal = ciclos.reduce((s, c) => s + (c.producao_real?.valor ?? 0), 0);
  const realizacao = esperadoTotal > 0 ? (realTotal / esperadoTotal) * 100 : 0;

  return (
    <Pagina>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <CartaoMetrica
          destaque
          icone={TrendingDown}
          cor={realizacao >= 80 ? 'verde' : realizacao >= 60 ? 'ambar' : 'vermelho'}
          rotulo={tr({
            pt: 'Realização do potencial',
            en: 'Potential realisation',
            zh: '潜力实现率',
          })}
          valor={fmt.numero(realizacao, 1)}
          unidade="%"
          legenda={tr({
            pt: `${ciclos.length} ciclos`,
            en: `${ciclos.length} cycles`,
            zh: `${ciclos.length} 个生长周期`,
          })}
          frase={tr({
            pt: `${fmt.numero(realTotal / 1000, 2)} t de ${fmt.numero(esperadoTotal / 1000, 1)} t esperadas pela curva por idade. A produção real não é escrita à mão: é a soma das fichas de pesagem.`,
            en: `${fmt.numero(realTotal / 1000, 2)} t of the ${fmt.numero(esperadoTotal / 1000, 1)} t expected from the age curve. Actual output is not typed in by hand: it is the sum of the weighing sheets.`,
            zh: `实际 ${fmt.numero(realTotal / 1000, 2)} 吨，按树龄曲线应为 ${fmt.numero(esperadoTotal / 1000, 1)} 吨。实际产量不是手写的，而是称重单的汇总。`,
          })}
        />

        <CartaoMetrica
          icone={Sprout}
          cor="cinzento"
          rotulo={tr({
            pt: 'Plantas estabelecidas',
            en: 'Established plants',
            zh: '定植株数',
          })}
          valor={fmt.inteiro(plantasTotal)}
          frase={tr({
            pt: 'Contagem física, não estimativa. É o denominador do rendimento por árvore.',
            en: 'A physical count, not an estimate. It is the denominator of yield per tree.',
            zh: '实数清点，非估算。它是单株产量的分母。',
          })}
        />

        <CartaoMetrica
          icone={Leaf}
          cor="cinzento"
          rotulo={tr({
            pt: 'Culturas registadas',
            en: 'Crops on record',
            zh: '已登记作物',
          })}
          valor={fmt.inteiro(culturas.length)}
          frase={tr({
            pt: 'O nome botânico de cada uma é exigido no certificado fitossanitário de exportação.',
            en: 'The botanical name of each is required on the phytosanitary export certificate.',
            zh: '出口植物检疫证书要求列明每种作物的学名。',
          })}
        />
      </div>

      <Painel
        titulo={tr({
          pt: 'Ciclos de cultura em curso',
          en: 'Crop cycles in progress',
          zh: '进行中的生长周期',
        })}
        descricao={tr({
          pt: 'Campanha 2025/26 · a plantação de 2018 está no ano 8 e a de 2020 no ano 6',
          en: 'Season 2025/26 · the 2018 planting is in year 8 and the 2020 planting in year 6',
          zh: '2025/26 生产季 · 2018 年定植已第 8 年，2020 年定植已第 6 年',
        })}
        denso
      >
        <Tabela
          linhas={ciclos}
          chave={(c) => c.codigo}
          colunas={[
            {
              chave: 'codigo',
              cabecalho: tr({ pt: 'Ciclo', en: 'Cycle', zh: '生长周期' }),
              render: (c) => <Codigo forte>{c.codigo}</Codigo>,
            },
            {
              chave: 'talhao',
              cabecalho: tr(COL.talhao),
              render: (c) => (
                <Link to={`/talhoes/${c.talhao}`} className="hover:underline">
                  <Codigo>{c.talhao}</Codigo>
                </Link>
              ),
            },
            {
              chave: 'idade',
              cabecalho: tr({ pt: 'Idade', en: 'Age', zh: '树龄' }),
              numerica: true,
              render: (c) =>
                tr({
                  pt: `${idadeAnos(c, HOJE)} anos`,
                  en: `${idadeAnos(c, HOJE)} years`,
                  zh: `${idadeAnos(c, HOJE)} 年`,
                }),
              ordenarPor: (c) => idadeAnos(c, HOJE),
            },
            {
              chave: 'plantas',
              cabecalho: tr({ pt: 'Plantas', en: 'Plants', zh: '株数' }),
              numerica: true,
              render: (c) => fmt.inteiro(c.plantas_estabelecidas),
            },
            {
              chave: 'esperado',
              cabecalho: tr({ pt: 'Esperado', en: 'Expected', zh: '应有' }),
              numerica: true,
              render: (c) =>
                `${fmt.numero(esperadoPorIdade(idadeAnos(c, HOJE)), 1)} ${fmt.unidade('kg_arvore')}`,
            },
            {
              chave: 'real',
              cabecalho: tr({ pt: 'Obtido', en: 'Achieved', zh: '实得' }),
              numerica: true,
              render: (c) => (
                <span className="font-medium text-texto">
                  {fmt.numero((c.producao_real?.valor ?? 0) / c.plantas_estabelecidas, 2)}{' '}
                  {fmt.unidade('kg_arvore')}
                </span>
              ),
              ordenarPor: (c) => (c.producao_real?.valor ?? 0) / c.plantas_estabelecidas,
            },
            {
              chave: 'realizacao',
              cabecalho: tr({ pt: 'Realização', en: 'Realisation', zh: '实现率' }),
              numerica: true,
              render: (c) => {
                const pct =
                  c.producao_prevista.valor > 0
                    ? ((c.producao_real?.valor ?? 0) / c.producao_prevista.valor) * 100
                    : undefined;
                if (pct === undefined) return <Semaforo cor="cinzento" rotulo="—" />;
                const cor = pct >= 80 ? 'verde' : pct >= 60 ? 'ambar' : 'vermelho';
                return (
                  <div className="flex min-w-[92px] flex-col items-end gap-1">
                    <Semaforo cor={cor} rotulo={fmt.percentagem(pct)} />
                    <Barra fraccao={pct / 100} cor={cor} />
                  </div>
                );
              },
              ordenarPor: (c) => (c.producao_real?.valor ?? 0) / c.producao_prevista.valor,
            },
            {
              chave: 'contagem',
              cabecalho: tr({
                pt: 'Última contagem',
                en: 'Last count',
                zh: '最近清点',
              }),
              numerica: true,
              render: (c) => fmt.data(c.data_ultima_contagem),
            },
          ]}
        />
      </Painel>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        <div className="flex flex-col gap-4">
          <Painel
            titulo={tr({ pt: 'Culturas', en: 'Crops', zh: '作物' })}
            descricao={tr({
              pt: 'O nome botânico é exigido no certificado fitossanitário de exportação.',
              en: 'The botanical name is required on the phytosanitary export certificate.',
              zh: '出口植物检疫证书要求列明学名。',
            })}
            denso
          >
            <Tabela
              linhas={culturas}
              chave={(c) => c.codigo}
              colunas={[
                {
                  chave: 'cod',
                  cabecalho: tr(COL.codigo),
                  render: (c) => <Codigo forte>{c.codigo}</Codigo>,
                },
                {
                  chave: 'nome',
                  cabecalho: tr({ pt: 'Nome comum', en: 'Common name', zh: '通用名' }),
                  render: (c) => tr(CULTURAS[c.abreviatura]),
                },
                {
                  chave: 'botanico',
                  cabecalho: tr({
                    pt: 'Nome botânico',
                    en: 'Botanical name',
                    zh: '学名',
                  }),
                  render: (c) => <span className="italic text-texto-2">{c.nome_botanico}</span>,
                },
                {
                  chave: 'ciclo',
                  cabecalho: tr({ pt: 'Ciclo', en: 'Life cycle', zh: '生命周期' }),
                  render: (c) => tr(ROTULO_CICLO_VIDA[c.ciclo]),
                },
                {
                  chave: 'ambito',
                  cabecalho: tr({
                    pt: 'Âmbito de certificação',
                    en: 'Certification scope',
                    zh: '认证范围',
                  }),
                  render: (c) => (
                    <span className="text-texto-2">{tr(ROTULO_AMBITO[c.ambito_certificacao])}</span>
                  ),
                },
                {
                  chave: 'talhoes',
                  cabecalho: tr({ pt: 'Talhões', en: 'Plots', zh: '地块数' }),
                  numerica: true,
                  render: (c) =>
                    fmt.inteiro(talhoes.filter((t) => t.cultura === c.abreviatura).length),
                },
              ]}
            />
          </Painel>

          <Painel
            titulo={tr({ pt: 'Variedades', en: 'Varieties', zh: '品种' })}
            denso
          >
            <Tabela
              linhas={variedades}
              chave={(v) => v.codigo}
              colunas={[
                {
                  chave: 'cod',
                  cabecalho: tr(COL.codigo),
                  render: (v) => <Codigo forte>{v.codigo}</Codigo>,
                },
                { chave: 'nome', cabecalho: tr(COL.designacao), render: (v) => v.designacao },
                {
                  chave: 'cultura',
                  cabecalho: tr(COL.cultura),
                  render: (v) =>
                    tr(CULTURAS[v.cultura.replace('CUL-', '') as keyof typeof CULTURAS]),
                },
                {
                  chave: 'origem',
                  cabecalho: tr({ pt: 'Origem', en: 'Origin', zh: '苗源' }),
                  render: (v) => tr(ROTULO_ORIGEM[v.origem_material]),
                },
                {
                  chave: 'queda',
                  cabecalho: tr({
                    pt: 'Queda espontânea',
                    en: 'Natural drop',
                    zh: '自然落果',
                  }),
                  render: (v) =>
                    v.queda_espontanea === undefined ? (
                      <span className="text-texto-3">—</span>
                    ) : (
                      <Semaforo
                        cor={v.queda_espontanea ? 'verde' : 'ambar'}
                        rotulo={tr(v.queda_espontanea ? UI.sim : UI.nao)}
                      />
                    ),
                },
                {
                  chave: 'maneio',
                  cabecalho: tr({
                    pt: 'Observações de maneio',
                    en: 'Management notes',
                    zh: '栽培要点',
                  }),
                  render: (v) => <span className="text-[11.5px] text-texto-3">{v.observacoes_maneio ?? '—'}</span>,
                },
              ]}
            />
          </Painel>
        </div>

        <Painel
          titulo={tr({
            pt: 'Curva de referência da macadâmia',
            en: 'Macadamia reference curve',
            zh: '澳洲坚果基准曲线',
          })}
          descricao={tr({
            pt: `${FONTE_CURVA.pt}. Base do K-PRD-03.`,
            en: `${FONTE_CURVA.en}. Basis of K-PRD-03.`,
            zh: `${FONTE_CURVA.zh}。K-PRD-03 的依据。`,
          })}
        >
          <div className="flex flex-col gap-1.5">
            {CURVA_MACADAMIA.filter((c) => c.ano >= 4).map((c) => {
              const max = 13;
              return (
                <div key={c.ano} className="grid grid-cols-[52px_1fr_66px] items-center gap-3">
                  <span className="num text-[11.5px] text-texto-3">
                    {tr({ pt: `Ano ${c.ano}`, en: `Year ${c.ano}`, zh: `第 ${c.ano} 年` })}
                  </span>
                  <Barra fraccao={c.kg_arvore / max} cor="cinzento" />
                  <span className="num text-right text-[11.5px] text-texto-2">
                    {fmt.numero(c.kg_arvore, 1)} kg
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 border-t border-fio pt-3 text-[11px] leading-relaxed text-texto-3">
            {tr({
              pt: 'É um piso conservador, não um tecto. A curva de origem foi construída para 312 árvores/ha; a densidade baixa da Farma Alcinda deve permitir, em maturidade, um desempenho por árvore superior — hipótese a validar com dados próprios. O que a densidade limita é o rendimento por hectare, não por árvore. Por isso o indicador primário é kg por árvore.',
              en: 'This is a conservative floor, not a ceiling. The source curve was built for 312 trees/ha; the low density at Farma Alcinda should allow higher per-tree performance at maturity — a hypothesis to be validated with its own data. What density limits is yield per hectare, not per tree. That is why the primary indicator is kg per tree.',
              zh: '这是保守的下限，而非上限。原曲线按每公顷 312 株构建；Farma Alcinda 密度较低，进入盛果期后单株产量应更高——此假设需用自有数据验证。密度限制的是单位面积产量，而非单株产量。因此主指标采用单株公斤数。',
            })}
          </p>
        </Painel>
      </div>
    </Pagina>
  );
}
