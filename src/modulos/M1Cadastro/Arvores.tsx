/**
 * M1 — Árvores. Formulário F-02, entidade E-08.
 *
 * «Este é o registo que torna possível medir o que hoje não se mede.»
 * Estão marcadas as 30 árvores da amostra permanente por talhão (F-15); o
 * inventário integral das 10 780 árvores é o SOP-10, ainda por fazer — e é por
 * isso que o K-PRD-05 aparece a cinzento em vez de aparecer a verde.
 */

import { Plus, Sprout, TreeDeciduous, TriangleAlert } from 'lucide-react';
import React from 'react';

import { useArvores, useTalhoes } from '../../dados/consultas';
import { useFmt, useT } from '../../i18n/contexto';
import { COL } from '../../i18n/comuns';
import { ROTULO_ESTADO_ARVORE, ROTULO_VIGOR } from '../../dominio/territorio';
import { Botao, Pagina, Seletor } from '../../design/Pagina';
import { CartaoMetrica, Codigo, Painel, Semaforo, Tabela } from '../../design/primitivas';
import { FormularioF02 } from './FormularioF02';

export function Arvores() {
  const tr = useT();
  const fmt = useFmt();
  const arvores = useArvores();
  const talhoes = useTalhoes();
  const [talhao, setTalhao] = React.useState('');
  const [aRegistar, setARegistar] = React.useState(false);

  const filtradas = talhao ? arvores.filter((a) => a.talhao === talhao) : arvores;
  const vivas = filtradas.filter((a) => a.estado_arvore === 'viva').length;
  const plantadas = talhoes.reduce((s, t) => s + (t.total_plantas_estabelecidas ?? 0), 0);
  const taxaAmostra = filtradas.length > 0 ? (vivas / filtradas.length) * 100 : undefined;
  const cobertura = plantadas > 0 ? (arvores.length / plantadas) * 100 : 0;

  return (
    <Pagina
      accoes={
        <div className="flex items-center gap-2">
          <Seletor value={talhao} onChange={setTalhao}>
            <option value="">
              {tr({ pt: 'Todos os talhões', en: 'All plots', zh: '全部地块' })}
            </option>
            {talhoes.map((t) => (
              <option key={t.codigo} value={t.codigo}>
                {t.codigo} · {t.designacao}
              </option>
            ))}
          </Seletor>
          {!aRegistar && (
            <Botao variante="primario" onClick={() => setARegistar(true)}>
              <Plus className="size-3.5" />
              {tr({ pt: 'Registar árvore', en: 'Record a tree', zh: '登记树木' })}
            </Botao>
          )}
        </div>
      }
    >
      {aRegistar && <FormularioF02 aoFechar={() => setARegistar(false)} />}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <CartaoMetrica
          destaque
          icone={TriangleAlert}
          cor="cinzento"
          rotulo={tr({ pt: 'Inventário anual', en: 'Annual inventory', zh: '年度盘点' })}
          valor={fmt.percentagem(cobertura, 1)}
          legenda={tr({ pt: 'por completar', en: 'to complete', zh: '待完成' })}
          frase={tr({
            pt: `${fmt.inteiro(arvores.length)} árvores registadas de ${fmt.inteiro(plantadas)} plantadas. Sem inventário integral o K-PRD-05 não tem valor, e o K-PRD-01 é calculado sobre o total plantado — com o facto declarado. É a pendência PEN-06.`,
            en: `${fmt.inteiro(arvores.length)} trees on record out of ${fmt.inteiro(plantadas)} planted. Without a full inventory K-PRD-05 has no value, and K-PRD-01 is computed over the planted total — with that fact declared. This is open question PEN-06.`,
            zh: `已登记 ${fmt.inteiro(arvores.length)} 棵，种植总数 ${fmt.inteiro(plantadas)} 棵。没有全面盘点，K-PRD-05 无法取值，K-PRD-01 只能按种植总数计算——并将这一事实声明。此为待决事项 PEN-06。`,
          })}
          para="/pendencias"
        />

        <CartaoMetrica
          icone={TreeDeciduous}
          cor={taxaAmostra === undefined ? 'cinzento' : taxaAmostra >= 97 ? 'verde' : 'ambar'}
          rotulo={tr({
            pt: 'Sobrevivência na amostra',
            en: 'Survival in the sample',
            zh: '样本存活率',
          })}
          valor={fmt.numero(taxaAmostra ?? 0, 1)}
          unidade="%"
          codigo="K-PRD-05"
          frase={tr({
            pt: `${fmt.inteiro(vivas)} vivas em ${fmt.inteiro(filtradas.length)} árvores da amostra permanente. Meta: 97%.`,
            en: `${fmt.inteiro(vivas)} alive out of ${fmt.inteiro(filtradas.length)} trees in the permanent sample. Target: 97%.`,
            zh: `固定样本 ${fmt.inteiro(filtradas.length)} 棵中有 ${fmt.inteiro(vivas)} 棵存活。目标：97%。`,
          })}
        />

        <CartaoMetrica
          icone={Sprout}
          cor="cinzento"
          rotulo={tr({
            pt: 'Amostra permanente',
            en: 'Permanent sample',
            zh: '固定样本',
          })}
          valor={fmt.inteiro(filtradas.length)}
          unidade={fmt.unidade('arvore')}
          frase={tr({
            pt: 'Trinta por talhão, pesadas a cada ronda (F-15) e extrapoladas para o talhão inteiro. Não substituem o inventário.',
            en: 'Thirty per plot, weighed at every round (F-15) and extrapolated to the whole plot. They do not replace the inventory.',
            zh: '每地块 30 棵，每轮采收均称重（F-15）并外推至整个地块。它不能代替盘点。',
          })}
        />
      </div>

      <Painel
        titulo={tr({
          pt: 'Árvores da amostra',
          en: 'Trees in the sample',
          zh: '样本树木',
        })}
        denso
      >
        <Tabela
          linhas={filtradas}
          chave={(a) => a.codigo}
          colunas={[
            {
              chave: 'codigo',
              cabecalho: tr(COL.codigo),
              render: (a) => <Codigo forte>{a.codigo}</Codigo>,
            },
            { chave: 'talhao', cabecalho: tr(COL.talhao), render: (a) => <Codigo>{a.talhao}</Codigo> },
            {
              chave: 'linha',
              cabecalho: tr({ pt: 'Linha', en: 'Row', zh: '行' }),
              numerica: true,
              render: (a) => a.linha,
              ordenarPor: (a) => a.linha,
            },
            {
              chave: 'pos',
              cabecalho: tr({ pt: 'Posição', en: 'Position', zh: '株位' }),
              numerica: true,
              render: (a) => a.posicao,
            },
            {
              chave: 'variedade',
              cabecalho: tr({ pt: 'Variedade', en: 'Variety', zh: '品种' }),
              render: (a) => <Codigo>{a.variedade}</Codigo>,
            },
            {
              chave: 'estado',
              cabecalho: tr(COL.estado),
              render: (a) => (
                <Semaforo
                  cor={a.estado_arvore === 'viva' ? 'verde' : a.estado_arvore === 'substituida' ? 'ambar' : 'vermelho'}
                  rotulo={tr(ROTULO_ESTADO_ARVORE[a.estado_arvore])}
                />
              ),
            },
            {
              chave: 'vigor',
              cabecalho: tr({ pt: 'Vigor', en: 'Vigour', zh: '长势' }),
              render: (a) =>
                a.vigor ? (
                  <Semaforo
                    cor={a.vigor === 'bom' ? 'verde' : a.vigor === 'medio' ? 'ambar' : 'vermelho'}
                    rotulo={tr(ROTULO_VIGOR[a.vigor])}
                  />
                ) : (
                  <span className="text-texto-3">—</span>
                ),
            },
            {
              chave: 'altura',
              cabecalho: tr({ pt: 'Altura', en: 'Height', zh: '树高' }),
              numerica: true,
              render: (a) => fmt.quantidade(a.altura_m),
            },
            {
              chave: 'diametro',
              cabecalho: tr({ pt: 'Diâmetro', en: 'Diameter', zh: '干径' }),
              numerica: true,
              render: (a) => fmt.quantidade(a.diametro_tronco_cm),
            },
            {
              chave: 'obs',
              cabecalho: tr({ pt: 'Observada', en: 'Observed', zh: '观察日' }),
              numerica: true,
              render: (a) => fmt.data(a.data_observacao),
            },
          ]}
        />
      </Painel>
    </Pagina>
  );
}
