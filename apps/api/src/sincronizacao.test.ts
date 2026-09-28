/**
 * Sincronização — as recusas.
 *
 * Os testes do núcleo verificam que as regras estão certas. Estes verificam o
 * que o núcleo sozinho não pode verificar: que o servidor **recusa**, e recusa
 * pela razão certa.
 *
 * Um servidor que aceita tudo passaria nos 73 testes do núcleo sem falhar um.
 *
 * Precisam da base a correr (`npm run bd:subir && npm run bd:migrar`). Sem ela,
 * saltam — um teste de integração que falha por falta de infra-estrutura só
 * ensina a ignorar testes vermelhos.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { q } from '@bastet/nucleo/canonico';
import type { Talhao } from '@bastet/nucleo/territorio';
import type { Envio, RespostaEnvio } from '@bastet/nucleo/sincronizacao';
import { VERSAO_NUCLEO } from '@bastet/nucleo/versao';

import { cifrar } from './acesso';
import { fechar, sql } from './bd';

const BASE = process.env.BASTET_API ?? 'http://localhost:4000';

let testemunho = '';
let testemunhoDoCampo = '';
let haServidor = false;

/** Um talhão que passa nas regras: áreas coerentes, sequeiro, sem polígono. */
function talhao(codigo: string, over: Partial<Talhao> = {}): Talhao {
  return {
    id: codigo,
    codigo,
    designacao: `Ensaio ${codigo}`,
    tipo: 'talhao',
    estado: 'activo',
    dono: 'TR-00001',
    criado_em: '2026-09-28',
    criado_por: 'TR-00001',
    alterado_em: '2026-09-28',
    alterado_por: 'TR-00001',
    versao: 1,
    relacoes: [],
    historico: [],
    anexos: [],
    bloco: 'FA-B01',
    area_bruta_ha: q(10, 'ha'),
    area_plantada_ha: q(9.5, 'ha', 'plantada'),
    area_util_ha: q(9, 'ha', 'util'),
    poligono: [],
    tipo_solo: 'ferralsolo',
    sistema_rega: 'sequeiro',
    ...over,
  } as Talhao;
}

const enviar = async (envio: Envio, t = testemunho): Promise<RespostaEnvio> => {
  const r = await fetch(`${BASE}/sincronizar/enviar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
    body: JSON.stringify(envio),
  });
  return r.json() as Promise<RespostaEnvio>;
};

beforeAll(async () => {
  try {
    const saude = await fetch(`${BASE}/saude`);
    haServidor = saude.ok;
  } catch {
    haServidor = false;
  }
  if (!haServidor) return;

  const r = await fetch(`${BASE}/entrar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      utilizador: 'DIR-01',
      palavraPasse: process.env.BASTET_PALAVRA_PASSE ?? 'alcinda',
    }),
  });
  testemunho = ((await r.json()) as { testemunho: string }).testemunho;

  // Um utilizador de campo, para provar que os poderes do §24.5 mordem.
  await sql`
    insert into utilizador (id, nome, papel, palavra_passe_hash)
    values ('TESTE-CAMPO', 'Chefe de turma de ensaio', 'chefe_turma', ${await cifrar('teste')})
    on conflict (id) do update set papel = 'chefe_turma'
  `;
  const rc = await fetch(`${BASE}/entrar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ utilizador: 'TESTE-CAMPO', palavraPasse: 'teste' }),
  });
  testemunhoDoCampo = ((await rc.json()) as { testemunho: string }).testemunho;
});

afterAll(async () => {
  if (haServidor) {
    await sql`delete from recepcao where objecto_codigo like 'FA-B01-T9%'`;
    await sql`delete from objecto where codigo like 'FA-B01-T9%'`;
    await sql`delete from sessao where utilizador = 'TESTE-CAMPO'`;
    await sql`delete from utilizador where id = 'TESTE-CAMPO'`;
  }
  await fechar();
});

describe.runIf(process.env.CI !== 'true')('Sincronização', () => {
  it('aceita um registo que passa nas regras', async () => {
    if (!haServidor) return;
    const r = await enviar({
      versaoNucleo: VERSAO_NUCLEO,
      entradas: [{ id: 1, escrita: 'criar', objecto: talhao('FA-B01-T90') }],
    });
    expect(r.resultados[0].aceite).toBe(true);
    expect(r.resultados[0].codigo).toBe('FA-B01-T90');
  });

  it('recusa um registo que não passa, com as constatações do núcleo', async () => {
    if (!haServidor) return;
    // Área plantada maior que a bruta: bloqueante no E-01.
    const r = await enviar({
      versaoNucleo: VERSAO_NUCLEO,
      entradas: [
        {
          id: 2,
          escrita: 'criar',
          objecto: talhao('FA-B01-T91', { area_plantada_ha: q(99, 'ha', 'plantada') }),
        },
      ],
    });
    expect(r.resultados[0].aceite).toBe(false);
    expect(r.resultados[0].motivo).toBe('validacao');
    // As mensagens vêm nas três línguas, como em qualquer parte do sistema.
    const c = r.resultados[0].constatacoes?.[0];
    expect(c?.severidade).toBe('bloqueante');
    expect(c?.mensagem.pt).toContain('maior do que a área bruta');
    expect(c?.mensagem.zh.length).toBeGreaterThan(0);
  });

  it('recusa quem não tem o papel para escrever aquele tipo (§24.5)', async () => {
    if (!haServidor) return;
    // Um chefe de turma regista jornas e pesagens; não cria talhões.
    const r = await enviar(
      {
        versaoNucleo: VERSAO_NUCLEO,
        entradas: [{ id: 3, escrita: 'criar', objecto: talhao('FA-B01-T92') }],
      },
      testemunhoDoCampo,
    );
    expect(r.resultados[0].aceite).toBe(false);
    expect(r.resultados[0].motivo).toBe('recusado');
    expect(r.resultados[0].detalhe).toContain('Chefe de turma');
  });

  it('recusa um aparelho a correr outra versão das regras', async () => {
    if (!haServidor) return;
    const r = await enviar({
      versaoNucleo: '0.0.1-antiga',
      entradas: [{ id: 4, escrita: 'criar', objecto: talhao('FA-B01-T93') }],
    });
    expect(r.resultados[0].aceite).toBe(false);
    expect(r.resultados[0].motivo).toBe('versao_do_nucleo');

    const [existe] = await sql`select 1 from objecto where codigo = 'FA-B01-T93'`;
    expect(existe).toBeUndefined();
  });

  it('recusa a alteração em conflito e não sobrepõe nada', async () => {
    if (!haServidor) return;

    await enviar({
      versaoNucleo: VERSAO_NUCLEO,
      entradas: [{ id: 5, escrita: 'criar', objecto: talhao('FA-B01-T94') }],
    });

    // Duas pessoas leram a versão 1. A primeira grava.
    const primeira = await enviar({
      versaoNucleo: VERSAO_NUCLEO,
      entradas: [
        {
          id: 6,
          escrita: 'alterar',
          versaoAnterior: 1,
          objecto: talhao('FA-B01-T94', { designacao: 'Alterado pela primeira', versao: 2 }),
        },
      ],
    });
    expect(primeira.resultados[0].aceite).toBe(true);

    // A segunda ainda tem a versão 1 na mão.
    const segunda = await enviar({
      versaoNucleo: VERSAO_NUCLEO,
      entradas: [
        {
          id: 7,
          escrita: 'alterar',
          versaoAnterior: 1,
          objecto: talhao('FA-B01-T94', { designacao: 'Alterado pela segunda', versao: 2 }),
        },
      ],
    });
    expect(segunda.resultados[0].aceite).toBe(false);
    expect(segunda.resultados[0].motivo).toBe('conflito');
    // E recebe o que está lá, para poder decidir pelo §24.5.
    expect(segunda.resultados[0].actual?.designacao).toBe('Alterado pela primeira');

    const [linha] = await sql<{ designacao: string }[]>`
      select designacao from objecto where codigo = 'FA-B01-T94'
    `;
    expect(linha.designacao).toBe('Alterado pela primeira');
  });

  it('regista tudo o que chegou, aceite ou recusado', async () => {
    if (!haServidor) return;
    const linhas = await sql<{ aceite: boolean; motivo: string | null }[]>`
      select aceite, motivo from recepcao where objecto_codigo like 'FA-B01-T9%'
    `;
    expect(linhas.length).toBeGreaterThan(0);
    expect(linhas.some((l) => l.aceite)).toBe(true);
    expect(linhas.some((l) => !l.aceite)).toBe(true);
  });

  it('não expõe rota de remoção (§24.5)', async () => {
    if (!haServidor) return;
    const r = await fetch(`${BASE}/objecto/FA-B01-T90`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${testemunho}` },
    });
    expect(r.status).toBe(404);
  });
});
