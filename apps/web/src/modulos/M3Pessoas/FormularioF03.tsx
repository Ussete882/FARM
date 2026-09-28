/**
 * F-03 — Ficha de trabalhador (admissão).
 *
 * As validações do §8 correm a cada tecla, e uma admissão que as viole não
 * grava: idade mínima, autorização de representante legal, certificados de
 * aplicador, inscrição no INSS e limites de contrato a prazo.
 *
 * A remuneração é registada como dado de gestão — alimenta o custo de
 * mão-de-obra —, sem verificação de mínimos: essa é matéria que a Direcção
 * trata directamente com as pessoas, fora do sistema.
 */

import React from 'react';

import { useTrabalhadores } from '../../dados/consultas';
import { gravarTrabalhador, proximoSequencial } from '../../dados/escrever';
import { HOJE } from '../../dados/semente';
import { q } from '@bastet/nucleo/canonico';
import { codigo } from '@bastet/nucleo/codigos';
import {
  BASES_CALCULO,
  categoria,
  MODALIDADES,
  ROTULO_BASE_CALCULO,
  ROTULO_MODALIDADE,
  idade,
  type BaseCalculo,
  type Modalidade,
  type Trabalhador,
} from '@bastet/nucleo/pessoas';
import { useT } from '../../i18n/contexto';
import { UI } from '../../i18n/comuns';
import { validarTrabalhador } from '@bastet/nucleo/validacao';
import {
  Campo,
  Formulario,
  Grelha,
  Numero,
  Pastilhas,
  Seleccao,
} from '../../design/Formulario';

/**
 * As categorias de admissão, na ordem em que a farma admite. A tradução vive
 * em `ROTULO_CATEGORIA`, no domínio, e não repetida aqui.
 */
const CATEGORIAS = [
  'Trabalhador de campo',
  'Chefe de turma de campo',
  'Técnico encarregado de campo',
  'Tractorista',
  'Operador de implementos',
  'Técnico de laboratório',
  'Guarda',
  'Apoio geral',
  'Agrónomo responsável',
];

export function FormularioF03({ aoFechar }: { aoFechar: () => void }) {
  const tr = useT();
  const trabalhadores = useTrabalhadores();

  const [nome, setNome] = React.useState('');
  const [nascimento, setNascimento] = React.useState('1995-01-15');
  const [sexo, setSexo] = React.useState<'M' | 'F'>('M');
  const [cargo, setCargo] = React.useState(CATEGORIAS[0]);
  const [modalidade, setModalidade] = React.useState<Modalidade>('permanente');
  const [baseCalculo, setBaseCalculo] = React.useState<BaseCalculo>('mensal');
  const [remuneracao, setRemuneracao] = React.useState<number | ''>('');
  const [inss, setInss] = React.useState('');
  const [apolice, setApolice] = React.useState('AP-2026-0417');
  const [nuit, setNuit] = React.useState('');
  const [dataInicio, setDataInicio] = React.useState(HOJE);
  const [aplicador, setAplicador] = React.useState(false);
  const [gravado, setGravado] = React.useState<string | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);

  const remuneracaoN = remuneracao === '' ? 0 : Number(remuneracao);

  const sequencia = proximoSequencial(
    trabalhadores.map((t) => t.codigo),
    'TR-',
  );
  const cod = codigo.trabalhador(sequencia);
  const anos = idade({ data_nascimento: nascimento }, HOJE);

  const rascunho = React.useMemo(
    () =>
      ({
        id: cod,
        codigo: cod,
        designacao:
          nome || tr({ pt: 'Novo trabalhador', en: 'New worker', zh: '新录工人' }),
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
        nome_completo: nome,
        data_nascimento: nascimento,
        sexo,
        nacionalidade: 'Moçambicana',
        naturalidade: 'Manica',
        nuit: nuit || undefined,
        numero_beneficiario_inss: inss || undefined,
        data_inscricao_inss: inss ? dataInicio : undefined,
        apolice_acidentes_trabalho: apolice || undefined,
        provincia: 'Manica',
        distrito: 'Vanduzi',
        localidade: 'Vanduzi-sede',
        modalidade,
        data_inicio: dataInicio,
        local_trabalho: 'Farma Alcinda, Vanduzi',
        categoria_profissional: cargo,
        remuneracao_base: q(remuneracaoN, 'MT'),
        base_calculo: baseCalculo,
        historico_remuneracoes: [{ valor: q(remuneracaoN, 'MT'), data_efeito: dataInicio }],
        numero_dependentes: 0,
        apto_aplicar_pesticidas: aplicador,
        certificados: [],
      }) as Trabalhador,
    [
      cod,
      nome,
      nascimento,
      sexo,
      nuit,
      inss,
      apolice,
      modalidade,
      dataInicio,
      cargo,
      remuneracaoN,
      baseCalculo,
      aplicador,
    ],
  );

  const validacao = React.useMemo(() => {
    const r = validarTrabalhador(rascunho, HOJE);
    // O nome não tem regra no §8, mas uma ficha sem nome não identifica
    // ninguém — e a identificação é a primeira obrigação legal do E-17.
    if (!nome.trim()) {
      return {
        ...r,
        gravavel: false,
        constatacoes: [
          {
            regra: 'E-17',
            severidade: 'bloqueante' as const,
            campo: 'nome_completo',
            mensagem: {
              pt: 'A ficha precisa do nome completo. É o primeiro campo obrigatório por lei.',
              en: 'The sheet needs the full name. It is the first field the law requires.',
              zh: '表单需要完整姓名。这是法律要求的第一个必填项。',
            },
            fundamento: {
              pt: '§7.4 E-17 — bloco de identificação [L]',
              en: '§7.4 E-17 — identification block [L]',
              zh: '§7.4 E-17 — 身份信息块 [L]',
            },
          },
          ...r.constatacoes,
        ],
      };
    }
    return r;
  }, [rascunho, nome]);

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
      const guardado = await gravarTrabalhador(resto);
      setGravado(guardado.codigo);
    } catch (e) {
      setErro(
        e instanceof Error
          ? `${tr({ pt: 'A admissão não foi gravada', en: 'The admission was not saved', zh: '录用未保存' })}: ${e.message}`
          : tr({
              pt: 'A admissão não foi gravada por um erro inesperado.',
              en: 'The admission was not saved due to an unexpected error.',
              zh: '因意外错误，录用未保存。',
            }),
      );
    }
  };

  return (
    <Formulario
      titulo={tr({ pt: 'Admitir trabalhador', en: 'Admit a worker', zh: '录用工人' })}
      formulario="F-03"
      codigo={cod}
      validacao={validacao}
      aoGravar={gravar}
      aoFechar={aoFechar}
      gravado={gravado}
      erro={erro}
      // A admissão faz-se nos Recursos Humanos, não no fim de um turno.
      limiteSegundos={0}
    >
      <Grelha>
        <Campo rotulo={tr({ pt: 'Nome completo', en: 'Full name', zh: '姓名' })} largo>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder={tr({
              pt: 'Como consta no documento de identificação',
              en: 'As it appears on the identity document',
              zh: '与身份证件一致',
            })}
            className="h-10 w-full rounded-xl bg-bloco px-3.5 text-[13px] text-texto outline-none focus:bg-bloco-2"
          />
        </Campo>

        <Campo
          rotulo={tr({
            pt: 'Data de nascimento',
            en: 'Date of birth',
            zh: '出生日期',
          })}
          nota={tr({
            pt: `${anos} anos à data de hoje.`,
            en: `${anos} years old today.`,
            zh: `截至今日 ${anos} 岁。`,
          })}
        >
          <input
            type="date"
            value={nascimento}
            onChange={(e) => setNascimento(e.target.value)}
            className="num h-10 w-full rounded-xl bg-bloco px-3.5 text-[13px] text-texto outline-none focus:bg-bloco-2"
          />
        </Campo>

        <Campo rotulo={tr({ pt: 'Sexo', en: 'Sex', zh: '性别' })}>
          <Pastilhas
            opcoes={['M', 'F'] as const}
            valor={sexo}
            aoMudar={setSexo}
            rotulos={{
              M: { pt: 'Masculino', en: 'Male', zh: '男' },
              F: { pt: 'Feminino', en: 'Female', zh: '女' },
            }}
          />
        </Campo>

        <Campo
          rotulo={tr({
            pt: 'Categoria profissional',
            en: 'Job category',
            zh: '岗位类别',
          })}
        >
          <Seleccao value={cargo} onChange={setCargo}>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {tr(categoria(c))}
              </option>
            ))}
          </Seleccao>
        </Campo>

        <Campo
          rotulo={tr({ pt: 'Modalidade', en: 'Contract type', zh: '用工形式' })}
        >
          <Seleccao value={modalidade} onChange={(v) => setModalidade(v as Modalidade)}>
            {MODALIDADES.map((m) => (
              <option key={m} value={m}>
                {tr(ROTULO_MODALIDADE[m])}
              </option>
            ))}
          </Seleccao>
        </Campo>

        <Campo
          rotulo={tr({ pt: 'Data de início', en: 'Start date', zh: '入职日期' })}
        >
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="num h-10 w-full rounded-xl bg-bloco px-3.5 text-[13px] text-texto outline-none focus:bg-bloco-2"
          />
        </Campo>

        <Campo
          rotulo={tr({ pt: 'Base de cálculo', en: 'Pay basis', zh: '计酬方式' })}
        >
          <Seleccao value={baseCalculo} onChange={(v) => setBaseCalculo(v as BaseCalculo)}>
            {BASES_CALCULO.map((b) => (
              <option key={b} value={b}>
                {tr(ROTULO_BASE_CALCULO[b])}
              </option>
            ))}
          </Seleccao>
        </Campo>

        <Campo
          rotulo={tr({
            pt: 'Remuneração base',
            en: 'Base remuneration',
            zh: '基本报酬',
          })}
          nota={tr({
            pt: 'Alimenta o custo de mão-de-obra por hectare e por quilograma.',
            en: 'Feeds labour cost per hectare and per kilogram.',
            zh: '用于派生每公顷与每公斤用工成本。',
          })}
        >
          <Numero valor={remuneracao} aoMudar={setRemuneracao} sufixo="MT" passo="0.01" />
        </Campo>

        <Campo
          rotulo={tr({
            pt: 'Beneficiário do INSS',
            en: 'Social security number',
            zh: '社保编号',
          })}
          nota={tr({
            pt: 'Prazo de inscrição: 30 dias do início, com alerta ao 10.º.',
            en: 'Registration deadline: 30 days from the start, with an alert on day 10.',
            zh: '参保期限：自入职起 30 天，第 10 天提醒。',
          })}
        >
          <input
            value={inss}
            onChange={(e) => setInss(e.target.value)}
            placeholder={tr({
              pt: 'Número de beneficiário',
              en: 'Beneficiary number',
              zh: '参保编号',
            })}
            className="num h-10 w-full rounded-xl bg-bloco px-3.5 text-[13px] text-texto outline-none focus:bg-bloco-2"
          />
        </Campo>

        <Campo rotulo="NUIT">
          <input
            value={nuit}
            onChange={(e) => setNuit(e.target.value)}
            placeholder={tr({
              pt: 'Número único de identificação tributária',
              en: 'Unique taxpayer identification number',
              zh: '纳税人唯一识别号',
            })}
            className="num h-10 w-full rounded-xl bg-bloco px-3.5 text-[13px] text-texto outline-none focus:bg-bloco-2"
          />
        </Campo>

        <Campo
          rotulo={tr({
            pt: 'Apólice de acidentes',
            en: 'Accident policy',
            zh: '工伤保单',
          })}
          nota={tr({
            pt: 'Cobertura de 100%, incluindo sazonais (K-PES-10).',
            en: '100% coverage, seasonal workers included (K-PES-10).',
            zh: '覆盖率 100%，含季节工（K-PES-10）。',
          })}
        >
          <input
            value={apolice}
            onChange={(e) => setApolice(e.target.value)}
            className="h-10 w-full rounded-xl bg-bloco px-3.5 text-[13px] text-texto outline-none focus:bg-bloco-2"
          />
        </Campo>

        <Campo
          rotulo={tr({
            pt: 'Apto a aplicar fitofármacos',
            en: 'Cleared to apply pesticides',
            zh: '可从事农药作业',
          })}
          largo
          nota={tr({
            pt: 'Exige certificado de formação e de saúde válidos (V08 e V09), e fecha-se a menores de 18 e a maiores de 60.',
            en: 'Requires valid training and health certificates (V08 and V09), and is closed to those under 18 and over 60.',
            zh: '需持有效的培训与健康证书（V08 与 V09），且不适用于 18 岁以下及 60 岁以上者。',
          })}
        >
          <Pastilhas
            opcoes={['nao', 'sim'] as const}
            valor={aplicador ? 'sim' : 'nao'}
            aoMudar={(v) => setAplicador(v === 'sim')}
            rotulos={{ nao: UI.nao, sim: UI.sim }}
          />
        </Campo>
      </Grelha>
    </Formulario>
  );
}
