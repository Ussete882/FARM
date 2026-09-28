/**
 * BASTET — plano contra execução (§5.2)
 *
 * «Cada operação nasce como plano e é fechada como execução. Os dois estados
 * coexistem no mesmo registo, com campos distintos, o que permite calcular
 * desvio sem qualquer trabalho adicional.»
 *
 * R5: o desvio entre plano e execução é o indicador mais útil do sistema.
 * Por isso é sempre derivado — nunca introduzido à mão.
 *
 * A leitura do desvio é trilingue e construída aqui, como as constatações do
 * §8: o módulo continua puro e é o ecrã que escolhe a língua.
 */

import type { Quantidade } from '../dominio/canonico';
import { formatador, type Formatador } from '../dominio/formatar';
import type { OrdemTrabalho, Operacao } from '../dominio/operacoes';
import type { T } from '../i18n/nucleo';
import { diasEntre } from './validacao';

function msg(
  pt: (F: Formatador) => string,
  en: (F: Formatador) => string,
  zh: (F: Formatador) => string,
): T {
  return { pt: pt(formatador('pt')), en: en(formatador('en')), zh: zh(formatador('zh')) };
}

export type SentidoDesvio = 'favoravel' | 'desfavoravel' | 'neutro';

export interface Desvio {
  dimensao: 'data' | 'quantidade' | 'mao_de_obra' | 'custo' | 'insumo';
  rotulo: T;
  previsto: number;
  real: number;
  /** Diferença absoluta, na unidade da dimensão. */
  absoluto: number;
  /** Diferença relativa em %, quando o previsto não é zero. */
  relativo?: number;
  unidade: string;
  sentido: SentidoDesvio;
  leitura: T;
}

function sentidoPor(delta: number, maiorEhMelhor: boolean): SentidoDesvio {
  if (Math.abs(delta) < 1e-9) return 'neutro';
  return (delta > 0) === maiorEhMelhor ? 'favoravel' : 'desfavoravel';
}

/** Dias de atraso. Positivo = atrasado. */
export function desvioData(previsto: string, real: string): Desvio {
  const dias = diasEntre(previsto, real);
  return {
    dimensao: 'data',
    rotulo: { pt: 'Data', en: 'Date', zh: '日期' },
    previsto: 0,
    real: dias,
    absoluto: dias,
    unidade: 'dias',
    sentido: sentidoPor(-dias, true),
    leitura:
      dias === 0
        ? { pt: 'No prazo', en: 'On time', zh: '按期' }
        : dias > 0
          ? {
              pt: `${dias} dia${dias === 1 ? '' : 's'} de atraso`,
              en: `${dias} day${dias === 1 ? '' : 's'} late`,
              zh: `延迟 ${dias} 天`,
            }
          : {
              pt: `${-dias} dia${dias === -1 ? '' : 's'} de antecipação`,
              en: `${-dias} day${dias === -1 ? '' : 's'} early`,
              zh: `提前 ${-dias} 天`,
            },
  };
}

/** Percentagem de cumprimento da quantidade planeada. */
export function desvioQuantidade(previsto: Quantidade, real: Quantidade): Desvio {
  const absoluto = real.valor - previsto.valor;
  const relativo = previsto.valor !== 0 ? (real.valor / previsto.valor) * 100 : undefined;
  return {
    dimensao: 'quantidade',
    rotulo: { pt: 'Quantidade', en: 'Quantity', zh: '数量' },
    previsto: previsto.valor,
    real: real.valor,
    absoluto,
    relativo,
    unidade: real.unidade,
    sentido: sentidoPor(absoluto, true),
    leitura:
      relativo === undefined
        ? { pt: 'Sem meta quantificada', en: 'No quantified target', zh: '无量化目标' }
        : msg(
            (F) => `${F.numero(relativo, 1)}% da meta`,
            (F) => `${F.numero(relativo, 1)}% of target`,
            (F) => `目标的 ${F.numero(relativo, 1)}%`,
          ),
  };
}

/** Produtividade face ao padrão: quantidade por jorna. */
export function desvioMaoDeObra(
  jornasPrevistas: Quantidade,
  jornasReais: Quantidade,
  quantidadePrevista: Quantidade,
  quantidadeReal: Quantidade,
): Desvio {
  const padrao = jornasPrevistas.valor > 0 ? quantidadePrevista.valor / jornasPrevistas.valor : 0;
  const efectiva = jornasReais.valor > 0 ? quantidadeReal.valor / jornasReais.valor : 0;
  const absoluto = efectiva - padrao;
  const relativo = padrao !== 0 ? (efectiva / padrao) * 100 : undefined;
  return {
    dimensao: 'mao_de_obra',
    rotulo: { pt: 'Produtividade', en: 'Productivity', zh: '生产率' },
    previsto: padrao,
    real: efectiva,
    absoluto,
    relativo,
    unidade: `${quantidadeReal.unidade}/jorna`,
    sentido: sentidoPor(absoluto, true),
    leitura:
      relativo === undefined
        ? { pt: 'Sem padrão definido', en: 'No baseline set', zh: '未设定基准' }
        : msg(
            (F) => `${F.numero(efectiva, 1)} contra ${F.numero(padrao, 1)} de padrão`,
            (F) => `${F.numero(efectiva, 1)} against a baseline of ${F.numero(padrao, 1)}`,
            (F) => `${F.numero(efectiva, 1)}，基准为 ${F.numero(padrao, 1)}`,
          ),
  };
}

/** Desvio orçamental. Gastar acima do orçamentado é desfavorável. */
export function desvioCusto(orcamentado: Quantidade, real: Quantidade): Desvio {
  const absoluto = real.valor - orcamentado.valor;
  const relativo = orcamentado.valor !== 0 ? (absoluto / orcamentado.valor) * 100 : undefined;
  const sinal = (relativo ?? 0) >= 0 ? '+' : '';
  return {
    dimensao: 'custo',
    rotulo: { pt: 'Custo', en: 'Cost', zh: '成本' },
    previsto: orcamentado.valor,
    real: real.valor,
    absoluto,
    relativo,
    unidade: 'MT',
    sentido: sentidoPor(-absoluto, true),
    leitura:
      relativo === undefined
        ? { pt: 'Sem orçamento', en: 'No budget', zh: '无预算' }
        : msg(
            (F) => `${sinal}${F.numero(relativo, 1)}% face ao orçamentado`,
            (F) => `${sinal}${F.numero(relativo, 1)}% against budget`,
            (F) => `较预算 ${sinal}${F.numero(relativo, 1)}%`,
          ),
  };
}

/** Desvio de aplicação de insumo: dose aplicada contra dose prescrita. */
export function desvioInsumo(prescrita: Quantidade, aplicada: Quantidade): Desvio {
  const absoluto = aplicada.valor - prescrita.valor;
  const relativo = prescrita.valor !== 0 ? (absoluto / prescrita.valor) * 100 : undefined;
  const sinal = (relativo ?? 0) >= 0 ? '+' : '';
  return {
    dimensao: 'insumo',
    rotulo: { pt: 'Dose', en: 'Dose', zh: '用量' },
    previsto: prescrita.valor,
    real: aplicada.valor,
    absoluto,
    relativo,
    unidade: aplicada.unidade,
    // Em fitofármacos, tanto a subdosagem como a sobredosagem são desfavoráveis.
    sentido: Math.abs(relativo ?? 0) <= 5 ? 'favoravel' : 'desfavoravel',
    leitura:
      relativo === undefined
        ? { pt: 'Sem receituário', en: 'No prescription', zh: '无处方' }
        : msg(
            (F) => `${sinal}${F.numero(relativo, 1)}% face ao receituário`,
            (F) => `${sinal}${F.numero(relativo, 1)}% against prescription`,
            (F) => `较处方 ${sinal}${F.numero(relativo, 1)}%`,
          ),
  };
}

/**
 * Todos os desvios de uma ordem de trabalho fechada. Devolve lista vazia se a
 * operação ainda não existir — plano sem execução não tem desvio, tem espera.
 */
export function desviosDaOrdem(ot: OrdemTrabalho, op?: Operacao): Desvio[] {
  if (!op) return [];
  const d: Desvio[] = [
    desvioData(ot.data_prevista, op.data_real),
    desvioQuantidade(ot.quantidade_prevista, op.quantidade_real),
    desvioMaoDeObra(ot.jornas_previstas, op.jornas_reais, ot.quantidade_prevista, op.quantidade_real),
  ];
  if (op.custo_real) d.push(desvioCusto(ot.custo_orcamentado, op.custo_real));
  return d;
}
