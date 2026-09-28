/**
 * BASTET — histórico, imutabilidade e correcção (§2.3, §24.5)
 *
 * §24.5: «Nenhum papel pode apagar registos. A correcção faz-se por novo
 * registo que anula e substitui, com motivo obrigatório, e ambos ficam
 * visíveis no histórico.»
 *
 * R4: o `codigo` é imutável. O nome pode mudar, o código nunca — renomear um
 * talhão não quebra o histórico.
 */

import type { EntradaHistorico, ObjectoCanonico, Referencia } from '../dominio/canonico';

/** Campos que o sistema carimba e que ninguém edita directamente. */
const CAMPOS_SISTEMA = new Set([
  'id',
  'codigo',
  'criado_em',
  'criado_por',
  'alterado_em',
  'alterado_por',
  'versao',
  'historico',
  'anulado',
]);

export class ErroImutabilidade extends Error {}
export class ErroConflitoVersao extends Error {}

export interface Autoria {
  por: Referencia;
  em: string;
}

/** Campos que o sistema carimba na criação; quem cria não os fornece. */
export type Carimbados =
  | 'id'
  | 'criado_em'
  | 'criado_por'
  | 'alterado_em'
  | 'alterado_por'
  | 'versao'
  | 'historico';

/** Carimba um objecto novo. */
export function criar<T extends ObjectoCanonico>(
  parcial: Omit<T, Carimbados> & Partial<Pick<T, 'relacoes' | 'anexos'>>,
  autoria: Autoria,
  id: string,
): T {
  const base = parcial as unknown as ObjectoCanonico;
  return {
    ...parcial,
    id,
    criado_em: autoria.em,
    criado_por: autoria.por,
    alterado_em: autoria.em,
    alterado_por: autoria.por,
    versao: 1,
    historico: [],
    relacoes: base.relacoes ?? [],
    anexos: base.anexos ?? [],
  } as unknown as T;
}

/**
 * Aplica alterações a um objecto, registando cada campo alterado no histórico
 * com valor anterior e novo.
 *
 * Lança se alguém tentar alterar o código (R4) ou se a versão esperada não
 * coincidir — detecção de conflito por `versao` (§2.3).
 */
export function alterar<T extends ObjectoCanonico>(
  actual: T,
  alteracoes: Partial<T>,
  autoria: Autoria,
  opcoes: { versaoEsperada?: number; motivo?: string } = {},
): T {
  if ('codigo' in alteracoes && alteracoes.codigo !== actual.codigo) {
    throw new ErroImutabilidade(
      `O código é imutável (R4). Tentativa de alterar "${actual.codigo}" para "${alteracoes.codigo}". Para mudar o nome corrente, altere a designação.`,
    );
  }
  if (opcoes.versaoEsperada !== undefined && opcoes.versaoEsperada !== actual.versao) {
    throw new ErroConflitoVersao(
      `Conflito de versão em ${actual.codigo}: esperada ${opcoes.versaoEsperada}, encontrada ${actual.versao}. O registo foi alterado por outra pessoa entretanto.`,
    );
  }
  if (actual.anulado) {
    throw new ErroImutabilidade(
      `${actual.codigo} está anulado e não pode ser alterado. Corrija o registo que o substituiu.`,
    );
  }

  const entradas: EntradaHistorico[] = [];
  const seguinte = { ...actual } as T;

  for (const [campo, valorNovo] of Object.entries(alteracoes)) {
    if (CAMPOS_SISTEMA.has(campo)) continue;
    const valorAnterior = (actual as Record<string, unknown>)[campo];
    if (JSON.stringify(valorAnterior) === JSON.stringify(valorNovo)) continue;
    entradas.push({
      em: autoria.em,
      por: autoria.por,
      campo,
      valorAnterior,
      valorNovo,
      motivo: opcoes.motivo,
    });
    (seguinte as Record<string, unknown>)[campo] = valorNovo;
  }

  if (entradas.length === 0) return actual;

  seguinte.alterado_em = autoria.em;
  seguinte.alterado_por = autoria.por;
  seguinte.versao = actual.versao + 1;
  seguinte.historico = [...actual.historico, ...entradas];
  return seguinte;
}

/**
 * Correcção de um registo operacional já fechado.
 *
 * Não altera o original: anula-o com motivo obrigatório e devolve o par
 * (anulado, substituto). Ambos ficam visíveis. Esta é a única forma de
 * «apagar» no BASTET.
 */
export function anularESubstituir<T extends ObjectoCanonico>(
  original: T,
  substituto: T,
  motivo: string,
  autoria: Autoria,
): { anulado: T; substituto: T } {
  if (!motivo || motivo.trim().length < 5) {
    throw new ErroImutabilidade(
      'A anulação exige motivo. Um registo anulado sem explicação é um registo apagado com outro nome.',
    );
  }
  if (original.anulado) {
    throw new ErroImutabilidade(`${original.codigo} já se encontra anulado.`);
  }

  const anulado: T = {
    ...original,
    alterado_em: autoria.em,
    alterado_por: autoria.por,
    versao: original.versao + 1,
    anulado: {
      em: autoria.em,
      por: autoria.por,
      motivo,
      substituidoPor: substituto.codigo,
    },
    historico: [
      ...original.historico,
      {
        em: autoria.em,
        por: autoria.por,
        campo: 'anulado',
        valorAnterior: null,
        valorNovo: substituto.codigo,
        motivo,
      },
    ],
  };

  const novo: T = {
    ...substituto,
    relacoes: [
      ...(substituto.relacoes ?? []),
      { tipo: 'substitui', destino: original.codigo, destinoTipo: original.tipo },
    ],
    historico: [
      ...(substituto.historico ?? []),
      {
        em: autoria.em,
        por: autoria.por,
        campo: 'substitui',
        valorAnterior: original.codigo,
        valorNovo: substituto.codigo,
        motivo,
      },
    ],
  };

  return { anulado, substituto: novo };
}

/** Um registo anulado continua a existir, mas não conta para indicadores. */
export function contaParaIndicadores(o: Pick<ObjectoCanonico, 'anulado'>): boolean {
  return !o.anulado;
}

/** Histórico de um objecto, do mais recente para o mais antigo. */
export function historicoOrdenado(o: ObjectoCanonico): EntradaHistorico[] {
  return [...o.historico].sort((a, b) => (a.em < b.em ? 1 : -1));
}
