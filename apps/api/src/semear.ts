/**
 * Semeia o servidor.
 *
 * Os objectos vêm de `@bastet/nucleo/farma-alcinda`, o mesmo ficheiro que o
 * cliente usa. Os utilizadores não: esses só existem no servidor, porque só
 * aqui há autenticação.
 *
 * Os contactos não entram. Estão fora do repositório e não são precisos para o
 * sistema funcionar — quem os quiser no servidor põe-nos pela aplicação, uma
 * vez, e ficam lá. Semear a base com números de telefone a partir de um
 * ficheiro seria pô-los a circular por mais um sítio sem necessidade.
 *
 * Correr duas vezes não faz mal: só acrescenta o que falta.
 */

import type { ObjectoCanonico } from '@bastet/nucleo/canonico';
import { construirSemente } from '@bastet/nucleo/farma-alcinda';

import { cifrar } from './acesso';
import { esperarPorBd, fechar, sql } from './bd';
import * as repo from './repositorio';

/**
 * A palavra-passe inicial da Direcção.
 *
 * Vem de variável de ambiente. O valor por omissão serve para desenvolvimento
 * local e não deve sobreviver ao primeiro dia em que isto estiver na rede.
 */
const PALAVRA_PASSE = process.env.BASTET_PALAVRA_PASSE ?? 'alcinda';

async function semearUtilizadores(): Promise<void> {
  // A Direcção não consta do quadro de pessoal: a lista do gestor são as 22
  // pessoas ao serviço, e ela não é uma delas. Tem identidade própria.
  await sql`
    insert into utilizador (id, nome, papel, palavra_passe_hash)
    values ('DIR-01', 'Alcinda Mabjaia', 'direccao', ${await cifrar(PALAVRA_PASSE)})
    on conflict (id) do nothing
  `;

  // O Sr. Venâncio entra pelo aparelho, não por palavra-passe: chefia o
  // trabalho, faz a chamada e escreve os registos (resposta do gestor, B.4).
  await sql`
    insert into utilizador (id, nome, papel, trabalhador)
    values ('TR-00001', 'Venancio Vasco Mudzia', 'chefe_turma', 'TR-00001')
    on conflict (id) do nothing
  `;
}

async function semearObjectos(): Promise<number> {
  const s = construirSemente();
  const tudo: ObjectoCanonico[] = [
    ...s.blocos,
    ...s.culturas,
    ...s.variedades,
    ...s.trabalhadores,
    ...s.equipas,
  ];

  let novos = 0;
  for (const o of tudo) {
    if (await repo.porCodigo(o.codigo)) continue;
    await repo.inserir(o);
    novos++;
  }

  // As pendências não são objectos canónicos — não têm versão nem histórico —
  // mas são dados de gestão com dono e estado, e têm de estar no servidor.
  for (const p of s.pendencias) {
    await sql`
      insert into objecto (
        id, codigo, designacao, tipo, estado, dono,
        criado_em, criado_por, alterado_em, alterado_por, versao, dados
      ) values (
        ${p.id}, ${p.codigo}, ${p.titulo.pt}, 'pendencia', ${p.estado}, ${p.dono},
        current_date, 'TR-00001', current_date, 'TR-00001', 1,
        ${sql.json({
          titulo: p.titulo,
          descricao: p.descricao,
          categoria: p.categoria,
          seccao: p.seccao,
          ...(p.decisaoAssociada ? { decisaoAssociada: p.decisaoAssociada } : {}),
        } as never)}
      )
      on conflict (codigo) do nothing
    `;
  }

  return novos;
}

async function semear(): Promise<void> {
  await esperarPorBd();
  await semearUtilizadores();
  const novos = await semearObjectos();

  const [{ n }] = await sql<{ n: string }[]>`select count(*)::text as n from objecto`;
  console.log(`  ${novos} objectos novos; ${n} no total.`);
  console.log(`  Direcção: DIR-01 / ${PALAVRA_PASSE}`);
}

semear()
  .then(fechar)
  .catch(async (e) => {
    console.error('A semeadura falhou:', e instanceof Error ? e.message : e);
    await fechar();
    process.exitCode = 1;
  });
