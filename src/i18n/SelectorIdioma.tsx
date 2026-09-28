/**
 * Selector de idioma — três pastilhas no cabeçalho.
 *
 * Um menu suspenso esconderia a escolha atrás de um clique; três pastilhas
 * mostram desde logo que o sistema fala três línguas, e trocam numa acção só.
 * Cada uma está escrita na própria língua, que é como se reconhece um idioma
 * quando não se lê o dos outros.
 */

import { Languages } from 'lucide-react';

import { FICHAS_IDIOMA, IDIOMAS } from './nucleo';
import { useIdioma, useT } from './contexto';

export function SelectorIdioma({ compacto = false }: { compacto?: boolean }) {
  const { idioma, definirIdioma } = useIdioma();
  const tr = useT();

  return (
    <div
      role="group"
      aria-label={tr({ pt: 'Idioma', en: 'Language', zh: '语言' })}
      className="flex h-10 shrink-0 items-center gap-0.5 rounded-full bg-cartao p-1"
    >
      {!compacto && (
        <Languages className="mx-1.5 size-3.5 shrink-0 text-texto-3" aria-hidden="true" />
      )}
      {IDIOMAS.map((codigo) => {
        const ficha = FICHAS_IDIOMA[codigo];
        const activo = codigo === idioma;
        return (
          <button
            key={codigo}
            onClick={() => definirIdioma(codigo)}
            title={ficha.nome}
            aria-label={ficha.nome}
            aria-pressed={activo}
            lang={ficha.bcp47}
            className={`h-8 min-w-8 rounded-full px-2.5 text-[12px] font-semibold transition-colors ${
              activo
                ? 'bg-texto text-white'
                : 'text-texto-3 hover:bg-bloco-2 hover:text-texto'
            }`}
          >
            {ficha.etiqueta}
          </button>
        );
      })}
    </div>
  );
}

/** Versão em lista, para a gaveta dos ecrãs estreitos. */
export function ListaIdiomas() {
  const { idioma, definirIdioma } = useIdioma();
  const tr = useT();

  return (
    <div>
      <div className="mb-1 px-2.5">
        <span className="rotulo">{tr({ pt: 'Idioma', en: 'Language', zh: '语言' })}</span>
      </div>
      {IDIOMAS.map((codigo) => {
        const ficha = FICHAS_IDIOMA[codigo];
        const activo = codigo === idioma;
        return (
          <button
            key={codigo}
            onClick={() => definirIdioma(codigo)}
            lang={ficha.bcp47}
            className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] transition-colors ${
              activo ? 'bg-bloco font-semibold text-texto' : 'text-texto-2 hover:bg-bloco'
            }`}
          >
            <span className="grid size-5 shrink-0 place-items-center rounded-md bg-bloco-2 text-[10px] font-bold text-texto-2">
              {ficha.etiqueta}
            </span>
            <span className="min-w-0 flex-1 truncate">{ficha.nome}</span>
          </button>
        );
      })}
    </div>
  );
}
