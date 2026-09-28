/**
 * BASTET — semeadura local.
 *
 * Os dados vêm de `@bastet/nucleo/farma-alcinda`, que é o mesmo ficheiro que o
 * servidor usa. Não são duas cópias que se parecem: é a mesma função, e como a
 * geração é determinística — os códigos vêm dos dados, não de contadores — os
 * dois lados produzem objectos idênticos. A sincronização não tem nada que
 * reconciliar no primeiro arranque.
 *
 * O que fica aqui é só a escrita no IndexedDB, que é a parte que não pode
 * viver no núcleo.
 */

import { construirSemente, SEMENTE_VERSAO } from '@bastet/nucleo/farma-alcinda';

import { CONTACTOS } from './contactos';
import { db, TABELAS } from './db';

export { SEMENTE_VERSAO };
export { UNIDADE, PROJECTO, HOJE, CAMPANHA } from '@bastet/nucleo/farma-alcinda';

export async function semearSeVazio(): Promise<boolean> {
  const marca = localStorage.getItem('bastet:semente');
  const jaTem = await db.trabalhadores.count();

  if (jaTem > 0 && marca === SEMENTE_VERSAO) return false;
  if (jaTem > 0) await Promise.all(TABELAS.map((nome) => db[nome].clear()));

  await semear();
  localStorage.setItem('bastet:semente', SEMENTE_VERSAO);
  return true;
}

export async function semear(): Promise<void> {
  // Os contactos entram por parâmetro: vivem fora do repositório e o núcleo
  // não os conhece.
  const s = construirSemente(CONTACTOS);

  await db.transaction(
    'rw',
    [db.blocos, db.culturas, db.variedades, db.trabalhadores, db.equipas, db.pendencias],
    async () => {
      await db.blocos.bulkPut(s.blocos);
      await db.culturas.bulkPut(s.culturas);
      await db.variedades.bulkPut(s.variedades);
      await db.trabalhadores.bulkPut(s.trabalhadores);
      await db.equipas.bulkPut(s.equipas);
      await db.pendencias.bulkPut(s.pendencias);
    },
  );
}

/** Repõe a semente. Usado no ecrã de diagnóstico, nunca em produção. */
export async function ressemear(): Promise<void> {
  await Promise.all(TABELAS.map((nome) => db[nome].clear()));
  await semear();
}
