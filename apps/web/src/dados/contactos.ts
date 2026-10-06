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
 * E **nunca saem em produção**, nem que o ficheiro exista na máquina de quem
 * compila. Da primeira vez que compilámos isto para publicar, os 21 números
 * foram parar ao JavaScript que ia para a internet: o `.gitignore` protege o
 * repositório, não protege a compilação. Publicado, os contactos entram pelo
 * servidor, por quem tiver autorização, e nunca por um ficheiro compilado.
 *
 * `import.meta.glob` devolve um objecto vazio quando o ficheiro não existe, o
 * que faz isto compilar e correr nas duas situações.
 */

/**
 * Telefone por código de trabalhador.
 *
 * É uma função e não uma constante por duas razões que se somam: um `await` no
 * topo do módulo não passa no alvo de compilação, e carregar isto só quando é
 * preciso deixa o ramo de produção vazio de forma óbvia para quem lê e para o
 * empacotador.
 */
export async function contactosLocais(): Promise<Record<string, string>> {
  if (!import.meta.env.DEV) return {};

  const locais = import.meta.glob('./contactos.local.ts') as Record<
    string,
    () => Promise<{ CONTACTOS?: Record<string, string> }>
  >;
  const primeiro = Object.values(locais)[0];
  if (!primeiro) return {};
  return (await primeiro()).CONTACTOS ?? {};
}
