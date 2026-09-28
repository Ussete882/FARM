/**
 * F-02 — Ficha de árvore ou de linha.
 *
 * «Este é o registo que torna possível medir o que hoje não se mede.»
 *
 * Duas ocasiões o preenchem: a marcação inicial da amostra permanente — 30
 * árvores por talhão, que o F-15 pesa a cada ronda — e o inventário anual, que
 * conta as 10 780 árvores uma a uma. É desse inventário que depende o
 * K-PRD-05, e é por ele faltar que o K-PRD-01 é hoje calculado sobre o total
 * de árvores plantadas em vez das produtivas.
 */

import React from 'react';

import { useArvores, useTalhoes, useTrabalhadores } from '../../dados/consultas';
import { gravarArvore } from '../../dados/escrever';
import { HOJE } from '../../dados/semente';
import { q } from '@bastet/nucleo/canonico';
import { codigo } from '@bastet/nucleo/codigos';
import { useFmt, useT } from '../../i18n/contexto';
import { COL, UI } from '../../i18n/comuns';
import {
  ESTADOS_ARVORE,
  ROTULO_ESTADO_ARVORE,
  ROTULO_VIGOR,
  VIGORES,
  type EstadoArvore,
  type Vigor,
} from '@bastet/nucleo/territorio';
import { resultado, type Constatacao } from '@bastet/nucleo/validacao';
import {
  Campo,
  Derivado,
  Formulario,
  Grelha,
  Numero,
  Pastilhas,
  Seleccao,
  Texto,
} from '../../design/Formulario';

export function FormularioF02({ aoFechar }: { aoFechar: () => void }) {
  const tr = useT();
  const fmt = useFmt();
  const talhoes = useTalhoes();
  const arvores = useArvores();
  const trabalhadores = useTrabalhadores();

  const [talhaoCod, setTalhaoCod] = React.useState('');
  const [linha, setLinha] = React.useState<number | ''>('');
  const [posicao, setPosicao] = React.useState<number | ''>('');
  const [estado, setEstado] = React.useState<EstadoArvore>('viva');
  const [vigor, setVigor] = React.useState<Vigor>('bom');
  const [altura, setAltura] = React.useState<number | ''>('');
  const [diametro, setDiametro] = React.useState<number | ''>('');
  const [sintomas, setSintomas] = React.useState('');
  const [causa, setCausa] = React.useState('');
  const [amostra, setAmostra] = React.useState(false);
  const [gravado, setGravado] = React.useState<string | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);

  const talhao = talhoes.find((t) => t.codigo === talhaoCod) ?? talhoes[0];
  const talhaoActivo = talhao?.codigo ?? '';
  const viva = estado === 'viva';

  // O observador é o técnico encarregado do bloco a que o talhão pertence.
  const observador = talhaoActivo.startsWith('FA-B01') ? 'TR-00003' : 'TR-00004';

  const naAmostra = arvores.filter((a) => a.talhao === talhaoActivo && a.amostra_permanente).length;

  const linhaN = linha === '' ? 0 : Number(linha);
  const posicaoN = posicao === '' ? 0 : Number(posicao);
  const cod =
    linhaN > 0 && posicaoN > 0 ? codigo.arvore(talhaoActivo, linhaN, posicaoN) : '—';

  const jaExiste = arvores.some((a) => a.codigo === cod);

  const rascunho = React.useMemo(
    () => ({
      id: cod,
      codigo: cod,
      designacao: `${tr({ pt: 'Árvore', en: 'Tree', zh: '树' })} ${linhaN}/${posicaoN}`,
      tipo: 'arvore' as const,
      estado: 'activo' as const,
      dono: observador,
      criado_em: HOJE,
      criado_por: observador,
      alterado_em: HOJE,
      alterado_por: observador,
      versao: 1,
      relacoes: [],
      historico: [],
      anexos: [],
      talhao: talhaoActivo,
      linha: linhaN,
      posicao: posicaoN,
      variedade: talhao?.variedade,
      ano_plantio: talhao?.ano_plantio,
      estado_arvore: estado,
      altura_m: altura === '' ? undefined : q(Number(altura), 'm'),
      diametro_tronco_cm: diametro === '' ? undefined : q(Number(diametro), 'cm'),
      vigor: viva ? vigor : undefined,
      sintomas: sintomas || undefined,
      causa_provavel: causa || undefined,
      amostra_permanente: amostra,
      data_observacao: HOJE,
      observador,
    }),
    [
      cod,
      linhaN,
      posicaoN,
      observador,
      talhaoActivo,
      talhao,
      estado,
      altura,
      diametro,
      viva,
      vigor,
      sintomas,
      causa,
      amostra,
    ],
  );

  // A árvore não tem entrada no §8: as regras que a governam são de
  // integridade — posição válida, código não repetido, e causa declarada
  // quando a árvore não está viva.
  const validacao = React.useMemo(() => {
    const f: Constatacao[] = [];

    if (linhaN <= 0 || posicaoN <= 0) {
      f.push({
        regra: 'E-08',
        severidade: 'bloqueante',
        campo: 'linha',
        mensagem: {
          pt: 'A linha e a posição identificam a árvore dentro do talhão, e formam o código. Sem elas não há registo.',
          en: 'Row and position identify the tree within the plot, and form the code. Without them there is no record.',
          zh: '行与株位在地块内标识该树，并构成编码。没有它们就无法登记。',
        },
        fundamento: {
          pt: '§6.2 · §7.2 E-08',
          en: '§6.2 · §7.2 E-08',
          zh: '§6.2 · §7.2 E-08',
        },
      });
    }

    if (talhao?.numero_linhas && linhaN > talhao.numero_linhas) {
      f.push({
        regra: 'E-08',
        severidade: 'aviso',
        campo: 'linha',
        mensagem: {
          pt: `A linha ${linhaN} está fora das ${talhao.numero_linhas} linhas registadas no talhão. Confirme o levantamento.`,
          en: `Row ${linhaN} is outside the ${talhao.numero_linhas} rows on record for this plot. Check the survey.`,
          zh: `第 ${linhaN} 行超出本地块已登记的 ${talhao.numero_linhas} 行。请核对测绘。`,
        },
        fundamento: { pt: '§7.1 E-01', en: '§7.1 E-01', zh: '§7.1 E-01' },
      });
    }

    if (jaExiste) {
      f.push({
        regra: 'R4',
        severidade: 'bloqueante',
        campo: 'posicao',
        mensagem: {
          pt: `Já existe árvore registada em ${cod}. O código é único e imutável; para corrigir a ficha, altere a existente.`,
          en: `A tree is already recorded at ${cod}. The code is unique and immutable; to correct the sheet, edit the existing one.`,
          zh: `${cod} 已登记树木。编码唯一且不可变更；如需更正，请修改现有记录。`,
        },
        fundamento: {
          pt: '§2.3 · regra inviolável R4',
          en: '§2.3 · inviolable rule R4',
          zh: '§2.3 · 不可违背规则 R4',
        },
      });
    }

    if (!viva && !causa.trim()) {
      f.push({
        regra: 'F-02',
        severidade: 'bloqueante',
        campo: 'causa_provavel',
        mensagem: {
          pt: 'Uma árvore morta, ausente ou substituída exige causa provável. É o que separa uma falha explicada de uma perda silenciosa.',
          en: 'A dead, missing or replaced tree requires a probable cause. It is what separates an explained failure from a silent loss.',
          zh: '死亡、缺株或已补植的树必须填写可能原因。这区分了一次有交代的损失与一次无声的消失。',
        },
        fundamento: { pt: '§Anexo A F-02', en: '§Annex A F-02', zh: '§附录 A F-02' },
      });
    }

    if (viva && vigor !== 'bom' && !sintomas.trim()) {
      f.push({
        regra: 'F-02',
        severidade: 'aviso',
        campo: 'sintomas',
        mensagem: {
          pt: 'Vigor abaixo de bom sem sintomas descritos: o agrónomo não tem por onde começar.',
          en: 'Vigour below good with no symptoms described: the agronomist has nowhere to start.',
          zh: '长势低于良好却未描述症状：农艺师无从下手。',
        },
        fundamento: { pt: '§Anexo A F-02', en: '§Annex A F-02', zh: '§附录 A F-02' },
      });
    }

    return resultado(f);
  }, [linhaN, posicaoN, talhao, jaExiste, cod, viva, causa, vigor, sintomas]);

  const gravar = async () => {
    const {
      id: _i,
      criado_em: _c,
      criado_por: _cp,
      alterado_em: _a,
      alterado_por: _ap,
      versao: _v,
      historico: _h,
      ...resto
    } = rascunho;
    try {
      setErro(null);
      const guardada = await gravarArvore(resto);
      setGravado(guardada.codigo);
    } catch (e) {
      setErro(
        e instanceof Error
          ? `${tr({ pt: 'A árvore não foi gravada', en: 'The tree was not saved', zh: '树木未保存' })}: ${e.message}`
          : tr({
              pt: 'A árvore não foi gravada por um erro inesperado.',
              en: 'The tree was not saved due to an unexpected error.',
              zh: '因意外错误，树木未保存。',
            }),
      );
    }
  };

  return (
    <Formulario
      titulo={tr({ pt: 'Ficha de árvore', en: 'Tree sheet', zh: '树木表单' })}
      formulario="F-02"
      codigo={cod}
      validacao={validacao}
      aoGravar={gravar}
      aoFechar={aoFechar}
      gravado={gravado}
      erro={erro}
    >
      <Grelha>
        <Campo
          rotulo={tr(COL.talhao)}
          nota={tr({
            pt: `${naAmostra} árvores na amostra permanente deste talhão.`,
            en: `${naAmostra} trees in this plot’s permanent sample.`,
            zh: `本地块固定样本共 ${naAmostra} 棵。`,
          })}
        >
          <Seleccao value={talhaoActivo} onChange={setTalhaoCod}>
            {talhoes.map((t) => (
              <option key={t.codigo} value={t.codigo}>
                {t.codigo} · {t.designacao}
              </option>
            ))}
          </Seleccao>
        </Campo>

        <Campo
          rotulo={tr({ pt: 'Linha', en: 'Row', zh: '行' })}
          nota={
            talhao?.numero_linhas
              ? tr({
                  pt: `${talhao.numero_linhas} linhas no talhão.`,
                  en: `${talhao.numero_linhas} rows in the plot.`,
                  zh: `本地块共 ${talhao.numero_linhas} 行。`,
                })
              : undefined
          }
        >
          <Numero valor={linha} aoMudar={setLinha} passo="1" />
        </Campo>

        <Campo rotulo={tr({ pt: 'Posição na linha', en: 'Position in row', zh: '行内株位' })}>
          <Numero valor={posicao} aoMudar={setPosicao} passo="1" />
        </Campo>

        <Campo
          rotulo={tr(COL.codigo)}
          nota={tr({
            pt: 'Formado a partir do talhão, da linha e da posição.',
            en: 'Built from the plot, the row and the position.',
            zh: '由地块、行与株位组成。',
          })}
        >
          <Derivado>{cod}</Derivado>
        </Campo>

        <Campo
          rotulo={tr({
            pt: 'Variedade e ano',
            en: 'Variety and year',
            zh: '品种与年份',
          })}
          nota={tr({
            pt: 'Herdados do talhão.',
            en: 'Inherited from the plot.',
            zh: '继承自地块。',
          })}
        >
          <Derivado>
            {talhao?.variedade ?? '—'} · {talhao?.ano_plantio ?? '—'}
          </Derivado>
        </Campo>

        <Campo rotulo={tr({ pt: 'Observador', en: 'Observer', zh: '观察人' })}>
          <Derivado>
            {trabalhadores.find((t) => t.codigo === observador)?.nome_completo ?? observador}
          </Derivado>
        </Campo>

        <Campo rotulo={tr(COL.estado)} largo>
          <Pastilhas
            opcoes={ESTADOS_ARVORE}
            valor={estado}
            aoMudar={setEstado}
            rotulos={ROTULO_ESTADO_ARVORE}
          />
        </Campo>

        {viva && (
          <>
            <Campo rotulo={tr({ pt: 'Vigor', en: 'Vigour', zh: '长势' })}>
              <Pastilhas opcoes={VIGORES} valor={vigor} aoMudar={setVigor} rotulos={ROTULO_VIGOR} />
            </Campo>

            <Campo
              rotulo={tr({ pt: 'Altura', en: 'Height', zh: '树高' })}
              nota={tr({
                pt: 'Referência da farma: 1,9 m na plantação de 2018, 1,0 m na de 2020.',
                en: 'Farm reference: 1.9 m in the 2018 planting, 1.0 m in the 2020 one.',
                zh: '农场参考值：2018 年定植 1.9 米，2020 年定植 1.0 米。',
              })}
            >
              <Numero valor={altura} aoMudar={setAltura} sufixo="m" passo="0.1" />
            </Campo>

            <Campo
              rotulo={tr({ pt: 'Diâmetro do tronco', en: 'Trunk diameter', zh: '干径' })}
            >
              <Numero valor={diametro} aoMudar={setDiametro} sufixo="cm" passo="0.1" />
            </Campo>

            <Campo
              rotulo={tr({
                pt: 'Sintomas observados',
                en: 'Symptoms observed',
                zh: '观察到的症状',
              })}
              largo
            >
              <Texto
                valor={sintomas}
                aoMudar={setSintomas}
                linhas={2}
                sugestao={tr({
                  pt: 'Clorose internervural nas folhas novas; ponta dos ramos seca.',
                  en: 'Interveinal chlorosis on new leaves; branch tips dry.',
                  zh: '新叶脉间黄化；枝梢干枯。',
                })}
              />
            </Campo>
          </>
        )}

        {!viva && (
          <Campo
            rotulo={tr({
              pt: 'Causa provável',
              en: 'Probable cause',
              zh: '可能原因',
            })}
            largo
            nota={tr({
              pt: 'Obrigatória quando a árvore não está viva.',
              en: 'Required when the tree is not alive.',
              zh: '树木非存活时必填。',
            })}
          >
            <Texto
              valor={causa}
              aoMudar={setCausa}
              linhas={2}
              sugestao={tr({
                pt: 'Encharcamento prolongado na baixa do talhão após as chuvas de Janeiro.',
                en: 'Prolonged waterlogging in the low part of the plot after the January rains.',
                zh: '一月降雨后，地块低洼处长期积水。',
              })}
            />
          </Campo>
        )}

        <Campo
          rotulo={tr({
            pt: 'Amostra permanente',
            en: 'Permanent sample',
            zh: '固定样本',
          })}
          largo
          nota={tr({
            pt: `As 30 árvores marcadas por talhão são pesadas a cada ronda (F-15) e extrapoladas para o talhão inteiro. Este tem ${naAmostra} marcadas.`,
            en: `The 30 trees tagged per plot are weighed at every round (F-15) and extrapolated to the whole plot. This one has ${naAmostra} tagged.`,
            zh: `每地块挂牌的 30 棵树每轮均称重（F-15），并外推至整个地块。本地块已挂牌 ${naAmostra} 棵。`,
          })}
        >
          <Pastilhas
            opcoes={['nao', 'sim'] as const}
            valor={amostra ? 'sim' : 'nao'}
            aoMudar={(v) => setAmostra(v === 'sim')}
            rotulos={{
              nao: UI.nao,
              sim: { pt: 'Sim, marcar', en: 'Yes, tag it', zh: '是，挂牌' },
            }}
          />
        </Campo>
      </Grelha>

      <p className="text-[12px] leading-relaxed text-texto-3">
        {tr({
          pt: `Registadas ${fmt.inteiro(arvores.length)} árvores de ${fmt.inteiro(talhoes.reduce((s, t) => s + (t.total_plantas_estabelecidas ?? 0), 0))} plantadas. Enquanto o inventário anual não estiver completo, o K-PRD-05 fica sem valor e o K-PRD-01 é calculado sobre o total plantado — com o facto declarado.`,
          en: `${fmt.inteiro(arvores.length)} trees on record out of ${fmt.inteiro(talhoes.reduce((s, t) => s + (t.total_plantas_estabelecidas ?? 0), 0))} planted. Until the annual inventory is complete, K-PRD-05 has no value and K-PRD-01 is computed over the planted total — with that fact declared.`,
          zh: `已登记 ${fmt.inteiro(arvores.length)} 棵，种植总数 ${fmt.inteiro(talhoes.reduce((s, t) => s + (t.total_plantas_estabelecidas ?? 0), 0))} 棵。在年度盘点完成之前，K-PRD-05 无取值，K-PRD-01 按种植总数计算——并将这一事实声明。`,
        })}
      </p>
    </Formulario>
  );
}
