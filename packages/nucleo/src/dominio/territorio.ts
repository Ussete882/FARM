/**
 * BASTET — domínio Território (§7.1)
 * Entidades E-01 Talhão, E-02 Bloco, E-03 Fonte de água, e a árvore individual.
 */

import type { EstadoTalhao, ObjectoCanonico, Quantidade, Referencia } from './canonico';
import type { CodigoCultura } from './codigos';
import type { T } from '../i18n/nucleo';

// ============================================================================
// E-02. Bloco
// ============================================================================

export interface Bloco extends ObjectoCanonico {
  tipo: 'bloco';
  estado: EstadoTalhao;
  /** Obrigatório em cultura perene. */
  ano_estabelecimento?: number;
  cultura_dominante: CodigoCultura;
  /** Validação: igual à soma dos talhões. */
  area_total_ha: Quantidade;
  /** Técnico encarregado. */
  responsavel: Referencia;
}

// ============================================================================
// E-01. Talhão — unidade mínima de gestão agronómica
// ============================================================================

export const TIPOS_SOLO = [
  'ferralsolo',
  'luvissolo',
  'fluvissolo',
  'arenossolo',
  'vertissolo',
  'outro',
] as const;
export type TipoSolo = (typeof TIPOS_SOLO)[number];

export const SISTEMAS_REGA = ['sequeiro', 'aspersao', 'gota_a_gota', 'tanque_rebocado'] as const;
export type SistemaRega = (typeof SISTEMAS_REGA)[number];

export const ROTULO_SISTEMA_REGA: Record<SistemaRega, T> = {
  sequeiro: { pt: 'Sequeiro', en: 'Rainfed', zh: '雨养' },
  aspersao: { pt: 'Aspersão', en: 'Sprinkler', zh: '喷灌' },
  gota_a_gota: { pt: 'Gota-a-gota', en: 'Drip', zh: '滴灌' },
  tanque_rebocado: { pt: 'Tanque rebocado', en: 'Towed tank', zh: '拖挂水罐' },
};

export interface Vertice {
  lat: number;
  lon: number;
}

export interface Talhao extends ObjectoCanonico {
  tipo: 'talhao';
  estado: EstadoTalhao;
  bloco: Referencia;

  /** Validação: maior que zero. */
  area_bruta_ha: Quantidade;
  /** Validação: menor ou igual à área bruta. */
  area_plantada_ha: Quantidade;
  /** Validação: menor ou igual à área plantada. */
  area_util_ha: Quantidade;

  /** Polígono fechado, coordenadas WGS84. */
  poligono: Vertice[];
  /** Calculado a partir do polígono. */
  perimetro_m?: Quantidade;

  tipo_solo: TipoSolo;
  /** Acima de ~13% dificulta a colheita mecanizada. */
  declive_percent?: Quantidade;

  /** Validação: análise com menos de 24 meses. */
  data_analise_solo?: string;
  /** Alvo para macadâmia: 5,5 a 6,5. */
  ph_agua?: number;
  /** Alvo: 4%. */
  carbono_organico_percent?: number;

  /** Obrigatório se o talhão for regado. */
  fonte_agua?: Referencia;
  sistema_rega: SistemaRega;
  distancia_sede_km?: Quantidade;

  // --- Instalação da cultura (F-01) ---
  cultura?: CodigoCultura;
  variedade?: Referencia;
  ano_plantio?: number;
  /** Compasso em metros, entre linhas × na linha. */
  compasso_m?: { entre_linhas: number; na_linha: number };
  densidade_plantas_ha?: Quantidade;
  numero_linhas?: number;
  total_plantas_estabelecidas?: number;
}

// ============================================================================
// E-03. Ponto ou fonte de água
// ============================================================================

export const TIPOS_FONTE_AGUA = ['bacia', 'furo', 'corrego', 'albufeira', 'rede'] as const;
export type TipoFonteAgua = (typeof TIPOS_FONTE_AGUA)[number];

export const ROTULO_FONTE_AGUA: Record<TipoFonteAgua, T> = {
  bacia: { pt: 'Bacia', en: 'Reservoir', zh: '蓄水池' },
  furo: { pt: 'Furo', en: 'Borehole', zh: '机井' },
  corrego: { pt: 'Córrego', en: 'Stream', zh: '溪流' },
  albufeira: { pt: 'Albufeira', en: 'Dam', zh: '水库' },
  rede: { pt: 'Rede', en: 'Mains', zh: '管网' },
};

export interface FonteAgua extends ObjectoCanonico {
  tipo: 'fonte_agua';
  estado: EstadoTalhao;
  tipo_fonte: TipoFonteAgua;
  capacidade_m3: Quantidade;
  permanente: boolean;
  /** Obrigatório se houver captação licenciada. */
  licenca_uso?: string;
  data_ultima_analise?: string;
}

// ============================================================================
// Árvore individual (F-02) — só para culturas perenes
// ============================================================================

export const ESTADOS_ARVORE = ['viva', 'morta', 'ausente', 'substituida'] as const;
export type EstadoArvore = (typeof ESTADOS_ARVORE)[number];

export const ROTULO_ESTADO_ARVORE: Record<EstadoArvore, T> = {
  viva: { pt: 'Viva', en: 'Alive', zh: '存活' },
  morta: { pt: 'Morta', en: 'Dead', zh: '死亡' },
  ausente: { pt: 'Ausente', en: 'Missing', zh: '缺株' },
  substituida: { pt: 'Substituída', en: 'Replaced', zh: '已补植' },
};

export const VIGORES = ['bom', 'medio', 'fraco', 'em_stress'] as const;
export type Vigor = (typeof VIGORES)[number];

export const ROTULO_VIGOR: Record<Vigor, T> = {
  bom: { pt: 'Bom', en: 'Good', zh: '良好' },
  medio: { pt: 'Médio', en: 'Average', zh: '中等' },
  fraco: { pt: 'Fraco', en: 'Poor', zh: '较差' },
  em_stress: { pt: 'Em stress', en: 'Stressed', zh: '胁迫' },
};

export interface Arvore extends ObjectoCanonico {
  tipo: 'arvore';
  talhao: Referencia;
  linha: number;
  posicao: number;
  variedade?: Referencia;
  ano_plantio?: number;
  estado_arvore: EstadoArvore;
  altura_m?: Quantidade;
  diametro_tronco_cm?: Quantidade;
  vigor?: Vigor;
  sintomas?: string;
  causa_provavel?: string;
  /** Pertence à amostra permanente de 30 árvores (F-15). */
  amostra_permanente: boolean;
  data_observacao?: string;
  observador?: Referencia;
}
