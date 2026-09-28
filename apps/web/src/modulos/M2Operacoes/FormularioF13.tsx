/**
 * F-13 — Ficha de observação de campo.
 *
 * Preenchida por qualquer técnico, sempre que observar algo relevante. É o
 * canal por onde entra no sistema aquilo que nenhum formulário periódico
 * previu — e por isso é o único formulário do grupo com texto livre.
 *
 * Toda a observação termina numa acção proposta. Sem isso é uma queixa.
 */

import React from 'react';

import { useObservacoes, useTalhoes, useTrabalhadores } from '../../dados/consultas';
import { gravarObservacao, proximoSequencial } from '../../dados/escrever';
import { HOJE } from '../../dados/semente';
import { codigo } from '@bastet/nucleo/codigos';
import { GRAVIDADES, ROTULO_GRAVIDADE, type Gravidade } from '@bastet/nucleo/operacoes';
import { useT } from '../../i18n/contexto';
import { COL } from '../../i18n/comuns';
import type { T } from '@bastet/nucleo/i18n';
import { validarObservacao } from '@bastet/nucleo/validacao';
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

const TIPOS: T[] = [
  { pt: 'Stress hídrico', en: 'Water stress', zh: '水分胁迫' },
  { pt: 'Sintoma foliar', en: 'Leaf symptom', zh: '叶部症状' },
  { pt: 'Dano de praga', en: 'Pest damage', zh: '虫害损伤' },
  {
    pt: 'Erosão ou encharcamento',
    en: 'Erosion or waterlogging',
    zh: '水土流失或积水',
  },
  {
    pt: 'Árvore caída ou partida',
    en: 'Fallen or broken tree',
    zh: '倒伏或断裂的树',
  },
  {
    pt: 'Infra-estrutura danificada',
    en: 'Damaged infrastructure',
    zh: '基础设施损坏',
  },
  { pt: 'Outro', en: 'Other', zh: '其他' },
];

export function FormularioF13({ aoFechar }: { aoFechar: () => void }) {
  const tr = useT();
  const talhoes = useTalhoes();
  const trabalhadores = useTrabalhadores();
  const observacoes = useObservacoes();

  const [talhao, setTalhao] = React.useState('');
  const [tipo, setTipo] = React.useState(TIPOS[0].pt);
  const [descricao, setDescricao] = React.useState('');
  const [extensao, setExtensao] = React.useState<number | ''>('');
  const [gravidade, setGravidade] = React.useState<Gravidade>('media');
  const [accao, setAccao] = React.useState('');
  const [gravado, setGravado] = React.useState<string | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);

  const talhaoActivo = talhao || talhoes[0]?.codigo || '';
  const tecnicos = React.useMemo(
    () => trabalhadores.filter((t) => t.categoria_profissional === 'Técnico encarregado de campo'),
    [trabalhadores],
  );
  const observador = tecnicos[0]?.codigo ?? 'TR-00003';

  const sequencia = proximoSequencial(
    observacoes.map((o) => o.codigo),
    'OB-2026-',
  );
  const cod = codigo.observacao(2026, sequencia);

  const rascunho = React.useMemo(
    () => ({
      id: cod,
      codigo: cod,
      designacao: tipo,
      tipo: 'observacao' as const,
      estado: 'concluido' as const,
      dono: observador,
      criado_em: HOJE,
      criado_por: observador,
      alterado_em: HOJE,
      alterado_por: observador,
      versao: 1,
      relacoes: [],
      historico: [],
      anexos: [],
      data: HOJE,
      talhao: talhaoActivo,
      tipo_observacao: tipo,
      descricao,
      extensao_percent: extensao === '' ? 0 : Number(extensao),
      gravidade,
      accao_proposta: accao,
      observador,
      fonte_dados: 'registo_uma_assinatura' as const,
    }),
    [cod, tipo, observador, talhaoActivo, descricao, extensao, gravidade, accao],
  );

  const validacao = validarObservacao(rascunho, HOJE);

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
      const guardado = await gravarObservacao(resto);
      setGravado(guardado.codigo);
    } catch (e) {
      setErro(
        e instanceof Error
          ? `O registo não foi gravado: ${e.message}`
          : 'O registo não foi gravado por um erro inesperado.',
      );
    }
  };

  return (
    <Formulario
      titulo={tr({
        pt: 'Observação de campo',
        en: 'Field observation',
        zh: '田间观察',
      })}
      formulario="F-13"
      codigo={cod}
      validacao={validacao}
      aoGravar={gravar}
      aoFechar={aoFechar}
      gravado={gravado}
      erro={erro}
    >
      <Grelha>
        <Campo rotulo={tr(COL.talhao)}>
          <Seleccao value={talhaoActivo} onChange={setTalhao}>
            {talhoes.map((t) => (
              <option key={t.codigo} value={t.codigo}>
                {t.codigo} · {t.designacao}
              </option>
            ))}
          </Seleccao>
        </Campo>

        <Campo
          rotulo={tr({
            pt: 'Tipo de observação',
            en: 'Type of observation',
            zh: '观察类型',
          })}
        >
          <Seleccao value={tipo} onChange={setTipo}>
            {TIPOS.map((x) => (
              <option key={x.pt} value={x.pt}>
                {tr(x)}
              </option>
            ))}
          </Seleccao>
        </Campo>

        <Campo rotulo={tr({ pt: 'Observador', en: 'Observer', zh: '观察人' })}>
          <Derivado>
            {trabalhadores.find((t) => t.codigo === observador)?.nome_completo ?? observador}
          </Derivado>
        </Campo>

        <Campo
          rotulo={tr({ pt: 'Descrição', en: 'Description', zh: '描述' })}
          largo
          nota={tr({
            pt: 'O que se vê, onde, e em que estado. Quem lê isto daqui a um ano não estava lá.',
            en: 'What is seen, where, and in what state. Whoever reads this a year from now was not there.',
            zh: '看到什么、在哪里、处于何种状态。一年后读到这段话的人当时不在现场。',
          })}
        >
          <Texto
            valor={descricao}
            aoMudar={setDescricao}
            linhas={3}
            sugestao={tr({
              pt: 'Folhas com bordo necrosado nas três primeiras linhas junto ao carreiro; solo seco a 15 cm de profundidade.',
              en: 'Leaves with necrotic margins on the first three rows by the track; soil dry at 15 cm depth.',
              zh: '靠近机耗道的前三行叶缘坑死；15 厘米深处土壤干燥。',
            })}
          />
        </Campo>

        <Campo
          rotulo={tr({
            pt: 'Extensão afectada',
            en: 'Extent affected',
            zh: '受影响程度',
          })}
          nota={tr({
            pt: 'Percentagem do talhão.',
            en: 'Percentage of the plot.',
            zh: '占地块的百分比。',
          })}
        >
          <Numero valor={extensao} aoMudar={setExtensao} sufixo="%" passo="1" />
        </Campo>

        <Campo
          rotulo={tr(COL.gravidade)}
          nota={tr({
            pt: 'Crítica escala ao agrónomo e ao gestor (§4.3).',
            en: 'Critical escalates to the agronomist and the manager (§4.3).',
            zh: '危急级将上报农艺师与经理（§4.3）。',
          })}
        >
          <Pastilhas
            opcoes={GRAVIDADES}
            valor={gravidade}
            aoMudar={setGravidade}
            rotulos={ROTULO_GRAVIDADE}
          />
        </Campo>

        <Campo
          rotulo={tr({
            pt: 'Acção proposta',
            en: 'Proposed action',
            zh: '建议措施',
          })}
          largo
          nota={tr({
            pt: 'Ainda que seja «observar de novo daqui a sete dias».',
            en: 'Even if it is only «observe again in seven days».',
            zh: '哪怕只是「七天后再观察」。',
          })}
        >
          <Texto
            valor={accao}
            aoMudar={setAccao}
            linhas={2}
            sugestao={tr({
              pt: 'Antecipar a ronda de rega e rever a dotação por planta com o agrónomo.',
              en: 'Bring the irrigation round forward and review the per-plant allocation with the agronomist.',
              zh: '提前灌水轮次，并与农艺师重新核定单株用水量。',
            })}
          />
        </Campo>
      </Grelha>
    </Formulario>
  );
}
