/**
 * BASTET — primitivas de desenho.
 *
 * O princípio de fundo mantém-se: o mesmo esqueleto em todo o lado. Um talhão,
 * um trabalhador, uma ordem de trabalho e um lote são objectos canónicos
 * (§2.3), logo apresentam-se com os mesmos componentes.
 *
 * A cor aparece de duas maneiras, e só duas: um cartão preenchido no indicador
 * que importa, e pastilhas de estado. Fora disso não há cor — é o que faz o
 * semáforo do §9.3 continuar a significar alguma coisa.
 */

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Ban,
  Info,
  type LucideIcon,
  Minus,
  ShieldAlert,
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import { ROTULO_ESTADO, type Quantidade } from '@bastet/nucleo/canonico';
import { useFmt, useT } from '../i18n/contexto';
import type { T } from '@bastet/nucleo/i18n';
import type { Cor } from '@bastet/nucleo/semaforo';
import type { Constatacao, Severidade } from '@bastet/nucleo/validacao';

// ============================================================================
// Paleta do semáforo (§9.3)
// ============================================================================

interface EscalaCor {
  texto: string;
  pastel: string;
  solido: string;
  cheio: string;
  hex: string;
}

const ESCALA: Record<Cor, EscalaCor> = {
  verde: {
    texto: 'text-verde',
    pastel: 'bg-verde-pastel',
    solido: 'bg-verde-claro',
    cheio: 'bg-gradient-to-br from-verde-claro to-verde',
    hex: '#1f9d55',
  },
  ambar: {
    texto: 'text-ambar',
    pastel: 'bg-ambar-pastel',
    solido: 'bg-ambar-claro',
    cheio: 'bg-gradient-to-br from-ambar-claro to-ambar',
    hex: '#b8791b',
  },
  vermelho: {
    texto: 'text-vermelho',
    pastel: 'bg-vermelho-pastel',
    solido: 'bg-vermelho-claro',
    cheio: 'bg-gradient-to-br from-vermelho-claro to-vermelho',
    hex: '#cc3b3b',
  },
  cinzento: {
    texto: 'text-cinzento',
    pastel: 'bg-cinzento-pastel',
    solido: 'bg-cinzento',
    cheio: 'bg-gradient-to-br from-cinzento to-texto-2',
    hex: '#7c8383',
  },
};

export const corHex = (c: Cor) => ESCALA[c].hex;
export const corTexto = (c: Cor) => ESCALA[c].texto;

// ============================================================================
// Superfícies
// ============================================================================

export function Painel({
  titulo,
  descricao,
  accao,
  children,
  className = '',
  denso = false,
}: {
  titulo?: React.ReactNode;
  descricao?: React.ReactNode;
  accao?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  denso?: boolean;
}) {
  return (
    <section className={`cartao flex min-w-0 flex-col overflow-hidden ${className}`}>
      {(titulo || accao) && (
        <header className="flex items-start justify-between gap-4 px-5 pb-3 pt-4">
          <div className="min-w-0">
            {titulo && <h2 className="text-[15px] font-bold tracking-tight text-texto">{titulo}</h2>}
            {descricao && <p className="mt-1 text-[12px] leading-snug text-texto-3">{descricao}</p>}
          </div>
          {accao && <div className="shrink-0">{accao}</div>}
        </header>
      )}
      <div className={denso ? '' : 'px-5 pb-5'}>{children}</div>
    </section>
  );
}

export function Rotulo({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`rotulo ${className}`}>{children}</div>;
}

/** R4 — o código é um identificador imutável e lê-se como tal. */
export function Codigo({ children, forte = false }: { children: React.ReactNode; forte?: boolean }) {
  return <span className={`codigo ${forte ? 'text-texto-2' : ''}`}>{children}</span>;
}

export function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-10 text-[12.5px] text-texto-3">
      <Info className="size-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

/** Botão de abrir, no canto superior direito de um cartão. */
export function BotaoAbrir({ para, titulo }: { para: string; titulo?: string }) {
  const tr = useT();
  return (
    <Link
      to={para}
      className="botao-abrir"
      title={titulo}
      aria-label={titulo ?? tr({ pt: 'Abrir', en: 'Open', zh: '打开' })}
    >
      <ArrowUpRight className="size-4" />
    </Link>
  );
}

// ============================================================================
// Cartão de métrica — o bloco de topo dos ecrãs
// ============================================================================

export function CartaoMetrica({
  icone: Icone,
  rotulo,
  valor,
  unidade,
  legenda,
  frase,
  cor,
  destaque = false,
  para,
  codigo,
  abaixo,
}: {
  icone: LucideIcon;
  rotulo: string;
  valor: React.ReactNode;
  /** Fica pequena ao lado do número, como em «72 %». */
  unidade?: string;
  /** Pastilha ao lado do número: «Excelente», «Em alerta». */
  legenda?: string;
  /** O que o número significa. Duas linhas, no máximo. */
  frase?: React.ReactNode;
  cor: Cor;
  /** Um cartão preenchido a cor por ecrã, e só um. */
  destaque?: boolean;
  para?: string;
  codigo?: string;
  abaixo?: React.ReactNode;
}) {
  const e = ESCALA[cor];
  const cheio = destaque;

  return (
    <section
      className={`cartao flex min-w-0 flex-col justify-between overflow-hidden p-5 ${
        cheio ? `cartao-cheio ${e.cheio}` : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Icone className={`size-[18px] ${cheio ? 'text-white/85' : 'text-texto-3'}`} />
          <span className={`text-[13.5px] font-semibold ${cheio ? 'text-white' : 'text-texto'}`}>
            {rotulo}
          </span>
        </div>
        {para && <BotaoAbrir para={para} titulo={rotulo} />}
      </div>

      <div className="mt-7 flex flex-wrap items-baseline gap-x-2.5 gap-y-2">
        <span className={`display text-[46px] leading-none ${cheio ? 'text-white' : 'text-texto'}`}>
          {valor}
        </span>
        {unidade && (
          <span
            className={`text-[20px] font-medium ${cheio ? 'text-white/75' : 'text-texto-3'}`}
          >
            {unidade}
          </span>
        )}
        {legenda && (
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              cheio ? 'bg-white/25 text-white' : `${e.pastel} ${e.texto}`
            }`}
          >
            {legenda}
          </span>
        )}
      </div>

      {frase && (
        <p
          className={`mt-3 max-w-sm text-[11.5px] leading-relaxed ${
            cheio ? 'text-white/80' : 'text-texto-3'
          }`}
        >
          {frase}
        </p>
      )}
      {codigo && !cheio && (
        <div className="mt-2">
          <Codigo>{codigo}</Codigo>
        </div>
      )}
      {abaixo && <div className="mt-4">{abaixo}</div>}
    </section>
  );
}

// ============================================================================
// Pastilhas de estado
// ============================================================================

export function Semaforo({
  cor,
  rotulo,
  icone: Icone,
}: {
  cor: Cor;
  rotulo?: string;
  icone?: LucideIcon;
}) {
  const e = ESCALA[cor];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full ${e.pastel} px-2.5 py-1 text-[11.5px] font-semibold ${e.texto}`}
    >
      {Icone ? <Icone className="size-3.5" /> : <span className={`size-1.5 rounded-full ${e.solido}`} />}
      {rotulo ?? cor}
    </span>
  );
}

export function PontoSemaforo({ cor, titulo }: { cor: Cor; titulo?: string }) {
  return <span title={titulo} className={`inline-block size-2 rounded-full ${ESCALA[cor].solido}`} />;
}

export function Tendencia({
  direccao,
}: {
  direccao: 'a_melhorar' | 'a_piorar' | 'estavel' | 'sem_dados';
}) {
  if (direccao === 'sem_dados') return <span className="text-texto-3">—</span>;
  if (direccao === 'estavel') return <Minus className="size-3.5 text-texto-3" />;
  const Icone = direccao === 'a_melhorar' ? ArrowUp : ArrowDown;
  return <Icone className={`size-3.5 ${direccao === 'a_melhorar' ? 'text-verde' : 'text-vermelho'}`} />;
}

// ============================================================================
// Estado canónico (§2.4)
// ============================================================================

const COR_ESTADO: Record<string, Cor> = {
  activo: 'verde',
  concluido: 'verde',
  aprovado: 'verde',
  atingido: 'verde',
  em_vigor: 'verde',
  em_curso: 'ambar',
  planeado: 'cinzento',
  proposto: 'cinzento',
  em_preparacao: 'cinzento',
  em_pousio: 'cinzento',
  rascunho: 'cinzento',
  suspenso: 'ambar',
  periodo_probatorio: 'ambar',
  bloqueado: 'vermelho',
  rejeitado: 'vermelho',
  abandonado: 'vermelho',
  nao_atingido: 'vermelho',
  cessado: 'cinzento',
  materializado: 'vermelho',
};

export function EstadoBadge({ estado }: { estado: string }) {
  const tr = useT();
  const rotulo = ROTULO_ESTADO[estado];
  return <Semaforo cor={COR_ESTADO[estado] ?? 'cinzento'} rotulo={rotulo ? tr(rotulo) : estado} />;
}

// ============================================================================
// R3 — quantidade com unidade e base
// ============================================================================

export function CampoQuantidade({
  valor,
  casas,
  destaque = false,
}: {
  valor: Quantidade | undefined;
  casas?: number;
  destaque?: boolean;
}) {
  const fmt = useFmt();
  if (!valor) return <span className="text-texto-3">—</span>;
  return (
    <span className="num whitespace-nowrap">
      <span className={destaque ? 'text-[15px] font-semibold text-texto' : 'text-texto'}>
        {fmt.valorDe(valor, casas)}
      </span>
      <span className="ml-1 text-[11px] text-texto-3">
        {valor.unidade === 'percent' ? '%' : fmt.unidade(valor.unidade)}
      </span>
    </span>
  );
}

// ============================================================================
// Plano contra execução (§5.2)
// ============================================================================

export function PlanoVsExecucao({
  rotulo,
  previsto,
  real,
  desvio,
  sentido,
}: {
  rotulo: string;
  previsto: React.ReactNode;
  real: React.ReactNode;
  desvio: React.ReactNode;
  sentido: 'favoravel' | 'desfavoravel' | 'neutro';
}) {
  const cor =
    sentido === 'favoravel'
      ? 'text-verde'
      : sentido === 'desfavoravel'
        ? 'text-vermelho'
        : 'text-texto-3';
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-baseline gap-3 border-b border-fio py-2.5 last:border-0">
      <span className="text-[12.5px] text-texto-2">{rotulo}</span>
      <span className="num text-[12.5px] text-texto-3">{previsto}</span>
      <span className="num text-[12.5px] font-semibold text-texto">{real}</span>
      <span className={`num text-[12.5px] font-semibold ${cor}`}>{desvio}</span>
    </div>
  );
}

// ============================================================================
// Tabela
// ============================================================================

export interface Coluna<L> {
  chave: string;
  cabecalho: React.ReactNode;
  numerica?: boolean;
  largura?: string;
  render: (linha: L) => React.ReactNode;
  ordenarPor?: (linha: L) => string | number;
}

export function Tabela<L>({
  colunas,
  linhas,
  chave,
  aoClicar,
  vazio,
  activa,
}: {
  colunas: Coluna<L>[];
  linhas: L[];
  chave: (linha: L) => string;
  aoClicar?: (linha: L) => void;
  vazio?: React.ReactNode;
  activa?: (linha: L) => boolean;
}) {
  const tr = useT();
  const [ordem, setOrdem] = React.useState<{ chave: string; desc: boolean } | null>(null);

  const ordenadas = React.useMemo(() => {
    if (!ordem) return linhas;
    const col = colunas.find((c) => c.chave === ordem.chave);
    if (!col?.ordenarPor) return linhas;
    const f = col.ordenarPor;
    return [...linhas].sort((a, b) => {
      const va = f(a);
      const vb = f(b);
      const r = va < vb ? -1 : va > vb ? 1 : 0;
      return ordem.desc ? -r : r;
    });
  }, [linhas, ordem, colunas]);

  if (linhas.length === 0)
    return (
      <Vazio>
        {vazio ??
          tr({
            pt: 'Sem registos no período.',
            en: 'No records in the period.',
            zh: '本期无记录。',
          })}
      </Vazio>
    );

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr>
            {colunas.map((c) => (
              <th
                key={c.chave}
                style={c.largura ? { width: c.largura } : undefined}
                className={`sticky top-0 z-10 border-b border-fio bg-cartao px-4 py-2.5 text-[11.5px] font-medium text-texto-3 ${
                  c.numerica ? 'text-right' : 'text-left'
                } ${c.ordenarPor ? 'cursor-pointer select-none hover:text-texto' : ''}`}
                onClick={
                  c.ordenarPor
                    ? () =>
                        setOrdem((o) =>
                          o?.chave === c.chave
                            ? { chave: c.chave, desc: !o.desc }
                            : { chave: c.chave, desc: false },
                        )
                    : undefined
                }
              >
                {c.cabecalho}
                {ordem?.chave === c.chave && (
                  <span className="ml-1 text-texto">{ordem.desc ? '↓' : '↑'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ordenadas.map((linha) => (
            <tr
              key={chave(linha)}
              onClick={aoClicar ? () => aoClicar(linha) : undefined}
              className={`border-b border-fio transition-colors last:border-0 ${
                aoClicar ? 'cursor-pointer hover:bg-bloco' : ''
              } ${activa?.(linha) ? 'bg-bloco' : ''}`}
            >
              {colunas.map((c) => (
                <td
                  key={c.chave}
                  className={`px-4 py-3 align-middle text-texto ${
                    c.numerica ? 'num text-right' : 'text-left'
                  }`}
                >
                  {c.render(linha)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Constatações do motor de regras (§8.1)
// ============================================================================

const ICONE_SEVERIDADE: Record<Severidade, LucideIcon> = {
  bloqueante: Ban,
  aprovacao: ShieldAlert,
  aviso: AlertTriangle,
  excepcao: Info,
};

const COR_SEVERIDADE: Record<Severidade, Cor> = {
  bloqueante: 'vermelho',
  aprovacao: 'ambar',
  aviso: 'ambar',
  excepcao: 'cinzento',
};

const ROTULO_SEVERIDADE: Record<Severidade, T> = {
  bloqueante: { pt: 'Bloqueante', en: 'Blocking', zh: '阻断' },
  aprovacao: { pt: 'Aprovação obrigatória', en: 'Approval required', zh: '须经审批' },
  aviso: { pt: 'Aviso', en: 'Warning', zh: '警告' },
  excepcao: { pt: 'Excepção', en: 'Exception', zh: '例外' },
};

export function Constatacoes({ lista }: { lista: Constatacao[] }) {
  const tr = useT();
  if (lista.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      {lista.map((c, i) => (
        <li key={`${c.regra}-${i}`} className="bloco flex items-start gap-4 px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold leading-snug text-texto">
              {tr(c.mensagem)}
            </div>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2.5">
              <Codigo forte>{c.regra}</Codigo>
              {c.fundamento && (
                <span className="text-[11.5px] text-texto-3">{tr(c.fundamento)}</span>
              )}
              {c.aprova && (
                <span className="text-[11.5px] text-texto-3">
                  {tr({ pt: 'Aprova', en: 'Approver', zh: '审批人' })}: {c.aprova}
                </span>
              )}
            </div>
          </div>
          <Semaforo
            cor={COR_SEVERIDADE[c.severidade]}
            rotulo={tr(ROTULO_SEVERIDADE[c.severidade])}
            icone={ICONE_SEVERIDADE[c.severidade]}
          />
        </li>
      ))}
    </ul>
  );
}

// ============================================================================
// Linha de alerta
// ============================================================================

export function Alerta({
  titulo,
  detalhe,
  cor,
  etiqueta,
  icone,
  para,
}: {
  titulo: React.ReactNode;
  detalhe?: React.ReactNode;
  cor: Cor;
  etiqueta: string;
  icone?: LucideIcon;
  para?: string;
}) {
  const conteudo = (
    <div className="bloco flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-bloco-2">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold text-texto">{titulo}</div>
        {detalhe && <div className="mt-0.5 truncate text-[12px] text-texto-3">{detalhe}</div>}
      </div>
      <Semaforo cor={cor} rotulo={etiqueta} icone={icone} />
    </div>
  );
  return <li>{para ? <Link to={para}>{conteudo}</Link> : conteudo}</li>;
}

/** Compatibilidade com ecrãs que ainda usam a lista de excepções antiga. */
export function Excepcao({
  cor,
  titulo,
  detalhe,
  accao,
}: {
  cor: Cor;
  titulo: React.ReactNode;
  detalhe?: React.ReactNode;
  accao?: React.ReactNode;
}) {
  return (
    <li className="bloco mb-2 flex items-center gap-4 px-4 py-3.5 last:mb-0">
      <PontoSemaforo cor={cor} />
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-semibold leading-snug text-texto">{titulo}</div>
        {detalhe && <div className="mt-0.5 text-[11.5px] leading-snug text-texto-3">{detalhe}</div>}
      </div>
      {accao && <div className="shrink-0">{accao}</div>}
    </li>
  );
}

// ============================================================================
// Métrica simples, dentro de um painel
// ============================================================================

export function Metrica({
  rotulo,
  valor,
  unidade,
  nota,
  cor,
  codigo,
}: {
  rotulo: string;
  valor: React.ReactNode;
  unidade?: string;
  nota?: React.ReactNode;
  cor?: Cor;
  codigo?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline gap-2">
        <Rotulo>{rotulo}</Rotulo>
        {codigo && <Codigo>{codigo}</Codigo>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={`display text-[26px] leading-none ${cor ? ESCALA[cor].texto : 'text-texto'}`}
        >
          {valor}
        </span>
        {unidade && <span className="text-[13px] text-texto-3">{unidade}</span>}
      </div>
      {nota && <div className="text-[11.5px] leading-snug text-texto-3">{nota}</div>}
    </div>
  );
}

// ============================================================================
// Barras
// ============================================================================

export function Barra({ fraccao, cor = 'verde' }: { fraccao: number; cor?: Cor }) {
  const pct = Math.max(0, Math.min(1, fraccao)) * 100;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-bloco-2">
      <div
        className={`h-full rounded-full ${ESCALA[cor].solido} transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/**
 * Barra com a meta marcada. Mostra onde está o valor, onde está a meta, e o
 * que falta entre os dois — que é a única pergunta que interessa.
 */
export function BarraMeta({
  valor,
  meta,
  maximo,
  cor,
  rotuloValor,
  rotuloMeta,
  menorEhMelhor = false,
  claro = false,
}: {
  valor: number | undefined;
  meta: number;
  maximo?: number;
  cor: Cor;
  rotuloValor?: string;
  rotuloMeta?: string;
  menorEhMelhor?: boolean;
  /** Sobre um cartão preenchido a cor. */
  claro?: boolean;
}) {
  const tr = useT();
  const topo = maximo ?? Math.max(valor ?? 0, meta) * 1.25;
  const pctValor = valor === undefined ? 0 : Math.max(0, Math.min(1, valor / topo)) * 100;
  const pctMeta = Math.max(0, Math.min(1, meta / topo)) * 100;

  return (
    <div className="w-full">
      <div className={`relative h-1.5 w-full rounded-full ${claro ? 'bg-white/25' : 'bg-bloco-2'}`}>
        {valor !== undefined && (
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${
              claro ? 'bg-white' : ESCALA[cor].solido
            }`}
            style={{ width: `${pctValor}%` }}
          />
        )}
        <div
          className={`absolute -top-1 h-3.5 w-px ${claro ? 'bg-white/70' : 'bg-texto-3'}`}
          style={{ left: `${pctMeta}%` }}
          title={`${tr({ pt: 'Meta', en: 'Target', zh: '目标' })}: ${rotuloMeta ?? meta}`}
        />
      </div>
      <div className="mt-2 flex items-baseline justify-between text-[11.5px]">
        <span className={`num font-semibold ${claro ? 'text-white' : ESCALA[cor].texto}`}>
          {rotuloValor ?? valor ?? '—'}
        </span>
        <span className={`num ${claro ? 'text-white/70' : 'text-texto-3'}`}>
          {tr({ pt: 'meta', en: 'target', zh: '目标' })} {menorEhMelhor ? '≤' : '≥'}{' '}
          {rotuloMeta ?? meta}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Gráfico de área — séries no tempo, sem biblioteca
// ============================================================================

export interface Serie {
  nome: string;
  cor: string;
  valores: (number | undefined)[];
}

export function GraficoArea({
  series,
  etiquetas,
  maximo = 100,
  sufixo = '%',
  altura = 230,
}: {
  series: Serie[];
  etiquetas: string[];
  maximo?: number;
  sufixo?: string;
  altura?: number;
}) {
  const largura = 1000;
  const margemE = 48;
  const margemB = 26;
  const margemT = 10;
  const alturaUtil = altura - margemB - margemT;
  const n = etiquetas.length;

  const x = (i: number) => margemE + (i * (largura - margemE - 10)) / Math.max(1, n - 1);
  const y = (v: number) => margemT + alturaUtil - (Math.min(v, maximo) / maximo) * alturaUtil;

  // Escala com números redondos: quartos de 130 dão 33% e 98%, que ninguém lê.
  const passo = [5, 10, 20, 25, 50, 100].find((p) => maximo / p <= 6) ?? 100;
  const marcas: number[] = [];
  for (let v = 0; v <= maximo + 0.001; v += passo) marcas.push(v);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${largura} ${altura}`} className="w-full" style={{ height: altura }} role="img">
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`ga-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.cor} stopOpacity="0.24" />
              <stop offset="100%" stopColor={s.cor} stopOpacity="0.01" />
            </linearGradient>
          ))}
        </defs>

        {marcas.map((v) => {
          const yy = y(v);
          return (
            <g key={v}>
              <line x1={margemE} y1={yy} x2={largura - 10} y2={yy} stroke="#e6e8e8" strokeWidth="1" />
              <text x={margemE - 12} y={yy + 4} textAnchor="end" fontSize="12" fill="#909797">
                {v}
                {sufixo}
              </text>
            </g>
          );
        })}

        {series.map((s, si) => {
          const pontos = s.valores
            .map((v, i) => (v === undefined ? null : { x: x(i), y: y(v) }))
            .filter((p): p is { x: number; y: number } => p !== null);
          if (pontos.length < 2) return null;
          const linha = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
          const base = margemT + alturaUtil;
          const area = `${linha} L${pontos.at(-1)!.x},${base} L${pontos[0].x},${base} Z`;
          return (
            <g key={si}>
              <path d={area} fill={`url(#ga-${si})`} />
              <path
                d={linha}
                fill="none"
                stroke={s.cor}
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </g>
          );
        })}

        {etiquetas.map((e, i) => {
          const passo = Math.max(1, Math.ceil(n / 7));
          if (i % passo !== 0 && i !== n - 1) return null;
          return (
            <text key={i} x={x(i)} y={altura - 6} textAnchor="middle" fontSize="12" fill="#909797">
              {e}
            </text>
          );
        })}
      </svg>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        {series.map((s) => (
          <span key={s.nome} className="flex items-center gap-2 text-[12.5px] text-texto-2">
            <span className="size-2 rounded-full" style={{ background: s.cor }} />
            {s.nome}
          </span>
        ))}
      </div>
    </div>
  );
}
