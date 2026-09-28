/**
 * BASTET — escrita no repositório.
 *
 * Nenhuma função aqui apaga. A correcção passa por `anularESubstituir`
 * (§24.5), e o par anulado/substituto é gravado na mesma transacção para que
 * nunca exista um instante em que só um dos dois esteja visível.
 *
 * Cada escrita faz duas coisas na mesma transacção: grava no IndexedDB, para o
 * ecrã actualizar na hora mesmo sem rede, e põe uma cópia na caixa de saída,
 * para sair quando houver sinal (§25). Se só a primeira acontecesse, o registo
 * ficava preso no telemóvel e ninguém dava por isso.
 */

import type { ObjectoCanonico } from '@bastet/nucleo/canonico';
import type {
  Monitorizacao,
  Observacao,
  OrdemTrabalho,
  PesagemColheita,
  RelatorioDiario,
} from '@bastet/nucleo/operacoes';
import type { Jorna, Trabalhador } from '@bastet/nucleo/pessoas';
import type { Arvore, Talhao } from '@bastet/nucleo/territorio';
import { alterar, anularESubstituir, criar, type Autoria, type Carimbados } from '@bastet/nucleo/historico';

import { db } from './db';
import { HOJE } from './semente';
import { porNaSaida } from './sincronizar';

/** Utilizador da sessão. Numa fase com autenticação, vem do início de sessão. */
export const UTILIZADOR = 'TR-00001';

export const autoriaAgora = (): Autoria => ({ por: UTILIZADOR, em: HOJE });

export async function gravarRelatorio(
  parcial: Omit<RelatorioDiario, Carimbados> & Partial<Pick<RelatorioDiario, 'relacoes' | 'anexos'>>,
): Promise<RelatorioDiario> {
  const objecto = criar<RelatorioDiario>(parcial, autoriaAgora(), parcial.codigo);
  await db.transaction('rw', db.relatorios, db.saida, async () => {
    await db.relatorios.add(objecto);
    await porNaSaida('criar', { objecto });
  });
  return objecto;
}

export async function gravarPesagem(
  parcial: Omit<PesagemColheita, Carimbados> & Partial<Pick<PesagemColheita, 'relacoes' | 'anexos'>>,
): Promise<PesagemColheita> {
  const objecto = criar<PesagemColheita>(parcial, autoriaAgora(), parcial.codigo);
  await db.transaction('rw', db.pesagens, db.saida, async () => {
    await db.pesagens.add(objecto);
    await porNaSaida('criar', { objecto });
  });
  return objecto;
}

export async function gravarMonitorizacao(
  parcial: Omit<Monitorizacao, Carimbados> & Partial<Pick<Monitorizacao, 'relacoes' | 'anexos'>>,
): Promise<Monitorizacao> {
  const objecto = criar<Monitorizacao>(parcial, autoriaAgora(), parcial.codigo);
  await db.transaction('rw', db.monitorizacoes, db.saida, async () => {
    await db.monitorizacoes.add(objecto);
    await porNaSaida('criar', { objecto });
  });
  return objecto;
}

export async function gravarObservacao(
  parcial: Omit<Observacao, Carimbados> & Partial<Pick<Observacao, 'relacoes' | 'anexos'>>,
): Promise<Observacao> {
  const objecto = criar<Observacao>(parcial, autoriaAgora(), parcial.codigo);
  await db.transaction('rw', db.observacoes, db.saida, async () => {
    await db.observacoes.add(objecto);
    await porNaSaida('criar', { objecto });
  });
  return objecto;
}

export async function gravarOrdem(
  parcial: Omit<OrdemTrabalho, Carimbados> & Partial<Pick<OrdemTrabalho, 'relacoes' | 'anexos'>>,
): Promise<OrdemTrabalho> {
  const objecto = criar<OrdemTrabalho>(parcial, autoriaAgora(), parcial.codigo);
  await db.transaction('rw', db.ordens, db.saida, async () => {
    await db.ordens.add(objecto);
    await porNaSaida('criar', { objecto });
  });
  return objecto;
}

export async function gravarTrabalhador(
  parcial: Omit<Trabalhador, Carimbados> & Partial<Pick<Trabalhador, 'relacoes' | 'anexos'>>,
): Promise<Trabalhador> {
  const objecto = criar<Trabalhador>(parcial, autoriaAgora(), parcial.codigo);
  await db.transaction('rw', db.trabalhadores, db.saida, async () => {
    await db.trabalhadores.add(objecto);
    await porNaSaida('criar', { objecto });
  });
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
  await db.transaction('rw', db.jornas, db.saida, async () => {
    await db.jornas.bulkAdd(objectos);
    for (const objecto of objectos) await porNaSaida('criar', { objecto });
  });
  return objectos;
}

export async function gravarTalhao(
  parcial: Omit<Talhao, Carimbados> & Partial<Pick<Talhao, 'relacoes' | 'anexos'>>,
): Promise<Talhao> {
  const objecto = criar<Talhao>(parcial, autoriaAgora(), parcial.codigo);
  await db.transaction('rw', db.talhoes, db.saida, async () => {
    await db.talhoes.add(objecto);
    await porNaSaida('criar', { objecto });
  });
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
  await db.transaction('rw', db.talhoes, db.saida, async () => {
    await db.talhoes.put(seguinte);
    // A versão que estava na mão quando se alterou. É ela que o servidor
    // compara: se entretanto outra pessoa gravou, a escrita é recusada em vez
    // de sobrepor o trabalho dela.
    await porNaSaida('alterar', { objecto: seguinte, versaoAnterior: actual.versao });
  });
  return seguinte;
}

export async function gravarArvore(
  parcial: Omit<Arvore, Carimbados> & Partial<Pick<Arvore, 'relacoes' | 'anexos'>>,
): Promise<Arvore> {
  const objecto = criar<Arvore>(parcial, autoriaAgora(), parcial.codigo);
  await db.transaction('rw', db.arvores, db.saida, async () => {
    await db.arvores.add(objecto);
    await porNaSaida('criar', { objecto });
  });
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
  await db.transaction('rw', db.pesagens, db.saida, async () => {
    await db.pesagens.put(anulado);
    await db.pesagens.add(novo);
    await porNaSaida('anular', {
      anulado,
      substituto: novo,
      versaoAnterior: original.versao,
    });
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
