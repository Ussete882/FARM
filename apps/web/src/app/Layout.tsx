/**
 * BASTET — estrutura de ecrã.
 *
 * À esquerda, a navegação (ver `BarraLateral`): aberta mostra a marca e as
 * áreas com os seus ecrãs; fechada, uma coluna de ícones com rótulo. Ao
 * centro, um cabeçalho com o ícone da área na sua cor, o título, e por baixo
 * os separadores dos ecrãs da área. O conteúdo vive em cartões brancos sobre
 * a tela.
 */

import { CalendarDays, ChevronDown, MapPin, Menu, Plus, Search } from 'lucide-react';
import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { HOJE } from '../dados/semente';
import { useFmt, useT } from '../i18n/contexto';
import { SelectorIdioma } from '../i18n/SelectorIdioma';
import { AzulejoArea, BarraLateral, Gaveta, useBarraAberta } from './BarraLateral';
import { FaixaFluxo, PASSOS } from './Fluxo';
import { corDe, ecraActual } from './navegacao';
import { Pesquisa } from './Pesquisa';

export function Layout() {
  const tr = useT();
  const fmt = useFmt();
  const [pesquisaAberta, setPesquisaAberta] = React.useState(false);
  const [menuAberto, setMenuAberto] = React.useState(false);
  const local = useLocation();
  const [barraAberta, setBarraAberta] = useBarraAberta();

  const actual = ecraActual(local.pathname);
  const cor = corDe(actual.grupo);
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
    <div
      className="flex min-h-screen bg-tela text-texto"
      // A cor da área fica disponível para todo o conteúdo do ecrã.
      style={
        {
          '--area': cor.base,
          '--area-escuro': cor.escuro,
          '--area-suave': cor.suave,
        } as React.CSSProperties
      }
    >
      <BarraLateral
        actual={actual}
        aberta={barraAberta}
        aoAlternar={() => setBarraAberta(!barraAberta)}
      />

      {/* ================= Coluna principal ================= */}
      <div className="flex min-w-0 flex-1 flex-col gap-4 px-4 py-4 lg:px-6 lg:py-5">
        {/* --- Cabeçalho --- */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3.5">
            <button
              onClick={() => setMenuAberto(true)}
              aria-label={tr({ pt: 'Abrir menu', en: 'Open menu', zh: '打开菜单' })}
              className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-cartao text-texto-2 lg:hidden"
            >
              <Menu className="size-[18px]" />
            </button>

            <span className="hidden sm:block">
              <AzulejoArea cor={cor} icone={actual.icone} activo tamanho="lg" />
            </span>

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
              <div
                className="grid size-8 place-items-center rounded-full p-[2px]"
                style={{
                  background:
                    'conic-gradient(#ed1d23, #fea027, #f2e205, #3bbe4e, #4bc3ed, #4067ab, #873a93, #ed1d23)',
                }}
              >
                <span className="grid size-full place-items-center rounded-full bg-cartao text-[11px] font-bold text-texto">
                  AM
                </span>
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
                    activo ? 'font-bold' : 'bg-cartao text-texto-2 hover:text-texto'
                  }`}
                  style={activo ? { background: cor.base, color: cor.tinta } : undefined}
                >
                  <e.icone className="size-3.5" style={activo ? undefined : { color: cor.escuro }} />
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

      {menuAberto && <Gaveta actual={actual} aoFechar={() => setMenuAberto(false)} />}

      <Pesquisa aberta={pesquisaAberta} aoFechar={() => setPesquisaAberta(false)} />
    </div>
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
