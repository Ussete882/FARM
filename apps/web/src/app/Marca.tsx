/**
 * Marca BASTET — LHF-Foundation.
 *
 * Um campo arco-íris: sete sulcos de lavoura, nas sete cores da fundação, a
 * correr para um sol que nasce no horizonte. É o que o sistema gere — terra
 * trabalhada — com a promessa da fundação por cima. Tudo dentro da moldura
 * quadrada preta do logótipo da LHF-Foundation.
 */

import React from 'react';

const ARCO = ['#ed1d23', '#fea027', '#f2e205', '#3bbe4e', '#4bc3ed', '#4067ab', '#873a93'];
const TINTA = '#0e0c19';

/** Os sulcos: leques do ponto de fuga até à base, recortados abaixo do horizonte. */
function sulcos() {
  const fuga = { x: 20, y: 13 };
  const esquerda = -14;
  const direita = 54;
  const passo = (direita - esquerda) / ARCO.length;
  return ARCO.map((cor, i) => {
    const x0 = esquerda + i * passo;
    const x1 = x0 + passo;
    return (
      <polygon
        key={cor}
        points={`${fuga.x},${fuga.y} ${x0},44 ${x1},44`}
        fill={cor}
        stroke="#fff"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
    );
  });
}

export function Simbolo({ className = 'size-11' }: { className?: string }) {
  const id = React.useId();
  return (
    <svg viewBox="0 0 40 40" className={`${className} shrink-0`} aria-hidden>
      <defs>
        <clipPath id={`campo-${id}`}>
          <rect x="4" y="19" width="32" height="17" />
        </clipPath>
        <clipPath id={`ceu-${id}`}>
          <rect x="4" y="4" width="32" height="15" />
        </clipPath>
      </defs>
      <rect x="2" y="2" width="36" height="36" fill="#fff" />
      {/* O sol, a nascer: metade acima do horizonte. */}
      <g clipPath={`url(#ceu-${id})`}>
        <circle cx="20" cy="19" r="6.2" fill={TINTA} />
        {[-62, -31, 0, 31, 62].map((a) => (
          <rect
            key={a}
            x="19.25"
            y="6.4"
            width="1.5"
            height="3"
            rx="0.75"
            fill={TINTA}
            transform={`rotate(${a} 20 19)`}
          />
        ))}
      </g>
      <g clipPath={`url(#campo-${id})`}>{sulcos()}</g>
      <rect x="2" y="2" width="36" height="36" fill="none" stroke={TINTA} strokeWidth="3.2" />
    </svg>
  );
}

/** O nome, como no logótipo da fundação: duas cores no topo, a fundação por baixo. */
export function NomeMarca({ grande = false }: { grande?: boolean }) {
  return (
    <span className="leading-none">
      <span
        className={`block font-extrabold tracking-[0.02em] text-texto ${grande ? 'text-[22px]' : 'text-[17px]'}`}
      >
        <span style={{ color: ARCO[0] }}>BAS</span>
        <span style={{ color: ARCO[1] }}>TET</span>
      </span>
      <span
        className={`mt-1 block font-bold uppercase tracking-[0.16em] text-texto-2 ${grande ? 'text-[9.5px]' : 'text-[9px]'}`}
      >
        LHF Foundation
      </span>
    </span>
  );
}

export function Marca({
  tamanho = 'md',
  comNome = false,
}: {
  tamanho?: 'sm' | 'md' | 'lg';
  /** Junta o nome à direita. */
  comNome?: boolean;
}) {
  const lado = { sm: 'size-9', md: 'size-11', lg: 'size-12' }[tamanho];

  if (!comNome) {
    return (
      <span className="inline-flex">
        <Simbolo className={lado} />
        <span className="sr-only">BASTET — LHF-Foundation</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-3">
      <Simbolo className={lado} />
      <NomeMarca grande={tamanho === 'lg'} />
    </span>
  );
}
