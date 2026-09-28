/**
 * BASTET — papéis e poderes (§24.5).
 *
 * Vive no núcleo porque serve os dois lados por razões diferentes: o servidor
 * usa-o para **recusar**, e o cliente usa-o para **não oferecer**. Um botão que
 * o utilizador pode carregar e que dá sempre erro é um defeito de desenho, e um
 * servidor que confia no botão é um defeito de segurança. Precisam os dois da
 * mesma tabela, e é esta.
 *
 * A regra que atravessa tudo: «nenhum papel apaga registos». Repare que não há
 * uma escrita `remover` — não está proibida, está ausente. A correcção é anular
 * e substituir, com motivo, e ambos ficam visíveis.
 */

import type { T } from '../i18n/nucleo';

export const PAPEIS = [
  'direccao',
  'agronomo',
  'tecnico',
  'chefe_turma',
  'recursos_humanos',
  'qualidade',
  'conformidade',
] as const;
export type Papel = (typeof PAPEIS)[number];

export const ROTULO_PAPEL: Record<Papel, T> = {
  direccao: { pt: 'Direcção', en: 'Directorate', zh: '管理层' },
  agronomo: { pt: 'Agrónomo responsável', en: 'Responsible agronomist', zh: '责任农艺师' },
  tecnico: { pt: 'Técnico encarregado', en: 'Field supervisor', zh: '现场技术主管' },
  chefe_turma: { pt: 'Chefe de turma', en: 'Shift leader', zh: '班组长' },
  recursos_humanos: { pt: 'Recursos Humanos', en: 'Human Resources', zh: '人力资源' },
  qualidade: { pt: 'Qualidade', en: 'Quality', zh: '质量' },
  conformidade: { pt: 'Conformidade', en: 'Compliance', zh: '合规' },
};

/** As três formas de escrever. Não há uma quarta. */
export type Escrita = 'criar' | 'alterar' | 'anular';

/**
 * Que tipos de objecto cada papel pode escrever.
 *
 * `'*'` é tudo. A Direcção tem-no porque responde por tudo; não porque seja
 * cómodo.
 */
const PODE: Record<Papel, readonly string[]> = {
  direccao: ['*'],
  agronomo: [
    'talhao',
    'bloco',
    'arvore',
    'ciclo_cultura',
    'cultura',
    'variedade',
    'fonte_agua',
    'ordem_trabalho',
    'monitorizacao',
    'observacao',
  ],
  tecnico: [
    'ordem_trabalho',
    'operacao',
    'relatorio_diario',
    'pesagem_colheita',
    'monitorizacao',
    'observacao',
    'arvore',
  ],
  chefe_turma: [
    'relatorio_diario',
    'pesagem_colheita',
    'jorna',
    'operacao',
    'observacao',
    'monitorizacao',
  ],
  recursos_humanos: ['trabalhador', 'equipa', 'formacao', 'jorna'],
  // Qualidade e Conformidade têm poder de bloqueio, não de produção: mexem no
  // estado de um registo, não criam registos de campo.
  qualidade: ['observacao'],
  conformidade: ['observacao'],
};

export function podeEscrever(papel: Papel, tipo: string): boolean {
  const permitidos = PODE[papel];
  if (!permitidos) return false;
  return permitidos.includes('*') || permitidos.includes(tipo);
}

/**
 * Quem inscreve aparelhos. É a mesma pessoa que responde se um telemóvel se
 * perder, por isso não é uma permissão que se distribua.
 */
export function podeInscreverAparelho(papel: Papel): boolean {
  return papel === 'direccao';
}

export const ePapel = (v: string): v is Papel => (PAPEIS as readonly string[]).includes(v);

/** A recusa, nas três línguas, para o cliente a poder mostrar tal como vem. */
export function recusaDePapel(papel: Papel, tipo: string): T {
  const p = ROTULO_PAPEL[papel];
  return {
    pt: `O papel «${p.pt}» não escreve registos do tipo «${tipo}».`,
    en: `The role «${p.en}» does not write records of type «${tipo}».`,
    zh: `「${p.zh}」角色无权写入「${tipo}」类型的记录。`,
  };
}
