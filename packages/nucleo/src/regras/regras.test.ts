import { describe, expect, it } from 'vitest';

import { q, type ObjectoCanonico } from '../dominio/canonico';
import { codigo, codigoValido, exigirCodigo, blocoDoTalhao } from '../dominio/codigos';
import { esperadoPorIdade, INDICADOR_POR_CODIGO } from '../dominio/indicadores';
import { parametroEm, parametrosPorConfirmar, valorEm } from '../dominio/parametros';
import type { Trabalhador } from '../dominio/pessoas';
import type { PesagemColheita } from '../dominio/operacoes';

import { kCol04, kPrd01, kPrd03, kPrd04, desempenhoDaEquipa, mediana } from './calculos';
import { desvioCusto, desvioData, desvioQuantidade } from './desvio';
import { alterar, anularESubstituir, criar, ErroImutabilidade } from './historico';
import { avaliar, exigeEscalonamento, tendencia } from './semaforo';
import { validarCincoCampos, validarPesagem, validarTrabalhador } from './validacao';

const HOJE = '2026-09-01';

// ============================================================================
// R2 — a regra dos cinco campos
// ============================================================================

describe('R2 — regra dos cinco campos (§5.1)', () => {
  const completo = {
    quem: { executante: ['TR-00042'], responsavel: 'TR-00007' },
    oQue: { tipo: 'OPT-20', objecto: 'CC-2026-MAC-FA-B01-T03' },
    onde: { local: 'FA-B01-T03' },
    quando: { inicio: '2026-04-18', fim: '12:00' },
    quanto: { quantidade: q(186.5, 'kg', 'NIH') },
  };

  it('aceita um registo com as cinco respostas', () => {
    expect(validarCincoCampos(completo).gravavel).toBe(true);
  });

  it.each([
    ['quem', { ...completo, quem: {} }],
    ['o quê', { ...completo, oQue: {} }],
    ['onde', { ...completo, onde: {} }],
    ['quando', { ...completo, quando: {} }],
    ['quanto', { ...completo, quanto: {} }],
  ])('rejeita na entrada quando falta «%s»', (_, registo) => {
    const r = validarCincoCampos(registo);
    expect(r.gravavel).toBe(false);
    expect(r.constatacoes.some((c) => c.severidade === 'bloqueante')).toBe(true);
  });

  it('rejeita quantidade sem unidade (V24, regra R3)', () => {
    const r = validarCincoCampos({
      ...completo,
      quanto: { quantidade: { valor: 186.5, unidade: '' as never } },
    });
    expect(r.gravavel).toBe(false);
    expect(r.constatacoes.find((c) => c.regra === 'V24')).toBeDefined();
  });
});

// ============================================================================
// Semáforo (§9.3)
// ============================================================================

describe('Semáforo (§9.3)', () => {
  const kPrd03Ficha = INDICADOR_POR_CODIGO.get('K-PRD-03')!;
  const kPrd04Ficha = INDICADOR_POR_CODIGO.get('K-PRD-04')!;

  it('verde quando igual ou melhor do que a meta', () => {
    expect(avaliar(85, kPrd03Ficha).cor).toBe('verde');
    expect(avaliar(80, kPrd03Ficha).cor).toBe('verde');
  });

  it('âmbar entre a meta e o limiar de alerta', () => {
    const leitura = avaliar(70, kPrd03Ficha);
    expect(leitura.cor).toBe('ambar');
    expect(leitura.consequencia.pt).toMatch(/Comentário obrigatório/);
  });

  it('vermelho abaixo do limiar, com a acção declarada na ficha', () => {
    const leitura = avaliar(24.9, kPrd03Ficha);
    expect(leitura.cor).toBe('vermelho');
    expect(leitura.consequencia).toEqual(kPrd03Ficha.accao_vermelho);
  });

  it('cinzento sem dados — falha de processo, não ausência de problema', () => {
    const leitura = avaliar(undefined, kPrd03Ficha);
    expect(leitura.cor).toBe('cinzento');
    expect(leitura.consequencia.pt).toMatch(/não foi entregue/);
  });

  it('inverte o sentido em indicadores menor-é-melhor', () => {
    expect(avaliar(15, kPrd04Ficha).cor).toBe('verde');
    expect(avaliar(75.1, kPrd04Ficha).cor).toBe('vermelho');
  });

  it('cinzento quando a meta ainda está por estabelecer', () => {
    const kCol05 = INDICADOR_POR_CODIGO.get('K-COL-05')!;
    expect(kCol05.meta).toBeUndefined();
    expect(avaliar(12, kCol05).cor).toBe('cinzento');
  });

  it('escala após dois períodos consecutivos em vermelho (§4.3)', () => {
    expect(exigeEscalonamento([85, 24, 22], kPrd03Ficha)).toBe(true);
    expect(exigeEscalonamento([24, 85], kPrd03Ficha)).toBe(false);
  });

  it('lê a tendência no sentido do indicador', () => {
    expect(tendencia([24.9, 31.0], kPrd03Ficha)).toBe('a_melhorar');
    expect(tendencia([31.0, 24.9], kPrd03Ficha)).toBe('a_piorar');
    expect(tendencia([31.0], kPrd03Ficha)).toBe('sem_dados');
  });
});

// ============================================================================
// Plano contra execução (§5.2)
// ============================================================================

describe('Plano contra execução (§5.2)', () => {
  it('conta os dias de atraso', () => {
    expect(desvioData('2026-04-10', '2026-04-18').absoluto).toBe(8);
    expect(desvioData('2026-04-18', '2026-04-18').leitura.pt).toBe('No prazo');
    expect(desvioData('2026-04-18', '2026-04-16').leitura.pt).toMatch(/antecipação/);
  });

  it('calcula a percentagem de cumprimento da quantidade', () => {
    const d = desvioQuantidade(q(200, 'kg', 'NIH'), q(186.5, 'kg', 'NIH'));
    expect(d.relativo).toBeCloseTo(93.25, 2);
    expect(d.sentido).toBe('desfavoravel');
  });

  it('trata gastar acima do orçamento como desfavorável', () => {
    expect(desvioCusto(q(10_000, 'MT'), q(12_000, 'MT')).sentido).toBe('desfavoravel');
    expect(desvioCusto(q(10_000, 'MT'), q(9_000, 'MT')).sentido).toBe('favoravel');
  });
});

// ============================================================================
// Parâmetros versionados (§19.2)
// ============================================================================

describe('Parâmetros versionados (§19.2)', () => {
  it('devolve o valor em vigor à data, e não o mais recente', () => {
    expect(valorEm('HORAS-DIA', '2026-09-01')).toBe(8);
    expect(valorEm('IDADE-MIN', '2026-09-01')).toBe(18);
  });

  it('devolve indefinido antes de qualquer data de efeito', () => {
    expect(parametroEm('HORAS-DIA', '2020-01-01')).toBeUndefined();
  });

  it('assinala os que ainda estão por confirmar', () => {
    const pendentes = parametrosPorConfirmar(HOJE).map((p) => p.parametro.codigo);
    expect(pendentes).toContain('HEXT-SEMANA');
  });
});

// ============================================================================
// Validações do quadro de pessoal
//
// A verificação de mínimos salariais não vive no sistema: é matéria que a
// Direcção trata directamente com as pessoas, fora daqui.
// ============================================================================

function trabalhadorBase(over: Partial<Trabalhador> = {}): Trabalhador {
  return {
    id: 'x',
    codigo: 'TR-00042',
    designacao: 'Trabalhador de teste',
    tipo: 'trabalhador',
    estado: 'activo',
    dono: 'TR-00001',
    criado_em: HOJE,
    criado_por: 'TR-00001',
    alterado_em: HOJE,
    alterado_por: 'TR-00001',
    versao: 1,
    relacoes: [],
    historico: [],
    anexos: [],
    nome_completo: 'Trabalhador de teste',
    data_nascimento: '1990-05-10',
    sexo: 'M',
    nacionalidade: 'Moçambicana',
    provincia: 'Manica',
    distrito: 'Vanduzi',
    modalidade: 'permanente',
    data_inicio: '2024-01-15',
    local_trabalho: 'Farma Alcinda',
    categoria_profissional: 'Trabalhador de campo',
    remuneracao_base: q(7072, 'MT'),
    base_calculo: 'mensal',
    historico_remuneracoes: [],
    numero_dependentes: 0,
    apto_aplicar_pesticidas: false,
    certificados: [],
    numero_beneficiario_inss: '123456',
    apolice_acidentes_trabalho: 'AP-2026-001',
    ...over,
  } as Trabalhador;
}

describe('Validações do quadro de pessoal (§8.2)', () => {
  it('aceita uma ficha completa', () => {
    expect(validarTrabalhador(trabalhadorBase(), HOJE).gravavel).toBe(true);
  });

  it('não julga a remuneração', () => {
    const r = validarTrabalhador(trabalhadorBase({ remuneracao_base: q(1, 'MT') }), HOJE);
    expect(r.gravavel).toBe(true);
    expect(r.constatacoes.some((c) => c.campo === 'remuneracao_base')).toBe(false);
  });

  it('bloqueia quando a data de nascimento não está registada (V02)', () => {
    const r = validarTrabalhador(trabalhadorBase({ data_nascimento: undefined }), HOJE);
    const v02 = r.constatacoes.find((c) => c.regra === 'V02');
    expect(v02?.severidade).toBe('bloqueante');
    expect(v02?.campo).toBe('data_nascimento');
    expect(r.gravavel).toBe(false);
  });

  it('não aplica os limites de idade quando a idade é desconhecida', () => {
    const r = validarTrabalhador(
      trabalhadorBase({ data_nascimento: undefined, apto_aplicar_pesticidas: false }),
      HOJE,
    );
    // Sem idade, V03, V05 e V07 não têm sobre o que decidir: só dispara a V02.
    expect(r.constatacoes.filter((c) => ['V03', 'V05', 'V07'].includes(c.regra))).toHaveLength(0);
  });

  it('bloqueia quando a data de início não está registada (V29)', () => {
    const r = validarTrabalhador(trabalhadorBase({ data_inicio: undefined }), HOJE);
    const v29 = r.constatacoes.find((c) => c.campo === 'data_inicio');
    expect(v29?.severidade).toBe('bloqueante');
    expect(r.gravavel).toBe(false);
  });

  it('não julga a ausência de remuneração', () => {
    const r = validarTrabalhador(trabalhadorBase({ remuneracao_base: undefined }), HOJE);
    expect(r.constatacoes.some((c) => c.campo === 'remuneracao_base')).toBe(false);
  });

  it('bloqueia menor de 15 anos (V02)', () => {
    const r = validarTrabalhador(trabalhadorBase({ data_nascimento: '2013-01-01' }), HOJE);
    expect(r.constatacoes.find((c) => c.regra === 'V02')?.severidade).toBe('bloqueante');
  });

  it('bloqueia 15 a 17 anos sem autorização do representante legal (V03)', () => {
    const r = validarTrabalhador(trabalhadorBase({ data_nascimento: '2010-01-01' }), HOJE);
    expect(r.constatacoes.find((c) => c.regra === 'V03')?.severidade).toBe('bloqueante');
  });

  it('bloqueia aplicador sem certificado válido (V08)', () => {
    const r = validarTrabalhador(trabalhadorBase({ apto_aplicar_pesticidas: true }), HOJE);
    expect(r.constatacoes.find((c) => c.regra === 'V08')?.severidade).toBe('bloqueante');
  });

  it('avisa 30 dias antes de o certificado caducar (W11)', () => {
    const r = validarTrabalhador(
      trabalhadorBase({
        apto_aplicar_pesticidas: true,
        certificados: [
          { tipo: 'aplicador_pesticidas', validade: '2026-09-20' },
          { tipo: 'saude', validade: '2027-01-01' },
        ],
      }),
      HOJE,
    );
    expect(r.gravavel).toBe(true);
    expect(r.constatacoes.find((c) => c.regra === 'W11')?.severidade).toBe('aviso');
  });

  it('bloqueia trabalhador activo sem INSS passado o prazo (V29)', () => {
    const r = validarTrabalhador(trabalhadorBase({ numero_beneficiario_inss: undefined }), HOJE);
    expect(r.constatacoes.find((c) => c.regra === 'V29')?.severidade).toBe('bloqueante');
  });
});

// ============================================================================
// Curva de referência e K-PRD-03 (§17.3)
// ============================================================================

describe('Curva de referência da macadâmia (§17.3)', () => {
  it('não prevê produção antes do 5.º ano', () => {
    expect(esperadoPorIdade(4)).toBe(0);
    expect(esperadoPorIdade(5)).toBe(1);
  });

  it('mantém o patamar acima dos 15 anos', () => {
    expect(esperadoPorIdade(20)).toBe(13);
  });

  it('reproduz a realização de 24,9% do diagnóstico de partida', () => {
    // 7,0 t sobre 10 780 árvores = 0,649 kg/árvore; esperado ao ano 8 = 6 kg.
    const realizacao = kPrd03(0.649, 8);
    expect(realizacao.valor).toBeCloseTo(10.8, 1);

    // Na base do plano de negócios (só a plantação de 2018): 1,21 kg/árvore.
    expect(kPrd03(1.21, 8).valor).toBeCloseTo(20.2, 1);
  });

  it('devolve cinzento com ressalva quando a curva ainda não prevê produção', () => {
    const r = kPrd03(0.2, 3);
    expect(r.valor).toBeUndefined();
    expect(r.ressalva?.pt).toMatch(/ainda não prevê produção/);
  });

  it('K-PRD-04 é o complemento de K-PRD-03', () => {
    expect(kPrd04(24.9).valor).toBeCloseTo(75.1, 5);
    expect(kPrd04(undefined).valor).toBeUndefined();
  });
});

// ============================================================================
// Cálculo com proveniência (§5.4)
// ============================================================================

function pesagem(over: Partial<PesagemColheita> = {}): PesagemColheita {
  return {
    id: 'p',
    codigo: 'PS-20260418-001',
    designacao: 'Pesagem',
    tipo: 'pesagem_colheita',
    estado: 'concluido',
    dono: 'TR-00007',
    criado_em: HOJE,
    criado_por: 'TR-00007',
    alterado_em: HOJE,
    alterado_por: 'TR-00007',
    versao: 1,
    relacoes: [],
    historico: [],
    anexos: [],
    ciclo_cultura: 'CC-2026-MAC-FA-B01-T03',
    talhao: 'FA-B01-T03',
    data_colheita: '2026-04-18',
    hora: '11:30',
    ronda_numero: 2,
    equipa: 'EQ-01',
    n_pessoas: 8,
    quantidade_bruta: q(200, 'kg', 'NIH'),
    tara: q(13.5, 'kg', 'tara'),
    quantidade_liquida: q(186.5, 'kg', 'NIH'),
    quantidade_rejeitada: q(9.3, 'kg', 'NIH'),
    motivo_rejeicao: 'danificada_praga',
    pesador: 'TR-00021',
    conferente: 'TR-00007',
    fonte_dados: 'registo_duas_assinaturas',
    ...over,
  } as PesagemColheita;
}

describe('Cálculo de indicadores com proveniência (§5.4)', () => {
  it('K-PRD-01 devolve os registos primários que o originaram', () => {
    const r = kPrd01({ pesagens: [pesagem()], arvoresPlantadas: 100 });
    expect(r.valor).toBeCloseTo((186.5 - 9.3) / 100, 4);
    expect(r.proveniencia).toEqual(['PS-20260418-001']);
  });

  it('declara quando usa árvores plantadas em vez de produtivas', () => {
    const semInventario = kPrd01({ pesagens: [pesagem()], arvoresPlantadas: 100 });
    expect(semInventario.ressalva?.pt).toMatch(/inventário anual/);

    const comInventario = kPrd01({
      pesagens: [pesagem()],
      arvoresPlantadas: 100,
      arvoresProdutivas: 96,
    });
    expect(comInventario.ressalva).toBeUndefined();
  });

  it('devolve cinzento sem registos, em vez de zero', () => {
    const r = kPrd01({ pesagens: [], arvoresPlantadas: 100 });
    expect(r.valor).toBeUndefined();
    expect(r.ressalva?.pt).toMatch(/Sem fichas de pesagem/);
  });

  it('K-COL-04 calcula a taxa de rejeição', () => {
    expect(kCol04([pesagem()]).valor).toBeCloseTo((9.3 / 186.5) * 100, 4);
  });
});

// ============================================================================
// W03 — produtividade individual contra a mediana da equipa
// ============================================================================

describe('W03 — produtividade contra a mediana da equipa', () => {
  it('calcula a mediana', () => {
    expect(mediana([10, 20, 30])).toBe(20);
    expect(mediana([10, 20, 30, 40])).toBe(25);
    expect(mediana([])).toBeUndefined();
  });

  const jorna = (kg: number, i: number, over: Record<string, unknown> = {}) =>
    ({
      trabalhador: `TR-0004${i}`,
      data: '2026-09-01',
      equipa: 'EQ-01',
      tarefa: 'OPT-20',
      presenca: 'presente',
      producao_individual: q(kg, 'kg', 'NIH'),
      ...over,
    }) as never;

  it('assinala quem fica abaixo de 60% da mediana', () => {
    const d = desempenhoDaEquipa([30, 32, 28, 15].map((kg, i) => jorna(kg, i)));
    expect(d.filter((x) => x.abaixoLimiar).map((x) => x.trabalhador)).toEqual(['TR-00043']);
  });

  it('compara apenas dentro da mesma equipa, tarefa e unidade', () => {
    // A equipa Norte rega (m3) e a equipa Sul adubao (ha) no mesmo dia. Uma
    // mediana unica compararia metros cubicos com hectares.
    const rega = [300, 320, 280].map((v, i) =>
      jorna(v, i, { tarefa: 'OPT-15', producao_individual: q(v, 'm3') }),
    );
    const aduba = [4, 5, 6].map((v, i) =>
      jorna(v, i + 5, { equipa: 'EQ-02', tarefa: 'OPT-11', producao_individual: q(v, 'ha') }),
    );
    const d = desempenhoDaEquipa([...rega, ...aduba]);

    // Sem agrupamento, os adubadores apareceriam a ~1,6% da mediana e os
    // regadores a milhares por cento. Com agrupamento, todos ficam proximos de 100%.
    expect(d).toHaveLength(6);
    expect(d.every((x) => x.faceMediana > 0.6 && x.faceMediana < 1.6)).toBe(true);
    expect(d.filter((x) => x.abaixoLimiar)).toHaveLength(0);
    expect(new Set(d.map((x) => x.grupo)).size).toBe(2);
  });

  it('nao compara grupos com menos de tres pessoas', () => {
    expect(desempenhoDaEquipa([jorna(30, 0), jorna(5, 1)])).toHaveLength(0);
  });
});

// ============================================================================
// Pesagem — coerência e V27
// ============================================================================

describe('Ficha de pesagem F-07', () => {
  it('exige motivo para toda a rejeição (R6)', () => {
    const r = validarPesagem(pesagem({ motivo_rejeicao: undefined }), { hoje: HOJE });
    expect(r.gravavel).toBe(false);
    expect(r.constatacoes.some((c) => c.mensagem.pt.match(/rejeição tem de ser explicada/))).toBe(
      true,
    );
  });

  it('exige pesador e conferente distintos (V27)', () => {
    const r = validarPesagem(pesagem({ conferente: 'TR-00021' }), { hoje: HOJE });
    expect(r.constatacoes.find((c) => c.regra === 'V27')?.severidade).toBe('bloqueante');
  });

  it('bloqueia colheita antes do intervalo de segurança (V12)', () => {
    const r = validarPesagem(pesagem(), { hoje: HOJE, dataMinimaColheita: '2026-04-25' });
    expect(r.constatacoes.find((c) => c.regra === 'V12')?.severidade).toBe('bloqueante');
  });

  it('bloqueia data futura em registo de execução (V25)', () => {
    const r = validarPesagem(pesagem({ data_colheita: '2027-01-01' }), { hoje: HOJE });
    expect(r.constatacoes.find((c) => c.regra === 'V25')?.severidade).toBe('bloqueante');
  });

  it('avisa quando o intervalo entre rondas passa de 14 dias (W01)', () => {
    const r = validarPesagem(pesagem(), { hoje: HOJE, dataRondaAnterior: '2026-03-20' });
    expect(r.gravavel).toBe(true);
    expect(r.constatacoes.find((c) => c.regra === 'W01')?.severidade).toBe('aviso');
  });

  it('recusa relato verbal como fonte (§5.5)', () => {
    const r = validarPesagem(pesagem({ fonte_dados: 'relato_verbal' }), { hoje: HOJE });
    expect(r.gravavel).toBe(false);
  });
});

// ============================================================================
// Códigos (§6.2)
// ============================================================================

describe('Codificação (§6.2)', () => {
  it('gera códigos no formato do documento', () => {
    expect(codigo.bloco('FA', 1)).toBe('FA-B01');
    expect(codigo.talhao('FA-B01', 3)).toBe('FA-B01-T03');
    expect(codigo.arvore('FA-B01-T03', 12, 7)).toBe('FA-B01-T03-L012-P007');
    expect(codigo.trabalhador(42)).toBe('TR-00042');
    expect(codigo.ordemTrabalho(2026, 457)).toBe('OT-2026-00457');
    expect(codigo.cicloCultura(2026, 'MAC', 'FA-B01-T03')).toBe('CC-2026-MAC-FA-B01-T03');
    expect(codigo.jorna('2026-04-18', 'TR-00042')).toBe('JR-20260418-TR00042');
    expect(codigo.loteCampo('MAC', 'NIH', '2026-04-18', 'FA-B01', 7)).toBe(
      'MAC-NIH-20260418-B01-007',
    );
  });

  it('valida e rejeita códigos mal formados', () => {
    expect(codigoValido('talhao', 'FA-B01-T03')).toBe(true);
    expect(codigoValido('talhao', 'FA-B1-T3')).toBe(false);
    expect(() => exigirCodigo('trabalhador', 'TR-42')).toThrow(/Código inválido/);
  });

  it('decompõe o código para percorrer o grafo', () => {
    expect(blocoDoTalhao('FA-B01-T03')).toBe('FA-B01');
  });
});

// ============================================================================
// Imutabilidade e correcção (§24.5)
// ============================================================================

describe('Imutabilidade e correcção (§24.5)', () => {
  const autoria = { por: 'TR-00001', em: HOJE };

  const talhao = criar<ObjectoCanonico>(
    {
      codigo: 'FA-B01-T03',
      designacao: 'Talhão norte 3',
      tipo: 'talhao',
      estado: 'activo',
      dono: 'TR-00007',
      relacoes: [],
      anexos: [],
    },
    autoria,
    'id-1',
  );

  it('recusa alterar o código (R4)', () => {
    expect(() => alterar(talhao, { codigo: 'FA-B01-T09' } as never, autoria)).toThrow(
      ErroImutabilidade,
    );
  });

  it('permite renomear a designação sem quebrar o histórico', () => {
    const seguinte = alterar(talhao, { designacao: 'Talhão norte alto' }, autoria);
    expect(seguinte.codigo).toBe('FA-B01-T03');
    expect(seguinte.versao).toBe(2);
    expect(seguinte.historico).toHaveLength(1);
    expect(seguinte.historico[0]).toMatchObject({
      campo: 'designacao',
      valorAnterior: 'Talhão norte 3',
      valorNovo: 'Talhão norte alto',
    });
  });

  it('detecta conflito de versão', () => {
    expect(() =>
      alterar(talhao, { designacao: 'X' }, autoria, { versaoEsperada: 7 }),
    ).toThrow(/Conflito de versão/);
  });

  it('não apaga: anula e substitui, e ambos ficam visíveis', () => {
    const original = pesagem();
    const substituto = pesagem({ codigo: 'PS-20260418-002', quantidade_liquida: q(196.5, 'kg', 'NIH') });
    const { anulado, substituto: novo } = anularESubstituir(
      original,
      substituto,
      'Peso mal lido na balança; conferido com o talão.',
      autoria,
    );

    expect(anulado.anulado?.substituidoPor).toBe('PS-20260418-002');
    expect(anulado.historico.at(-1)?.motivo).toMatch(/mal lido/);
    expect(novo.relacoes).toContainEqual({
      tipo: 'substitui',
      destino: 'PS-20260418-001',
      destinoTipo: 'pesagem_colheita',
    });
  });

  it('exige motivo na anulação', () => {
    expect(() => anularESubstituir(pesagem(), pesagem(), '', autoria)).toThrow(ErroImutabilidade);
  });

  it('recusa alterar um registo já anulado', () => {
    const { anulado } = anularESubstituir(
      pesagem(),
      pesagem({ codigo: 'PS-20260418-002' }),
      'Correcção de peso conferida com o talão.',
      autoria,
    );
    expect(() => alterar(anulado, { notas: 'x' }, autoria)).toThrow(ErroImutabilidade);
  });
});
