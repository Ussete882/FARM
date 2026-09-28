/**
 * F-01 — Ficha de talhão. Criar e alterar.
 *
 * O talhão é a unidade mínima de gestão agronómica. Sem a plantação
 * decomposta em talhões, a pergunta «onde é que se perde» não tem sujeito —
 * e foi por isso que o §7.1 pôs a decomposição como primeiro acto do sistema.
 *
 * Na alteração, o código nunca muda: é imutável (R4). Cada campo alterado
 * entra no histórico com o valor anterior e o novo (§2.3), e a designação
 * pode mudar à vontade sem quebrar coisa nenhuma.
 */

import React from 'react';

import { useBlocos, useTalhoes, useVariedades } from '../../dados/consultas';
import { alterarTalhao, gravarTalhao } from '../../dados/escrever';
import { HOJE } from '../../dados/semente';
import { q } from '../../dominio/canonico';
import { codigo } from '../../dominio/codigos';
import { useFmt, useT } from '../../i18n/contexto';
import { COL } from '../../i18n/comuns';
import type { T } from '../../i18n/nucleo';
import {
  ROTULO_SISTEMA_REGA,
  SISTEMAS_REGA,
  TIPOS_SOLO,
  type SistemaRega,
  type Talhao,
  type TipoSolo,
} from '../../dominio/territorio';
import { validarTalhao } from '../../regras/validacao';
import {
  Campo,
  Derivado,
  Formulario,
  Grelha,
  Numero,
  Pastilhas,
  Seleccao,
} from '../../design/Formulario';
import { Rotulo } from '../../design/primitivas';

const ROTULO_SOLO: Record<TipoSolo, T> = {
  ferralsolo: { pt: 'Ferralsolo', en: 'Ferralsol', zh: '铁铝土' },
  luvissolo: { pt: 'Luvissolo', en: 'Luvisol', zh: '淨土' },
  fluvissolo: { pt: 'Fluvissolo', en: 'Fluvisol', zh: '冲积土' },
  arenossolo: { pt: 'Arenossolo', en: 'Arenosol', zh: '砂土' },
  vertissolo: { pt: 'Vertissolo', en: 'Vertisol', zh: '变性土' },
  outro: { pt: 'Outro', en: 'Other', zh: '其他' },
};

export function FormularioF01({
  aoFechar,
  talhao: existente,
}: {
  aoFechar: () => void;
  /** Quando presente, o formulário altera em vez de criar. */
  talhao?: Talhao;
}) {
  const tr = useT();
  const fmt = useFmt();
  const blocos = useBlocos();
  const talhoes = useTalhoes();
  const variedades = useVariedades();

  const aAlterar = !!existente;

  const [bloco, setBloco] = React.useState(existente?.bloco ?? 'FA-B01');
  const [designacao, setDesignacao] = React.useState(existente?.designacao ?? '');
  const [areaBruta, setAreaBruta] = React.useState<number | ''>(
    existente?.area_bruta_ha.valor ?? '',
  );
  const [areaPlantada, setAreaPlantada] = React.useState<number | ''>(
    existente?.area_plantada_ha.valor ?? '',
  );
  const [areaUtil, setAreaUtil] = React.useState<number | ''>(existente?.area_util_ha.valor ?? '');
  const [entreLinhas, setEntreLinhas] = React.useState<number | ''>(
    existente?.compasso_m?.entre_linhas ?? 10,
  );
  const [naLinha, setNaLinha] = React.useState<number | ''>(existente?.compasso_m?.na_linha ?? 10);
  const [numeroLinhas, setNumeroLinhas] = React.useState<number | ''>(
    existente?.numero_linhas ?? '',
  );
  const [anoPlantio, setAnoPlantio] = React.useState<number | ''>(existente?.ano_plantio ?? 2026);
  const [variedade, setVariedade] = React.useState(existente?.variedade ?? 'VAR-MAC-A4');
  const [tipoSolo, setTipoSolo] = React.useState<TipoSolo>(existente?.tipo_solo ?? 'ferralsolo');
  const [declive, setDeclive] = React.useState<number | ''>(existente?.declive_percent?.valor ?? '');
  const [ph, setPh] = React.useState<number | ''>(existente?.ph_agua ?? '');
  const [carbono, setCarbono] = React.useState<number | ''>(
    existente?.carbono_organico_percent ?? '',
  );
  const [dataAnalise, setDataAnalise] = React.useState(existente?.data_analise_solo ?? '');
  const [rega, setRega] = React.useState<SistemaRega>(existente?.sistema_rega ?? 'tanque_rebocado');
  const [distancia, setDistancia] = React.useState<number | ''>(
    existente?.distancia_sede_km?.valor ?? '',
  );
  const [motivo, setMotivo] = React.useState('');
  const [gravado, setGravado] = React.useState<string | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);

  // --- Código: o próximo Tnn livre do bloco escolhido -------------------
  const cod = React.useMemo(() => {
    if (existente) return existente.codigo;
    const usados = talhoes
      .filter((t) => t.bloco === bloco)
      .map((t) => Number(t.codigo.split('-T')[1]))
      .filter(Number.isFinite);
    return codigo.talhao(bloco, (usados.length ? Math.max(...usados) : 0) + 1);
  }, [existente, talhoes, bloco]);

  // --- Derivados: densidade e total de plantas saem do compasso ---------
  const el = entreLinhas === '' ? 0 : Number(entreLinhas);
  const nl = naLinha === '' ? 0 : Number(naLinha);
  const densidade = el > 0 && nl > 0 ? Math.round(10_000 / (el * nl)) : 0;
  const plantadaN = areaPlantada === '' ? 0 : Number(areaPlantada);
  const totalPlantas = Math.round(plantadaN * densidade);

  // A área útil abre a 97% da plantada — é uma sugestão, não um facto.
  const utilSugerida = plantadaN > 0 ? Number((plantadaN * 0.97).toFixed(1)) : undefined;
  const utilN = areaUtil === '' ? (utilSugerida ?? 0) : Number(areaUtil);

  const rascunho = React.useMemo(
    () =>
      ({
        ...(existente ?? {}),
        id: cod,
        codigo: cod,
        designacao: designacao || (existente?.designacao ?? 'Talhão sem designação'),
        tipo: 'talhao',
        estado: existente?.estado ?? 'activo',
        dono: existente?.dono ?? (bloco === 'FA-B01' ? 'TR-00003' : 'TR-00004'),
        criado_em: existente?.criado_em ?? HOJE,
        criado_por: existente?.criado_por ?? 'TR-00001',
        alterado_em: HOJE,
        alterado_por: 'TR-00001',
        versao: existente?.versao ?? 1,
        relacoes: existente?.relacoes ?? [],
        historico: existente?.historico ?? [],
        anexos: existente?.anexos ?? [],
        bloco,
        area_bruta_ha: q(areaBruta === '' ? 0 : Number(areaBruta), 'ha'),
        area_plantada_ha: q(plantadaN, 'ha', 'plantada'),
        area_util_ha: q(utilN, 'ha', 'util'),
        poligono: existente?.poligono ?? [],
        tipo_solo: tipoSolo,
        declive_percent: declive === '' ? undefined : q(Number(declive), 'percent'),
        data_analise_solo: dataAnalise || undefined,
        ph_agua: ph === '' ? undefined : Number(ph),
        carbono_organico_percent: carbono === '' ? undefined : Number(carbono),
        fonte_agua: rega === 'sequeiro' ? undefined : 'FA-FA-01',
        sistema_rega: rega,
        distancia_sede_km: distancia === '' ? undefined : q(Number(distancia), 'km'),
        cultura: existente?.cultura ?? 'MAC',
        variedade,
        ano_plantio: anoPlantio === '' ? undefined : Number(anoPlantio),
        compasso_m: { entre_linhas: el, na_linha: nl },
        densidade_plantas_ha: q(densidade, 'planta'),
        numero_linhas: numeroLinhas === '' ? undefined : Number(numeroLinhas),
        total_plantas_estabelecidas: totalPlantas,
      }) as Talhao,
    [
      existente,
      cod,
      designacao,
      bloco,
      areaBruta,
      plantadaN,
      utilN,
      tipoSolo,
      declive,
      dataAnalise,
      ph,
      carbono,
      rega,
      distancia,
      variedade,
      anoPlantio,
      el,
      nl,
      densidade,
      numeroLinhas,
      totalPlantas,
    ],
  );

  const validacao = React.useMemo(() => {
    const r = validarTalhao(rascunho, HOJE);
    if (!designacao.trim() && !existente) {
      return {
        ...r,
        gravavel: false,
        constatacoes: [
          {
            regra: 'E-01',
            severidade: 'bloqueante' as const,
            campo: 'designacao',
            mensagem: {
              pt: 'O talhão precisa de designação — o nome corrente por que a equipa lhe chama. O código serve o sistema; a designação serve as pessoas.',
              en: 'The plot needs a name — what the team actually calls it. The code serves the system; the name serves the people.',
              zh: '地块需要一个名称——班组平时怎么叫它。编码服务于系统，名称服务于人。',
            },
            fundamento: {
              pt: '§2.3 — objectos canónicos',
              en: '§2.3 — canonical objects',
              zh: '§2.3 — 标准对象',
            },
          },
          ...r.constatacoes,
        ],
      };
    }
    return r;
  }, [rascunho, designacao, existente]);

  const gravar = async () => {
    try {
      setErro(null);
      if (existente) {
        const { id: _i, codigo: _c, historico: _h, versao: _v, ...alteracoes } = rascunho;
        const seguinte = await alterarTalhao(existente, alteracoes, motivo || undefined);
        setGravado(
          `${seguinte.codigo} · ${tr({
            pt: `versão ${seguinte.versao}`,
            en: `version ${seguinte.versao}`,
            zh: `版本 ${seguinte.versao}`,
          })}`,
        );
      } else {
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
        const guardado = await gravarTalhao(resto);
        setGravado(guardado.codigo);
      }
    } catch (e) {
      setErro(
        e instanceof Error
          ? `${tr({ pt: 'O talhão não foi gravado', en: 'The plot was not saved', zh: '地块未保存' })}: ${e.message}`
          : tr({
              pt: 'O talhão não foi gravado por um erro inesperado.',
              en: 'The plot was not saved due to an unexpected error.',
              zh: '因意外错误，地块未保存。',
            }),
      );
    }
  };

  return (
    <Formulario
      titulo={
        aAlterar
          ? tr({
              pt: 'Alterar ficha de talhão',
              en: 'Edit plot sheet',
              zh: '修改地块表单',
            })
          : tr({ pt: 'Novo talhão', en: 'New plot', zh: '新建地块' })
      }
      formulario="F-01"
      codigo={cod}
      validacao={validacao}
      aoGravar={gravar}
      aoFechar={aoFechar}
      gravado={gravado}
      erro={erro}
      // O cadastro faz-se à secretária, com o agrónomo. Sem cronómetro.
      limiteSegundos={0}
    >
      <Grelha>
        <Campo
          rotulo={tr(COL.bloco)}
          nota={
            aAlterar
              ? tr({
                  pt: 'O bloco faz parte do código, e o código é imutável (R4).',
                  en: 'The block is part of the code, and the code is immutable (R4).',
                  zh: '区是编码的一部分，而编码不可变更（R4）。',
                })
              : undefined
          }
        >
          {aAlterar ? (
            <Derivado>{bloco}</Derivado>
          ) : (
            <Seleccao value={bloco} onChange={setBloco}>
              {blocos.map((b) => (
                <option key={b.codigo} value={b.codigo}>
                  {b.codigo} · {b.designacao}
                </option>
              ))}
            </Seleccao>
          )}
        </Campo>

        <Campo
          rotulo={tr(COL.designacao)}
          nota={tr({
            pt: 'O nome corrente. Pode mudar sem quebrar o histórico.',
            en: 'The everyday name. It can change without breaking the history.',
            zh: '日常称呼。可以更改而不会中断历史。',
          })}
        >
          <input
            value={designacao}
            onChange={(e) => setDesignacao(e.target.value)}
            placeholder={tr({ pt: 'Norte 7', en: 'North 7', zh: '北区 7' })}
            className="h-10 w-full rounded-xl bg-bloco px-3.5 text-[13px] text-texto outline-none focus:bg-bloco-2"
          />
        </Campo>

        <Campo
          rotulo={tr(COL.codigo)}
          nota={tr({
            pt: 'Gerado pelo sistema, nunca escrito à mão (§6.1).',
            en: 'Generated by the system, never typed by hand (§6.1).',
            zh: '由系统生成，不得手写（§6.1）。',
          })}
        >
          <Derivado>{cod}</Derivado>
        </Campo>
      </Grelha>

      <div>
        <Rotulo className="mb-3">{tr({ pt: 'Áreas', en: 'Areas', zh: '面积' })}</Rotulo>
        <Grelha>
          <Campo rotulo={tr({ pt: 'Área bruta', en: 'Gross area', zh: '毛面积' })}>
            <Numero valor={areaBruta} aoMudar={setAreaBruta} sufixo="ha" passo="0.1" />
          </Campo>

          <Campo
            rotulo={tr({ pt: 'Área plantada', en: 'Planted area', zh: '种植面积' })}
            nota={tr({
              pt: 'Menor ou igual à bruta — validação bloqueante.',
              en: 'At most the gross area — a blocking validation.',
              zh: '不得大于毛面积——阻断性校验。',
            })}
          >
            <Numero valor={areaPlantada} aoMudar={setAreaPlantada} sufixo="ha" passo="0.1" />
          </Campo>

          <Campo
            rotulo={tr({ pt: 'Área útil', en: 'Usable area', zh: '有效面积' })}
            nota={tr({
              pt: 'Menor ou igual à plantada. Sugestão: 97% da plantada.',
              en: 'At most the planted area. Suggested: 97% of planted.',
              zh: '不得大于种植面积。建议取种植面积的 97%。',
            })}
          >
            <Numero
              valor={areaUtil}
              aoMudar={setAreaUtil}
              sufixo="ha"
              passo="0.1"
              sugestao={utilSugerida}
            />
          </Campo>
        </Grelha>
      </div>

      <div>
        <Rotulo className="mb-3">
          {tr({ pt: 'Cultura instalada', en: 'Crop in place', zh: '已种作物' })}
        </Rotulo>
        <Grelha>
          <Campo rotulo={tr({ pt: 'Variedade', en: 'Variety', zh: '品种' })}>
            <Seleccao value={variedade} onChange={setVariedade}>
              {variedades
                .filter((v) => v.cultura === 'CUL-MAC')
                .map((v) => (
                  <option key={v.codigo} value={v.codigo}>
                    {v.designacao}
                  </option>
                ))}
            </Seleccao>
          </Campo>

          <Campo rotulo={tr({ pt: 'Ano de plantio', en: 'Year planted', zh: '定植年份' })}>
            <Numero valor={anoPlantio} aoMudar={setAnoPlantio} passo="1" />
          </Campo>

          <Campo
            rotulo={tr({ pt: 'Número de linhas', en: 'Number of rows', zh: '行数' })}
            nota={tr({
              pt: 'Do levantamento de campo.',
              en: 'From the field survey.',
              zh: '来自实地测绘。',
            })}
          >
            <Numero valor={numeroLinhas} aoMudar={setNumeroLinhas} passo="1" />
          </Campo>

          <Campo rotulo={tr({ pt: 'Compasso entre linhas', en: 'Row spacing', zh: '行距' })}>
            <Numero valor={entreLinhas} aoMudar={setEntreLinhas} sufixo="m" passo="0.5" />
          </Campo>

          <Campo rotulo={tr({ pt: 'Compasso na linha', en: 'Plant spacing', zh: '株距' })}>
            <Numero valor={naLinha} aoMudar={setNaLinha} sufixo="m" passo="0.5" />
          </Campo>

          <Campo
            rotulo={tr({
              pt: 'Densidade e plantas',
              en: 'Density and plants',
              zh: '密度与株数',
            })}
            nota={
              densidade > 0
                ? tr({
                    pt: 'Densidade derivada do compasso. Referência mundial para macadâmia: 312 árvores/ha.',
                    en: 'Density derived from spacing. World reference for macadamia: 312 trees/ha.',
                    zh: '密度由株行距推算。澳洲坚果国际基准：每公顷 312 株。',
                  })
                : tr({
                    pt: 'Preencha o compasso para derivar a densidade.',
                    en: 'Fill in the spacing to derive density.',
                    zh: '填写株行距以推算密度。',
                  })
            }
          >
            <Derivado>
              {fmt.inteiro(densidade)} /{fmt.unidade('ha')} · {fmt.inteiro(totalPlantas)}{' '}
              {fmt.unidade('planta')}
            </Derivado>
          </Campo>
        </Grelha>
      </div>

      <div>
        <Rotulo className="mb-3">
          {tr({ pt: 'Solo e água', en: 'Soil and water', zh: '土壤与水' })}
        </Rotulo>
        <Grelha>
          <Campo rotulo={tr({ pt: 'Tipo de solo', en: 'Soil type', zh: '土壤类型' })}>
            <Pastilhas
              opcoes={TIPOS_SOLO}
              valor={tipoSolo}
              aoMudar={setTipoSolo}
              rotulos={ROTULO_SOLO}
            />
          </Campo>

          <Campo
            rotulo={tr({ pt: 'Declive', en: 'Slope', zh: '坡度' })}
            nota={tr({
              pt: 'Acima de ~13% dificulta a colheita mecanizada.',
              en: 'Above ~13% mechanised harvesting becomes difficult.',
              zh: '超过约 13% 后，机械化采收困难。',
            })}
          >
            <Numero valor={declive} aoMudar={setDeclive} sufixo="%" passo="0.1" />
          </Campo>

          <Campo
            rotulo={tr({
              pt: 'Distância à sede',
              en: 'Distance to base',
              zh: '距场部距离',
            })}
          >
            <Numero valor={distancia} aoMudar={setDistancia} sufixo="km" passo="0.1" />
          </Campo>

          <Campo
            rotulo={tr({
              pt: 'Data da análise de solo',
              en: 'Soil analysis date',
              zh: '土壤检测日期',
            })}
            nota={tr({
              pt: 'Validade de 24 meses (W08).',
              en: 'Valid for 24 months (W08).',
              zh: '有效期 24 个月（W08）。',
            })}
          >
            <input
              type="date"
              value={dataAnalise}
              max={HOJE}
              onChange={(e) => setDataAnalise(e.target.value)}
              className="num h-10 w-full rounded-xl bg-bloco px-3.5 text-[13px] text-texto outline-none focus:bg-bloco-2"
            />
          </Campo>

          <Campo
            rotulo={tr({ pt: 'pH em água', en: 'pH in water', zh: '水浸 pH' })}
            nota={tr({
              pt: 'Alvo para macadâmia: 5,5 a 6,5.',
              en: 'Target for macadamia: 5.5 to 6.5.',
              zh: '澳洲坚果目标值：5.5 至 6.5。',
            })}
          >
            <Numero valor={ph} aoMudar={setPh} passo="0.1" />
          </Campo>

          <Campo
            rotulo={tr({ pt: 'Carbono orgânico', en: 'Organic carbon', zh: '有机碳' })}
            nota={tr({ pt: 'Alvo: 4%.', en: 'Target: 4%.', zh: '目标：4%。' })}
          >
            <Numero valor={carbono} aoMudar={setCarbono} sufixo="%" passo="0.1" />
          </Campo>

          <Campo
            rotulo={tr({
              pt: 'Sistema de rega',
              en: 'Irrigation system',
              zh: '灌溉方式',
            })}
            largo
            nota={tr({
              pt: 'Um talhão regado exige fonte de água associada — validação bloqueante.',
              en: 'An irrigated plot requires an attached water source — a blocking validation.',
              zh: '灌溉地块必须关联水源——阻断性校验。',
            })}
          >
            <Pastilhas
              opcoes={SISTEMAS_REGA}
              valor={rega}
              aoMudar={setRega}
              rotulos={ROTULO_SISTEMA_REGA}
            />
          </Campo>
        </Grelha>
      </div>

      {aAlterar && (
        <Campo
          rotulo={tr({
            pt: 'Motivo da alteração',
            en: 'Reason for the change',
            zh: '变更原因',
          })}
          nota={tr({
            pt: 'Fica no histórico, ao lado do valor anterior e do novo. Opcional, mas é o que torna a alteração compreensível daqui a um ano.',
            en: 'Kept in the history, beside the old and the new value. Optional, but it is what makes the change intelligible a year from now.',
            zh: '保存在历史中，与新旧值并列。非必填，但它决定了一年后还能不能看懂这次变更。',
          })}
        >
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder={tr({
              pt: 'Nova análise de solo recebida do laboratório.',
              en: 'New soil analysis received from the laboratory.',
              zh: '收到实验室新的土壤检测报告。',
            })}
            className="h-10 w-full rounded-xl bg-bloco px-3.5 text-[13px] text-texto outline-none focus:bg-bloco-2"
          />
        </Campo>
      )}
    </Formulario>
  );
}
