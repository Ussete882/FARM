/**
 * Marca BASTET — LHF-Foundation.
 *
 * O símbolo é o logótipo da própria LHF-Foundation, tal como a fundação o
 * usa (`public/lhf-foundation.png`, recortado à moldura). Ao lado, o nome
 * do sistema nas duas primeiras cores do logótipo, como «LO» e «VE».
 */

const LOGO = '/lhf-foundation.png';
const VERMELHO = '#ed1d23';
const LARANJA = '#fea027';

/** O logótipo da fundação. A largura vem de `className`; a altura acompanha. */
export function Simbolo({ className = 'w-12' }: { className?: string }) {
  return (
    <img
      src={LOGO}
      alt="Love Happiness Freedom Foundation"
      width={411}
      height={364}
      className={`h-auto shrink-0 ${className}`}
      draggable={false}
    />
  );
}

export function NomeMarca({ grande = false }: { grande?: boolean }) {
  return (
    <span className="leading-none">
      <span
        className={`block font-extrabold tracking-[0.02em] text-texto ${grande ? 'text-[22px]' : 'text-[17px]'}`}
      >
        <span style={{ color: VERMELHO }}>BAS</span>
        <span style={{ color: LARANJA }}>TET</span>
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
  const largura = { sm: 'w-11', md: 'w-14', lg: 'w-16' }[tamanho];

  return (
    <span className="inline-flex items-center gap-3">
      <Simbolo className={largura} />
      {comNome && <NomeMarca grande={tamanho === 'lg'} />}
    </span>
  );
}
