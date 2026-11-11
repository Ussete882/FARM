/**
 * BASTET — o mapa da aplicação: áreas, ecrãs e a cor de cada área.
 *
 * As sete áreas têm as sete cores do arco-íris da LHF-Foundation, pela ordem
 * do arco-íris. Assim a barra lateral, de cima a baixo, é o próprio arco-íris
 * da fundação, e cada ecrã leva a cor da sua área no ícone do título, no
 * separador activo e no fluxo de trabalho.
 *
 * A cor da área é identidade, não estado: o semáforo (§9.3) continua a viver
 * só nas pastilhas e nos cartões de indicador.
 */

import {
  AlertOctagon,
  Binoculars,
  Bug,
  CalendarCheck,
  ChartColumnBig,
  ClipboardCheck,
  Droplets,
  Gauge,
  House,
  Landmark,
  LandPlot,
  type LucideIcon,
  Mountain,
  NotebookPen,
  RefreshCw,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  Sprout,
  Tractor,
  TreeDeciduous,
  UsersRound,
} from 'lucide-react';

import type { T } from '@bastet/nucleo/i18n';

// ============================================================================
// Cores das áreas
// ============================================================================

export interface CorArea {
  /** A cor da fundação, plena. */
  base: string;
  /** Escurecida o bastante para texto e ícones sobre branco. */
  escuro: string;
  /** Fundo pálido, para o ícone em repouso. */
  suave: string;
  /** A tinta que se lê sobre a cor plena. */
  tinta: string;
}

const ESCURA = '#0e0c19';

export const CORES = {
  vermelho: { base: '#ed1d23', escuro: '#c8161c', suave: '#fde8e8', tinta: '#ffffff' },
  laranja: { base: '#fea027', escuro: '#a85a00', suave: '#fff1dc', tinta: ESCURA },
  amarelo: { base: '#f2e205', escuro: '#6f6700', suave: '#fcf9cf', tinta: ESCURA },
  verde: { base: '#3bbe4e', escuro: '#1b7f33', suave: '#e5f6e8', tinta: ESCURA },
  celeste: { base: '#4bc3ed', escuro: '#11739a', suave: '#e2f5fc', tinta: ESCURA },
  azul: { base: '#4067ab', escuro: '#35589a', suave: '#e8eef8', tinta: '#ffffff' },
  roxo: { base: '#873a93', escuro: '#7a3386', suave: '#f4e9f6', tinta: '#ffffff' },
} satisfies Record<string, CorArea>;

export type NomeCor = keyof typeof CORES;

// ============================================================================
// Áreas e ecrãs
// ============================================================================

export interface Ecra {
  para: string;
  rotulo: T;
  icone: LucideIcon;
  formulario?: string;
  titulo: T;
}

export interface Grupo {
  chave: string;
  rotulo: T;
  icone: LucideIcon;
  /** A cor da área, uma das sete do arco-íris da fundação. */
  cor: NomeCor;
  /**
   * O módulo do documento. «M1» é código e lê-se igual em qualquer língua;
   * «Camada 6» é uma palavra e traduz-se.
   */
  modulo?: T;
  ecras: Ecra[];
}

/** Um código que é o mesmo nas três línguas. */
const cod = (texto: string): T => ({ pt: texto, en: texto, zh: texto });

export const GRUPOS: Grupo[] = [
  {
    chave: 'painel',
    rotulo: { pt: 'Início', en: 'Home', zh: '首页' },
    icone: House,
    cor: 'vermelho',
    modulo: { pt: 'Camada 6', en: 'Layer 6', zh: '第 6 层' },
    ecras: [
      {
        para: '/',
        rotulo: { pt: 'Painel diário', en: 'Daily panel', zh: '每日看板' },
        titulo: {
          pt: 'Painel diário do líder de equipa',
          en: 'Team leader daily panel',
          zh: '组长每日看板',
        },
        icone: Gauge,
        formulario: '§11.1',
      },
    ],
  },
  {
    chave: 'cadastro',
    rotulo: { pt: 'Terrenos', en: 'Land', zh: '地块' },
    icone: LandPlot,
    cor: 'laranja',
    modulo: cod('M1'),
    ecras: [
      {
        para: '/talhoes',
        rotulo: { pt: 'Terrenos', en: 'Land plots', zh: '地块' },
        titulo: {
          pt: 'Terrenos — blocos e talhões',
          en: 'Land — blocks and plots',
          zh: '地块——区与地块',
        },
        icone: LandPlot,
        formulario: 'F-01',
      },
      {
        para: '/terreno-3d',
        rotulo: { pt: 'Vista 3D', en: '3D view', zh: '3D 视图' },
        titulo: {
          pt: 'Vista 3D do terreno',
          en: '3D land view',
          zh: '地块 3D 视图',
        },
        icone: Mountain,
      },
      {
        para: '/arvores',
        rotulo: { pt: 'Árvores', en: 'Trees', zh: '树木' },
        titulo: { pt: 'Árvores', en: 'Trees', zh: '树木' },
        icone: TreeDeciduous,
        formulario: 'F-02',
      },
      {
        para: '/ciclos',
        rotulo: { pt: 'Culturas e ciclos', en: 'Crops and cycles', zh: '作物与周期' },
        titulo: {
          pt: 'Culturas e ciclos',
          en: 'Crops and cycles',
          zh: '作物与生长周期',
        },
        icone: Sprout,
        formulario: 'E-07',
      },
      {
        para: '/agua',
        rotulo: { pt: 'Fontes de água', en: 'Water sources', zh: '水源' },
        titulo: { pt: 'Fontes de água', en: 'Water sources', zh: '水源' },
        icone: Droplets,
        formulario: 'E-03',
      },
    ],
  },
  {
    chave: 'tarefas',
    rotulo: { pt: 'Tarefas', en: 'Tasks', zh: '任务' },
    icone: ClipboardCheck,
    cor: 'amarelo',
    modulo: cod('M2'),
    ecras: [
      {
        para: '/ordens',
        rotulo: { pt: 'Tarefas', en: 'Tasks', zh: '任务' },
        titulo: {
          pt: 'Tarefas — ordens de trabalho',
          en: 'Tasks — work orders',
          zh: '任务——工单',
        },
        icone: ClipboardCheck,
        formulario: 'E-10',
      },
    ],
  },
  {
    chave: 'execucao',
    rotulo: { pt: 'Campo', en: 'Field', zh: '田间' },
    icone: Tractor,
    cor: 'verde',
    modulo: cod('M2'),
    ecras: [
      {
        para: '/jornas',
        rotulo: {
          pt: 'Presenças',
          en: 'Attendance',
          zh: '出勤',
        },
        titulo: {
          pt: 'Presenças e jornas',
          en: 'Attendance and worker-days',
          zh: '出勤与工日',
        },
        icone: CalendarCheck,
        formulario: 'F-06',
      },
      {
        para: '/relatorios',
        rotulo: { pt: 'Relatório diário', en: 'Daily report', zh: '田间日报' },
        titulo: {
          pt: 'Relatório diário de campo',
          en: 'Daily field report',
          zh: '田间作业日报',
        },
        icone: NotebookPen,
        formulario: 'F-05',
      },
      {
        para: '/pesagens',
        rotulo: {
          pt: 'Pesagem de colheita',
          en: 'Harvest weighing',
          zh: '采收称重',
        },
        titulo: {
          pt: 'Pesagem de colheita',
          en: 'Harvest weighing',
          zh: '采收称重',
        },
        icone: Scale,
        formulario: 'F-07',
      },
      {
        para: '/monitorizacao',
        rotulo: { pt: 'Monitorização', en: 'Monitoring', zh: '监测' },
        titulo: {
          pt: 'Monitorização fitossanitária',
          en: 'Plant-health monitoring',
          zh: '植保监测',
        },
        icone: Bug,
        formulario: 'F-12',
      },
      {
        para: '/observacoes',
        rotulo: { pt: 'Observações', en: 'Observations', zh: '观察' },
        titulo: {
          pt: 'Observações de campo',
          en: 'Field observations',
          zh: '田间观察',
        },
        icone: Binoculars,
        formulario: 'F-13',
      },
    ],
  },
  {
    chave: 'pessoas',
    rotulo: { pt: 'Pessoas', en: 'People', zh: '人员' },
    icone: UsersRound,
    cor: 'celeste',
    modulo: cod('M3'),
    ecras: [
      {
        para: '/trabalhadores',
        rotulo: { pt: 'Trabalhadores', en: 'Workers', zh: '工人' },
        titulo: { pt: 'Trabalhadores', en: 'Workers', zh: '工人' },
        icone: UsersRound,
        formulario: 'F-03',
      },
      {
        para: '/conformidade',
        rotulo: {
          pt: 'Conformidade laboral',
          en: 'Labour compliance',
          zh: '用工合规',
        },
        titulo: {
          pt: 'Conformidade laboral',
          en: 'Labour compliance',
          zh: '用工合规',
        },
        icone: ShieldCheck,
        formulario: '§8.2',
      },
    ],
  },
  {
    chave: 'medicao',
    rotulo: { pt: 'Resultados', en: 'Results', zh: '结果' },
    icone: ChartColumnBig,
    cor: 'azul',
    modulo: cod('M6'),
    ecras: [
      {
        para: '/indicadores',
        rotulo: { pt: 'Indicadores', en: 'Indicators', zh: '指标' },
        titulo: {
          pt: 'Catálogo de indicadores',
          en: 'Indicator catalogue',
          zh: '指标目录',
        },
        icone: ChartColumnBig,
        formulario: '§10',
      },
    ],
  },
  {
    chave: 'governacao',
    rotulo: { pt: 'Governação', en: 'Governance', zh: '治理' },
    icone: Landmark,
    cor: 'roxo',
    ecras: [
      {
        para: '/pendencias',
        rotulo: { pt: 'Pendências', en: 'Open questions', zh: '待决事项' },
        titulo: {
          pt: 'Pendências de parametrização',
          en: 'Open parameterisation questions',
          zh: '待决参数事项',
        },
        icone: AlertOctagon,
      },
      {
        para: '/sincronizacao',
        rotulo: { pt: 'Sincronização', en: 'Sync', zh: '同步' },
        titulo: {
          pt: 'Por sincronizar',
          en: 'Pending synchronisation',
          zh: '待同步',
        },
        icone: RefreshCw,
        formulario: '§25',
      },
      {
        para: '/parametros',
        rotulo: { pt: 'Parâmetros', en: 'Parameters', zh: '参数' },
        titulo: {
          pt: 'Parâmetros versionados',
          en: 'Versioned parameters',
          zh: '版本化参数',
        },
        icone: SlidersHorizontal,
        formulario: '§19.2',
      },
    ],
  },
];

export const ROTULO_PARAMETROS: T = {
  pt: 'Parâmetros versionados',
  en: 'Versioned parameters',
  zh: '版本化参数',
};
export const ROTULO_TRABALHADORES: T = { pt: 'Trabalhadores', en: 'Workers', zh: '工人' };

export const TODOS_ECRAS = GRUPOS.flatMap((g) => g.ecras.map((e) => ({ ...e, grupo: g })));

export function ecraActual(caminho: string) {
  const raiz = `/${caminho.split('/').filter(Boolean)[0] ?? ''}`;
  return TODOS_ECRAS.find((e) => e.para === raiz) ?? TODOS_ECRAS[0];
}

export const corDe = (g: Grupo): CorArea => CORES[g.cor];

/** A cor da área a que pertence uma rota. */
export function corDaRota(caminho: string): CorArea {
  return corDe(ecraActual(caminho).grupo);
}
