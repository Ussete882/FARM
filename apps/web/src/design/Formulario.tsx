/**
 * BASTET — invólucro e controlos de formulário.
 *
 * Todos os formulários de campo obedecem ao §25: máximo de sete campos por
 * ecrã, listas em vez de texto livre, valores por omissão inteligentes, e
 * nenhum pode exigir mais de 3 minutos. O cronómetro está aqui e não em cada
 * formulário porque é uma regra do sistema, não uma decoração de um ecrã.
 *
 * A verificação corre a cada tecla e mostra o que falta *antes* de o
 * utilizador tentar gravar — R2: «registo incompleto é rejeitado na entrada,
 * não corrigido depois».
 */

import { Check, Timer, X } from 'lucide-react';
import React from 'react';

import { useFmt, useT } from '../i18n/contexto';
import type { T } from '@bastet/nucleo/i18n';
import type { Resultado } from '@bastet/nucleo/validacao';
import { Botao } from './Pagina';
import { Codigo, Constatacoes, Rotulo, Semaforo } from './primitivas';

// ============================================================================
// Invólucro
// ============================================================================

export function Formulario({
  titulo,
  formulario,
  codigo,
  validacao,
  aoGravar,
  aoFechar,
  gravado,
  erro,
  children,
  /** Segundos que o §25 admite. Zero desliga o cronómetro. */
  limiteSegundos = 180,
}: {
  titulo: string;
  formulario: string;
  codigo: string;
  validacao: Resultado;
  aoGravar: () => void | Promise<void>;
  aoFechar: () => void;
  /** Código do registo gravado, se já foi. */
  gravado?: string | null;
  erro?: string | null;
  children: React.ReactNode;
  limiteSegundos?: number;
}) {
  const tr = useT();
  const fmt = useFmt();
  const [inicio] = React.useState(() => performance.now());
  const [decorrido, setDecorrido] = React.useState(0);

  React.useEffect(() => {
    if (!limiteSegundos) return;
    const id = window.setInterval(() => setDecorrido((performance.now() - inicio) / 1000), 1000);
    return () => window.clearInterval(id);
  }, [inicio, limiteSegundos]);

  if (gravado) {
    return (
      <section className="cartao flex flex-col items-start gap-3 p-6">
        <Semaforo
          cor="verde"
          rotulo={tr({ pt: 'Registo entregue', en: 'Record submitted', zh: '记录已提交' })}
        />
        <h3 className="text-[16px] font-bold text-texto">
          {tr({
            pt: `${formulario} gravado como`,
            en: `${formulario} saved as`,
            zh: `${formulario} 已保存为`,
          })}{' '}
          <Codigo forte>{gravado}</Codigo>
        </h3>
        {limiteSegundos > 0 && (
          <p className="text-[12.5px] text-texto-2">
            {tr({
              pt: `Preenchido em ${fmt.numero(decorrido, 0)} segundos.`,
              en: `Filled in in ${fmt.numero(decorrido, 0)} seconds.`,
              zh: `用时 ${fmt.numero(decorrido, 0)} 秒填写完成。`,
            })}{' '}
            {decorrido <= limiteSegundos ? (
              <span className="text-verde">
                {tr({
                  pt: `Dentro dos ${limiteSegundos / 60} minutos exigidos pelo §25.`,
                  en: `Within the ${limiteSegundos / 60} minutes required by §25.`,
                  zh: `符合 §25 规定的 ${limiteSegundos / 60} 分钟要求。`,
                })}
              </span>
            ) : (
              <span className="text-ambar">
                {tr({
                  pt: `Acima dos ${limiteSegundos / 60} minutos do §25 — o formulário está errado, não quem o preenche.`,
                  en: `Over the ${limiteSegundos / 60} minutes of §25 — the form is wrong, not the person filling it in.`,
                  zh: `超过 §25 规定的 ${limiteSegundos / 60} 分钟——问题出在表单，而不是填表的人。`,
                })}
              </span>
            )}
          </p>
        )}
        <Botao onClick={aoFechar}>{tr({ pt: 'Fechar', en: 'Close', zh: '关闭' })}</Botao>
      </section>
    );
  }

  const excedeu = limiteSegundos > 0 && decorrido > limiteSegundos;
  const aMeio = limiteSegundos > 0 && decorrido > limiteSegundos * 0.66;

  return (
    <section className="cartao overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-fio px-5 py-4">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <h3 className="text-[16px] font-bold text-texto">{titulo}</h3>
          <Codigo forte>{formulario}</Codigo>
          <Codigo>{codigo}</Codigo>
        </div>

        <div className="flex items-center gap-3">
          {limiteSegundos > 0 && (
            <span
              className={`num flex items-center gap-1.5 text-[12px] ${
                excedeu ? 'text-vermelho' : aMeio ? 'text-ambar' : 'text-texto-3'
              }`}
              title={tr({
                pt: `§25 — nenhum formulário de campo pode exigir mais de ${limiteSegundos / 60} minutos`,
                en: `§25 — no field form may take more than ${limiteSegundos / 60} minutes`,
                zh: `§25 — 任何田间表单填写时间不得超过 ${limiteSegundos / 60} 分钟`,
              })}
            >
              <Timer className="size-3.5" />
              {String(Math.floor(decorrido / 60)).padStart(2, '0')}:
              {String(Math.floor(decorrido % 60)).padStart(2, '0')}
              <span className="text-texto-3">
                / {String(Math.floor(limiteSegundos / 60)).padStart(2, '0')}:00
              </span>
            </span>
          )}
          <button
            onClick={aoFechar}
            aria-label={tr({ pt: 'Fechar formulário', en: 'Close form', zh: '关闭表单' })}
            className="botao-abrir"
            title={tr({ pt: 'Fechar', en: 'Close', zh: '关闭' })}
          >
            <X className="size-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-5 px-5 py-5">
        {children}

        {erro && (
          <p className="bg-vermelho-pastel rounded-xl px-4 py-3 text-[12.5px] text-vermelho">
            {erro}
          </p>
        )}

        {validacao.constatacoes.length > 0 && (
          <div>
            <Rotulo className="mb-2">
              {tr({ pt: 'Verificação', en: 'Checks', zh: '校验' })}
            </Rotulo>
            <Constatacoes lista={validacao.constatacoes} />
          </div>
        )}
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-fio px-5 py-4">
        <span className="text-[12px] text-texto-3">
          {validacao.gravavel
            ? validacao.pendenteAprovacao
              ? tr({
                  pt: 'Grava, mas fica pendente de aprovação de nível superior.',
                  en: 'Saves, but is held pending approval from the level above.',
                  zh: '可保存，但须待上级批准。',
                })
              : tr({ pt: 'Pronto a gravar.', en: 'Ready to save.', zh: '可以保存。' })
            : tr({
                pt: 'Corrija o que está assinalado para poder gravar.',
                en: 'Correct what is flagged before saving.',
                zh: '请先更正标记项，方可保存。',
              })}
        </span>
        <div className="flex items-center gap-2">
          <Botao onClick={aoFechar}>{tr({ pt: 'Cancelar', en: 'Cancel', zh: '取消' })}</Botao>
          <Botao variante="primario" onClick={aoGravar} disabled={!validacao.gravavel}>
            <Check className="size-3.5" />
            {tr({ pt: 'Gravar', en: 'Save', zh: '保存' })}
          </Botao>
        </div>
      </footer>
    </section>
  );
}

// ============================================================================
// Controlos
// ============================================================================

export function Grelha({ children, colunas = 3 }: { children: React.ReactNode; colunas?: number }) {
  const cls =
    colunas === 2
      ? 'grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2'
      : colunas === 4
        ? 'grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4'
        : 'grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3';
  return <div className={cls}>{children}</div>;
}

export function Campo({
  rotulo,
  nota,
  largo,
  children,
}: {
  rotulo: string;
  nota?: React.ReactNode;
  largo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={largo ? 'sm:col-span-2 lg:col-span-3' : ''}>
      <label className="mb-1.5 block text-[12px] font-medium text-texto-2">{rotulo}</label>
      {children}
      {nota && <p className="mt-1.5 text-[11.5px] leading-snug text-texto-3">{nota}</p>}
    </div>
  );
}

const CONTROLO =
  'h-10 w-full rounded-xl bg-bloco px-3.5 text-[13px] text-texto outline-none transition-colors focus:bg-bloco-2';

export function Seleccao({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={CONTROLO}>
      {children}
    </select>
  );
}

export function Numero({
  valor,
  aoMudar,
  sugestao,
  passo = 'any',
  sufixo,
}: {
  valor: number | '';
  aoMudar: (v: number | '') => void;
  sugestao?: number;
  passo?: string | number;
  sufixo?: string;
}) {
  const tr = useT();
  const fmt = useFmt();
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          type="number"
          step={passo}
          value={valor}
          placeholder={sugestao !== undefined ? String(sugestao) : ''}
          onChange={(e) => aoMudar(e.target.value === '' ? '' : Number(e.target.value))}
          className={`num ${CONTROLO} ${sufixo ? 'pr-12' : ''}`}
        />
        {sufixo && (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] text-texto-3">
            {sufixo}
          </span>
        )}
      </div>
      {sugestao !== undefined && valor === '' && (
        <button
          onClick={() => aoMudar(sugestao)}
          className="shrink-0 rounded-full bg-bloco px-3 py-2 text-[11.5px] text-texto-2 hover:bg-bloco-2 hover:text-texto"
        >
          {tr({ pt: 'usar', en: 'use', zh: '采用' })} {fmt.numero(sugestao, 1)}
        </button>
      )}
    </div>
  );
}

export function Texto({
  valor,
  aoMudar,
  sugestao,
  linhas = 2,
}: {
  valor: string;
  aoMudar: (v: string) => void;
  sugestao?: string;
  linhas?: number;
}) {
  return (
    <textarea
      value={valor}
      rows={linhas}
      placeholder={sugestao}
      onChange={(e) => aoMudar(e.target.value)}
      className="w-full rounded-xl bg-bloco px-3.5 py-2.5 text-[13px] leading-relaxed text-texto outline-none transition-colors focus:bg-bloco-2"
    />
  );
}

/** Escolha entre poucas opções — listas em vez de texto livre (§25). */
export function Pastilhas<V extends string>({
  opcoes,
  valor,
  aoMudar,
  rotulos,
}: {
  opcoes: readonly V[];
  valor: V | undefined;
  aoMudar: (v: V) => void;
  rotulos: Record<string, T>;
}) {
  const tr = useT();
  return (
    <div className="flex flex-wrap gap-1.5">
      {opcoes.map((o) => (
        <button
          key={o}
          onClick={() => aoMudar(o)}
          className={`rounded-full px-3 py-2 text-[12px] transition-colors ${
            valor === o
              ? 'bg-texto font-semibold text-white'
              : 'bg-bloco text-texto-2 hover:bg-bloco-2 hover:text-texto'
          }`}
        >
          {rotulos[o] ? tr(rotulos[o]) : o}
        </button>
      ))}
    </div>
  );
}

/** Valor derivado, mostrado mas não editável — o desvio nunca se escreve. */
export function Derivado({ children, nota }: { children: React.ReactNode; nota?: string }) {
  return (
    <div>
      <div className="num flex h-10 items-center text-[16px] font-semibold text-texto">
        {children}
      </div>
      {nota && <p className="mt-1 text-[11.5px] text-texto-3">{nota}</p>}
    </div>
  );
}
