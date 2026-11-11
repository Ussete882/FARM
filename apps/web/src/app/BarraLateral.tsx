/**
 * BASTET — navegação lateral.
 *
 * Aberta, é a casa da marca: «BASTET · LHF Foundation» no topo, as sete áreas
 * com a sua cor, os ecrãs da área activa por baixo dela, e o projecto em
 * curso no fundo. Fechada, fica uma coluna de ícones com rótulo — o
 * arco-íris da fundação de cima a baixo. A escolha fica guardada no
 * navegador de cada pessoa.
 *
 * Nos ecrãs estreitos a mesma lista abre numa gaveta.
 */

import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  MapPin,
  Settings,
  UsersRound,
  X,
} from 'lucide-react';
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

import { useT } from '../i18n/contexto';
import { ListaIdiomas } from '../i18n/SelectorIdioma';
import { Marca, NomeMarca, Simbolo } from './Marca';
import {
  type CorArea,
  corDe,
  type Ecra,
  GRUPOS,
  type Grupo,
  ROTULO_PARAMETROS,
  ROTULO_TRABALHADORES,
} from './navegacao';

// ============================================================================
// Estado aberto/fechado, guardado no navegador
// ============================================================================

const CHAVE = 'bastet:barra-aberta';

export function useBarraAberta(): [boolean, (v: boolean) => void] {
  const [aberta, setAberta] = React.useState(() => {
    try {
      return localStorage.getItem(CHAVE) !== '0';
    } catch {
      return true;
    }
  });
  const definir = React.useCallback((v: boolean) => {
    setAberta(v);
    try {
      localStorage.setItem(CHAVE, v ? '1' : '0');
    } catch {
      /* Sem armazenamento, a escolha dura a sessão. */
    }
  }, []);
  return [aberta, definir];
}

// ============================================================================
// Ícone de área: o azulejo colorido
// ============================================================================

export function AzulejoArea({
  cor,
  icone: Icone,
  activo = false,
  tamanho = 'md',
}: {
  cor: CorArea;
  icone: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  activo?: boolean;
  tamanho?: 'sm' | 'md' | 'lg';
}) {
  const lado = { sm: 'size-8 rounded-[9px]', md: 'size-10 rounded-[11px]', lg: 'size-12 rounded-[13px]' }[tamanho];
  const icone = { sm: 'size-4', md: 'size-[19px]', lg: 'size-6' }[tamanho];
  return (
    <span
      className={`grid shrink-0 place-items-center transition-[background-color,color,box-shadow] duration-200 ${lado}`}
      style={
        activo
          ? { background: cor.base, color: cor.tinta, boxShadow: `0 6px 14px -6px ${cor.base}` }
          : { background: cor.suave, color: cor.escuro }
      }
    >
      <Icone className={icone} strokeWidth={activo ? 2.2 : 1.9} />
    </span>
  );
}

// ============================================================================
// Barra lateral (ecrãs largos)
// ============================================================================

export function BarraLateral({
  actual,
  aberta,
  aoAlternar,
}: {
  actual: Ecra & { grupo: Grupo };
  aberta: boolean;
  aoAlternar: () => void;
}) {
  const tr = useT();
  const navegar = useNavigate();
  const rotuloAlternar = aberta
    ? tr({ pt: 'Recolher barra lateral', en: 'Collapse sidebar', zh: '收起侧栏' })
    : tr({ pt: 'Expandir barra lateral', en: 'Expand sidebar', zh: '展开侧栏' });

  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-fio bg-cartao transition-[width] duration-300 ease-out lg:flex ${
        aberta ? 'w-[264px]' : 'w-[88px]'
      }`}
    >
      {/* --- Marca --- */}
      <div className={`flex items-center pb-3 pt-5 ${aberta ? 'gap-2 px-5' : 'justify-center px-2'}`}>
        <button
          onClick={() => navegar('/')}
          aria-label={tr({ pt: 'Ir para o início', en: 'Go home', zh: '返回首页' })}
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <Simbolo className={aberta ? 'size-12' : 'size-11'} />
          {aberta && <NomeMarca grande />}
        </button>
      </div>

      {/* --- Áreas --- */}
      <nav
        aria-label={tr({ pt: 'Áreas', en: 'Areas', zh: '功能区' })}
        className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-3 pt-2 ${aberta ? 'px-3' : 'px-1.5'}`}
      >
        {aberta ? (
          <ListaAreas actual={actual} />
        ) : (
          <ul className="flex flex-col items-center gap-1">
            {GRUPOS.map((g) => {
              const activo = g.chave === actual.grupo.chave;
              return (
                <li key={g.chave}>
                  <button
                    onClick={() => navegar(g.ecras[0].para)}
                    title={tr(g.rotulo)}
                    aria-current={activo ? 'page' : undefined}
                    className="group flex w-[76px] flex-col items-center gap-1 rounded-xl py-1.5"
                  >
                    <AzulejoArea cor={corDe(g)} icone={g.icone} activo={activo} />
                    <span
                      className={`w-full truncate text-center text-[9.5px] font-bold uppercase leading-tight tracking-[0.04em] ${
                        activo ? 'text-texto' : 'text-texto-3 group-hover:text-texto'
                      }`}
                    >
                      {tr(g.rotulo)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      {/* --- Fundo: projecto, atalhos, recolher --- */}
      <div className={`flex flex-col gap-2 border-t border-fio py-3 ${aberta ? 'px-3' : 'items-center px-1.5'}`}>
        {aberta && <CartaoProjecto />}

        <div className={`flex ${aberta ? 'items-center gap-1' : 'flex-col items-center gap-1'}`}>
          <BotaoRodape
            icone={Settings}
            rotulo={tr({ pt: 'Parâmetros', en: 'Settings', zh: '参数' })}
            titulo={tr(ROTULO_PARAMETROS)}
            aberta={aberta}
            onClick={() => navegar('/parametros')}
          />
          <BotaoRodape
            icone={UsersRound}
            rotulo={tr({ pt: 'Equipa', en: 'Staff', zh: '人员' })}
            titulo={tr(ROTULO_TRABALHADORES)}
            aberta={aberta}
            onClick={() => navegar('/trabalhadores')}
          />
          <BotaoRodape
            icone={aberta ? ChevronsLeft : ChevronsRight}
            rotulo={aberta ? tr({ pt: 'Recolher', en: 'Collapse', zh: '收起' }) : tr({ pt: 'Abrir', en: 'Expand', zh: '展开' })}
            titulo={rotuloAlternar}
            aberta={aberta}
            onClick={aoAlternar}
            empurrar
          />
        </div>
      </div>
    </aside>
  );
}

function BotaoRodape({
  icone: Icone,
  rotulo,
  titulo,
  aberta,
  onClick,
  empurrar = false,
}: {
  icone: React.ComponentType<{ className?: string }>;
  rotulo: string;
  titulo: string;
  aberta: boolean;
  onClick: () => void;
  /** Encosta à direita, quando a barra está aberta. */
  empurrar?: boolean;
}) {
  if (aberta) {
    return (
      <button
        onClick={onClick}
        title={titulo}
        aria-label={titulo}
        className={`grid size-9 place-items-center rounded-[10px] text-texto-3 transition-colors hover:bg-bloco hover:text-texto ${empurrar ? 'ml-auto' : ''}`}
      >
        <Icone className="size-[18px]" />
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      title={titulo}
      aria-label={titulo}
      className="group flex w-[76px] flex-col items-center gap-0.5 rounded-xl py-0.5"
    >
      <span className="grid size-9 place-items-center rounded-[10px] text-texto-3 transition-colors group-hover:bg-bloco group-hover:text-texto">
        <Icone className="size-[18px]" />
      </span>
      {/* Fechada, só o botão de abrir leva rótulo: os atalhos têm dica. */}
      {empurrar && (
        <span className="text-[9px] font-bold uppercase tracking-[0.04em] text-texto-3 group-hover:text-texto">
          {rotulo}
        </span>
      )}
    </button>
  );
}

/** O projecto em que se está a trabalhar, com a faixa da fundação por cima. */
function CartaoProjecto() {
  const tr = useT();
  return (
    <div className="overflow-hidden rounded-[10px] bg-bloco">
      <div className="px-3 py-2.5">
        <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-texto-3">
          {tr({ pt: 'Projecto A', en: 'Project A', zh: '项目 A' })}
        </div>
        <div className="mt-0.5 text-[13px] font-bold text-texto">Farma Alcinda</div>
        <div className="mt-0.5 flex items-center gap-1 text-[11.5px] text-texto-2">
          <MapPin className="size-3" />
          {tr({ pt: 'Vanduzi, Manica', en: 'Vanduzi, Manica', zh: '万杜兹，马尼卡' })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Lista de áreas com os ecrãs — barra aberta e gaveta
// ============================================================================

function ListaAreas({ actual, todas = false }: { actual: Ecra & { grupo: Grupo }; todas?: boolean }) {
  const tr = useT();
  const navegar = useNavigate();

  return (
    <ul className="flex flex-col gap-0.5">
      {GRUPOS.map((g) => {
        const cor = corDe(g);
        const activo = g.chave === actual.grupo.chave;
        const mostrar = todas || activo;
        return (
          <li key={g.chave}>
            <button
              onClick={() => navegar(g.ecras[0].para)}
              aria-current={activo ? 'page' : undefined}
              className={`flex w-full items-center gap-3 rounded-[12px] px-2 py-1.5 text-left transition-colors ${
                activo ? '' : 'hover:bg-bloco'
              }`}
              style={activo ? { background: cor.suave } : undefined}
            >
              <AzulejoArea cor={cor} icone={g.icone} activo={activo} tamanho="sm" />
              <span className={`min-w-0 flex-1 truncate text-[13.5px] ${activo ? 'font-bold text-texto' : 'font-semibold text-texto-2'}`}>
                {tr(g.rotulo)}
              </span>
              {g.modulo && <span className="codigo shrink-0">{tr(g.modulo)}</span>}
              {g.ecras.length > 1 && !todas && (
                <ChevronDown
                  className={`size-3.5 shrink-0 text-texto-3 transition-transform ${activo ? '' : '-rotate-90'}`}
                />
              )}
            </button>

            {mostrar && g.ecras.length > 1 && (
              <ul className="mb-1.5 ml-[23px] mt-1 flex flex-col gap-px border-l-2 pl-2.5" style={{ borderColor: cor.base }}>
                {g.ecras.map((e) => (
                  <li key={e.para}>
                    <NavLink
                      to={e.para}
                      end={e.para === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 rounded-[9px] px-2 py-1.5 text-[12.5px] transition-colors ${
                          isActive || e.para === actual.para
                            ? 'bg-bloco font-semibold text-texto'
                            : 'text-texto-2 hover:bg-bloco hover:text-texto'
                        }`
                      }
                    >
                      <e.icone className="size-[15px] shrink-0" style={{ color: cor.escuro }} />
                      <span className="min-w-0 flex-1 truncate">{tr(e.rotulo)}</span>
                      {e.formulario && <span className="codigo shrink-0">{e.formulario}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ============================================================================
// Gaveta (ecrãs estreitos)
// ============================================================================

export function Gaveta({
  actual,
  aoFechar,
}: {
  actual: Ecra & { grupo: Grupo };
  aoFechar: () => void;
}) {
  const tr = useT();
  return (
    <div className="fixed inset-0 z-50 flex lg:hidden" onClick={aoFechar}>
      <div className="absolute inset-0 bg-texto/40" />
      <aside
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full w-[300px] max-w-[86vw] flex-col bg-cartao"
      >
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <Marca tamanho="lg" comNome />
          <button
            onClick={aoFechar}
            aria-label={tr({ pt: 'Fechar menu', en: 'Close menu', zh: '关闭菜单' })}
            className="grid size-9 place-items-center rounded-[10px] text-texto-3 hover:bg-bloco hover:text-texto"
          >
            <X className="size-4" />
          </button>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-2">
          <ListaAreas actual={actual} todas />
          <div className="mt-4 border-t border-fio pt-3">
            <ListaIdiomas />
          </div>
        </nav>
        <div className="border-t border-fio p-3">
          <CartaoProjecto />
        </div>
      </aside>
    </div>
  );
}
