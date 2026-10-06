/**
 * Ligação ao PostgreSQL.
 *
 * A configuração vem toda de variáveis de ambiente, com valores locais por
 * omissão. Não há credenciais no repositório, e o dia em que isto for para a
 * nuvem não há nada a mudar aqui — só a variável.
 */

import postgres from 'postgres';

import { emProducao, LIGACAO_BD } from './ambiente';

export const LIGACAO = LIGACAO_BD;

/**
 * O TLS decide-se na cadeia de ligação (`?sslmode=require`), não aqui.
 *
 * Forçá-lo no código parecia mais seguro e era mais frágil: um Postgres na
 * rede privada do próprio alojamento não usa TLS, não precisa, e o servidor
 * recusava-se a falar com ele. Quem instala é que sabe por onde passa o
 * tráfego — o que o sistema faz é avisar se em produção a cadeia não disser
 * nada sobre isso.
 */
export const sql = postgres(LIGACAO, {
  /**
   * Uma ligação por instância.
   *
   * Numa função sem servidor há tantas instâncias quantos os pedidos em
   * paralelo, e cada uma com o seu grupo de ligações esgotava o Postgres
   * depressa. Uma só por instância, devolvida ao fim de vinte segundos, é o que
   * cabe. Num processo permanente isto é conservador e não custa nada: o volume
   * desta farma são dezenas de escritas por semana.
   */
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
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
  let ultimo: unknown;
  for (let i = 1; i <= tentativas; i++) {
    try {
      await sql`select 1`;
      return;
    } catch (e) {
      ultimo = e;
      if (i < tentativas) await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Quem lê isto está a instalar o sistema, não a depurá-lo. Uma pilha de
  // chamadas do driver não lhe diz o que fazer a seguir; a cadeia de ligação,
  // sem a palavra-passe, diz.
  const motivo = ultimo instanceof Error ? ultimo.message : String(ultimo);
  console.error('\nBASTET — não foi possível falar com a base de dados.\n');
  console.error(`  ligação   ${semSegredo(LIGACAO)}`);
  console.error(`  motivo    ${motivo}`);
  if (emProducao && !/sslmode=/.test(LIGACAO)) {
    console.error('  nota      a cadeia não indica sslmode. Um Postgres gerido costuma');
    console.error('            exigir `?sslmode=require`.');
  }
  console.error('');
  process.exit(1);
}

/** A cadeia de ligação sem a palavra-passe, para poder ir para um registo. */
export function semSegredo(cadeia: string): string {
  return cadeia.replace(/\/\/([^:/@]+):[^@]*@/, '//$1:***@');
}
