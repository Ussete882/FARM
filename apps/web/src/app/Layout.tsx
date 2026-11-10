/**
 * BASTET — estrutura de ecrã.
 *
 * Barra lateral estreita só de ícones, com o grupo activo a escuro, e um
 * cabeçalho claro com a marca, o título e as acções. O conteúdo vive em
 * cartões brancos sobre a tela cinzenta.
 *
 * Cinco separadores não chegam para dezasseis ecrãs: os ícones da barra são os
 * seis grupos do §2.1, e os ecrãs de cada grupo abrem em separadores por baixo
 * do título.
 */

import {
  AlertOctagon,
  Box,
  ChevronDown,
  Bug,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Droplets,
  Eye,
  FileText,
  Landmark,
  LayoutGrid,
  Leaf,
  type LucideIcon,
  Map,
  MapPin,
  Menu,
  PieChart,
  Plus,
  RefreshCw,
  Scale,
  Search,
  Settings,
  Sprout,
  TreeDeciduous,
  User,
  Users,
  X,
} from 'lucide-react';
import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { HOJE } from '../dados/semente';
import { useFmt, useT } from '../i18n/contexto';
import type { T } from '@bastet/nucleo/i18n';
import { ListaIdiomas, SelectorIdioma } from '../i18n/SelectorIdioma';
import { FaixaFluxo, PASSOS } from './Fluxo';
import { Marca } from './Marca';
import { Pesquisa } from './Pesquisa';

interface Ecra {
  para: string;
  rotulo: T;
  icone: LucideIcon;
  formulario?: string;
  titulo: T;
}

interface Grupo {
  chave: string;
  rotulo: T;
  icone: LucideIcon;
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
    icone: LayoutGrid,
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
        icone: LayoutGrid,
        formulario: '§11.1',
      },
    ],
  },
  {
    chave: 'cadastro',
    rotulo: { pt: 'Terrenos', en: 'Land', zh: '地块' },
    icone: Leaf,
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
        icone: Map,
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
        icone: Box,
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
    icone: ClipboardList,
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
        icone: ClipboardList,
        formulario: 'E-10',
      },
    ],
  },
  {
    chave: 'execucao',
    rotulo: { pt: 'Campo', en: 'Field', zh: '田间' },
    icone: FileText,
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
        icone: FileText,
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
        icone: Eye,
        formulario: 'F-13',
      },
    ],
  },
  {
    chave: 'pessoas',
    rotulo: { pt: 'Pessoas', en: 'People', zh: '人员' },
    icone: Users,
    modulo: cod('M3'),
    ecras: [
      {
        para: '/trabalhadores',
        rotulo: { pt: 'Trabalhadores', en: 'Workers', zh: '工人' },
        titulo: { pt: 'Trabalhadores', en: 'Workers', zh: '工人' },
        icone: Users,
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
        icone: AlertOctagon,
        formulario: '§8.2',
      },
    ],
  },
  {
    chave: 'medicao',
    rotulo: { pt: 'Resultados', en: 'Results', zh: '结果' },
    icone: PieChart,
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
        icone: PieChart,
        formulario: '§10',
      },
    ],
  },
  {
    chave: 'governacao',
    rotulo: { pt: 'Governação', en: 'Governance', zh: '治理' },
    icone: Landmark,
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
        icone: Landmark,
        formulario: '§19.2',
      },
    ],
  },
];

const ROTULO_PARAMETROS: T = {
  pt: 'Parâmetros versionados',
  en: 'Versioned parameters',
  zh: '版本化参数',
};
const ROTULO_TRABALHADORES: T = { pt: 'Trabalhadores', en: 'Workers', zh: '工人' };

const TODOS_ECRAS = GRUPOS.flatMap((g) => g.ecras.map((e) => ({ ...e, grupo: g })));

function ecraActual(caminho: string) {
  const raiz = `/${caminho.split('/').filter(Boolean)[0] ?? ''}`;
  return TODOS_ECRAS.find((e) => e.para === raiz) ?? TODOS_ECRAS[0];
}

export function Layout() {
  const tr = useT();
  const fmt = useFmt();
  const [pesquisaAberta, setPesquisaAberta] = React.useState(false);
  const [menuAberto, setMenuAberto] = React.useState(false);
  const local = useLocation();
  const navegar = useNavigate();

  const actual = ecraActual(local.pathname);
  const codigoObjecto = decodeURIComponent(local.pathname.split('/').filter(Boolean)[1] ?? '');

  React.useEffect(() => setMenuAberto(false), [local.pathname]);

  React.useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPesquisaAberta((v) => !v);
      }
      if (e.key === 'Escape') {
        setPesquisaAberta(false);
        setMenuAberto(false);
      }
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, []);

  return (
    <div className="flex min-h-screen bg-tela text-texto">
      {/* ================= Barra lateral: ícone e rótulo ================= */}
      <aside className="sticky top-0 hidden h-screen w-[84px] shrink-0 flex-col items-center gap-1.5 overflow-y-auto py-4 lg:flex">
        {GRUPOS.map((g) => {
          const activo = g.chave === actual.grupo.chave;
          return (
            <BotaoLateral
              key={g.chave}
              activo={activo}
              icone={g.icone}
              rotulo={tr(g.rotulo)}
              onClick={() => navegar(g.ecras[0].para)}
            />
          );
        })}

        <div className="flex-1" />

        <BotaoLateral
          icone={Settings}
          rotulo={tr({ pt: 'Parâmetros', en: 'Settings', zh: '参数' })}
          titulo={tr(ROTULO_PARAMETROS)}
          onClick={() => navegar('/parametros')}
        />
        <BotaoLateral
          icone={User}
          rotulo={tr({ pt: 'Equipa', en: 'Staff', zh: '人员' })}
          titulo={tr(ROTULO_TRABALHADORES)}
          onClick={() => navegar('/trabalhadores')}
        />
      </aside>

      {/* ================= Coluna principal ================= */}
      <div className="flex min-w-0 flex-1 flex-col gap-4 px-4 py-4 lg:pl-0">
        {/* --- Cabeçalho --- */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3.5">
            <button
              onClick={() => setMenuAberto(true)}
              aria-label={tr({ pt: 'Abrir menu', en: 'Open menu', zh: '打开菜单' })}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-cartao text-texto-2 lg:hidden"
            >
              <Menu className="size-[18px]" />
            </button>

            <button
              onClick={() => navegar('/')}
              aria-label={tr({
                pt: 'Ir para o painel diário',
                en: 'Go to the daily panel',
                zh: '前往每日看板',
              })}
              className="hidden lg:block"
            >
              <Marca />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-[26px] font-bold leading-tight tracking-[-0.02em] text-texto sm:text-[30px]">
                {tr(actual.titulo)}
              </h1>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-texto-3">
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {tr({
                    pt: 'Farma Alcinda · Vanduzi, Manica',
                    en: 'Farma Alcinda · Vanduzi, Manica',
                    zh: 'Farma Alcinda · 万杜兹，马尼卡',
                  })}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  {fmt.diaDaSemana(HOJE)}, {fmt.dataExtenso(HOJE)}
                </span>
                {actual.formulario && <span className="codigo">{actual.formulario}</span>}
                {codigoObjecto && (
                  <span className="rounded-full bg-bloco px-2 py-0.5 font-mono text-[11px] text-texto-2">
                    {codigoObjecto}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setPesquisaAberta(true)}
              title={tr({
                pt: 'Pesquisar registos (Ctrl K)',
                en: 'Search records (Ctrl K)',
                zh: '搜索记录（Ctrl K）',
              })}
              className="flex h-10 items-center gap-2 rounded-full bg-cartao px-4 text-[13px] font-medium text-texto-2 transition-colors hover:text-texto"
            >
              <Search className="size-4" />
              <span className="hidden sm:inline">
                {tr({ pt: 'Pesquisar', en: 'Search', zh: '搜索' })}
              </span>
            </button>

            <MenuCriar />

            <div className="hidden sm:block">
              <SelectorIdioma />
            </div>

            <div className="hidden items-center gap-2.5 rounded-full bg-cartao py-1 pl-1 pr-4 md:flex">
              <div className="grid size-8 place-items-center rounded-full bg-bloco-2 text-[11.5px] font-bold text-texto-2">
                AM
              </div>
              <div className="leading-tight">
                <div className="text-[12.5px] font-semibold text-texto">Alcinda Mabjaia</div>
                <div className="text-[11px] text-texto-3">
                  {tr({ pt: 'Gestora da Farma', en: 'Farm Manager', zh: '农场经理' })}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* --- Separadores do grupo activo --- */}
        {actual.grupo.ecras.length > 1 && (
          <nav className="flex flex-wrap items-center gap-1.5">
            {actual.grupo.ecras.map((e) => {
              const activo = e.para === actual.para;
              return (
                <NavLink
                  key={e.para}
                  to={e.para}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] transition-colors ${
                    activo
                      ? 'bg-texto font-semibold text-white'
                      : 'bg-cartao text-texto-2 hover:text-texto'
                  }`}
                >
                  <e.icone className="size-3.5" />
                  {tr(e.rotulo)}
                </NavLink>
              );
            })}
          </nav>
        )}

        <FaixaFluxo />

        <main className="min-w-0 flex-1 pb-4">
          <Outlet />
        </main>
      </div>

      {/* ================= Gaveta (ecrãs estreitos) ================= */}
      {menuAberto && (
        <div className="fixed inset-0 z-50 flex lg:hidden" onClick={() => setMenuAberto(false)}>
          <div className="absolute inset-0 bg-texto/40" />
          <aside
            onClick={(e) => e.stopPropagation()}
            className="relative flex h-full w-[280px] flex-col bg-cartao"
          >
            <div className="flex items-center justify-between px-4 py-4">
              <Marca tamanho="sm" />
              <button
                onClick={() => setMenuAberto(false)}
                aria-label={tr({ pt: 'Fechar menu', en: 'Close menu', zh: '关闭菜单' })}
                className="text-texto-3 hover:text-texto"
              >
                <X className="size-4" />
              </button>
            </div>
            <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
              {GRUPOS.map((g) => (
                <div key={g.chave} className="mb-4">
                  <div className="mb-1 flex items-baseline justify-between px-2.5">
                    <span className="rotulo">{tr(g.rotulo)}</span>
                    {g.modulo && <span className="codigo">{tr(g.modulo)}</span>}
                  </div>
                  {g.ecras.map((e) => (
                    <NavLink
                      key={e.para}
                      to={e.para}
                      end={e.para === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] transition-colors ${
                          isActive ? 'bg-bloco font-semibold text-texto' : 'text-texto-2 hover:bg-bloco'
                        }`
                      }
                    >
                      <e.icone className="size-4 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{tr(e.rotulo)}</span>
                      {e.formulario && <span className="codigo shrink-0">{e.formulario}</span>}
                    </NavLink>
                  ))}
                </div>
              ))}
              <ListaIdiomas />
            </nav>
          </aside>
        </div>
      )}

      <Pesquisa aberta={pesquisaAberta} aoFechar={() => setPesquisaAberta(false)} />
    </div>
  );
}

function BotaoLateral({
  icone: Icone,
  rotulo,
  titulo,
  activo = false,
  onClick,
}: {
  icone: LucideIcon;
  rotulo: string;
  titulo?: string;
  activo?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={titulo ?? rotulo}
      aria-current={activo ? 'page' : undefined}
      className="group flex w-[76px] flex-col items-center gap-1 rounded-2xl py-1"
    >
      <span
        className={`grid size-10 place-items-center rounded-2xl transition-colors ${
          activo
            ? 'bg-texto text-white'
            : 'bg-cartao text-texto-2 group-hover:bg-bloco-2 group-hover:text-texto'
        }`}
      >
        <Icone className="size-[18px]" />
      </span>
      <span
        className={`w-full truncate text-center text-[10.5px] leading-tight ${
          activo ? 'font-semibold text-texto' : 'text-texto-2 group-hover:text-texto'
        }`}
      >
        {rotulo}
      </span>
    </button>
  );
}

/**
 * O botão «Criar» do cabeçalho. Abre os passos do fluxo pela ordem em que se
 * fazem — terreno, tarefa, presenças, execução, colheita — e cada um leva
 * directamente ao formulário.
 */
function MenuCriar() {
  const tr = useT();
  const navegar = useNavigate();
  const [aberto, setAberto] = React.useState(false);
  const raiz = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false);
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('keydown', esc);
    };
  }, [aberto]);

  const passos = PASSOS.filter((p) => p.chave !== 'resultados');

  return (
    <div ref={raiz} className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-haspopup="menu"
        aria-label={tr({ pt: 'Criar', en: 'Create', zh: '新建' })}
        className="flex h-10 items-center gap-2 rounded-full bg-texto px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
      >
        <Plus className="size-4" />
        <span className="hidden sm:inline">{tr({ pt: 'Criar', en: 'Create', zh: '新建' })}</span>
        <ChevronDown className="hidden size-3.5 sm:block" />
      </button>
      {aberto && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-[300px] max-w-[calc(100vw-32px)] rounded-2xl bg-cartao p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.14)]"
        >
          <div className="px-2.5 pb-1 pt-1.5 text-[11px] text-texto-3">
            {tr({
              pt: 'Pela ordem do fluxo de trabalho',
              en: 'In workflow order',
              zh: '按工作流程顺序',
            })}
          </div>
          {passos.map((p, i) => (
            <button
              key={p.chave}
              role="menuitem"
              onClick={() => {
                setAberto(false);
                navegar(`${p.para}?novo=1`);
              }}
              className="flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-bloco"
            >
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-bloco-2 text-[11px] font-bold text-texto-2">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-[13px] font-semibold text-texto">
                  <p.icone className="size-3.5" />
                  {tr(p.accao)}
                </span>
                <span className="block text-[11.5px] leading-snug text-texto-3">
                  {tr(p.explicacao)}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
