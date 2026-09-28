/**
 * BASTET — formatação numérica e de datas, por idioma.
 *
 * O documento escreve «7 072,00 MT» e «107,8 ha»: espaço como separador de
 * milhares, vírgula como separador decimal. `Intl.NumberFormat` não garante nem
 * uma coisa nem outra (o agrupamento só entra a partir de cinco dígitos, e o
 * separador pode variar entre versões do motor), pelo que a formatação é feita
 * aqui e não delegada.
 *
 * Em inglês e em chinês a convenção inverte-se — «7,072.00» — e a data muda de
 * forma por completo: «01/09/2026», «01 Sep 2026», «2026年9月1日». Um número mal
 * lido é um número errado, por isso isto não é decoração.
 *
 * Use `useFmt()` dentro de componentes. Fora de React — no motor de regras —
 * chame `formatador(idioma)` com o idioma explícito, para o motor continuar
 * puro.
 */

import type { Idioma } from '../i18n/nucleo';
import { ROTULO_BASE, SIMBOLO_UNIDADE, type Quantidade } from './canonico';

/**
 * Espaço fino inquebrável (U+202F) — mantém «7 072,00» numa só linha.
 *
 * É um carácter que um editor troca por um espaço normal sem que se veja, e
 * então o número parte a meio no fim de uma linha. O teste em `i18n.test.ts`
 * compara-o byte a byte justamente para apanhar essa troca.
 */
const ESPACO_FINO = ' ';

interface Convencao {
  milhares: string;
  decimal: string;
}

const CONVENCAO: Record<Idioma, Convencao> = {
  pt: { milhares: ESPACO_FINO, decimal: ',' },
  en: { milhares: ',', decimal: '.' },
  zh: { milhares: ',', decimal: '.' },
};

const MESES_CURTOS: Record<Idioma, string[]> = {
  pt: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  zh: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
};

const MESES_LONGOS: Record<Idioma, string[]> = {
  pt: [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ],
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  zh: MESES_CURTOS.zh,
};

const DIAS_SEMANA: Record<Idioma, string[]> = {
  pt: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  zh: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
};

export interface Formatador {
  numero: (valor: number, casas?: number) => string;
  inteiro: (valor: number) => string;
  percentagem: (valor: number | undefined, casas?: number) => string;
  meticais: (valor: number) => string;
  quantidade: (qtd: Quantidade | undefined, casas?: number) => string;
  valorDe: (qtd: Quantidade | undefined, casas?: number) => string;
  unidade: (unidade: Quantidade['unidade']) => string;
  /** A base de medida como se lê: «NIH» fica «NIH», «plantada» traduz-se. */
  base: (base: NonNullable<Quantidade['base']>) => string;
  data: (iso: string | undefined) => string;
  dataCurta: (iso: string | undefined) => string;
  dataExtenso: (iso: string | undefined) => string;
  diaDaSemana: (iso: string) => string;
  distanciaEmDias: (dias: number) => string;
  /** «3 trabalhadores» / «1 trabalhador» — o plural não é o mesmo nas três. */
  contagem: (n: number, singular: string, plural: string) => string;
}

const memoria = new Map<Idioma, Formatador>();

/** O formatador de um idioma. Construído uma vez por idioma. */
export function formatador(idioma: Idioma): Formatador {
  const existente = memoria.get(idioma);
  if (existente) return existente;
  const novo = construir(idioma);
  memoria.set(idioma, novo);
  return novo;
}

function construir(idioma: Idioma): Formatador {
  const { milhares, decimal } = CONVENCAO[idioma];

  const numero = (valor: number, casas = 2): string => {
    if (!Number.isFinite(valor)) return '—';
    const negativo = valor < 0;
    const fixo = Math.abs(valor).toFixed(casas);
    const [inteira, fraccao] = fixo.split('.');
    const agrupada = inteira.replace(/\B(?=(\d{3})+(?!\d))/g, milhares);
    return `${negativo ? '−' : ''}${agrupada}${fraccao ? `${decimal}${fraccao}` : ''}`;
  };

  const inteiro = (valor: number) => numero(valor, 0);

  const percentagem = (valor: number | undefined, casas = 1) =>
    valor === undefined || !Number.isFinite(valor) ? '—' : `${numero(valor, casas)}%`;

  const meticais = (valor: number) => `${numero(valor, 2)}${ESPACO_FINO}MT`;

  const unidade = (u: Quantidade['unidade']) => SIMBOLO_UNIDADE[u]?.[idioma] ?? u;

  /**
   * A base de medida (R3, §5.3) viaja sempre com o número.
   *
   * As formas de produto têm código próprio e imutável — «NIH», «MIO» — e esse
   * lê-se igual em qualquer língua, como «kg». As outras são palavras
   * («plantada», «tara») e traduzem-se.
   */
  const base = (b: NonNullable<Quantidade['base']>) =>
    b === b.toUpperCase() ? b : (ROTULO_BASE[b]?.[idioma] ?? b);

  const quantidade = (qtd: Quantidade | undefined, casas?: number) => {
    if (!qtd) return '—';
    const auto = casas ?? casasPorUnidade(qtd.unidade);
    const sufixo = qtd.base ? `${ESPACO_FINO}${base(qtd.base)}` : '';
    return `${numero(qtd.valor, auto)}${ESPACO_FINO}${unidade(qtd.unidade)}${sufixo}`;
  };

  const valorDe = (qtd: Quantidade | undefined, casas?: number) =>
    qtd ? numero(qtd.valor, casas ?? casasPorUnidade(qtd.unidade)) : '—';

  // --------------------------------------------------------------------------
  // Datas — o registo é sempre AAAA-MM-DD; muda a leitura, não o dado.
  // --------------------------------------------------------------------------

  const partes = (iso: string) => {
    const [a, m, d] = iso.slice(0, 10).split('-');
    return { a, m, d, mi: Number(m) - 1, di: Number(d) };
  };

  const data = (iso: string | undefined) => {
    if (!iso) return '—';
    const { a, m, d, mi } = partes(iso);
    if (idioma === 'zh') return `${a}年${Number(m)}月${Number(d)}日`;
    if (idioma === 'en') return `${d} ${MESES_CURTOS.en[mi]} ${a}`;
    return `${d}/${m}/${a}`;
  };

  const dataCurta = (iso: string | undefined) => {
    if (!iso) return '—';
    const { m, di, mi } = partes(iso);
    if (idioma === 'zh') return `${Number(m)}月${di}日`;
    return `${di}${ESPACO_FINO}${MESES_CURTOS[idioma][mi]}`;
  };

  const dataExtenso = (iso: string | undefined) => {
    if (!iso) return '—';
    const { a, m, di, mi } = partes(iso);
    if (idioma === 'zh') return `${a}年${Number(m)}月${di}日`;
    if (idioma === 'en') return `${di} ${MESES_LONGOS.en[mi]} ${a}`;
    return `${di} de ${MESES_CURTOS.pt[mi]}. de ${a}`;
  };

  const diaDaSemana = (iso: string) =>
    DIAS_SEMANA[idioma][new Date(`${iso.slice(0, 10)}T12:00:00`).getDay()];

  const distanciaEmDias = (dias: number) => {
    if (idioma === 'zh') {
      if (dias === 0) return '今天';
      if (dias === 1) return '明天';
      if (dias === -1) return '昨天';
      return dias > 0 ? `${dias}天后` : `${-dias}天前`;
    }
    if (idioma === 'en') {
      if (dias === 0) return 'today';
      if (dias === 1) return 'tomorrow';
      if (dias === -1) return 'yesterday';
      return dias > 0 ? `in ${dias} days` : `${-dias} days ago`;
    }
    if (dias === 0) return 'hoje';
    if (dias === 1) return 'amanhã';
    if (dias === -1) return 'ontem';
    return dias > 0 ? `em ${dias} dias` : `há ${-dias} dias`;
  };

  // O chinês não flexiona o plural: «3 名工人» e «1 名工人» usam a mesma forma.
  const contagem = (n: number, singular: string, plural: string) =>
    `${inteiro(n)} ${idioma === 'zh' || n === 1 ? singular : plural}`;

  return {
    numero,
    inteiro,
    percentagem,
    meticais,
    quantidade,
    valorDe,
    unidade,
    base,
    data,
    dataCurta,
    dataExtenso,
    diaDaSemana,
    distanciaEmDias,
    contagem,
  };
}

function casasPorUnidade(unidade: string): number {
  switch (unidade) {
    case 'un':
    case 'arvore':
    case 'planta':
    case 'dia':
    case 'min':
      return 0;
    case 'ha':
    case 'kg':
    case 'kg_arvore':
    case 'mm':
    case 't':
    case 't_ha':
    case 'percent':
    case 'h':
      return 1;
    default:
      return 2;
  }
}
