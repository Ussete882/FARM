/**
 * BASTET — servidor Node.
 *
 * Arranca a aplicação num processo que fica a correr. É o que se usa em
 * desenvolvimento e num contentor; publicado sem servidor, quem serve a mesma
 * aplicação é a função em `netlify/functions/api.ts`.
 */

import { serve } from '@hono/node-server';

import app from './app';
import { AMBIENTE, emProducao, exigirConfiguracao, ORIGENS, PORTA } from './ambiente';
import { esperarPorBd } from './bd';
import { VERSAO_NUCLEO } from '@bastet/nucleo/versao';

exigirConfiguracao();
await esperarPorBd();

serve({ fetch: app.fetch, port: PORTA, hostname: '0.0.0.0' }, (info) => {
  console.log(`BASTET — servidor na porta ${info.port} (${AMBIENTE})`);
  console.log(`  regras: versão ${VERSAO_NUCLEO}`);
  console.log(`  origens: ${ORIGENS.join(', ')}`);
  if (!emProducao) console.log('  valores de desenvolvimento em uso.');
});
