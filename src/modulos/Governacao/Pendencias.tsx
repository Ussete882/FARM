/**
 * Pendências de parametrização.
 *
 * O documento assinala divergências por resolver e parâmetros por confirmar.
 * O sistema mostra-os por resolver em vez de escolher um valor em silêncio:
 * um número escolhido às escondidas passa a facto, e deixa de ser discutível.
 */

import { FileQuestion, Landmark, TriangleAlert } from 'lucide-react';

import { usePendencias } from '../../dados/consultas';
import { HOJE } from '../../dados/semente';
import type { Pendencia } from '../../dados/db';
import { useFmt, useT } from '../../i18n/contexto';
import type { T } from '../../i18n/nucleo';
import { parametrosPorConfirmar } from '../../dominio/parametros';
import { Pagina } from '../../design/Pagina';
import { CartaoMetrica, Codigo, Painel, Rotulo, Semaforo } from '../../design/primitivas';

const ROTULO_CATEGORIA: Record<Pendencia['categoria'], T> = {
  quadro_pessoal: { pt: 'Quadro de pessoal', en: 'Headcount', zh: '人员编制' },
  parametro_legal: { pt: 'Parâmetro legal', en: 'Legal parameter', zh: '法定参数' },
  meta_tecnica: { pt: 'Meta técnica', en: 'Technical target', zh: '技术目标' },
  area_plantada: { pt: 'Área plantada', en: 'Planted area', zh: '种植面积' },
  meios: { pt: 'Meios', en: 'Means', zh: '条件与设备' },
  outro: { pt: 'Outro', en: 'Other', zh: '其他' },
};

const ROTULO_ESTADO_PEND: Record<Pendencia['estado'], T> = {
  por_resolver: { pt: 'Por resolver', en: 'Unresolved', zh: '待解决' },
  em_analise: { pt: 'Em análise', en: 'Under review', zh: '分析中' },
  resolvida: { pt: 'Resolvida', en: 'Resolved', zh: '已解决' },
};

export function Pendencias() {
  const tr = useT();
  const fmt = useFmt();
  const pendencias = usePendencias();
  const porConfirmar = parametrosPorConfirmar(HOJE);

  const porResolver = pendencias.filter((p) => p.estado === 'por_resolver');
  const comDecisao = pendencias.filter((p) => p.decisaoAssociada).length;
  const porCategoria = new Map<string, Pendencia[]>();
  for (const p of pendencias) {
    porCategoria.set(p.categoria, [...(porCategoria.get(p.categoria) ?? []), p]);
  }

  return (
    <Pagina
      descricao={tr({
        pt: 'Divergências e valores por confirmar que o documento assinala. Não são notas de rodapé: enquanto estiverem abertas, os números que delas dependem transportam uma ressalva onde quer que apareçam.',
        en: 'Divergences and unconfirmed values flagged by the document. These are not footnotes: while they stay open, every number that depends on them carries a caveat wherever it appears.',
        zh: '文件标注的分歧与待确认取值。这不是脚注：只要尚未定论，依赖它们的数字无论出现在哪里，都带着保留。',
      })}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <CartaoMetrica
          destaque
          icone={TriangleAlert}
          cor={porResolver.length > 0 ? 'ambar' : 'verde'}
          rotulo={tr(ROTULO_ESTADO_PEND.por_resolver)}
          valor={fmt.inteiro(porResolver.length)}
          unidade={tr({
            pt: `de ${pendencias.length}`,
            en: `of ${pendencias.length}`,
            zh: `共 ${pendencias.length} 项`,
          })}
          legenda={tr({
            pt: `${porCategoria.size} categorias`,
            en: `${porCategoria.size} categories`,
            zh: `${porCategoria.size} 个类别`,
          })}
          frase={tr({
            pt: 'A resposta do gestor de 21/09/2026 respondeu «não existe» a quase tudo. Áreas por medir, árvores por contar, sem balança, sem energia, um telemóvel em 22 pessoas. Nenhuma destas se resolve escolhendo um número.',
            en: 'The manager’s reply of 21/09/2026 answered «does not exist» to almost everything. Areas unmeasured, trees uncounted, no scale, no power, one phone among 22 people. None of these is settled by picking a number.',
            zh: '经理 2026 年 9 月 21 日的答复，几乎对每一项都回答「没有」。面积未测、树未清点、无磅秤、无电力、22 人共用一部手机。这些问题都不是敲定一个数字就能解决的。',
          })}
        />

        <CartaoMetrica
          icone={Landmark}
          cor={porConfirmar.length > 0 ? 'ambar' : 'verde'}
          rotulo={tr({
            pt: 'Parâmetros por confirmar',
            en: 'Parameters to confirm',
            zh: '待确认参数',
          })}
          valor={fmt.inteiro(porConfirmar.length)}
          frase={tr({
            pt: 'O motor de regras já os aplica — bloquear com um valor provável é melhor do que não bloquear. Mas o estado de confirmação viaja com o valor.',
            en: 'The rules engine already applies them — blocking on a probable value beats not blocking. But the confirmation status travels with the value.',
            zh: '规则引擎已在适用它们——用一个大概率正确的值去阻断，好过不阻断。但确认状态始终随取值一同呈现。',
          })}
          para="/parametros"
        />

        <CartaoMetrica
          icone={FileQuestion}
          cor="cinzento"
          rotulo={tr({
            pt: 'Com decisão associada',
            en: 'With a decision attached',
            zh: '已关联决议',
          })}
          valor={fmt.inteiro(comDecisao)}
          frase={tr({
            pt: 'Pendências que aguardam um acto de decisão registado do Conselho ou da Direcção. O registo de decisões entra com o M7, na Fase 2.',
            en: 'Open questions awaiting a recorded decision from the Board or the Directorate. The decision register arrives with M7, in Phase 2.',
            zh: '等待理事会或管理层正式决议的事项。决议登记随第二阶段的 M7 上线。',
          })}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {[...porCategoria.entries()].map(([categoria, lista]) => (
          <Painel
            key={categoria}
            titulo={tr(ROTULO_CATEGORIA[categoria as Pendencia['categoria']])}
          >
            <ul className="flex flex-col gap-4">
              {lista.map((p) => (
                <li key={p.codigo} className="border-b border-fio pb-4 last:border-0 last:pb-0">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <Codigo forte>{p.codigo}</Codigo>
                    <Semaforo
                      cor={
                        p.estado === 'resolvida'
                          ? 'verde'
                          : p.estado === 'em_analise'
                            ? 'ambar'
                            : 'vermelho'
                      }
                      rotulo={tr(ROTULO_ESTADO_PEND[p.estado])}
                    />
                    <span className="codigo ml-auto">{p.seccao}</span>
                  </div>
                  <h3 className="mt-1.5 text-[13px] font-medium text-texto">{tr(p.titulo)}</h3>
                  <p className="mt-1 text-[12px] leading-relaxed text-texto-2">{tr(p.descricao)}</p>
                  <p className="mt-1.5 text-[11px] text-texto-3">
                    {tr({ pt: 'Dono', en: 'Owner', zh: '责任人' })}: <Codigo>{p.dono}</Codigo>
                    {p.decisaoAssociada && (
                      <>
                        {' · '}
                        {tr({
                          pt: 'decisão associada',
                          en: 'decision attached',
                          zh: '关联决议',
                        })}
                        : <Codigo>{p.decisaoAssociada}</Codigo>
                      </>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </Painel>
        ))}
      </div>

      <Painel
        titulo={tr({
          pt: 'Parâmetros aplicados mas ainda por confirmar',
          en: 'Parameters applied but not yet confirmed',
          zh: '已适用但尚未确认的参数',
        })}
        descricao={tr({
          pt: 'O motor de regras usa-os já — bloquear com um valor provável é preferível a não bloquear. Mas o estado de confirmação viaja com o valor.',
          en: 'The rules engine already uses them — blocking on a probable value is better than not blocking. But the confirmation status travels with the value.',
          zh: '规则引擎已在使用它们——用大概率正确的值阻断，好过不阻断。但确认状态始终随取值一同呈现。',
        })}
      >
        <ul className="flex flex-col gap-3">
          {porConfirmar.map(({ parametro, valor }) => (
            <li key={parametro.codigo} className="border-b border-fio pb-3 last:border-0 last:pb-0">
              <div className="flex flex-wrap items-baseline gap-2">
                <Codigo forte>{parametro.codigo}</Codigo>
                <span className="text-[12.5px] text-texto">{tr(parametro.designacao)}</span>
                <span className="num ml-auto text-[13px] font-medium text-texto">
                  {fmt.numero(valor.valor, 2)} {tr(parametro.unidade)}
                </span>
              </div>
              <p className="mt-1 text-[11.5px] text-texto-3">
                {tr({
                  pt: `Em vigor desde ${fmt.data(valor.data_efeito)} · fonte:`,
                  en: `In force since ${fmt.data(valor.data_efeito)} · source:`,
                  zh: `自 ${fmt.data(valor.data_efeito)} 生效 · 来源：`,
                })}{' '}
                {tr(valor.fonte)}
              </p>
              {valor.observacao && (
                <p className="mt-1 text-[11.5px] text-ambar">{tr(valor.observacao)}</p>
              )}
            </li>
          ))}
        </ul>
      </Painel>

      <Painel
        titulo={tr({
          pt: 'Porque é que isto está aqui',
          en: 'Why this screen exists',
          zh: '这个页面为何存在',
        })}
      >
        <Rotulo className="mb-2">
          {tr({ pt: 'Princípio', en: 'Principle', zh: '原则' })}
        </Rotulo>
        <p className="max-w-3xl text-[12.5px] leading-relaxed text-texto-2">
          {tr({
            pt: 'Estas doze pendências não são dúvidas do sistema: são as respostas do gestor, lidas como o que são. Onde ele escreveu «não existe», o sistema escreve «por resolver» e diz de quem é. Um sistema que escolhesse um valor para cada uma ficaria coerente por dentro e errado por fora — e a farma continuaria sem balança. Enquanto a decisão não for tomada por quem tem autoridade para a tomar, o sistema continua a mostrar que não está tomada.',
            en: 'These twelve open questions are not the system’s doubts: they are the manager’s answers, read for what they are. Where he wrote «does not exist», the system writes «unresolved» and says whose it is. A system that picked a value for each would be coherent inside and wrong outside — and the farm would still have no scale. Until the decision is taken by whoever has the authority to take it, the system keeps showing that it has not been taken.',
            zh: '这十二项待决事项并非系统的疑问，而是经理的答复本身。他写下「没有」之处，系统写下「待解决」并标明责任人。若系统自行逐项敲定数值，它会内部自洽而对外错误——而农场依旧没有磅秤。在有权决定的人作出决定之前，系统会一直显示这件事尚未定论。',
          })}
        </p>
      </Painel>
    </Pagina>
  );
}
