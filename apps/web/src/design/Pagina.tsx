/**
 * BASTET — moldura de página e disposição lista/detalhe.
 *
 * O título vive no sub-cabeçalho (ver `Layout`), como no protótipo. Esta
 * moldura trata do resto: a nota de enquadramento, as acções e a grelha.
 *
 * A lista nunca se perde quando se abre um objecto: o detalhe entra ao lado,
 * porque comparar unidades entre si é o próprio objectivo do sistema (§1.1).
 */

import React from 'react';

import { useT } from '../i18n/contexto';
import { Vazio } from './primitivas';

export function Pagina({
  descricao,
  accoes,
  children,
}: {
  /** `titulo` e `fundamento` são consumidos pelo sub-cabeçalho; aceites aqui
   *  para que cada ecrã continue a declarar o que é, num sítio só. */
  titulo?: string;
  fundamento?: string;
  descricao?: React.ReactNode;
  accoes?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col gap-4">
      {(descricao || accoes) && (
        <div className="flex flex-wrap items-start justify-between gap-4">
          {descricao && (
            <p className="max-w-4xl text-[12.5px] leading-relaxed text-texto-2">
              {descricao}
            </p>
          )}
          {accoes && <div className="flex shrink-0 items-center gap-2">{accoes}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function ListaDetalhe({
  lista,
  detalhe,
  semSeleccao,
}: {
  lista: React.ReactNode;
  detalhe: React.ReactNode | null;
  semSeleccao?: React.ReactNode;
}) {
  const tr = useT();
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] 2xl:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
      <div className="min-w-0">{lista}</div>
      <div className="min-w-0">
        {detalhe ?? (
          <div className="cartao h-full">
            <Vazio>
              {semSeleccao ??
                tr({
                  pt: 'Escolha uma linha para abrir a ficha.',
                  en: 'Pick a row to open its sheet.',
                  zh: '选择一行以打开明细。',
                })}
            </Vazio>
          </div>
        )}
      </div>
    </div>
  );
}

export function Botao({
  children,
  onClick,
  variante = 'normal',
  type = 'button',
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variante?: 'normal' | 'primario' | 'ouro' | 'perigo';
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  const base =
    'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40';
  const estilo = {
    normal: 'bg-bloco text-texto-2 hover:bg-bloco-2 hover:text-texto',
    primario: 'bg-texto text-white hover:opacity-90',
    ouro: 'bg-texto text-white hover:opacity-90',
    perigo: 'bg-vermelho-pastel text-vermelho hover:brightness-95',
  }[variante];

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${estilo}`}>
      {children}
    </button>
  );
}

/** Controlo de selecção com o mesmo vidro do resto do sistema. */
export function Seletor({
  value,
  onChange,
  children,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-9 rounded-full bg-cartao px-3.5 text-[12.5px] font-medium text-texto-2 transition-colors hover:text-texto ${className}`}
    >
      {children}
    </select>
  );
}
