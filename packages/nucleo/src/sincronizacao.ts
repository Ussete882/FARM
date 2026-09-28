/**
 * BASTET — o contrato da sincronização diferida (§25).
 *
 * Vive no núcleo e não no servidor nem no cliente, porque é a única coisa que
 * os dois têm de concordar ao caractere. Se cada lado tivesse a sua cópia
 * destes tipos, divergiriam no dia em que alguém mudasse um sem mudar o outro
 * — e a falha apareceria em campo, num telemóvel, a uma semana de distância de
 * quem a podia corrigir.
 *
 * O desenho tem uma assimetria deliberada: **enviar pode ser recusado, receber
 * não**. O servidor é a fonte de verdade. Um aparelho que escreve pode estar
 * enganado; um aparelho que lê nunca está.
 */

import type { ObjectoCanonico } from './dominio/canonico';
import type { Constatacao } from './regras/validacao';

/** As três formas de escrever. Não há uma quarta, e não há remoção (§24.5). */
export type TipoEscrita = 'criar' | 'alterar' | 'anular';

/**
 * Uma entrada na caixa de saída do aparelho.
 *
 * O `id` é local ao aparelho e serve para o servidor dizer, na resposta, a que
 * entrada se refere. Não é o identificador do objecto.
 */
export interface EntradaSaida {
  id: number;
  escrita: TipoEscrita;
  /** Em `criar` e `alterar`. */
  objecto?: ObjectoCanonico;
  /** Em `anular`: o par vai junto e grava na mesma transacção. */
  anulado?: ObjectoCanonico;
  substituto?: ObjectoCanonico;
  /** A versão que o aparelho leu antes de alterar. Bloqueio optimista. */
  versaoAnterior?: number;
}

export interface Envio {
  /**
   * A versão do motor de regras do aparelho. Se não for a do servidor, nada é
   * aceite: um telemóvel a correr regras antigas é um telemóvel que não grava.
   */
  versaoNucleo: string;
  entradas: EntradaSaida[];
}

export type MotivoRecusa =
  /** O registo não passa nas regras do §8, agora que se vê o contexto todo. */
  | 'validacao'
  /** Outra pessoa alterou o mesmo objecto entretanto. Nada foi sobreposto. */
  | 'conflito'
  /** O aparelho corre uma versão do núcleo que o servidor não reconhece. */
  | 'versao_do_nucleo'
  /** O código já existe, ou a entrada vem malformada. */
  | 'recusado';

export interface ResultadoEntrada {
  id: number;
  aceite: boolean;
  codigo?: string;
  motivo?: MotivoRecusa;
  /** Nas recusas de validação: as mesmas constatações que o cliente veria. */
  constatacoes?: Constatacao[];
  /** Nos conflitos: o objecto que está no servidor, para o cliente decidir. */
  actual?: ObjectoCanonico;
  detalhe?: string;
}

export interface RespostaEnvio {
  resultados: ResultadoEntrada[];
  /** O cursor depois de aplicar o que foi aceite. */
  cursor: string;
}

export interface RespostaRecepcao {
  objectos: ObjectoCanonico[];
  cursor: string;
  /** Falso quando há mais para lá do limite: o cliente volta a pedir. */
  completo: boolean;
}
