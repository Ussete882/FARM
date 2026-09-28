/**
 * Contactos das pessoas ao serviço — fora do repositório.
 *
 * Os 22 nomes ficam no código porque o sistema tem de nomear quem trabalha:
 * uma ficha que diz «TR-00014» e mais nada não serve a quem a vai usar. Os
 * números de telemóvel não têm a mesma justificação — não são precisos para o
 * sistema funcionar, e são dados de pessoas que não escolheram estar num
 * repositório.
 *
 * Por isso vivem em `contactos.local.ts`, que o git ignora. Quem clonar o
 * repositório obtém um sistema completo com a coluna de contacto vazia, e o
 * ficheiro entra por quem tiver autorização para o ter.
 *
 * `import.meta.glob` devolve um objecto vazio quando o ficheiro não existe, o
 * que faz isto compilar e correr nas duas situações.
 */

const locais = import.meta.glob('./contactos.local.ts', { eager: true }) as Record<
  string,
  { CONTACTOS?: Record<string, string> }
>;

/** Telefone por código de trabalhador. Vazio quando o ficheiro local não existe. */
export const CONTACTOS: Record<string, string> = Object.values(locais)[0]?.CONTACTOS ?? {};

export const TEM_CONTACTOS = Object.keys(CONTACTOS).length > 0;
