/**
 * BASTET — ficha de objecto canónico (§2.3).
 *
 * «Todos os objectos do sistema partilham o mesmo esqueleto. É isto que
 * permite que o mesmo motor de auditoria, de pesquisa e de histórico sirva o
 * sistema inteiro.»
 *
 * Um único componente serve talhão, trabalhador, ordem de trabalho e lote.
 */

import { History, Link2, Paperclip, StickyNote, Table2 } from 'lucide-react';
import React from 'react';

import type { ObjectoCanonico } from '../dominio/canonico';
import { useFmt, useT } from '../i18n/contexto';
import type { T } from '../i18n/nucleo';
import { historicoOrdenado } from '../regras/historico';
import { Codigo, EstadoBadge, Rotulo, Vazio } from './primitivas';

export interface CampoFicha {
  rotulo: string;
  valor: React.ReactNode;
  /** Ocupa a linha inteira. */
  largo?: boolean;
  /** Nota de fundamento: alvo agronómico, referência legal, cálculo. */
  nota?: React.ReactNode;
}

export interface GrupoCampos {
  titulo: string;
  campos: CampoFicha[];
}

/** Os cinco separadores do §2.3 — os mesmos em todos os objectos do sistema. */
const SEPARADORES = [
  { chave: 'dados', rotulo: { pt: 'Dados', en: 'Data', zh: '数据' }, icone: Table2 },
  { chave: 'relacoes', rotulo: { pt: 'Relações', en: 'Relations', zh: '关联' }, icone: Link2 },
  { chave: 'historico', rotulo: { pt: 'Histórico', en: 'History', zh: '历史' }, icone: History },
  { chave: 'anexos', rotulo: { pt: 'Anexos', en: 'Attachments', zh: '附件' }, icone: Paperclip },
  { chave: 'notas', rotulo: { pt: 'Notas', en: 'Notes', zh: '备注' }, icone: StickyNote },
] as const satisfies readonly { chave: string; rotulo: T; icone: unknown }[];

type Separador = (typeof SEPARADORES)[number]['chave'];

export function FichaObjecto({
  objecto,
  subtitulo,
  grupos,
  acoes,
  extra,
  nomeDono,
}: {
  objecto: ObjectoCanonico;
  subtitulo?: React.ReactNode;
  grupos: GrupoCampos[];
  acoes?: React.ReactNode;
  /** Conteúdo adicional no separador Dados — desvios, medições, listas. */
  extra?: React.ReactNode;
  nomeDono?: string;
}) {
  const tr = useT();
  const fmt = useFmt();
  const [separador, setSeparador] = React.useState<Separador>('dados');
  const historico = historicoOrdenado(objecto);

  const contagem: Record<Separador, number | undefined> = {
    dados: undefined,
    relacoes: objecto.relacoes.length || undefined,
    historico: historico.length || undefined,
    anexos: objecto.anexos.length || undefined,
    notas: objecto.notas ? 1 : undefined,
  };

  return (
    <article className="cartao flex min-h-0 flex-col overflow-hidden">
      {/* Cabeçalho canónico: código · designação · tipo · estado · dono */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-fio px-5 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Codigo forte>{objecto.codigo}</Codigo>
            <EstadoBadge estado={objecto.estado} />
            {objecto.anulado && (
              <span className="rounded-full border border-transparent bg-vermelho/12 px-2.5 py-0.5 text-[11px] font-semibold text-vermelho">
                {tr({ pt: 'Anulado · substituído por', en: 'Annulled · replaced by', zh: '已作废 · 替代记录' })}{' '}
                {objecto.anulado.substituidoPor}
              </span>
            )}
          </div>
          <h1 className="display mt-2 text-[19px] leading-tight text-texto">
            {objecto.designacao}
          </h1>
          {subtitulo && <p className="mt-1.5 text-[12px] text-texto-2">{subtitulo}</p>}
          <p className="mt-2.5 text-[11px] text-texto-3">
            {tr({ pt: 'Dono', en: 'Owner', zh: '责任人' })}:{' '}
            <span className="text-texto-2">{nomeDono ?? objecto.dono}</span> ·{' '}
            {tr({
              pt: `versão ${objecto.versao} · alterado em ${fmt.data(objecto.alterado_em)}`,
              en: `version ${objecto.versao} · changed on ${fmt.data(objecto.alterado_em)}`,
              zh: `版本 ${objecto.versao} · 修改于 ${fmt.data(objecto.alterado_em)}`,
            })}
          </p>
        </div>
        {acoes && <div className="flex shrink-0 items-center gap-2">{acoes}</div>}
      </header>

      {/* Separadores fixos, iguais em todos os objectos */}
      <nav className="flex gap-0.5 overflow-x-auto border-b border-fio px-3">
        {SEPARADORES.map((s) => {
          const activo = separador === s.chave;
          return (
            <button
              key={s.chave}
              onClick={() => setSeparador(s.chave)}
              className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[12px] font-medium transition-colors ${
                activo
                  ? 'border-marca text-texto'
                  : 'border-transparent text-texto-3 hover:text-texto-2'
              }`}
            >
              <s.icone className="size-3.5" />
              {tr(s.rotulo)}
              {contagem[s.chave] !== undefined && (
                <span className="num rounded-full bg-white/10 px-1.5 text-[10px] text-texto-3">
                  {contagem[s.chave]}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {separador === 'dados' && (
          <div className="flex flex-col gap-6">
            {grupos.map((g) => (
              <section key={g.titulo}>
                <Rotulo className="mb-3">{g.titulo}</Rotulo>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                  {g.campos.map((c) => (
                    <div key={c.rotulo} className={c.largo ? 'col-span-full' : ''}>
                      <dt className="text-[11px] text-texto-3">{c.rotulo}</dt>
                      <dd className="mt-1 text-[13px] font-medium text-texto">{c.valor}</dd>
                      {c.nota && <p className="mt-1 text-[11px] leading-snug text-texto-3">{c.nota}</p>}
                    </div>
                  ))}
                </dl>
              </section>
            ))}
            {extra}
          </div>
        )}

        {separador === 'relacoes' && (
          <>
            {objecto.relacoes.length === 0 ? (
              <Vazio>
                {tr({
                  pt: 'Sem relações registadas.',
                  en: 'No relations recorded.',
                  zh: '尚无关联记录。',
                })}
              </Vazio>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {objecto.relacoes.map((r, i) => (
                  <li
                    key={`${r.tipo}-${r.destino}-${i}`}
                    className="flex items-baseline gap-3 border-b border-fio py-2.5 last:border-0"
                  >
                    <span className="w-32 shrink-0 text-[11px] text-texto-3">{r.tipo}</span>
                    <Codigo forte>{r.destino}</Codigo>
                    <span className="text-[11px] text-texto-3">{r.destinoTipo}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {separador === 'historico' && (
          <>
            <p className="mb-3 text-[11.5px] leading-snug text-texto-3">
              {tr({
                pt: 'Nenhum papel apaga registos. A correcção faz-se por novo registo que anula e substitui, com motivo obrigatório, e ambos ficam visíveis (§24.5).',
                en: 'No role deletes records. A correction is a new record that annuls and replaces, with a mandatory reason, and both stay visible (§24.5).',
                zh: '任何角色都不能删除记录。更正的方式是新建一条作废并替代原记录的记录，必须填写原因，两者均保持可见（§24.5）。',
              })}
            </p>
            {historico.length === 0 ? (
              <Vazio>
                {tr({
                  pt: `Sem alterações desde a criação, em ${fmt.data(objecto.criado_em)}.`,
                  en: `No changes since creation on ${fmt.data(objecto.criado_em)}.`,
                  zh: `自 ${fmt.data(objecto.criado_em)} 建立以来没有变更。`,
                })}
              </Vazio>
            ) : (
              <ul className="flex flex-col">
                {historico.map((h, i) => (
                  <li key={i} className="grid grid-cols-[auto_1fr] gap-3 border-b border-fio py-3 last:border-0">
                    <div className="w-28 shrink-0">
                      <div className="num text-[11.5px] text-texto-2">{fmt.data(h.em)}</div>
                      <Codigo>{h.por}</Codigo>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] font-medium text-texto">{h.campo}</div>
                      <div className="mt-0.5 flex flex-wrap items-baseline gap-2 text-[11.5px]">
                        <span className="text-texto-3 line-through">{valorLegivel(h.valorAnterior)}</span>
                        <span className="text-texto-3">→</span>
                        <span className="text-texto-2">{valorLegivel(h.valorNovo)}</span>
                      </div>
                      {h.motivo && (
                        <p className="mt-1 text-[11px] text-ambar">
                          {tr({ pt: 'Motivo', en: 'Reason', zh: '原因' })}: {h.motivo}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {separador === 'anexos' && (
          <>
            {objecto.anexos.length === 0 ? (
              <Vazio>{tr({ pt: 'Sem anexos.', en: 'No attachments.', zh: '无附件。' })}</Vazio>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {objecto.anexos.map((a) => (
                  <li key={a.id} className="flex items-baseline gap-3 border-b border-fio py-2.5 last:border-0">
                    <span className="text-[12px] text-texto">{a.designacao}</span>
                    <span className="text-[11px] text-texto-3">{a.tipoDocumental}</span>
                    <span className="num ml-auto text-[11px] text-texto-3">{fmt.data(a.em)}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {separador === 'notas' && (
          <>
            {objecto.notas ? (
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-texto-2">{objecto.notas}</p>
            ) : (
              <Vazio>{tr({ pt: 'Sem notas.', en: 'No notes.', zh: '无备注。' })}</Vazio>
            )}
          </>
        )}
      </div>
    </article>
  );
}

function valorLegivel(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}
