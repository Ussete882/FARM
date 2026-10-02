/**
 * Travão de tentativas no início de sessão.
 *
 * Sem isto, uma palavra-passe pode ser tentada à velocidade da rede. O argon2
 * torna cada tentativa cara em CPU, o que ajuda, mas não é um travão: é só um
 * imposto, e quem está a tentar entrar paga-o de bom grado.
 *
 * O travão é por utilizador **e** por origem, somados. Só por origem não serve
 * — quem tem várias máquinas contorna-o. Só por utilizador também não — quem
 * quer negar o serviço bloqueia a conta da Direcção de propósito. Exigir as
 * duas coisas fecha os dois casos.
 *
 * Fica em memória. O servidor é um só, e um reinício limpar o contador é
 * aceitável: quem reinicia o servidor é quem o administra. Com mais de uma
 * instância, isto passa para a base.
 */

const JANELA_MS = 15 * 60 * 1000;

/**
 * Dois limites, e não um.
 *
 * Por utilizador é apertado: oito enganos na mesma conta são oito enganos.
 *
 * Por origem é largo de propósito. A farma fala toda pela mesma rede, e com um
 * limite igual ao da conta bastaria uma pessoa enganar-se oito vezes para
 * bloquear o escritório inteiro. Trinta tentativas em quinze minutos continua a
 * ser lento de mais para quem está a adivinhar e folgado de sobra para quem se
 * engana.
 */
const TENTATIVAS_UTILIZADOR = 8;
const TENTATIVAS_ORIGEM = 30;

const limiteDe = (chave: string) =>
  chave.startsWith('u:') ? TENTATIVAS_UTILIZADOR : TENTATIVAS_ORIGEM;

interface Registo {
  falhas: number;
  desde: number;
}

const porChave = new Map<string, Registo>();

const agora = () => Date.now();

function limpar(): void {
  const t = agora();
  for (const [chave, r] of porChave) {
    if (t - r.desde > JANELA_MS) porChave.delete(chave);
  }
}

/**
 * Quanto falta esperar, em segundos. Zero quando se pode tentar.
 *
 * As duas chaves — utilizador e origem — são verificadas em conjunto: basta
 * uma estar travada.
 */
export function esperaEmSegundos(utilizador: string, origem: string): number {
  limpar();
  const t = agora();
  let maior = 0;

  for (const chave of [`u:${utilizador}`, `o:${origem}`]) {
    const r = porChave.get(chave);
    if (!r || r.falhas < limiteDe(chave)) continue;
    const resta = Math.ceil((JANELA_MS - (t - r.desde)) / 1000);
    if (resta > maior) maior = resta;
  }
  return maior;
}

export function registarFalha(utilizador: string, origem: string): void {
  const t = agora();
  for (const chave of [`u:${utilizador}`, `o:${origem}`]) {
    const r = porChave.get(chave);
    if (!r || t - r.desde > JANELA_MS) {
      porChave.set(chave, { falhas: 1, desde: t });
    } else {
      r.falhas++;
    }
  }
}

/** Entrou: o contador dessa pessoa zera. O da origem não — pode não ser ela. */
export function limparFalhas(utilizador: string): void {
  porChave.delete(`u:${utilizador}`);
}
