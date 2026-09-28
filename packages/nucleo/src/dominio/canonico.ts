/**
 * BASTET — objectos canónicos de gestão (§2.3, §2.4, §5.3, §5.5)
 *
 * Todos os objectos do sistema partilham o mesmo esqueleto. É isto que permite
 * que o mesmo motor de auditoria, de pesquisa e de histórico sirva o sistema
 * inteiro — e é o que faz o BASTET parecer um sistema, e não uma colecção de
 * ecrãs diferentes.
 *
 * Os rótulos deste ficheiro são trilingues (`T`). O que está gravado é sempre o
 * código — `activo`, `kg`, `NIH` — e é esse que viaja para o servidor e para o
 * histórico. Traduzir a apresentação nunca toca no dado.
 */

import type { T } from '../i18n/nucleo';

// ============================================================================
// Estados canónicos (§2.4)
// Um único vocabulário de estados atravessa todo o sistema. Nenhum módulo
// inventa o seu.
// ============================================================================

export const ESTADOS_OPERACAO = ['planeado', 'em_curso', 'concluido', 'abandonado'] as const;
export type EstadoOperacao = (typeof ESTADOS_OPERACAO)[number];

export const ESTADOS_OBJECTIVO = [
  'proposto',
  'aprovado',
  'em_curso',
  'atingido',
  'nao_atingido',
  'cancelado',
] as const;
export type EstadoObjectivo = (typeof ESTADOS_OBJECTIVO)[number];

export const ESTADOS_DECISAO = [
  'submetida',
  'em_analise',
  'aprovada',
  'rejeitada',
  'implementada',
  'revista',
] as const;
export type EstadoDecisao = (typeof ESTADOS_DECISAO)[number];

export const ESTADOS_RISCO = [
  'identificado',
  'avaliado',
  'em_mitigacao',
  'monitorizado',
  'encerrado',
  'materializado',
] as const;
export type EstadoRisco = (typeof ESTADOS_RISCO)[number];

export const ESTADOS_NAO_CONFORMIDADE = [
  'aberta',
  'em_analise',
  'accao_definida',
  'verificada',
  'encerrada',
] as const;
export type EstadoNaoConformidade = (typeof ESTADOS_NAO_CONFORMIDADE)[number];

export const ESTADOS_LOTE = [
  'em_formacao',
  'fechado',
  'em_analise',
  'aprovado',
  'bloqueado',
  'expedido',
  'rejeitado',
  'destruido',
] as const;
export type EstadoLote = (typeof ESTADOS_LOTE)[number];

export const ESTADOS_TRABALHADOR = [
  'candidato',
  'periodo_probatorio',
  'activo',
  'suspenso',
  'cessado',
] as const;
export type EstadoTrabalhador = (typeof ESTADOS_TRABALHADOR)[number];

export const ESTADOS_DOCUMENTO = [
  'rascunho',
  'em_revisao',
  'aprovado',
  'em_vigor',
  'substituido',
  'revogado',
] as const;
export type EstadoDocumento = (typeof ESTADOS_DOCUMENTO)[number];

/** Estado de talhão (E-01). */
export const ESTADOS_TALHAO = ['activo', 'em_preparacao', 'em_pousio', 'abandonado'] as const;
export type EstadoTalhao = (typeof ESTADOS_TALHAO)[number];

export type Estado =
  | EstadoOperacao
  | EstadoObjectivo
  | EstadoDecisao
  | EstadoRisco
  | EstadoNaoConformidade
  | EstadoLote
  | EstadoTrabalhador
  | EstadoDocumento
  | EstadoTalhao;

/**
 * Rótulos legíveis. O código é imutável; a apresentação não é o código — e é
 * por isso que traduzir o rótulo não mexe em nada do que está gravado.
 */
export const ROTULO_ESTADO: Record<string, T> = {
  planeado: { pt: 'Planeado', en: 'Planned', zh: '已计划' },
  em_curso: { pt: 'Em curso', en: 'In progress', zh: '进行中' },
  concluido: { pt: 'Concluído', en: 'Completed', zh: '已完成' },
  abandonado: { pt: 'Abandonado', en: 'Abandoned', zh: '已放弃' },
  proposto: { pt: 'Proposto', en: 'Proposed', zh: '已提出' },
  aprovado: { pt: 'Aprovado', en: 'Approved', zh: '已批准' },
  atingido: { pt: 'Atingido', en: 'Achieved', zh: '已达成' },
  nao_atingido: { pt: 'Não atingido', en: 'Not achieved', zh: '未达成' },
  cancelado: { pt: 'Cancelado', en: 'Cancelled', zh: '已取消' },
  submetida: { pt: 'Submetida', en: 'Submitted', zh: '已提交' },
  em_analise: { pt: 'Em análise', en: 'Under review', zh: '审核中' },
  aprovada: { pt: 'Aprovada', en: 'Approved', zh: '已批准' },
  rejeitada: { pt: 'Rejeitada', en: 'Rejected', zh: '已驳回' },
  implementada: { pt: 'Implementada', en: 'Implemented', zh: '已执行' },
  revista: { pt: 'Revista', en: 'Revised', zh: '已复核' },
  identificado: { pt: 'Identificado', en: 'Identified', zh: '已识别' },
  avaliado: { pt: 'Avaliado', en: 'Assessed', zh: '已评估' },
  em_mitigacao: { pt: 'Em mitigação', en: 'Being mitigated', zh: '缓解中' },
  monitorizado: { pt: 'Monitorizado', en: 'Monitored', zh: '监控中' },
  encerrado: { pt: 'Encerrado', en: 'Closed', zh: '已关闭' },
  materializado: { pt: 'Materializado', en: 'Materialised', zh: '已发生' },
  aberta: { pt: 'Aberta', en: 'Open', zh: '待处理' },
  accao_definida: { pt: 'Acção definida', en: 'Action defined', zh: '措施已定' },
  verificada: { pt: 'Verificada', en: 'Verified', zh: '已验证' },
  encerrada: { pt: 'Encerrada', en: 'Closed', zh: '已关闭' },
  em_formacao: { pt: 'Em formação', en: 'Being formed', zh: '组批中' },
  fechado: { pt: 'Fechado', en: 'Closed', zh: '已封批' },
  bloqueado: { pt: 'Bloqueado', en: 'Blocked', zh: '已冻结' },
  expedido: { pt: 'Expedido', en: 'Dispatched', zh: '已发运' },
  rejeitado: { pt: 'Rejeitado', en: 'Rejected', zh: '已拒收' },
  destruido: { pt: 'Destruído', en: 'Destroyed', zh: '已销毁' },
  candidato: { pt: 'Candidato', en: 'Candidate', zh: '应聘者' },
  periodo_probatorio: { pt: 'Período probatório', en: 'Probation', zh: '试用期' },
  activo: { pt: 'Activo', en: 'Active', zh: '在职' },
  suspenso: { pt: 'Suspenso', en: 'Suspended', zh: '停职' },
  cessado: { pt: 'Cessado', en: 'Terminated', zh: '已离职' },
  rascunho: { pt: 'Rascunho', en: 'Draft', zh: '草稿' },
  em_revisao: { pt: 'Em revisão', en: 'Under revision', zh: '修订中' },
  em_vigor: { pt: 'Em vigor', en: 'In force', zh: '生效中' },
  substituido: { pt: 'Substituído', en: 'Superseded', zh: '已替换' },
  revogado: { pt: 'Revogado', en: 'Revoked', zh: '已废止' },
  em_preparacao: { pt: 'Em preparação', en: 'Being prepared', zh: '整备中' },
  em_pousio: { pt: 'Em pousio', en: 'Fallow', zh: '休耕' },
};

// ============================================================================
// R3 — Unidades e bases de medida (§5.3)
// «Nunca se regista um número solto.» 8% de humidade em noz e 8% em miolo são
// coisas diferentes. O tipo impede escrever a segunda como a primeira.
// ============================================================================

export const UNIDADES = [
  'kg',
  't',
  'g',
  'ha',
  'm',
  'cm',
  'km',
  'm2',
  'm3',
  'mm',
  'L',
  'un',
  'arvore',
  'planta',
  'h',
  'min',
  'dia',
  'jorna',
  'hora_maquina',
  'percent',
  'MT',
  'kg_ha',
  'kg_arvore',
  't_ha',
  'graus_c',
] as const;
export type Unidade = (typeof UNIDADES)[number];

/**
 * O símbolo da unidade. As do SI são iguais nas três línguas — «kg» é «kg» em
 * qualquer parte, e mudá-lo seria um erro. As que são palavras abreviadas
 * («árv.», «jornas») traduzem-se.
 */
export const SIMBOLO_UNIDADE: Record<Unidade, T> = {
  kg: { pt: 'kg', en: 'kg', zh: 'kg' },
  t: { pt: 't', en: 't', zh: 't' },
  g: { pt: 'g', en: 'g', zh: 'g' },
  ha: { pt: 'ha', en: 'ha', zh: '公顷' },
  m: { pt: 'm', en: 'm', zh: 'm' },
  cm: { pt: 'cm', en: 'cm', zh: 'cm' },
  km: { pt: 'km', en: 'km', zh: 'km' },
  m2: { pt: 'm²', en: 'm²', zh: 'm²' },
  m3: { pt: 'm³', en: 'm³', zh: 'm³' },
  mm: { pt: 'mm', en: 'mm', zh: 'mm' },
  L: { pt: 'L', en: 'L', zh: 'L' },
  un: { pt: 'un', en: 'un', zh: '件' },
  arvore: { pt: 'árv.', en: 'trees', zh: '棵' },
  planta: { pt: 'plantas', en: 'plants', zh: '株' },
  h: { pt: 'h', en: 'h', zh: '小时' },
  min: { pt: 'min', en: 'min', zh: '分钟' },
  dia: { pt: 'dias', en: 'days', zh: '天' },
  jorna: { pt: 'jornas', en: 'worker-days', zh: '工日' },
  hora_maquina: { pt: 'h-máq.', en: 'mach-h', zh: '机时' },
  percent: { pt: '%', en: '%', zh: '%' },
  MT: { pt: 'MT', en: 'MT', zh: 'MT' },
  kg_ha: { pt: 'kg/ha', en: 'kg/ha', zh: 'kg/公顷' },
  kg_arvore: { pt: 'kg/árv.', en: 'kg/tree', zh: 'kg/棵' },
  t_ha: { pt: 't/ha', en: 't/ha', zh: 't/公顷' },
  graus_c: { pt: '°C', en: '°C', zh: '°C' },
};

/**
 * Formas de produto (§6.3) usadas como base de medida.
 * A conversão entre bases é sempre explícita, nunca implícita.
 */
export const BASES_MEDIDA = [
  'NIH', // Noz com casca verde
  'NIS', // Noz em casca, seca
  'MIO', // Miolo
  'FFR', // Folha fresca destalada
  'FSC', // Folha seca
  'POF', // Pó de folha peneirado
  'SEM', // Semente
  'GRA', // Grão
  'bruto',
  'tara',
  'liquido',
  'plantada',
  'colhida',
  'util',
] as const;
export type BaseMedida = (typeof BASES_MEDIDA)[number];

/** O código da base é imutável e universal («NIH»); o rótulo traduz-se. */
export const ROTULO_BASE: Record<BaseMedida, T> = {
  NIH: { pt: 'noz com casca verde', en: 'nut-in-husk', zh: '带青皮果' },
  NIS: { pt: 'noz em casca, seca', en: 'nut-in-shell, dry', zh: '带壳干果' },
  MIO: { pt: 'miolo', en: 'kernel', zh: '果仁' },
  FFR: { pt: 'folha fresca destalada', en: 'fresh destemmed leaf', zh: '去梗鲜叶' },
  FSC: { pt: 'folha seca', en: 'dry leaf', zh: '干叶' },
  POF: { pt: 'pó de folha peneirado', en: 'sifted leaf powder', zh: '过筛叶粉' },
  SEM: { pt: 'semente', en: 'seed', zh: '种子' },
  GRA: { pt: 'grão', en: 'grain', zh: '谷粒' },
  bruto: { pt: 'bruto', en: 'gross', zh: '毛重' },
  tara: { pt: 'tara', en: 'tare', zh: '皮重' },
  liquido: { pt: 'líquido', en: 'net', zh: '净重' },
  plantada: { pt: 'plantada', en: 'planted', zh: '种植' },
  colhida: { pt: 'colhida', en: 'harvested', zh: '收获' },
  util: { pt: 'útil', en: 'usable', zh: '有效' },
};

/**
 * R3 — toda a quantidade transporta unidade e, quando aplicável, base.
 * Não existe caminho para escrever um `number` solto num campo de quantidade.
 */
export interface Quantidade {
  valor: number;
  unidade: Unidade;
  base?: BaseMedida;
}

export function q(valor: number, unidade: Unidade, base?: BaseMedida): Quantidade {
  return base ? { valor, unidade, base } : { valor, unidade };
}

// ============================================================================
// Fontes de dados admissíveis (§5.5)
// «Relato verbal — fiabilidade nula — não entra no sistema.»
// ============================================================================

export const FONTES_DADOS = [
  'medicao_instrumentada',
  'contagem_dupla',
  'registo_duas_assinaturas',
  'registo_uma_assinatura',
  'estimativa_tecnica',
  'relato_verbal',
] as const;
export type FonteDados = (typeof FONTES_DADOS)[number];

export type Fiabilidade = 'alta' | 'media_alta' | 'media' | 'baixa' | 'nula';

export const ROTULO_FIABILIDADE: Record<Fiabilidade, T> = {
  alta: { pt: 'Alta', en: 'High', zh: '高' },
  media_alta: { pt: 'Média-alta', en: 'Medium-high', zh: '中高' },
  media: { pt: 'Média', en: 'Medium', zh: '中' },
  baixa: { pt: 'Baixa', en: 'Low', zh: '低' },
  nula: { pt: 'Nula', en: 'None', zh: '无' },
};

export interface PerfilFonte {
  fiabilidade: Fiabilidade;
  rotulo: T;
  usoPermitido: T;
  /** Admissível como indicador de resultado? */
  admissivelEmResultado: boolean;
}

export const PERFIL_FONTE: Record<FonteDados, PerfilFonte> = {
  medicao_instrumentada: {
    fiabilidade: 'alta',
    rotulo: {
      pt: 'Medição instrumentada com equipamento calibrado',
      en: 'Instrument measurement with calibrated equipment',
      zh: '使用已校准设备的仪器测量',
    },
    usoPermitido: {
      pt: 'Qualquer indicador, incluindo os de conformidade',
      en: 'Any indicator, compliance ones included',
      zh: '任何指标，包括合规指标',
    },
    admissivelEmResultado: true,
  },
  contagem_dupla: {
    fiabilidade: 'alta',
    rotulo: {
      pt: 'Contagem física por dupla verificação',
      en: 'Physical count with double checking',
      zh: '双人复核的实物盘点',
    },
    usoPermitido: {
      pt: 'Inventário, contagem de árvores, contagem de sacos',
      en: 'Inventory, tree counts, bag counts',
      zh: '盘点、树木计数、袋数清点',
    },
    admissivelEmResultado: true,
  },
  registo_duas_assinaturas: {
    fiabilidade: 'media_alta',
    rotulo: {
      pt: 'Registo de campo assinado por duas pessoas',
      en: 'Field record signed by two people',
      zh: '两人签署的现场记录',
    },
    usoPermitido: {
      pt: 'Operações, jornas, colheita',
      en: 'Operations, worker-days, harvest',
      zh: '作业、工日、采收',
    },
    admissivelEmResultado: true,
  },
  registo_uma_assinatura: {
    fiabilidade: 'media',
    rotulo: {
      pt: 'Registo de campo assinado por uma pessoa',
      en: 'Field record signed by one person',
      zh: '一人签署的现场记录',
    },
    usoPermitido: {
      pt: 'Observações qualitativas, monitorização',
      en: 'Qualitative observations, monitoring',
      zh: '定性观察、监测',
    },
    admissivelEmResultado: true,
  },
  estimativa_tecnica: {
    fiabilidade: 'baixa',
    rotulo: {
      pt: 'Estimativa técnica documentada',
      en: 'Documented technical estimate',
      zh: '有据可查的技术估算',
    },
    usoPermitido: {
      pt: 'Apenas em planeamento, nunca em indicador de resultado',
      en: 'Planning only, never a result indicator',
      zh: '仅用于计划，不得用于结果指标',
    },
    admissivelEmResultado: false,
  },
  relato_verbal: {
    fiabilidade: 'nula',
    rotulo: { pt: 'Relato verbal', en: 'Verbal account', zh: '口头陈述' },
    usoPermitido: {
      pt: 'Não entra no sistema',
      en: 'Does not enter the system',
      zh: '不得录入系统',
    },
    admissivelEmResultado: false,
  },
};

// ============================================================================
// Esqueleto comum (§2.3)
// ============================================================================

export type Referencia = string;

export interface Relacao {
  tipo: string;
  destino: Referencia;
  destinoTipo: string;
}

export interface EntradaHistorico {
  em: string;
  por: Referencia;
  campo: string;
  valorAnterior: unknown;
  valorNovo: unknown;
  motivo?: string;
}

export interface Anexo {
  id: string;
  designacao: string;
  tipoDocumental: string;
  em: string;
}

/**
 * §2.3 — atributos comuns a todos os objectos do sistema.
 *
 * R4: `codigo` é imutável. O nome pode mudar, o código nunca — renomear um
 * talhão não quebra o histórico.
 */
export interface ObjectoCanonico {
  id: string;
  /** Imutável após criação (R4). */
  readonly codigo: string;
  designacao: string;
  tipo: string;
  estado: Estado;
  /** Pessoa responsável, nunca uma equipa nem um cargo vago (§2.3). */
  dono: Referencia;
  criado_em: string;
  criado_por: Referencia;
  alterado_em: string;
  alterado_por: Referencia;
  versao: number;
  relacoes: Relacao[];
  historico: EntradaHistorico[];
  anexos: Anexo[];
  notas?: string;
  /**
   * §24.5 — nenhum papel apaga registos. A correcção faz-se por novo registo
   * que anula e substitui, com motivo obrigatório, e ambos ficam visíveis.
   */
  anulado?: {
    em: string;
    por: Referencia;
    motivo: string;
    substituidoPor?: Referencia;
  };
}

/** Campos que o utilizador preenche; o resto é carimbado pelo sistema. */
export type NovoObjecto<T extends ObjectoCanonico> = Omit<
  T,
  | 'id'
  | 'criado_em'
  | 'criado_por'
  | 'alterado_em'
  | 'alterado_por'
  | 'versao'
  | 'relacoes'
  | 'historico'
  | 'anexos'
  | 'anulado'
> &
  Partial<Pick<T, 'relacoes' | 'anexos'>>;
