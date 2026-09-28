/**
 * M1 — Fontes de água (E-03).
 *
 * O registo em mm por hectare, e não em litros por planta, é o que torna
 * imediatamente visível o erro de dotação assinalado no §7.3 E-13.
 */

import { Droplets, Gauge, TriangleAlert } from 'lucide-react';

import { useFontesAgua, useTalhoes } from '../../dados/consultas';
import { useFmt, useT } from '../../i18n/contexto';
import { COL } from '../../i18n/comuns';
import { ROTULO_FONTE_AGUA, ROTULO_SISTEMA_REGA } from '../../dominio/territorio';
import { Pagina } from '../../design/Pagina';
import { CartaoMetrica, Codigo, Painel, Semaforo, Tabela } from '../../design/primitivas';

export function Agua() {
  const tr = useT();
  const fmt = useFmt();
  const fontes = useFontesAgua();
  const talhoes = useTalhoes();

  const capacidade = fontes.reduce((s, f) => s + f.capacidade_m3.valor, 0);
  const areaRegada = talhoes
    .filter((t) => t.sistema_rega !== 'sequeiro')
    .reduce((s, t) => s + t.area_plantada_ha.valor, 0);
  const arvores = talhoes.reduce((s, t) => s + (t.total_plantas_estabelecidas ?? 0), 0);

  // Dotação do plano: 17 a 22 L por planta e por semana nos meses de calor.
  const litrosSemanaMax = arvores * 22;
  const mmAnoMax = areaRegada > 0 ? ((litrosSemanaMax / 1000) * 52) / (areaRegada * 10) : 0;

  return (
    <Pagina>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <CartaoMetrica
          destaque
          icone={TriangleAlert}
          cor="vermelho"
          rotulo={tr({
            pt: 'Dotação do plano',
            en: 'Allocation in the plan',
            zh: '计划灌水定额',
          })}
          valor={fmt.numero(mmAnoMax, 1)}
          unidade={tr({ pt: 'mm/ano', en: 'mm/year', zh: '毫米/年' })}
          legenda={
            mmAnoMax > 0
              ? tr({
                  pt: `${fmt.numero(60 / mmAnoMax, 0)}× abaixo`,
                  en: `${fmt.numero(60 / mmAnoMax, 0)}× below`,
                  zh: `低 ${fmt.numero(60 / mmAnoMax, 0)} 倍`,
                })
              : '—'
          }
          frase={tr({
            pt: 'A referência internacional para macadâmia regada é 60 a 162 mm/ano. É este o erro que o registo em mm por hectare, em vez de litros por planta, torna imediatamente visível. Pendência PEN-05.',
            en: 'The international reference for irrigated macadamia is 60 to 162 mm/year. This is the error that recording in mm per hectare, rather than litres per plant, makes immediately visible. Open question PEN-05.',
            zh: '灌溉澳洲坚果的国际基准为每年 60 至 162 毫米。正是按每公顷毫米而非每株升数记录，才让这个错误一目了然。待决事项 PEN-05。',
          })}
          para="/pendencias"
        />

        <CartaoMetrica
          icone={Droplets}
          cor="cinzento"
          rotulo={tr({
            pt: 'Capacidade instalada',
            en: 'Installed capacity',
            zh: '已建容量',
          })}
          valor={fmt.inteiro(capacidade)}
          unidade="m³"
          frase={tr({
            pt: `${fmt.contagem(fontes.length, 'fonte registada', 'fontes registadas')}. A bacia de retenção principal é permanente.`,
            en: `${fmt.contagem(fontes.length, 'source on record', 'sources on record')}. The main retention basin is permanent.`,
            zh: `已登记 ${fmt.inteiro(fontes.length)} 处水源。主蓄水池为常年水源。`,
          })}
        />

        <CartaoMetrica
          icone={Gauge}
          cor="cinzento"
          rotulo={tr({ pt: 'Área regada', en: 'Irrigated area', zh: '灌溉面积' })}
          valor={fmt.numero(areaRegada, 1)}
          unidade={fmt.unidade('ha')}
          frase={tr({
            pt: `${fmt.inteiro(arvores)} árvores servidas por tanque rebocado.`,
            en: `${fmt.inteiro(arvores)} trees served by towed tank.`,
            zh: `${fmt.inteiro(arvores)} 棵树由拖挂水罐供水。`,
          })}
        />
      </div>

      <Painel
        titulo={tr({
          pt: 'Pontos e fontes de água',
          en: 'Water points and sources',
          zh: '取水点与水源',
        })}
        denso
      >
        <Tabela
          linhas={fontes}
          chave={(f) => f.codigo}
          colunas={[
            {
              chave: 'cod',
              cabecalho: tr(COL.codigo),
              render: (f) => <Codigo forte>{f.codigo}</Codigo>,
            },
            { chave: 'nome', cabecalho: tr(COL.designacao), render: (f) => f.designacao },
            {
              chave: 'tipo',
              cabecalho: tr(COL.tipo),
              render: (f) => tr(ROTULO_FONTE_AGUA[f.tipo_fonte]),
            },
            {
              chave: 'cap',
              cabecalho: tr({ pt: 'Capacidade', en: 'Capacity', zh: '容量' }),
              numerica: true,
              render: (f) => fmt.quantidade(f.capacidade_m3, 0),
            },
            {
              chave: 'perm',
              cabecalho: tr({ pt: 'Permanente', en: 'Permanent', zh: '常年' }),
              render: (f) => (
                <Semaforo
                  cor={f.permanente ? 'verde' : 'ambar'}
                  rotulo={
                    f.permanente
                      ? tr({ pt: 'Sim', en: 'Yes', zh: '是' })
                      : tr({ pt: 'Não', en: 'No', zh: '否' })
                  }
                />
              ),
            },
            {
              chave: 'licenca',
              cabecalho: tr({ pt: 'Licença de uso', en: 'Use licence', zh: '取水许可' }),
              render: (f) =>
                f.licenca_uso ? (
                  <Codigo>{f.licenca_uso}</Codigo>
                ) : (
                  <Semaforo
                    cor="ambar"
                    rotulo={tr({ pt: 'Por registar', en: 'Not recorded', zh: '待登记' })}
                  />
                ),
            },
            {
              chave: 'analise',
              cabecalho: tr({ pt: 'Última análise', en: 'Last analysis', zh: '最近检测' }),
              numerica: true,
              render: (f) => fmt.data(f.data_ultima_analise),
            },
          ]}
        />
      </Painel>

      <Painel
        titulo={tr({ pt: 'Talhões servidos', en: 'Plots served', zh: '供水地块' })}
        denso
      >
        <Tabela
          linhas={talhoes}
          chave={(t) => t.codigo}
          colunas={[
            {
              chave: 'cod',
              cabecalho: tr(COL.talhao),
              render: (t) => <Codigo forte>{t.codigo}</Codigo>,
            },
            { chave: 'nome', cabecalho: tr(COL.designacao), render: (t) => t.designacao },
            {
              chave: 'sistema',
              cabecalho: tr({
                pt: 'Sistema de rega',
                en: 'Irrigation system',
                zh: '灌溉方式',
              }),
              render: (t) => tr(ROTULO_SISTEMA_REGA[t.sistema_rega]),
            },
            {
              chave: 'fonte',
              cabecalho: tr({ pt: 'Fonte', en: 'Source', zh: '水源' }),
              render: (t) => <Codigo>{t.fonte_agua ?? '—'}</Codigo>,
            },
            {
              chave: 'area',
              cabecalho: tr({
                pt: 'Área plantada',
                en: 'Planted area',
                zh: '种植面积',
              }),
              numerica: true,
              render: (t) => fmt.quantidade(t.area_plantada_ha),
            },
            {
              chave: 'arvores',
              cabecalho: tr({ pt: 'Árvores', en: 'Trees', zh: '树木' }),
              numerica: true,
              render: (t) => fmt.inteiro(t.total_plantas_estabelecidas ?? 0),
            },
          ]}
        />
      </Painel>

      <p className="text-[11.5px] leading-relaxed text-texto-3">
        {tr({
          pt: `O plano de negócios recomenda 17 a 22 litros por planta e por semana nos meses de maior calor. A 100 árvores por hectare, isso equivale a cerca de ${fmt.numero(mmAnoMax, 1)} mm por ano — entre 5 e 18 vezes abaixo de qualquer referência internacional para macadâmia regada. Este é exactamente o tipo de erro que o registo em mm por hectare, em vez de litros por planta, torna imediatamente visível (§7.3 E-13).`,
          en: `The business plan recommends 17 to 22 litres per plant per week in the hottest months. At 100 trees per hectare that comes to about ${fmt.numero(mmAnoMax, 1)} mm per year — 5 to 18 times below any international reference for irrigated macadamia. This is exactly the kind of error that recording in mm per hectare, rather than litres per plant, makes immediately visible (§7.3 E-13).`,
          zh: `商业计划建议在最炎热的月份每株每周灌水 17 至 22 升。按每公顷 100 株计，约合每年 ${fmt.numero(mmAnoMax, 1)} 毫米——比灌溉澳洲坚果的任何国际基准低 5 至 18 倍。这正是按每公顷毫米而非每株升数记录所能立即暴露的错误（§7.3 E-13）。`,
        })}
      </p>
    </Pagina>
  );
}
