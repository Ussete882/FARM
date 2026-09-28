/**
 * M3 — Jornas e presenças (F-06, E-18).
 *
 * «Este é o registo mais frequente do sistema. É a base do custo de
 * mão-de-obra, da produtividade e do cumprimento legal do registo de horas.»
 */

import { CalendarCheck, Coins, Plus, TrendingDown } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import { useJornas, useNomes, useTalhoes } from '../../dados/consultas';
import { useFmt, useT } from '../../i18n/contexto';
import { COL } from '../../i18n/comuns';
import { INDICADOR_POR_CODIGO } from '../../dominio/indicadores';
import { ROTULO_PRESENCA } from '../../dominio/pessoas';
import { TIPO_OPERACAO_POR_CODIGO } from '../../dominio/operacoes';
import { desempenhoDaEquipa, kPes03 } from '../../regras/calculos';
import { avaliar } from '../../regras/semaforo';
import { Botao, Pagina, Seletor } from '../../design/Pagina';
import { CartaoMetrica, Codigo, Painel, Semaforo, Tabela } from '../../design/primitivas';
import { FormularioF06 } from './FormularioF06';

export function Jornas() {
  const tr = useT();
  const fmt = useFmt();
  const jornas = useJornas();
  const nomes = useNomes();
  const talhoes = useTalhoes();
  const [dia, setDia] = React.useState('');
  const [aRegistar, setARegistar] = React.useState(false);

  const dias = [...new Set(jornas.map((j) => j.data))].sort().reverse();
  const filtradas = dia ? jornas.filter((j) => j.data === dia) : jornas;

  const assiduidade = kPes03(filtradas);
  const presencas = filtradas.filter((j) => j.presenca === 'presente');
  const custo = filtradas.reduce((s, j) => s + (j.custo_calculado?.valor ?? 0), 0);

  const areaTotal = talhoes.reduce((s, t) => s + t.area_plantada_ha.valor, 0);
  const custoPorHectare = areaTotal > 0 ? custo / areaTotal : undefined;

  const desempenho = desempenhoDaEquipa(filtradas);
  const abaixo = desempenho.filter((d) => d.abaixoLimiar).length;

  return (
    <Pagina
      accoes={
        <div className="flex items-center gap-2">
          <Seletor value={dia} onChange={setDia}>
            <option value="">
              {tr({ pt: 'Todo o período', en: 'Whole period', zh: '全部期间' })}
            </option>
            {dias.map((d) => (
              <option key={d} value={d}>
                {fmt.diaDaSemana(d)}, {fmt.data(d)}
              </option>
            ))}
          </Seletor>
          {!aRegistar && (
            <Botao variante="primario" onClick={() => setARegistar(true)}>
              <Plus className="size-3.5" />
              {tr({
                pt: 'Folha de presença',
                en: 'Attendance sheet',
                zh: '考勤表',
              })}
            </Botao>
          )}
        </div>
      }
    >
      {aRegistar && <FormularioF06 aoFechar={() => setARegistar(false)} />}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <CartaoMetrica
          destaque
          icone={CalendarCheck}
          cor={avaliar(assiduidade.valor, INDICADOR_POR_CODIGO.get('K-PES-03')!).cor}
          rotulo={tr({ pt: 'Assiduidade', en: 'Attendance', zh: '出勤率' })}
          valor={assiduidade.valor === undefined ? '—' : fmt.numero(assiduidade.valor, 1)}
          unidade="%"
          legenda={tr({ pt: 'meta ≥ 95%', en: 'target ≥ 95%', zh: '目标 ≥ 95%' })}
          frase={tr({
            pt: `${fmt.inteiro(presencas.length)} presenças em ${fmt.inteiro(filtradas.length)} jornas registadas. Uma jorna é uma pessoa-dia, e o código é único por pessoa e por dia — a validação V17 impede o registo duplicado.`,
            en: `${fmt.inteiro(presencas.length)} days present across ${fmt.inteiro(filtradas.length)} worker-days on record. A worker-day is one person-day, and the code is unique per person per day — validation V17 stops duplicate entries.`,
            zh: `已登记 ${fmt.inteiro(filtradas.length)} 个工日，其中出勤 ${fmt.inteiro(presencas.length)} 人次。一个工日即一人一天，编码按人按日唯一——校验 V17 阻止重复录入。`,
          })}
        />

        <CartaoMetrica
          icone={Coins}
          cor="cinzento"
          rotulo={tr({
            pt: 'Custo de mão-de-obra',
            en: 'Labour cost',
            zh: '用工成本',
          })}
          valor={fmt.numero(custo, 0)}
          unidade="MT"
          codigo="K-PES-01"
          frase={
            custoPorHectare === undefined
              ? tr({
                  pt: 'Derivado da remuneração de cada pessoa e das jornas registadas.',
                  en: 'Derived from each person’s remuneration and the worker-days on record.',
                  zh: '由每人报酬与已登记工日推算而来。',
                })
              : tr({
                  pt: `${fmt.meticais(custoPorHectare)} por hectare, sobre ${fmt.numero(areaTotal, 1)} ha plantados.`,
                  en: `${fmt.meticais(custoPorHectare)} per hectare, over ${fmt.numero(areaTotal, 1)} ha planted.`,
                  zh: `每公顷 ${fmt.meticais(custoPorHectare)}，基于 ${fmt.numero(areaTotal, 1)} 公顷种植面积。`,
                })
          }
        />

        <CartaoMetrica
          icone={TrendingDown}
          cor={abaixo === 0 ? 'verde' : 'ambar'}
          rotulo={tr({
            pt: 'Abaixo de 60% da mediana',
            en: 'Below 60% of the median',
            zh: '低于中位数 60%',
          })}
          valor={fmt.inteiro(abaixo)}
          codigo="W03"
          frase={tr({
            pt: 'Produção individual contra a mediana da própria equipa, no mesmo dia, tarefa e unidade. É uma excepção que pede explicação, não uma sanção.',
            en: 'Individual output against the median of the person’s own team, on the same day, task and unit. It is an exception that asks for an explanation, not a sanction.',
            zh: '个人产量与本班组在同日、同作业、同单位下的中位数对比。这是需要解释的例外，而非处罚。',
          })}
        />
      </div>

      <Painel
        titulo={tr({
          pt: `${filtradas.length} jornas`,
          en: `${filtradas.length} worker-days`,
          zh: `${filtradas.length} 个工日`,
        })}
        denso
      >
        <Tabela
          linhas={[...filtradas].sort((a, b) => (a.data < b.data ? 1 : -1)).slice(0, 400)}
          chave={(j) => j.codigo}
          colunas={[
            {
              chave: 'cod',
              cabecalho: tr({ pt: 'Jorna', en: 'Worker-day', zh: '工日' }),
              render: (j) => <Codigo forte>{j.codigo}</Codigo>,
            },
            {
              chave: 'data',
              cabecalho: tr(COL.data),
              numerica: true,
              render: (j) => fmt.data(j.data),
              ordenarPor: (j) => j.data,
            },
            {
              chave: 'trab',
              cabecalho: tr(COL.trabalhador),
              render: (j) => (
                <Link to={`/trabalhadores/${j.trabalhador}`} className="hover:underline">
                  <span className="text-texto-2">{nomes.get(j.trabalhador) ?? j.trabalhador}</span>
                </Link>
              ),
            },
            {
              chave: 'equipa',
              cabecalho: tr(COL.equipa),
              render: (j) => <Codigo>{j.equipa}</Codigo>,
            },
            {
              chave: 'talhao',
              cabecalho: tr(COL.talhao),
              render: (j) => <Codigo>{j.talhao ?? '—'}</Codigo>,
            },
            {
              chave: 'tarefa',
              cabecalho: tr({ pt: 'Tarefa', en: 'Task', zh: '作业' }),
              render: (j) => {
                const tipo = TIPO_OPERACAO_POR_CODIGO.get(j.tarefa);
                return (
                  <span className="text-texto-2">{tipo ? tr(tipo.designacao) : j.tarefa}</span>
                );
              },
            },
            {
              chave: 'presenca',
              cabecalho: tr({ pt: 'Presença', en: 'Attendance', zh: '出勤' }),
              render: (j) => (
                <Semaforo
                  cor={
                    j.presenca === 'presente'
                      ? 'verde'
                      : j.presenca === 'falta_injustificada'
                        ? 'vermelho'
                        : 'ambar'
                  }
                  rotulo={tr(ROTULO_PRESENCA[j.presenca])}
                />
              ),
            },
            {
              chave: 'horas',
              cabecalho: tr({ pt: 'Horas', en: 'Hours', zh: '工时' }),
              numerica: true,
              render: (j) => fmt.quantidade(j.horas_normais),
            },
            {
              chave: 'producao',
              cabecalho: tr({
                pt: 'Produção individual',
                en: 'Individual output',
                zh: '个人产量',
              }),
              numerica: true,
              render: (j) => fmt.quantidade(j.producao_individual),
            },
            {
              chave: 'custo',
              cabecalho: tr(COL.custo),
              numerica: true,
              render: (j) => fmt.meticais(j.custo_calculado?.valor ?? 0),
            },
          ]}
        />
      </Painel>

      {filtradas.length > 400 && (
        <p className="text-[11px] text-texto-3">
          {tr({
            pt: `Mostradas as 400 jornas mais recentes de ${fmt.inteiro(filtradas.length)}. Filtre por dia para ver o resto — nenhuma foi excluída do cálculo dos indicadores acima.`,
            en: `Showing the 400 most recent worker-days out of ${fmt.inteiro(filtradas.length)}. Filter by day to see the rest — none were excluded from the indicators above.`,
            zh: `共 ${fmt.inteiro(filtradas.length)} 个工日，仅显示最近 400 个。按日筛选可查看其余——上方指标的计算并未遗漏任何一个。`,
          })}
        </p>
      )}
    </Pagina>
  );
}
