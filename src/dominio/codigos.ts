/**
 * BASTET — codificação e nomenclatura (§6)
 *
 * §6.1: «Um código é imutável, legível, ordenável e verificável. Nunca contém
 * acentos, espaços nem caracteres especiais. É gerado pelo sistema, nunca
 * escrito à mão.»
 */

// ============================================================================
// Abreviaturas (§6.3)
// ============================================================================

/**
 * As três letras são o código e não mudam de língua; o nome da cultura muda.
 * É a mesma regra do R4 aplicada ao vocabulário: identifica-se pelo código,
 * lê-se pelo nome.
 */
import type { T } from '../i18n/nucleo';

export const CULTURAS = {
  MAC: { pt: 'Macadâmia', en: 'Macadamia', zh: '澳洲坚果' },
  MOR: { pt: 'Moringa', en: 'Moringa', zh: '辣木' },
  MIL: { pt: 'Milho', en: 'Maize', zh: '玉米' },
  GER: { pt: 'Gergelim', en: 'Sesame', zh: '芝麻' },
  FEV: { pt: 'Feijão vulgar', en: 'Common bean', zh: '菜豆' },
  BAT: { pt: 'Batata reno', en: 'Potato', zh: '马铃薯' },
  TOM: { pt: 'Tomate', en: 'Tomato', zh: '番茄' },
} satisfies Record<string, T>;
export type CodigoCultura = keyof typeof CULTURAS;

export const FORMAS_PRODUTO = {
  NIH: { pt: 'Noz com casca verde', en: 'Nut-in-husk', zh: '带青皮果' },
  NIS: { pt: 'Noz em casca, seca', en: 'Nut-in-shell, dry', zh: '带壳干果' },
  MIO: { pt: 'Miolo', en: 'Kernel', zh: '果仁' },
  FFR: { pt: 'Folha fresca destalada', en: 'Fresh destemmed leaf', zh: '去梗鲜叶' },
  FSC: { pt: 'Folha seca', en: 'Dry leaf', zh: '干叶' },
  POF: { pt: 'Pó de folha peneirado', en: 'Sifted leaf powder', zh: '过筛叶粉' },
  SEM: { pt: 'Semente', en: 'Seed', zh: '种子' },
  GRA: { pt: 'Grão', en: 'Grain', zh: '谷粒' },
} satisfies Record<string, T>;
export type CodigoForma = keyof typeof FORMAS_PRODUTO;

// ============================================================================
// Esquema de códigos (§6.2)
// ============================================================================

export const PADRAO = {
  projecto: /^PRJ-[A-Z]{2}$/,
  unidade: /^[A-Z]{2}$/,
  bloco: /^[A-Z]{2}-B\d{2}$/,
  talhao: /^[A-Z]{2}-B\d{2}-T\d{2}$/,
  arvore: /^[A-Z]{2}-B\d{2}-T\d{2}-L\d{3}-P\d{3}$/,
  cultura: /^CUL-[A-Z]{3}$/,
  variedade: /^VAR-[A-Z]{3}-[A-Z0-9]{1,4}$/,
  cicloCultura: /^CC-\d{4}-[A-Z]{3}-[A-Z]{2}-B\d{2}-T\d{2}$/,
  ordemTrabalho: /^OT-\d{4}-\d{5}$/,
  operacao: /^OP-\d{4}-\d{6}$/,
  trabalhador: /^TR-\d{5}$/,
  contrato: /^CT-\d{4}-\d{4}$/,
  jorna: /^JR-\d{8}-TR\d{5}$/,
  maquina: /^MQ-\d{3}$/,
  implemento: /^IM-\d{3}$/,
  fonteAgua: /^[A-Z]{2}-FA-\d{2}$/,
  loteCampo: /^[A-Z]{3}-[A-Z]{3}-\d{8}-B\d{2}-\d{3}$/,
  indicador: /^K-[A-Z]{3}-\d{2}$/,
  naoConformidade: /^NC-\d{4}-\d{4}$/,
  pesagem: /^PS-\d{8}-\d{3}$/,
  relatorioDiario: /^RD-\d{8}-[A-Z]{2}-B\d{2}$/,
  monitorizacao: /^MF-\d{8}-[A-Z]{2}-B\d{2}-T\d{2}$/,
  observacao: /^OB-\d{4}-\d{5}$/,
} as const;

export type TipoCodigo = keyof typeof PADRAO;

export function codigoValido(tipo: TipoCodigo, codigo: string): boolean {
  return PADRAO[tipo].test(codigo);
}

/** Lança se o código não respeitar o padrão. Usado na criação de objectos. */
export function exigirCodigo(tipo: TipoCodigo, codigo: string): string {
  if (!codigoValido(tipo, codigo)) {
    throw new Error(
      `Código inválido para ${tipo}: "${codigo}". Padrão exigido: ${PADRAO[tipo].source}`,
    );
  }
  return codigo;
}

// ============================================================================
// Geradores
// ============================================================================

const pad = (n: number, casas: number) => String(n).padStart(casas, '0');

/** AAAAMMDD a partir de uma data ISO (AAAA-MM-DD) ou de um Date. */
export function aaaammdd(data: string | Date): string {
  const iso = typeof data === 'string' ? data : data.toISOString().slice(0, 10);
  return iso.slice(0, 10).replace(/-/g, '');
}

export const codigo = {
  projecto: (unidade: string) => `PRJ-${unidade}`,
  bloco: (unidade: string, n: number) => `${unidade}-B${pad(n, 2)}`,
  talhao: (bloco: string, n: number) => `${bloco}-T${pad(n, 2)}`,
  arvore: (talhao: string, linha: number, posicao: number) =>
    `${talhao}-L${pad(linha, 3)}-P${pad(posicao, 3)}`,
  cultura: (c: CodigoCultura) => `CUL-${c}`,
  variedade: (c: CodigoCultura, sufixo: string) => `VAR-${c}-${sufixo.toUpperCase()}`,
  cicloCultura: (ano: number, cultura: CodigoCultura, talhao: string) =>
    `CC-${ano}-${cultura}-${talhao}`,
  ordemTrabalho: (ano: number, n: number) => `OT-${ano}-${pad(n, 5)}`,
  operacao: (ano: number, n: number) => `OP-${ano}-${pad(n, 6)}`,
  trabalhador: (n: number) => `TR-${pad(n, 5)}`,
  contrato: (ano: number, n: number) => `CT-${ano}-${pad(n, 4)}`,
  // O padrão do documento é JR-AAAAMMDD-TRnnnnn: o hífen do código do
  // trabalhador não é transportado.
  jorna: (data: string, trabalhador: string) =>
    `JR-${aaaammdd(data)}-${trabalhador.replace('-', '')}`,
  maquina: (n: number) => `MQ-${pad(n, 3)}`,
  implemento: (n: number) => `IM-${pad(n, 3)}`,
  fonteAgua: (unidade: string, n: number) => `${unidade}-FA-${pad(n, 2)}`,
  loteCampo: (cultura: CodigoCultura, forma: CodigoForma, data: string, bloco: string, n: number) =>
    `${cultura}-${forma}-${aaaammdd(data)}-${bloco.split('-')[1]}-${pad(n, 3)}`,
  indicador: (familia: string, n: number) => `K-${familia}-${pad(n, 2)}`,
  naoConformidade: (ano: number, n: number) => `NC-${ano}-${pad(n, 4)}`,
  pesagem: (data: string, n: number) => `PS-${aaaammdd(data)}-${pad(n, 3)}`,
  relatorioDiario: (data: string, bloco: string) => `RD-${aaaammdd(data)}-${bloco}`,
  monitorizacao: (data: string, talhao: string) => `MF-${aaaammdd(data)}-${talhao}`,
  observacao: (ano: number, n: number) => `OB-${ano}-${pad(n, 5)}`,
};

// ============================================================================
// Leitura de códigos — o código é ordenável e verificável, logo também
// decomponível. Percorrer o grafo (§2.2) começa por aqui.
// ============================================================================

export function blocoDoTalhao(talhao: string): string {
  const p = talhao.split('-');
  return `${p[0]}-${p[1]}`;
}

export function talhaoDaArvore(arvore: string): string {
  return arvore.split('-').slice(0, 3).join('-');
}

export function talhaoDoCiclo(ciclo: string): string {
  return ciclo.split('-').slice(3).join('-');
}

export function culturaDoCiclo(ciclo: string): CodigoCultura {
  return ciclo.split('-')[2] as CodigoCultura;
}

export function familiaDoIndicador(k: string): string {
  return k.split('-')[1];
}
