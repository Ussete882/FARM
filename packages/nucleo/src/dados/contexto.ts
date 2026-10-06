/**
 * Constantes da instanciação — o contexto, sem os dados.
 *
 * Vivem separadas da semente por uma razão que não é de arrumação: `HOJE` é
 * usado por quinze ecrãs, e enquanto esteve dentro de `farma-alcinda.ts`
 * bastava um ecrã importá-lo para arrastar os 22 nomes e os 21 contactos para
 * dentro do pacote compilado.
 *
 * Uma constante não devia poder publicar um registo de pessoal. Agora não pode.
 */

export const UNIDADE = 'FA';
export const PROJECTO = 'PRJ-FA';
export const CAMPANHA = '2025/26';

/**
 * O dia em que o sistema se situa.
 *
 * Fixo para a semente ser determinística e as capturas comparáveis. Quando
 * isto correr a sério, passa a ser a data real do aparelho.
 */
export const HOJE = '2026-09-28';

/** Identidade da semente. Quando muda, a base local é refeita. */
export const SEMENTE_VERSAO = '2026-09-28-dados-do-gestor';
