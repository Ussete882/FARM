/**
 * M3 — Trabalhadores (F-03, E-17).
 *
 * Os campos deste registo decorrem de obrigações legais moçambicanas
 * identificadas. As validações V01 a V29 correm sobre cada ficha, e o resultado
 * é mostrado — não presumido.
 */

import { BadgeCheck, Plus, ShieldCheck, Users } from 'lucide-react';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { jornasDoTrabalhador, useJornas, useNomes, useTrabalhadores } from '../../dados/consultas';
import { HOJE } from '../../dados/semente';
import { useFmt, useT } from '../../i18n/contexto';
import { COL, UI } from '../../i18n/comuns';
import {
  categoria,
  idade,
  ROTULO_BASE_CALCULO,
  ROTULO_MODALIDADE,
  ROTULO_PRESENCA,
  type Trabalhador,
} from '../../dominio/pessoas';
import { kPes03 } from '../../regras/calculos';
import { validarTrabalhador } from '../../regras/validacao';
import { FichaObjecto } from '../../design/FichaObjecto';
import { Botao, ListaDetalhe, Pagina } from '../../design/Pagina';
import {
  CartaoMetrica,
  Codigo,
  Constatacoes,
  Painel,
  Rotulo,
  Semaforo,
  Tabela,
} from '../../design/primitivas';
import { FormularioF03 } from './FormularioF03';

export function Trabalhadores() {
  const tr = useT();
  const fmt = useFmt();
  const { codigo } = useParams();
  const navegar = useNavigate();
  const trabalhadores = useTrabalhadores();
  const jornas = useJornas();
  const nomes = useNomes();
  const [aAdmitir, setAAdmitir] = React.useState(false);

  const seleccionado = trabalhadores.find((t) => t.codigo === codigo);

  const activos = trabalhadores.filter((t) => t.estado === 'activo');
  const constatacoesDe = (t: (typeof trabalhadores)[number]) => validarTrabalhador(t, HOJE);
  const conformes = activos.filter((t) => constatacoesDe(t).gravavel).length;
  const semInss = activos.filter((t) => !t.numero_beneficiario_inss).length;
  const semApolice = activos.filter((t) => !t.apolice_acidentes_trabalho).length;

  return (
    <Pagina
      accoes={
        !aAdmitir && (
          <Botao variante="primario" onClick={() => setAAdmitir(true)}>
            <Plus className="size-3.5" />
            {tr({ pt: 'Admitir trabalhador', en: 'Admit a worker', zh: '录用工人' })}
          </Botao>
        )
      }
    >
      {aAdmitir && <FormularioF03 aoFechar={() => setAAdmitir(false)} />}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <CartaoMetrica
          destaque
          icone={Users}
          cor={conformes === activos.length ? 'verde' : 'vermelho'}
          rotulo={tr({
            pt: 'Quadro permanente',
            en: 'Permanent headcount',
            zh: '长期编制',
          })}
          valor={fmt.inteiro(activos.length)}
          unidade={tr({ pt: 'pessoas', en: 'people', zh: '人' })}
          legenda={tr({
            pt: `${conformes} conformes`,
            en: `${conformes} compliant`,
            zh: `${conformes} 人合规`,
          })}
          frase={tr({
            pt: 'Todos permanentes, nenhum sazonal — o plano contava com 40 a 52 pessoas e 120 sazonais no pico. As fichas estão bloqueadas por falta de data de nascimento e de início de contrato.',
            en: 'All permanent, none seasonal — the plan counted on 40 to 52 people plus 120 seasonal at peak. The records are blocked for want of a date of birth and a contract start date.',
            zh: '全为长期工，无季节工——而计划预估 40 至 52 人并在高峰期增聘 120 名季节工。因缺少出生日期与合同起始日期，人员档案处于阻断状态。',
          })}
        />

        <CartaoMetrica
          icone={BadgeCheck}
          cor={semInss === 0 ? 'verde' : 'ambar'}
          rotulo={tr({
            pt: 'Sem inscrição no INSS',
            en: 'Not registered with social security',
            zh: '未参加社保',
          })}
          valor={fmt.inteiro(semInss)}
          unidade={tr({
            pt: `de ${activos.length}`,
            en: `of ${activos.length}`,
            zh: `共 ${activos.length} 人`,
          })}
          codigo="K-PES-09"
          frase={tr({
            pt: 'Nenhuma inscrição consta do registo do gestor. Não quer dizer que não exista: quer dizer que não está registada, e o que não está registado não se prova.',
            en: 'No registration appears in the manager’s records. That does not mean none exists: it means none is recorded, and what is not recorded cannot be proven.',
            zh: '经理的名册中没有任何参保记录。这并不说明无人参保，而是说无人登记；未登记的事无从证明。',
          })}
          para="/conformidade"
        />

        <CartaoMetrica
          icone={ShieldCheck}
          cor={semApolice === 0 ? 'verde' : 'ambar'}
          rotulo={tr({
            pt: 'Sem seguro de acidentes',
            en: 'No accident insurance',
            zh: '无工伤保险',
          })}
          valor={fmt.inteiro(semApolice)}
          unidade={tr({
            pt: `de ${activos.length}`,
            en: `of ${activos.length}`,
            zh: `共 ${activos.length} 人`,
          })}
          codigo="K-PES-10"
          frase={tr({
            pt: 'A cobertura tem meta de 100%. Nenhuma apólice consta do registo, e o trabalho é de campo com tractor e alfaias.',
            en: 'Coverage has a 100% target. No policy appears in the records, and the work is field work with a tractor and implements.',
            zh: '覆盖率目标为 100%。名册中没有任何保单，而作业是使用拖拉机与农具的田间作业。',
          })}
          para="/conformidade"
        />
      </div>

      <ListaDetalhe
        semSeleccao={tr({
          pt: 'Escolha um trabalhador para abrir a ficha F-03.',
          en: 'Pick a worker to open their F-03 sheet.',
          zh: '选择一名工人以打开 F-03 表单。',
        })}
        lista={
          <Painel
            titulo={tr({
              pt: `${trabalhadores.length} trabalhadores`,
              en: `${trabalhadores.length} workers`,
              zh: `${trabalhadores.length} 名工人`,
            })}
            denso
          >
            <Tabela
              linhas={trabalhadores}
              chave={(t) => t.codigo}
              activa={(t) => t.codigo === codigo}
              aoClicar={(t) => navegar(`/trabalhadores/${t.codigo}`)}
              colunas={[
                {
                  chave: 'cod',
                  cabecalho: tr(COL.codigo),
                  render: (t) => <Codigo forte>{t.codigo}</Codigo>,
                },
                { chave: 'nome', cabecalho: tr(COL.nome), render: (t) => t.nome_completo },
                {
                  chave: 'cargo',
                  cabecalho: tr({
                    pt: 'Categoria profissional',
                    en: 'Job category',
                    zh: '岗位类别',
                  }),
                  render: (t) => (
                    <span className="text-texto-2">{tr(categoria(t.categoria_profissional))}</span>
                  ),
                  ordenarPor: (t) => t.categoria_profissional,
                },
                {
                  chave: 'modalidade',
                  cabecalho: tr({
                    pt: 'Modalidade',
                    en: 'Contract type',
                    zh: '用工形式',
                  }),
                  render: (t) => tr(ROTULO_MODALIDADE[t.modalidade]),
                },
                {
                  chave: 'equipa',
                  cabecalho: tr(COL.equipa),
                  render: (t) => <Codigo>{t.equipa ?? '—'}</Codigo>,
                },
                {
                  chave: 'salario',
                  cabecalho: tr({
                    pt: 'Remuneração',
                    en: 'Remuneration',
                    zh: '报酬',
                  }),
                  numerica: true,
                  render: (t) =>
                    t.remuneracao_base ? (
                      fmt.meticais(t.remuneracao_base.valor)
                    ) : (
                      <span className="text-texto-3">
                        {tr({
                          pt: 'por registar',
                          en: 'not recorded',
                          zh: '待登记',
                        })}
                      </span>
                    ),
                  ordenarPor: (t) => t.remuneracao_base?.valor ?? -1,
                },
                {
                  chave: 'conformidade',
                  cabecalho: tr({
                    pt: 'Conformidade',
                    en: 'Compliance',
                    zh: '合规',
                  }),
                  numerica: true,
                  render: (t) => {
                    const r = validarTrabalhador(t, HOJE);
                    const bloqueantes = r.constatacoes.filter((c) => c.severidade === 'bloqueante').length;
                    if (bloqueantes > 0)
                      return (
                        <Semaforo
                          cor="vermelho"
                          rotulo={tr({
                            pt: fmt.contagem(bloqueantes, 'bloqueante', 'bloqueantes'),
                            en: fmt.contagem(bloqueantes, 'blocker', 'blockers'),
                            zh: `${fmt.inteiro(bloqueantes)} 项阻断`,
                          })}
                        />
                      );
                    const n = r.constatacoes.length;
                    if (n > 0)
                      return (
                        <Semaforo
                          cor="ambar"
                          rotulo={tr({
                            pt: fmt.contagem(n, 'aviso', 'avisos'),
                            en: fmt.contagem(n, 'warning', 'warnings'),
                            zh: `${fmt.inteiro(n)} 项警告`,
                          })}
                        />
                      );
                    return (
                      <Semaforo
                        cor="verde"
                        rotulo={tr({ pt: 'conforme', en: 'compliant', zh: '合规' })}
                      />
                    );
                  },
                  ordenarPor: (t) =>
                    -validarTrabalhador(t, HOJE).constatacoes.filter((c) => c.severidade === 'bloqueante')
                      .length,
                },
              ]}
            />
          </Painel>
        }
        detalhe={
          seleccionado ? (
            <FichaTrabalhador
              trabalhador={seleccionado}
              jornas={jornasDoTrabalhador(jornas, seleccionado.codigo)}
              nomes={nomes}
            />
          ) : null
        }
      />
    </Pagina>
  );
}

function FichaTrabalhador({
  trabalhador,
  jornas,
  nomes,
}: {
  trabalhador: Trabalhador;
  jornas: ReturnType<typeof useJornas>;
  nomes: Map<string, string>;
}) {
  const tr = useT();
  const fmt = useFmt();
  const validacao = validarTrabalhador(trabalhador, HOJE);
  const anos = idade(trabalhador, HOJE);

  /** O que a ficha mostra onde não há dado. Não é um traço: é uma tarefa. */
  const POR_REGISTAR = tr({ pt: 'Por registar', en: 'Not recorded', zh: '待登记' });
  const assiduidade = kPes03(jornas);

  return (
    <FichaObjecto
      objecto={{ ...trabalhador, designacao: trabalhador.nome_completo }}
      nomeDono={nomes.get(trabalhador.dono)}
      subtitulo={tr({
        pt: `${categoria(trabalhador.categoria_profissional).pt} · ${ROTULO_MODALIDADE[trabalhador.modalidade].pt}${trabalhador.data_inicio ? ` · desde ${fmt.data(trabalhador.data_inicio)}` : ''}`,
        en: `${categoria(trabalhador.categoria_profissional).en} · ${ROTULO_MODALIDADE[trabalhador.modalidade].en}${trabalhador.data_inicio ? ` · since ${fmt.data(trabalhador.data_inicio)}` : ''}`,
        zh: `${categoria(trabalhador.categoria_profissional).zh} · ${ROTULO_MODALIDADE[trabalhador.modalidade].zh}${trabalhador.data_inicio ? ` · ${fmt.data(trabalhador.data_inicio)} 入职` : ''}`,
      })}
      grupos={[
        {
          titulo: tr({ pt: 'Identificação', en: 'Identity', zh: '身份' }),
          campos: [
            {
              rotulo: tr({ pt: 'Nome completo', en: 'Full name', zh: '姓名' }),
              valor: trabalhador.nome_completo,
            },
            {
              rotulo: tr({
                pt: 'Data de nascimento',
                en: 'Date of birth',
                zh: '出生日期',
              }),
              valor:
                anos === undefined
                  ? POR_REGISTAR
                  : tr({
                      pt: `${fmt.data(trabalhador.data_nascimento)} · ${anos} anos`,
                      en: `${fmt.data(trabalhador.data_nascimento)} · ${anos} years`,
                      zh: `${fmt.data(trabalhador.data_nascimento)} · ${anos} 岁`,
                    }),
            },
            {
              rotulo: tr({ pt: 'Sexo', en: 'Sex', zh: '性别' }),
              valor:
                trabalhador.sexo === 'F'
                  ? tr({ pt: 'Feminino', en: 'Female', zh: '女' })
                  : tr({ pt: 'Masculino', en: 'Male', zh: '男' }),
            },
            {
              rotulo: tr({ pt: 'Nacionalidade', en: 'Nationality', zh: '国籍' }),
              valor: trabalhador.nacionalidade ?? POR_REGISTAR,
            },
            {
              rotulo: tr({ pt: 'Província', en: 'Province', zh: '省' }),
              valor: trabalhador.provincia,
            },
            {
              rotulo: tr({ pt: 'Distrito', en: 'District', zh: '县' }),
              valor: trabalhador.distrito,
            },
          ],
        },
        {
          titulo: tr({
            pt: 'Documentos e segurança social',
            en: 'Documents and social security',
            zh: '证件与社保',
          }),
          campos: [
            { rotulo: 'NUIT', valor: <Codigo forte>{trabalhador.nuit ?? '—'}</Codigo> },
            {
              rotulo: tr({
                pt: 'Beneficiário INSS',
                en: 'Social security number',
                zh: '社保编号',
              }),
              valor: trabalhador.numero_beneficiario_inss ? (
                <Codigo forte>{trabalhador.numero_beneficiario_inss}</Codigo>
              ) : (
                <Semaforo
                  cor="vermelho"
                  rotulo={tr({
                    pt: 'Sem inscrição',
                    en: 'Not registered',
                    zh: '未参保',
                  })}
                />
              ),
              nota: tr({
                pt: 'Prazo de inscrição: 30 dias do início do contrato, com alerta ao 10.º dia.',
                en: 'Registration deadline: 30 days from the start of the contract, with an alert on day 10.',
                zh: '参保期限：自合同起算 30 天，第 10 天提醒。',
              }),
            },
            {
              rotulo: tr({
                pt: 'Seguro de acidentes',
                en: 'Accident insurance',
                zh: '工伤保险',
              }),
              valor: trabalhador.apolice_acidentes_trabalho ? (
                <Codigo forte>{trabalhador.apolice_acidentes_trabalho}</Codigo>
              ) : (
                <Semaforo
                  cor="ambar"
                  rotulo={tr({ pt: 'Sem apólice', en: 'No policy', zh: '无保单' })}
                />
              ),
            },
            {
              rotulo: tr({ pt: 'Telefone', en: 'Phone', zh: '电话' }),
              valor: trabalhador.telefone ?? '—',
            },
          ],
        },
        {
          titulo: tr({
            pt: 'Vínculo e remuneração',
            en: 'Engagement and pay',
            zh: '用工与报酬',
          }),
          campos: [
            {
              rotulo: tr({ pt: 'Data de início', en: 'Start date', zh: '入职日期' }),
              valor: trabalhador.data_inicio ? fmt.data(trabalhador.data_inicio) : POR_REGISTAR,
            },
            {
              rotulo: tr({
                pt: 'Local de trabalho',
                en: 'Place of work',
                zh: '工作地点',
              }),
              valor: trabalhador.local_trabalho,
            },
            {
              rotulo: tr({
                pt: 'Base de cálculo',
                en: 'Pay basis',
                zh: '计酬方式',
              }),
              valor: trabalhador.base_calculo
                ? tr(ROTULO_BASE_CALCULO[trabalhador.base_calculo])
                : POR_REGISTAR,
            },
            {
              rotulo: tr({
                pt: 'Remuneração base',
                en: 'Base remuneration',
                zh: '基本报酬',
              }),
              valor: trabalhador.remuneracao_base
                ? fmt.meticais(trabalhador.remuneracao_base.valor)
                : POR_REGISTAR,
              nota: tr({
                pt: 'Alimenta o custo de mão-de-obra por hectare e por quilograma.',
                en: 'Feeds labour cost per hectare and per kilogram.',
                zh: '用于派生每公顷与每公斤用工成本。',
              }),
            },
            {
              rotulo: tr({ pt: 'Dependentes', en: 'Dependants', zh: '赡养人口' }),
              valor:
                trabalhador.numero_dependentes === undefined
                  ? POR_REGISTAR
                  : String(trabalhador.numero_dependentes),
            },
          ],
        },
        {
          titulo: tr({
            pt: 'Segurança e aptidão',
            en: 'Safety and fitness',
            zh: '安全与资格',
          }),
          campos: [
            {
              rotulo: tr({
                pt: 'Apto a aplicar fitofármacos',
                en: 'Cleared to apply pesticides',
                zh: '可从事农药作业',
              }),
              valor: (
                <Semaforo
                  cor={trabalhador.apto_aplicar_pesticidas ? 'ambar' : 'cinzento'}
                  rotulo={tr(trabalhador.apto_aplicar_pesticidas ? UI.sim : UI.nao)}
                />
              ),
            },
            {
              rotulo: tr({
                pt: 'Certificados',
                en: 'Certificates',
                zh: '证书',
              }),
              valor:
                trabalhador.certificados.length === 0 ? (
                  '—'
                ) : (
                  <div className="flex flex-col gap-1">
                    {trabalhador.certificados.map((c, i) => (
                      <span key={i} className="flex items-center gap-2 text-[12px]">
                        <span className="text-texto-2">{c.tipo.replace(/_/g, ' ')}</span>
                        <Semaforo
                          cor={!c.validade ? 'cinzento' : c.validade < HOJE ? 'vermelho' : 'verde'}
                          rotulo={fmt.data(c.validade)}
                        />
                      </span>
                    ))}
                  </div>
                ),
              largo: true,
            },
            {
              rotulo: tr({
                pt: 'Chefe directo',
                en: 'Direct supervisor',
                zh: '直接上级',
              }),
              valor: nomes.get(trabalhador.chefe_directo ?? '') ?? '—',
            },
            {
              rotulo: tr(COL.equipa),
              valor: <Codigo forte>{trabalhador.equipa ?? '—'}</Codigo>,
            },
          ],
        },
      ]}
      extra={
        <div className="flex flex-col gap-5">
          <section>
            <Rotulo className="mb-2">
              {tr({
                pt: 'Assiduidade e produtividade',
                en: 'Attendance and productivity',
                zh: '出勤与生产率',
              })}
            </Rotulo>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Codigo>K-PES-03</Codigo>
                <div className="num mt-0.5 text-[15px] font-medium text-texto">
                  {fmt.percentagem(assiduidade.valor)}
                </div>
                <div className="text-[11px] text-texto-3">
                  {tr({ pt: 'meta', en: 'target', zh: '目标' })} ≥ 95%
                </div>
              </div>
              <div>
                <Rotulo>
                  {tr({
                    pt: 'Jornas registadas',
                    en: 'Worker-days on record',
                    zh: '已登记工日',
                  })}
                </Rotulo>
                <div className="num mt-0.5 text-[15px] font-medium text-texto">{jornas.length}</div>
              </div>
              <div>
                <Rotulo>{tr({ pt: 'Presenças', en: 'Days present', zh: '出勤天数' })}</Rotulo>
                <div className="num mt-0.5 text-[15px] font-medium text-texto">
                  {jornas.filter((j) => j.presenca === 'presente').length}
                </div>
              </div>
            </div>
          </section>

          {validacao.constatacoes.length > 0 && (
            <section>
              <Rotulo className="mb-2">
                {tr({
                  pt: 'Conformidade legal',
                  en: 'Legal compliance',
                  zh: '法律合规',
                })}
              </Rotulo>
              <Constatacoes lista={validacao.constatacoes} />
            </section>
          )}

          {jornas.length > 0 && (
            <section>
              <Rotulo className="mb-2">
                {tr({
                  pt: 'Últimas jornas',
                  en: 'Latest worker-days',
                  zh: '最近工日',
                })}
              </Rotulo>
              <Tabela
                linhas={[...jornas].sort((a, b) => (a.data < b.data ? 1 : -1)).slice(0, 10)}
                chave={(j) => j.codigo}
                colunas={[
                  { chave: 'data', cabecalho: tr(COL.data), render: (j) => fmt.data(j.data) },
                  {
                    chave: 'talhao',
                    cabecalho: tr(COL.talhao),
                    render: (j) => <Codigo>{j.talhao ?? '—'}</Codigo>,
                  },
                  {
                    chave: 'presenca',
                    cabecalho: tr({ pt: 'Presença', en: 'Attendance', zh: '出勤' }),
                    render: (j) => (
                      <Semaforo
                        cor={
                          j.presenca === 'presente'
                            ? 'verde'
                            : j.presenca === 'falta_injustificada'
                              ? 'vermelho'
                              : 'ambar'
                        }
                        rotulo={tr(ROTULO_PRESENCA[j.presenca])}
                      />
                    ),
                  },
                  {
                    chave: 'producao',
                    cabecalho: tr({ pt: 'Produção', en: 'Output', zh: '产量' }),
                    numerica: true,
                    render: (j) => fmt.quantidade(j.producao_individual),
                  },
                ]}
              />
            </section>
          )}
        </div>
      }
    />
  );
}
