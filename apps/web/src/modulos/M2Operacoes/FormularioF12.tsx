/**
 * F-12 — Ficha de monitorização fitossanitária.
 *
 * O índice não tem campo: é a contagem dividida pelas plantas amostradas. E a
 * decisão fica registada com a contagem — uma monitorização sem decisão não
 * serviu para nada.
 *
 * §24.4: acima do limiar, o sistema propõe tratamento. Decidir não agir
 * continua a ser possível, mas passa a exigir aprovação do agrónomo (A07).
 */

import React from 'react';

import {
  chefeDeCampo,
  useEquipas,
 useMonitorizacoes, useTalhoes, useTrabalhadores } from '../../dados/consultas';
import { gravarMonitorizacao } from '../../dados/escrever';
import { HOJE } from '../../dados/semente';
import { q } from '@bastet/nucleo/canonico';
import { codigo } from '@bastet/nucleo/codigos';
import { useFmt, useT } from '../../i18n/contexto';
import { COL } from '../../i18n/comuns';
import type { T } from '@bastet/nucleo/i18n';
import {
  DECISOES_MONITORIZACAO,
  ROTULO_DECISAO_MF,
  type DecisaoMonitorizacao,
} from '@bastet/nucleo/operacoes';
import { parametroEm } from '@bastet/nucleo/parametros';
import { validarMonitorizacao } from '@bastet/nucleo/validacao';
import {
  Campo,
  Derivado,
  Formulario,
  Grelha,
  Numero,
  Pastilhas,
  Seleccao,
} from '../../design/Formulario';
import { Semaforo } from '../../design/primitivas';

/**
 * O nome científico é o mesmo em qualquer língua; o nome comum não.
 * Fica gravada a forma portuguesa, que é a do receituário.
 */
const ORGANISMOS: T[] = [
  {
    pt: 'Percevejo (Bathycoelia spp.)',
    en: 'Stink bug (Bathycoelia spp.)',
    zh: '蝙蠣（Bathycoelia spp.）',
  },
  {
    pt: 'Traça-da-macadâmia',
    en: 'Macadamia nut borer',
    zh: '澳洲坚果蛀蚺',
  },
  { pt: 'Formiga cortadeira', en: 'Leafcutter ant', zh: '切叶蚁' },
  { pt: 'Ácaro', en: 'Mite', zh: '螨虫' },
  { pt: 'Antracnose', en: 'Anthracnose', zh: '炭疽病' },
];

export function FormularioF12({ aoFechar }: { aoFechar: () => void }) {
  const tr = useT();
  const fmt = useFmt();
  const talhoes = useTalhoes();
  const equipas = useEquipas();
  const trabalhadores = useTrabalhadores();
  const monitorizacoes = useMonitorizacoes();

  const [talhao, setTalhao] = React.useState('');
  const [organismo, setOrganismo] = React.useState(ORGANISMOS[0].pt);
  const [pontos, setPontos] = React.useState<number | ''>(5);
  const [plantasPorPonto, setPlantasPorPonto] = React.useState<number | ''>(4);
  const [pragas, setPragas] = React.useState<number | ''>('');
  const [inimigos, setInimigos] = React.useState<number | ''>('');
  const [decisao, setDecisao] = React.useState<DecisaoMonitorizacao | undefined>();
  const [gravado, setGravado] = React.useState<string | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);

  const talhaoActivo = talhao || talhoes[0]?.codigo || '';
  // Quem faz a contagem é quem chefia a frente. Procurar por categoria
  // profissional não serve: «Técnico encarregado de campo» é um cargo do plano
  // que não existe no quadro real, e procurar por ele devolve ninguém.
  const observador = chefeDeCampo(equipas, talhaoActivo) ?? trabalhadores[0]?.codigo ?? '';

  const limiarParam = parametroEm('MAC-LIMIAR-PERCEVEJO', HOJE);
  const limiar = limiarParam?.valor ?? 0.4;

  // --- Derivado: o índice é a contagem sobre as plantas amostradas -------
  const plantas = (pontos === '' ? 0 : Number(pontos)) * (plantasPorPonto === '' ? 0 : Number(plantasPorPonto));
  const indice = plantas > 0 ? Number(((pragas === '' ? 0 : Number(pragas)) / plantas).toFixed(2)) : 0;

  // Acima do limiar, a decisão sugerida é tratar (§24.4).
  const sugestao: DecisaoMonitorizacao =
    indice > limiar ? 'tratar' : indice > limiar * 0.75 ? 'repetir' : 'nenhuma_accao';
  const decisaoActiva = decisao ?? sugestao;

  const cod = codigo.monitorizacao(HOJE, talhaoActivo);
  const duplicados = monitorizacoes.filter(
    (m) => m.talhao === talhaoActivo && m.data === HOJE,
  ).length;

  const rascunho = React.useMemo(
    () => ({
      id: cod,
      codigo: cod,
      designacao: `Monitorização — ${talhaoActivo}`,
      tipo: 'monitorizacao' as const,
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
      metodo: tr({
        pt: 'Batimento de ramos',
        en: 'Branch beating',
        zh: '払枝法',
      }),
      n_pontos_amostrados: pontos === '' ? 0 : Number(pontos),
      n_plantas_por_ponto: plantasPorPonto === '' ? 0 : Number(plantasPorPonto),
      organismo,
      contagem_pragas: pragas === '' ? 0 : Number(pragas),
      contagem_inimigos_naturais: inimigos === '' ? 0 : Number(inimigos),
      indice_calculado: q(indice, 'un'),
      limiar_aplicavel: q(limiar, 'un'),
      decisao: decisaoActiva,
      observador,
      fonte_dados: 'registo_uma_assinatura' as const,
    }),
    [
      cod,
      talhaoActivo,
      observador,
      pontos,
      plantasPorPonto,
      organismo,
      pragas,
      inimigos,
      indice,
      limiar,
      decisaoActiva,
    ],
  );

  const validacao = validarMonitorizacao(rascunho, { hoje: HOJE, duplicados });

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
      const guardado = await gravarMonitorizacao(resto);
      setGravado(guardado.codigo);
    } catch (e) {
      setErro(
        e instanceof Error
          ? `${tr({ pt: 'O registo não foi gravado', en: 'The record was not saved', zh: '记录未保存' })}: ${e.message}`
          : tr({
              pt: 'O registo não foi gravado por um erro inesperado.',
              en: 'The record was not saved due to an unexpected error.',
              zh: '因意外错误，记录未保存。',
            }),
      );
    }
  };

  return (
    <Formulario
      titulo={tr({
        pt: 'Monitorização fitossanitária',
        en: 'Plant-health monitoring',
        zh: '植保监测',
      })}
      formulario="F-12"
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
            pt: 'Organismo observado',
            en: 'Organism observed',
            zh: '观察到的生物',
          })}
        >
          <Seleccao value={organismo} onChange={setOrganismo}>
            {ORGANISMOS.map((o) => (
              <option key={o.pt} value={o.pt}>
                {tr(o)}
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
          rotulo={tr({
            pt: 'Pontos amostrados',
            en: 'Sampling points',
            zh: '取样点数',
          })}
        >
          <Numero valor={pontos} aoMudar={setPontos} passo="1" sugestao={5} />
        </Campo>

        <Campo
          rotulo={tr({
            pt: 'Plantas por ponto',
            en: 'Plants per point',
            zh: '每点株数',
          })}
        >
          <Numero valor={plantasPorPonto} aoMudar={setPlantasPorPonto} passo="1" sugestao={4} />
        </Campo>

        <Campo
          rotulo={tr({ pt: 'Amostra total', en: 'Total sample', zh: '样本总数' })}
        >
          <Derivado
            nota={tr({
              pt: 'Pontos × plantas por ponto. É o denominador do índice.',
              en: 'Points × plants per point. It is the denominator of the index.',
              zh: '样点数 × 每点株数。即指数的分母。',
            })}
          >
            {fmt.inteiro(plantas)} {fmt.unidade('planta')}
          </Derivado>
        </Campo>

        <Campo
          rotulo={tr({ pt: 'Pragas contadas', en: 'Pests counted', zh: '计数虫口' })}
        >
          <Numero valor={pragas} aoMudar={setPragas} passo="1" />
        </Campo>

        <Campo
          rotulo={tr({ pt: 'Inimigos naturais', en: 'Natural enemies', zh: '天敌' })}
          nota={tr({
            pt: 'Contam para a decisão, não para o índice.',
            en: 'They count towards the decision, not the index.',
            zh: '影响决定，但不计入指数。',
          })}
        >
          <Numero valor={inimigos} aoMudar={setInimigos} passo="1" sugestao={0} />
        </Campo>

        <Campo
          rotulo={tr({ pt: 'Índice', en: 'Index', zh: '指数' })}
          nota={tr({
            pt: `Limiar de acção: ${fmt.numero(limiar, 1)} por planta${limiarParam?.estado === 'a_confirmar' ? ' — ainda por ratificar pelo agrónomo' : ''}.`,
            en: `Action threshold: ${fmt.numero(limiar, 1)} per plant${limiarParam?.estado === 'a_confirmar' ? ' — still to be ratified by the agronomist' : ''}.`,
            zh: `防治阈值：每株 ${fmt.numero(limiar, 1)}${limiarParam?.estado === 'a_confirmar' ? '——尚待农艺师批准' : ''}。`,
          })}
        >
          <div className="flex h-10 items-center">
            {plantas > 0 ? (
              <Semaforo
                cor={indice > limiar ? 'vermelho' : indice > limiar * 0.75 ? 'ambar' : 'verde'}
                rotulo={tr({
                  pt: `${fmt.numero(indice, 2)} por planta`,
                  en: `${fmt.numero(indice, 2)} per plant`,
                  zh: `每株 ${fmt.numero(indice, 2)}`,
                })}
              />
            ) : (
              <span className="text-[12.5px] text-texto-3">—</span>
            )}
          </div>
        </Campo>

        <Campo
          rotulo={tr(COL.decisao)}
          largo
          nota={
            indice > limiar
              ? tr({
                  pt: 'Acima do limiar, o sistema propõe tratar. Decidir não agir passa a exigir aprovação do agrónomo (A07).',
                  en: 'Above the threshold the system proposes treatment. Deciding not to act then requires the agronomist’s approval (A07).',
                  zh: '超过阈值时系统建议施药。若决定不采取措施，需经农艺师批准（A07）。',
                })
              : tr({
                  pt: 'A decisão fica registada com a contagem — uma monitorização sem decisão não serviu para nada.',
                  en: 'The decision is recorded with the count — a monitoring round with no decision served no purpose.',
                  zh: '决定与计数一同登记——没有决定的监测毫无意义。',
                })
          }
        >
          <Pastilhas
            opcoes={DECISOES_MONITORIZACAO}
            valor={decisaoActiva}
            aoMudar={setDecisao}
            rotulos={ROTULO_DECISAO_MF}
          />
        </Campo>
      </Grelha>
    </Formulario>
  );
}
