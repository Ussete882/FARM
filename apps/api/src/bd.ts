/**
 * Ligação ao PostgreSQL.
 *
 * A configuração vem toda de variáveis de ambiente, com valores locais por
 * omissão. Não há credenciais no repositório, e o dia em que isto for para a
 * nuvem não há nada a mudar aqui — só a variável.
 */

import postgres from 'postgres';

export const LIGACAO =
  process.env.BASTET_BD ?? 'postgres://bastet:bastet@localhost:5433/bastet';

export const sql = postgres(LIGACAO, {
  // Os avisos do Postgres («a tabela já existe», «a sequência já existe») não
  // são erros e enchiam o arranque de ruído.
  onnotice: () => {},
  transform: { undefined: null },
});

/** Fecha a ligação. Usado pelos scripts, que têm de terminar. */
export async function fechar(): Promise<void> {
  await sql.end({ timeout: 5 });
}

/**
 * Espera que a base responda. Um `docker compose up` devolve o controlo antes
 * de o Postgres aceitar ligações, e sem isto a primeira migração falha por
 * uma questão de segundos.
 */
export async function esperarPorBd(tentativas = 20): Promise<void> {
  for (let i = 1; i <= tentativas; i++) {
    try {
      await sql`select 1`;
      return;
    } catch (e) {
      if (i === tentativas) throw e;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}
