/**
 * BASTET — pesquisa global.
 *
 * O código é legível, ordenável e verificável (§6.1), pelo que é também a
 * forma mais rápida de navegar: escrever `FA-B01-T04` leva ao talhão.
 */

import { Search } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import {
  useOrdens,
  usePesagens,
  useRelatorios,
  useTalhoes,
  useTrabalhadores,
} from '../dados/consultas';
import { categoria } from '@bastet/nucleo/pessoas';
import { Codigo } from '../design/primitivas';
import { useT } from '../i18n/contexto';
import type { T } from '@bastet/nucleo/i18n';

interface Resultado {
  codigo: string;
  designacao: string;
  tipo: T;
  para: string;
}

const TIPO = {
  talhao: { pt: 'Talhão', en: 'Plot', zh: '地块' },
  trabalhador: { pt: 'Trabalhador', en: 'Worker', zh: '工人' },
  ordem: { pt: 'Ordem de trabalho', en: 'Work order', zh: '工单' },
  relatorio: { pt: 'Relatório diário', en: 'Daily report', zh: '田间日报' },
  pesagem: { pt: 'Pesagem', en: 'Weighing', zh: '称重' },
} satisfies Record<string, T>;

export function Pesquisa({ aberta, aoFechar }: { aberta: boolean; aoFechar: () => void }) {
  const tr = useT();
  const [termo, setTermo] = React.useState('');
  const [seleccionado, setSeleccionado] = React.useState(0);
  const navegar = useNavigate();
  const campo = React.useRef<HTMLInputElement>(null);

  const talhoes = useTalhoes();
  const trabalhadores = useTrabalhadores();
  const pesagens = usePesagens();
  const ordens = useOrdens();
  const relatorios = useRelatorios();

  const universo: Resultado[] = React.useMemo(
    () => [
      ...talhoes.map((x) => ({
        codigo: x.codigo,
        designacao: x.designacao,
        tipo: TIPO.talhao,
        para: `/talhoes/${x.codigo}`,
      })),
      ...trabalhadores.map((x) => ({
        codigo: x.codigo,
        designacao: `${x.nome_completo} · ${tr(categoria(x.categoria_profissional))}`,
        tipo: TIPO.trabalhador,
        para: `/trabalhadores/${x.codigo}`,
      })),
      ...ordens.map((o) => ({
        codigo: o.codigo,
        designacao: o.designacao,
        tipo: TIPO.ordem,
        para: `/ordens/${o.codigo}`,
      })),
      ...relatorios.map((r) => ({
        codigo: r.codigo,
        designacao: r.designacao,
        tipo: TIPO.relatorio,
        para: `/relatorios/${r.codigo}`,
      })),
      ...pesagens.map((p) => ({
        codigo: p.codigo,
        designacao: p.designacao,
        tipo: TIPO.pesagem,
        para: `/pesagens/${p.codigo}`,
      })),
    ],
    [talhoes, trabalhadores, ordens, relatorios, pesagens],
  );

  const resultados = React.useMemo(() => {
    const q = termo.trim().toLowerCase();
    if (!q) return universo.slice(0, 8);
    return universo
      .filter((r) => r.codigo.toLowerCase().includes(q) || r.designacao.toLowerCase().includes(q))
      .slice(0, 20);
  }, [termo, universo]);

  React.useEffect(() => {
    if (aberta) {
      setTermo('');
      setSeleccionado(0);
      queueMicrotask(() => campo.current?.focus());
    }
  }, [aberta]);

  React.useEffect(() => setSeleccionado(0), [termo]);

  if (!aberta) return null;

  const escolher = (r: Resultado) => {
    navegar(r.para);
    aoFechar();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 pt-[12vh] backdrop-blur-sm"
      onClick={aoFechar}
    >
      <div
        className="cartao mx-4 w-full max-w-xl overflow-hidden bg-cartao"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-fio px-4 py-3.5">
          <Search className="size-4 shrink-0 text-texto-3" />
          <input
            ref={campo}
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSeleccionado((s) => Math.min(s + 1, resultados.length - 1));
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSeleccionado((s) => Math.max(s - 1, 0));
              }
              if (e.key === 'Enter' && resultados[seleccionado]) escolher(resultados[seleccionado]);
            }}
            placeholder={tr({
              pt: 'Código ou nome: FA-B01-T04, TR-00042, OT-2026-00012…',
              en: 'Code or name: FA-B01-T04, TR-00042, OT-2026-00012…',
              zh: '编码或名称：FA-B01-T04、TR-00042、OT-2026-00012…',
            })}
            className="w-full bg-transparent text-[13.5px] text-texto outline-none placeholder:text-texto-3"
          />
        </div>

        <ul className="max-h-[52vh] overflow-y-auto py-1">
          {resultados.length === 0 && (
            <li className="px-4 py-8 text-center text-[12px] text-texto-3">
              {tr({
                pt: `Nenhum objecto corresponde a «${termo}».`,
                en: `No object matches «${termo}».`,
                zh: `没有与「${termo}」匹配的对象。`,
              })}
            </li>
          )}
          {resultados.map((r, i) => (
            <li key={r.codigo}>
              <button
                onMouseEnter={() => setSeleccionado(i)}
                onClick={() => escolher(r)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === seleccionado ? 'bg-bloco' : 'hover:bg-bloco'
                }`}
              >
                <Codigo forte>{r.codigo}</Codigo>
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-texto-2">{r.designacao}</span>
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-texto-3">
                  {tr(r.tipo)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
