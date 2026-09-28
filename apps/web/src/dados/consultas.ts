/**
 * BASTET — consultas sobre o repositório local.
 *
 * §2.2: «qualquer pergunta de gestão deve ser respondível percorrendo o grafo.»
 * Estas funções são as arestas: dado um nó, devolvem os que lhe estão ligados.
 */

import { useLiveQuery } from 'dexie-react-hooks';

import type { CicloCultura } from '@bastet/nucleo/biologico';
import { blocoDoTalhao } from '@bastet/nucleo/codigos';
import type { Jorna, Trabalhador } from '@bastet/nucleo/pessoas';
import type { PesagemColheita, RelatorioDiario } from '@bastet/nucleo/operacoes';
import { contaParaIndicadores } from '@bastet/nucleo/historico';

import { db } from './db';
import { HOJE } from './semente';

// ============================================================================
// Listas simples
// ============================================================================

export const useTalhoes = () => useLiveQuery(() => db.talhoes.toArray(), [], []);
export const useBlocos = () => useLiveQuery(() => db.blocos.toArray(), [], []);
export const useCiclos = () => useLiveQuery(() => db.ciclos.toArray(), [], []);
export const useCulturas = () => useLiveQuery(() => db.culturas.toArray(), [], []);
export const useVariedades = () => useLiveQuery(() => db.variedades.toArray(), [], []);
export const useFontesAgua = () => useLiveQuery(() => db.fontesAgua.toArray(), [], []);
export const useArvores = () => useLiveQuery(() => db.arvores.toArray(), [], []);
export const useTrabalhadores = () => useLiveQuery(() => db.trabalhadores.toArray(), [], []);
export const useEquipas = () => useLiveQuery(() => db.equipas.toArray(), [], []);
export const useOrdens = () => useLiveQuery(() => db.ordens.toArray(), [], []);
export const useOperacoes = () => useLiveQuery(() => db.operacoes.toArray(), [], []);
export const usePesagens = () => useLiveQuery(() => db.pesagens.toArray(), [], []);
export const useRelatorios = () => useLiveQuery(() => db.relatorios.toArray(), [], []);
export const useMonitorizacoes = () => useLiveQuery(() => db.monitorizacoes.toArray(), [], []);
export const useObservacoes = () => useLiveQuery(() => db.observacoes.toArray(), [], []);
export const useJornas = () => useLiveQuery(() => db.jornas.toArray(), [], []);
export const usePendencias = () => useLiveQuery(() => db.pendencias.toArray(), [], []);

// ============================================================================
// Objectos individuais, por código
// ============================================================================

export const useTalhao = (cod?: string) =>
  useLiveQuery(() => (cod ? db.talhoes.get(cod) : undefined), [cod]);
export const useTrabalhador = (cod?: string) =>
  useLiveQuery(() => (cod ? db.trabalhadores.get(cod) : undefined), [cod]);
export const usePesagem = (cod?: string) =>
  useLiveQuery(() => (cod ? db.pesagens.get(cod) : undefined), [cod]);
export const useOrdem = (cod?: string) =>
  useLiveQuery(() => (cod ? db.ordens.get(cod) : undefined), [cod]);
export const useRelatorio = (cod?: string) =>
  useLiveQuery(() => (cod ? db.relatorios.get(cod) : undefined), [cod]);

// ============================================================================
// Índice de nomes — o código é a chave, o nome é a leitura
// ============================================================================

export function useNomes(): Map<string, string> {
  const trabalhadores = useTrabalhadores();
  const talhoes = useTalhoes();
  const equipas = useEquipas();
  const mapa = new Map<string, string>();
  for (const t of trabalhadores) mapa.set(t.codigo, t.nome_completo);
  for (const t of talhoes) mapa.set(t.codigo, t.designacao);
  for (const e of equipas) mapa.set(e.codigo, e.designacao);
  return mapa;
}

// ============================================================================
// Arestas do grafo
// ============================================================================

export const pesagensDoTalhao = (todas: PesagemColheita[], talhao: string) =>
  todas.filter((p) => p.talhao === talhao && contaParaIndicadores(p));

export const jornasDoDia = (todas: Jorna[], data: string) => todas.filter((j) => j.data === data);

export const jornasDoTrabalhador = (todas: Jorna[], trabalhador: string) =>
  todas.filter((j) => j.trabalhador === trabalhador);

export const relatoriosDoDia = (todos: RelatorioDiario[], data: string) =>
  todos.filter((r) => r.data === data);

export const cicloDoTalhao = (ciclos: CicloCultura[], talhao: string) =>
  ciclos.find((c) => c.talhao === talhao);

export const talhoesDoBloco = <T extends { bloco: string }>(talhoes: T[], bloco: string) =>
  talhoes.filter((t) => t.bloco === bloco);

/** O último dia com registos. O painel diário abre no dia útil mais recente. */
export function ultimoDiaComRegistos(relatorios: RelatorioDiario[]): string {
  if (relatorios.length === 0) return HOJE;
  return relatorios.map((r) => r.data).sort().at(-1)!;
}

/** Trabalhadores de um bloco, pela equipa habitual. */
export function trabalhadoresDoBloco(
  trabalhadores: Trabalhador[],
  equipa: string,
): Trabalhador[] {
  return trabalhadores.filter((t) => t.equipa === equipa);
}

export { blocoDoTalhao };
