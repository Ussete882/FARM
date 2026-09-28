/**
 * F-07 — Ficha de pesagem de colheita.
 *
 * É o registo primário do K-PRD-01, do K-PRD-02 e de toda a família COL. Toda
 * a colheita entra por aqui, ligada a talhão, data, equipa e lote: é este
 * registo, e não o relato do gestor, que constitui a produção da campanha.
 *
 * O peso líquido e a taxa de rejeição não têm campo: são derivados. Um número
 * que se possa escrever à mão é um número que se pode escrever mal.
 */

import React from 'react';

import { useCiclos, useEquipas, usePesagens, useTalhoes, useTrabalhadores } from '../../dados/consultas';
import { gravarPesagem, proximoSequencial } from '../../dados/escrever';
import { HOJE } from '../../dados/semente';
import { q } from '@bastet/nucleo/canonico';
import { codigo } from '@bastet/nucleo/codigos';
import { useFmt, useT } from '../../i18n/contexto';
import { COL } from '../../i18n/comuns';
import { MOTIVOS_REJEICAO, ROTULO_REJEICAO, type MotivoRejeicao } from '@bastet/nucleo/operacoes';
import { taxaRejeicao, validarPesagem } from '@bastet/nucleo/validacao';
import { Campo, Derivado, Formulario, Grelha, Numero, Pastilhas, Seleccao } from '../../design/Formulario';
import { Semaforo } from '../../design/primitivas';

export function FormularioF07({ aoFechar }: { aoFechar: () => void }) {
  const tr = useT();
  const fmt = useFmt();
  const talhoes = useTalhoes();
  const ciclos = useCiclos();
  const equipas = useEquipas();
  const trabalhadores = useTrabalhadores();
  const pesagens = usePesagens();

  const [talhao, setTalhao] = React.useState('');
  const [hora, setHora] = React.useState('08:00');
  const [nPessoas, setNPessoas] = React.useState<number | ''>('');
  const [bruto, setBruto] = React.useState<number | ''>('');
  const [tara, setTara] = React.useState<number | ''>('');
  const [rejeitado, setRejeitado] = React.useState<number | ''>('');
  const [motivo, setMotivo] = React.useState<MotivoRejeicao | undefined>();
  const [humidade, setHumidade] = React.useState<number | ''>('');
  const [pesador, setPesador] = React.useState('');
  const [gravado, setGravado] = React.useState<string | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);

  // --- Valores por omissão inteligentes (§25) ----------------------------
  const talhaoActivo = talhao || talhoes[0]?.codigo || '';
  const ciclo = ciclos.find((c) => c.talhao === talhaoActivo);
  const equipa = equipas.find((e) => talhaoActivo.startsWith(e.bloco_habitual ?? '§'));
  const conferente = equipa?.chefe_turma ?? 'TR-00007';

  const doTalhao = pesagens
    .filter((p) => p.talhao === talhaoActivo)
    .sort((a, b) => (a.data_colheita < b.data_colheita ? 1 : -1));
  const rondaAnterior = doTalhao[0];
  const proximaRonda = (rondaAnterior?.ronda_numero ?? 0) + 1;

  const apanhadores = React.useMemo(
    () => trabalhadores.filter((t) => t.categoria_profissional === 'Trabalhador de campo'),
    [trabalhadores],
  );
  const pesadorActivo = pesador || apanhadores[0]?.codigo || '';

  // --- Derivados ---------------------------------------------------------
  const brutoN = bruto === '' ? 0 : Number(bruto);
  const taraN = tara === '' ? 0 : Number(tara);
  const liquido = Math.max(0, brutoN - taraN);
  const rejeitadoN = rejeitado === '' ? 0 : Number(rejeitado);

  const sequencia = proximoSequencial(
    pesagens.map((p) => p.codigo),
    `PS-${codigo.pesagem(HOJE, 1).slice(3, 11)}`,
  );

  const rascunho = React.useMemo(() => {
    const cod = codigo.pesagem(HOJE, sequencia);
    return {
      id: cod,
      codigo: cod,
      designacao: `${tr({ pt: 'Pesagem ronda', en: 'Weighing, round', zh: '称重·第' })} ${proximaRonda} — ${talhaoActivo}`,
      tipo: 'pesagem_colheita' as const,
      estado: 'concluido' as const,
      dono: conferente,
      criado_em: HOJE,
      criado_por: conferente,
      alterado_em: HOJE,
      alterado_por: conferente,
      versao: 1,
      relacoes: [],
      historico: [],
      anexos: [],
      ciclo_cultura: ciclo?.codigo ?? '',
      talhao: talhaoActivo,
      data_colheita: HOJE,
      hora,
      ronda_numero: proximaRonda,
      dias_desde_ronda_anterior: rondaAnterior
        ? Math.round(
            (new Date(HOJE).getTime() - new Date(rondaAnterior.data_colheita).getTime()) / 86_400_000,
          )
        : undefined,
      equipa: equipa?.codigo ?? '',
      n_pessoas: nPessoas === '' ? 0 : Number(nPessoas),
      quantidade_bruta: q(brutoN, 'kg', 'NIH' as const),
      tara: q(taraN, 'kg', 'tara' as const),
      quantidade_liquida: q(liquido, 'kg', 'NIH' as const),
      quantidade_rejeitada: q(rejeitadoN, 'kg', 'NIH' as const),
      motivo_rejeicao: rejeitadoN > 0 ? motivo : undefined,
      humidade_percent: humidade === '' ? undefined : Number(humidade),
      pesador: pesadorActivo,
      conferente,
      fonte_dados: 'registo_duas_assinaturas' as const,
    };
  }, [
    sequencia,
    proximaRonda,
    talhaoActivo,
    ciclo,
    hora,
    rondaAnterior,
    equipa,
    nPessoas,
    brutoN,
    taraN,
    liquido,
    rejeitadoN,
    motivo,
    humidade,
    pesadorActivo,
    conferente,
  ]);

  const validacao = validarPesagem(rascunho, {
    hoje: HOJE,
    dataRondaAnterior: rondaAnterior?.data_colheita,
  });

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
      const guardado = await gravarPesagem(resto);
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

  const taxa = taxaRejeicao(rascunho);

  return (
    <Formulario
      titulo={tr({ pt: 'Pesagem de colheita', en: 'Harvest weighing', zh: '采收称重' })}
      formulario="F-07"
      codigo={rascunho.codigo}
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
          rotulo={tr({ pt: 'Ronda', en: 'Round', zh: '轮次' })}
          nota={`${tr({ pt: 'Ciclo', en: 'Cycle', zh: '生长周期' })} ${ciclo?.codigo ?? '—'}`}
        >
          <Derivado
            nota={
              rondaAnterior
                ? tr({
                    pt: `Anterior a ${fmt.data(rondaAnterior.data_colheita)} · alvo 7 a 14 dias (K-COL-01)`,
                    en: `Previous on ${fmt.data(rondaAnterior.data_colheita)} · target 7 to 14 days (K-COL-01)`,
                    zh: `上一轮：${fmt.data(rondaAnterior.data_colheita)} · 目标间隔 7 至 14 天（K-COL-01）`,
                  })
                : tr({
                    pt: 'Primeira ronda do talhão',
                    en: 'First round for this plot',
                    zh: '本地块首轮',
                  })
            }
          >
            {tr({
              pt: `${proximaRonda}.ª`,
              en: `#${proximaRonda}`,
              zh: `第 ${proximaRonda} 轮`,
            })}
          </Derivado>
        </Campo>

        <Campo
          rotulo={tr({ pt: 'Hora da pesagem', en: 'Weighing time', zh: '称重时间' })}
        >
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="num h-10 w-full rounded-xl bg-bloco px-3.5 text-[13px] text-texto outline-none focus:bg-bloco-2"
          />
        </Campo>

        <Campo
          rotulo={tr({ pt: 'Peso bruto', en: 'Gross weight', zh: '毛重' })}
          nota={tr({
            pt: 'Balança calibrada, com o recipiente.',
            en: 'Calibrated scale, container included.',
            zh: '经校准磅秤，含容器。',
          })}
        >
          <Numero valor={bruto} aoMudar={setBruto} sufixo="kg" passo="0.1" />
        </Campo>

        <Campo
          rotulo={tr({ pt: 'Tara', en: 'Tare', zh: '皮重' })}
          nota={tr({
            pt: 'Peso do recipiente vazio.',
            en: 'Weight of the empty container.',
            zh: '空容器重量。',
          })}
        >
          <Numero valor={tara} aoMudar={setTara} sufixo="kg" passo="0.1" sugestao={12} />
        </Campo>

        <Campo rotulo={tr({ pt: 'Peso líquido', en: 'Net weight', zh: '净重' })}>
          <Derivado
            nota={tr({
              pt: 'Calculado: bruto menos tara. Não se escreve.',
              en: 'Derived: gross minus tare. It is not typed in.',
              zh: '推算值：毛重减皮重。不可手填。',
            })}
          >
            {fmt.numero(liquido, 1)} kg NIH
          </Derivado>
        </Campo>

        <Campo
          rotulo={tr({
            pt: 'Rejeitado em triagem',
            en: 'Rejected at sorting',
            zh: '分选剔除',
          })}
          nota={tr({
            pt: 'Deixar vazio se não houve rejeição.',
            en: 'Leave empty if there was no rejection.',
            zh: '若无剔除，留空即可。',
          })}
        >
          <Numero valor={rejeitado} aoMudar={setRejeitado} sufixo="kg" passo="0.1" />
        </Campo>

        <Campo
          rotulo={tr({
            pt: 'Taxa de rejeição',
            en: 'Rejection rate',
            zh: '剔除率',
          })}
        >
          <div className="flex h-10 items-center">
            {liquido > 0 ? (
              <Semaforo
                cor={taxa <= 6 ? 'verde' : taxa <= 8 ? 'ambar' : 'vermelho'}
                rotulo={`${fmt.percentagem(taxa)} · ${tr({ pt: 'meta', en: 'target', zh: '目标' })} ≤ 6%`}
              />
            ) : (
              <span className="text-[12.5px] text-texto-3">—</span>
            )}
          </div>
        </Campo>

        <Campo
          rotulo={tr({ pt: 'Humidade', en: 'Moisture', zh: '含水率' })}
          nota={tr({
            pt: 'Obrigatória em macadâmia e moringa.',
            en: 'Mandatory for macadamia and moringa.',
            zh: '澳洲坚果与辣木必填。',
          })}
        >
          <Numero valor={humidade} aoMudar={setHumidade} sufixo="%" passo="0.1" />
        </Campo>

        {rejeitadoN > 0 && (
          <Campo
            rotulo={tr({
              pt: 'Motivo da rejeição',
              en: 'Reason for rejection',
              zh: '剔除原因',
            })}
            largo
            nota={tr({
              pt: 'Toda a perda é explicada — regra R6.',
              en: 'Every loss is explained — rule R6.',
              zh: '每一项损耗都要说明——规则 R6。',
            })}
          >
            <Pastilhas
              opcoes={MOTIVOS_REJEICAO}
              valor={motivo}
              aoMudar={setMotivo}
              rotulos={ROTULO_REJEICAO}
            />
          </Campo>
        )}

        <Campo
          rotulo={tr({
            pt: 'Pessoas na apanha',
            en: 'People picking',
            zh: '采摘人数',
          })}
        >
          <Numero valor={nPessoas} aoMudar={setNPessoas} sugestao={8} passo="1" />
        </Campo>

        <Campo rotulo={tr({ pt: 'Pesador', en: 'Weigher', zh: '称重人' })}>
          <Seleccao value={pesadorActivo} onChange={setPesador}>
            {apanhadores.map((t) => (
              <option key={t.codigo} value={t.codigo}>
                {t.nome_completo}
              </option>
            ))}
          </Seleccao>
        </Campo>

        <Campo
          rotulo={tr({ pt: 'Conferente', en: 'Checker', zh: '复核人' })}
          nota={tr({
            pt: 'Pessoa distinta do pesador — validação V27.',
            en: 'A different person from the weigher — validation V27.',
            zh: '必须与称重人为不同的人——校验 V27。',
          })}
        >
          <Derivado>
            {trabalhadores.find((t) => t.codigo === conferente)?.nome_completo ?? conferente}
          </Derivado>
        </Campo>
      </Grelha>
    </Formulario>
  );
}
