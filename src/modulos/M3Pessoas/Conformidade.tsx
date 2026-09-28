/**
 * M3 — Conformidade laboral.
 *
 * «A conformidade legal é presumida, não verificada.» É este o problema que o
 * ecrã resolve: inscrição no INSS, seguro de acidentes e certificados passam a
 * ser medidos, com nome, data e diploma.
 *
 * A verificação de mínimos salariais não vive aqui: é matéria que a Direcção
 * trata directamente com as pessoas, fora do sistema.
 */

import { BadgeCheck, ScrollText, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useTrabalhadores } from '../../dados/consultas';
import { HOJE } from '../../dados/semente';
import { useFmt, useT } from '../../i18n/contexto';
import { COL } from '../../i18n/comuns';
import { INDICADOR_POR_CODIGO } from '../../dominio/indicadores';
import { categoria, ROTULO_CERTIFICADO } from '../../dominio/pessoas';
import { avaliar } from '../../regras/semaforo';
import { diasEntre, validarTrabalhador } from '../../regras/validacao';
import { Pagina } from '../../design/Pagina';
import {
  CartaoMetrica,
  Codigo,
  Constatacoes,
  Painel,
  Semaforo,
  Tabela,
} from '../../design/primitivas';

export function Conformidade() {
  const tr = useT();
  const fmt = useFmt();
  const trabalhadores = useTrabalhadores();
  const activos = trabalhadores.filter((t) => t.estado === 'activo');

  const semInss = activos.filter((t) => !t.numero_beneficiario_inss);
  const semApolice = activos.filter((t) => !t.apolice_acidentes_trabalho);
  const aplicadores = activos.filter((t) => t.apto_aplicar_pesticidas);
  const certificadosAExpirar = activos.flatMap((t) =>
    t.certificados
      .filter(
        (c) => c.validade && diasEntre(HOJE, c.validade) <= 30 && diasEntre(HOJE, c.validade) >= 0,
      )
      .map((c) => ({ trabalhador: t, certificado: c })),
  );

  const pct = (n: number) =>
    activos.length > 0 ? ((activos.length - n) / activos.length) * 100 : undefined;

  return (
    <Pagina>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <CartaoMetrica
          destaque
          icone={BadgeCheck}
          cor={avaliar(pct(semInss.length), INDICADOR_POR_CODIGO.get('K-PES-09')!).cor}
          rotulo={tr({
            pt: 'Cobertura de INSS',
            en: 'Social security coverage',
            zh: '社保覆盖率',
          })}
          valor={fmt.numero(pct(semInss.length) ?? 0, 1)}
          unidade="%"
          legenda={tr({
            pt: `${semInss.length} por inscrever`,
            en: `${semInss.length} to register`,
            zh: `${semInss.length} 人待参保`,
          })}
          frase={tr({
            pt: 'O prazo de inscrição é de 30 dias desde o início do contrato, com alerta ao 10.º. A meta é 100%.',
            en: 'The registration deadline is 30 days from the start of the contract, with an alert on day 10. The target is 100%.',
            zh: '参保期限为自合同起算 30 天，第 10 天提醒。目标为 100%。',
          })}
        />

        <CartaoMetrica
          icone={ScrollText}
          cor={avaliar(pct(semApolice.length), INDICADOR_POR_CODIGO.get('K-PES-10')!).cor}
          rotulo={tr({
            pt: 'Seguro de acidentes',
            en: 'Accident insurance',
            zh: '工伤保险',
          })}
          valor={fmt.numero(pct(semApolice.length) ?? 0, 1)}
          unidade="%"
          codigo="K-PES-10"
          frase={tr({
            pt: `${semApolice.length} sem apólice. A meta é 100%, incluindo sazonais.`,
            en: `${semApolice.length} with no policy. The target is 100%, seasonal workers included.`,
            zh: `${semApolice.length} 人无保单。目标为 100%，含季节工。`,
          })}
        />

        <CartaoMetrica
          icone={ShieldCheck}
          cor={certificadosAExpirar.length === 0 ? 'verde' : 'ambar'}
          rotulo={tr({
            pt: 'Certificados a expirar',
            en: 'Certificates expiring',
            zh: '即将到期的证书',
          })}
          valor={fmt.inteiro(certificadosAExpirar.length)}
          unidade={tr({
            pt: `${aplicadores.length} aplicadores`,
            en: `${aplicadores.length} applicators`,
            zh: `${aplicadores.length} 名施药员`,
          })}
          frase={tr({
            pt: 'Certificado de aplicador ou de saúde a caducar nos próximos 30 dias. Sem ele, a V08 impede a aplicação de fitofármacos.',
            en: 'Applicator or health certificate expiring in the next 30 days. Without it, V08 blocks pesticide application.',
            zh: '未来30 天内到期的施药员证书或健康证。缺少该证书，V08 将阻止农药作业。',
          })}
        />
      </div>

      <Painel
        titulo={tr({
          pt: 'V29 — Inscrição no INSS',
          en: 'V29 — Social security registration',
          zh: 'V29 — 社保参保',
        })}
        descricao={tr({
          pt: 'Prazo de 30 dias desde o início do contrato, com alerta ao 10.º dia.',
          en: 'A 30-day deadline from the start of the contract, with an alert on day 10.',
          zh: '自合同起算 30 天期限，第 10 天提醒。',
        })}
        denso
      >
        <Tabela
          linhas={semInss}
          chave={(t) => t.codigo}
          vazio={tr({
            pt: 'Todos os trabalhadores activos estão inscritos.',
            en: 'Every active worker is registered.',
            zh: '全体在职工人均已参保。',
          })}
          colunas={[
            {
              chave: 'cod',
              cabecalho: tr(COL.trabalhador),
              render: (t) => (
                <Link to={`/trabalhadores/${t.codigo}`} className="ligacao">
                  <Codigo forte>{t.codigo}</Codigo>
                </Link>
              ),
            },
            { chave: 'nome', cabecalho: tr(COL.nome), render: (t) => t.nome_completo },
            {
              chave: 'cargo',
              cabecalho: tr(COL.categoria),
              render: (t) => (
                <span className="text-texto-2">{tr(categoria(t.categoria_profissional))}</span>
              ),
            },
            {
              chave: 'inicio',
              cabecalho: tr({ pt: 'Início', en: 'Start', zh: '入职' }),
              numerica: true,
              render: (t) => fmt.data(t.data_inicio),
            },
            {
              chave: 'dias',
              cabecalho: tr({
                pt: 'Dias sem inscrição',
                en: 'Days unregistered',
                zh: '未参保天数',
              }),
              numerica: true,
              // Sem data de início não há de onde contar o prazo. A contagem em
               // falta é pior do que uma contagem alta: não se sabe sequer quanto.
              render: (t) => {
                if (!t.data_inicio)
                  return (
                    <Semaforo
                      cor="vermelho"
                      rotulo={tr({
                        pt: 'início por registar',
                        en: 'start date missing',
                        zh: '入职日期缺失',
                      })}
                    />
                  );
                const d = diasEntre(t.data_inicio, HOJE);
                return (
                  <Semaforo
                    cor={d > 30 ? 'vermelho' : 'ambar'}
                    rotulo={`${fmt.inteiro(d)} ${fmt.unidade('dia')}`}
                  />
                );
              },
              ordenarPor: (t) =>
                t.data_inicio ? -diasEntre(t.data_inicio, HOJE) : Number.NEGATIVE_INFINITY,
            },
          ]}
        />
      </Painel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Painel
          titulo={tr({
            pt: 'K-PES-10 — Sem seguro de acidentes',
            en: 'K-PES-10 — No accident insurance',
            zh: 'K-PES-10 — 无工伤保险',
          })}
          descricao={tr({
            pt: 'A cobertura tem meta de 100%, incluindo os sazonais da época de pico.',
            en: 'Coverage has a 100% target, seasonal peak workers included.',
            zh: '覆盖率目标为 100%，含旺季季节工。',
          })}
          denso
        >
          <Tabela
            linhas={semApolice}
            chave={(t) => t.codigo}
            vazio={tr({
              pt: 'Todos os trabalhadores activos estão cobertos.',
              en: 'Every active worker is covered.',
              zh: '全体在职工人均已投保。',
            })}
            colunas={[
              {
                chave: 'cod',
                cabecalho: tr(COL.trabalhador),
                render: (t) => (
                  <Link to={`/trabalhadores/${t.codigo}`} className="ligacao">
                    <Codigo forte>{t.codigo}</Codigo>
                  </Link>
                ),
              },
              { chave: 'nome', cabecalho: tr(COL.nome), render: (t) => t.nome_completo },
              {
                chave: 'cargo',
                cabecalho: tr(COL.categoria),
                render: (t) => (
                  <span className="text-texto-2">{tr(categoria(t.categoria_profissional))}</span>
                ),
              },
            ]}
          />
        </Painel>

        <Painel
          titulo={tr({
            pt: 'W11 — Certificados a expirar nos próximos 30 dias',
            en: 'W11 — Certificates expiring in the next 30 days',
            zh: 'W11 — 未来30 天内到期的证书',
          })}
          descricao={tr({
            pt: 'Notifica trabalhador, chefia e Recursos Humanos, e agenda renovação (§24.4).',
            en: 'Notifies the worker, the supervisor and Human Resources, and schedules renewal (§24.4).',
            zh: '通知工人、上级与人力资源部门，并安排续期（§24.4）。',
          })}
          denso
        >
          <Tabela
            linhas={certificadosAExpirar}
            chave={(x) => `${x.trabalhador.codigo}-${x.certificado.tipo}`}
            vazio={tr({
              pt: 'Nenhum certificado a expirar no próximo mês.',
              en: 'No certificate expiring in the next month.',
              zh: '未来一个月内无证书到期。',
            })}
            colunas={[
              {
                chave: 'cod',
                cabecalho: tr(COL.trabalhador),
                render: (x) => (
                  <Link to={`/trabalhadores/${x.trabalhador.codigo}`} className="ligacao">
                    <Codigo forte>{x.trabalhador.codigo}</Codigo>
                  </Link>
                ),
              },
              { chave: 'nome', cabecalho: tr(COL.nome), render: (x) => x.trabalhador.nome_completo },
              {
                chave: 'tipo',
                cabecalho: tr({
                  pt: 'Certificado',
                  en: 'Certificate',
                  zh: '证书',
                }),
                render: (x) => tr(ROTULO_CERTIFICADO[x.certificado.tipo]),
              },
              {
                chave: 'validade',
                cabecalho: tr({ pt: 'Validade', en: 'Valid until', zh: '有效期' }),
                numerica: true,
                render: (x) => (
                  <Semaforo
                    cor="ambar"
                    rotulo={`${fmt.data(x.certificado.validade)} · ${fmt.distanciaEmDias(diasEntre(HOJE, x.certificado.validade!))}`}
                  />
                ),
              },
            ]}
          />
        </Painel>
      </div>

      <Painel
        titulo={tr({
          pt: 'Todas as constatações do quadro',
          en: 'Every finding across the headcount',
          zh: '全员检查结果',
        })}
        descricao={tr({
          pt: 'Saída directa do motor de regras sobre as fichas F-03, agrupada por trabalhador.',
          en: 'Direct output of the rules engine over the F-03 sheets, grouped by worker.',
          zh: '规则引擎对 F-03 表单的直接输出，按工人分组。',
        })}
      >
        <div className="flex flex-col gap-4">
          {activos
            .map((t) => ({ t, r: validarTrabalhador(t, HOJE) }))
            .filter((x) => x.r.constatacoes.length > 0)
            .sort(
              (a, b) =>
                b.r.constatacoes.filter((c) => c.severidade === 'bloqueante').length -
                a.r.constatacoes.filter((c) => c.severidade === 'bloqueante').length,
            )
            .map(({ t, r }) => (
              <div key={t.codigo}>
                <div className="mb-2 flex items-baseline gap-2">
                  <Link to={`/trabalhadores/${t.codigo}`} className="ligacao">
                    <Codigo forte>{t.codigo}</Codigo>
                  </Link>
                  <span className="text-[13px] font-medium text-texto">{t.nome_completo}</span>
                  <span className="text-[12px] text-texto-3">
                    {tr(categoria(t.categoria_profissional))}
                  </span>
                </div>
                <Constatacoes lista={r.constatacoes} />
              </div>
            ))}
        </div>
      </Painel>
    </Pagina>
  );
}
