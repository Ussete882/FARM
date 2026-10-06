/**
 * BASTET — semeadura local.
 *
 * **Só corre em desenvolvimento.** Publicado, o cliente nasce vazio e enche-se
 * sincronizando: os dados vêm do servidor, de quem tiver autorização para os
 * ver, e não de um ficheiro compilado dentro da aplicação.
 *
 * A diferença não é de arrumação. A semente traz os 22 nomes do quadro de
 * pessoal, e `contactos.local.ts` traz 21 números de telemóvel. Compilados para
 * dentro do pacote, iam parar a um endereço público — e qualquer pessoa com o
 * link ficava com o registo de pessoal da farma. Guardámos esses contactos fora
 * do repositório justamente para isso não acontecer; de nada serviria se a
 * compilação os voltasse a pôr lá.
 *
 * Por isso a importação é dinâmica e vive dentro de um ramo que só existe em
 * desenvolvimento: compilado, o ramo desaparece e os dados com ele. Há um teste
 * que percorre o pacote compilado à procura de um nome e de um número — porque
 * esta garantia é do tipo que se quebra em silêncio.
 */

import { SEMENTE_VERSAO } from '@bastet/nucleo/contexto';

import { db, TABELAS } from './db';

export { SEMENTE_VERSAO, UNIDADE, PROJECTO, HOJE, CAMPANHA } from '@bastet/nucleo/contexto';

export async function semearSeVazio(): Promise<boolean> {
  if (!import.meta.env.DEV) return false;

  const marca = localStorage.getItem('bastet:semente');
  const jaTem = await db.trabalhadores.count();

  if (jaTem > 0 && marca === SEMENTE_VERSAO) return false;
  if (jaTem > 0) await Promise.all(TABELAS.map((nome) => db[nome].clear()));

  await semear();
  localStorage.setItem('bastet:semente', SEMENTE_VERSAO);
  return true;
}

export async function semear(): Promise<void> {
  if (!import.meta.env.DEV) return;

  const { construirSemente } = await import('@bastet/nucleo/farma-alcinda');
  const { CONTACTOS } = await import('./contactos');
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
