/**
 * BASTET — pendências de parametrização.
 *
 * Divergências e valores por confirmar que o documento — ou, no caso da Farma
 * Alcinda, a resposta do gestor — deixou em aberto. Não são notas de rodapé:
 * enquanto estiverem abertas, os números que delas dependem transportam uma
 * ressalva onde quer que apareçam.
 *
 * Vive no domínio e não na camada de dados porque é uma entidade de gestão,
 * com dono e estado, como qualquer outra. Que esteja numa tabela é detalhe.
 */

import type { T } from '../i18n/nucleo';

export const CATEGORIAS_PENDENCIA = [
  'quadro_pessoal',
  'parametro_legal',
  'meta_tecnica',
  'area_plantada',
  /** Balança, energia, telemóveis: o que a farma não tem para registar. */
  'meios',
  'outro',
] as const;
export type CategoriaPendencia = (typeof CATEGORIAS_PENDENCIA)[number];

export const ESTADOS_PENDENCIA = ['por_resolver', 'em_analise', 'resolvida'] as const;
export type EstadoPendencia = (typeof ESTADOS_PENDENCIA)[number];

export interface Pendencia {
  id: string;
  codigo: string;
  titulo: T;
  descricao: T;
  categoria: CategoriaPendencia;
  /** Onde no documento, ou em que resposta, isto foi assinalado. */
  seccao: string;
  decisaoAssociada?: string;
  estado: EstadoPendencia;
  dono: string;
}
