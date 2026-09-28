/**
 * BASTET — parâmetros legais e técnicos versionados (§19.2)
 *
 * «Nenhum destes valores pode ser escrito no código do sistema. Todos mudam
 * por diploma, e alguns com efeito retroactivo.»
 *
 * Logo, este ficheiro não define constantes: define uma *tabela versionada*
 * com data de efeito e estado de confirmação. O motor de regras consulta-a
 * sempre com uma data. Um parâmetro `a_confirmar` continua a ser aplicado —
 * mas o sistema declara-o em vez de o esconder.
 */

import type { T } from '../i18n/nucleo';

export type EstadoParametro = 'confirmado' | 'a_confirmar';

export interface ValorParametro {
  valor: number;
  /** Data a partir da qual o valor produz efeito (ISO AAAA-MM-DD). */
  data_efeito: string;
  estado: EstadoParametro;
  fonte: T;
  observacao?: T;
}

export interface Parametro {
  codigo: string;
  designacao: T;
  /** Unidade como se lê, não como se calcula: «h/dia», «MT/mês», «dias». */
  unidade: T;
  /** Série histórica, da mais recente para a mais antiga. */
  serie: ValorParametro[];
}

/** As fontes citadas repetem-se; ficam aqui uma vez. */
const FONTE = {
  trabalho: { pt: 'Lei do Trabalho', en: 'Labour Law', zh: '《劳动法》' },
  inss: {
    pt: 'Regime de segurança social obrigatória',
    en: 'Compulsory social security regime',
    zh: '强制性社会保障制度',
  },
  irps: { pt: 'Código do IRPS', en: 'Personal Income Tax Code', zh: '个人所得税法' },
  e01: { pt: 'BASTET §7.1 E-01', en: 'BASTET §7.1 E-01', zh: 'BASTET §7.1 E-01' },
  s244: { pt: 'BASTET §24.4', en: 'BASTET §24.4', zh: 'BASTET §24.4' },
  col02: { pt: 'BASTET K-COL-02', en: 'BASTET K-COL-02', zh: 'BASTET K-COL-02' },
} satisfies Record<string, T>;

/** Unidades de leitura dos parâmetros. */
const U = {
  pct: { pt: '%', en: '%', zh: '%' },
  mtMes: { pt: 'MT/mês', en: 'MT/month', zh: 'MT/月' },
  hDia: { pt: 'h/dia', en: 'h/day', zh: '小时/天' },
  hSemana: { pt: 'h/semana', en: 'h/week', zh: '小时/周' },
  hTrimestre: { pt: 'h/trimestre', en: 'h/quarter', zh: '小时/季度' },
  hAno: { pt: 'h/ano', en: 'h/year', zh: '小时/年' },
  anos: { pt: 'anos', en: 'years', zh: '岁' },
  dias: { pt: 'dias', en: 'days', zh: '天' },
  min: { pt: 'min', en: 'min', zh: '分钟' },
  meses: { pt: 'meses', en: 'months', zh: '个月' },
  h: { pt: 'h', en: 'h', zh: '小时' },
  percevejos: {
    pt: 'percevejos/árvore',
    en: 'stink bugs/tree',
    zh: '蝙蠣头/棵',
  },
} satisfies Record<string, T>;

export const PARAMETROS: Parametro[] = [
  {
    codigo: 'INSS-TRAB',
    designacao: { pt: 'Contribuição INSS, trabalhador', en: 'INSS contribution, employee', zh: '社保缴费，员工' },
    unidade: U.pct,
    serie: [{ valor: 3, data_efeito: '2023-01-01', estado: 'confirmado', fonte: FONTE.inss }],
  },
  {
    codigo: 'INSS-EMP',
    designacao: { pt: 'Contribuição INSS, entidade empregadora', en: 'INSS contribution, employer', zh: '社保缴费，雇主' },
    unidade: U.pct,
    serie: [{ valor: 4, data_efeito: '2023-01-01', estado: 'confirmado', fonte: FONTE.inss }],
  },
  {
    codigo: 'IRPS-ISENCAO',
    designacao: { pt: 'Limite de isenção de IRPS', en: 'Personal income tax exemption threshold', zh: '个人所得税免征额' },
    unidade: U.mtMes,
    serie: [
      {
        valor: 20249.99,
        data_efeito: '2026-01-01',
        estado: 'a_confirmar',
        fonte: FONTE.irps,
        observacao: { pt: 'A tabela varia com o número de dependentes.', en: 'The scale varies with the number of dependants.', zh: '税率表随赡养人口数量而变。' },
      },
    ],
  },
  {
    codigo: 'HORAS-DIA',
    designacao: { pt: 'Período normal de trabalho, diário', en: 'Normal working time, daily', zh: '正常工作时间，每日' },
    unidade: U.hDia,
    serie: [{ valor: 8, data_efeito: '2023-01-01', estado: 'confirmado', fonte: FONTE.trabalho }],
  },
  {
    codigo: 'HORAS-SEMANA',
    designacao: { pt: 'Período normal de trabalho, semanal', en: 'Normal working time, weekly', zh: '正常工作时间，每周' },
    unidade: U.hSemana,
    serie: [
      {
        valor: 48,
        data_efeito: '2023-01-01',
        estado: 'confirmado',
        fonte: FONTE.trabalho,
        observacao: { pt: 'Até 56 horas por instrumento colectivo.', en: 'Up to 56 hours by collective agreement.', zh: '经集体协议最多可至 56 小时。' },
      },
    ],
  },
  {
    codigo: 'HEXT-SEMANA',
    designacao: { pt: 'Limite de horas extraordinárias, semanal', en: 'Overtime limit, weekly', zh: '加班上限，每周' },
    unidade: U.hSemana,
    serie: [{ valor: 8, data_efeito: '2023-01-01', estado: 'a_confirmar', fonte: FONTE.trabalho }],
  },
  {
    codigo: 'HEXT-TRIMESTRE',
    designacao: { pt: 'Limite de horas extraordinárias, trimestral', en: 'Overtime limit, quarterly', zh: '加班上限，每季度' },
    unidade: U.hTrimestre,
    serie: [{ valor: 96, data_efeito: '2023-01-01', estado: 'a_confirmar', fonte: FONTE.trabalho }],
  },
  {
    codigo: 'HEXT-ANO',
    designacao: { pt: 'Limite de horas extraordinárias, anual', en: 'Overtime limit, annual', zh: '加班上限，每年' },
    unidade: U.hAno,
    serie: [{ valor: 200, data_efeito: '2023-01-01', estado: 'a_confirmar', fonte: FONTE.trabalho }],
  },
  {
    codigo: 'IDADE-MIN',
    designacao: { pt: 'Idade mínima de admissão', en: 'Minimum age for admission', zh: '最低录用年龄' },
    unidade: U.anos,
    serie: [
      {
        valor: 18,
        data_efeito: '2023-01-01',
        estado: 'confirmado',
        fonte: FONTE.trabalho,
        observacao: { pt: 'Ou 15 com autorização do representante legal; menores: máx. 5 h/dia e 25 h/semana.', en: 'Or 15 with legal guardian authorisation; minors: max. 5 h/day and 25 h/week.', zh: '经法定代理人授权可为 15 岁；未成年人每日最多 5 小时、每周 25 小时。' },
      },
    ],
  },
  {
    codigo: 'IDADE-MIN-AUTORIZADA',
    designacao: { pt: 'Idade mínima com autorização do representante legal', en: 'Minimum age with legal guardian authorisation', zh: '经法定代理人授权的最低年龄' },
    unidade: U.anos,
    serie: [{ valor: 15, data_efeito: '2023-01-01', estado: 'confirmado', fonte: FONTE.trabalho }],
  },
  {
    codigo: 'MENOR-HORAS-DIA',
    designacao: { pt: 'Limite diário para menores', en: 'Daily limit for minors', zh: '未成年人每日上限' },
    unidade: U.hDia,
    serie: [{ valor: 5, data_efeito: '2023-01-01', estado: 'confirmado', fonte: FONTE.trabalho }],
  },
  {
    codigo: 'MENOR-HORAS-SEMANA',
    designacao: { pt: 'Limite semanal para menores', en: 'Weekly limit for minors', zh: '未成年人每周上限' },
    unidade: U.hSemana,
    serie: [{ valor: 25, data_efeito: '2023-01-01', estado: 'confirmado', fonte: FONTE.trabalho }],
  },
  {
    codigo: 'FERIAS-1ANO',
    designacao: { pt: 'Férias no primeiro ano', en: 'Leave in the first year', zh: '首年年休' },
    unidade: U.dias,
    serie: [{ valor: 12, data_efeito: '2023-01-01', estado: 'confirmado', fonte: FONTE.trabalho }],
  },
  {
    codigo: 'FERIAS-SEGUINTES',
    designacao: { pt: 'Férias a partir do segundo ano', en: 'Leave from the second year on', zh: '第二年起年休' },
    unidade: U.dias,
    serie: [
      {
        valor: 30,
        data_efeito: '2023-01-01',
        estado: 'confirmado',
        fonte: FONTE.trabalho,
        observacao: { pt: 'Regra nova; um motor baseado no regime antigo produz resultados errados.', en: 'New rule; an engine built on the old regime produces wrong results.', zh: '新规定；按旧制度搭建的引擎会得出错误结果。' },
      },
    ],
  },
  {
    codigo: 'INSS-PRAZO-INSCRICAO',
    designacao: { pt: 'Prazo de inscrição de trabalhador no INSS', en: 'Deadline to register a worker with INSS', zh: '员工社保参保期限' },
    unidade: U.dias,
    serie: [
      {
        valor: 30,
        data_efeito: '2023-01-01',
        estado: 'a_confirmar',
        fonte: FONTE.inss,
        observacao: { pt: 'Entre 15 e 30 dias, consoante a fonte. Alerta do sistema ao 10.º dia.', en: 'Between 15 and 30 days, depending on the source. The system alerts on day 10.', zh: '根据来源不同，为 15 至 30 天。系统在第 10 天提醒。' },
      },
    ],
  },
  {
    codigo: 'INTERVALO-MIN',
    designacao: { pt: 'Intervalo de descanso, mínimo', en: 'Rest break, minimum', zh: '休息时间，最短' },
    unidade: U.min,
    serie: [{ valor: 30, data_efeito: '2023-01-01', estado: 'confirmado', fonte: FONTE.trabalho }],
  },
  {
    codigo: 'INTERVALO-MAX',
    designacao: { pt: 'Intervalo de descanso, máximo', en: 'Rest break, maximum', zh: '休息时间，最长' },
    unidade: U.min,
    serie: [{ valor: 120, data_efeito: '2023-01-01', estado: 'confirmado', fonte: FONTE.trabalho }],
  },
  {
    codigo: 'ANALISE-SOLO-VALIDADE',
    designacao: { pt: 'Validade da análise de solo', en: 'Soil analysis validity', zh: '土壤检测有效期' },
    unidade: U.meses,
    serie: [{ valor: 24, data_efeito: '2026-01-01', estado: 'confirmado', fonte: FONTE.e01 }],
  },
  {
    codigo: 'MAC-LIMIAR-PERCEVEJO',
    designacao: { pt: 'Limiar de acção, percevejos na macadâmia', en: 'Action threshold, stink bugs on macadamia', zh: '防治阈值，澳洲坚果蝙蠣' },
    unidade: U.percevejos,
    serie: [
      {
        valor: 0.4,
        data_efeito: '2026-01-01',
        estado: 'a_confirmar',
        fonte: FONTE.s244,
        observacao: { pt: 'A ratificar pelo agrónomo responsável antes de entrar em vigor.', en: 'To be ratified by the responsible agronomist before taking effect.', zh: '生效前需经责任农艺师批准。' },
      },
    ],
  },
  {
    codigo: 'COL-PRAZO-PROCESSAMENTO',
    designacao: { pt: 'Prazo entre colheita e entrada em processamento', en: 'Time from harvest to entry into processing', zh: '采收至进厂时限' },
    unidade: U.h,
    serie: [{ valor: 24, data_efeito: '2026-01-01', estado: 'confirmado', fonte: FONTE.col02 }],
  },
];

export const PARAMETRO_POR_CODIGO = new Map(PARAMETROS.map((p) => [p.codigo, p]));

/**
 * Valor em vigor numa data. Devolve `undefined` se nenhum valor tinha ainda
 * produzido efeito — o que é uma resposta legítima, e não um zero.
 */
export function parametroEm(codigo: string, data: string): ValorParametro | undefined {
  const p = PARAMETRO_POR_CODIGO.get(codigo);
  if (!p) return undefined;
  return p.serie
    .filter((v) => v.data_efeito <= data)
    .sort((a, b) => (a.data_efeito < b.data_efeito ? 1 : -1))[0];
}

/** Atalho para o valor numérico. Lança se o parâmetro não existir na data. */
export function valorEm(codigo: string, data: string): number {
  const v = parametroEm(codigo, data);
  if (!v) throw new Error(`Parâmetro ${codigo} sem valor em vigor a ${data}.`);
  // O erro fica em português: é um defeito de configuração, lido por quem mantém
  // a tabela, e nunca chega a um ecrã.
  return v.valor;
}

/** Parâmetros ainda por confirmar à data — alimentam o registo de pendências. */
export function parametrosPorConfirmar(data: string): { parametro: Parametro; valor: ValorParametro }[] {
  return PARAMETROS.map((parametro) => ({ parametro, valor: parametroEm(parametro.codigo, data) }))
    .filter((x): x is { parametro: Parametro; valor: ValorParametro } => !!x.valor)
    .filter((x) => x.valor.estado === 'a_confirmar');
}

/** Feriados nacionais — configuráveis ano a ano (§19.2). */
export const FERIADOS_NACIONAIS_MMDD = [
  '01-01',
  '02-03',
  '04-07',
  '05-01',
  '06-25',
  '09-07',
  '09-25',
  '10-04',
  '12-25',
];

export function eFeriado(data: string): boolean {
  return FERIADOS_NACIONAIS_MMDD.includes(data.slice(5, 10));
}
