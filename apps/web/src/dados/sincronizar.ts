/**
 * BASTET — sincronização diferida (§25).
 *
 * O telemóvel do Sr. Venâncio pode passar uma semana sem rede. Isso não é uma
 * falha a tolerar: é o modo normal de funcionamento, e o desenho parte daí.
 *
 * Escrever nunca espera pela rede. O registo entra no IndexedDB, o ecrã
 * actualiza-se na hora, e uma cópia fica na caixa de saída à espera de sinal.
 * Quando houver, sai. Se o servidor recusar, a recusa aparece no ecrã *Por
 * sincronizar* — **nunca se perde e nunca se apaga em silêncio**.
 *
 * O servidor é a fonte de verdade. Por isso enviar pode ser recusado e receber
 * não: um aparelho que escreve pode estar enganado, um aparelho que lê nunca
 * está.
 */

import type { ObjectoCanonico } from '@bastet/nucleo/canonico';
import type { T } from '@bastet/nucleo/i18n';
import type {
  EntradaSaida,
  RespostaEnvio,
  RespostaRecepcao,
  TipoEscrita,
} from '@bastet/nucleo/sincronizacao';
import { VERSAO_NUCLEO } from '@bastet/nucleo/versao';

import { db, type NaSaida } from './db';

export const SERVIDOR = import.meta.env.VITE_BASTET_API ?? 'http://localhost:4000';

const CURSOR = 'sincronizacao:cursor';
const TESTEMUNHO = 'sincronizacao:testemunho';
const ULTIMA = 'sincronizacao:ultima';

// ============================================================================
// Estado do aparelho
// ============================================================================

async function ler(chave: string): Promise<string | undefined> {
  return (await db.estado.get(chave))?.valor;
}
const guardar = (chave: string, valor: string) => db.estado.put({ chave, valor });

export const testemunhoGuardado = () => ler(TESTEMUNHO);
export const guardarTestemunho = (t: string) => guardar(TESTEMUNHO, t);
export const esquecerTestemunho = () => db.estado.delete(TESTEMUNHO);
export const ultimaSincronizacao = () => ler(ULTIMA);

// ============================================================================
// A caixa de saída
// ============================================================================

/**
 * Põe uma escrita na fila. Chamada por `escrever.ts` na mesma transacção em
 * que o objecto entra no IndexedDB — ou entram os dois, ou não entra nenhum.
 * Um registo gravado que não ficasse na fila seria um registo que nunca sai do
 * telemóvel, e ninguém daria por isso.
 */
export async function porNaSaida(
  escrita: TipoEscrita,
  carga: {
    objecto?: ObjectoCanonico;
    anulado?: ObjectoCanonico;
    substituto?: ObjectoCanonico;
    versaoAnterior?: number;
  },
): Promise<void> {
  await db.saida.add({
    escrita,
    estadoEnvio: 'pendente',
    criada: new Date().toISOString(),
    ...carga,
  } as NaSaida);
}

export const porEnviar = () => db.saida.where('estadoEnvio').equals('pendente').toArray();
export const recusadas = () => db.saida.where('estadoEnvio').equals('recusada').toArray();

/**
 * Descarta uma recusa, depois de quem a viu decidir o que fazer.
 *
 * Não apaga o registo — só a entrada na fila. O objecto continua no IndexedDB
 * com a sua história; o que sai é a tentativa de o enviar.
 */
export const arquivarRecusa = (id: number) => db.saida.delete(id);

// ============================================================================
// Sincronizar
// ============================================================================

export interface Resumo {
  enviadas: number;
  aceites: number;
  recusadas: number;
  recebidos: number;
  erro?: T;
}

/**
 * Ficar sem rede não é um erro: é segunda-feira no campo. A mensagem tem de o
 * dizer assim, e não repetir o que o navegador diz — «Failed to fetch» não é
 * frase para quem está a meio de uma plantação a tentar entregar o F-05.
 */
const SEM_REDE: T = {
  pt: 'Sem ligação ao servidor. Nada se perdeu: a fila fica como está e sai na próxima vez que houver rede.',
  en: 'No connection to the server. Nothing was lost: the queue stays as it is and goes out next time there is network.',
  zh: '无法连接服务器。没有任何内容丢失：队列保持原样，下次有网络时会自动发出。',
};

const servidorRespondeuMal = (estado: number): T => ({
  pt: `O servidor respondeu ${estado}. A fila fica intacta.`,
  en: `The server replied ${estado}. The queue is untouched.`,
  zh: `服务器返回 ${estado}。队列未受影响。`,
});

/** O servidor respondeu, mas mal. Distingue-se de não ter respondido. */
class RespostaMa extends Error {
  constructor(readonly texto: T) {
    super(texto.pt);
  }
}

const cabecalhos = (t: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${t}`,
});

export async function sincronizar(): Promise<Resumo> {
  const vazio: Resumo = { enviadas: 0, aceites: 0, recusadas: 0, recebidos: 0 };

  const testemunho = await testemunhoGuardado();
  if (!testemunho) {
    return {
      ...vazio,
      erro: {
        pt: 'O aparelho não está inscrito.',
        en: 'This device is not enrolled.',
        zh: '本设备尚未注册。',
      },
    };
  }

  try {
    const enviado = await enviar(testemunho);
    const recebidos = await receber(testemunho);
    await guardar(ULTIMA, new Date().toISOString());
    return { ...enviado, recebidos };
  } catch (e) {
    return { ...vazio, erro: e instanceof RespostaMa ? e.texto : SEM_REDE };
  }
}

async function enviar(testemunho: string): Promise<Omit<Resumo, 'recebidos'>> {
  const fila = await porEnviar();
  if (fila.length === 0) return { enviadas: 0, aceites: 0, recusadas: 0 };

  const r = await fetch(`${SERVIDOR}/sincronizar/enviar`, {
    method: 'POST',
    headers: cabecalhos(testemunho),
    body: JSON.stringify({
      versaoNucleo: VERSAO_NUCLEO,
      entradas: fila.map(
        (e): EntradaSaida => ({
          id: e.id as number,
          escrita: e.escrita,
          objecto: e.objecto,
          anulado: e.anulado,
          substituto: e.substituto,
          versaoAnterior: e.versaoAnterior,
        }),
      ),
    }),
  });

  const resposta = (await r.json()) as RespostaEnvio;

  let aceites = 0;
  let recusas = 0;
  await db.transaction('rw', db.saida, async () => {
    for (const res of resposta.resultados) {
      if (res.aceite) {
        // Aceite é aceite: sai da fila. O objecto fica, a tentativa não.
        await db.saida.delete(res.id);
        aceites++;
      } else {
        await db.saida.update(res.id, {
          estadoEnvio: 'recusada',
          motivo: res.motivo,
          detalhe: res.detalhe,
          constatacoes: res.constatacoes,
          actual: res.actual,
        });
        recusas++;
      }
    }
  });

  return { enviadas: fila.length, aceites, recusadas: recusas };
}

/**
 * Traz o que mudou desde o último cursor e escreve-o nas tabelas locais.
 *
 * Os 23 ganchos que os ecrãs usam lêem do IndexedDB e reagem sozinhos: não há
 * um único ecrã que precise de saber que isto aconteceu.
 */
async function receber(testemunho: string): Promise<number> {
  let cursor = (await ler(CURSOR)) ?? '0';
  let total = 0;
  let completo = false;

  while (!completo) {
    const r = await fetch(`${SERVIDOR}/sincronizar/receber?desde=${cursor}`, {
      headers: cabecalhos(testemunho),
    });
    if (!r.ok) throw new RespostaMa(servidorRespondeuMal(r.status));

    const lote = (await r.json()) as RespostaRecepcao;
    if (lote.objectos.length > 0) await guardarLocalmente(lote.objectos);

    total += lote.objectos.length;
    cursor = lote.cursor;
    completo = lote.completo;
    await guardar(CURSOR, cursor);
  }

  return total;
}

/** Em que tabela do Dexie mora cada tipo de objecto. */
const TABELA_DO_TIPO: Record<string, keyof typeof db> = {
  bloco: 'blocos',
  talhao: 'talhoes',
  fonte_agua: 'fontesAgua',
  arvore: 'arvores',
  cultura: 'culturas',
  variedade: 'variedades',
  ciclo_cultura: 'ciclos',
  ordem_trabalho: 'ordens',
  operacao: 'operacoes',
  pesagem_colheita: 'pesagens',
  relatorio_diario: 'relatorios',
  monitorizacao: 'monitorizacoes',
  observacao: 'observacoes',
  trabalhador: 'trabalhadores',
  equipa: 'equipas',
  jorna: 'jornas',
  formacao: 'formacoes',
  pendencia: 'pendencias',
};

async function guardarLocalmente(objectos: ObjectoCanonico[]): Promise<void> {
  const porTabela = new Map<string, ObjectoCanonico[]>();
  for (const o of objectos) {
    const tabela = TABELA_DO_TIPO[o.tipo];
    // Um tipo que o aparelho não conhece vem de uma versão mais nova do
    // servidor. Guardá-lo numa tabela errada seria pior do que o ignorar.
    if (!tabela) continue;
    porTabela.set(tabela, [...(porTabela.get(tabela) ?? []), o]);
  }

  for (const [tabela, lista] of porTabela) {
    await (db[tabela as 'talhoes'] as unknown as {
      bulkPut: (x: unknown[]) => Promise<unknown>;
    }).bulkPut(lista);
  }
}

// ============================================================================
// Entrar
// ============================================================================

export async function entrar(
  utilizador: string,
  palavraPasse: string,
): Promise<{ bem: true } | { bem: false; erro: string }> {
  try {
    const r = await fetch(`${SERVIDOR}/entrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ utilizador, palavraPasse }),
    });
    if (!r.ok) return { bem: false, erro: 'Credenciais não reconhecidas.' };

    const { testemunho } = (await r.json()) as { testemunho: string };
    await guardarTestemunho(testemunho);
    return { bem: true };
  } catch {
    return { bem: false, erro: 'O servidor não respondeu.' };
  }
}
