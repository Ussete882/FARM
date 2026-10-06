/**
 * A API, servida como função sem servidor.
 *
 * É a mesma aplicação que o `servidor.ts` corre num processo Node — as mesmas
 * rotas, o mesmo motor de regras, as mesmas recusas. Muda só quem a serve.
 *
 * Hono fala `Request` e `Response` da plataforma, que é exactamente o que uma
 * função Netlify recebe e devolve. Não há adaptador nem tradução.
 */

import app from '../../apps/api/src/app';

export default async (requisicao: Request): Promise<Response> => app.fetch(requisicao);

export const config = { path: '/api/*' };
