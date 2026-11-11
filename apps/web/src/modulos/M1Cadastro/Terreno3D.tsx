/**
 * M1 — Vista 3D do terreno (demonstração).
 *
 * Junta o que o cadastro sabe — zonas, áreas, talhões e o estado de cada um —
 * num relevo que se pode rodar. O relevo é gerado: o levantamento topográfico
 * está por obter (PEN-04), e a página di-lo em vez de o esconder.
 *
 * O three.js só se carrega aqui, por importação dinâmica: quem nunca abre a
 * vista 3D nunca o descarrega.
 */

import { Box, Info, Maximize2, Mountain, Plus, RotateCw, TreeDeciduous } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import { useBlocos, useTalhoes } from '../../dados/consultas';
import { HOJE } from '../../dados/semente';
import { useFmt, useT } from '../../i18n/contexto';
import { validarTalhao } from '@bastet/nucleo/validacao';
import { Pagina } from '../../design/Pagina';
import { Codigo, corHex, Painel, Semaforo } from '../../design/primitivas';
import type { Cena, Parcela, Zona } from './cena3d';

/** Fatias ilustrativas de uma zona ainda sem talhões. */
const FATIAS_DEMO = [0.3, 0.25, 0.25, 0.2];

export function Terreno3D() {
  const tr = useT();
  const fmt = useFmt();
  const blocos = useBlocos();
  const talhoes = useTalhoes();
  const contentor = React.useRef<HTMLDivElement>(null);
  const cena = React.useRef<Cena | null>(null);
  const [estado, setEstado] = React.useState<'a_carregar' | 'pronto' | 'sem_webgl'>('a_carregar');
  const [seleccionado, setSeleccionado] = React.useState<string | null>(null);
  const [arvores, setArvores] = React.useState(true);
  const [exagero, setExagero] = React.useState(2);
  const [rodar, setRodar] = React.useState(false);

  const zonas: Zona[] = React.useMemo(
    () =>
      blocos.map((b) => {
        const doBloco = talhoes.filter((t) => t.bloco === b.codigo);
        const area = b.area_total_ha.valor;
        if (doBloco.length === 0) {
          return {
            codigo: b.codigo,
            nome: b.designacao,
            areaHa: area,
            parcelas: FATIAS_DEMO.map((f, i) => ({
              codigo: `${b.codigo}-T${String(i + 1).padStart(2, '0')}?`,
              nome: '',
              areaHa: area * f,
              cor: corHex('cinzento'),
              demo: true,
            })),
          };
        }
        const parcelas: Parcela[] = doBloco.map((t) => {
          const v = validarTalhao(t, HOJE);
          const cor = v.constatacoes.length === 0 ? 'verde' : v.gravavel ? 'ambar' : 'vermelho';
          return {
            codigo: t.codigo,
            nome: t.designacao,
            areaHa: t.area_plantada_ha.valor,
            cor: corHex(cor),
            demo: false,
            arvores: t.total_plantas_estabelecidas,
          };
        });
        // A área da zona que ainda não está em talhões continua lá.
        const resto = area - parcelas.reduce((s, p) => s + p.areaHa, 0);
        if (resto > 0.5) {
          parcelas.push({
            codigo: `${b.codigo}-?`,
            nome: '',
            areaHa: resto,
            cor: corHex('cinzento'),
            demo: true,
          });
        }
        return { codigo: b.codigo, nome: b.designacao, areaHa: area, parcelas };
      }),
    [blocos, talhoes],
  );

  // A cena reconstrói-se quando os dados mudam, não quando as opções mudam.
  const assinatura = JSON.stringify(zonas);
  React.useEffect(() => {
    if (!contentor.current || zonas.length === 0) return;
    let cancelado = false;
    let criada: Cena | null = null;
    import('./cena3d')
      .then(({ criarCena }) => {
        if (cancelado || !contentor.current) return;
        try {
          criada = criarCena(contentor.current, zonas, setSeleccionado, { arvores, exagero, rodar });
          cena.current = criada;
          setEstado('pronto');
        } catch {
          setEstado('sem_webgl');
        }
      })
      .catch(() => setEstado('sem_webgl'));
    return () => {
      cancelado = true;
      criada?.destruir();
      cena.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assinatura]);

  React.useEffect(() => cena.current?.definir({ arvores, exagero, rodar }), [arvores, exagero, rodar, estado]);
  React.useEffect(() => cena.current?.seleccionar(seleccionado), [seleccionado, estado]);

  const todas = zonas.flatMap((z) => z.parcelas.map((p) => ({ ...p, zona: z })));
  const escolhida = todas.find((p) => p.codigo === seleccionado);
  const talhao = talhoes.find((t) => t.codigo === seleccionado);
  const areaTotal = zonas.reduce((s, z) => s + z.areaHa, 0);
  const arvoresAoCompasso = Math.round(areaTotal * 100);

  const escolher = (codigo: string) => {
    setSeleccionado(codigo);
    cena.current?.focar(codigo);
  };

  return (
    <Pagina>
      <p className="flex items-start gap-2 rounded-2xl bg-ambar-pastel px-4 py-3 text-[12.5px] text-ambar">
        <Info className="mt-0.5 size-4 shrink-0" />
        <span>
          <strong className="font-semibold">
            {tr({ pt: 'Demonstração.', en: 'Demonstration.', zh: '演示。' })}
          </strong>{' '}
          {tr({
            pt: 'As zonas, as áreas e os talhões registados são reais; o relevo e a posição no mapa são ilustrativos, até haver levantamento topográfico (PEN-04). Talhões a cinzento ainda não foram registados.',
            en: 'Zones, areas and recorded plots are real; the relief and map position are illustrative until a topographic survey exists (PEN-04). Grey plots have not been recorded yet.',
            zh: '区、面积和已登记地块为真实数据；地形与位置仅为示意，待地形测绘（PEN-04）完成后替换。灰色地块尚未登记。',
          })}
        </span>
      </p>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="cartao relative self-start overflow-hidden">
          <div
            ref={contentor}
            className="relative h-[62vh] min-h-[380px] w-full touch-none select-none bg-[#dfe8ec]"
            aria-label={tr({
              pt: 'Vista 3D do terreno. Arraste para rodar, role para aproximar.',
              en: '3D land view. Drag to rotate, scroll to zoom.',
              zh: '地块 3D 视图。拖动旋转，滚轮缩放。',
            })}
          />

          {estado !== 'pronto' && (
            <div className="absolute inset-0 grid place-items-center text-[13px] text-texto-2">
              {estado === 'a_carregar'
                ? tr({ pt: 'A preparar o terreno…', en: 'Preparing the terrain…', zh: '正在生成地形…' })
                : tr({
                    pt: 'Este aparelho não consegue mostrar 3D (WebGL indisponível).',
                    en: 'This device cannot show 3D (WebGL unavailable).',
                    zh: '此设备无法显示 3D（WebGL 不可用）。',
                  })}
            </div>
          )}

          {/* Controlos */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <Interruptor activo={arvores} aoMudar={setArvores} icone={TreeDeciduous}>
              {tr({ pt: 'Árvores', en: 'Trees', zh: '树木' })}
            </Interruptor>
            <Interruptor activo={rodar} aoMudar={setRodar} icone={RotateCw}>
              {tr({ pt: 'Rodar', en: 'Rotate', zh: '旋转' })}
            </Interruptor>
            <label className="flex h-8 items-center gap-2 rounded-full bg-cartao/90 px-3 text-[12px] font-medium text-texto-2 shadow-sm backdrop-blur">
              <Mountain className="size-3.5" />
              {tr({ pt: 'Relevo', en: 'Relief', zh: '地形' })}
              <input
                type="range"
                min={1}
                max={4}
                step={0.5}
                value={exagero}
                onChange={(e) => setExagero(Number(e.target.value))}
                className="w-20 accent-[#0e0c19]"
              />
              <span className="num w-7 text-texto">×{exagero}</span>
            </label>
            <button
              onClick={() => {
                setSeleccionado(null);
                cena.current?.focar(null);
              }}
              className="flex h-8 items-center gap-1.5 rounded-full bg-cartao/90 px-3 text-[12px] font-medium text-texto-2 shadow-sm backdrop-blur hover:text-texto"
            >
              <Maximize2 className="size-3.5" />
              {tr({ pt: 'Centrar', en: 'Recentre', zh: '居中' })}
            </button>
          </div>

          {/* Legenda */}
          <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-cartao/90 px-3 py-2 text-[11px] text-texto-2 shadow-sm backdrop-blur">
            {(
              [
                ['verde', { pt: 'Conforme', en: 'Compliant', zh: '合规' }],
                ['ambar', { pt: 'Com excepção', en: 'With exceptions', zh: '有例外' }],
                ['vermelho', { pt: 'Bloqueado', en: 'Blocked', zh: '阻断' }],
                ['cinzento', { pt: 'Por registar', en: 'Not recorded', zh: '未登记' }],
              ] as const
            ).map(([c, r]) => (
              <span key={c} className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm" style={{ background: corHex(c) }} />
                {tr(r)}
              </span>
            ))}
            <span className="hidden text-texto-3 sm:inline">
              · {tr({ pt: 'arraste para rodar, role para aproximar', en: 'drag to rotate, scroll to zoom', zh: '拖动旋转，滚轮缩放' })}
            </span>
          </div>
        </section>

        <div className="flex min-w-0 flex-col gap-4">
          {escolhida ? (
            <Painel
              titulo={
                <span className="flex items-center gap-2">
                  <Codigo forte>{escolhida.codigo}</Codigo>
                  {escolhida.nome}
                </span>
              }
              descricao={`${escolhida.zona.nome} · ${escolhida.zona.codigo}`}
            >
              <dl className="grid grid-cols-2 gap-3 text-[12.5px]">
                <div>
                  <dt className="text-texto-3">{tr({ pt: 'Área', en: 'Area', zh: '面积' })}</dt>
                  <dd className="num font-semibold text-texto">
                    {fmt.numero(escolhida.areaHa, 1)} {fmt.unidade('ha')}
                  </dd>
                </div>
                <div>
                  <dt className="text-texto-3">{tr({ pt: 'Árvores', en: 'Trees', zh: '树木' })}</dt>
                  <dd className="num font-semibold text-texto">
                    {escolhida.demo
                      ? `~${fmt.inteiro(Math.round(escolhida.areaHa * 100))}`
                      : fmt.inteiro(escolhida.arvores ?? 0)}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="mb-1 text-texto-3">{tr({ pt: 'Estado', en: 'Status', zh: '状态' })}</dt>
                  <dd>
                    {escolhida.demo ? (
                      <Semaforo cor="cinzento" rotulo={tr({ pt: 'por registar', en: 'not recorded', zh: '未登记' })} />
                    ) : (
                      <Semaforo
                        cor={talhao && validarTalhao(talhao, HOJE).constatacoes.length === 0 ? 'verde' : 'ambar'}
                        rotulo={tr(
                          talhao && validarTalhao(talhao, HOJE).constatacoes.length === 0
                            ? { pt: 'conforme', en: 'compliant', zh: '合规' }
                            : { pt: 'com excepção', en: 'with exceptions', zh: '有例外' },
                        )}
                      />
                    )}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                {escolhida.demo ? (
                  <Link
                    to="/talhoes?novo=1"
                    className="flex items-center gap-1.5 rounded-full bg-texto px-3.5 py-1.5 text-[12px] font-semibold text-white"
                  >
                    <Plus className="size-3.5" />
                    {tr({ pt: 'Registar este terreno', en: 'Record this plot', zh: '登记此地块' })}
                  </Link>
                ) : (
                  <>
                    <Link
                      to={`/talhoes/${encodeURIComponent(escolhida.codigo)}`}
                      className="rounded-full bg-bloco px-3.5 py-1.5 text-[12px] font-semibold text-texto-2 hover:text-texto"
                    >
                      {tr({ pt: 'Abrir ficha', en: 'Open sheet', zh: '打开明细' })}
                    </Link>
                    <Link
                      to={`/ordens?novo=1&talhao=${encodeURIComponent(escolhida.codigo)}`}
                      className="flex items-center gap-1.5 rounded-full bg-texto px-3.5 py-1.5 text-[12px] font-semibold text-white"
                    >
                      <Plus className="size-3.5" />
                      {tr({ pt: 'Criar tarefa aqui', en: 'Create task here', zh: '在此新建任务' })}
                    </Link>
                  </>
                )}
              </div>
            </Painel>
          ) : (
            <Painel titulo={tr({ pt: 'Clique num talhão', en: 'Click a plot', zh: '点击一个地块' })}>
              <p className="text-[12.5px] text-texto-2">
                {tr({
                  pt: 'Escolha um talhão no mapa ou na lista para ver a área, as árvores e o estado — e criar a próxima tarefa a partir dele.',
                  en: 'Pick a plot on the map or in the list to see its area, trees and status — and create the next task from it.',
                  zh: '在地图或列表中选择地块，查看面积、树木和状态，并由此新建下一项任务。',
                })}
              </p>
            </Painel>
          )}

          <Painel
            titulo={tr({ pt: 'Zonas e talhões', en: 'Zones and plots', zh: '区与地块' })}
            descricao={tr({
              pt: `${fmt.numero(areaTotal, 1)} ha · ~${fmt.inteiro(arvoresAoCompasso)} árvores a 10 × 10 m`,
              en: `${fmt.numero(areaTotal, 1)} ha · ~${fmt.inteiro(arvoresAoCompasso)} trees at 10 × 10 m`,
              zh: `${fmt.numero(areaTotal, 1)} 公顷 · 按 10 × 10 米约 ${fmt.inteiro(arvoresAoCompasso)} 株`,
            })}
            denso
          >
            <ul className="flex flex-col gap-3 px-3 pb-3">
              {zonas.map((z) => (
                <li key={z.codigo}>
                  <div className="flex items-baseline gap-2 px-2 pb-1 text-[12.5px] font-semibold text-texto">
                    <Box className="size-3.5 self-center text-texto-3" />
                    {z.nome}
                    <span className="codigo">{z.codigo}</span>
                  </div>
                  <ul>
                    {z.parcelas.map((p) => (
                      <li key={p.codigo}>
                        <button
                          onClick={() => escolher(p.codigo)}
                          className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-[12.5px] transition-colors ${
                            p.codigo === seleccionado ? 'bg-bloco-2 text-texto' : 'text-texto-2 hover:bg-bloco'
                          }`}
                        >
                          <span className="size-2.5 shrink-0 rounded-sm" style={{ background: p.cor }} />
                          <span className="font-mono text-[11.5px]">{p.codigo}</span>
                          <span className="min-w-0 flex-1 truncate">
                            {p.demo ? tr({ pt: 'por registar', en: 'not recorded', zh: '未登记' }) : p.nome}
                          </span>
                          <span className="num text-texto-3">{fmt.numero(p.areaHa, 1)} ha</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </Painel>
        </div>
      </div>
    </Pagina>
  );
}

function Interruptor({
  activo,
  aoMudar,
  icone: Icone,
  children,
}: {
  activo: boolean;
  aoMudar: (v: boolean) => void;
  icone: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={() => aoMudar(!activo)}
      aria-pressed={activo}
      className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium shadow-sm backdrop-blur transition-colors ${
        activo ? 'bg-texto text-white' : 'bg-cartao/90 text-texto-2 hover:text-texto'
      }`}
    >
      <Icone className="size-3.5" />
      {children}
    </button>
  );
}
