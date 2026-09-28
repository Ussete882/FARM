/**
 * Parâmetros versionados (§19.2).
 *
 * «Nenhum destes valores pode ser escrito no código do sistema. Todos mudam
 * por diploma, e alguns com efeito retroactivo.» Daí a série histórica: uma
 * jorna de Maio de 2025 é avaliada contra o mínimo que vigorava em Maio de
 * 2025, e não contra o de hoje.
 */

import { BadgeCheck, History, Scale } from 'lucide-react';
import React from 'react';

import { HOJE } from '../../dados/semente';
import { useFmt, useT } from '../../i18n/contexto';
import {
  FERIADOS_NACIONAIS_MMDD,
  PARAMETROS,
  parametroEm,
  parametrosPorConfirmar,
} from '@bastet/nucleo/parametros';
import { Pagina } from '../../design/Pagina';
import { CartaoMetrica, Codigo, Painel, Semaforo, Tabela } from '../../design/primitivas';

export function Parametros() {
  const tr = useT();
  const fmt = useFmt();
  const [data, setData] = React.useState(HOJE);

  const porConfirmar = parametrosPorConfirmar(data);
  const versoes = PARAMETROS.reduce((s, p) => s + p.serie.length, 0);

  return (
    <Pagina
      descricao={tr({
        pt: 'A tabela que o motor de regras consulta. Cada parâmetro tem série histórica com data de efeito, fonte e estado de confirmação — mude a data à direita para ver o que vigorava então.',
        en: 'The table the rules engine consults. Each parameter carries a historical series with effective date, source and confirmation status — change the date on the right to see what applied back then.',
        zh: '规则引擎所查阅的参数表。每个参数都有含生效日期、来源与确认状态的历史序列——更改右侧日期即可查看当时适用的取值。',
      })}
      accoes={
        <div className="flex items-center gap-2 rounded-full bg-cartao px-3.5 py-2">
          <span className="text-[12px] text-texto-3">
            {tr({ pt: 'Em vigor a', en: 'In force on', zh: '生效日期' })}
          </span>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="num bg-transparent text-[12.5px] font-medium text-texto outline-none"
          />
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <CartaoMetrica
          destaque
          icone={Scale}
          cor={porConfirmar.length > 0 ? 'ambar' : 'verde'}
          rotulo={tr({
            pt: 'Parâmetros em vigor',
            en: 'Parameters in force',
            zh: '生效中的参数',
          })}
          valor={fmt.inteiro(PARAMETROS.length)}
          legenda={tr({
            pt: `${porConfirmar.length} por confirmar`,
            en: `${porConfirmar.length} to confirm`,
            zh: `${porConfirmar.length} 项待确认`,
          })}
          frase={tr({
            pt: 'Limites de horas, idades mínimas, prazos de inscrição, férias, validade de análises e limiares agronómicos. É esta tabela que o motor de regras consulta antes de bloquear seja o que for.',
            en: 'Hour limits, minimum ages, registration deadlines, leave, analysis validity and agronomic thresholds. This is the table the rules engine consults before it blocks anything.',
            zh: '工时上限、最低年龄、参保期限、休假、检测有效期与农艺阈值。规则引擎在作出任何阻断之前，查阅的正是这张表。',
          })}
        />

        <CartaoMetrica
          icone={BadgeCheck}
          cor={porConfirmar.length > 0 ? 'ambar' : 'verde'}
          rotulo={tr({ pt: 'Por confirmar', en: 'To confirm', zh: '待确认' })}
          valor={fmt.inteiro(porConfirmar.length)}
          unidade={tr({
            pt: `de ${PARAMETROS.length}`,
            en: `of ${PARAMETROS.length}`,
            zh: `共 ${PARAMETROS.length} 项`,
          })}
          frase={tr({
            pt: 'Nenhum destes valores está escrito no código do sistema: todos mudam por diploma, e alguns com efeito retroactivo.',
            en: 'None of these values is written into the system’s code: they all change by statute, and some retroactively.',
            zh: '这些取值都不写死在系统代码里：它们均随法规变动，其中部分具有溯及力。',
          })}
          para="/pendencias"
        />

        <CartaoMetrica
          icone={History}
          cor="cinzento"
          rotulo={tr({ pt: 'Valores em série', en: 'Values in series', zh: '序列取值' })}
          valor={fmt.inteiro(versoes)}
          frase={tr({
            pt: 'Uma jorna de Maio de 2025 é julgada contra as horas e os acréscimos que vigoravam em Maio de 2025, e não contra os de hoje. É por isso que a série existe.',
            en: 'A worker-day from May 2025 is judged against the hours and premiums in force in May 2025, not against today’s. That is why the series exists.',
            zh: '2025 年 5 月的工日，依照 2025 年 5 月适用的工时与加成来判定，而非今天的规定。历史序列的意义正在于此。',
          })}
        />
      </div>

      <Painel
        titulo={tr({ pt: 'Valores em vigor', en: 'Values in force', zh: '生效取值' })}
        denso
      >
        <Tabela
          linhas={PARAMETROS}
          chave={(p) => p.codigo}
          colunas={[
            {
              chave: 'cod',
              cabecalho: tr({ pt: 'Código', en: 'Code', zh: '编码' }),
              render: (p) => <Codigo forte>{p.codigo}</Codigo>,
            },
            {
              chave: 'nome',
              cabecalho: tr({ pt: 'Parâmetro', en: 'Parameter', zh: '参数' }),
              render: (p) => tr(p.designacao),
            },
            {
              chave: 'valor',
              cabecalho: tr({ pt: 'Valor', en: 'Value', zh: '取值' }),
              numerica: true,
              render: (p) => {
                const v = parametroEm(p.codigo, data);
                if (!v)
                  return (
                    <span className="text-texto-3">
                      {tr({
                        pt: 'sem valor a esta data',
                        en: 'no value on this date',
                        zh: '该日期无取值',
                      })}
                    </span>
                  );
                return (
                  <span className="font-medium text-texto">
                    {fmt.numero(v.valor, v.valor % 1 === 0 ? 0 : 2)}{' '}
                    <span className="text-[11px] text-texto-3">{tr(p.unidade)}</span>
                  </span>
                );
              },
            },
            {
              chave: 'efeito',
              cabecalho: tr({ pt: 'Desde', en: 'Since', zh: '起始' }),
              numerica: true,
              render: (p) => fmt.data(parametroEm(p.codigo, data)?.data_efeito),
            },
            {
              chave: 'estado',
              cabecalho: tr({ pt: 'Estado', en: 'Status', zh: '状态' }),
              render: (p) => {
                const v = parametroEm(p.codigo, data);
                if (!v) return <Semaforo cor="cinzento" rotulo="—" />;
                return (
                  <Semaforo
                    cor={v.estado === 'confirmado' ? 'verde' : 'ambar'}
                    rotulo={
                      v.estado === 'confirmado'
                        ? tr({ pt: 'Confirmado', en: 'Confirmed', zh: '已确认' })
                        : tr({ pt: 'A confirmar', en: 'To confirm', zh: '待确认' })
                    }
                  />
                );
              },
            },
            {
              chave: 'fonte',
              cabecalho: tr({ pt: 'Fonte', en: 'Source', zh: '来源' }),
              render: (p) => {
                const v = parametroEm(p.codigo, data);
                return <span className="text-texto-2">{v ? tr(v.fonte) : '—'}</span>;
              },
            },
            {
              chave: 'versoes',
              cabecalho: tr({ pt: 'Versões', en: 'Versions', zh: '版本数' }),
              numerica: true,
              render: (p) => p.serie.length,
            },
          ]}
        />
      </Painel>

      <Painel
        titulo={tr({
          pt: 'Como se lê a série',
          en: 'How to read the series',
          zh: '如何读这张序列表',
        })}
        descricao={tr({
          pt: 'A retroactividade é a razão de existir esta tabela: uma alteração publicada hoje pode mudar o julgamento de registos de meses anteriores.',
          en: 'Retroactivity is why this table exists: a change published today can alter how records from previous months are judged.',
          zh: '这张表存在的理由是溯及力：今天发布的变更，可能改变对前几个月记录的判定。',
        })}
      >
        <p className="max-w-3xl text-[12.5px] leading-relaxed text-texto-2">
          {tr({
            pt: 'Cada parâmetro guarda todos os valores por que passou, com data de efeito e fonte. Uma jorna de Maio de 2025 é julgada contra o limite que vigorava em Maio de 2025, e não contra o de hoje — mude a data no cabeçalho para ver o que a tabela dizia então. Um parâmetro marcado «a confirmar» continua a ser aplicado: bloquear com um valor provável é melhor do que não bloquear, desde que o estado viaje com o valor.',
            en: 'Each parameter keeps every value it has held, with effective date and source. A worker-day from May 2025 is judged against the limit in force in May 2025, not today’s — change the date in the header to see what the table said then. A parameter marked «to confirm» is still applied: blocking on a probable value beats not blocking, as long as the status travels with the value.',
            zh: '每个参数都保留其历经的全部取值，并附生效日期与来源。2025 年 5 月的工日，依照当时适用的限额判定，而非今天的——更改标题栏日期即可查看当时的取值。标注「待确认」的参数照常适用：只要状态随取值一同呈现，用一个大概率正确的值去阻断，好过不阻断。',
          })}
        </p>
      </Painel>

      <Painel
        titulo={tr({ pt: 'Feriados nacionais', en: 'Public holidays', zh: '法定节假日' })}
        descricao={tr({
          pt: 'Configurados ano a ano. A Sexta-feira Santa e o Eid são tolerâncias de ponto, não feriados.',
          en: 'Configured year by year. Good Friday and Eid are discretionary days off, not public holidays.',
          zh: '逐年配置。耶稣受难日与开斋节属调休，并非法定节假日。',
        })}
      >
        <div className="flex flex-wrap gap-2">
          {FERIADOS_NACIONAIS_MMDD.map((f) => (
            <span
              key={f}
              className="num rounded-xl border border-fio bg-bloco px-2 py-1 text-[12px] text-texto-2"
            >
              {fmt.dataCurta(`2026-${f}`)}
            </span>
          ))}
        </div>
      </Painel>
    </Pagina>
  );
}
