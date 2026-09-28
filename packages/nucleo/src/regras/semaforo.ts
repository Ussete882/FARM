/**
 * BASTET — semáforo (§9.3)
 *
 * | Cor      | Significado                          | Consequência                                   |
 * |----------|--------------------------------------|------------------------------------------------|
 * | Verde    | Igual ou melhor do que a meta        | Nenhuma                                        |
 * | Amarelo  | Entre a meta e o limiar de alerta    | Comentário obrigatório do dono na revisão      |
 * | Vermelho | Pior do que o limiar de alerta       | Análise de causa e acção com dono e prazo      |
 * | Cinzento | Sem dados no período                 | Falha de processo, não ausência de problema    |
 */

import type { FichaIndicador } from '../dominio/indicadores';
import type { T } from '../i18n/nucleo';

export const CORES = ['verde', 'ambar', 'vermelho', 'cinzento'] as const;
export type Cor = (typeof CORES)[number];

export interface LeituraSemaforo {
  cor: Cor;
  significado: T;
  consequencia: T;
  /** Distância à meta em pontos da unidade do indicador. */
  distanciaMeta?: number;
}

const CONSEQUENCIA: Record<Cor, T> = {
  verde: { pt: 'Nenhuma.', en: 'None.', zh: '无。' },
  ambar: {
    pt: 'Comentário obrigatório do dono na revisão do período.',
    en: 'Mandatory comment from the owner at the period review.',
    zh: '责任人须在本期复盘时作出说明。',
  },
  vermelho: {
    pt: 'Análise de causa e acção com dono e prazo, na mesma reunião.',
    en: 'Root-cause analysis and an action with owner and deadline, in the same meeting.',
    zh: '在同一次会议上完成原因分析，并确定责任人与期限。',
  },
  cinzento: {
    pt: 'Falha de processo. O registo devido não foi entregue.',
    en: 'Process failure. The record that was due was not submitted.',
    zh: '流程失效。应报的记录未提交。',
  },
};

const SIGNIFICADO: Record<Cor, T> = {
  verde: {
    pt: 'Igual ou melhor do que a meta',
    en: 'At or better than target',
    zh: '达到或优于目标',
  },
  ambar: {
    pt: 'Entre a meta e o limiar de alerta',
    en: 'Between target and alert threshold',
    zh: '介于目标与警戒阈值之间',
  },
  vermelho: {
    pt: 'Pior do que o limiar de alerta',
    en: 'Worse than the alert threshold',
    zh: '劣于警戒阈值',
  },
  cinzento: { pt: 'Sem dados no período', en: 'No data in the period', zh: '本期无数据' },
};

/** Para colunas de tabela, onde o significado por extenso parte a linha. */
export const ROTULO_CURTO: Record<Cor, T> = {
  verde: { pt: 'no alvo', en: 'on target', zh: '达标' },
  ambar: { pt: 'em alerta', en: 'in alert', zh: '预警' },
  vermelho: { pt: 'fora do limiar', en: 'past threshold', zh: '超阈值' },
  cinzento: { pt: 'sem dados', en: 'no data', zh: '无数据' },
};

/**
 * Avalia um valor contra a ficha do indicador.
 *
 * `valor === undefined` não é zero nem é neutro: é cinzento, e o cinzento é
 * tratado como falha de processo. Esta distinção é deliberada e é a razão de
 * a assinatura aceitar `undefined` em vez de exigir um número.
 */
export function avaliar(valor: number | undefined, ficha: FichaIndicador): LeituraSemaforo {
  if (valor === undefined || Number.isNaN(valor)) {
    return { cor: 'cinzento', significado: SIGNIFICADO.cinzento, consequencia: CONSEQUENCIA.cinzento };
  }

  // Sem meta fixada, o indicador é medido mas ainda não é julgado.
  if (ficha.meta === undefined) {
    return {
      cor: 'cinzento',
      significado: { pt: 'Meta por estabelecer', en: 'Target not yet set', zh: '目标尚未设定' },
      consequencia: {
        pt: 'Fixar meta contra referência externa ou contra o próprio histórico (§9.2).',
        en: 'Set a target against an external reference or against the unit’s own history (§9.2).',
        zh: '依据外部基准或自身历史数据设定目标（§9.2）。',
      },
    };
  }

  const { meta, limiar_alerta, sentido } = ficha;
  const limiar = limiar_alerta ?? meta;
  const distanciaMeta = sentido === 'maior_melhor' ? valor - meta : meta - valor;

  let cor: Cor;
  if (sentido === 'maior_melhor') {
    if (valor >= meta) cor = 'verde';
    else if (valor >= limiar) cor = 'ambar';
    else cor = 'vermelho';
  } else {
    if (valor <= meta) cor = 'verde';
    else if (valor <= limiar) cor = 'ambar';
    else cor = 'vermelho';
  }

  return {
    cor,
    significado: SIGNIFICADO[cor],
    consequencia: cor === 'vermelho' && ficha.accao_vermelho ? ficha.accao_vermelho : CONSEQUENCIA[cor],
    distanciaMeta,
  };
}

/**
 * §4.3 — indicador em vermelho por dois períodos consecutivos escala ao nível
 * superior e cria acção obrigatória. A série vem ordenada do mais antigo para
 * o mais recente.
 */
export function exigeEscalonamento(serie: (number | undefined)[], ficha: FichaIndicador): boolean {
  if (serie.length < 2) return false;
  const ultimos = serie.slice(-2);
  return ultimos.every((v) => avaliar(v, ficha).cor === 'vermelho');
}

/** Tendência simples entre a última medição e a anterior. */
export type Tendencia = 'a_melhorar' | 'a_piorar' | 'estavel' | 'sem_dados';

export function tendencia(serie: (number | undefined)[], ficha: FichaIndicador): Tendencia {
  const validos = serie.filter((v): v is number => v !== undefined && !Number.isNaN(v));
  if (validos.length < 2) return 'sem_dados';
  const [anterior, actual] = validos.slice(-2);
  const delta = actual - anterior;
  if (Math.abs(delta) < Number.EPSILON) return 'estavel';
  const melhorou = ficha.sentido === 'maior_melhor' ? delta > 0 : delta < 0;
  return melhorou ? 'a_melhorar' : 'a_piorar';
}
