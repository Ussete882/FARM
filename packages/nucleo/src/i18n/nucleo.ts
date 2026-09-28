/**
 * BASTET — três idiomas, uma só fonte de verdade.
 *
 * A escolha aqui é deliberada: em vez de um ficheiro de chaves («ecra.titulo»)
 * separado das traduções, cada texto é um objecto com as três línguas juntas.
 *
 * Duas razões. A primeira é o compilador: `T` exige `pt`, `en` e `zh`, por isso
 * um texto por traduzir é um erro de tipo e não uma chave em falta que só
 * aparece em produção. A segunda é a manutenção: quem altera a frase portuguesa
 * vê as outras duas na mesma linha, e não as deixa para trás.
 *
 * O motor de regras continua puro. Uma constatação transporta um `T`, não uma
 * frase já resolvida — quem escolhe o idioma é o ecrã, não a regra.
 */

export const IDIOMAS = ['pt', 'en', 'zh'] as const;
export type Idioma = (typeof IDIOMAS)[number];

/** Um texto nas três línguas do sistema. */
export interface T {
  pt: string;
  en: string;
  zh: string;
}

export interface FichaIdioma {
  codigo: Idioma;
  /** O nome da língua na própria língua — é assim que se escolhe um idioma. */
  nome: string;
  etiqueta: string;
  /** Locale BCP-47, para `lang` no documento e para ordenação. */
  bcp47: string;
}

export const FICHAS_IDIOMA: Record<Idioma, FichaIdioma> = {
  pt: { codigo: 'pt', nome: 'Português', etiqueta: 'PT', bcp47: 'pt-MZ' },
  en: { codigo: 'en', nome: 'English', etiqueta: 'EN', bcp47: 'en-GB' },
  zh: { codigo: 'zh', nome: '中文', etiqueta: '中', bcp47: 'zh-CN' },
};

/** Resolve um texto trilingue. */
export function traduzir(texto: T, idioma: Idioma): string {
  return texto[idioma];
}

// ============================================================================
// Preferência do utilizador
// ============================================================================

const CHAVE = 'bastet:idioma';

export function idiomaGuardado(): Idioma {
  try {
    const guardado = localStorage.getItem(CHAVE);
    if (guardado && (IDIOMAS as readonly string[]).includes(guardado)) return guardado as Idioma;
  } catch {
    // Navegação privada, ou armazenamento bloqueado: cai na detecção.
  }
  return detectar();
}

export function guardarIdioma(idioma: Idioma): void {
  try {
    localStorage.setItem(CHAVE, idioma);
  } catch {
    // Sem armazenamento, a escolha vale só para esta sessão.
  }
}

/** O idioma do navegador, quando é um dos três. Português por omissão. */
function detectar(): Idioma {
  const preferidos = typeof navigator === 'undefined' ? [] : (navigator.languages ?? []);
  for (const marca of preferidos) {
    const raiz = marca.toLowerCase().split('-')[0];
    if (raiz === 'zh') return 'zh';
    if (raiz === 'en') return 'en';
    if (raiz === 'pt') return 'pt';
  }
  return 'pt';
}
