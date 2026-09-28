/**
 * A versão do motor de regras.
 *
 * Viaja em cada escrita que sai de um aparelho. O servidor compara-a com a sua
 * antes de aceitar seja o que for: um telemóvel que esteve um mês sem rede pode
 * estar a correr regras que entretanto mudaram, e nesse caso o que ele grava
 * está certo segundo as regras antigas e errado segundo as novas.
 *
 * A resposta do sistema é recusar a escrita e mandar actualizar, não escolher
 * em silêncio qual das duas versões tem razão. É por isto que os dois lados
 * correm o mesmo pacote, e não duas cópias que se parecem.
 *
 * Sobe sempre que uma regra, um limiar ou uma mensagem mudar.
 */
export const VERSAO_NUCLEO = '0.1.0';
