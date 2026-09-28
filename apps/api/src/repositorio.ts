/**
 * Repositório canónico — a tradução entre o objecto do §2.3 e a linha.
 *
 * É o único sítio do servidor que sabe que existe SQL. Tudo o resto fala em
 * `ObjectoCanonico`, que é o mesmo tipo que o cliente usa, do mesmo pacote.
 *
 * Não existe aqui função de remoção, e não é esquecimento (§24.5): «nenhum
 * papel apaga registos». A correcção é `anularESubstituir`, e o par grava na
 * mesma transacção para que nunca haja um instante em que só um dos dois
 * esteja visível.
 */

import type { ObjectoCanonico } from '@bastet/nucleo/canonico';
import { ErroConflitoVersao } from '@bastet/nucleo/historico';

import { sql } from './bd';

/** Os campos que são colunas. Todo o resto do objecto vai para `dados`. */
const ESQUELETO = [
  'id',
  'codigo',
  'designacao',
  'tipo',
  'estado',
  'dono',
  'criado_em',
  'criado_por',
  'alterado_em',
  'alterado_por',
  'versao',
  'notas',
  'anulado',
  'relacoes',
  'historico',
  'anexos',
] as const;

const DO_ESQUELETO = new Set<string>(ESQUELETO);

interface Linha {
  id: string;
  codigo: string;
  designacao: string;
  tipo: string;
  estado: string;
  dono: string;
  criado_em: Date | string;
  criado_por: string;
  alterado_em: Date | string;
  alterado_por: string;
  versao: number;
  notas: string | null;
  anulado: unknown;
  relacoes: unknown;
  historico: unknown;
  anexos: unknown;
  dados: Record<string, unknown>;
  sequencia: string | number;
}

/** A data volta do Postgres como `Date`; o domínio trabalha em ISO curto. */
const paraIso = (v: Date | string): string =>
  typeof v === 'string' ? v.slice(0, 10) : v.toISOString().slice(0, 10);

export function deLinha(l: Linha): ObjectoCanonico {
  const objecto = {
    id: l.id,
    codigo: l.codigo,
    designacao: l.designacao,
    tipo: l.tipo,
    estado: l.estado,
    dono: l.dono,
    criado_em: paraIso(l.criado_em),
    criado_por: l.criado_por,
    alterado_em: paraIso(l.alterado_em),
    alterado_por: l.alterado_por,
    versao: l.versao,
    relacoes: l.relacoes ?? [],
    historico: l.historico ?? [],
    anexos: l.anexos ?? [],
    ...(l.notas === null ? {} : { notas: l.notas }),
    ...(l.anulado === null || l.anulado === undefined ? {} : { anulado: l.anulado }),
    ...l.dados,
  };
  return objecto as unknown as ObjectoCanonico;
}

function separar(o: ObjectoCanonico): { dados: Record<string, unknown> } {
  const dados: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(o)) {
    if (!DO_ESQUELETO.has(chave)) dados[chave] = valor;
  }
  return { dados };
}

// ============================================================================
// Leitura
// ============================================================================

export async function porCodigo(codigo: string): Promise<ObjectoCanonico | undefined> {
  const [l] = await sql<Linha[]>`select * from objecto where codigo = ${codigo}`;
  return l ? deLinha(l) : undefined;
}

export async function porTipo(tipo: string): Promise<ObjectoCanonico[]> {
  const linhas = await sql<Linha[]>`select * from objecto where tipo = ${tipo} order by codigo`;
  return linhas.map(deLinha);
}

/**
 * Tudo o que mudou depois deste ponto do cursor. É a leitura da sincronização:
 * o telemóvel guarda a última sequência que viu e pede daí para a frente.
 */
export async function desde(
  cursor: bigint,
  limite = 500,
): Promise<{ objectos: ObjectoCanonico[]; cursor: bigint }> {
  const linhas = await sql<Linha[]>`
    select * from objecto
     where sequencia > ${String(cursor)}
     order by sequencia
     limit ${limite}
  `;
  const maior = linhas.reduce((m, l) => {
    const s = BigInt(l.sequencia);
    return s > m ? s : m;
  }, cursor);
  return { objectos: linhas.map(deLinha), cursor: maior };
}

// ============================================================================
// Escrita
// ============================================================================

/** Grava um objecto novo. Recusa se o código já existir. */
export async function inserir(o: ObjectoCanonico): Promise<ObjectoCanonico> {
  const { dados } = separar(o);
  const [l] = await sql<Linha[]>`
    insert into objecto (
      id, codigo, designacao, tipo, estado, dono,
      criado_em, criado_por, alterado_em, alterado_por, versao,
      notas, anulado, relacoes, historico, anexos, dados
    ) values (
      ${o.id}, ${o.codigo}, ${o.designacao}, ${o.tipo}, ${o.estado}, ${o.dono},
      ${o.criado_em}, ${o.criado_por}, ${o.alterado_em}, ${o.alterado_por}, ${o.versao},
      ${o.notas ?? null}, ${sql.json((o.anulado ?? null) as never)},
      ${sql.json(o.relacoes as never)}, ${sql.json(o.historico as never)},
      ${sql.json(o.anexos as never)}, ${sql.json(dados as never)}
    )
    returning *
  `;
  return deLinha(l);
}

/**
 * Substitui um objecto existente, com bloqueio optimista.
 *
 * `versaoAnterior` é a versão que o cliente leu antes de alterar. Se entretanto
 * outra pessoa gravou, a versão na base já não é essa e a escrita é recusada —
 * nunca sobreposta. Quem foi recusado recebe o objecto que está lá e resolve
 * pelo §24.5: anula e substitui, com motivo.
 */
export async function substituir(
  o: ObjectoCanonico,
  versaoAnterior: number,
): Promise<ObjectoCanonico> {
  const { dados } = separar(o);
  const linhas = await sql<Linha[]>`
    update objecto set
      designacao   = ${o.designacao},
      estado       = ${o.estado},
      dono         = ${o.dono},
      alterado_em  = ${o.alterado_em},
      alterado_por = ${o.alterado_por},
      versao       = ${o.versao},
      notas        = ${o.notas ?? null},
      anulado      = ${sql.json((o.anulado ?? null) as never)},
      relacoes     = ${sql.json(o.relacoes as never)},
      historico    = ${sql.json(o.historico as never)},
      anexos       = ${sql.json(o.anexos as never)},
      dados        = ${sql.json(dados as never)}
    where codigo = ${o.codigo} and versao = ${versaoAnterior}
    returning *
  `;

  if (linhas.length === 0) {
    const actual = await porCodigo(o.codigo);
    throw new ErroConflitoVersao(
      actual
        ? `O registo ${o.codigo} foi alterado por outra pessoa: esperava a versão ${versaoAnterior} e encontrou a ${actual.versao}. Nada foi sobreposto.`
        : `O registo ${o.codigo} não existe.`,
    );
  }
  return deLinha(linhas[0]);
}

/** O par anulado e substituto, na mesma transacção (§24.5). */
export async function gravarParAnulado(
  anulado: ObjectoCanonico,
  substituto: ObjectoCanonico,
  versaoAnterior: number,
): Promise<{ anulado: ObjectoCanonico; substituto: ObjectoCanonico }> {
  return sql.begin(async () => {
    const a = await substituir(anulado, versaoAnterior);
    const s = await inserir(substituto);
    return { anulado: a, substituto: s };
  }) as Promise<{ anulado: ObjectoCanonico; substituto: ObjectoCanonico }>;
}

/** O cursor mais alto que existe. Serve um cliente que sincroniza de novo. */
export async function cursorActual(): Promise<bigint> {
  const [l] = await sql<{ maior: string | null }[]>`
    select max(sequencia)::text as maior from objecto
  `;
  return BigInt(l?.maior ?? '0');
}
