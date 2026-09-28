/**
 * BASTET — o idioma corrente, disponível a todo o ecrã.
 *
 * `useT()` resolve textos trilingues; `useFmt()` devolve o formatador do idioma
 * activo. Os dois vêm do mesmo sítio, porque mudar de língua sem mudar a
 * separação decimal daria «7,072.00 MT» escrito em português — um número que
 * se lê errado.
 */

import React from 'react';

import { formatador, type Formatador } from '../dominio/formatar';
import {
  guardarIdioma,
  idiomaGuardado,
  traduzir,
  type Idioma,
  type T,
} from './nucleo';

interface ValorContexto {
  idioma: Idioma;
  definirIdioma: (idioma: Idioma) => void;
  t: (texto: T) => string;
  fmt: Formatador;
}

const Contexto = React.createContext<ValorContexto | null>(null);

export function ProvedorIdioma({ children }: { children: React.ReactNode }) {
  const [idioma, setIdioma] = React.useState<Idioma>(idiomaGuardado);

  const definirIdioma = React.useCallback((novo: Idioma) => {
    setIdioma(novo);
    guardarIdioma(novo);
  }, []);

  // O `lang` do documento guia a quebra de linha e a escolha de tipo de letra:
  // sem ele, o chinês herda as métricas latinas e fica com o espaçamento errado.
  React.useEffect(() => {
    document.documentElement.lang = idioma === 'zh' ? 'zh-CN' : idioma === 'en' ? 'en' : 'pt';
    document.documentElement.dataset.idioma = idioma;
  }, [idioma]);

  const valor = React.useMemo<ValorContexto>(
    () => ({
      idioma,
      definirIdioma,
      t: (texto: T) => traduzir(texto, idioma),
      fmt: formatador(idioma),
    }),
    [idioma, definirIdioma],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

function usarContexto(): ValorContexto {
  const valor = React.useContext(Contexto);
  if (!valor) throw new Error('useT/useFmt fora do ProvedorIdioma.');
  return valor;
}

/** Resolve um texto trilingue no idioma activo. */
export function useT(): (texto: T) => string {
  return usarContexto().t;
}

/** O formatador do idioma activo — números, datas, unidades. */
export function useFmt(): Formatador {
  return usarContexto().fmt;
}

/** O idioma activo e a forma de o mudar. */
export function useIdioma(): { idioma: Idioma; definirIdioma: (i: Idioma) => void } {
  const { idioma, definirIdioma } = usarContexto();
  return { idioma, definirIdioma };
}
