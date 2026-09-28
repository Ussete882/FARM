/**
 * M2 — Monitorização fitossanitária (F-12) e observações de campo (F-13).
 *
 * §24.4: contagem acima do limiar gera alerta ao agrónomo, propõe receituário
 * e cria ordem de trabalho em estado planeado. O limiar é um parâmetro
 * versionado, ainda por ratificar.
 */

import { Bug, CheckCircle2, Eye, Plus, TriangleAlert } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import { useMonitorizacoes, useNomes, useObservacoes } from '../../dados/consultas';
import { HOJE } from '../../dados/semente';
import { useFmt, useT } from '../../i18n/contexto';
import { COL } from '../../i18n/comuns';
import { ROTULO_DECISAO_MF, ROTULO_GRAVIDADE } from '../../dominio/operacoes';
import { parametroEm } from '../../dominio/parametros';
import type { Cor } from '../../regras/semaforo';
import { Botao, Pagina } from '../../design/Pagina';
import { Barra, CartaoMetrica, Codigo, Painel, Semaforo, Tabela } from '../../design/primitivas';
import { FormularioF12 } from './FormularioF12';
import { FormularioF13 } from './FormularioF13';

export function Monitorizacao() {
  const tr = useT();
  const fmt = useFmt();
  const monitorizacoes = useMonitorizacoes();
  const nomes = useNomes();
  const [aRegistar, setARegistar] = React.useState(false);

  const limiar = parametroEm('MAC-LIMIAR-PERCEVEJO', HOJE);
  const acima = monitorizacoes.filter((m) => m.indice_calculado.valor > m.limiar_aplicavel.valor);
  const aTratar = monitorizacoes.filter((m) => m.decisao === 'tratar');
  const corAcima: Cor = acima.length > 0 ? 'vermelho' : 'verde';

  return (
    <Pagina
      accoes={
        !aRegistar && (
          <Botao variante="primario" onClick={() => setARegistar(true)}>
            <Plus className="size-3.5" />
            {tr({ pt: 'Registar contagem', en: 'Record a count', zh: '登记计数' })}
          </Botao>
        )
      }
    >
      {aRegistar && <FormularioF12 aoFechar={() => setARegistar(false)} />}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <CartaoMetrica
          destaque
          icone={TriangleAlert}
          cor={corAcima}
          rotulo={tr({
            pt: 'Acima do limiar',
            en: 'Above threshold',
            zh: '超过阈值',
          })}
          valor={fmt.inteiro(acima.length)}
          unidade={tr({
            pt: `de ${monitorizacoes.length}`,
            en: `of ${monitorizacoes.length}`,
            zh: `共 ${monitorizacoes.length} 次`,
          })}
          legenda={
            acima.length === 0
              ? tr({ pt: 'Sob controlo', en: 'Under control', zh: '已控制' })
              : tr({ pt: 'Requer decisão', en: 'Needs a decision', zh: '需作决定' })
          }
          frase={
            acima.length === 0
              ? tr({
                  pt: 'Nenhuma contagem ultrapassou o limiar de acção no período.',
                  en: 'No count exceeded the action threshold in the period.',
                  zh: '本期没有任何计数超过防治阈值。',
                })
              : tr({
                  pt: `Acima do limiar o sistema propõe tratamento. Talhões afectados: ${[...new Set(acima.map((m) => m.talhao))].join(', ')}.`,
                  en: `Above the threshold the system proposes treatment. Plots affected: ${[...new Set(acima.map((m) => m.talhao))].join(', ')}.`,
                  zh: `超过阈值时系统建议施药。受影响地块：${[...new Set(acima.map((m) => m.talhao))].join('、')}。`,
                })
          }
        />

        <CartaoMetrica
          icone={Bug}
          cor="cinzento"
          rotulo={tr({
            pt: 'Limiar de acção',
            en: 'Action threshold',
            zh: '防治阈值',
          })}
          valor={fmt.numero(limiar?.valor ?? 0, 1)}
          unidade={tr({ pt: 'por árvore', en: 'per tree', zh: '每棵' })}
          legenda={
            limiar?.estado === 'a_confirmar'
              ? tr({ pt: 'Por ratificar', en: 'To be ratified', zh: '待批准' })
              : tr({ pt: 'Confirmado', en: 'Confirmed', zh: '已确认' })
          }
          codigo="MAC-LIMIAR-PERCEVEJO"
          frase={tr({
            pt: 'É um parâmetro versionado, não um número no código: muda por decisão do agrónomo, com data de efeito.',
            en: 'It is a versioned parameter, not a number in the code: it changes by the agronomist’s decision, with an effective date.',
            zh: '这是一个版本化参数，而非写死在代码里的数字：由农艺师决定变更，并附生效日期。',
          })}
          para="/parametros"
        />

        <CartaoMetrica
          icone={CheckCircle2}
          cor={aTratar.length > 0 ? 'ambar' : 'verde'}
          rotulo={tr({
            pt: 'Decisões de tratar',
            en: 'Decisions to treat',
            zh: '施药决定',
          })}
          valor={fmt.inteiro(aTratar.length)}
          frase={tr({
            pt: 'Cada contagem termina numa decisão registada. Uma monitorização sem decisão não serviu para nada.',
            en: 'Every count ends in a recorded decision. A monitoring round with no decision served no purpose.',
            zh: '每一次计数都以一条已登记的决定收尾。没有决定的监测毫无意义。',
          })}
        />
      </div>

      <Painel
        titulo={tr({
          pt: `${monitorizacoes.length} contagens`,
          en: `${monitorizacoes.length} counts`,
          zh: `${monitorizacoes.length} 次计数`,
        })}
        denso
      >
        <Tabela
          linhas={[...monitorizacoes].sort((a, b) => (a.data < b.data ? 1 : -1))}
          chave={(m) => m.codigo}
          vazio={tr({
            pt: 'Sem contagens registadas no período.',
            en: 'No counts recorded in the period.',
            zh: '本期无计数记录。',
          })}
          colunas={[
            {
              chave: 'data',
              cabecalho: tr(COL.data),
              numerica: true,
              render: (m) => fmt.data(m.data),
              ordenarPor: (m) => m.data,
            },
            {
              chave: 'talhao',
              cabecalho: tr(COL.talhao),
              render: (m) => (
                <Link to={`/talhoes/${m.talhao}`} className="ligacao">
                  {m.talhao}
                </Link>
              ),
            },
            {
              chave: 'organismo',
              cabecalho: tr({ pt: 'Organismo', en: 'Organism', zh: '生物' }),
              render: (m) => m.organismo,
            },
            {
              chave: 'amostra',
              cabecalho: tr({ pt: 'Amostra', en: 'Sample', zh: '样本' }),
              numerica: true,
              render: (m) => `${m.n_pontos_amostrados} × ${m.n_plantas_por_ponto}`,
            },
            {
              chave: 'indice',
              cabecalho: tr({ pt: 'Índice', en: 'Index', zh: '指数' }),
              numerica: true,
              render: (m) => {
                const cor: Cor =
                  m.indice_calculado.valor > m.limiar_aplicavel.valor
                    ? 'vermelho'
                    : m.indice_calculado.valor > m.limiar_aplicavel.valor * 0.75
                      ? 'ambar'
                      : 'verde';
                return (
                  <div className="flex min-w-[104px] flex-col items-end gap-1.5">
                    <span className="num font-semibold text-texto">
                      {fmt.numero(m.indice_calculado.valor, 2)}
                    </span>
                    <div className="relative w-full">
                      <Barra
                        fraccao={m.indice_calculado.valor / (m.limiar_aplicavel.valor * 2)}
                        cor={cor}
                      />
                      <div
                        className="absolute -top-1 h-3.5 w-px bg-texto-3"
                        style={{ left: '50%' }}
                        title={`${tr({ pt: 'Limiar', en: 'Threshold', zh: '阈值' })}: ${m.limiar_aplicavel.valor}`}
                      />
                    </div>
                  </div>
                );
              },
              ordenarPor: (m) => m.indice_calculado.valor,
            },
            {
              chave: 'inimigos',
              cabecalho: tr({
                pt: 'Inimigos naturais',
                en: 'Natural enemies',
                zh: '天敌',
              }),
              numerica: true,
              render: (m) => m.contagem_inimigos_naturais,
            },
            {
              chave: 'decisao',
              cabecalho: tr(COL.decisao),
              render: (m) => (
                <Semaforo
                  cor={
                    m.decisao === 'nenhuma_accao'
                      ? 'verde'
                      : m.decisao === 'repetir'
                        ? 'ambar'
                        : 'vermelho'
                  }
                  rotulo={tr(ROTULO_DECISAO_MF[m.decisao])}
                />
              ),
            },
            {
              chave: 'obs',
              cabecalho: tr({ pt: 'Observador', en: 'Observer', zh: '观察人' }),
              render: (m) => (
                <span className="text-texto-2">{nomes.get(m.observador) ?? m.observador}</span>
              ),
            },
          ]}
        />
      </Painel>
    </Pagina>
  );
}

export function Observacoes() {
  const tr = useT();
  const fmt = useFmt();
  const observacoes = useObservacoes();
  const nomes = useNomes();
  const [aRegistar, setARegistar] = React.useState(false);

  const graves = observacoes.filter((o) => o.gravidade === 'alta' || o.gravidade === 'critica');
  const extensaoMedia = observacoes.length
    ? observacoes.reduce((s, o) => s + o.extensao_percent, 0) / observacoes.length
    : 0;

  return (
    <Pagina
      accoes={
        !aRegistar && (
          <Botao variante="primario" onClick={() => setARegistar(true)}>
            <Plus className="size-3.5" />
            {tr({
              pt: 'Registar observação',
              en: 'Record an observation',
              zh: '登记观察',
            })}
          </Botao>
        )
      }
    >
      {aRegistar && <FormularioF13 aoFechar={() => setARegistar(false)} />}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <CartaoMetrica
          destaque
          icone={Eye}
          cor={graves.length > 0 ? 'ambar' : 'verde'}
          rotulo={tr({
            pt: 'Observações graves',
            en: 'Serious observations',
            zh: '严重观察',
          })}
          valor={fmt.inteiro(graves.length)}
          unidade={tr({
            pt: `de ${observacoes.length}`,
            en: `of ${observacoes.length}`,
            zh: `共 ${observacoes.length} 条`,
          })}
          legenda={
            graves.length === 0
              ? tr({ pt: 'Sem gravidade', en: 'Nothing serious', zh: '无严重项' })
              : tr({ pt: 'A acompanhar', en: 'To follow up', zh: '需跟进' })
          }
          frase={tr({
            pt: 'Gravidade alta ou crítica. A crítica escala de imediato ao agrónomo responsável e ao gestor da unidade (§4.3).',
            en: 'High or critical severity. Critical escalates at once to the responsible agronomist and the unit manager (§4.3).',
            zh: '严重程度为高或危急。危急项立即上报责任农艺师与单位负责人（§4.3）。',
          })}
        />

        <CartaoMetrica
          icone={Eye}
          cor="cinzento"
          rotulo={tr({
            pt: 'Observações no período',
            en: 'Observations in the period',
            zh: '本期观察',
          })}
          valor={fmt.inteiro(observacoes.length)}
          frase={tr({
            pt: 'Preenchida por qualquer técnico. É o canal por onde entra o que nenhum formulário periódico previu.',
            en: 'Filled in by any technician. It is the channel for whatever no periodic form anticipated.',
            zh: '任何技术人员均可填写。它是定期表单未能预见之事的录入通道。',
          })}
        />

        <CartaoMetrica
          icone={TriangleAlert}
          cor="cinzento"
          rotulo={tr({
            pt: 'Extensão média',
            en: 'Average extent',
            zh: '平均发生程度',
          })}
          valor={fmt.numero(extensaoMedia, 0)}
          unidade="%"
          frase={tr({
            pt: 'Percentagem média do talhão afectada nas observações registadas.',
            en: 'Average share of the plot affected across the recorded observations.',
            zh: '已登记观察中受影响地块的平均占比。',
          })}
        />
      </div>

      <Painel
        titulo={tr({
          pt: `${observacoes.length} observações`,
          en: `${observacoes.length} observations`,
          zh: `${observacoes.length} 条观察`,
        })}
        denso
      >
        <Tabela
          linhas={[...observacoes].sort((a, b) => (a.data < b.data ? 1 : -1))}
          chave={(o) => o.codigo}
          vazio={tr({
            pt: 'Sem observações registadas no período.',
            en: 'No observations recorded in the period.',
            zh: '本期无观察记录。',
          })}
          colunas={[
            {
              chave: 'cod',
              cabecalho: tr({ pt: 'Ficha', en: 'Sheet', zh: '单据' }),
              render: (o) => <Codigo forte>{o.codigo}</Codigo>,
            },
            {
              chave: 'data',
              cabecalho: tr(COL.data),
              numerica: true,
              render: (o) => fmt.data(o.data),
              ordenarPor: (o) => o.data,
            },
            {
              chave: 'talhao',
              cabecalho: tr(COL.talhao),
              render: (o) => (
                <Link to={`/talhoes/${o.talhao}`} className="ligacao">
                  {o.talhao}
                </Link>
              ),
            },
            { chave: 'tipo', cabecalho: tr(COL.tipo), render: (o) => o.tipo_observacao },
            {
              chave: 'descricao',
              cabecalho: tr({ pt: 'Descrição', en: 'Description', zh: '描述' }),
              render: (o) => <span className="text-texto-2">{o.descricao}</span>,
            },
            {
              chave: 'extensao',
              cabecalho: tr({ pt: 'Extensão', en: 'Extent', zh: '发生程度' }),
              numerica: true,
              render: (o) => fmt.percentagem(o.extensao_percent, 0),
              ordenarPor: (o) => o.extensao_percent,
            },
            {
              chave: 'gravidade',
              cabecalho: tr(COL.gravidade),
              render: (o) => (
                <Semaforo
                  cor={
                    o.gravidade === 'baixa'
                      ? 'verde'
                      : o.gravidade === 'media'
                        ? 'ambar'
                        : 'vermelho'
                  }
                  rotulo={tr(ROTULO_GRAVIDADE[o.gravidade])}
                />
              ),
            },
            {
              chave: 'accao',
              cabecalho: tr({
                pt: 'Acção proposta',
                en: 'Proposed action',
                zh: '建议措施',
              }),
              render: (o) => <span className="text-texto-2">{o.accao_proposta}</span>,
            },
            {
              chave: 'obs',
              cabecalho: tr({ pt: 'Observador', en: 'Observer', zh: '观察人' }),
              render: (o) => (
                <span className="text-texto-2">{nomes.get(o.observador) ?? o.observador}</span>
              ),
            },
          ]}
        />
      </Painel>
    </Pagina>
  );
}
