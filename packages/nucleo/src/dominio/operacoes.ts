/**
 * BASTET — domínio Operações (§7.3)
 * E-10 Ordem de trabalho, E-11 Operação executada, E-14 Colheita,
 * mais os registos de campo F-05, F-12 e F-13.
 */

import type {
  EstadoOperacao,
  FonteDados,
  ObjectoCanonico,
  Quantidade,
  Referencia,
} from './canonico';
import type { T } from '../i18n/nucleo';

// ============================================================================
// E-10.1 Catálogo de tipos de operação
// ============================================================================

export interface TipoOperacao {
  /** Imutável e igual nas três línguas (R4). */
  codigo: string;
  designacao: T;
  /** Unidade de medida do trabalho. */
  unidadeTrabalho: T;
  culturas: T;
  familia: 'preparacao' | 'instalacao' | 'maneio' | 'fitossanidade' | 'colheita' | 'posColheita' | 'suporte';
}

export const TIPOS_OPERACAO: TipoOperacao[] = [
  {
    codigo: 'OPT-01',
    designacao: { pt: 'Destroncamento e limpeza', en: 'Land clearing', zh: '土地清理' },
    unidadeTrabalho: { pt: 'ha', en: 'ha', zh: '公顷' },
    culturas: { pt: 'Todas', en: 'All', zh: '全部' },
    familia: 'preparacao',
  },
  {
    codigo: 'OPT-02',
    designacao: { pt: 'Lavoura', en: 'Ploughing', zh: '犁地' },
    unidadeTrabalho: { pt: 'ha e hora-máquina', en: 'ha and machine-hour', zh: '公顷与机时' },
    culturas: { pt: 'Todas', en: 'All', zh: '全部' },
    familia: 'preparacao',
  },
  {
    codigo: 'OPT-03',
    designacao: { pt: 'Gradagem', en: 'Harrowing', zh: '耙地' },
    unidadeTrabalho: { pt: 'ha e hora-máquina', en: 'ha and machine-hour', zh: '公顷与机时' },
    culturas: { pt: 'Todas', en: 'All', zh: '全部' },
    familia: 'preparacao',
  },
  {
    codigo: 'OPT-04',
    designacao: { pt: 'Sulcamento', en: 'Furrowing', zh: '开沟' },
    unidadeTrabalho: { pt: 'ha', en: 'ha', zh: '公顷' },
    culturas: { pt: 'Todas', en: 'All', zh: '全部' },
    familia: 'preparacao',
  },
  {
    codigo: 'OPT-05',
    designacao: { pt: 'Nivelamento', en: 'Levelling', zh: '平整' },
    unidadeTrabalho: { pt: 'ha', en: 'ha', zh: '公顷' },
    culturas: { pt: 'Todas', en: 'All', zh: '全部' },
    familia: 'preparacao',
  },
  {
    codigo: 'OPT-06',
    designacao: { pt: 'Demarcação e abertura de covas', en: 'Marking out and digging holes', zh: '定点与挖穴' },
    unidadeTrabalho: { pt: 'n.º de covas', en: 'number of holes', zh: '穴数' },
    culturas: { pt: 'Perenes', en: 'Perennials', zh: '多年生作物' },
    familia: 'instalacao',
  },
  {
    codigo: 'OPT-07',
    designacao: { pt: 'Sementeira', en: 'Sowing', zh: '播种' },
    unidadeTrabalho: { pt: 'ha e kg de semente', en: 'ha and kg of seed', zh: '公顷与种子公斤数' },
    culturas: { pt: 'Anuais', en: 'Annuals', zh: '一年生作物' },
    familia: 'instalacao',
  },
  {
    codigo: 'OPT-08',
    designacao: { pt: 'Plantio ou transplante', en: 'Planting or transplanting', zh: '定植或移栽' },
    unidadeTrabalho: { pt: 'n.º de plantas', en: 'number of plants', zh: '株数' },
    culturas: { pt: 'Perenes e moringa', en: 'Perennials and moringa', zh: '多年生作物与辣木' },
    familia: 'instalacao',
  },
  {
    codigo: 'OPT-09',
    designacao: { pt: 'Sacha e controlo de infestantes', en: 'Weeding and weed control', zh: '中耕除草' },
    unidadeTrabalho: { pt: 'ha', en: 'ha', zh: '公顷' },
    culturas: { pt: 'Todas', en: 'All', zh: '全部' },
    familia: 'maneio',
  },
  {
    codigo: 'OPT-10',
    designacao: { pt: 'Adubação de fundo', en: 'Basal fertilisation', zh: '基肥' },
    unidadeTrabalho: { pt: 'kg de produto e de nutriente', en: 'kg of product and of nutrient', zh: '产品与养分公斤数' },
    culturas: { pt: 'Todas', en: 'All', zh: '全部' },
    familia: 'maneio',
  },
  {
    codigo: 'OPT-11',
    designacao: { pt: 'Adubação de cobertura', en: 'Top dressing', zh: '追肥' },
    unidadeTrabalho: { pt: 'kg de produto e de nutriente', en: 'kg of product and of nutrient', zh: '产品与养分公斤数' },
    culturas: { pt: 'Todas', en: 'All', zh: '全部' },
    familia: 'maneio',
  },
  {
    codigo: 'OPT-12',
    designacao: { pt: 'Aplicação foliar de micronutrientes', en: 'Foliar micronutrient application', zh: '叶面微量元素喷施' },
    unidadeTrabalho: { pt: 'litro de calda', en: 'litre of spray mix', zh: '药液升数' },
    culturas: { pt: 'Macadâmia', en: 'Macadamia', zh: '澳洲坚果' },
    familia: 'maneio',
  },
  {
    codigo: 'OPT-13',
    designacao: { pt: 'Aplicação de insecticida', en: 'Insecticide application', zh: '杀虫剂喷施' },
    unidadeTrabalho: { pt: 'litro de calda e g de s.a.', en: 'litre of spray mix and g of a.i.', zh: '药液升数与有效成分克数' },
    culturas: { pt: 'Todas', en: 'All', zh: '全部' },
    familia: 'fitossanidade',
  },
  {
    codigo: 'OPT-14',
    designacao: { pt: 'Aplicação de fungicida', en: 'Fungicide application', zh: '杀菌剂喷施' },
    unidadeTrabalho: { pt: 'litro de calda e g de s.a.', en: 'litre of spray mix and g of a.i.', zh: '药液升数与有效成分克数' },
    culturas: { pt: 'Todas', en: 'All', zh: '全部' },
    familia: 'fitossanidade',
  },
  {
    codigo: 'OPT-15',
    designacao: { pt: 'Rega', en: 'Irrigation', zh: '灌溉' },
    unidadeTrabalho: { pt: 'm³ e mm', en: 'm³ and mm', zh: '立方米与毫米' },
    culturas: { pt: 'Todas as regadas', en: 'All irrigated', zh: '全部灌溉作物' },
    familia: 'maneio',
  },
  {
    codigo: 'OPT-16',
    designacao: { pt: 'Poda e condução', en: 'Pruning and training', zh: '修剪与整形' },
    unidadeTrabalho: { pt: 'n.º de árvores', en: 'number of trees', zh: '树木株数' },
    culturas: { pt: 'Macadâmia', en: 'Macadamia', zh: '澳洲坚果' },
    familia: 'maneio',
  },
  {
    codigo: 'OPT-17',
    designacao: { pt: 'Corte de folha', en: 'Leaf cutting', zh: '刈割叶片' },
    unidadeTrabalho: { pt: 'kg de ramo fresco', en: 'kg of fresh branch', zh: '鲜枝公斤数' },
    culturas: { pt: 'Moringa', en: 'Moringa', zh: '辣木' },
    familia: 'colheita',
  },
  {
    codigo: 'OPT-18',
    designacao: { pt: 'Monitorização de pragas', en: 'Pest monitoring', zh: '虫害监测' },
    unidadeTrabalho: { pt: 'n.º de pontos amostrados', en: 'number of sampling points', zh: '样点数' },
    culturas: { pt: 'Todas', en: 'All', zh: '全部' },
    familia: 'fitossanidade',
  },
  {
    codigo: 'OPT-19',
    designacao: { pt: 'Inspecção e contagem de plantas', en: 'Plant inspection and counting', zh: '植株检查与计数' },
    unidadeTrabalho: { pt: 'n.º de plantas', en: 'number of plants', zh: '株数' },
    culturas: { pt: 'Perenes', en: 'Perennials', zh: '多年生作物' },
    familia: 'maneio',
  },
  {
    codigo: 'OPT-20',
    designacao: { pt: 'Colheita', en: 'Harvest', zh: '采收' },
    unidadeTrabalho: { pt: 'kg', en: 'kg', zh: '公斤' },
    culturas: { pt: 'Todas', en: 'All', zh: '全部' },
    familia: 'colheita',
  },
  {
    codigo: 'OPT-21',
    designacao: { pt: 'Descasque', en: 'Dehusking', zh: '脱皮' },
    unidadeTrabalho: { pt: 'kg de entrada e de saída', en: 'kg in and kg out', zh: '进出料公斤数' },
    culturas: { pt: 'Macadâmia', en: 'Macadamia', zh: '澳洲坚果' },
    familia: 'posColheita',
  },
  {
    codigo: 'OPT-22',
    designacao: { pt: 'Destala e selecção de folha', en: 'Destemming and leaf sorting', zh: '去梗与选叶' },
    unidadeTrabalho: { pt: 'kg de entrada e de saída', en: 'kg in and kg out', zh: '进出料公斤数' },
    culturas: { pt: 'Moringa', en: 'Moringa', zh: '辣木' },
    familia: 'posColheita',
  },
  {
    codigo: 'OPT-23',
    designacao: { pt: 'Secagem', en: 'Drying', zh: '干燥' },
    unidadeTrabalho: { pt: 'kg e humidade final', en: 'kg and final moisture', zh: '公斤数与终水分' },
    culturas: { pt: 'Macadâmia e moringa', en: 'Macadamia and moringa', zh: '澳洲坚果与辣木' },
    familia: 'posColheita',
  },
  {
    codigo: 'OPT-24',
    designacao: { pt: 'Debulha e ensacamento', en: 'Threshing and bagging', zh: '脱粒与装袋' },
    unidadeTrabalho: { pt: 'kg', en: 'kg', zh: '公斤' },
    culturas: { pt: 'Anuais', en: 'Annuals', zh: '一年生作物' },
    familia: 'posColheita',
  },
  {
    codigo: 'OPT-25',
    designacao: { pt: 'Quebra de casca', en: 'Shell cracking', zh: '破壳' },
    unidadeTrabalho: { pt: 'kg de entrada e de miolo', en: 'kg in and kg of kernel', zh: '进料与果仁公斤数' },
    culturas: { pt: 'Macadâmia', en: 'Macadamia', zh: '澳洲坚果' },
    familia: 'posColheita',
  },
  {
    codigo: 'OPT-26',
    designacao: { pt: 'Moagem e peneiração', en: 'Milling and sifting', zh: '粉碎与过筛' },
    unidadeTrabalho: { pt: 'kg de entrada e de pó', en: 'kg in and kg of powder', zh: '进料与粉末公斤数' },
    culturas: { pt: 'Moringa', en: 'Moringa', zh: '辣木' },
    familia: 'posColheita',
  },
  {
    codigo: 'OPT-27',
    designacao: { pt: 'Classificação e triagem', en: 'Grading and sorting', zh: '分级与分选' },
    unidadeTrabalho: { pt: 'kg por classe', en: 'kg per grade', zh: '各等级公斤数' },
    culturas: { pt: 'Macadâmia e moringa', en: 'Macadamia and moringa', zh: '澳洲坚果与辣木' },
    familia: 'posColheita',
  },
  {
    codigo: 'OPT-28',
    designacao: { pt: 'Embalagem e pesagem', en: 'Packing and weighing', zh: '包装与称重' },
    unidadeTrabalho: { pt: 'n.º de embalagens e kg', en: 'number of packs and kg', zh: '包装数与公斤数' },
    culturas: { pt: 'Todas', en: 'All', zh: '全部' },
    familia: 'posColheita',
  },
  {
    codigo: 'OPT-29',
    designacao: { pt: 'Transporte interno', en: 'Internal transport', zh: '场内运输' },
    unidadeTrabalho: { pt: 'tonelada-quilómetro', en: 'tonne-kilometre', zh: '吨公里' },
    culturas: { pt: 'Todas', en: 'All', zh: '全部' },
    familia: 'suporte',
  },
  {
    codigo: 'OPT-30',
    designacao: { pt: 'Manutenção de máquina', en: 'Machine maintenance', zh: '机械维护' },
    unidadeTrabalho: { pt: 'hora e peça', en: 'hour and part', zh: '工时与配件' },
    culturas: { pt: 'Mecanização', en: 'Mechanisation', zh: '机械化' },
    familia: 'suporte',
  },
  {
    codigo: 'OPT-31',
    designacao: { pt: 'Construção e conservação', en: 'Construction and upkeep', zh: '建设与维护' },
    unidadeTrabalho: { pt: 'unidade', en: 'unit', zh: '项' },
    culturas: { pt: 'Infra-estruturas', en: 'Infrastructure', zh: '基础设施' },
    familia: 'suporte',
  },
  {
    codigo: 'OPT-32',
    designacao: { pt: 'Vigilância', en: 'Security patrol', zh: '安保巡查' },
    unidadeTrabalho: { pt: 'turno', en: 'shift', zh: '班次' },
    culturas: { pt: 'Segurança', en: 'Security', zh: '安保' },
    familia: 'suporte',
  },
];

export const TIPO_OPERACAO_POR_CODIGO = new Map(TIPOS_OPERACAO.map((t) => [t.codigo, t]));

// ============================================================================
// E-10. Ordem de trabalho — o plano (R5)
// ============================================================================

export interface InsumoPrevisto {
  artigo: Referencia;
  quantidade: Quantidade;
  dose?: Quantidade;
}

export interface OrdemTrabalho extends ObjectoCanonico {
  tipo: 'ordem_trabalho';
  estado: EstadoOperacao;
  tipo_operacao: string;
  ciclo_cultura?: Referencia;
  talhao: Referencia;

  // --- Plano (§5.2) ---
  data_prevista: string;
  equipa_prevista: Referencia;
  jornas_previstas: Quantidade;
  quantidade_prevista: Quantidade;
  insumos_previstos?: InsumoPrevisto[];
  maquinas_previstas?: Referencia[];
  /** Calculado a partir de jornas, insumos e horas-máquina. */
  custo_orcamentado: Quantidade;

  emitida_por: Referencia;
}

// ============================================================================
// E-11. Operação executada — a execução (R5)
// «Não pode haver operação sem ordem» (R1).
// ============================================================================

export const CONDICOES_METEO = [
  'seco',
  'nublado',
  'chuva_fraca',
  'chuva_forte',
  'vento_forte',
  'calor_extremo',
] as const;
export type CondicaoMeteo = (typeof CONDICOES_METEO)[number];

export const ROTULO_METEO: Record<CondicaoMeteo, T> = {
  seco: { pt: 'Seco', en: 'Dry', zh: '晴干' },
  nublado: { pt: 'Nublado', en: 'Overcast', zh: '多云' },
  chuva_fraca: { pt: 'Chuva fraca', en: 'Light rain', zh: '小雨' },
  chuva_forte: { pt: 'Chuva forte', en: 'Heavy rain', zh: '大雨' },
  vento_forte: { pt: 'Vento forte', en: 'Strong wind', zh: '大风' },
  calor_extremo: { pt: 'Calor extremo', en: 'Extreme heat', zh: '极端高温' },
};

export interface Operacao extends ObjectoCanonico {
  tipo: 'operacao';
  estado: EstadoOperacao;
  /** R1 — não pode haver operação sem ordem. */
  ordem_trabalho: Referencia;
  talhao: Referencia;

  /** Validação: não pode ser futura. */
  data_real: string;
  hora_inicio: string;
  hora_fim: string;

  /** Pelo menos um trabalhador activo. */
  executantes: Referencia[];
  /** Chefe de turma ou técnico. */
  responsavel: Referencia;

  /** Calculado a partir das presenças. */
  jornas_reais: Quantidade;
  quantidade_real: Quantidade;
  custo_real?: Quantidade;

  /** Obrigatório em aplicação de fitofármacos e em colheita. */
  condicoes_meteorologicas?: CondicaoMeteo;
  observacoes?: string;
  fonte_dados: FonteDados;
  assinatura_executante: boolean;
  assinatura_responsavel: boolean;
}

// ============================================================================
// E-14. Colheita / F-07 Ficha de pesagem
// ============================================================================

export const MOTIVOS_REJEICAO = [
  'imatura',
  'danificada_praga',
  'danificada_mecanica',
  'podre',
  'terra_detritos',
  'outro',
] as const;
export type MotivoRejeicao = (typeof MOTIVOS_REJEICAO)[number];

export const ROTULO_REJEICAO: Record<MotivoRejeicao, T> = {
  imatura: { pt: 'Imatura', en: 'Immature', zh: '未成熟' },
  danificada_praga: { pt: 'Danificada por praga', en: 'Pest damage', zh: '虫害损伤' },
  danificada_mecanica: { pt: 'Danificada mecanicamente', en: 'Mechanical damage', zh: '机械损伤' },
  podre: { pt: 'Podre', en: 'Rotten', zh: '腐烂' },
  terra_detritos: { pt: 'Terra e detritos', en: 'Soil and debris', zh: '泥土杂质' },
  outro: { pt: 'Outro', en: 'Other', zh: '其他' },
};

export interface PesagemColheita extends ObjectoCanonico {
  tipo: 'pesagem_colheita';
  estado: EstadoOperacao;
  operacao?: Referencia;
  ciclo_cultura: Referencia;
  talhao: Referencia;

  /** Validação: posterior à data mínima de colheita (intervalo de segurança). */
  data_colheita: string;
  hora: string;
  /** Obrigatório em macadâmia. */
  ronda_numero?: number;
  /** Calculado; alvo 7 a 14 dias. */
  dias_desde_ronda_anterior?: number;

  equipa: Referencia;
  n_pessoas: number;

  /** Pesagem em balança calibrada. */
  quantidade_bruta: Quantidade;
  tara: Quantidade;
  /** Calculado: bruta − tara. */
  quantidade_liquida: Quantidade;
  /** Triagem em campo. */
  quantidade_rejeitada: Quantidade;
  motivo_rejeicao?: MotivoRejeicao;
  /** Obrigatório em macadâmia e moringa. */
  humidade_percent?: number;

  /** Toda a colheita gera lote. */
  lote_gerado?: Referencia;
  hora_entrada_processamento?: string;

  pesador: Referencia;
  conferente: Referencia;
  fonte_dados: FonteDados;
}

// ============================================================================
// F-05. Relatório diário de campo
// «É o formulário mais importante do sistema.» Entregue antes do fim do turno,
// sem excepção. É a fonte primária de quase todos os indicadores operacionais.
// ============================================================================

export const MOTIVOS_FALTA = [
  'doenca',
  'falta_justificada',
  'falta_injustificada',
  'ferias',
  'licenca',
  'acidente',
] as const;
export type MotivoFalta = (typeof MOTIVOS_FALTA)[number];

export const ROTULO_FALTA: Record<MotivoFalta, T> = {
  doenca: { pt: 'Doença', en: 'Illness', zh: '疾病' },
  falta_justificada: { pt: 'Falta justificada', en: 'Excused absence', zh: '请假' },
  falta_injustificada: { pt: 'Falta injustificada', en: 'Unexcused absence', zh: '旷工' },
  ferias: { pt: 'Férias', en: 'Leave', zh: '休假' },
  licenca: { pt: 'Licença', en: 'Statutory leave', zh: '法定假' },
  acidente: { pt: 'Acidente', en: 'Accident', zh: '工伤' },
};

export const TIPOS_BLOQUEIO = [
  'falta_material',
  'avaria',
  'meteorologia',
  'falta_pessoal',
  'acesso',
  'outro',
] as const;
export type TipoBloqueio = (typeof TIPOS_BLOQUEIO)[number];

export const ROTULO_BLOQUEIO: Record<TipoBloqueio, T> = {
  falta_material: { pt: 'Falta de material', en: 'No materials', zh: '物资短缺' },
  avaria: { pt: 'Avaria', en: 'Breakdown', zh: '设备故障' },
  meteorologia: { pt: 'Meteorologia', en: 'Weather', zh: '天气' },
  falta_pessoal: { pt: 'Falta de pessoal', en: 'Short-staffed', zh: '人手不足' },
  acesso: { pt: 'Acesso', en: 'Access', zh: '通行受阻' },
  outro: { pt: 'Outro', en: 'Other', zh: '其他' },
};

export interface Bloqueio {
  tipo_bloqueio: TipoBloqueio;
  descricao: string;
  horas_perdidas?: number;
}

export interface RelatorioDiario extends ObjectoCanonico {
  tipo: 'relatorio_diario';
  estado: EstadoOperacao;
  data: string;
  turno: 'manha' | 'tarde' | 'completo';
  bloco: Referencia;
  talhoes: Referencia[];
  ordens_trabalho: Referencia[];

  efectivo_previsto: number;
  efectivo_presente: number;
  faltas: { trabalhador: Referencia; motivo: MotivoFalta }[];

  hora_inicio: string;
  hora_fim: string;

  meta_dia: Quantidade;
  quantidade_realizada: Quantidade;
  quantidade_rejeitada?: Quantidade;

  condicoes_meteorologicas: CondicaoMeteo;
  bloqueios: Bloqueio[];
  incidentes_seguranca: number;
  epi_conforme: boolean;

  chefe_turma: Referencia;
  /** Visto do técnico encarregado. */
  visto_tecnico?: Referencia;
  fonte_dados: FonteDados;
}

// ============================================================================
// F-12. Monitorização fitossanitária
// ============================================================================

export const DECISOES_MONITORIZACAO = ['nenhuma_accao', 'repetir', 'tratar', 'escalar'] as const;
export type DecisaoMonitorizacao = (typeof DECISOES_MONITORIZACAO)[number];

export const ROTULO_DECISAO_MF: Record<DecisaoMonitorizacao, T> = {
  nenhuma_accao: { pt: 'Nenhuma acção', en: 'No action', zh: '不采取措施' },
  repetir: { pt: 'Repetir contagem', en: 'Repeat the count', zh: '重新计数' },
  tratar: { pt: 'Tratar', en: 'Treat', zh: '施药防治' },
  escalar: { pt: 'Escalar ao agrónomo', en: 'Escalate to the agronomist', zh: '上报农艺师' },
};

export interface Monitorizacao extends ObjectoCanonico {
  tipo: 'monitorizacao';
  estado: EstadoOperacao;
  data: string;
  talhao: Referencia;
  metodo: string;
  n_pontos_amostrados: number;
  n_plantas_por_ponto: number;
  organismo: string;
  contagem_pragas: number;
  contagem_inimigos_naturais: number;
  /** Calculado: pragas ÷ (pontos × plantas por ponto). */
  indice_calculado: Quantidade;
  /** Limiar de acção aplicável — na macadâmia, 0,4 percevejos por árvore. */
  limiar_aplicavel: Quantidade;
  decisao: DecisaoMonitorizacao;
  observador: Referencia;
  fonte_dados: FonteDados;
}

// ============================================================================
// F-13. Observação de campo
// ============================================================================

export const GRAVIDADES = ['baixa', 'media', 'alta', 'critica'] as const;
export type Gravidade = (typeof GRAVIDADES)[number];

export const ROTULO_GRAVIDADE: Record<Gravidade, T> = {
  baixa: { pt: 'Baixa', en: 'Low', zh: '低' },
  media: { pt: 'Média', en: 'Medium', zh: '中' },
  alta: { pt: 'Alta', en: 'High', zh: '高' },
  critica: { pt: 'Crítica', en: 'Critical', zh: '危急' },
};

export interface Observacao extends ObjectoCanonico {
  tipo: 'observacao';
  estado: EstadoOperacao;
  data: string;
  talhao: Referencia;
  tipo_observacao: string;
  descricao: string;
  extensao_percent: number;
  gravidade: Gravidade;
  accao_proposta: string;
  observador: Referencia;
  fonte_dados: FonteDados;
}
