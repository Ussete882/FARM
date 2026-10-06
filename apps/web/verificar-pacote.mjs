/**
 * Procura dados pessoais dentro do pacote compilado.
 *
 * Corre depois de cada `npm run build` e faz a compilação falhar se encontrar
 * alguma coisa. Não é zelo a mais: a primeira vez que compilámos isto para
 * publicar, os 22 nomes e os 21 números de telemóvel do quadro de pessoal
 * estavam lá dentro, prontos a ir para um endereço público — e tínhamo-los
 * guardado fora do repositório precisamente para isso não acontecer.
 *
 * Um ficheiro no `.gitignore` protege o repositório. Não protege a compilação.
 *
 * O que procura são padrões, não a lista real: a lista vive em
 * `contactos.local.ts`, que este ficheiro não pode ler nem deve.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const PASTA = new URL('./dist/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

/** Nove dígitos começados por 8: a forma de um telemóvel moçambicano. */
const TELEMOVEL = /\b8[2-7]\d{7}\b/g;

/**
 * Nomes do quadro. Estão aqui em pedaços — um apelido não identifica ninguém,
 * e três deles bastam para apanhar a semente inteira se ela voltar a entrar.
 */
const APELIDOS = ['Mudzia', 'Tomuceni', 'Ndirequereni', 'Manguenda'];

async function ficheiros(pasta) {
  const saida = [];
  for (const entrada of await readdir(pasta, { withFileTypes: true })) {
    const caminho = join(pasta, entrada.name);
    if (entrada.isDirectory()) saida.push(...(await ficheiros(caminho)));
    else if (/\.(js|css|html|json)$/.test(entrada.name)) saida.push(caminho);
  }
  return saida;
}

const achados = [];

for (const f of await ficheiros(PASTA)) {
  const conteudo = await readFile(f, 'utf8');
  const nome = f.slice(PASTA.length);

  const telefones = [...new Set(conteudo.match(TELEMOVEL) ?? [])];
  if (telefones.length > 0) {
    achados.push(`${nome}: ${telefones.length} número(s) de telemóvel`);
  }
  for (const apelido of APELIDOS) {
    if (conteudo.includes(apelido)) achados.push(`${nome}: o nome «${apelido}»`);
  }
}

if (achados.length > 0) {
  console.error('\nBASTET — há dados pessoais no pacote compilado.\n');
  for (const a of achados) console.error(`  ${a}`);
  console.error(
    '\n  O quadro de pessoal não é para publicar. Em produção o cliente nasce\n' +
      '  vazio e enche-se sincronizando, de quem tiver autorização para o ver.\n' +
      '  Ver apps/web/src/dados/semente.ts.\n',
  );
  process.exit(1);
}

console.log('  pacote limpo: sem nomes nem contactos do quadro de pessoal.');
