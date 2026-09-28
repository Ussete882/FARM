/**
 * BASTET — domínio Biológico (§7.2)
 * E-05 Cultura, E-06 Variedade, E-07 Ciclo de cultura.
 */

import type { EstadoOperacao, ObjectoCanonico, Quantidade, Referencia } from './canonico';
import type { CodigoCultura, CodigoForma } from './codigos';
import type { T } from '../i18n/nucleo';

// ============================================================================
// E-05. Cultura
// ============================================================================

export const CICLOS_CULTURA = ['perene', 'anual', 'bianual'] as const;
export type CicloVida = (typeof CICLOS_CULTURA)[number];

export const AMBITOS_CERTIFICACAO = [
  'fruta_horticolas',
  'culturas_combinaveis',
  'nao_aplicavel',
] as const;
export type AmbitoCertificacao = (typeof AMBITOS_CERTIFICACAO)[number];

export const ROTULO_CICLO_VIDA: Record<CicloVida, T> = {
  anual: { pt: 'Anual', en: 'Annual', zh: '一年生' },
  bianual: { pt: 'Bianual', en: 'Biennial', zh: '二年生' },
  perene: { pt: 'Perene', en: 'Perennial', zh: '多年生' },
};

export const ROTULO_AMBITO: Record<AmbitoCertificacao, T> = {
  fruta_horticolas: { pt: 'Fruta e hortícolas', en: 'Fruit and vegetables', zh: '水果与蔬菜' },
  culturas_combinaveis: { pt: 'Culturas combináveis', en: 'Combinable crops', zh: '大田作物' },
  nao_aplicavel: { pt: 'Não aplicável', en: 'Not applicable', zh: '不适用' },
};

export interface Cultura extends ObjectoCanonico {
  tipo: 'cultura';
  abreviatura: CodigoCultura;
  nome_comum: string;
  /** Exigido no certificado fitossanitário de exportação. */
  nome_botanico: string;
  ciclo: CicloVida;
  ambito_certificacao: AmbitoCertificacao;
  unidade_produto_principal: CodigoForma;
  /** Necessário para calcular a eficiência do uso do azoto. */
  teor_n_produto_percent?: number;
}

// ============================================================================
// E-06. Variedade
// ============================================================================

export const ORIGENS_MATERIAL = ['enxertado', 'semente', 'estaca', 'muda_viveiro'] as const;
export type OrigemMaterial = (typeof ORIGENS_MATERIAL)[number];

export const ROTULO_ORIGEM: Record<OrigemMaterial, T> = {
  enxertado: { pt: 'Enxertado', en: 'Grafted', zh: '嫁接' },
  semente: { pt: 'Semente', en: 'Seed', zh: '实生' },
  estaca: { pt: 'Estaca', en: 'Cutting', zh: '扦插' },
  muda_viveiro: { pt: 'Muda de viveiro', en: 'Nursery seedling', zh: '苗圃苗' },
};

export interface Variedade extends ObjectoCanonico {
  tipo: 'variedade';
  cultura: Referencia;
  origem_material: OrigemMaterial;
  /** Enxertado 3 a 4 anos; semente 6 a 7 anos. */
  entrada_producao_anos?: number;
  /** Relevante em macadâmia: a Beaumont não larga a noz espontaneamente. */
  queda_espontanea?: boolean;
  observacoes_maneio?: string;
}

// ============================================================================
// E-07. Ciclo de cultura
// «Esta é a entidade central do domínio agronómico. Tudo o que acontece no
// campo pendura-se aqui.»
// ============================================================================

export interface CicloCultura extends ObjectoCanonico {
  tipo: 'ciclo_cultura';
  estado: EstadoOperacao;
  talhao: Referencia;
  cultura: Referencia;
  variedade?: Referencia;
  /** Formato AAAA/AAAA. */
  campanha: string;
  data_plantio: string;

  /** Macadâmia 10×10 m = 100; moringa 4×2 m = 1 250. */
  densidade_plantas_ha: Quantidade;
  /** Contagem física, não estimativa. */
  plantas_estabelecidas: number;
  plantas_vivas_ultima_contagem: number;
  /** Pelo menos anual. */
  data_ultima_contagem: string;

  area_plantada_ha: Quantidade;
  /** Preenchido na colheita; pode ser inferior à plantada. */
  area_colhida_ha?: Quantidade;

  /** Da curva por idade ou do plano de campanha. */
  producao_prevista: Quantidade;
  /** Soma das colheitas — derivado, nunca introduzido à mão. */
  producao_real?: Quantidade;

  /** Atributo do ciclo, não da farma. */
  ambito_certificacao: AmbitoCertificacao;
}

/** Idade em anos, calculada — nunca armazenada. */
export function idadeAnos(ciclo: Pick<CicloCultura, 'data_plantio'>, referencia: string): number {
  const plantio = new Date(ciclo.data_plantio);
  const ref = new Date(referencia);
  let anos = ref.getFullYear() - plantio.getFullYear();
  const m = ref.getMonth() - plantio.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < plantio.getDate())) anos--;
  return Math.max(0, anos);
}
