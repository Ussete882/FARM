/**
 * BASTET — anatomia e catálogo de indicadores (§9, §10, Anexo B)
 *
 * §9.2: «Não pode existir indicador sem registo primário que o alimente.»
 * Por isso cada ficha declara os formulários de origem e os campos utilizados
 * — a matriz de rastreio do Anexo B vive dentro do próprio indicador, e o ecrã
 * consegue sempre responder à pergunta «de onde vem este número».
 *
 * O código do indicador («K-PRD-03») é imutável e igual nas três línguas; a
 * designação, a fórmula e a acção são texto de leitura e traduzem-se.
 */

import type { Quantidade, Unidade } from './canonico';
import type { T } from '../i18n/nucleo';

export const FAMILIAS = [
  'PRD',
  'QLD',
  'AGN',
  'FIT',
  'COL',
  'PES',
  'MAQ',
  'PRO',
  'FIN',
  'GOV',
] as const;
export type FamiliaIndicador = (typeof FAMILIAS)[number];

export const FAMILIAS_INDICADOR: Record<FamiliaIndicador, T> = {
  PRD: { pt: 'Produção', en: 'Production', zh: '产量' },
  QLD: { pt: 'Qualidade', en: 'Quality', zh: '质量' },
  AGN: { pt: 'Água e nutrição', en: 'Water and nutrition', zh: '水肥' },
  FIT: { pt: 'Fitossanidade', en: 'Plant health', zh: '植保' },
  COL: { pt: 'Colheita e logística', en: 'Harvest and logistics', zh: '采收与物流' },
  PES: { pt: 'Mão-de-obra e pessoas', en: 'Labour and people', zh: '用工与人员' },
  MAQ: { pt: 'Máquinas e recursos', en: 'Machinery and resources', zh: '机械与资源' },
  PRO: { pt: 'Processamento', en: 'Processing', zh: '加工' },
  FIN: { pt: 'Financeira', en: 'Financial', zh: '财务' },
  GOV: { pt: 'Governação e sistema', en: 'Governance and system', zh: '治理与系统' },
};

export const FREQUENCIAS = [
  'diaria',
  'semanal',
  'mensal',
  'por_lote',
  'por_operacao',
  'por_corte',
  'campanha',
  'anual',
] as const;
export type Frequencia = (typeof FREQUENCIAS)[number];

export const ROTULO_FREQUENCIA: Record<Frequencia, T> = {
  diaria: { pt: 'Diária', en: 'Daily', zh: '每日' },
  semanal: { pt: 'Semanal', en: 'Weekly', zh: '每周' },
  mensal: { pt: 'Mensal', en: 'Monthly', zh: '每月' },
  por_lote: { pt: 'Por lote', en: 'Per batch', zh: '每批' },
  por_operacao: { pt: 'Por operação', en: 'Per operation', zh: '每次作业' },
  por_corte: { pt: 'Por corte', en: 'Per cut', zh: '每次刈割' },
  campanha: { pt: 'Campanha', en: 'Season', zh: '生产季' },
  anual: { pt: 'Anual', en: 'Annual', zh: '每年' },
};

/**
 * Os cargos que respondem por indicadores. Um indicador sem dono não é um
 * indicador — e o dono é uma pessoa, nunca uma equipa (§2.3).
 */
const DONO = {
  agronomo: { pt: 'Agrónomo responsável', en: 'Responsible agronomist', zh: '责任农艺师' },
  gestor: { pt: 'Gestor da Farma', en: 'Farm Manager', zh: '农场经理' },
  tecnico: { pt: 'Técnico encarregado', en: 'Field supervisor', zh: '现场技术主管' },
  chefeTurma: { pt: 'Chefe de turma', en: 'Shift leader', zh: '班组长' },
  rh: { pt: 'Director de Recursos Humanos', en: 'HR Director', zh: '人力资源总监' },
} satisfies Record<string, T>;

/** Sentido da meta. Sem isto, o semáforo não sabe para que lado é melhor. */
export type Sentido = 'maior_melhor' | 'menor_melhor';

/**
 * Ficha de indicador (§9.1). Todos os campos existem porque o documento os
 * exige; um indicador sem meta, sem dono ou sem limiar não é um indicador.
 */
export interface FichaIndicador {
  codigo: string;
  familia: FamiliaIndicador;
  designacao: T;
  formula: T;
  unidade: Unidade;
  frequencia: Frequencia;
  /** A pessoa que responde pelo valor — aqui, o cargo. */
  dono: T;
  sentido: Sentido;
  /** Meta proposta. `undefined` = a estabelecer na primeira campanha. */
  meta?: number;
  /** Limiar de alerta: entre a meta e este valor, o semáforo é âmbar. */
  limiar_alerta?: number;
  metaTexto: T;
  /** Situação de partida medida, quando existe. */
  valor_base?: number;
  /** Anexo B — nenhum indicador existe sem registo primário. */
  formularios_origem: string[];
  campos_utilizados: T;
  /** Acção automática quando o valor entra em vermelho (§9.1). */
  accao_vermelho?: T;
  /** Alimentado pelos registos da Fase 1? */
  fase1: boolean;
}

// ============================================================================
// Catálogo — famílias alimentadas pela Fase 1 (§10.1, §10.5, §10.6, §10.10)
// ============================================================================

export const CATALOGO_INDICADORES: FichaIndicador[] = [
  // --- Família Produção (PRD) ---------------------------------------------
  {
    codigo: 'K-PRD-01',
    familia: 'PRD',
    designacao: { pt: 'Rendimento por árvore', en: 'Yield per tree', zh: '单株产量' },
    formula: {
      pt: 'kg NIS total ÷ número de árvores produtivas, apurado no inventário anual; enquanto esse inventário não existir, usa-se o total de árvores plantadas e o facto é declarado',
      en: 'total kg NIS ÷ number of bearing trees from the annual inventory; until that inventory exists, the total of planted trees is used and the fact is declared',
      zh: '带壳干果总公斤数 ÷ 年度盘点所得结果树数量；在盘点完成之前，使用种植总株数并加以声明',
    },
    unidade: 'kg_arvore',
    frequencia: 'campanha',
    dono: DONO.agronomo,
    sentido: 'maior_melhor',
    meta: 6.0,
    limiar_alerta: 4.8,
    metaTexto: {
      pt: 'Ano 8: 6,0 · Ano 10: 10,0 · Ano 12 a 15: 12 a 13',
      en: 'Year 8: 6.0 · Year 10: 10.0 · Years 12 to 15: 12 to 13',
      zh: '第 8 年：6.0 · 第 10 年：10.0 · 第 12 至 15 年：12 至 13',
    },
    valor_base: 0.649,
    formularios_origem: ['F-07', 'F-15'],
    campos_utilizados: {
      pt: 'Peso líquido, talhão, número de árvores produtivas',
      en: 'Net weight, plot, number of bearing trees',
      zh: '净重、地块、结果树数量',
    },
    fase1: true,
  },
  {
    codigo: 'K-PRD-02',
    familia: 'PRD',
    designacao: { pt: 'Rendimento por hectare', en: 'Yield per hectare', zh: '单位面积产量' },
    formula: {
      pt: 'toneladas ÷ hectares plantados',
      en: 'tonnes ÷ planted hectares',
      zh: '吨数 ÷ 种植公顷数',
    },
    unidade: 't_ha',
    frequencia: 'campanha',
    dono: DONO.agronomo,
    sentido: 'maior_melhor',
    meta: 0.6,
    limiar_alerta: 0.48,
    metaTexto: {
      pt: 'Ano 8 a 100 árv./ha: 0,60 t/ha',
      en: 'Year 8 at 100 trees/ha: 0.60 t/ha',
      zh: '第 8 年、每公顷 100 株：0.60 吨/公顷',
    },
    valor_base: 0.065,
    formularios_origem: ['F-07', 'F-15'],
    campos_utilizados: {
      pt: 'Peso líquido, talhão, área plantada',
      en: 'Net weight, plot, planted area',
      zh: '净重、地块、种植面积',
    },
    fase1: true,
  },
  {
    codigo: 'K-PRD-03',
    familia: 'PRD',
    designacao: {
      pt: 'Taxa de realização do potencial',
      en: 'Potential realisation rate',
      zh: '潜力实现率',
    },
    formula: {
      pt: 'K-PRD-01 real ÷ K-PRD-01 esperado por idade × 100',
      en: 'actual K-PRD-01 ÷ K-PRD-01 expected for age × 100',
      zh: '实际 K-PRD-01 ÷ 按树龄应有的 K-PRD-01 × 100',
    },
    unidade: 'percent',
    frequencia: 'campanha',
    dono: DONO.agronomo,
    sentido: 'maior_melhor',
    meta: 80,
    limiar_alerta: 60,
    metaTexto: {
      pt: 'Igual ou superior a 80%',
      en: 'At or above 80%',
      zh: '不低于 80%',
    },
    valor_base: 24.9,
    formularios_origem: ['F-07', 'F-02'],
    campos_utilizados: {
      pt: 'Produção real, idade do ciclo, contagem de árvores',
      en: 'Actual production, cycle age, tree count',
      zh: '实际产量、生长周期树龄、树木计数',
    },
    accao_vermelho: {
      pt: 'Análise de causa por talhão e acção com dono e prazo na revisão do período',
      en: 'Per-plot root-cause analysis and an action with owner and deadline at the period review',
      zh: '按地块进行原因分析，并在本期复盘时确定责任人与期限',
    },
    fase1: true,
  },
  {
    codigo: 'K-PRD-04',
    familia: 'PRD',
    designacao: { pt: 'Défice de rendimento', en: 'Yield gap', zh: '产量缺口' },
    formula: { pt: '100 − K-PRD-03', en: '100 − K-PRD-03', zh: '100 − K-PRD-03' },
    unidade: 'percent',
    frequencia: 'campanha',
    dono: DONO.agronomo,
    sentido: 'menor_melhor',
    meta: 20,
    limiar_alerta: 40,
    metaTexto: { pt: 'Igual ou inferior a 20%', en: 'At or below 20%', zh: '不高于 20%' },
    valor_base: 75.1,
    formularios_origem: ['F-07', 'F-02'],
    campos_utilizados: {
      pt: 'Produção real, idade do ciclo, contagem de árvores',
      en: 'Actual production, cycle age, tree count',
      zh: '实际产量、生长周期树龄、树木计数',
    },
    fase1: true,
  },
  {
    codigo: 'K-PRD-05',
    familia: 'PRD',
    designacao: {
      pt: 'Taxa de árvores produtivas',
      en: 'Bearing-tree rate',
      zh: '结果树比例',
    },
    formula: {
      pt: 'árvores vivas e em produção ÷ árvores plantadas × 100',
      en: 'living, bearing trees ÷ planted trees × 100',
      zh: '存活且结果的树 ÷ 种植株数 × 100',
    },
    unidade: 'percent',
    frequencia: 'anual',
    dono: DONO.agronomo,
    sentido: 'maior_melhor',
    meta: 97,
    limiar_alerta: 92,
    metaTexto: { pt: 'Igual ou superior a 97%', en: 'At or above 97%', zh: '不低于 97%' },
    formularios_origem: ['F-02'],
    campos_utilizados: { pt: 'Estado da árvore', en: 'Tree status', zh: '树木状态' },
    fase1: true,
  },
  {
    codigo: 'K-PRD-11',
    familia: 'PRD',
    designacao: {
      pt: 'Cumprimento do plano de campanha',
      en: 'Season plan compliance',
      zh: '生产季计划完成率',
    },
    formula: {
      pt: 'área efectivamente semeada ou plantada ÷ área planeada × 100',
      en: 'area actually sown or planted ÷ planned area × 100',
      zh: '实际播种或种植面积 ÷ 计划面积 × 100',
    },
    unidade: 'percent',
    frequencia: 'campanha',
    dono: DONO.gestor,
    sentido: 'maior_melhor',
    meta: 95,
    limiar_alerta: 85,
    metaTexto: { pt: 'Igual ou superior a 95%', en: 'At or above 95%', zh: '不低于 95%' },
    formularios_origem: ['F-05', 'E-10'],
    campos_utilizados: {
      pt: 'Data prevista e data real, área planeada e realizada',
      en: 'Planned and actual dates, planned and actual area',
      zh: '计划与实际日期、计划与实际面积',
    },
    fase1: true,
  },
  {
    codigo: 'K-PRD-12',
    familia: 'PRD',
    designacao: { pt: 'Desvio de calendário', en: 'Schedule deviation', zh: '进度偏差' },
    formula: {
      pt: 'dias entre data planeada e data real da operação crítica',
      en: 'days between planned and actual date of the critical operation',
      zh: '关键作业的计划日期与实际日期相差天数',
    },
    unidade: 'dia',
    frequencia: 'por_operacao',
    dono: DONO.tecnico,
    sentido: 'menor_melhor',
    meta: 7,
    limiar_alerta: 14,
    metaTexto: {
      pt: 'Igual ou inferior a 7 dias',
      en: 'At or below 7 days',
      zh: '不超过 7 天',
    },
    formularios_origem: ['F-05', 'E-10'],
    campos_utilizados: {
      pt: 'Data prevista e data real',
      en: 'Planned and actual dates',
      zh: '计划日期与实际日期',
    },
    fase1: true,
  },

  // --- Família Colheita e logística (COL) ---------------------------------
  {
    codigo: 'K-COL-01',
    familia: 'COL',
    designacao: { pt: 'Intervalo entre rondas', en: 'Interval between rounds', zh: '采收轮次间隔' },
    formula: {
      pt: 'dias entre passagens no mesmo talhão',
      en: 'days between passes over the same plot',
      zh: '同一地块两次作业之间的天数',
    },
    unidade: 'dia',
    frequencia: 'por_operacao',
    dono: DONO.tecnico,
    sentido: 'menor_melhor',
    meta: 14,
    limiar_alerta: 21,
    metaTexto: { pt: '7 a 14 dias', en: '7 to 14 days', zh: '7 至 14 天' },
    formularios_origem: ['F-07'],
    campos_utilizados: { pt: 'Datas de ronda', en: 'Round dates', zh: '各轮次日期' },
    fase1: true,
  },
  {
    codigo: 'K-COL-02',
    familia: 'COL',
    designacao: {
      pt: 'Prazo entre apanha e descasque',
      en: 'Time from picking to dehusking',
      zh: '采摘至脱皮时限',
    },
    formula: {
      pt: 'horas entre a apanha e a entrada no descascador',
      en: 'hours between picking and entry into the dehusker',
      zh: '采摘至进入脱皮机的小时数',
    },
    unidade: 'h',
    frequencia: 'por_operacao',
    dono: DONO.tecnico,
    sentido: 'menor_melhor',
    meta: 24,
    limiar_alerta: 36,
    metaTexto: {
      pt: 'Igual ou inferior a 24 horas',
      en: 'At or below 24 hours',
      zh: '不超过 24 小时',
    },
    formularios_origem: ['F-07'],
    campos_utilizados: {
      pt: 'Hora de pesagem, hora de saída para processamento',
      en: 'Weighing time, time sent to processing',
      zh: '称重时间、送加工时间',
    },
    accao_vermelho: {
      pt: 'Alerta ao técnico encarregado e ao responsável de processamento',
      en: 'Alert to the field supervisor and the processing manager',
      zh: '通知现场技术主管与加工负责人',
    },
    fase1: true,
  },
  {
    codigo: 'K-COL-04',
    familia: 'COL',
    designacao: {
      pt: 'Taxa de rejeição em triagem de campo',
      en: 'Field-sorting rejection rate',
      zh: '田间分选剔除率',
    },
    formula: {
      pt: 'peso rejeitado ÷ peso apanhado × 100',
      en: 'rejected weight ÷ picked weight × 100',
      zh: '剔除重量 ÷ 采摘重量 × 100',
    },
    unidade: 'percent',
    frequencia: 'por_operacao',
    dono: DONO.chefeTurma,
    sentido: 'menor_melhor',
    meta: 6,
    limiar_alerta: 10,
    metaTexto: { pt: 'Igual ou inferior a 6%', en: 'At or below 6%', zh: '不高于 6%' },
    formularios_origem: ['F-07'],
    campos_utilizados: {
      pt: 'Peso rejeitado, peso apanhado',
      en: 'Rejected weight, picked weight',
      zh: '剔除重量、采摘重量',
    },
    fase1: true,
  },
  {
    codigo: 'K-COL-05',
    familia: 'COL',
    designacao: { pt: 'Produtividade da apanha', en: 'Picking productivity', zh: '采摘生产率' },
    formula: {
      pt: 'kg apanhados ÷ pessoas-dia',
      en: 'kg picked ÷ worker-days',
      zh: '采摘公斤数 ÷ 工日',
    },
    unidade: 'kg',
    frequencia: 'diaria',
    dono: DONO.chefeTurma,
    sentido: 'maior_melhor',
    metaTexto: {
      pt: 'Sem referência publicada; estabelecer padrão interno na primeira campanha',
      en: 'No published reference; set an internal baseline in the first season',
      zh: '尚无公开基准；在首个生产季建立内部标准',
    },
    formularios_origem: ['F-06', 'F-07'],
    campos_utilizados: {
      pt: 'Produção individual e pessoas-dia',
      en: 'Individual output and worker-days',
      zh: '个人产量与工日',
    },
    fase1: true,
  },
  {
    codigo: 'K-COL-06',
    familia: 'COL',
    designacao: { pt: 'Rondas por campanha', en: 'Rounds per season', zh: '每季采收轮次' },
    formula: { pt: 'contagem por talhão', en: 'count per plot', zh: '按地块计数' },
    unidade: 'un',
    frequencia: 'campanha',
    dono: DONO.tecnico,
    sentido: 'maior_melhor',
    meta: 8,
    limiar_alerta: 6,
    metaTexto: {
      pt: 'Igual ou superior a 8, coerente com K-COL-01',
      en: 'At or above 8, consistent with K-COL-01',
      zh: '不少于 8 次，与 K-COL-01 一致',
    },
    formularios_origem: ['F-07'],
    campos_utilizados: {
      pt: 'Contagem de rondas por talhão',
      en: 'Round count per plot',
      zh: '各地块轮次计数',
    },
    fase1: true,
  },
  {
    codigo: 'K-COL-08',
    familia: 'COL',
    designacao: { pt: 'Densidade de mão-de-obra', en: 'Labour density', zh: '用工密度' },
    formula: {
      pt: 'equivalentes a tempo inteiro ÷ hectare',
      en: 'full-time equivalents ÷ hectare',
      zh: '全职当量 ÷ 公顷',
    },
    unidade: 'un',
    frequencia: 'mensal',
    dono: DONO.gestor,
    sentido: 'menor_melhor',
    meta: 0.53,
    limiar_alerta: 0.8,
    metaTexto: {
      pt: 'Referência sul-africana: 0,53 ETI/ha',
      en: 'South African reference: 0.53 FTE/ha',
      zh: '南非基准：0.53 全职当量/公顷',
    },
    formularios_origem: ['F-06', 'F-01'],
    campos_utilizados: {
      pt: 'Pessoas-dia acumuladas e área do talhão',
      en: 'Accumulated worker-days and plot area',
      zh: '累计工日与地块面积',
    },
    fase1: true,
  },

  // --- Família Mão-de-obra e pessoas (PES) --------------------------------
  {
    codigo: 'K-PES-01',
    familia: 'PES',
    designacao: {
      pt: 'Custo de mão-de-obra por hectare',
      en: 'Labour cost per hectare',
      zh: '每公顷用工成本',
    },
    formula: {
      pt: 'custo total de jornas ÷ hectares',
      en: 'total worker-day cost ÷ hectares',
      zh: '工日总成本 ÷ 公顷数',
    },
    unidade: 'MT',
    frequencia: 'mensal',
    dono: DONO.gestor,
    sentido: 'menor_melhor',
    metaTexto: {
      pt: 'Contra orçamento da carta tecnológica',
      en: 'Against the crop budget',
      zh: '对照技术方案预算',
    },
    formularios_origem: ['F-06'],
    campos_utilizados: {
      pt: 'Jornas, custo, presenças',
      en: 'Worker-days, cost, attendance',
      zh: '工日、成本、出勤',
    },
    fase1: true,
  },
  {
    codigo: 'K-PES-02',
    familia: 'PES',
    designacao: {
      pt: 'Custo de mão-de-obra por quilograma',
      en: 'Labour cost per kilogram',
      zh: '每公斤用工成本',
    },
    formula: {
      pt: 'custo total de jornas ÷ kg produzidos',
      en: 'total worker-day cost ÷ kg produced',
      zh: '工日总成本 ÷ 产出公斤数',
    },
    unidade: 'MT',
    frequencia: 'mensal',
    dono: DONO.gestor,
    sentido: 'menor_melhor',
    metaTexto: { pt: 'Descendente', en: 'Downward', zh: '逐期下降' },
    formularios_origem: ['F-06', 'F-07'],
    campos_utilizados: {
      pt: 'Jornas, custo, produção',
      en: 'Worker-days, cost, output',
      zh: '工日、成本、产量',
    },
    fase1: true,
  },
  {
    codigo: 'K-PES-03',
    familia: 'PES',
    designacao: { pt: 'Assiduidade', en: 'Attendance', zh: '出勤率' },
    formula: {
      pt: 'dias presentes ÷ dias planeados × 100',
      en: 'days present ÷ days planned × 100',
      zh: '出勤天数 ÷ 计划天数 × 100',
    },
    unidade: 'percent',
    frequencia: 'diaria',
    dono: DONO.chefeTurma,
    sentido: 'maior_melhor',
    meta: 95,
    limiar_alerta: 90,
    metaTexto: { pt: 'Igual ou superior a 95%', en: 'At or above 95%', zh: '不低于 95%' },
    formularios_origem: ['F-06'],
    campos_utilizados: { pt: 'Presenças', en: 'Attendance', zh: '出勤记录' },
    fase1: true,
  },
  {
    codigo: 'K-PES-09',
    familia: 'PES',
    designacao: { pt: 'Cobertura de INSS', en: 'Social security coverage', zh: '社保覆盖率' },
    formula: {
      pt: 'trabalhadores inscritos ÷ trabalhadores activos × 100',
      en: 'registered workers ÷ active workers × 100',
      zh: '已参保工人 ÷ 在职工人 × 100',
    },
    unidade: 'percent',
    frequencia: 'mensal',
    dono: DONO.rh,
    sentido: 'maior_melhor',
    meta: 100,
    limiar_alerta: 100,
    metaTexto: { pt: '100%', en: '100%', zh: '100%' },
    formularios_origem: ['F-03'],
    campos_utilizados: {
      pt: 'Número de beneficiário e data de inscrição no INSS',
      en: 'INSS beneficiary number and registration date',
      zh: '社保参保编号与参保日期',
    },
    fase1: true,
  },
  {
    codigo: 'K-PES-10',
    familia: 'PES',
    designacao: {
      pt: 'Cobertura de seguro de acidentes',
      en: 'Accident insurance coverage',
      zh: '工伤保险覆盖率',
    },
    formula: {
      pt: 'trabalhadores cobertos ÷ total × 100',
      en: 'covered workers ÷ total × 100',
      zh: '已投保工人 ÷ 总人数 × 100',
    },
    unidade: 'percent',
    frequencia: 'mensal',
    dono: DONO.rh,
    sentido: 'maior_melhor',
    meta: 100,
    limiar_alerta: 100,
    metaTexto: {
      pt: '100%, incluindo sazonais',
      en: '100%, seasonal workers included',
      zh: '100%，含季节工',
    },
    formularios_origem: ['F-03'],
    campos_utilizados: {
      pt: 'Apólice de acidentes de trabalho',
      en: 'Workplace accident policy',
      zh: '工伤保险保单',
    },
    fase1: true,
  },
  {
    codigo: 'K-PES-14',
    familia: 'PES',
    designacao: {
      pt: 'Cumprimento de horas extraordinárias',
      en: 'Overtime compliance',
      zh: '加班合规率',
    },
    formula: {
      pt: 'trabalhadores dentro dos limites legais ÷ total × 100',
      en: 'workers within legal limits ÷ total × 100',
      zh: '在法定限额内的工人 ÷ 总人数 × 100',
    },
    unidade: 'percent',
    frequencia: 'mensal',
    dono: DONO.rh,
    sentido: 'maior_melhor',
    meta: 100,
    limiar_alerta: 100,
    metaTexto: { pt: '100%', en: '100%', zh: '100%' },
    formularios_origem: ['F-06'],
    campos_utilizados: {
      pt: 'Acumuladores de horas extraordinárias',
      en: 'Overtime accumulators',
      zh: '加班累计值',
    },
    fase1: true,
  },

  // --- Família Governação e sistema (GOV) ---------------------------------
  {
    codigo: 'K-GOV-01',
    familia: 'GOV',
    designacao: {
      pt: 'Taxa de cumprimento de registo',
      en: 'Record compliance rate',
      zh: '记录完成率',
    },
    formula: {
      pt: 'registos obrigatórios entregues no prazo ÷ registos devidos × 100',
      en: 'mandatory records submitted on time ÷ records due × 100',
      zh: '按时提交的必报记录 ÷ 应报记录 × 100',
    },
    unidade: 'percent',
    frequencia: 'semanal',
    dono: DONO.gestor,
    sentido: 'maior_melhor',
    meta: 98,
    limiar_alerta: 90,
    metaTexto: { pt: 'Igual ou superior a 98%', en: 'At or above 98%', zh: '不低于 98%' },
    formularios_origem: ['F-05', 'F-06', 'F-07'],
    campos_utilizados: {
      pt: 'Data de entrega face à data devida',
      en: 'Submission date against due date',
      zh: '提交日期与应报日期对比',
    },
    accao_vermelho: {
      pt: 'Critério de saída da Fase 1 em risco: escalonamento ao nível superior e acção obrigatória',
      en: 'Phase 1 exit criterion at risk: escalate to the level above, with a mandatory action',
      zh: '第一阶段验收标准面临风险：上报上级并须采取措施',
    },
    fase1: true,
  },
  {
    codigo: 'K-GOV-02',
    familia: 'GOV',
    designacao: { pt: 'Completude de registo', en: 'Record completeness', zh: '记录完整率' },
    formula: {
      pt: 'registos sem campo obrigatório em falta ÷ total × 100',
      en: 'records with no mandatory field missing ÷ total × 100',
      zh: '无必填项缺失的记录 ÷ 总数 × 100',
    },
    unidade: 'percent',
    frequencia: 'semanal',
    dono: DONO.gestor,
    sentido: 'maior_melhor',
    meta: 100,
    limiar_alerta: 98,
    metaTexto: { pt: '100%', en: '100%', zh: '100%' },
    formularios_origem: ['F-05', 'F-06', 'F-07'],
    campos_utilizados: {
      pt: 'Regra dos cinco campos (§5.1)',
      en: 'The five-field rule (§5.1)',
      zh: '五要素规则（§5.1）',
    },
    fase1: true,
  },
];

export const INDICADOR_POR_CODIGO = new Map(CATALOGO_INDICADORES.map((i) => [i.codigo, i]));

// ============================================================================
// Medição
// ============================================================================

export interface Medicao {
  id: string;
  indicador: string;
  /** Período a que a medição respeita (ISO AAAA-MM-DD, início do período). */
  periodo: string;
  valor: Quantidade;
  /** Objecto a que a medição se refere: talhão, equipa, bloco, farma. */
  ambito: string;
  ambitoTipo: 'farma' | 'bloco' | 'talhao' | 'equipa' | 'trabalhador';
  calculado_em: string;
  /** Registos primários que originaram o valor (§5.4 — rastreio de proveniência). */
  proveniencia: string[];
}

// ============================================================================
// Curva de referência de produção da macadâmia (§17.3)
// Base do indicador K-PRD-03. Piso conservador, não tecto — a curva de origem
// foi construída para 312 árvores/ha; a densidade baixa da Farma Alcinda deve
// permitir um desempenho por árvore superior, hipótese ainda por validar.
// ============================================================================

export const CURVA_MACADAMIA: { ano: number; kg_arvore: number }[] = [
  { ano: 1, kg_arvore: 0 },
  { ano: 2, kg_arvore: 0 },
  { ano: 3, kg_arvore: 0 },
  { ano: 4, kg_arvore: 0 },
  { ano: 5, kg_arvore: 1 },
  { ano: 6, kg_arvore: 2 },
  { ano: 7, kg_arvore: 4 },
  { ano: 8, kg_arvore: 6 },
  { ano: 9, kg_arvore: 9 },
  { ano: 10, kg_arvore: 10 },
  { ano: 11, kg_arvore: 11 },
  { ano: 12, kg_arvore: 12 },
  { ano: 13, kg_arvore: 12.5 },
  { ano: 14, kg_arvore: 13 },
  { ano: 15, kg_arvore: 13 },
];

/** kg por árvore esperados à idade indicada. Acima de 15 anos mantém o patamar. */
export function esperadoPorIdade(anos: number): number {
  if (anos < 1) return 0;
  const linha = CURVA_MACADAMIA.find((c) => c.ano === Math.floor(anos));
  return linha ? linha.kg_arvore : CURVA_MACADAMIA[CURVA_MACADAMIA.length - 1].kg_arvore;
}

export const FONTE_CURVA: T = {
  pt: 'Queensland DPI — a referência mais conservadora disponível',
  en: 'Queensland DPI — the most conservative reference available',
  zh: '昆士兰州初级产业部（DPI）——现有最保守的基准',
};
