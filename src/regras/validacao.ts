/**
 * BASTET — regras de validação e integridade (§8)
 *
 * §8.1 Tipologia:
 *   bloqueante  → impede a gravação do registo
 *   aprovacao   → grava mas fica pendente de autorização de nível superior
 *   aviso       → grava e assinala
 *   excepcao    → grava e alimenta o relatório de excepções
 *
 * R2: «Registo incompleto é rejeitado na entrada, não corrigido depois.»
 * Toda a mensagem diz *porquê*, e não apenas *inválido* — um chefe de turma no
 * fim de um dia de calor precisa de saber o que corrigir, não de um erro.
 *
 * As mensagens são trilingues (`T`) e são construídas aqui, não resolvidas: o
 * motor devolve as três línguas e é o ecrã que escolhe uma. É o que mantém este
 * módulo puro — sem React, sem estado global de idioma — e o que lhe permite
 * correr igual no servidor.
 */

import type { Quantidade } from '../dominio/canonico';
import { PERFIL_FONTE, type FonteDados } from '../dominio/canonico';
import { formatador, type Formatador } from '../dominio/formatar';
import { IDIOMAS, type Idioma, type T } from '../i18n/nucleo';
import { valorEm } from '../dominio/parametros';
import { idade, type Trabalhador } from '../dominio/pessoas';
import type { Jorna } from '../dominio/pessoas';
import type {
  Monitorizacao,
  Observacao,
  Operacao,
  OrdemTrabalho,
  PesagemColheita,
  RelatorioDiario,
} from '../dominio/operacoes';
import type { Talhao } from '../dominio/territorio';

/**
 * Constrói uma mensagem nas três línguas. Recebe uma função por idioma, cada
 * uma com o formatador correspondente — «186,5 kg» em português e «186.5 kg»
 * em inglês são o mesmo número escrito como cada leitor o lê.
 */
function msg(
  pt: (F: Formatador) => string,
  en: (F: Formatador) => string,
  zh: (F: Formatador) => string,
): T {
  return {
    pt: pt(formatador('pt')),
    en: en(formatador('en')),
    zh: zh(formatador('zh')),
  };
}

export type Severidade = 'bloqueante' | 'aprovacao' | 'aviso' | 'excepcao';

export interface Constatacao {
  /** Código da regra no documento: V01, A03, W08, R2… */
  regra: string;
  severidade: Severidade;
  campo?: string;
  mensagem: T;
  /** Secção do documento ou diploma que fundamenta a regra. */
  fundamento?: T;
  /** Quem aprova, nas validações de severidade `aprovacao`. */
  aprova?: string;
}

export interface Resultado {
  /** Falso se existir pelo menos uma constatação bloqueante. */
  gravavel: boolean;
  /** Verdadeiro se gravar, mas pendente de aprovação. */
  pendenteAprovacao: boolean;
  constatacoes: Constatacao[];
}

export function resultado(constatacoes: Constatacao[]): Resultado {
  return {
    gravavel: !constatacoes.some((c) => c.severidade === 'bloqueante'),
    pendenteAprovacao: constatacoes.some((c) => c.severidade === 'aprovacao'),
    constatacoes,
  };
}

export function juntar(...rs: Resultado[]): Resultado {
  return resultado(rs.flatMap((r) => r.constatacoes));
}

/**
 * Colapsa constatações repetidas da mesma regra.
 *
 * Num formulário em lote — a folha de presença tem uma linha por pessoa — a
 * mesma regra dispara dez vezes com dez mensagens quase iguais. Dez linhas de
 * texto não dizem mais do que uma linha com a contagem, e escondem as outras
 * regras que dispararam uma só vez.
 */
export function resumirRepetidas(r: Resultado, apartirDe = 3): Resultado {
  const porRegra = new Map<string, Constatacao[]>();
  for (const c of r.constatacoes) {
    porRegra.set(c.regra, [...(porRegra.get(c.regra) ?? []), c]);
  }

  const prefixo: Record<Idioma, (n: number) => string> = {
    pt: (n) => `${n} registos com a mesma constatação. `,
    en: (n) => `${n} records with the same finding. `,
    zh: (n) => `${n} 条记录存在相同问题。`,
  };

  const saida: Constatacao[] = [];
  for (const [regra, lista] of porRegra) {
    if (lista.length < apartirDe) {
      saida.push(...lista);
      continue;
    }
    const primeira = lista[0].mensagem;
    saida.push({
      ...lista[0],
      regra,
      mensagem: Object.fromEntries(
        IDIOMAS.map((i) => [i, prefixo[i](lista.length) + primeira[i]]),
      ) as unknown as T,
    });
  }
  return resultado(saida);
}

// ============================================================================
// R2 — a regra dos cinco campos (§5.1)
// ============================================================================

export interface CincoCampos {
  /** Quem: executante e responsável. */
  quem: { executante?: string | string[]; responsavel?: string };
  /** O quê: tipo de operação e objecto. */
  oQue: { tipo?: string; objecto?: string };
  /** Onde: local. */
  onde: { local?: string };
  /** Quando: data de início e de fim. */
  quando: { inicio?: string; fim?: string };
  /** Quanto: quantidade e unidade. */
  quanto: { quantidade?: Quantidade };
}

const vazio = (v: unknown) =>
  v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);

const FUND_CINCO_CAMPOS: T = {
  pt: '§5.1 — a regra dos cinco campos',
  en: '§5.1 — the five-field rule',
  zh: '§5.1 — 五要素规则',
};

const PERGUNTAS: Record<string, T> = {
  quem: { pt: 'Quem', en: 'Who', zh: '谁' },
  oQue: { pt: 'O quê', en: 'What', zh: '做什么' },
  onde: { pt: 'Onde', en: 'Where', zh: '在哪里' },
  quando: { pt: 'Quando', en: 'When', zh: '何时' },
  quanto: { pt: 'Quanto', en: 'How much', zh: '多少' },
};

/**
 * Um registo a que falte uma das cinco perguntas é rejeitado. Não é corrigido
 * depois: é rejeitado na entrada.
 */
export function validarCincoCampos(c: CincoCampos): Resultado {
  const f: Constatacao[] = [];
  const falta = (campo: string, chave: keyof typeof PERGUNTAS) => {
    const p = PERGUNTAS[chave];
    f.push({
      regra: 'R2',
      severidade: 'bloqueante',
      campo,
      mensagem: {
        pt: `Falta responder a «${p.pt}». Os cinco campos são obrigatórios; o registo é rejeitado na entrada, não corrigido depois.`,
        en: `«${p.en}» is unanswered. All five fields are required; the record is rejected on entry, not corrected later.`,
        zh: `「${p.zh}」尚未填写。五个要素均为必填；记录在录入时即被拒绝，而非事后更正。`,
      },
      fundamento: FUND_CINCO_CAMPOS,
    });
  };

  if (vazio(c.quem.executante) && vazio(c.quem.responsavel)) falta('executante', 'quem');
  if (vazio(c.oQue.tipo) && vazio(c.oQue.objecto)) falta('tipo_operacao', 'oQue');
  if (vazio(c.onde.local)) falta('local', 'onde');
  if (vazio(c.quando.inicio)) falta('data_inicio', 'quando');

  // R3 — «Nunca se regista um número solto.»
  if (!c.quanto.quantidade) {
    falta('quantidade', 'quanto');
  } else if (vazio(c.quanto.quantidade.unidade)) {
    f.push({
      regra: 'V24',
      severidade: 'bloqueante',
      campo: 'quantidade',
      mensagem: {
        pt: 'Quantidade sem unidade. Nunca se regista um número solto.',
        en: 'Quantity without a unit. A bare number is never recorded.',
        zh: '数量缺少单位。系统不接受没有单位的数字。',
      },
      fundamento: {
        pt: '§8.2 V24 e regra inviolável R3',
        en: '§8.2 V24 and inviolable rule R3',
        zh: '§8.2 V24 及不可违背规则 R3',
      },
    });
  }

  return resultado(f);
}

// ============================================================================
// V25 — data futura em registo de execução
// ============================================================================

export function validarDataExecucao(data: string, hoje: string, campo = 'data_real'): Resultado {
  if (data > hoje) {
    return resultado([
      {
        regra: 'V25',
        severidade: 'bloqueante',
        campo,
        mensagem: msg(
          (F) =>
            `Data futura (${F.data(data)}) num registo de execução. A execução regista o que aconteceu, não o que vai acontecer — para planear, use a ordem de trabalho.`,
          (F) =>
            `Future date (${F.data(data)}) on an execution record. Execution records what happened, not what is going to happen — to plan, use a work order.`,
          (F) =>
            `执行记录中出现未来日期（${F.data(data)}）。执行记录的是已发生的事，而非将要发生的事——如需计划，请使用工单。`,
        ),
        fundamento: { pt: '§8.2 V25', en: '§8.2 V25', zh: '§8.2 V25' },
      },
    ]);
  }
  return resultado([]);
}

// ============================================================================
// §5.5 — fonte de dados admissível
// ============================================================================

const FUND_FONTES: T = {
  pt: '§5.5 — fontes de dados admissíveis',
  en: '§5.5 — admissible data sources',
  zh: '§5.5 — 可采信的数据来源',
};

export function validarFonteDados(fonte: FonteDados, ehIndicadorResultado: boolean): Resultado {
  const perfil = PERFIL_FONTE[fonte];
  if (fonte === 'relato_verbal') {
    return resultado([
      {
        regra: '§5.5',
        severidade: 'bloqueante',
        campo: 'fonte_dados',
        mensagem: {
          pt: 'Relato verbal tem fiabilidade nula e não entra no sistema.',
          en: 'A verbal account has no reliability and does not enter the system.',
          zh: '口头陈述可靠性为零，不得录入系统。',
        },
        fundamento: FUND_FONTES,
      },
    ]);
  }
  if (ehIndicadorResultado && !perfil.admissivelEmResultado) {
    return resultado([
      {
        regra: '§5.5',
        severidade: 'aviso',
        campo: 'fonte_dados',
        mensagem: {
          pt: `${perfil.rotulo.pt}: ${perfil.usoPermitido.pt}. O valor é registado, mas fica assinalado como não admissível em indicador de resultado.`,
          en: `${perfil.rotulo.en}: ${perfil.usoPermitido.en}. The value is recorded, but flagged as inadmissible for a result indicator.`,
          zh: `${perfil.rotulo.zh}：${perfil.usoPermitido.zh}。数值予以记录，但标注为不可用于结果指标。`,
        },
        fundamento: { pt: '§5.5', en: '§5.5', zh: '§5.5' },
      },
    ]);
  }
  return resultado([]);
}

// ============================================================================
// Pessoas — V02 a V07, V13 a V17, V29
//
// A verificação do salário mínimo não vive no sistema: é matéria que a
// Direcção trata directamente com as pessoas, fora daqui.
// ============================================================================

const LEI_TRABALHO: T = {
  pt: 'Lei do Trabalho',
  en: 'Labour Law',
  zh: '《劳动法》',
};

export function validarTrabalhador(t: Trabalhador, hoje: string): Resultado {
  const f: Constatacao[] = [];
  const anos = idade(t, hoje);

  // --- V02. Idade por registar --------------------------------------------
  //
  // Sem data de nascimento não há como provar a idade legal, e a prova é a
  // razão de o campo existir. A ausência não é neutra: é a mesma falha que um
  // menor sem autorização, porque nos dois casos ninguém sabe responder.
  const idadeMin = valorEm('IDADE-MIN-AUTORIZADA', hoje);
  if (anos === undefined) {
    f.push({
      regra: 'V02',
      severidade: 'bloqueante',
      campo: 'data_nascimento',
      mensagem: {
        pt: 'Sem data de nascimento registada. A idade legal não é verificável, e a verificação é a razão de o campo existir.',
        en: 'No date of birth on record. Legal age cannot be verified, and verification is why the field exists.',
        zh: '未登记出生日期。无法核验法定年龄，而核验正是该字段存在的理由。',
      },
      fundamento: {
        pt: `§8.2 V02 · ${LEI_TRABALHO.pt}`,
        en: `§8.2 V02 · ${LEI_TRABALHO.en}`,
        zh: `§8.2 V02 · ${LEI_TRABALHO.zh}`,
      },
    });
  } else if (anos < idadeMin) {
    f.push({
      regra: 'V02',
      severidade: 'bloqueante',
      campo: 'data_nascimento',
      mensagem: {
        pt: `Trabalhador com ${anos} anos. A idade mínima de admissão é ${idadeMin} anos, mesmo com autorização.`,
        en: `Worker aged ${anos}. The minimum age for admission is ${idadeMin}, even with authorisation.`,
        zh: `工人年龄为 ${anos} 岁。最低录用年龄为 ${idadeMin} 岁，即使取得授权也不例外。`,
      },
      fundamento: {
        pt: `§8.2 V02 · ${LEI_TRABALHO.pt}`,
        en: `§8.2 V02 · ${LEI_TRABALHO.en}`,
        zh: `§8.2 V02 · ${LEI_TRABALHO.zh}`,
      },
    });
  }

  // --- V03. Entre 15 e 17 anos sem autorização ---------------------------
  const idadePlena = valorEm('IDADE-MIN', hoje);
  if (
    anos !== undefined &&
    anos >= idadeMin &&
    anos < idadePlena &&
    !t.autorizacao_representante_legal
  ) {
    f.push({
      regra: 'V03',
      severidade: 'bloqueante',
      campo: 'autorizacao_representante_legal',
      mensagem: {
        pt: `Trabalhador com ${anos} anos sem autorização digitalizada do representante legal.`,
        en: `Worker aged ${anos} without a scanned authorisation from the legal guardian.`,
        zh: `工人年龄为 ${anos} 岁，缺少法定代理人授权书扫描件。`,
      },
      fundamento: {
        pt: `§8.2 V03 · ${LEI_TRABALHO.pt}`,
        en: `§8.2 V03 · ${LEI_TRABALHO.en}`,
        zh: `§8.2 V03 · ${LEI_TRABALHO.zh}`,
      },
    });
  }

  // --- V05 / V07. Aptidão para fitofármacos ------------------------------
  if (t.apto_aplicar_pesticidas && anos !== undefined && anos < idadePlena) {
    f.push({
      regra: 'V05',
      severidade: 'bloqueante',
      campo: 'apto_aplicar_pesticidas',
      mensagem: {
        pt: `Menor de ${idadePlena} anos não pode ser afecto a operação com fitofármacos.`,
        en: `A person under ${idadePlena} cannot be assigned to pesticide operations.`,
        zh: `未满 ${idadePlena} 岁者不得从事农药作业。`,
      },
      fundamento: { pt: '§8.2 V05', en: '§8.2 V05', zh: '§8.2 V05' },
    });
  }
  if (t.apto_aplicar_pesticidas && anos !== undefined && anos > 60) {
    f.push({
      regra: 'V07',
      severidade: 'bloqueante',
      campo: 'apto_aplicar_pesticidas',
      mensagem: {
        pt: `Trabalhador com ${anos} anos não pode ser afecto a serviço de aplicação de pesticidas.`,
        en: `A worker aged ${anos} cannot be assigned to pesticide application duty.`,
        zh: `年龄为 ${anos} 岁的工人不得从事农药喷施作业。`,
      },
      fundamento: { pt: '§8.2 V07', en: '§8.2 V07', zh: '§8.2 V07' },
    });
  }

  // --- V06. Gravidez ou lactação -----------------------------------------
  if (t.apto_aplicar_pesticidas && t.gravidez_ou_lactacao) {
    f.push({
      regra: 'V06',
      severidade: 'bloqueante',
      campo: 'gravidez_ou_lactacao',
      mensagem: {
        pt: 'Trabalhadora em gravidez ou lactação não pode ser afecta a operação com fitofármacos.',
        en: 'A worker who is pregnant or breastfeeding cannot be assigned to pesticide operations.',
        zh: '孕期或哺乳期女工不得从事农药作业。',
      },
      fundamento: { pt: '§8.2 V06', en: '§8.2 V06', zh: '§8.2 V06' },
    });
  }

  // --- V08 / V09. Certificados de aplicador ------------------------------
  if (t.apto_aplicar_pesticidas) {
    for (const tipo of ['aplicador_pesticidas', 'saude'] as const) {
      const cert = t.certificados.find((c) => c.tipo === tipo);
      const nome: T =
        tipo === 'saude'
          ? { pt: 'de saúde', en: 'health', zh: '健康' }
          : { pt: 'de formação de aplicador', en: 'applicator training', zh: '施药员培训' };

      if (!cert || !cert.validade) {
        f.push({
          regra: tipo === 'saude' ? 'V09' : 'V08',
          severidade: 'bloqueante',
          campo: 'certificados',
          mensagem: {
            pt: `Sem certificado ${nome.pt} registado. Não pode aplicar fitofármacos.`,
            en: `No ${nome.en} certificate on record. Cannot apply pesticides.`,
            zh: `未登记${nome.zh}证书，不得喷施农药。`,
          },
          fundamento: { pt: '§8.2', en: '§8.2', zh: '§8.2' },
        });
      } else if (cert.validade < hoje) {
        f.push({
          regra: tipo === 'saude' ? 'V09' : 'V08',
          severidade: 'bloqueante',
          campo: 'certificados',
          mensagem: msg(
            (F) => `Certificado ${nome.pt} caducado a ${F.data(cert.validade)}.`,
            (F) => `${nome.en} certificate expired on ${F.data(cert.validade)}.`,
            (F) => `${nome.zh}证书已于 ${F.data(cert.validade)} 到期。`,
          ),
          fundamento: { pt: '§8.2', en: '§8.2', zh: '§8.2' },
        });
      } else if (diasEntre(hoje, cert.validade) <= 30) {
        const dias = diasEntre(hoje, cert.validade);
        f.push({
          regra: 'W11',
          severidade: 'aviso',
          campo: 'certificados',
          mensagem: msg(
            (F) =>
              `Certificado ${nome.pt} expira em ${dias} dias (${F.data(cert.validade)}). Agendar renovação.`,
            (F) =>
              `${nome.en} certificate expires in ${dias} days (${F.data(cert.validade)}). Schedule renewal.`,
            (F) => `${nome.zh}证书将于 ${dias} 天后（${F.data(cert.validade)}）到期，请安排续期。`,
          ),
          fundamento: { pt: '§8.4 W11', en: '§8.4 W11', zh: '§8.4 W11' },
        });
      }
    }
  }

  // --- V13 / V15. Contrato a prazo ---------------------------------------
  if (t.data_cessacao_prevista && !t.motivo_justificativo_prazo) {
    f.push({
      regra: 'V13',
      severidade: 'bloqueante',
      campo: 'motivo_justificativo_prazo',
      mensagem: {
        pt: 'Contrato a prazo sem motivo justificativo preenchido.',
        en: 'Fixed-term contract with no justifying reason recorded.',
        zh: '定期合同未填写订立事由。',
      },
      fundamento: {
        pt: `§8.2 V13 · ${LEI_TRABALHO.pt}`,
        en: `§8.2 V13 · ${LEI_TRABALHO.en}`,
        zh: `§8.2 V13 · ${LEI_TRABALHO.zh}`,
      },
    });
  }
  if ((t.numero_renovacoes ?? 0) > 2) {
    f.push({
      regra: 'V15',
      severidade: 'bloqueante',
      campo: 'numero_renovacoes',
      mensagem: {
        pt: `Contrato a prazo certo com ${t.numero_renovacoes} renovações. O limite é duas.`,
        en: `Fixed-term contract with ${t.numero_renovacoes} renewals. The limit is two.`,
        zh: `定期合同已续签 ${t.numero_renovacoes} 次，上限为两次。`,
      },
      fundamento: { pt: '§8.2 V15', en: '§8.2 V15', zh: '§8.2 V15' },
    });
  }

  // --- Data de início por registar ----------------------------------------
  //
  // O prazo de inscrição no INSS conta-se do início do contrato. Sem essa
  // data, a V29 não tem de onde contar — e não contar não é o mesmo que estar
  // dentro do prazo.
  if (t.estado === 'activo' && !t.data_inicio) {
    f.push({
      regra: 'V29',
      severidade: 'bloqueante',
      campo: 'data_inicio',
      mensagem: {
        pt: 'Sem data de início de contrato. O prazo de inscrição no INSS conta-se a partir dela; sem a data, não há prazo a verificar.',
        en: 'No contract start date. The INSS registration deadline is counted from it; without the date there is no deadline to check.',
        zh: '未登记合同起始日期。社保参保期限自该日起算；没有日期，就无从核验期限。',
      },
      fundamento: { pt: '§8.2 V29', en: '§8.2 V29', zh: '§8.2 V29' },
    });
  }

  // --- V29. INSS ----------------------------------------------------------
  if (t.estado === 'activo' && !t.numero_beneficiario_inss && t.data_inicio) {
    const dias = diasEntre(t.data_inicio, hoje);
    const prazo = valorEm('INSS-PRAZO-INSCRICAO', hoje);
    if (dias > prazo) {
      f.push({
        regra: 'V29',
        severidade: 'bloqueante',
        campo: 'numero_beneficiario_inss',
        mensagem: {
          pt: `Trabalhador activo há ${dias} dias sem número de beneficiário do INSS. O prazo de inscrição é de ${prazo} dias.`,
          en: `Worker active for ${dias} days with no INSS beneficiary number. The registration deadline is ${prazo} days.`,
          zh: `工人已在职 ${dias} 天，仍无社保（INSS）参保编号。参保期限为 ${prazo} 天。`,
        },
        fundamento: {
          pt: '§8.2 V29 · Regime de segurança social obrigatória',
          en: '§8.2 V29 · Compulsory social security regime',
          zh: '§8.2 V29 · 强制性社会保障制度',
        },
      });
    } else if (dias >= 15) {
      f.push({
        regra: 'V29',
        severidade: 'aviso',
        campo: 'numero_beneficiario_inss',
        mensagem: {
          pt: `Sem inscrição no INSS ao ${dias}.º dia. Prazo: ${prazo} dias.`,
          en: `Not registered with INSS on day ${dias}. Deadline: ${prazo} days.`,
          zh: `入职第 ${dias} 天仍未办理社保（INSS）参保。期限为 ${prazo} 天。`,
        },
        fundamento: { pt: '§8.2 V29', en: '§8.2 V29', zh: '§8.2 V29' },
      });
    }
  }

  // --- Seguro de acidentes (K-PES-10) -------------------------------------
  if (t.estado === 'activo' && !t.apolice_acidentes_trabalho) {
    f.push({
      regra: 'K-PES-10',
      severidade: 'aviso',
      campo: 'apolice_acidentes_trabalho',
      mensagem: {
        pt: 'Sem apólice de seguro de acidentes de trabalho. A cobertura tem meta de 100%, incluindo sazonais.',
        en: 'No workplace accident insurance policy. Coverage has a 100% target, seasonal workers included.',
        zh: '无工伤保险保单。覆盖率目标为 100%，含季节工。',
      },
      fundamento: { pt: '§10.6 K-PES-10', en: '§10.6 K-PES-10', zh: '§10.6 K-PES-10' },
    });
  }

  return resultado(f);
}

// ============================================================================
// Jorna — V16, V17
// ============================================================================

export interface ContextoJorna {
  hoje: string;
  /** Jornas já existentes para a mesma pessoa e o mesmo dia. */
  duplicados: number;
  horasExtraSemana: number;
  horasExtraTrimestre: number;
  horasExtraAno: number;
  /**
   * Idade do trabalhador à data da jorna. `undefined` quando a data de
   * nascimento não está registada — nesse caso o limite de menores não é
   * aplicado, e é a ficha da pessoa que carrega o bloqueio (V02).
   */
  idadeTrabalhador?: number;
}

const PERIODOS: Record<string, T> = {
  semana: { pt: 'semana', en: 'week', zh: '本周' },
  trimestre: { pt: 'trimestre', en: 'quarter', zh: '本季度' },
  ano: { pt: 'ano', en: 'year', zh: '本年度' },
};

export function validarJorna(j: Jorna, ctx: ContextoJorna): Resultado {
  const f: Constatacao[] = [];

  f.push(...validarDataExecucao(j.data, ctx.hoje, 'data').constatacoes);

  // --- V17. Jorna duplicada ----------------------------------------------
  if (ctx.duplicados > 0) {
    f.push({
      regra: 'V17',
      severidade: 'bloqueante',
      campo: 'data',
      mensagem: msg(
        (F) =>
          `Já existe jorna registada para ${j.trabalhador} em ${F.data(j.data)}. O código ${j.codigo} é único por pessoa e por dia.`,
        (F) =>
          `A worker-day is already recorded for ${j.trabalhador} on ${F.data(j.data)}. Code ${j.codigo} is unique per person per day.`,
        (F) =>
          `${j.trabalhador} 在 ${F.data(j.data)} 已有工日记录。编码 ${j.codigo} 按人按日唯一。`,
      ),
      fundamento: { pt: '§8.2 V17', en: '§8.2 V17', zh: '§8.2 V17' },
    });
  }

  // --- Intervalo de descanso ---------------------------------------------
  const min = valorEm('INTERVALO-MIN', j.data);
  const max = valorEm('INTERVALO-MAX', j.data);
  if (j.presenca === 'presente' && (j.intervalo_minutos < min || j.intervalo_minutos > max)) {
    f.push({
      regra: 'E-18',
      severidade: 'bloqueante',
      campo: 'intervalo_minutos',
      mensagem: {
        pt: `Intervalo de ${j.intervalo_minutos} min fora do admitido (${min} a ${max} min).`,
        en: `Break of ${j.intervalo_minutos} min outside the permitted range (${min} to ${max} min).`,
        zh: `休息 ${j.intervalo_minutos} 分钟，超出允许范围（${min} 至 ${max} 分钟）。`,
      },
      fundamento: {
        pt: `§7.4 E-18 · ${LEI_TRABALHO.pt}`,
        en: `§7.4 E-18 · ${LEI_TRABALHO.en}`,
        zh: `§7.4 E-18 · ${LEI_TRABALHO.zh}`,
      },
    });
  }

  // --- Limite diário de horas normais ------------------------------------
  const menor =
    ctx.idadeTrabalhador !== undefined && ctx.idadeTrabalhador < valorEm('IDADE-MIN', j.data);
  const maxDia = menor ? valorEm('MENOR-HORAS-DIA', j.data) : valorEm('HORAS-DIA', j.data);
  if (j.horas_normais.valor > maxDia) {
    f.push({
      regra: menor ? 'V04' : 'E-18',
      severidade: 'bloqueante',
      campo: 'horas_normais',
      mensagem: {
        pt: `${j.horas_normais.valor} horas normais excedem o limite diário de ${maxDia} h${menor ? ' aplicável a menores' : ''}.`,
        en: `${j.horas_normais.valor} normal hours exceed the daily limit of ${maxDia} h${menor ? ' applicable to minors' : ''}.`,
        zh: `正常工时 ${j.horas_normais.valor} 小时，超过${menor ? '未成年人适用的' : ''}每日 ${maxDia} 小时上限。`,
      },
      fundamento: {
        pt: `§19.2 · ${LEI_TRABALHO.pt}`,
        en: `§19.2 · ${LEI_TRABALHO.en}`,
        zh: `§19.2 · ${LEI_TRABALHO.zh}`,
      },
    });
  }

  // --- V16. Acumuladores de horas extraordinárias ------------------------
  const limites: [string, number, string][] = [
    ['HEXT-SEMANA', ctx.horasExtraSemana, 'semana'],
    ['HEXT-TRIMESTRE', ctx.horasExtraTrimestre, 'trimestre'],
    ['HEXT-ANO', ctx.horasExtraAno, 'ano'],
  ];
  const extra = j.horas_extraordinarias?.valor ?? 0;
  for (const [codigo, acumulado, periodo] of limites) {
    const limite = valorEm(codigo, j.data);
    if (acumulado + extra > limite) {
      const p = PERIODOS[periodo];
      f.push({
        regra: 'V16',
        severidade: 'bloqueante',
        campo: 'horas_extraordinarias',
        mensagem: msg(
          (F) =>
            `Esta jorna leva o acumulado de horas extraordinárias a ${F.numero(acumulado + extra, 1)} h no ${p.pt}, acima do limite legal de ${limite} h.`,
          (F) =>
            `This worker-day takes accumulated overtime to ${F.numero(acumulado + extra, 1)} h in the ${p.en}, above the legal limit of ${limite} h.`,
          (F) =>
            `本次工日使${p.zh}累计加班达到 ${F.numero(acumulado + extra, 1)} 小时，超过 ${limite} 小时的法定上限。`,
        ),
        fundamento: {
          pt: `§8.2 V16 · ${LEI_TRABALHO.pt}`,
          en: `§8.2 V16 · ${LEI_TRABALHO.en}`,
          zh: `§8.2 V16 · ${LEI_TRABALHO.zh}`,
        },
      });
    }
  }

  // --- Trabalho à tarefa sem produção registada --------------------------
  if (j.presenca === 'presente' && !j.producao_individual && !j.talhao) {
    f.push({
      regra: 'E-18',
      severidade: 'aviso',
      campo: 'talhao',
      mensagem: {
        pt: 'Trabalho de campo sem talhão associado. O talhão é obrigatório em trabalho de campo.',
        en: 'Field work with no plot attached. The plot is mandatory for field work.',
        zh: '田间作业未关联地块。田间作业必须指明地块。',
      },
      fundamento: { pt: '§7.4 E-18', en: '§7.4 E-18', zh: '§7.4 E-18' },
    });
  }

  return resultado(f);
}

// ============================================================================
// Operação — V23 (R1)
// ============================================================================

export function validarOperacao(op: Operacao, hoje: string, ordemExiste: boolean): Resultado {
  const f: Constatacao[] = [];

  if (!ordemExiste || !op.ordem_trabalho) {
    f.push({
      regra: 'V23',
      severidade: 'bloqueante',
      campo: 'ordem_trabalho',
      mensagem: {
        pt: 'Operação sem ordem de trabalho associada. Trabalho executado sem ordem não é pago nem contabilizado.',
        en: 'Operation with no work order attached. Work carried out without an order is neither paid nor counted.',
        zh: '作业未关联工单。无工单的作业既不计酬也不计入统计。',
      },
      fundamento: {
        pt: '§8.2 V23 · regra inviolável R1',
        en: '§8.2 V23 · inviolable rule R1',
        zh: '§8.2 V23 · 不可违背规则 R1',
      },
    });
  }

  f.push(...validarDataExecucao(op.data_real, hoje).constatacoes);
  f.push(
    ...validarCincoCampos({
      quem: { executante: op.executantes, responsavel: op.responsavel },
      oQue: { objecto: op.ordem_trabalho },
      onde: { local: op.talhao },
      quando: { inicio: op.data_real, fim: op.hora_fim },
      quanto: { quantidade: op.quantidade_real },
    }).constatacoes,
  );

  if (op.executantes.length === 0) {
    f.push({
      regra: 'E-11',
      severidade: 'bloqueante',
      campo: 'executantes',
      mensagem: {
        pt: 'Pelo menos um trabalhador activo tem de constar como executante.',
        en: 'At least one active worker must be listed as an executor.',
        zh: '至少须有一名在职工人列为执行人。',
      },
      fundamento: { pt: '§7.3 E-11', en: '§7.3 E-11', zh: '§7.3 E-11' },
    });
  }

  if (!op.assinatura_responsavel) {
    f.push({
      regra: 'E-11',
      severidade: 'bloqueante',
      campo: 'assinatura_responsavel',
      mensagem: {
        pt: 'Falta a assinatura do responsável. Sem ela a operação não fecha.',
        en: 'The supervisor’s signature is missing. Without it the operation does not close.',
        zh: '缺少负责人签字。没有签字，作业无法结案。',
      },
      fundamento: { pt: '§7.3 E-11', en: '§7.3 E-11', zh: '§7.3 E-11' },
    });
  }

  return resultado(f);
}

// ============================================================================
// Pesagem de colheita — V12, W01, W02, W05
// ============================================================================

export interface ContextoPesagem {
  hoje: string;
  /** Data mínima de colheita imposta pelo intervalo de segurança do talhão. */
  dataMinimaColheita?: string;
  /** Data da ronda anterior no mesmo talhão. */
  dataRondaAnterior?: string;
}

const FUND_F07: T = { pt: '§Anexo A F-07', en: '§Annex A F-07', zh: '§附录 A F-07' };

export function validarPesagem(p: PesagemColheita, ctx: ContextoPesagem): Resultado {
  const f: Constatacao[] = [];

  f.push(...validarDataExecucao(p.data_colheita, ctx.hoje, 'data_colheita').constatacoes);

  // --- V12. Intervalo de segurança ---------------------------------------
  if (ctx.dataMinimaColheita && p.data_colheita < ctx.dataMinimaColheita) {
    const minima = ctx.dataMinimaColheita;
    f.push({
      regra: 'V12',
      severidade: 'bloqueante',
      campo: 'data_colheita',
      mensagem: msg(
        (F) =>
          `Colheita a ${F.data(p.data_colheita)}, antes da data mínima de ${F.data(minima)} imposta pelo intervalo de segurança da última aplicação neste talhão.`,
        (F) =>
          `Harvest on ${F.data(p.data_colheita)}, before the minimum date of ${F.data(minima)} set by the pre-harvest interval of the last application on this plot.`,
        (F) =>
          `采收日期为 ${F.data(p.data_colheita)}，早于本地块上次施药安全间隔期规定的最早日期 ${F.data(minima)}。`,
      ),
      fundamento: { pt: '§8.2 V12', en: '§8.2 V12', zh: '§8.2 V12' },
    });
  }

  // --- Coerência das pesagens --------------------------------------------
  if (p.quantidade_bruta.valor <= 0) {
    f.push({
      regra: 'F-07',
      severidade: 'bloqueante',
      campo: 'quantidade_bruta',
      mensagem: {
        pt: 'O peso bruto tem de ser maior que zero.',
        en: 'Gross weight must be greater than zero.',
        zh: '毛重必须大于零。',
      },
      fundamento: FUND_F07,
    });
  }
  // Só se queixa da tara quando há bruto: com ambos a zero, o utilizador
  // veria duas mensagens para o mesmo campo por preencher.
  if (p.quantidade_bruta.valor > 0 && p.tara.valor >= p.quantidade_bruta.valor) {
    f.push({
      regra: 'F-07',
      severidade: 'bloqueante',
      campo: 'tara',
      mensagem: msg(
        (F) =>
          `Tara de ${F.numero(p.tara.valor, 1)} kg igual ou superior ao peso bruto de ${F.numero(p.quantidade_bruta.valor, 1)} kg.`,
        (F) =>
          `Tare of ${F.numero(p.tara.valor, 1)} kg equal to or greater than the gross weight of ${F.numero(p.quantidade_bruta.valor, 1)} kg.`,
        (F) =>
          `皮重 ${F.numero(p.tara.valor, 1)} kg 大于或等于毛重 ${F.numero(p.quantidade_bruta.valor, 1)} kg。`,
      ),
      fundamento: FUND_F07,
    });
  }
  if (p.quantidade_rejeitada.valor > p.quantidade_liquida.valor) {
    f.push({
      regra: 'F-07',
      severidade: 'bloqueante',
      campo: 'quantidade_rejeitada',
      mensagem: {
        pt: 'A quantidade rejeitada não pode exceder a quantidade líquida.',
        en: 'The rejected quantity cannot exceed the net quantity.',
        zh: '剔除量不得超过净重。',
      },
      fundamento: FUND_F07,
    });
  }
  if (p.quantidade_rejeitada.valor > 0 && !p.motivo_rejeicao) {
    f.push({
      regra: 'F-07',
      severidade: 'bloqueante',
      campo: 'motivo_rejeicao',
      mensagem: {
        pt: 'Toda a rejeição tem de ser explicada. Perda sem motivo não fecha o balanço (R6).',
        en: 'Every rejection must be explained. A loss without a reason does not close the mass balance (R6).',
        zh: '每一次剔除都必须说明原因。无原因的损耗无法平衡物料（R6）。',
      },
      fundamento: {
        pt: `${FUND_F07.pt} · regra inviolável R6`,
        en: `${FUND_F07.en} · inviolable rule R6`,
        zh: `${FUND_F07.zh} · 不可违背规则 R6`,
      },
    });
  }

  // --- V27. Pesador e conferente distintos --------------------------------
  if (p.pesador === p.conferente) {
    f.push({
      regra: 'V27',
      severidade: 'bloqueante',
      campo: 'conferente',
      mensagem: {
        pt: 'Pesador e conferente têm de ser pessoas distintas.',
        en: 'The weigher and the checker must be different people.',
        zh: '称重人与复核人必须为不同的人。',
      },
      fundamento: {
        pt: '§8.2 V27 · controlo interno',
        en: '§8.2 V27 · internal control',
        zh: '§8.2 V27 · 内部控制',
      },
    });
  }

  // --- W05. Taxa de rejeição ---------------------------------------------
  const taxa = taxaRejeicao(p);
  if (taxa > 8) {
    f.push({
      regra: 'W05',
      severidade: 'aviso',
      campo: 'quantidade_rejeitada',
      mensagem: msg(
        (F) =>
          `Taxa de rejeição de ${F.percentagem(taxa)}, acima do limiar de aviso de 8% (meta K-COL-04: ≤ 6%).`,
        (F) =>
          `Rejection rate of ${F.percentagem(taxa)}, above the 8% warning threshold (K-COL-04 target: ≤ 6%).`,
        (F) => `剔除率 ${F.percentagem(taxa)}，超过 8% 的警戒阈值（K-COL-04 目标：≤ 6%）。`,
      ),
      fundamento: { pt: '§8.4 W05', en: '§8.4 W05', zh: '§8.4 W05' },
    });
  }

  // --- W01. Intervalo entre rondas ---------------------------------------
  if (ctx.dataRondaAnterior) {
    const dias = diasEntre(ctx.dataRondaAnterior, p.data_colheita);
    if (dias > 14) {
      f.push({
        regra: 'W01',
        severidade: 'aviso',
        campo: 'data_colheita',
        mensagem: {
          pt: `${dias} dias desde a ronda anterior, acima do intervalo de 7 a 14 dias (K-COL-01).`,
          en: `${dias} days since the previous round, above the 7-to-14-day interval (K-COL-01).`,
          zh: `距上一轮采收已 ${dias} 天，超过 7 至 14 天的间隔要求（K-COL-01）。`,
        },
        fundamento: { pt: '§8.4 W01', en: '§8.4 W01', zh: '§8.4 W01' },
      });
    }
  }

  // --- W02. Prazo até ao descasque ---------------------------------------
  if (p.hora_entrada_processamento) {
    const horas = horasEntre(`${p.data_colheita}T${p.hora}`, p.hora_entrada_processamento);
    if (horas > 48) {
      f.push({
        regra: 'W02',
        severidade: 'excepcao',
        campo: 'hora_entrada_processamento',
        mensagem: msg(
          (F) =>
            `${F.numero(horas, 1)} h entre a apanha e o descasque, acima de 48 h. Escala a não conformidade.`,
          (F) =>
            `${F.numero(horas, 1)} h between picking and dehusking, above 48 h. Escalates as a non-conformity.`,
          (F) => `采摘至脱皮间隔 ${F.numero(horas, 1)} 小时，超过 48 小时，按不合格项上报。`,
        ),
        fundamento: { pt: '§8.4 W02', en: '§8.4 W02', zh: '§8.4 W02' },
      });
    } else if (horas > 24) {
      f.push({
        regra: 'W02',
        severidade: 'aviso',
        campo: 'hora_entrada_processamento',
        mensagem: msg(
          (F) =>
            `${F.numero(horas, 1)} h entre a apanha e o descasque, acima das 24 h da meta K-COL-02.`,
          (F) =>
            `${F.numero(horas, 1)} h between picking and dehusking, above the 24 h of target K-COL-02.`,
          (F) => `采摘至脱皮间隔 ${F.numero(horas, 1)} 小时，超过 K-COL-02 目标的 24 小时。`,
        ),
        fundamento: { pt: '§8.4 W02', en: '§8.4 W02', zh: '§8.4 W02' },
      });
    }
  }

  f.push(...validarFonteDados(p.fonte_dados, true).constatacoes);

  return resultado(f);
}

// ============================================================================
// Relatório diário de campo (F-05)
// ============================================================================

export interface ContextoRelatorio {
  /** Relatórios já existentes para o mesmo bloco e o mesmo dia. */
  duplicados?: number;
}

const FUND_F05: T = { pt: '§Anexo A F-05', en: '§Annex A F-05', zh: '§附录 A F-05' };

export function validarRelatorioDiario(
  r: RelatorioDiario,
  hoje: string,
  ctx: ContextoRelatorio = {},
): Resultado {
  const f: Constatacao[] = [];

  f.push(...validarDataExecucao(r.data, hoje, 'data').constatacoes);

  // Um bloco entrega um relatório por turno e por dia. Dois relatórios para o
  // mesmo bloco e o mesmo dia duplicariam efectivo e produção nos indicadores.
  if ((ctx.duplicados ?? 0) > 0) {
    f.push({
      regra: 'F-05',
      severidade: 'bloqueante',
      campo: 'data',
      mensagem: msg(
        (F) =>
          `Já existe relatório diário para o bloco ${r.bloco} em ${F.data(r.data)} (${r.codigo}). Para corrigir o que foi entregue, anule e substitua esse registo — não crie um segundo.`,
        (F) =>
          `A daily report already exists for block ${r.bloco} on ${F.data(r.data)} (${r.codigo}). To correct what was submitted, annul and replace that record — do not create a second one.`,
        (F) =>
          `${r.bloco} 区在 ${F.data(r.data)} 已有日报（${r.codigo}）。如需更正，请作废原记录并提交替代记录，不要新建第二份。`,
      ),
      fundamento: {
        pt: `${FUND_F05.pt} · §24.5`,
        en: `${FUND_F05.en} · §24.5`,
        zh: `${FUND_F05.zh} · §24.5`,
      },
    });
  }

  f.push(
    ...validarCincoCampos({
      quem: { responsavel: r.chefe_turma },
      oQue: { objecto: r.ordens_trabalho[0] },
      onde: { local: r.talhoes[0] ?? r.bloco },
      quando: { inicio: r.data, fim: r.hora_fim },
      quanto: { quantidade: r.quantidade_realizada },
    }).constatacoes,
  );

  if (r.efectivo_presente > r.efectivo_previsto) {
    f.push({
      regra: 'F-05',
      severidade: 'aviso',
      campo: 'efectivo_presente',
      mensagem: {
        pt: `${r.efectivo_presente} presentes com ${r.efectivo_previsto} previstos. Confirmar o plano de efectivo do dia.`,
        en: `${r.efectivo_presente} present against ${r.efectivo_previsto} planned. Confirm the day’s staffing plan.`,
        zh: `实到 ${r.efectivo_presente} 人，计划 ${r.efectivo_previsto} 人。请确认当日用工计划。`,
      },
      fundamento: FUND_F05,
    });
  }

  const faltasEsperadas = r.efectivo_previsto - r.efectivo_presente;
  if (faltasEsperadas > 0 && r.faltas.length !== faltasEsperadas) {
    const n = faltasEsperadas;
    const m = r.faltas.length;
    f.push({
      regra: 'F-05',
      severidade: 'bloqueante',
      campo: 'faltas',
      mensagem: {
        pt: `${n} ${n === 1 ? 'falta por explicar' : 'faltas por explicar'}: ${m === 1 ? 'consta 1 motivo' : `constam ${m} motivos`} para ${n === 1 ? '1 ausência' : `${n} ausências`}. Toda a falta tem motivo.`,
        en: `${n} ${n === 1 ? 'absence' : 'absences'} unexplained: ${m === 1 ? '1 reason recorded' : `${m} reasons recorded`} for ${n === 1 ? '1 absence' : `${n} absences`}. Every absence has a reason.`,
        zh: `${n} 人缺勤未说明原因：${n} 人缺勤仅记录 ${m} 条原因。每一次缺勤都必须有原因。`,
      },
      fundamento: FUND_F05,
    });
  }

  if (r.incidentes_seguranca > 0 && r.bloqueios.length === 0 && !r.notas) {
    const n = r.incidentes_seguranca;
    f.push({
      regra: 'F-05',
      severidade: 'aprovacao',
      campo: 'incidentes_seguranca',
      aprova: 'Gestor da unidade',
      mensagem: {
        pt: `${n} ${n === 1 ? 'incidente de segurança' : 'incidentes de segurança'} sem descrição. Um incidente sem relato não pode ser analisado.`,
        en: `${n} safety ${n === 1 ? 'incident' : 'incidents'} with no description. An incident without an account cannot be analysed.`,
        zh: `${n} 起安全事件未填写描述。没有陈述的事件无法分析。`,
      },
      fundamento: FUND_F05,
    });
  }

  return resultado(f);
}

// ============================================================================
// Talhão — integridade de áreas e W08
// ============================================================================

const FUND_E01: T = { pt: '§7.1 E-01', en: '§7.1 E-01', zh: '§7.1 E-01' };

export function validarTalhao(t: Talhao, hoje: string): Resultado {
  const f: Constatacao[] = [];

  if (t.area_bruta_ha.valor <= 0) {
    f.push({
      regra: 'E-01',
      severidade: 'bloqueante',
      campo: 'area_bruta_ha',
      mensagem: {
        pt: 'A área bruta tem de ser maior que zero.',
        en: 'Gross area must be greater than zero.',
        zh: '毛面积必须大于零。',
      },
      fundamento: FUND_E01,
    });
  }
  if (t.area_plantada_ha.valor > t.area_bruta_ha.valor) {
    f.push({
      regra: 'E-01',
      severidade: 'bloqueante',
      campo: 'area_plantada_ha',
      mensagem: msg(
        (F) =>
          `Área plantada (${F.numero(t.area_plantada_ha.valor, 1)} ha) maior do que a área bruta (${F.numero(t.area_bruta_ha.valor, 1)} ha).`,
        (F) =>
          `Planted area (${F.numero(t.area_plantada_ha.valor, 1)} ha) greater than gross area (${F.numero(t.area_bruta_ha.valor, 1)} ha).`,
        (F) =>
          `种植面积（${F.numero(t.area_plantada_ha.valor, 1)} 公顷）大于毛面积（${F.numero(t.area_bruta_ha.valor, 1)} 公顷）。`,
      ),
      fundamento: FUND_E01,
    });
  }
  if (t.area_util_ha.valor > t.area_plantada_ha.valor) {
    f.push({
      regra: 'E-01',
      severidade: 'bloqueante',
      campo: 'area_util_ha',
      mensagem: msg(
        (F) =>
          `Área útil (${F.numero(t.area_util_ha.valor, 1)} ha) maior do que a área plantada (${F.numero(t.area_plantada_ha.valor, 1)} ha).`,
        (F) =>
          `Usable area (${F.numero(t.area_util_ha.valor, 1)} ha) greater than planted area (${F.numero(t.area_plantada_ha.valor, 1)} ha).`,
        (F) =>
          `有效面积（${F.numero(t.area_util_ha.valor, 1)} 公顷）大于种植面积（${F.numero(t.area_plantada_ha.valor, 1)} 公顷）。`,
      ),
      fundamento: FUND_E01,
    });
  }

  if (t.sistema_rega !== 'sequeiro' && !t.fonte_agua) {
    f.push({
      regra: 'E-01',
      severidade: 'bloqueante',
      campo: 'fonte_agua',
      mensagem: {
        pt: 'Talhão regado sem fonte de água associada.',
        en: 'Irrigated plot with no water source attached.',
        zh: '灌溉地块未关联水源。',
      },
      fundamento: FUND_E01,
    });
  }

  // --- W08. Análise de solo -----------------------------------------------
  const validade = valorEm('ANALISE-SOLO-VALIDADE', hoje);
  if (!t.data_analise_solo) {
    f.push({
      regra: 'W08',
      severidade: 'excepcao',
      campo: 'data_analise_solo',
      mensagem: {
        pt: 'Talhão sem análise de solo registada.',
        en: 'Plot with no soil analysis on record.',
        zh: '地块无土壤检测记录。',
      },
      fundamento: { pt: '§8.4 W08', en: '§8.4 W08', zh: '§8.4 W08' },
    });
  } else {
    const meses = mesesEntre(t.data_analise_solo, hoje);
    if (meses > validade) {
      f.push({
        regra: 'W08',
        severidade: 'excepcao',
        campo: 'data_analise_solo',
        mensagem: {
          pt: `Análise de solo com ${meses} meses, acima do limite de ${validade} meses.`,
          en: `Soil analysis is ${meses} months old, above the ${validade}-month limit.`,
          zh: `土壤检测已过去 ${meses} 个月，超过 ${validade} 个月的有效期。`,
        },
        fundamento: { pt: '§8.4 W08', en: '§8.4 W08', zh: '§8.4 W08' },
      });
    }
  }

  // O E-01 marca o polígono como obrigatório. Sem ele a área declarada não é
  // verificável contra o terreno — mas capturá-lo exige GPS no campo, e não
  // pode travar o cadastro feito à secretária.
  if (t.poligono.length === 0) {
    f.push({
      regra: 'E-01',
      severidade: 'aviso',
      campo: 'poligono',
      mensagem: {
        pt: 'Sem polígono. A área declarada fica por verificar contra o terreno até haver levantamento.',
        en: 'No polygon. The declared area stays unverified against the ground until a survey is done.',
        zh: '无边界多边形。在实地测绘之前，申报面积无法与实地核对。',
      },
      fundamento: FUND_E01,
    });
  }

  if (t.poligono.length > 0 && t.poligono.length < 3) {
    f.push({
      regra: 'E-01',
      severidade: 'bloqueante',
      campo: 'poligono',
      mensagem: {
        pt: 'O polígono do talhão precisa de pelo menos três vértices para fechar.',
        en: 'The plot polygon needs at least three vertices to close.',
        zh: '地块边界多边形至少需要三个顶点才能闭合。',
      },
      fundamento: FUND_E01,
    });
  }

  return resultado(f);
}

// ============================================================================
// Monitorização fitossanitária (F-12)
// ============================================================================

export interface ContextoMonitorizacao {
  hoje: string;
  /** Contagens já registadas para o mesmo talhão no mesmo dia. */
  duplicados?: number;
}

const FUND_F12: T = { pt: '§Anexo A F-12', en: '§Annex A F-12', zh: '§附录 A F-12' };

export function validarMonitorizacao(m: Monitorizacao, ctx: ContextoMonitorizacao): Resultado {
  const f: Constatacao[] = [];

  f.push(...validarDataExecucao(m.data, ctx.hoje, 'data').constatacoes);

  f.push(
    ...validarCincoCampos({
      quem: { responsavel: m.observador },
      oQue: { objecto: m.organismo },
      onde: { local: m.talhao },
      quando: { inicio: m.data },
      quanto: { quantidade: m.indice_calculado },
    }).constatacoes,
  );

  if ((ctx.duplicados ?? 0) > 0) {
    f.push({
      regra: 'F-12',
      severidade: 'bloqueante',
      campo: 'data',
      mensagem: msg(
        (F) =>
          `Já existe contagem para ${m.talhao} em ${F.data(m.data)}. Duas contagens no mesmo talhão e dia duplicam o índice nos indicadores da família FIT.`,
        (F) =>
          `A count already exists for ${m.talhao} on ${F.data(m.data)}. Two counts on the same plot and day double the index in the FIT family of indicators.`,
        (F) =>
          `${m.talhao} 在 ${F.data(m.data)} 已有计数记录。同一地块同一天两次计数会使 FIT 系列指标重复计算。`,
      ),
      fundamento: FUND_F12,
    });
  }

  if (m.n_pontos_amostrados <= 0 || m.n_plantas_por_ponto <= 0) {
    f.push({
      regra: 'F-12',
      severidade: 'bloqueante',
      campo: 'n_pontos_amostrados',
      mensagem: {
        pt: 'A amostra tem de ter pelo menos um ponto e uma planta por ponto — sem denominador não há índice.',
        en: 'The sample needs at least one point and one plant per point — without a denominator there is no index.',
        zh: '样本至少需要一个样点、每样点一株——没有分母就没有指数。',
      },
      fundamento: {
        pt: '§9.2 — todo o indicador tem denominador explícito',
        en: '§9.2 — every indicator has an explicit denominator',
        zh: '§9.2 — 每个指标都必须有明确的分母',
      },
    });
  }

  // O índice é derivado, nunca introduzido: se não bater certo, algum dos
  // três números está errado.
  const plantas = m.n_pontos_amostrados * m.n_plantas_por_ponto;
  if (plantas > 0) {
    const esperado = m.contagem_pragas / plantas;
    if (Math.abs(esperado - m.indice_calculado.valor) > 0.005) {
      f.push({
        regra: 'F-12',
        severidade: 'bloqueante',
        campo: 'indice_calculado',
        mensagem: msg(
          (F) =>
            `O índice não corresponde à contagem: ${m.contagem_pragas} pragas em ${plantas} plantas dá ${F.numero(esperado, 2)}, não ${F.numero(m.indice_calculado.valor, 2)}.`,
          (F) =>
            `The index does not match the count: ${m.contagem_pragas} pests over ${plantas} plants gives ${F.numero(esperado, 2)}, not ${F.numero(m.indice_calculado.valor, 2)}.`,
          (F) =>
            `指数与计数不符：${plantas} 株上 ${m.contagem_pragas} 只虫，应为 ${F.numero(esperado, 2)}，而非 ${F.numero(m.indice_calculado.valor, 2)}。`,
        ),
        fundamento: FUND_F12,
      });
    }
  }

  // §24.4 — acima do limiar, o sistema propõe tratamento. Decidir não fazer
  // nada continua a ser possível, mas passa a exigir quem responda por isso.
  if (m.indice_calculado.valor > m.limiar_aplicavel.valor && m.decisao === 'nenhuma_accao') {
    f.push({
      regra: 'A07',
      severidade: 'aprovacao',
      campo: 'decisao',
      aprova: 'Agrónomo responsável',
      mensagem: msg(
        (F) =>
          `Índice de ${F.numero(m.indice_calculado.valor, 2)} acima do limiar de ${F.numero(m.limiar_aplicavel.valor, 1)}, com decisão de não agir. Fica pendente de autorização do agrónomo.`,
        (F) =>
          `Index of ${F.numero(m.indice_calculado.valor, 2)} above the threshold of ${F.numero(m.limiar_aplicavel.valor, 1)}, with a decision to take no action. Held pending the agronomist’s authorisation.`,
        (F) =>
          `指数 ${F.numero(m.indice_calculado.valor, 2)} 超过阈值 ${F.numero(m.limiar_aplicavel.valor, 1)}，但决定不采取措施，须待农艺师批准。`,
      ),
      fundamento: { pt: '§8.3 A07 · §24.4', en: '§8.3 A07 · §24.4', zh: '§8.3 A07 · §24.4' },
    });
  }

  f.push(...validarFonteDados(m.fonte_dados, false).constatacoes);
  return resultado(f);
}

// ============================================================================
// Observação de campo (F-13)
// ============================================================================

const FUND_F13: T = { pt: '§Anexo A F-13', en: '§Annex A F-13', zh: '§附录 A F-13' };

export function validarObservacao(o: Observacao, hoje: string): Resultado {
  const f: Constatacao[] = [];

  f.push(...validarDataExecucao(o.data, hoje, 'data').constatacoes);

  if (!o.descricao || o.descricao.trim().length < 10) {
    f.push({
      regra: 'F-13',
      severidade: 'bloqueante',
      campo: 'descricao',
      mensagem: {
        pt: 'A descrição é o registo. Sem ela a observação não é reconstituível por quem não estava lá.',
        en: 'The description is the record. Without it, someone who was not there cannot reconstruct the observation.',
        zh: '描述即记录。没有描述，不在现场的人无法还原这次观察。',
      },
      fundamento: FUND_F13,
    });
  }

  if (!o.accao_proposta || o.accao_proposta.trim().length < 5) {
    f.push({
      regra: 'F-13',
      severidade: 'bloqueante',
      campo: 'accao_proposta',
      mensagem: {
        pt: 'Toda a observação termina numa acção proposta, ainda que seja «observar de novo em sete dias».',
        en: 'Every observation ends in a proposed action, even if it is «observe again in seven days».',
        zh: '每一次观察都要给出建议措施，哪怕只是「七天后再观察」。',
      },
      fundamento: FUND_F13,
    });
  }

  if (o.extensao_percent < 0 || o.extensao_percent > 100) {
    f.push({
      regra: 'F-13',
      severidade: 'bloqueante',
      campo: 'extensao_percent',
      mensagem: {
        pt: 'A extensão é a percentagem do talhão afectada: entre 0 e 100.',
        en: 'Extent is the percentage of the plot affected: between 0 and 100.',
        zh: '发生程度指受影响地块的百分比：0 至 100 之间。',
      },
      fundamento: FUND_F13,
    });
  }

  // O F-13 marca a fotografia como obrigatória. Enquanto não existir captura
  // de imagem, o sistema assinala em vez de fingir que o campo está cumprido.
  if (o.anexos.length === 0) {
    f.push({
      regra: 'F-13',
      severidade: 'aviso',
      campo: 'anexos',
      mensagem: {
        pt: 'Sem fotografia. O formulário marca-a como obrigatória; a captura de imagem entra com a operação em campo.',
        en: 'No photograph. The form marks it as mandatory; image capture arrives with field operation.',
        zh: '无照片。表单要求必附照片；拍照功能将随现场作业上线。',
      },
      fundamento: {
        pt: `${FUND_F13.pt} · §25`,
        en: `${FUND_F13.en} · §25`,
        zh: `${FUND_F13.zh} · §25`,
      },
    });
  }

  if (o.gravidade === 'critica') {
    f.push({
      regra: '§4.3',
      severidade: 'aviso',
      campo: 'gravidade',
      mensagem: {
        pt: 'Gravidade crítica escala ao agrónomo responsável e ao gestor da unidade.',
        en: 'Critical severity escalates to the responsible agronomist and the unit manager.',
        zh: '严重程度为「危急」时，上报至农艺师与单位负责人。',
      },
      fundamento: {
        pt: '§4.3 — regras de escalonamento',
        en: '§4.3 — escalation rules',
        zh: '§4.3 — 上报规则',
      },
    });
  }

  return resultado(f);
}

// ============================================================================
// Ordem de trabalho (E-10) — o plano
// ============================================================================

export function validarOrdemTrabalho(ot: OrdemTrabalho): Resultado {
  const f: Constatacao[] = [];

  f.push(
    ...validarCincoCampos({
      quem: { responsavel: ot.emitida_por, executante: ot.equipa_prevista },
      oQue: { tipo: ot.tipo_operacao },
      onde: { local: ot.talhao },
      quando: { inicio: ot.data_prevista },
      quanto: { quantidade: ot.quantidade_prevista },
    }).constatacoes,
  );

  if (ot.quantidade_prevista.valor <= 0) {
    f.push({
      regra: 'E-10',
      severidade: 'bloqueante',
      campo: 'quantidade_prevista',
      mensagem: {
        pt: 'Uma ordem sem meta não produz desvio, e o desvio é o indicador mais útil do sistema (R5).',
        en: 'An order with no target produces no deviation, and deviation is the most useful indicator in the system (R5).',
        zh: '没有目标的工单不会产生偏差，而偏差是本系统最有用的指标（R5）。',
      },
      fundamento: {
        pt: '§5.2 · regra inviolável R5',
        en: '§5.2 · inviolable rule R5',
        zh: '§5.2 · 不可违背规则 R5',
      },
    });
  }

  if (ot.jornas_previstas.valor <= 0) {
    f.push({
      regra: 'E-10',
      severidade: 'bloqueante',
      campo: 'jornas_previstas',
      mensagem: {
        pt: 'Sem jornas previstas não há padrão de produtividade contra o qual comparar a execução.',
        en: 'With no planned worker-days there is no productivity baseline to compare execution against.',
        zh: '没有计划工日，就没有可与执行结果对照的生产率基准。',
      },
      fundamento: { pt: '§5.2', en: '§5.2', zh: '§5.2' },
    });
  }

  if (ot.custo_orcamentado.valor <= 0) {
    f.push({
      regra: 'E-10',
      severidade: 'aviso',
      campo: 'custo_orcamentado',
      mensagem: {
        pt: 'Custo orçamentado a zero: o desvio orçamental não será calculável para esta ordem.',
        en: 'Budgeted cost at zero: the budget deviation will not be computable for this order.',
        zh: '预算成本为零：本工单无法计算预算偏差。',
      },
      fundamento: { pt: '§5.2', en: '§5.2', zh: '§5.2' },
    });
  }

  return resultado(f);
}

// ============================================================================
// Utilitários de data
// ============================================================================

const DIA_MS = 86_400_000;

export function diasEntre(de: string, ate: string): number {
  return Math.round((new Date(ate).getTime() - new Date(de).getTime()) / DIA_MS);
}

export function mesesEntre(de: string, ate: string): number {
  const a = new Date(de);
  const b = new Date(ate);
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

export function horasEntre(deIso: string, ateIso: string): number {
  return (new Date(ateIso).getTime() - new Date(deIso).getTime()) / 3_600_000;
}

export function taxaRejeicao(
  p: Pick<PesagemColheita, 'quantidade_rejeitada' | 'quantidade_liquida'>,
): number {
  if (p.quantidade_liquida.valor <= 0) return 0;
  return (p.quantidade_rejeitada.valor / p.quantidade_liquida.valor) * 100;
}
