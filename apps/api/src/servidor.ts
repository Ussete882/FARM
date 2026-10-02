/**
 * BASTET — servidor.
 *
 * Hono sobre Node. A escolha foi de portabilidade: o mesmo ficheiro corre em
 * Node, em Cloud Run, em Fly e em Deno sem uma linha diferente, e o alojamento
 * ainda está por escolher.
 *
 * Não há rota de remoção. Não é esquecimento — é o §24.5: «nenhum papel apaga
 * registos». Procurar por `delete` neste ficheiro não devolve nada, e essa é a
 * garantia mais forte que um servidor pode dar sobre isso.
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import type { ObjectoCanonico } from '@bastet/nucleo/canonico';
import { ErroConflitoVersao } from '@bastet/nucleo/historico';
import { podeEscrever, podeInscreverAparelho, recusaDePapel } from '@bastet/nucleo/papeis';
import type {
  Envio,
  EntradaSaida,
  RespostaEnvio,
  RespostaRecepcao,
  ResultadoEntrada,
} from '@bastet/nucleo/sincronizacao';
import { VERSAO_NUCLEO } from '@bastet/nucleo/versao';

import {
  entrarComPalavraPasse,
  inscreverAparelho,
  reconhecer,
  revogarAparelho,
  testemunhoDoCabecalho,
  type Sessao,
} from './acesso';
import { AMBIENTE, emProducao, exigirConfiguracao, ORIGENS, PORTA } from './ambiente';
import { esperarPorBd, sql } from './bd';
import { esperaEmSegundos, limparFalhas, registarFalha } from './travao';
import * as repo from './repositorio';
import { hojeNoServidor, validarNoServidor } from './validar';

type Variaveis = { sessao: Sessao };

const app = new Hono<{ Variables: Variaveis }>();

app.use(
  '*',
  cors({
    origin: ORIGENS,
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// ============================================================================
// Rotas abertas
// ============================================================================

app.get('/saude', async (c) => {
  try {
    await sql`select 1`;
    return c.json({
      bem: true,
      versaoNucleo: VERSAO_NUCLEO,
      hoje: hojeNoServidor(),
      ambiente: AMBIENTE,
    });
  } catch {
    return c.json({ bem: false, versaoNucleo: VERSAO_NUCLEO }, 503);
  }
});

app.post('/entrar', async (c) => {
  const { utilizador, palavraPasse } = await c.req.json<{
    utilizador?: string;
    palavraPasse?: string;
  }>();
  if (!utilizador || !palavraPasse) return c.json({ erro: 'Faltam credenciais.' }, 400);

  // Sem travão, uma palavra-passe pode ser tentada à velocidade da rede.
  const origem =
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ?? c.req.header('x-real-ip') ?? 'local';
  const espera = esperaEmSegundos(utilizador, origem);
  if (espera > 0) {
    return c.json(
      { erro: `Demasiadas tentativas. Volte a tentar daqui a ${Math.ceil(espera / 60)} minutos.` },
      429,
      { 'Retry-After': String(espera) },
    );
  }

  const r = await entrarComPalavraPasse(utilizador, palavraPasse);
  // A mesma resposta para utilizador que não existe e para palavra-passe
  // errada: dizer qual das duas falhou é dizer que utilizadores existem.
  if (!r) {
    registarFalha(utilizador, origem);
    return c.json({ erro: 'Credenciais não reconhecidas.' }, 401);
  }

  limparFalhas(utilizador);
  return c.json({ testemunho: r.testemunho, sessao: r.sessao });
});

// ============================================================================
// Daqui para baixo, é preciso ser alguém
// ============================================================================

app.use('*', async (c, next) => {
  if (['/saude', '/entrar'].includes(c.req.path)) return next();

  const sessao = await reconhecer(testemunhoDoCabecalho(c.req.header('Authorization')));
  if (!sessao) return c.json({ erro: 'Sessão não reconhecida.' }, 401);

  c.set('sessao', sessao);
  return next();
});

app.get('/eu', (c) => c.json(c.get('sessao')));

// ---------------------------------------------------------------- aparelhos

app.post('/aparelho', async (c) => {
  const sessao = c.get('sessao');
  if (!podeInscreverAparelho(sessao.papel)) {
    return c.json({ erro: 'Só a Direcção inscreve aparelhos.' }, 403);
  }
  const corpo = await c.req.json<{ id?: string; designacao?: string; utilizador?: string }>();
  if (!corpo.id || !corpo.designacao || !corpo.utilizador) {
    return c.json({ erro: 'Faltam dados do aparelho.' }, 400);
  }

  const testemunho = await inscreverAparelho(sessao, {
    id: corpo.id,
    designacao: corpo.designacao,
    utilizador: corpo.utilizador,
  });
  // Mostrado uma vez. A partir daqui só existe o hash.
  return c.json({ testemunho, aviso: 'Guarde-o: não volta a ser mostrado.' }, 201);
});

app.post('/aparelho/:id/revogar', async (c) => {
  const sessao = c.get('sessao');
  if (!podeInscreverAparelho(sessao.papel)) {
    return c.json({ erro: 'Só a Direcção revoga aparelhos.' }, 403);
  }
  await revogarAparelho(c.req.param('id'));
  return c.json({ revogado: true });
});

// ---------------------------------------------------------------- leitura

app.get('/objecto', async (c) => {
  const tipo = c.req.query('tipo');
  if (!tipo) return c.json({ erro: 'Indique o tipo.' }, 400);
  return c.json({ objectos: await repo.porTipo(tipo) });
});

app.get('/objecto/:codigo', async (c) => {
  const o = await repo.porCodigo(c.req.param('codigo'));
  return o ? c.json(o) : c.json({ erro: 'Não existe.' }, 404);
});

// ---------------------------------------------------------------- sincronizar

app.get('/sincronizar/receber', async (c) => {
  const desde = BigInt(c.req.query('desde') ?? '0');
  const limite = Math.min(Number(c.req.query('limite') ?? 500), 1000);
  const { objectos, cursor } = await repo.desde(desde, limite);

  const resposta: RespostaRecepcao = {
    objectos,
    cursor: String(cursor),
    completo: objectos.length < limite,
  };
  return c.json(resposta);
});

app.post('/sincronizar/enviar', async (c) => {
  const sessao = c.get('sessao');
  const envio = await c.req.json<Envio>();

  // A guarda de versão vem antes de tudo. Um aparelho que esteve um mês sem
  // rede pode estar a correr regras que entretanto mudaram: o que ele gravou
  // está certo segundo as antigas e errado segundo as novas, e o servidor não
  // tem como escolher em silêncio qual delas tem razão.
  if (envio.versaoNucleo !== VERSAO_NUCLEO) {
    const resposta: RespostaEnvio = {
      resultados: (envio.entradas ?? []).map((e) => ({
        id: e.id,
        aceite: false,
        motivo: 'versao_do_nucleo' as const,
        detalhe: `O aparelho corre a versão ${envio.versaoNucleo} das regras e o servidor a ${VERSAO_NUCLEO}. Actualize antes de sincronizar.`,
      })),
      cursor: String(await repo.cursorActual()),
    };
    return c.json(resposta, 409);
  }

  const resultados: ResultadoEntrada[] = [];
  for (const entrada of envio.entradas ?? []) {
    resultados.push(await aplicar(entrada, sessao, envio.versaoNucleo));
  }

  const resposta: RespostaEnvio = {
    resultados,
    cursor: String(await repo.cursorActual()),
  };
  return c.json(resposta);
});

// ============================================================================
// Aplicar uma entrada
// ============================================================================

async function aplicar(
  entrada: EntradaSaida,
  sessao: Sessao,
  versaoNucleo: string,
): Promise<ResultadoEntrada> {
  const alvo: ObjectoCanonico | undefined =
    entrada.escrita === 'anular' ? entrada.substituto : entrada.objecto;

  if (!alvo) {
    return { id: entrada.id, aceite: false, motivo: 'recusado', detalhe: 'Entrada sem objecto.' };
  }

  const registar = (aceite: boolean, r: Omit<ResultadoEntrada, 'id' | 'aceite'>) =>
    sql`
      insert into recepcao (utilizador, aparelho, versao_nucleo, escrita, objecto_codigo, aceite, motivo, constatacoes)
      values (${sessao.utilizador}, ${sessao.aparelho ?? null}, ${versaoNucleo},
              ${entrada.escrita}, ${alvo.codigo}, ${aceite}, ${r.motivo ?? null},
              ${sql.json((r.constatacoes ?? null) as never)})
    `;

  // --- Poderes (§24.5) -----------------------------------------------------
  if (!podeEscrever(sessao.papel, alvo.tipo)) {
    const r = {
      motivo: 'recusado' as const,
      detalhe: recusaDePapel(sessao.papel, alvo.tipo).pt,
    };
    await registar(false, r);
    return { id: entrada.id, aceite: false, codigo: alvo.codigo, ...r };
  }

  // --- Regras do §8, com o contexto que só a base tem ----------------------
  const validacao = await validarNoServidor(alvo, hojeNoServidor());
  if (!validacao.gravavel) {
    const r = { motivo: 'validacao' as const, constatacoes: validacao.constatacoes };
    await registar(false, r);
    return { id: entrada.id, aceite: false, codigo: alvo.codigo, ...r };
  }

  // --- Gravar --------------------------------------------------------------
  try {
    if (entrada.escrita === 'criar') {
      await repo.inserir(alvo);
    } else if (entrada.escrita === 'alterar') {
      await repo.substituir(alvo, entrada.versaoAnterior ?? alvo.versao - 1);
    } else {
      if (!entrada.anulado) throw new Error('Anulação sem o registo original.');
      await repo.gravarParAnulado(
        entrada.anulado,
        alvo,
        entrada.versaoAnterior ?? entrada.anulado.versao - 1,
      );
    }
  } catch (e) {
    if (e instanceof ErroConflitoVersao) {
      const actual = await repo.porCodigo(alvo.codigo);
      const r = {
        motivo: 'conflito' as const,
        detalhe: e.message,
        ...(actual ? { actual } : {}),
      };
      await registar(false, r);
      return { id: entrada.id, aceite: false, codigo: alvo.codigo, ...r };
    }
    const r = {
      motivo: 'recusado' as const,
      detalhe: e instanceof Error ? e.message : 'Erro desconhecido.',
    };
    await registar(false, r);
    return { id: entrada.id, aceite: false, codigo: alvo.codigo, ...r };
  }

  await registar(true, {});
  return { id: entrada.id, aceite: true, codigo: alvo.codigo };
}

// ============================================================================
// Arrancar
// ============================================================================

exigirConfiguracao();
await esperarPorBd();

serve({ fetch: app.fetch, port: PORTA, hostname: '0.0.0.0' }, (info) => {
  console.log(`BASTET — servidor na porta ${info.port} (${AMBIENTE})`);
  console.log(`  regras: versão ${VERSAO_NUCLEO}`);
  console.log(`  origens: ${ORIGENS.join(', ')}`);
  if (!emProducao) console.log('  valores de desenvolvimento em uso.');
});

export { app };
