/**
 * BASTET — semeadura local.
 *
 * Traz o quadro de pessoal — os 22 nomes, as funções, as duas zonas — para o
 * sistema poder ser visto e usado antes de haver servidor. **Não traz os
 * contactos**: esses ficam em `contactos.local.ts`, que nunca é compilado para
 * produção (ver `contactos.ts`).
 *
 * A distinção é deliberada e não é óbvia. Um nome e uma função são o que o
 * sistema tem de mostrar para servir de alguma coisa: uma ficha que diz
 * «TR-00014» e mais nada não serve a quem a vai usar. Um número de telemóvel
 * não é preciso para nada disso, e é o dado que faz mal se andar à solta.
 *
 * `verificar-pacote.mjs` corre a seguir a cada compilação e recusa publicar se
 * encontrar um número — porque esta garantia é do tipo que se quebra em
 * silêncio.
 */

import { SEMENTE_VERSAO } from '@bastet/nucleo/contexto';

import { db, TABELAS } from './db';

export { SEMENTE_VERSAO, UNIDADE, PROJECTO, HOJE, CAMPANHA } from '@bastet/nucleo/contexto';

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
  const { construirSemente } = await import('@bastet/nucleo/farma-alcinda');
  const { contactosLocais } = await import('./contactos');
  const s = construirSemente(await contactosLocais());

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
