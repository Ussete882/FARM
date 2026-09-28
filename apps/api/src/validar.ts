/**
 * Validação do lado do servidor.
 *
 * O cliente já validou antes de gravar, offline. O servidor volta a validar, e
 * não por desconfiança do código: por desconfiança do *contexto*. Um telemóvel
 * que esteve uma semana sem rede não sabe que entretanto outra pessoa já
 * entregou o relatório daquele bloco naquele dia, nem quantas horas
 * extraordinárias é que o trabalhador acumulou. Metade das regras do §8 não são
 * sobre o registo, são sobre o registo *contra o que já existe*.
 *
 * As funções chamadas aqui são as mesmas que correm no telemóvel, do mesmo
 * pacote. O que muda é de onde vem o contexto: lá do IndexedDB, aqui do
 * Postgres. As constatações saem iguais, nas três línguas.
 */

import type { ObjectoCanonico } from '@bastet/nucleo/canonico';
import type { Jorna, Trabalhador } from '@bastet/nucleo/pessoas';
import { idade } from '@bastet/nucleo/pessoas';
import type {
  Monitorizacao,
  Observacao,
  Operacao,
  OrdemTrabalho,
  PesagemColheita,
  RelatorioDiario,
} from '@bastet/nucleo/operacoes';
import type { Talhao } from '@bastet/nucleo/territorio';
import {
  resultado,
  validarJorna,
  validarMonitorizacao,
  validarObservacao,
  validarOperacao,
  validarOrdemTrabalho,
  validarPesagem,
  validarRelatorioDiario,
  validarTalhao,
  validarTrabalhador,
  type Resultado,
} from '@bastet/nucleo/validacao';

import { sql } from './bd';
import { deLinha, porCodigo } from './repositorio';

/** O dia é o do servidor. O relógio do telemóvel não é fonte de verdade. */
export const hojeNoServidor = (): string => new Date().toISOString().slice(0, 10);

// ============================================================================
// Contexto: o que só a base sabe
// ============================================================================

/** Quantos registos deste tipo já existem com as mesmas chaves, tirando este. */
async function contarIguais(
  tipo: string,
  codigoExcluido: string,
  campos: Record<string, string>,
): Promise<number> {
  const pares = Object.entries(campos);
  const condicoes = pares.map(([c, v]) => sql`and dados->>${c} = ${v}`);
  const [r] = await sql<{ n: string }[]>`
    select count(*)::text as n from objecto
     where tipo = ${tipo}
       and codigo <> ${codigoExcluido}
       and anulado is null
       ${condicoes.length ? condicoes.reduce((a, b) => sql`${a} ${b}`) : sql``}
  `;
  return Number(r?.n ?? 0);
}

/** Data da ronda de colheita anterior no mesmo talhão. */
async function rondaAnterior(talhao: string, data: string): Promise<string | undefined> {
  const [r] = await sql<{ d: string }[]>`
    select dados->>'data_colheita' as d from objecto
     where tipo = 'pesagem_colheita'
       and dados->>'talhao' = ${talhao}
       and dados->>'data_colheita' < ${data}
       and anulado is null
     order by dados->>'data_colheita' desc
     limit 1
  `;
  return r?.d;
}

/** Horas extraordinárias acumuladas por um trabalhador num intervalo. */
async function horasExtra(trabalhador: string, de: string, ate: string): Promise<number> {
  const [r] = await sql<{ s: string | null }[]>`
    select coalesce(sum((dados#>>'{horas_extraordinarias,valor}')::numeric), 0)::text as s
      from objecto
     where tipo = 'jorna'
       and dados->>'trabalhador' = ${trabalhador}
       and dados->>'data' between ${de} and ${ate}
       and anulado is null
  `;
  return Number(r?.s ?? 0);
}

const inicioDaSemana = (iso: string): string => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};
const inicioDoTrimestre = (iso: string): string => {
  const [a, m] = iso.split('-').map(Number);
  const mes = Math.floor((m - 1) / 3) * 3 + 1;
  return `${a}-${String(mes).padStart(2, '0')}-01`;
};

// ============================================================================
// Despacho por tipo
// ============================================================================

export async function validarNoServidor(o: ObjectoCanonico, hoje: string): Promise<Resultado> {
  switch (o.tipo) {
    case 'trabalhador':
      return validarTrabalhador(o as unknown as Trabalhador, hoje);

    case 'talhao':
      return validarTalhao(o as unknown as Talhao, hoje);

    case 'ordem_trabalho':
      return validarOrdemTrabalho(o as unknown as OrdemTrabalho);

    case 'observacao':
      return validarObservacao(o as unknown as Observacao, hoje);

    case 'relatorio_diario': {
      const r = o as unknown as RelatorioDiario;
      const duplicados = await contarIguais('relatorio_diario', r.codigo, {
        bloco: r.bloco,
        data: r.data,
      });
      return validarRelatorioDiario(r, hoje, { duplicados });
    }

    case 'monitorizacao': {
      const m = o as unknown as Monitorizacao;
      const duplicados = await contarIguais('monitorizacao', m.codigo, {
        talhao: m.talhao,
        data: m.data,
      });
      return validarMonitorizacao(m, { hoje, duplicados });
    }

    case 'pesagem_colheita': {
      const p = o as unknown as PesagemColheita;
      return validarPesagem(p, {
        hoje,
        dataRondaAnterior: await rondaAnterior(p.talhao, p.data_colheita),
      });
    }

    case 'operacao': {
      const op = o as unknown as Operacao;
      const ordem = op.ordem_trabalho ? await porCodigo(op.ordem_trabalho) : undefined;
      return validarOperacao(op, hoje, !!ordem);
    }

    case 'jorna': {
      const j = o as unknown as Jorna;
      const [duplicados, semana, trimestre, ano, pessoa] = await Promise.all([
        contarIguais('jorna', j.codigo, { trabalhador: j.trabalhador, data: j.data }),
        horasExtra(j.trabalhador, inicioDaSemana(j.data), j.data),
        horasExtra(j.trabalhador, inicioDoTrimestre(j.data), j.data),
        horasExtra(j.trabalhador, `${j.data.slice(0, 4)}-01-01`, j.data),
        porCodigo(j.trabalhador),
      ]);
      return validarJorna(j, {
        hoje,
        duplicados,
        horasExtraSemana: semana,
        horasExtraTrimestre: trimestre,
        horasExtraAno: ano,
        idadeTrabalhador: pessoa
          ? idade(pessoa as unknown as Trabalhador, j.data)
          : undefined,
      });
    }

    // Blocos, culturas, variedades, equipas, árvores, ciclos, fontes de água e
    // pendências não têm validação própria no §8: o que há a garantir sobre
    // eles está nas restrições do esquema.
    default:
      return resultado([]);
  }
}

/** Reconstrói um objecto a partir da base, para comparar versões. */
export async function comoEstaNaBase(codigo: string): Promise<ObjectoCanonico | undefined> {
  const [l] = await sql`select * from objecto where codigo = ${codigo}`;
  return l ? deLinha(l as never) : undefined;
}
