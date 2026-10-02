/**
 * Configuração do servidor.
 *
 * Há dois modos e a diferença entre eles é uma só: **em produção não há
 * valores por omissão**.
 *
 * Em desenvolvimento, `postgres://bastet:bastet@localhost:5433` e a
 * palavra-passe `alcinda` são comodidades que poupam cinco minutos de
 * configuração. Em produção seriam credenciais escritas num repositório
 * público — e um sistema que arranca com elas é um sistema aberto que parece
 * fechado.
 *
 * Por isso, com `BASTET_AMBIENTE=producao`, o servidor **recusa arrancar** se
 * faltar alguma variável. Falhar no arranque é barulhento e acontece a quem o
 * está a instalar; falhar em silêncio é calado e acontece a quem lá tem os
 * dados.
 */

export type Ambiente = 'desenvolvimento' | 'producao';

export const AMBIENTE: Ambiente =
  process.env.BASTET_AMBIENTE === 'producao' ? 'producao' : 'desenvolvimento';

export const emProducao = AMBIENTE === 'producao';

const emFalta: string[] = [];

/**
 * Lê uma variável. Em produção, a ausência é registada e o arranque falha
 * depois — todas de uma vez, para quem instala não descobrir uma por tentativa.
 */
function exigir(nome: string, porOmissao: string): string {
  const valor = process.env[nome];
  if (valor && valor.length > 0) return valor;
  if (emProducao) {
    emFalta.push(nome);
    return '';
  }
  return porOmissao;
}

export const LIGACAO_BD = exigir(
  'BASTET_BD',
  'postgres://bastet:bastet@localhost:5433/bastet',
);

export const PALAVRA_PASSE_INICIAL = exigir('BASTET_PALAVRA_PASSE', 'alcinda');

export const ORIGENS = exigir('BASTET_ORIGENS', 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export const PORTA = Number(process.env.PORT ?? process.env.BASTET_PORTA ?? 4000);

/**
 * Verifica a configuração e termina o processo se faltar alguma coisa.
 *
 * Chamada no arranque do servidor e dos scripts. Não lança excepção: imprime o
 * que falta e sai, porque quem está a instalar isto numa consola quer ler uma
 * lista, não uma pilha de chamadas.
 */
export function exigirConfiguracao(): void {
  const avisos: string[] = [];

  if (emProducao) {
    if (PALAVRA_PASSE_INICIAL === 'alcinda') emFalta.push('BASTET_PALAVRA_PASSE');
    if (PALAVRA_PASSE_INICIAL.length > 0 && PALAVRA_PASSE_INICIAL.length < 12) {
      avisos.push('BASTET_PALAVRA_PASSE tem menos de 12 caracteres.');
    }
    if (LIGACAO_BD.includes('bastet:bastet@')) {
      avisos.push('A ligação à base usa as credenciais de desenvolvimento.');
    }
    if (!/sslmode=/.test(LIGACAO_BD)) {
      avisos.push(
        'A cadeia de ligação não indica sslmode. Se a base não estiver numa rede privada, as credenciais passam em claro.',
      );
    }
    if (ORIGENS.some((o) => o.startsWith('http://') && !o.includes('localhost'))) {
      avisos.push('Há origens em http sem TLS. O testemunho de sessão viaja em claro.');
    }
  }

  if (emFalta.length > 0 || avisos.length > 0) {
    console.error('\nBASTET — a configuração de produção não está completa.\n');
    for (const n of [...new Set(emFalta)]) console.error(`  em falta   ${n}`);
    for (const a of avisos) console.error(`  atenção    ${a}`);
    console.error('');
    if (emFalta.length > 0) process.exit(1);
  }
}
