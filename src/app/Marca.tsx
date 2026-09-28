/**
 * Marca BASTET — LHF-Foundation.
 *
 * O nome vem da deusa egípcia guardiã: um olho que vigia. Um disco verde com
 * o símbolo a branco, como no cabeçalho da referência.
 */

export function Marca({ tamanho = 'md' }: { tamanho?: 'sm' | 'md' | 'lg' }) {
  const disco = { sm: 'size-8', md: 'size-10', lg: 'size-12' }[tamanho];

  return (
    <div className={`grid ${disco} shrink-0 place-items-center rounded-full bg-marca`}>
      <svg viewBox="0 0 24 24" className="size-[58%]" aria-hidden>
        <path
          d="M2.4 12c3.1-4.8 6-7 9.6-7s6.5 2.2 9.6 7c-3.1 4.8-6 7-9.6 7s-6.5-2.2-9.6-7Z"
          fill="none"
          stroke="#fff"
          strokeWidth="1.9"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="3.1" fill="#fff" />
      </svg>
      <span className="sr-only">BASTET — LHF-Foundation</span>
    </div>
  );
}
