/**
 * BASTET — escrita no repositório.
 *
 * Nenhuma função aqui apaga. A correcção passa por `anularESubstituir`
 * (§24.5), e o par anulado/substituto é gravado na mesma transacção para que
 * nunca exista um instante em que só um dos dois esteja visível.
 */

import type { ObjectoCanonico } from '../dominio/canonico';
import type {
  Monitorizacao,
  Observacao,
  OrdemTrabalho,
  PesagemColheita,
  RelatorioDiario,
} from '../dominio/operacoes';
import type { Jorna, Trabalhador } from '../dominio/pessoas';
import type { Arvore, Talhao } from '../dominio/territorio';
import { alterar, anularESubstituir, criar, type Autoria, type Carimbados } from '../regras/historico';

import { db } from './db';
import { HOJE } from './semente';

/** Utilizador da sessão. Numa fase com autenticação, vem do início de sessão. */
export const UTILIZADOR = 'TR-00001';

export const autoriaAgora = (): Autoria => ({ por: UTILIZADOR, em: HOJE });

export async function gravarRelatorio(
  parcial: Omit<RelatorioDiario, Carimbados> & Partial<Pick<RelatorioDiario, 'relacoes' | 'anexos'>>,
): Promise<RelatorioDiario> {
  const objecto = criar<RelatorioDiario>(parcial, autoriaAgora(), parcial.codigo);
  await db.relatorios.add(objecto);
  return objecto;
}

export async function gravarPesagem(
  parcial: Omit<PesagemColheita, Carimbados> & Partial<Pick<PesagemColheita, 'relacoes' | 'anexos'>>,
): Promise<PesagemColheita> {
  const objecto = criar<PesagemColheita>(parcial, autoriaAgora(), parcial.codigo);
  await db.pesagens.add(objecto);
  return objecto;
}

export async function gravarMonitorizacao(
  parcial: Omit<Monitorizacao, Carimbados> & Partial<Pick<Monitorizacao, 'relacoes' | 'anexos'>>,
): Promise<Monitorizacao> {
  const objecto = criar<Monitorizacao>(parcial, autoriaAgora(), parcial.codigo);
  await db.monitorizacoes.add(objecto);
  return objecto;
}

export async function gravarObservacao(
  parcial: Omit<Observacao, Carimbados> & Partial<Pick<Observacao, 'relacoes' | 'anexos'>>,
): Promise<Observacao> {
  const objecto = criar<Observacao>(parcial, autoriaAgora(), parcial.codigo);
  await db.observacoes.add(objecto);
  return objecto;
}

export async function gravarOrdem(
  parcial: Omit<OrdemTrabalho, Carimbados> & Partial<Pick<OrdemTrabalho, 'relacoes' | 'anexos'>>,
): Promise<OrdemTrabalho> {
  const objecto = criar<OrdemTrabalho>(parcial, autoriaAgora(), parcial.codigo);
  await db.ordens.add(objecto);
  return objecto;
}

export async function gravarTrabalhador(
  parcial: Omit<Trabalhador, Carimbados> & Partial<Pick<Trabalhador, 'relacoes' | 'anexos'>>,
): Promise<Trabalhador> {
  const objecto = criar<Trabalhador>(parcial, autoriaAgora(), parcial.codigo);
  await db.trabalhadores.add(objecto);
  return objecto;
}

/**
 * Grava a folha de presença inteira numa transacção.
 *
 * A folha é um acto único do chefe de turma, não dez actos independentes: se
 * uma jorna for recusada, nenhuma entra. Meia folha gravada produziria uma
 * assiduidade e um custo de mão-de-obra falsos para o dia.
 */
export async function gravarJornas(
  parciais: (Omit<Jorna, Carimbados> & Partial<Pick<Jorna, 'relacoes' | 'anexos'>>)[],
): Promise<Jorna[]> {
  const autoria = autoriaAgora();
  const objectos = parciais.map((p) => criar<Jorna>(p, autoria, p.codigo));
  await db.transaction('rw', db.jornas, async () => {
    await db.jornas.bulkAdd(objectos);
  });
  return objectos;
}

export async function gravarTalhao(
  parcial: Omit<Talhao, Carimbados> & Partial<Pick<Talhao, 'relacoes' | 'anexos'>>,
): Promise<Talhao> {
  const objecto = criar<Talhao>(parcial, autoriaAgora(), parcial.codigo);
  await db.talhoes.add(objecto);
  return objecto;
}

/**
 * Altera um talhão, registando no histórico cada campo mudado com o valor
 * anterior e o novo (§2.3).
 *
 * O código nunca entra nas alterações: é imutável (R4). Renomear a designação
 * não quebra o histórico — é exactamente para isso que o código existe.
 */
export async function alterarTalhao(
  actual: Talhao,
  alteracoes: Partial<Talhao>,
  motivo?: string,
): Promise<Talhao> {
  const seguinte = alterar(actual, alteracoes, autoriaAgora(), {
    versaoEsperada: actual.versao,
    motivo,
  });
  await db.talhoes.put(seguinte);
  return seguinte;
}

export async function gravarArvore(
  parcial: Omit<Arvore, Carimbados> & Partial<Pick<Arvore, 'relacoes' | 'anexos'>>,
): Promise<Arvore> {
  const objecto = criar<Arvore>(parcial, autoriaAgora(), parcial.codigo);
  await db.arvores.add(objecto);
  return objecto;
}

/**
 * Corrige um registo de pesagem sem o apagar: anula o original com motivo e
 * grava o substituto. Ambos ficam visíveis no histórico.
 */
export async function corrigirPesagem(
  original: PesagemColheita,
  substituto: PesagemColheita,
  motivo: string,
): Promise<void> {
  const { anulado, substituto: novo } = anularESubstituir(
    original,
    substituto,
    motivo,
    autoriaAgora(),
  );
  await db.transaction('rw', db.pesagens, async () => {
    await db.pesagens.put(anulado);
    await db.pesagens.add(novo);
  });
}

/** Próximo sequencial de um código anual, a partir do que já existe. */
export function proximoSequencial(codigos: string[], prefixo: string): number {
  const usados = codigos
    .filter((c) => c.startsWith(prefixo))
    .map((c) => Number(c.split('-').at(-1)))
    .filter((n) => Number.isFinite(n));
  return (usados.length ? Math.max(...usados) : 0) + 1;
}

export type { ObjectoCanonico };
