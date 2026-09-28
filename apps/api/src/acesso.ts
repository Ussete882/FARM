/**
 * Autenticação e sessões.
 *
 * Dois caminhos, porque há dois contextos e não se parecem:
 *
 * - **Navegador**: email e palavra-passe, sessão de doze horas. É a Direcção,
 *   sentada, com teclado.
 * - **Aparelho**: um testemunho de longa duração que a Direcção emitiu uma vez.
 *   É o telemóvel do Sr. Venâncio, que pode passar uma semana sem rede e não
 *   pode ser obrigado a reautenticar-se no meio de um campo.
 *
 * O testemunho nunca é guardado em claro — guarda-se o argon2 dele, como se
 * fosse uma palavra-passe, porque é o que ele é.
 */

import { randomBytes } from 'node:crypto';

import { hash, verify } from '@node-rs/argon2';
import { ePapel, type Papel } from '@bastet/nucleo/papeis';

import { sql } from './bd';

export interface Sessao {
  utilizador: string;
  nome: string;
  papel: Papel;
  aparelho?: string;
}

const HORA = 60 * 60 * 1000;
const DURACAO_NAVEGADOR = 12 * HORA;
const DURACAO_APARELHO = 365 * 24 * HORA;

/** Um testemunho é 32 bytes de aleatoriedade. Nada de o derivar de nada. */
const novoTestemunho = (): string => randomBytes(32).toString('base64url');

export const cifrar = (segredo: string): Promise<string> => hash(segredo);

async function confere(segredo: string, guardado: string | null): Promise<boolean> {
  if (!guardado) return false;
  try {
    return await verify(guardado, segredo);
  } catch {
    return false;
  }
}

async function abrirSessao(
  utilizador: string,
  duracao: number,
  aparelho?: string,
): Promise<string> {
  const testemunho = novoTestemunho();
  await sql`
    insert into sessao (testemunho_hash, utilizador, aparelho, expira)
    values (${await cifrar(testemunho)}, ${utilizador}, ${aparelho ?? null},
            ${new Date(Date.now() + duracao)})
  `;
  return testemunho;
}

// ============================================================================
// Entrar
// ============================================================================

export async function entrarComPalavraPasse(
  id: string,
  palavraPasse: string,
): Promise<{ testemunho: string; sessao: Sessao } | undefined> {
  const [u] = await sql<
    { id: string; nome: string; papel: string; palavra_passe_hash: string | null }[]
  >`
    select id, nome, papel, palavra_passe_hash
      from utilizador where id = ${id} and activo
  `;
  if (!u || !(await confere(palavraPasse, u.palavra_passe_hash))) return undefined;
  if (!ePapel(u.papel)) return undefined;

  const testemunho = await abrirSessao(u.id, DURACAO_NAVEGADOR);
  return { testemunho, sessao: { utilizador: u.id, nome: u.nome, papel: u.papel } };
}

/**
 * Inscreve um aparelho e devolve o testemunho de longa duração.
 *
 * Só a Direcção o faz, e o testemunho é mostrado **uma vez**: a partir daqui
 * só existe o hash. Se se perder, revoga-se o aparelho e inscreve-se outro.
 */
export async function inscreverAparelho(
  quem: Sessao,
  aparelho: { id: string; designacao: string; utilizador: string },
): Promise<string> {
  await sql`
    insert into aparelho (id, designacao, utilizador, inscrito_por)
    values (${aparelho.id}, ${aparelho.designacao}, ${aparelho.utilizador}, ${quem.utilizador})
  `;
  return abrirSessao(aparelho.utilizador, DURACAO_APARELHO, aparelho.id);
}

export async function revogarAparelho(id: string): Promise<void> {
  await sql.begin(async (tx) => {
    await tx`update aparelho set revogado = now() where id = ${id} and revogado is null`;
    await tx`update sessao set terminada = now() where aparelho = ${id} and terminada is null`;
  });
}

// ============================================================================
// Reconhecer
// ============================================================================

/**
 * Resolve o testemunho do cabeçalho numa sessão.
 *
 * O argon2 não permite procurar por hash, por isso percorre-se as sessões
 * vivas e compara-se uma a uma. Com duas ou três sessões vivas isto é gratuito;
 * se um dia forem milhares, passa a haver um identificador público no
 * testemunho e a comparação fica directa.
 */
export async function reconhecer(testemunho: string | undefined): Promise<Sessao | undefined> {
  if (!testemunho) return undefined;

  const vivas = await sql<
    {
      testemunho_hash: string;
      utilizador: string;
      aparelho: string | null;
      nome: string;
      papel: string;
      revogado: Date | null;
    }[]
  >`
    select s.testemunho_hash, s.utilizador, s.aparelho, u.nome, u.papel, a.revogado
      from sessao s
      join utilizador u on u.id = s.utilizador
      left join aparelho a on a.id = s.aparelho
     where s.terminada is null
       and s.expira > now()
       and u.activo
  `;

  for (const s of vivas) {
    if (s.revogado) continue;
    if (!(await confere(testemunho, s.testemunho_hash))) continue;
    if (!ePapel(s.papel)) return undefined;

    if (s.aparelho) {
      await sql`update aparelho set ultimo_contacto = now() where id = ${s.aparelho}`;
    }
    return {
      utilizador: s.utilizador,
      nome: s.nome,
      papel: s.papel,
      ...(s.aparelho ? { aparelho: s.aparelho } : {}),
    };
  }
  return undefined;
}

export const testemunhoDoCabecalho = (cabecalho: string | undefined): string | undefined =>
  cabecalho?.startsWith('Bearer ') ? cabecalho.slice(7).trim() : undefined;
