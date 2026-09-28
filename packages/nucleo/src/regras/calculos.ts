/**
 * BASTET — cálculo de indicadores a partir de registos primários (§5.4, §10)
 *
 * §5.4: «Todo o valor calculado no sistema tem de poder ser aberto até ao
 * registo primário que o originou. Esta propriedade, e só ela, é o que separa
 * um painel de gestão de uma folha de cálculo bonita.»
 *
 * Por isso toda a função devolve, além do valor, a lista dos registos que o
 * originaram — a proveniência viaja com o número.
 */

import { q, type Quantidade } from '../dominio/canonico';
import { esperadoPorIdade } from '../dominio/indicadores';
import type { Jorna } from '../dominio/pessoas';
import type { PesagemColheita, RelatorioDiario } from '../dominio/operacoes';
import type { T } from '../i18n/nucleo';

export interface ValorCalculado {
  valor: number | undefined;
  quantidade?: Quantidade;
  /** Códigos dos registos primários que originaram o valor. */
  proveniencia: string[];
  /**
   * Nota que acompanha o número quando a base de cálculo é imperfeita.
   * Trilingue: viaja com o valor e é o ecrã que a resolve.
   */
  ressalva?: T;
}

const semDados = (ressalva?: T): ValorCalculado => ({
  valor: undefined,
  proveniencia: [],
  ressalva,
});

// ============================================================================
// K-PRD-01 — Rendimento por árvore
// ============================================================================

export interface BaseProducao {
  pesagens: PesagemColheita[];
  /**
   * Árvores produtivas, apuradas no inventário anual. Se o inventário ainda
   * não existir, passa-se `arvoresPlantadas` e o facto é declarado (§10.1).
   */
  arvoresProdutivas?: number;
  arvoresPlantadas: number;
}

export function kPrd01(base: BaseProducao): ValorCalculado {
  const liquido = base.pesagens.reduce((s, p) => s + p.quantidade_liquida.valor, 0);
  const util = liquido - base.pesagens.reduce((s, p) => s + p.quantidade_rejeitada.valor, 0);

  const denominador = base.arvoresProdutivas ?? base.arvoresPlantadas;
  if (!denominador) return semDados({ pt: 'Sem contagem de árvores.', en: 'No tree count.', zh: '无树木计数。' });
  if (base.pesagens.length === 0) return semDados({ pt: 'Sem fichas de pesagem no período.', en: 'No weighing sheets in the period.', zh: '本期无称重单据。' });

  return {
    valor: util / denominador,
    quantidade: q(util / denominador, 'kg_arvore', 'NIS'),
    proveniencia: base.pesagens.map((p) => p.codigo),
    ressalva: base.arvoresProdutivas
      ? undefined
      : { pt: 'Calculado sobre o total de árvores plantadas: o inventário anual de árvores produtivas ainda não existe (§10.1 K-PRD-01).', en: 'Computed over the total of planted trees: the annual inventory of bearing trees does not yet exist (§10.1 K-PRD-01).', zh: '按种植总株数计算：结果树年度盘点尚未开展（§10.1 K-PRD-01）。' },
  };
}

// ============================================================================
// K-PRD-02 — Rendimento por hectare
// ============================================================================

export function kPrd02(pesagens: PesagemColheita[], hectaresPlantados: number): ValorCalculado {
  if (!hectaresPlantados) return semDados({ pt: 'Sem área plantada registada.', en: 'No planted area on record.', zh: '未登记种植面积。' });
  if (pesagens.length === 0) return semDados({ pt: 'Sem fichas de pesagem no período.', en: 'No weighing sheets in the period.', zh: '本期无称重单据。' });
  const util =
    pesagens.reduce((s, p) => s + p.quantidade_liquida.valor - p.quantidade_rejeitada.valor, 0) /
    1000;
  return {
    valor: util / hectaresPlantados,
    quantidade: q(util / hectaresPlantados, 't_ha', 'NIS'),
    proveniencia: pesagens.map((p) => p.codigo),
  };
}

// ============================================================================
// K-PRD-03 / K-PRD-04 — Realização do potencial e défice de rendimento
// ============================================================================

export function kPrd03(rendimentoPorArvore: number | undefined, idadeAnos: number): ValorCalculado {
  const esperado = esperadoPorIdade(idadeAnos);
  if (rendimentoPorArvore === undefined) return semDados({ pt: 'Sem K-PRD-01 no período.', en: 'No K-PRD-01 in the period.', zh: '本期无 K-PRD-01。' });
  if (esperado === 0) {
    return semDados(
      {
        pt: `Aos ${idadeAnos} anos a curva de referência ainda não prevê produção. A realização não é calculável.`,
        en: `At ${idadeAnos} years the reference curve does not yet expect any production. Realisation is not computable.`,
        zh: `树龄 ${idadeAnos} 年时，基准曲线尚未预期产量，无法计算实现率。`,
      },
    );
  }
  return {
    valor: (rendimentoPorArvore / esperado) * 100,
    quantidade: q((rendimentoPorArvore / esperado) * 100, 'percent'),
    proveniencia: ['K-PRD-01', `curva ${idadeAnos}a = ${esperado} kg/árv.`],
  };
}

export function kPrd04(realizacao: number | undefined): ValorCalculado {
  if (realizacao === undefined) return semDados({ pt: 'Sem K-PRD-03 no período.', en: 'No K-PRD-03 in the period.', zh: '本期无 K-PRD-03。' });
  return {
    valor: 100 - realizacao,
    quantidade: q(100 - realizacao, 'percent'),
    proveniencia: ['K-PRD-03'],
  };
}

// ============================================================================
// K-COL-04 — Taxa de rejeição em triagem de campo
// ============================================================================

export function kCol04(pesagens: PesagemColheita[]): ValorCalculado {
  if (pesagens.length === 0) return semDados({ pt: 'Sem fichas de pesagem no período.', en: 'No weighing sheets in the period.', zh: '本期无称重单据。' });
  const liquido = pesagens.reduce((s, p) => s + p.quantidade_liquida.valor, 0);
  const rejeitado = pesagens.reduce((s, p) => s + p.quantidade_rejeitada.valor, 0);
  if (liquido <= 0) return semDados({ pt: 'Peso líquido nulo no período.', en: 'Net weight is zero in the period.', zh: '本期净重为零。' });
  return {
    valor: (rejeitado / liquido) * 100,
    quantidade: q((rejeitado / liquido) * 100, 'percent'),
    proveniencia: pesagens.map((p) => p.codigo),
  };
}

// ============================================================================
// K-COL-02 — Prazo entre apanha e descasque
// ============================================================================

export function kCol02(pesagens: PesagemColheita[]): ValorCalculado {
  const comSaida = pesagens.filter((p) => p.hora_entrada_processamento);
  if (comSaida.length === 0)
    return semDados({ pt: 'Nenhuma pesagem regista a hora de entrada em processamento.', en: 'No weighing records the time of entry into processing.', zh: '没有任何称重记录填写进厂时间。' });
  const horas = comSaida.map(
    (p) =>
      (new Date(p.hora_entrada_processamento!).getTime() -
        new Date(`${p.data_colheita}T${p.hora}:00`).getTime()) /
      3_600_000,
  );
  const media = horas.reduce((s, v) => s + v, 0) / horas.length;
  return {
    valor: media,
    quantidade: q(media, 'h'),
    proveniencia: comSaida.map((p) => p.codigo),
    ressalva:
      comSaida.length < pesagens.length
        ? {
            pt: `${pesagens.length - comSaida.length} de ${pesagens.length} fichas sem hora de entrada em processamento: essas não entram na média.`,
            en: `${pesagens.length - comSaida.length} of ${pesagens.length} sheets have no processing entry time: those are left out of the average.`,
            zh: `${pesagens.length} 张单据中有 ${pesagens.length - comSaida.length} 张未填进厂时间，不计入平均值。`,
          }
        : undefined,
  };
}

// ============================================================================
// K-COL-05 — Produtividade da apanha (kg por pessoa-dia)
// ============================================================================

export function kCol05(pesagens: PesagemColheita[], pessoasDia: number): ValorCalculado {
  if (pesagens.length === 0) return semDados({ pt: 'Sem fichas de pesagem no período.', en: 'No weighing sheets in the period.', zh: '本期无称重单据。' });
  if (pessoasDia <= 0) return semDados({ pt: 'Sem jornas registadas no período.', en: 'No worker-days recorded in the period.', zh: '本期未登记工日。' });
  const liquido = pesagens.reduce((s, p) => s + p.quantidade_liquida.valor, 0);
  return {
    valor: liquido / pessoasDia,
    quantidade: q(liquido / pessoasDia, 'kg', 'NIH'),
    proveniencia: pesagens.map((p) => p.codigo),
  };
}

// ============================================================================
// K-COL-01 — Intervalo entre rondas
// ============================================================================

export function kCol01(datasRonda: string[]): ValorCalculado {
  if (datasRonda.length < 2) return semDados({
      pt: 'É preciso pelo menos duas rondas para haver intervalo.',
      en: 'At least two rounds are needed for there to be an interval.',
      zh: '至少需要两轮采收，才谈得上间隔。',
    });
  const ordenadas = [...datasRonda].sort();
  const intervalos: number[] = [];
  for (let i = 1; i < ordenadas.length; i++) {
    intervalos.push(
      Math.round(
        (new Date(ordenadas[i]).getTime() - new Date(ordenadas[i - 1]).getTime()) / 86_400_000,
      ),
    );
  }
  const media = intervalos.reduce((s, v) => s + v, 0) / intervalos.length;
  return { valor: media, quantidade: q(media, 'dia'), proveniencia: ordenadas };
}

// ============================================================================
// K-PES-03 — Assiduidade
// ============================================================================

export function kPes03(jornas: Jorna[]): ValorCalculado {
  if (jornas.length === 0) return semDados({ pt: 'Sem jornas no período.', en: 'No worker-days in the period.', zh: '本期无工日记录。' });
  const presentes = jornas.filter((j) => j.presenca === 'presente').length;
  return {
    valor: (presentes / jornas.length) * 100,
    quantidade: q((presentes / jornas.length) * 100, 'percent'),
    proveniencia: jornas.map((j) => j.codigo),
  };
}

// ============================================================================
// W03 — Produtividade individual abaixo de 60% da mediana da equipa
// ============================================================================

export function mediana(valores: number[]): number | undefined {
  if (valores.length === 0) return undefined;
  const o = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(o.length / 2);
  return o.length % 2 ? o[meio] : (o[meio - 1] + o[meio]) / 2;
}

export interface DesempenhoIndividual {
  trabalhador: string;
  producao: Quantidade;
  /** Mediana do grupo comparável a que este trabalhador pertence. */
  mediana: number;
  /** Produção individual como fracção dessa mediana. */
  faceMediana: number;
  abaixoLimiar: boolean;
  /** Equipa e tarefa que definem o grupo de comparação. */
  grupo: string;
}

/**
 * §8.4 W03 — excepção quando a produção individual fica abaixo de 60% da
 * mediana **da equipa, no mesmo dia e tarefa**.
 *
 * A qualificação não é acessória: numa mesma data, a equipa Norte pode estar a
 * regar (m³) e a equipa Sul a adubar (ha). Uma mediana calculada sobre as duas
 * compara metros cúbicos com hectares e produz percentagens absurdas — é
 * exactamente o erro que a regra R3 existe para impedir. Por isso o grupo de
 * comparação é (equipa, tarefa, unidade), e não «toda a gente nesse dia».
 */
export function desempenhoDaEquipa(jornas: Jorna[]): DesempenhoIndividual[] {
  const comProducao = jornas.filter(
    (j) => j.presenca === 'presente' && j.producao_individual !== undefined,
  );

  const grupos = new Map<string, Jorna[]>();
  for (const j of comProducao) {
    const chave = `${j.data}|${j.equipa}|${j.tarefa}|${j.producao_individual!.unidade}`;
    grupos.set(chave, [...(grupos.get(chave) ?? []), j]);
  }

  const resultado: DesempenhoIndividual[] = [];
  for (const [grupo, doGrupo] of grupos) {
    const med = mediana(doGrupo.map((j) => j.producao_individual!.valor));
    // Uma pessoa sozinha é a sua própria mediana: não há comparação a fazer.
    if (med === undefined || med === 0 || doGrupo.length < 3) continue;
    for (const j of doGrupo) {
      const producao = j.producao_individual!;
      const faceMediana = producao.valor / med;
      resultado.push({
        trabalhador: j.trabalhador,
        producao,
        mediana: med,
        faceMediana,
        abaixoLimiar: faceMediana < 0.6,
        grupo,
      });
    }
  }
  return resultado;
}

// ============================================================================
// K-GOV-01 — Taxa de cumprimento de registo
// Critério de saída da Fase 1 (§26.1): ≥ 90% durante 4 semanas consecutivas.
// ============================================================================

export function kGov01(devidos: number, entreguesNoPrazo: number): ValorCalculado {
  if (devidos <= 0) return semDados({ pt: 'Nenhum registo devido no período.', en: 'No records due in the period.', zh: '本期无应报记录。' });
  return {
    valor: (entreguesNoPrazo / devidos) * 100,
    quantidade: q((entreguesNoPrazo / devidos) * 100, 'percent'),
    proveniencia: [`${entreguesNoPrazo}/${devidos} F-05+F-06+F-07`],
  };
}

// ============================================================================
// K-GOV-02 — Completude de registo
// Registos sem campo obrigatório em falta, sobre o total. Mede a regra dos
// cinco campos (R2) já em vigor: um registo bloqueado nunca chega a gravar,
// logo o que se mede aqui é o que passou e ainda assim não fechou.
// ============================================================================

export function kGov02(
  registos: { gravavel: boolean; temBloqueante: boolean }[],
): ValorCalculado {
  if (registos.length === 0) return semDados({ pt: 'Sem registos no período.', en: 'No records in the period.', zh: '本期无记录。' });
  const completos = registos.filter((r) => !r.temBloqueante).length;
  return {
    valor: (completos / registos.length) * 100,
    quantidade: q((completos / registos.length) * 100, 'percent'),
    proveniencia: [`${completos}/${registos.length} R2`],
  };
}

// ============================================================================
// K-PES-01 e K-PES-02 — Custo de mão-de-obra por hectare e por quilograma
// ============================================================================

export function kPes01(jornas: Jorna[], hectares: number): ValorCalculado {
  if (hectares <= 0) return semDados({ pt: 'Sem área plantada registada.', en: 'No planted area on record.', zh: '未登记种植面积。' });
  if (jornas.length === 0) return semDados({ pt: 'Sem jornas no período.', en: 'No worker-days in the period.', zh: '本期无工日记录。' });
  const custo = jornas.reduce((s, j) => s + (j.custo_calculado?.valor ?? 0), 0);
  return {
    valor: custo / hectares,
    quantidade: q(custo / hectares, 'MT'),
    proveniencia: [`${jornas.length}× F-06`],
  };
}

export function kPes02(jornas: Jorna[], kgProduzidos: number): ValorCalculado {
  if (kgProduzidos <= 0) return semDados({ pt: 'Sem produção registada no período.', en: 'No output recorded in the period.', zh: '本期未登记产量。' });
  if (jornas.length === 0) return semDados({ pt: 'Sem jornas no período.', en: 'No worker-days in the period.', zh: '本期无工日记录。' });
  const custo = jornas.reduce((s, j) => s + (j.custo_calculado?.valor ?? 0), 0);
  return {
    valor: custo / kgProduzidos,
    quantidade: q(custo / kgProduzidos, 'MT'),
    proveniencia: [`${jornas.length}× F-06`],
    ressalva:
      { pt: 'As jornas registadas são das duas últimas semanas; a produção é da campanha 2025/26. Enquanto as jornas da campanha não estiverem digitalizadas, este rácio é indicativo e não comparável entre períodos.', en: 'The worker-days on record cover the last two weeks; output covers the 2025/26 season. Until the season’s worker-days are digitised, this ratio is indicative and not comparable across periods.', zh: '已登记的工日仅覆盖最近两周，而产量为 2025/26 整个生产季。在本季工日完成录入之前，此比率仅供参考，不可跨期比较。' },
  };
}

// ============================================================================
// Produção acumulada do dia, por talhão — painel diário (§11.1)
// ============================================================================

export interface ProducaoPorTalhao {
  talhao: string;
  liquido: number;
  rejeitado: number;
  taxaRejeicao: number;
  pesagens: string[];
}

export function producaoPorTalhao(pesagens: PesagemColheita[]): ProducaoPorTalhao[] {
  const mapa = new Map<string, ProducaoPorTalhao>();
  for (const p of pesagens) {
    const linha = mapa.get(p.talhao) ?? {
      talhao: p.talhao,
      liquido: 0,
      rejeitado: 0,
      taxaRejeicao: 0,
      pesagens: [],
    };
    linha.liquido += p.quantidade_liquida.valor;
    linha.rejeitado += p.quantidade_rejeitada.valor;
    linha.pesagens.push(p.codigo);
    mapa.set(p.talhao, linha);
  }
  for (const linha of mapa.values()) {
    linha.taxaRejeicao = linha.liquido > 0 ? (linha.rejeitado / linha.liquido) * 100 : 0;
  }
  return [...mapa.values()].sort((a, b) => b.liquido - a.liquido);
}

// ============================================================================
// Cumprimento da meta do dia — F-05
// ============================================================================

export function cumprimentoDoDia(r: RelatorioDiario): number | undefined {
  if (r.meta_dia.valor <= 0) return undefined;
  return (r.quantidade_realizada.valor / r.meta_dia.valor) * 100;
}
