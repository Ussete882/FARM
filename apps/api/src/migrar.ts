/**
 * Corredor de migrações.
 *
 * Ficheiros SQL numerados em `infra/migracoes`, aplicados por ordem, uma vez
 * cada. Uma tabela regista o que já correu.
 *
 * Não há biblioteca de migrações aqui de propósito: a este tamanho, uma
 * dependência que faz isto traria mais conceitos do que as trinta linhas que
 * isto tem. Cada migração corre dentro de uma transacção — ou entra inteira,
 * ou não entra.
 */

import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { esperarPorBd, fechar, sql } from './bd';

const AQUI = dirname(fileURLToPath(import.meta.url));
const PASTA = join(AQUI, '..', '..', '..', 'infra', 'migracoes');

async function migrar(): Promise<void> {
  await esperarPorBd();

  await sql`
    create table if not exists migracao (
      ficheiro  text primary key,
      aplicada  timestamptz not null default now()
    )
  `;

  const aplicadas = new Set(
    (await sql<{ ficheiro: string }[]>`select ficheiro from migracao`).map((r) => r.ficheiro),
  );

  const ficheiros = (await readdir(PASTA)).filter((f) => f.endsWith('.sql')).sort();

  let corridas = 0;
  for (const ficheiro of ficheiros) {
    if (aplicadas.has(ficheiro)) continue;

    const conteudo = await readFile(join(PASTA, ficheiro), 'utf8');
    await sql.begin(async (tx) => {
      await tx.unsafe(conteudo);
      await tx`insert into migracao (ficheiro) values (${ficheiro})`;
    });

    console.log(`  aplicada  ${ficheiro}`);
    corridas++;
  }

  console.log(
    corridas === 0
      ? `Nada a fazer: ${ficheiros.length} migrações já aplicadas.`
      : `${corridas} de ${ficheiros.length} migrações aplicadas.`,
  );
}

migrar()
  .then(fechar)
  .catch(async (e) => {
    console.error('A migração falhou:', e instanceof Error ? e.message : e);
    await fechar();
    process.exitCode = 1;
  });
