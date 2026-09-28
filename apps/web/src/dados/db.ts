/**
 * BASTET — persistência local (IndexedDB via Dexie).
 *
 * A Fase 1 corre sem servidor: os registos vivem no dispositivo, o que é
 * coerente com o §25 («funcionamento sem ligação permanente»). O modelo é o
 * canónico, pelo que a passagem a Postgres na fase seguinte é uma troca de
 * repositório e não uma reescrita.
 *
 * Regra que atravessa todas as tabelas: nada é apagado (§24.5). Não existe
 * `delete` neste ficheiro — a correcção passa por `anularESubstituir`.
 */

import Dexie, { type EntityTable } from 'dexie';

import type { CicloCultura, Cultura, Variedade } from '@bastet/nucleo/biologico';
import type { Medicao } from '@bastet/nucleo/indicadores';
import type {
  Monitorizacao,
  Observacao,
  Operacao,
  OrdemTrabalho,
  PesagemColheita,
  RelatorioDiario,
} from '@bastet/nucleo/operacoes';
import type { Equipa, Formacao, Jorna, Trabalhador } from '@bastet/nucleo/pessoas';
import type { Arvore, Bloco, FonteAgua, Talhao } from '@bastet/nucleo/territorio';

/** Divergência ou parâmetro por resolver, assinalado pelo documento. */
import type { Pendencia } from '@bastet/nucleo/governacao';
import type { EntradaSaida } from '@bastet/nucleo/sincronizacao';
import type { Constatacao } from '@bastet/nucleo/validacao';

export type { Pendencia };

export class BastetDB extends Dexie {
  // --- M1. Cadastro territorial e agronómico ---
  blocos!: EntityTable<Bloco, 'id'>;
  talhoes!: EntityTable<Talhao, 'id'>;
  fontesAgua!: EntityTable<FonteAgua, 'id'>;
  arvores!: EntityTable<Arvore, 'id'>;
  culturas!: EntityTable<Cultura, 'id'>;
  variedades!: EntityTable<Variedade, 'id'>;
  ciclos!: EntityTable<CicloCultura, 'id'>;

  // --- M2. Operações de campo ---
  ordens!: EntityTable<OrdemTrabalho, 'id'>;
  operacoes!: EntityTable<Operacao, 'id'>;
  pesagens!: EntityTable<PesagemColheita, 'id'>;
  relatorios!: EntityTable<RelatorioDiario, 'id'>;
  monitorizacoes!: EntityTable<Monitorizacao, 'id'>;
  observacoes!: EntityTable<Observacao, 'id'>;

  // --- M3. Pessoas e assiduidade ---
  trabalhadores!: EntityTable<Trabalhador, 'id'>;
  equipas!: EntityTable<Equipa, 'id'>;
  jornas!: EntityTable<Jorna, 'id'>;
  formacoes!: EntityTable<Formacao, 'id'>;

  // --- Medição e governação ---
  medicoes!: EntityTable<Medicao, 'id'>;
  pendencias!: EntityTable<Pendencia, 'id'>;

  // --- Sincronização (§25) ---
  saida!: EntityTable<NaSaida, 'id'>;
  estado!: EntityTable<Estado, 'chave'>;

  constructor() {
    super('bastet');
    this.version(1).stores({
      blocos: 'id, &codigo, estado, cultura_dominante',
      talhoes: 'id, &codigo, bloco, estado, cultura',
      fontesAgua: 'id, &codigo, tipo_fonte',
      arvores: 'id, &codigo, talhao, estado_arvore, amostra_permanente',
      culturas: 'id, &codigo, abreviatura',
      variedades: 'id, &codigo, cultura',
      ciclos: 'id, &codigo, talhao, cultura, campanha, estado',

      ordens: 'id, &codigo, talhao, estado, data_prevista, tipo_operacao, equipa_prevista',
      operacoes: 'id, &codigo, ordem_trabalho, talhao, data_real, responsavel',
      pesagens: 'id, &codigo, talhao, ciclo_cultura, data_colheita, equipa, ronda_numero',
      relatorios: 'id, &codigo, data, bloco, chefe_turma, estado',
      monitorizacoes: 'id, &codigo, talhao, data, decisao',
      observacoes: 'id, &codigo, talhao, data, gravidade',

      trabalhadores: 'id, &codigo, estado, equipa, modalidade, categoria_profissional',
      equipas: 'id, &codigo, chefe_turma',
      jornas: 'id, &codigo, trabalhador, data, equipa, talhao, presenca',
      formacoes: 'id, &codigo, data, tema',

      medicoes: 'id, indicador, periodo, ambito, [indicador+periodo]',
      pendencias: 'id, &codigo, categoria, estado',
    });

    // A caixa de saída chega na versão 2. As tabelas anteriores não mudam:
    // quem já tem a base no telemóvel não perde nada ao actualizar.
    this.version(2).stores({
      saida: '++id, estadoEnvio, criada',
      estado: 'chave',
    });
  }
}

/**
 * Uma escrita à espera de sair do aparelho.
 *
 * Fica aqui desde que o utilizador grava até o servidor a aceitar. Entre as
 * duas coisas pode passar uma semana — é o que acontece quando o registo se
 * faz no campo e a rede está na estrada.
 */
export interface NaSaida extends EntradaSaida {
  estadoEnvio: 'pendente' | 'aceite' | 'recusada';
  criada: string;
  /** Preenchidos quando o servidor recusa. */
  motivo?: string;
  detalhe?: string;
  constatacoes?: Constatacao[];
  /** No conflito: o que o servidor tem, para se poder decidir (§24.5). */
  actual?: unknown;
}

/** Pares chave-valor do aparelho: cursor, testemunho, último contacto. */
export interface Estado {
  chave: string;
  valor: string;
}

export const db = new BastetDB();

/** Todas as tabelas, para semear e para diagnosticar. */
export const TABELAS = [
  'blocos',
  'talhoes',
  'fontesAgua',
  'arvores',
  'culturas',
  'variedades',
  'ciclos',
  'ordens',
  'operacoes',
  'pesagens',
  'relatorios',
  'monitorizacoes',
  'observacoes',
  'trabalhadores',
  'equipas',
  'jornas',
  'formacoes',
  'medicoes',
  'pendencias',
  'saida',
  'estado',
] as const;

export type NomeTabela = (typeof TABELAS)[number];
