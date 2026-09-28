/**
 * BASTET — dados reais do Projecto A: Farma Alcinda, Vanduzi, Manica.
 *
 * Fonte: «Resposta do gestor ao pedido», 21 de Setembro de 2026. É a primeira
 * vez que o sistema é confrontado com o que existe em vez do que foi planeado,
 * e as duas coisas não se parecem.
 *
 * O plano previa 40 a 52 permanentes e 120 sazonais em época de pico; a farma
 * tem 22 pessoas e nunca contratou um sazonal. O plano previa 107,8 ha
 * decompostos em talhões de gestão; a farma tem duas zonas com nome próprio,
 * Nhassoro e Nhangando, sem área medida e sem talhões. O diagnóstico de
 * partida do documento assentava numa produção de 7,0 t relatada pelo gestor;
 * à data desta resposta a colheita ainda não foi feita, e não existe registo
 * nenhum de produção, de venda, de armazém ou de compra.
 *
 * Esta semente regista isso, e só isso.
 *
 * Não há aqui um único talhão, uma única pesagem, uma única jorna. Seria fácil
 * gerá-los — havia-os na versão anterior — e o sistema ficaria bonito. Mas um
 * sistema de gestão que mostra números que ninguém mediu é exactamente o que o
 * §9.2 proíbe: «não pode existir indicador sem registo primário que o
 * alimente». Os indicadores ficam a cinzento porque estão a cinzento. O
 * cinzento é falha de processo, não ausência de problema (§9.3), e neste caso
 * é o retrato certo.
 *
 * O que o sistema mostra a partir daqui é o que a farma for registando.
 */

import { q, type Estado, type ObjectoCanonico } from '../dominio/canonico';
import { codigo } from '../dominio/codigos';
import type { Cultura, Variedade } from '../dominio/biologico';
import type { Equipa, Trabalhador } from '../dominio/pessoas';
import type { Bloco } from '../dominio/territorio';

import { CONTACTOS } from './contactos';
import { db, TABELAS, type Pendencia } from './db';

// ============================================================================
// Contexto da instanciação
// ============================================================================

export const UNIDADE = 'FA';
export const PROJECTO = 'PRJ-FA';
export const HOJE = '2026-09-28';
export const CAMPANHA = '2025/26';

/**
 * Quem carimba a semente. Não é o Gestor da Farma — esse não consta da lista
 * de pessoas ao serviço. É o Sr. Venâncio, capataz, que é quem chefia o
 * trabalho, faz a chamada e escreve os registos (B.4.23, B.4.25).
 */
const SISTEMA = 'TR-00001';

/** A resposta do gestor, citada como fonte de cada registo. */
const FONTE = 'Resposta do gestor, 21/09/2026';

function esqueleto(
  cod: string,
  designacao: string,
  tipo: string,
  estado: Estado,
  dono = SISTEMA,
): ObjectoCanonico {
  return {
    id: cod,
    codigo: cod,
    designacao,
    tipo,
    estado,
    dono,
    criado_em: HOJE,
    criado_por: SISTEMA,
    alterado_em: HOJE,
    alterado_por: SISTEMA,
    versao: 1,
    relacoes: [],
    historico: [],
    anexos: [],
  };
}

// ============================================================================
// Território — duas zonas, sem talhões
//
// B.2.12: «A farma tem duas (02) zonas: 1- Nhassoro & 2- Nhangando.»
//
// As áreas abaixo são as do plano de negócios, não medições. O gestor, quando
// lhe foi pedido o mapa e as áreas, respondeu «por obter com o Sr. Taedza»
// (A.2.6): o documento existe algures, mas ainda não foi obtido. Fica o número
// do plano, com a proveniência à vista e uma pendência aberta — e não como se
// alguém tivesse ido ao terreno com um GPS.
//
// Não há talhões. O §7.1 diz que «o primeiro acto do sistema é decompor estas
// duas plantações em talhões de gestão»; esse acto está por fazer, e é o
// sistema que o vai registar quando acontecer.
// ============================================================================

function construirTerritorio(): Bloco[] {
  const notaArea =
    'Área do plano de negócios, não medida no terreno. O levantamento está por obter (PEN-04).';

  return [
    {
      ...esqueleto(codigo.bloco(UNIDADE, 1), 'Nhassoro', 'bloco', 'activo'),
      tipo: 'bloco',
      estado: 'activo',
      ano_estabelecimento: 2018,
      cultura_dominante: 'MAC',
      area_total_ha: q(57.8, 'ha', 'plantada'),
      responsavel: 'TR-00001',
      notas: `${notaArea} Zona 1 das duas que a farma reconhece (${FONTE}, B.2.12).`,
    } as Bloco,
    {
      ...esqueleto(codigo.bloco(UNIDADE, 2), 'Nhangando', 'bloco', 'activo'),
      tipo: 'bloco',
      estado: 'activo',
      ano_estabelecimento: 2020,
      cultura_dominante: 'MAC',
      area_total_ha: q(50.0, 'ha', 'plantada'),
      responsavel: 'TR-00001',
      notas: `${notaArea} Zona 2 das duas que a farma reconhece (${FONTE}, B.2.12).`,
    } as Bloco,
  ];
}

// ============================================================================
// Catálogo biológico
//
// Catálogo de referência, não inventário: registar a cultura não afirma que
// está plantada — quem o afirma é o ciclo de cultura, e não há nenhum. Só a
// macadâmia está confirmada no terreno.
// ============================================================================

function construirBiologico() {
  const culturas: Cultura[] = (
    [
      ['MAC', 'Macadâmia', 'Macadamia integrifolia', 'perene', 'fruta_horticolas', 'NIS'],
      ['MOR', 'Moringa', 'Moringa oleifera', 'perene', 'fruta_horticolas', 'POF'],
      ['MIL', 'Milho', 'Zea mays', 'anual', 'culturas_combinaveis', 'GRA'],
      ['GER', 'Gergelim', 'Sesamum indicum', 'anual', 'culturas_combinaveis', 'SEM'],
      ['FEV', 'Feijão vulgar', 'Phaseolus vulgaris', 'anual', 'culturas_combinaveis', 'GRA'],
      ['BAT', 'Batata reno', 'Solanum tuberosum', 'anual', 'fruta_horticolas', 'GRA'],
      ['TOM', 'Tomate', 'Solanum lycopersicum', 'anual', 'fruta_horticolas', 'GRA'],
    ] as const
  ).map(
    ([abrev, comum, botanico, ciclo, ambito, forma]) =>
      ({
        ...esqueleto(codigo.cultura(abrev), comum, 'cultura', 'em_vigor'),
        tipo: 'cultura',
        abreviatura: abrev,
        nome_comum: comum,
        nome_botanico: botanico,
        ciclo,
        ambito_certificacao: ambito,
        unidade_produto_principal: forma,
        notas:
          abrev === 'MAC'
            ? 'Única cultura confirmada no terreno. As restantes são do plano de negócios.'
            : 'Do plano de negócios. Sem ciclo de cultura instalado.',
      }) as Cultura,
  );

  const variedades: Variedade[] = (
    [
      ['MAC', 'A4', 'Macadâmia A4', 'enxertado', 3.5, true],
      ['MAC', 'BEA', 'Macadâmia Beaumont', 'enxertado', 3.5, false],
    ] as const
  ).map(
    ([cul, sufixo, nome, origem, entrada, queda]) =>
      ({
        ...esqueleto(codigo.variedade(cul, sufixo), nome, 'variedade', 'em_vigor'),
        tipo: 'variedade',
        cultura: codigo.cultura(cul),
        origem_material: origem,
        entrada_producao_anos: entrada,
        queda_espontanea: queda,
        observacoes_maneio: queda
          ? undefined
          : 'A Beaumont não larga a noz espontaneamente: exige derrube dirigido, e a apanha do solo subestima a produção.',
        notas: 'Catálogo de referência. Qual das duas está em cada zona é dado por apurar.',
      }) as Variedade,
  );

  return { culturas, variedades };
}

// ============================================================================
// Pessoas — as 22 que existem
//
// B.1.1: «Vinte e duas pessoas (22), sendo 17 Homens e 5 Mulheres.»
// B.1.2: «De momento não há nenhum sazonal, os 22 são permanentes.»
//
// A lista é transcrita do registo do gestor, com a grafia que ele usa. Os
// nomes não se corrigem: são dados, e um nome corrigido por palpite é um nome
// errado. Os contactos não estão aqui — vivem fora do repositório, em
// `contactos.local.ts`, porque o sistema funciona sem eles e as pessoas não
// escolheram estar num repositório (ver `contactos.ts`). O que falta — data de nascimento, data de início, nacionalidade,
// remuneração, INSS, seguro — falta mesmo, e fica em branco para as validações
// o apanharem.
// ============================================================================

interface DefPessoa {
  nome: string;
  funcao: string;
  /** Idade declarada pelo gestor. Só uma pessoa a tem. */
  idade?: number;
  sexo: 'M' | 'F';
}

const PESSOAS: DefPessoa[] = [
  { nome: 'Venancio Vasco Mudzia', funcao: 'Capataz', sexo: 'M' },
  { nome: 'Mesa Damasio Simon', funcao: 'Tractorista', sexo: 'M' },
  { nome: 'Chepad Zacarias Jecinao', funcao: 'Camponês', sexo: 'M' },
  { nome: 'Michequi Izaque Calcao', funcao: 'Camponês', sexo: 'M' },
  { nome: 'Neto Tome Tomuceni', funcao: 'Camponês', sexo: 'M' },
  { nome: 'Michequi Manuel Michequi', funcao: 'Camponês', sexo: 'M' },
  { nome: 'Pita Fiel Blaunde', funcao: 'Camponês', sexo: 'M' },
  { nome: 'Izaquiel Ndirequereni Nota', funcao: 'Camponês', sexo: 'M' },
  { nome: 'Filomena Djoni Miquitai', funcao: 'Camponês', sexo: 'F' },
  { nome: 'Lourenco Mario Marques', funcao: 'Camponês', sexo: 'M' },
  { nome: 'Titoce Filipe Mapossa', funcao: 'Camponês', sexo: 'M' },
  { nome: 'Tome Feliz Tome', funcao: 'Camponês', idade: 26, sexo: 'M' },
  { nome: 'Vasco Benjamim Vasco', funcao: 'Camponês', sexo: 'M' },
  { nome: 'Joao Manuel Marceta', funcao: 'Camponês', sexo: 'M' },
  { nome: 'Anastancia Inacio Fernando', funcao: 'Camponês', sexo: 'F' },
  { nome: 'Maria Joaquim Braitoni', funcao: 'Camponês', sexo: 'F' },
  { nome: 'Rosita Pita Sarire', funcao: 'Camponês', sexo: 'F' },
  { nome: 'Isabel Ramosse Cleva', funcao: 'Camponês', sexo: 'F' },
  { nome: 'Miguel Borge Do Luis', funcao: 'Camponês', sexo: 'M' },
  { nome: 'Tawanda Amisse Magonhe', funcao: 'Camponês', sexo: 'M' },
  { nome: 'Feliz Tome Tomuceni', funcao: 'Guarda', sexo: 'M' },
  { nome: 'Amade Armando Manguenda', funcao: 'Guarda', sexo: 'M' },
];

function construirPessoas() {
  const trabalhadores: Trabalhador[] = PESSOAS.map((p, i) => {
    const n = i + 1;
    const cod = codigo.trabalhador(n);

    // A idade declarada dá o ano, não o dia. Guardar «1 de Janeiro» seria
    // inventar um dia para satisfazer o formato; sem dia, não há data.
    const anoNascimento =
      p.idade === undefined ? undefined : Number(HOJE.slice(0, 4)) - p.idade;

    return {
      ...esqueleto(cod, p.nome, 'trabalhador', 'activo'),
      tipo: 'trabalhador',
      estado: 'activo',
      nome_completo: p.nome,
      data_nascimento: undefined,
      sexo: p.sexo,
      nacionalidade: undefined,
      provincia: 'Manica',
      distrito: 'Vanduzi',
      // Fora do repositório: vem de `contactos.local.ts` quando existe.
      telefone: CONTACTOS[cod] ? `+258 ${CONTACTOS[cod]}` : undefined,
      modalidade: 'permanente',
      data_inicio: undefined,
      local_trabalho: 'Farma Alcinda, Vanduzi',
      categoria_profissional: p.funcao,
      remuneracao_base: undefined,
      base_calculo: undefined,
      historico_remuneracoes: [],
      numero_dependentes: undefined,
      // A.1.4 e A.1.5: não existe registo de formação nem de entrega de EPI.
      // Ninguém tem certificado de aplicador, logo ninguém aplica fitofármacos.
      apto_aplicar_pesticidas: false,
      certificados: [],
      numero_beneficiario_inss: undefined,
      apolice_acidentes_trabalho: undefined,
      equipa: p.funcao === 'Guarda' ? undefined : 'EQ-FA-01',
      chefe_directo: n === 1 ? undefined : 'TR-00001',
      notas:
        anoNascimento !== undefined
          ? `Idade declarada de ${p.idade} anos em ${FONTE} — nascido por volta de ${anoNascimento}. A data exacta está por registar.`
          : undefined,
    } as Trabalhador;
  });

  /**
   * B.1.4: «Não existem equipas como tal, trabalha-se como um todo, apenas
   * divididos por faixas e metas. Chefiados pelo Sr. Venâncio.»
   *
   * Uma frente só, e não duas equipas por bloco como o plano supunha. Os
   * guardas ficam de fora: fazem turnos de uma semana sim, uma semana não
   * (B.1.7), que é outro regime.
   */
  const equipas: Equipa[] = [
    {
      ...esqueleto('EQ-FA-01', 'Frente única', 'equipa', 'activo'),
      tipo: 'equipa',
      chefe_turma: 'TR-00001',
      membros: trabalhadores.filter((t) => t.equipa === 'EQ-FA-01').map((t) => t.codigo),
      notas:
        'Não é uma equipa no sentido do documento: é toda a gente de campo a trabalhar como um todo, dividida por faixas e metas do dia. Sem bloco habitual atribuído.',
    } as Equipa,
  ];

  return { trabalhadores, equipas };
}

// ============================================================================
// Pendências — o que a resposta do gestor deixou por resolver
//
// Nenhuma destas é uma nota de rodapé. Enquanto estiverem abertas, os números
// que delas dependem transportam uma ressalva onde quer que apareçam.
// ============================================================================

const PENDENCIAS: Pendencia[] = [
  {
    id: 'PEN-01',
    codigo: 'PEN-01',
    titulo: {
      pt: 'Quadro de pessoal: 22 contra as 40, 41 ou 52 do plano',
      en: 'Headcount: 22 against the plan’s 40, 41 or 52',
      zh: '编制：实有 22 人，计划为 40、41 或 52 人',
    },
    descricao: {
      pt: 'O gestor confirma 22 pessoas ao serviço, 17 homens e 5 mulheres. O mapa de custos do plano orçamenta 40 e totaliza 5 028 000,00 MT/ano; o texto do mesmo plano refere 52 permanentes; o quadro do §3.2 soma 41. Nenhuma das três leituras descreve a farma. O orçamento de mão-de-obra e toda a projecção que dele dependa estão por refazer.',
      en: 'The manager confirms 22 people on the payroll, 17 men and 5 women. The plan’s cost sheet budgets for 40 and totals 5,028,000.00 MT/year; the text of the same plan states 52 permanent staff; the table in §3.2 adds up to 41. None of the three readings describes the farm. The labour budget and every projection resting on it are to be redone.',
      zh: '经理确认在职 22 人，其中男 17 人、女 5 人。计划的成本表按 40 人编列，合计每年 5,028,000.00 MT；同一份计划的正文称有 52 名长期员工；§3.2 的表格合计 41 人。三种口径没有一种符合实际。用工预算以及据此作出的全部测算均需重做。',
    },
    categoria: 'quadro_pessoal',
    seccao: 'Gestor B.1.1 · §3.2',
    estado: 'por_resolver',
    dono: 'TR-00001',
  },
  {
    id: 'PEN-02',
    codigo: 'PEN-02',
    titulo: {
      pt: 'Nenhum sazonal, contra os 120 previstos',
      en: 'No seasonal workers, against the 120 planned',
      zh: '无季节工，计划为 120 人',
    },
    descricao: {
      pt: 'O plano previa 120 sazonais em época de pico e deixava por decidir se eram trabalhadores ou pequenos agricultores associados. A questão não se põe: não há nenhum, e a farma não tem aumentado pessoal mesmo no pico, que é o período chuvoso de Novembro a Março. Ou o pico é absorvido pelas 22 pessoas com horas a mais, ou o plano de colheita não é executável como está.',
      en: 'The plan foresaw 120 seasonal workers at peak and left open whether they were employees or associated smallholders. The question does not arise: there are none, and the farm does not add staff even at peak, which is the rainy season from November to March. Either the peak is absorbed by the 22 working longer hours, or the harvest plan is not executable as written.',
      zh: '计划预计高峰期用 120 名季节工，并未确定其身份是雇员还是合作小农。此问题已不复存在：目前一名季节工也没有，且即便在 11 月至 3 月雨季高峰期farm也未增加人手。要么由这 22 人加班消化高峰，要么现行采收计划根本无法执行。',
    },
    categoria: 'quadro_pessoal',
    seccao: 'Gestor B.1.2 · B.1.3',
    estado: 'por_resolver',
    dono: 'TR-00001',
  },
  {
    id: 'PEN-03',
    codigo: 'PEN-03',
    titulo: {
      pt: 'Idades e datas de início por registar em 21 das 22 pessoas',
      en: 'Ages and start dates missing for 21 of the 22',
      zh: '22 人中 21 人的年龄与入职日期缺失',
    },
    descricao: {
      pt: 'A lista do gestor traz nome, função, contacto e sexo. Traz a idade de uma pessoa só, e de nenhuma a data de nascimento, a data de início de contrato, o número de beneficiário do INSS ou a apólice de acidentes de trabalho. Sem data de nascimento não se prova a idade legal; sem data de início não há prazo de inscrição no INSS para contar. São 22 fichas bloqueadas até alguém ir ao papel buscar os dados.',
      en: 'The manager’s list gives name, role, contact and sex. It gives the age of one person, and for nobody a date of birth, a contract start date, an INSS beneficiary number or an accident insurance policy. Without a date of birth legal age cannot be proven; without a start date there is no INSS registration deadline to count. That is 22 records blocked until someone goes to the paperwork for the data.',
      zh: '经理提供的名册含姓名、岗位、联系方式与性别，仅有一人标注年龄，且无一人有出生日期、合同起始日期、社保参保编号或工伤保险保单。没有出生日期便无法证明法定年龄；没有起始日期便无从起算社保参保期限。在有人从纸质档案中补齐之前，22 份人员档案均处于阻断状态。',
    },
    categoria: 'quadro_pessoal',
    seccao: 'Gestor A.1.1 · §8.2 V02, V29',
    estado: 'por_resolver',
    dono: 'TR-00001',
  },
  {
    id: 'PEN-04',
    codigo: 'PEN-04',
    titulo: {
      pt: 'Áreas por medir: 107,8 ha é número de plano',
      en: 'Areas unmeasured: 107.8 ha is a planning figure',
      zh: '面积未实测：107.8 公顷为计划数字',
    },
    descricao: {
      pt: 'Pedido o mapa e as áreas, o gestor respondeu «por obter com o Sr. Taedza». O levantamento existe algures mas não chegou. Os 57,8 ha de Nhassoro e os 50,0 ha de Nhangando vêm do plano de negócios, não do terreno. Todo o rendimento por hectare que o sistema calcular assenta neste número até haver medição.',
      en: 'Asked for the map and the areas, the manager answered «to be obtained from Mr Taedza». The survey exists somewhere but has not arrived. The 57.8 ha of Nhassoro and the 50.0 ha of Nhangando come from the business plan, not from the ground. Every yield-per-hectare the system computes rests on that figure until there is a measurement.',
      zh: '在被问及地图与面积时，经理答复「需向 Taedza 先生索取」。测绘资料存在，但尚未到手。Nhassoro 的 57.8 公顷与 Nhangando 的 50.0 公顷均出自商业计划，而非实地测量。在完成实测之前，系统计算的所有单位面积产量都建立在这个数字之上。',
    },
    categoria: 'area_plantada',
    seccao: 'Gestor A.2.6 · B.2.12',
    estado: 'por_resolver',
    dono: 'TR-00001',
  },
  {
    id: 'PEN-05',
    codigo: 'PEN-05',
    titulo: {
      pt: 'Talhões por decompor: existem duas zonas, não onze talhões',
      en: 'Plots not yet defined: there are two zones, not eleven plots',
      zh: '地块尚未划分：现有两个区，而非十一个地块',
    },
    descricao: {
      pt: 'O §7.1 diz que o primeiro acto do sistema é decompor as plantações em talhões de gestão de dimensão máxima recomendada de 10 ha. A farma reconhece duas zonas — Nhassoro e Nhangando — e trabalha-as por faixas definidas no dia. Sem talhões, a pergunta «onde é que se perde produção» não tem sujeito: não há unidade a que comparar outra.',
      en: 'Section 7.1 says the system’s first act is to break the plantings into management plots of at most 10 ha. The farm recognises two zones — Nhassoro and Nhangando — and works them in strips set on the day. Without plots, the question «where is production being lost» has no subject: there is no unit to compare against another.',
      zh: '§7.1 规定，系统的第一项工作是把种植区划分为不超过 10 公顷的管理地块。农场只认两个区——Nhassoro 与 Nhangando——并按当日划定的作业带施工。没有地块，「产量损失在哪里」这个问题就没有主语：没有可供相互比较的单元。',
    },
    categoria: 'area_plantada',
    seccao: 'Gestor B.2.12 · §7.1',
    estado: 'por_resolver',
    dono: 'TR-00001',
  },
  {
    id: 'PEN-06',
    codigo: 'PEN-06',
    titulo: {
      pt: 'Árvores por contar',
      en: 'Trees not counted',
      zh: '树木尚未清点',
    },
    descricao: {
      pt: 'Perguntado quantas árvores tem a farma, o gestor respondeu «por contar». O plano fala de 10 780 árvores a 10 × 10 m; ninguém as contou. O K-PRD-01 é o rendimento por árvore e é o indicador primário desta cultura, porque a densidade baixa torna o rendimento por hectare enganador. Sem contagem, o denominador do indicador primário não existe.',
      en: 'Asked how many trees the farm has, the manager answered «to be counted». The plan speaks of 10,780 trees at 10 × 10 m; nobody has counted them. K-PRD-01 is yield per tree and is the primary indicator for this crop, because the low density makes yield per hectare misleading. Without a count, the denominator of the primary indicator does not exist.',
      zh: '在被问及农场有多少株树时，经理答复「尚待清点」。计划称按 10 × 10 米株行距种有 10,780 株；但无人清点过。K-PRD-01 为单株产量，是该作物的主指标——因为密度偏低会使单位面积产量产生误导。没有清点，主指标的分母便不存在。',
    },
    categoria: 'meta_tecnica',
    seccao: 'Gestor B.2.13 · §10.1',
    estado: 'por_resolver',
    dono: 'TR-00001',
  },
  {
    id: 'PEN-07',
    codigo: 'PEN-07',
    titulo: {
      pt: 'Não há balança: a colheita é estimada por carroçada',
      en: 'No scale: the harvest is estimated by truckload',
      zh: '没有磅秤：采收量按车斗估算',
    },
    descricao: {
      pt: 'Não existe balança na farma. No momento da colheita usa-se uma carroceria de três toneladas para estimar o que se apanhou no dia. Uma carroçada não é uma medição: é uma estimativa técnica, admissível em planeamento e inadmissível em indicador de resultado (§5.5). O F-07 pede peso bruto, tara e líquido, e nenhum dos três é obtenível hoje. Enquanto não houver balança, a produção da Farma Alcinda não é um número auditável.',
      en: 'There is no scale on the farm. At harvest a three-tonne truck body is used to estimate what was picked that day. A truckload is not a measurement: it is a technical estimate, admissible in planning and inadmissible in a result indicator (§5.5). Form F-07 asks for gross, tare and net weight, and none of the three can be obtained today. Until there is a scale, Farma Alcinda’s output is not an auditable number.',
      zh: '农场没有磅秤。采收时用一个三吨车斗估算当日采收量。一车不是计量，而是技术估算——可用于计划，不得用于结果指标（§5.5）。F-07 表要求填写毛重、皮重与净重，而这三项今天都无法取得。在配备磅秤之前，Farma Alcinda 的产量不是一个可审计的数字。',
    },
    categoria: 'meios',
    seccao: 'Gestor B.2.17 · B.3.18 · §5.5',
    estado: 'por_resolver',
    dono: 'TR-00001',
  },
  {
    id: 'PEN-08',
    codigo: 'PEN-08',
    titulo: {
      pt: 'Sem energia eléctrica, gerador ou painel solar',
      en: 'No mains power, generator or solar panel',
      zh: '无市电、发电机或太阳能板',
    },
    descricao: {
      pt: 'A farma não tem energia. Há rede móvel das três operadoras, com quebras ocasionais mas normalmente estável. Isto decide a arquitectura do sistema: o que correr no campo corre em bateria de telemóvel e sincroniza quando houver sinal. Um posto de trabalho fixo no campo está fora de questão até haver como o alimentar.',
      en: 'The farm has no power. There is mobile coverage from all three operators, with occasional drops but normally stable. This decides the system’s architecture: whatever runs in the field runs on a phone battery and syncs when there is signal. A fixed workstation in the field is out of the question until there is a way to power it.',
      zh: '农场没有电力供应。三家运营商的移动网络均有覆盖，偶有中断但总体稳定。这决定了系统架构：田间运行的一切都靠手机电池，有信号时再同步。在解决供电之前，田间设置固定工作站无从谈起。',
    },
    categoria: 'meios',
    seccao: 'Gestor B.3.19 · B.3.20',
    estado: 'por_resolver',
    dono: 'TR-00001',
  },
  {
    id: 'PEN-09',
    codigo: 'PEN-09',
    titulo: {
      pt: 'Um telemóvel com aplicação, em 22 pessoas',
      en: 'One smartphone among 22 people',
      zh: '22 人中仅一部智能手机',
    },
    descricao: {
      pt: 'Uma pessoa tem telemóvel com aplicação, e não há computador na farma. O sistema que o documento desenha pressupõe o chefe de turma a preencher o F-05 no fim de cada dia. Hoje há um aparelho capaz de o fazer e é preciso decidir de quem é, quem o usa e o que acontece quando essa pessoa falta.',
      en: 'One person has a smartphone with apps, and there is no computer on the farm. The system the document describes assumes the shift leader fills in F-05 at the end of each day. Today there is one device capable of it, and it must be decided whose it is, who uses it, and what happens when that person is away.',
      zh: '仅有一人拥有可装应用的手机，农场也没有电脑。文件所设计的系统假定班组长在每日收工时填写 F-05。目前只有一台设备能做到这件事，必须确定它归谁、由谁使用，以及该人缺勤时如何处理。',
    },
    categoria: 'meios',
    seccao: 'Gestor B.1.11 · B.3.21',
    estado: 'por_resolver',
    dono: 'TR-00001',
  },
  {
    id: 'PEN-10',
    codigo: 'PEN-10',
    titulo: {
      pt: 'Quatro das 22 pessoas não lêem nem escrevem',
      en: 'Four of the 22 cannot read or write',
      zh: '22 人中有 4 人不识字',
    },
    descricao: {
      pt: 'Dezoito das 22 pessoas sabem ler e escrever. As outras quatro não assinam um registo nem lêem uma instrução escrita. O §7.3 E-11 exige assinatura do executante e do responsável para fechar uma operação, e o §25 manda substituir texto livre por listas. Para quatro pessoas isso ainda não chega: ou o registo é feito por quem sabe escrever e assinado por impressão digital, ou há quatro pessoas cujo trabalho o sistema não consegue atribuir.',
      en: 'Eighteen of the 22 can read and write. The other four sign no record and read no written instruction. Section 7.3 E-11 requires the executor’s and the supervisor’s signature to close an operation, and §25 says replace free text with lists. For four people that is still not enough: either the record is made by someone who can write and signed by fingerprint, or there are four people whose work the system cannot attribute.',
      zh: '22 人中有 18 人识字。另外 4 人既不能在记录上签字，也读不懂书面指令。§7.3 E-11 要求作业结案须有执行人与负责人签字，§25 要求以选项列表取代自由文本。对这 4 人而言这仍然不够：要么由识字者代为记录并以指纹签署，要么就有 4 个人的劳动系统无法归属。',
    },
    categoria: 'meios',
    seccao: 'Gestor B.1.10 · §25',
    estado: 'por_resolver',
    dono: 'TR-00001',
  },
  {
    id: 'PEN-11',
    codigo: 'PEN-11',
    titulo: {
      pt: 'Registo semanal em caderno, por uma pessoa',
      en: 'Weekly records in a notebook, by one person',
      zh: '每周由一人记入笔记本',
    },
    descricao: {
      pt: 'A presença é marcada num caderno pelo Sr. Venâncio, na chamada entre as 06:30 e as 07:00. Os registos são escritos por ele, uma vez por semana, geralmente ao sábado, e os papéis ficam no estaleiro. O sistema é desenhado para registo diário: o critério de saída da Fase 1 é 90% de cumprimento de registo durante quatro semanas. Passar de semanal para diário é a mudança de hábito que o projecto tem de conseguir, e depende de uma pessoa só.',
      en: 'Attendance is marked in a notebook by Mr Venâncio, at the roll call between 06:30 and 07:00. The records are written by him, once a week, usually on Saturday, and the papers stay in the yard. The system is designed for daily recording: the Phase 1 exit criterion is 90% record compliance over four weeks. Going from weekly to daily is the change of habit the project has to achieve, and it rests on one person.',
      zh: '出勤由 Venâncio 先生在 6:30 至 7:00 的点名时记入笔记本。记录也由他书写，每周一次，通常在星期六，纸质材料存放在工棚。系统按每日记录设计：第一阶段的验收标准是连续四周达到 90% 的记录完成率。从每周改为每日，是本项目必须达成的习惯改变，而这取决于一个人。',
    },
    categoria: 'outro',
    seccao: 'Gestor B.1.8 · B.1.9 · B.4.22 a B.4.25',
    estado: 'por_resolver',
    dono: 'TR-00001',
  },
  {
    id: 'PEN-12',
    codigo: 'PEN-12',
    titulo: {
      pt: 'A unidade de trabalho da farma é a linha, não o hectare',
      en: 'The farm’s unit of work is the row, not the hectare',
      zh: '农场的作业单位是行，不是公顷',
    },
    descricao: {
      pt: 'As metas do dia são dadas em linhas, variando com a época e a tarefa. O trabalho corrente é limpeza e cuidado da plantação: slachar ou bembar, controlo do capim, manutenção das bacias das plantas. O catálogo de operações do sistema mede em hectares, quilogramas e horas-máquina. Se o sistema pedir hectares a quem trabalha em linhas, obtém números convertidos de cabeça — e a conversão depende da área do talhão, que também ninguém mediu.',
      en: 'The day’s targets are given in rows, varying with the season and the task. The routine work is clearing and tending the planting: slashing or hoeing, grass control, maintaining the basins around the plants. The system’s operation catalogue measures in hectares, kilograms and machine-hours. If the system asks for hectares from people who work in rows, it gets figures converted in someone’s head — and the conversion depends on the plot area, which nobody has measured either.',
      zh: '当日目标以「行」下达，随季节与任务而变。日常作业是清园与养护：割草或锄草、控制杂草、维护树盘。而系统的作业目录以公顷、公斤和机时计量。若系统向按行作业的人索要公顷数，得到的将是心算换算出来的数字——而换算又取决于同样无人实测的地块面积。',
    },
    categoria: 'meta_tecnica',
    seccao: 'Gestor B.2.14 · B.2.15 · §5.3',
    estado: 'por_resolver',
    dono: 'TR-00001',
  },
];

// ============================================================================
// Semeadura
// ============================================================================

/**
 * Identidade desta semente. Quando muda, a base local é refeita.
 *
 * Isto não contradiz o §24.5 — o que se apaga é a semente, não registos de
 * exploração. Num servidor a semente corre uma vez e nunca mais.
 */
export const SEMENTE_VERSAO = '2026-09-28-dados-do-gestor';

export async function semearSeVazio(): Promise<boolean> {
  const marca = localStorage.getItem('bastet:semente');
  const jaTem = await db.trabalhadores.count();

  if (jaTem > 0 && marca === SEMENTE_VERSAO) return false;
  if (jaTem > 0) await Promise.all(TABELAS.map((nome) => db[nome].clear()));

  await semear();
  localStorage.setItem('bastet:semente', SEMENTE_VERSAO);
  return true;
}

export async function semear(): Promise<void> {
  const blocos = construirTerritorio();
  const { culturas, variedades } = construirBiologico();
  const { trabalhadores, equipas } = construirPessoas();

  await db.transaction(
    'rw',
    [db.blocos, db.culturas, db.variedades, db.trabalhadores, db.equipas, db.pendencias],
    async () => {
      await db.blocos.bulkPut(blocos);
      await db.culturas.bulkPut(culturas);
      await db.variedades.bulkPut(variedades);
      await db.trabalhadores.bulkPut(trabalhadores);
      await db.equipas.bulkPut(equipas);
      await db.pendencias.bulkPut(PENDENCIAS);
    },
  );
}

/** Repõe a semente. Usado no ecrã de diagnóstico, nunca em produção. */
export async function ressemear(): Promise<void> {
  await Promise.all(TABELAS.map((nome) => db[nome].clear()));
  await semear();
}
