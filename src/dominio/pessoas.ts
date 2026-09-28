/**
 * BASTET — domínio Pessoas (§7.4)
 * E-17 Trabalhador, E-18 Jorna e presença, E-19 Formação, E-20 Entrega de EPI.
 *
 * Marcação no documento: [L] decorre de obrigação legal moçambicana,
 * [G] necessário à gestão. Os campos [L] alimentam validações bloqueantes.
 */

import type {
  EstadoTrabalhador,
  FonteDados,
  ObjectoCanonico,
  Quantidade,
  Referencia,
} from './canonico';
import type { T } from '../i18n/nucleo';

// ============================================================================
// E-17. Trabalhador
// ============================================================================

export const MODALIDADES = ['permanente', 'sazonal', 'eventual', 'temporario'] as const;
export type Modalidade = (typeof MODALIDADES)[number];

export const ROTULO_MODALIDADE: Record<Modalidade, T> = {
  permanente: { pt: 'Permanente', en: 'Permanent', zh: '长期工' },
  sazonal: { pt: 'Sazonal', en: 'Seasonal', zh: '季节工' },
  eventual: { pt: 'Eventual', en: 'Casual', zh: '临时工' },
  temporario: { pt: 'Temporário', en: 'Fixed-term', zh: '定期工' },
};

export const BASES_CALCULO = ['mensal', 'diaria', 'a_tarefa'] as const;
export type BaseCalculo = (typeof BASES_CALCULO)[number];

export const ROTULO_BASE_CALCULO: Record<BaseCalculo, T> = {
  mensal: { pt: 'Mensal', en: 'Monthly', zh: '月薪' },
  diaria: { pt: 'Diária', en: 'Daily', zh: '日薪' },
  a_tarefa: { pt: 'À tarefa', en: 'Piece rate', zh: '计件' },
};

/**
 * Categorias profissionais da Farma Alcinda (§3.2).
 *
 * O que fica gravado é a forma portuguesa — é a que consta do contrato e a que
 * viaja para o servidor. Isto é só a leitura. Uma categoria que ainda não
 * esteja aqui mostra-se como foi escrita, em vez de desaparecer.
 */
export const ROTULO_CATEGORIA: Record<string, T> = {
  'Gestor da Farma': { pt: 'Gestor da Farma', en: 'Farm Manager', zh: '农场经理' },
  'Agrónomo responsável': {
    pt: 'Agrónomo responsável',
    en: 'Responsible agronomist',
    zh: '责任农艺师',
  },
  'Técnico encarregado de campo': {
    pt: 'Técnico encarregado de campo',
    en: 'Field supervisor',
    zh: '田间技术主管',
  },
  'Chefe de turma de campo': {
    pt: 'Chefe de turma de campo',
    en: 'Field shift leader',
    zh: '田间班组长',
  },
  'Trabalhador de campo': {
    pt: 'Trabalhador de campo',
    en: 'Field worker',
    zh: '田间工人',
  },
  Tractorista: { pt: 'Tractorista', en: 'Tractor driver', zh: '拖拉机手' },
  'Operador de implementos': {
    pt: 'Operador de implementos',
    en: 'Implement operator',
    zh: '农具操作员',
  },
  'Técnico de laboratório': {
    pt: 'Técnico de laboratório',
    en: 'Laboratory technician',
    zh: '实验室技术员',
  },
  Guarda: { pt: 'Guarda', en: 'Security guard', zh: '安保' },
  'Apoio geral': { pt: 'Apoio geral', en: 'General support', zh: '后勤支持' },
};

/** A categoria como se lê. Desconhecida, devolve-se tal como foi escrita. */
export function categoria(nome: string): T {
  return ROTULO_CATEGORIA[nome] ?? { pt: nome, en: nome, zh: nome };
}

export const TIPOS_CERTIFICADO = [
  'aplicador_pesticidas',
  'saude',
  'primeiros_socorros',
  'conducao',
  'outro',
] as const;
export type TipoCertificado = (typeof TIPOS_CERTIFICADO)[number];

export const ROTULO_CERTIFICADO: Record<TipoCertificado, T> = {
  aplicador_pesticidas: {
    pt: 'Aplicador de pesticidas',
    en: 'Pesticide applicator',
    zh: '农药施用员',
  },
  saude: { pt: 'Saúde', en: 'Health', zh: '健康' },
  primeiros_socorros: { pt: 'Primeiros socorros', en: 'First aid', zh: '急救' },
  conducao: { pt: 'Condução', en: 'Driving', zh: '驾驶' },
  outro: { pt: 'Outro', en: 'Other', zh: '其他' },
};

export interface Certificado {
  tipo: TipoCertificado;
  numero?: string;
  entidade?: string;
  /** Data de validade; alimenta o alerta dos 30 dias (§24.4). */
  validade?: string;
}

export interface RemuneracaoHistorica {
  valor: Quantidade;
  data_efeito: string;
  motivo?: string;
}

export interface Trabalhador extends ObjectoCanonico {
  tipo: 'trabalhador';
  estado: EstadoTrabalhador;

  // --- Identificação [L] ---
  nome_completo: string;
  /**
   * [L] A prova da idade legal.
   *
   * Opcional no tipo, e não por comodidade: a Farma Alcinda tem 22 pessoas ao
   * serviço e a data de nascimento de uma. Inventar 21 datas para satisfazer o
   * campo daria um quadro que passa nas validações e mente; deixar a lacuna à
   * vista dá um quadro que falha nas validações e diz a verdade. A V02 trata a
   * ausência como bloqueante, que é o que ela é.
   */
  data_nascimento?: string;
  sexo: 'M' | 'F';
  nacionalidade?: string;
  naturalidade?: string;

  // --- Documentos [L] ---
  tipo_documento?: string;
  numero_documento?: string;
  validade_documento?: string;
  nuit?: string;
  numero_beneficiario_inss?: string;
  data_inscricao_inss?: string;
  apolice_acidentes_trabalho?: string;

  // --- Contacto ---
  provincia: string;
  distrito: string;
  localidade?: string;
  telefone?: string;
  contacto_emergencia?: { nome: string; relacao: string; telefone: string };
  distancia_local_trabalho_km?: Quantidade;

  // --- Vínculo [L] ---
  contrato?: Referencia;
  modalidade: Modalidade;
  /** [L] Sem ela não há prazo de inscrição no INSS para contar (V29). */
  data_inicio?: string;
  data_cessacao_prevista?: string;
  /** [L, bloqueante] Obrigatório em contrato a prazo. */
  motivo_justificativo_prazo?: string;
  numero_renovacoes?: number;
  local_trabalho: string;
  campanha_associada?: string;

  // --- Profissional [L] ---
  categoria_profissional: string;
  /**
   * Dado de gestão, não de conformidade: alimenta o custo de mão-de-obra por
   * hectare e por quilograma (K-PES-01, K-PES-02). Em falta, esses dois
   * indicadores ficam a cinzento — que é a leitura certa de «não se sabe».
   */
  remuneracao_base?: Quantidade;
  base_calculo?: BaseCalculo;
  historico_remuneracoes: RemuneracaoHistorica[];

  // --- Fiscal ---
  numero_dependentes?: number;

  // --- Segurança [L] ---
  apto_aplicar_pesticidas: boolean;
  classe_pesticidas_autorizada?: string;
  certificados: Certificado[];
  /** [L, bloqueante] Impede afectação a tarefas com fitofármacos. */
  gravidez_ou_lactacao?: boolean;

  // --- Menores [L] ---
  autorizacao_representante_legal?: boolean;
  identificacao_representante?: string;

  // --- Gestão agrícola ---
  equipa?: Referencia;
  chefe_directo?: Referencia;
  talhoes_habituais?: Referencia[];
  maquinas_habilitado?: Referencia[];

  // --- Cessação ---
  data_cessacao?: string;
  motivo_cessacao?: string;
}

/**
 * Idade em anos completos à data indicada. Calculada, nunca armazenada.
 *
 * Devolve `undefined` quando não há data de nascimento. Não devolve zero: zero
 * é uma idade, «não se sabe» não é.
 */
export function idade(
  t: Pick<Trabalhador, 'data_nascimento'>,
  referencia: string,
): number | undefined {
  if (!t.data_nascimento) return undefined;
  const n = new Date(t.data_nascimento);
  const r = new Date(referencia);
  let a = r.getFullYear() - n.getFullYear();
  const m = r.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && r.getDate() < n.getDate())) a--;
  return a;
}

// ============================================================================
// E-18. Jorna e presença
// «Este é o registo mais frequente do sistema.»
// ============================================================================

export const TIPOS_DIA = ['normal', 'descanso_semanal', 'feriado', 'tolerancia_ponto'] as const;
export type TipoDia = (typeof TIPOS_DIA)[number];

export const ROTULO_TIPO_DIA: Record<TipoDia, T> = {
  normal: { pt: 'Normal', en: 'Normal', zh: '正常' },
  descanso_semanal: { pt: 'Descanso semanal', en: 'Weekly rest', zh: '周休' },
  feriado: { pt: 'Feriado', en: 'Public holiday', zh: '法定节假日' },
  tolerancia_ponto: { pt: 'Tolerância de ponto', en: 'Discretionary day off', zh: '调休' },
};

export const PRESENCAS = [
  'presente',
  'falta_justificada',
  'falta_injustificada',
  'ferias',
  'licenca',
  'baixa',
] as const;
export type Presenca = (typeof PRESENCAS)[number];

export const ROTULO_PRESENCA: Record<Presenca, T> = {
  presente: { pt: 'Presente', en: 'Present', zh: '出勤' },
  falta_justificada: { pt: 'Falta justificada', en: 'Excused absence', zh: '请假' },
  falta_injustificada: { pt: 'Falta injustificada', en: 'Unexcused absence', zh: '旷工' },
  ferias: { pt: 'Férias', en: 'Leave', zh: '休假' },
  licenca: { pt: 'Licença', en: 'Statutory leave', zh: '法定假' },
  baixa: { pt: 'Baixa', en: 'Sick leave', zh: '病假' },
};

export interface Jorna extends ObjectoCanonico {
  tipo: 'jorna';
  /** Validação: estado activo. */
  trabalhador: Referencia;
  /** Validação: não futura. Único por pessoa e por dia. */
  data: string;
  hora_entrada: string;
  hora_saida: string;
  /** Mínimo 30, máximo 120. */
  intervalo_minutos: number;

  /** Calculado; máximo 8 por dia. */
  horas_normais: Quantidade;
  horas_extraordinarias?: Quantidade;
  /** Prestadas depois das 20h00. */
  horas_nocturnas?: Quantidade;

  tipo_dia: TipoDia;
  presenca: Presenca;

  /** Obrigatório em trabalho de campo. */
  talhao?: Referencia;
  operacao?: Referencia;
  /** Do catálogo de tipos de operação (E-10.1). */
  tarefa: string;

  /** Obrigatório em trabalho à tarefa. */
  producao_individual?: Quantidade;

  equipa: Referencia;
  chefe: Referencia;
  /** Chefe de turma. */
  validado_por?: Referencia;
  /** Calculado a partir da tabela salarial vigente. */
  custo_calculado?: Quantidade;
  fonte_dados: FonteDados;
}

// ============================================================================
// Equipa
// ============================================================================

export interface Equipa extends ObjectoCanonico {
  tipo: 'equipa';
  chefe_turma: Referencia;
  membros: Referencia[];
  bloco_habitual?: Referencia;
}

// ============================================================================
// E-19. Formação
// ============================================================================

export interface Formacao extends ObjectoCanonico {
  tipo: 'formacao';
  data: string;
  duracao_horas: Quantidade;
  tema: string;
  formador_ou_entidade: string;
  participantes: Referencia[];
  avaliacao_realizada: boolean;
  validade_meses?: number;
  obrigatoria_por_lei: boolean;
}

/** Formações obrigatórias identificadas no §7.4 E-19. */
export const FORMACOES_OBRIGATORIAS = [
  { tema: 'Higiene', periodicidade_meses: 12, alvo: 'Todos os que trabalham na exploração' },
  {
    tema: 'Segurança no manuseamento de pesticidas',
    periodicidade_meses: 6,
    alvo: 'Aplicadores',
  },
  {
    tema: 'Primeiros socorros',
    periodicidade_meses: 60,
    alvo: 'Pelo menos uma pessoa presente durante as operações',
  },
];
