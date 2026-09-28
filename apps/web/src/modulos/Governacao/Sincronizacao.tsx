/**
 * Por sincronizar (§25).
 *
 * O que o aparelho escreveu e ainda não saiu, e o que o servidor recusou.
 *
 * É o ecrã que impede a sincronização de ser mágica. Um sistema que sincroniza
 * em silêncio é um sistema em que ninguém sabe se o registo de terça-feira
 * chegou — e quando se descobre que não chegou, já ninguém se lembra do que lá
 * estava. Aqui a fila é visível, as recusas são visíveis, e a razão de cada
 * recusa é a mesma frase que o motor de regras produziria no telemóvel.
 *
 * Nada é apagado por si. Uma recusa fica até alguém a ver e decidir.
 */

import { useLiveQuery } from 'dexie-react-hooks';
import { CloudOff, CloudUpload, RefreshCw, ShieldAlert, TriangleAlert } from 'lucide-react';
import React from 'react';

import type { ObjectoCanonico } from '@bastet/nucleo/canonico';

import { db } from '../../dados/db';
import {
  arquivarRecusa,
  entrar,
  esquecerTestemunho,
  sincronizar,
  testemunhoGuardado,
  ultimaSincronizacao,
  type Resumo,
} from '../../dados/sincronizar';
import { useFmt, useT } from '../../i18n/contexto';
import { COL } from '../../i18n/comuns';
import type { T } from '@bastet/nucleo/i18n';
import { Botao, Pagina } from '../../design/Pagina';
import { Campo, Grelha } from '../../design/Formulario';
import { CartaoMetrica, Codigo, Constatacoes, Painel, Semaforo, Vazio } from '../../design/primitivas';

const ROTULO_ESCRITA: Record<string, T> = {
  criar: { pt: 'Criação', en: 'Creation', zh: '新建' },
  alterar: { pt: 'Alteração', en: 'Change', zh: '修改' },
  anular: { pt: 'Anulação e substituição', en: 'Annul and replace', zh: '作废并替代' },
};

const ROTULO_MOTIVO: Record<string, T> = {
  validacao: { pt: 'Não passa nas regras', en: 'Fails the rules', zh: '未通过规则校验' },
  conflito: { pt: 'Alterado por outra pessoa', en: 'Changed by someone else', zh: '已被他人修改' },
  versao_do_nucleo: {
    pt: 'Aparelho com regras desactualizadas',
    en: 'Device running outdated rules',
    zh: '设备规则版本过旧',
  },
  recusado: { pt: 'Recusado', en: 'Refused', zh: '被拒绝' },
};

export function Sincronizacao() {
  const tr = useT();
  const fmt = useFmt();
  const fila = useLiveQuery(() => db.saida.toArray(), [], []);
  const [aCorrer, setACorrer] = React.useState(false);
  const [resumo, setResumo] = React.useState<Resumo | null>(null);
  const [inscrito, setInscrito] = React.useState<boolean | null>(null);
  const [ultima, setUltima] = React.useState<string | undefined>();

  React.useEffect(() => {
    void testemunhoGuardado().then((t) => setInscrito(!!t));
    void ultimaSincronizacao().then(setUltima);
  }, [resumo]);

  const pendentes = fila.filter((e) => e.estadoEnvio === 'pendente');
  const recusadas = fila.filter((e) => e.estadoEnvio === 'recusada');

  const correr = async () => {
    setACorrer(true);
    setResumo(await sincronizar());
    setACorrer(false);
  };

  const sair = async () => {
    await esquecerTestemunho();
    setInscrito(false);
    setResumo(null);
  };

  return (
    <Pagina
      descricao={tr({
        pt: 'Escrever nunca espera pela rede: o registo entra no aparelho e fica aqui à espera de sinal. O que o servidor recusar aparece em baixo, com a razão — e fica até alguém decidir o que fazer.',
        en: 'Writing never waits for the network: the record lands on the device and waits here for signal. Whatever the server refuses shows below, with the reason — and stays until someone decides what to do.',
        zh: '录入从不等待网络：记录先存入设备，在此等待信号。服务器拒绝的内容连同原因显示在下方，并一直保留到有人处理为止。',
      })}
      accoes={
        <Botao variante="primario" onClick={correr} disabled={aCorrer || inscrito === false}>
          <RefreshCw className={`size-3.5 ${aCorrer ? 'animate-spin' : ''}`} />
          {tr({ pt: 'Sincronizar', en: 'Synchronise', zh: '同步' })}
        </Botao>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <CartaoMetrica
          destaque
          icone={pendentes.length > 0 ? CloudUpload : CloudOff}
          cor={pendentes.length === 0 ? 'verde' : 'ambar'}
          rotulo={tr({ pt: 'Por enviar', en: 'To send', zh: '待发送' })}
          valor={fmt.inteiro(pendentes.length)}
          legenda={
            ultima
              ? tr({
                  pt: `última às ${ultima.slice(11, 16)}`,
                  en: `last at ${ultima.slice(11, 16)}`,
                  zh: `上次 ${ultima.slice(11, 16)}`,
                })
              : tr({ pt: 'nunca sincronizou', en: 'never synced', zh: '从未同步' })
          }
          frase={tr({
            pt: 'Registos gravados no aparelho que o servidor ainda não tem. Uma semana sem rede não é uma falha: é o modo normal de trabalho no campo.',
            en: 'Records saved on the device that the server does not have yet. A week without network is not a failure: it is the normal way of working in the field.',
            zh: '已存于设备但服务器尚未收到的记录。一周没有网络不是故障，而是田间作业的常态。',
          })}
        />

        <CartaoMetrica
          icone={ShieldAlert}
          cor={recusadas.length === 0 ? 'verde' : 'vermelho'}
          rotulo={tr({ pt: 'Recusados', en: 'Refused', zh: '被拒绝' })}
          valor={fmt.inteiro(recusadas.length)}
          frase={tr({
            pt: 'O servidor volta a correr as regras com o contexto que o aparelho não tinha. Uma recusa nunca apaga o registo — fica aqui até alguém a ver.',
            en: 'The server re-runs the rules with the context the device did not have. A refusal never deletes the record — it stays here until someone looks at it.',
            zh: '服务器会结合设备所不掌握的上下文重新执行规则。被拒绝不会删除记录——它会一直保留到有人处理。',
          })}
        />

        <CartaoMetrica
          icone={TriangleAlert}
          cor={inscrito === false ? 'vermelho' : 'cinzento'}
          rotulo={tr({ pt: 'Aparelho', en: 'Device', zh: '设备' })}
          valor={
            inscrito === null
              ? '—'
              : inscrito
                ? tr({ pt: 'Inscrito', en: 'Enrolled', zh: '已注册' })
                : tr({ pt: 'Por inscrever', en: 'Not enrolled', zh: '未注册' })
          }
          frase={tr({
            pt: 'A Direcção inscreve o aparelho uma vez, por palavra-passe, e o servidor emite um testemunho de longa duração. Se o telemóvel se perder, revoga-se.',
            en: 'The Directorate enrols the device once, by password, and the server issues a long-lived token. If the phone is lost, it is revoked.',
            zh: '管理层凭密码为设备注册一次，服务器随即签发长期令牌。手机遗失时予以吊销。',
          })}
        />
      </div>

      {inscrito === false && <Entrar aoEntrar={() => setInscrito(true)} />}

      {inscrito && (
        <div className="flex justify-end">
          <Botao onClick={sair}>
            {tr({ pt: 'Esquecer este aparelho', en: 'Forget this device', zh: '注销本设备' })}
          </Botao>
        </div>
      )}

      {resumo && (
        <Painel titulo={tr({ pt: 'Última tentativa', en: 'Last attempt', zh: '最近一次尝试' })}>
          <p className="text-[12.5px] text-texto-2">
            {resumo.erro
              ? tr(resumo.erro)
              : tr({
                  pt: `${resumo.aceites} aceites, ${resumo.recusadas} recusados, ${resumo.recebidos} recebidos do servidor.`,
                  en: `${resumo.aceites} accepted, ${resumo.recusadas} refused, ${resumo.recebidos} received from the server.`,
                  zh: `接受 ${resumo.aceites} 条，拒绝 ${resumo.recusadas} 条，自服务器接收 ${resumo.recebidos} 条。`,
                })}
          </p>
        </Painel>
      )}

      <Painel
        titulo={tr({ pt: 'Na fila', en: 'In the queue', zh: '队列中' })}
        descricao={tr({
          pt: 'Por ordem de gravação. Saem todos na próxima sincronização.',
          en: 'In the order they were written. All go out on the next sync.',
          zh: '按录入先后排列。下次同步时全部发出。',
        })}
        denso
      >
        {pendentes.length === 0 ? (
          <Vazio>
            {tr({
              pt: 'Nada por enviar. Tudo o que foi gravado está no servidor.',
              en: 'Nothing to send. Everything written is on the server.',
              zh: '无待发送内容。所有已录入的记录均已上传。',
            })}
          </Vazio>
        ) : (
          <ul className="flex flex-col">
            {pendentes.map((e) => {
              const alvo = (e.substituto ?? e.objecto) as ObjectoCanonico | undefined;
              return (
                <li
                  key={e.id}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-fio px-5 py-3 last:border-0"
                >
                  <Codigo forte>{alvo?.codigo ?? '—'}</Codigo>
                  <span className="text-[12.5px] text-texto">{alvo?.designacao}</span>
                  <span className="text-[11.5px] text-texto-3">
                    {tr(ROTULO_ESCRITA[e.escrita] ?? ROTULO_ESCRITA.criar)}
                  </span>
                  <span className="num ml-auto text-[11.5px] text-texto-3">
                    {e.criada.slice(11, 16)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Painel>

      <Painel
        titulo={tr({ pt: 'Recusados pelo servidor', en: 'Refused by the server', zh: '服务器拒绝' })}
        descricao={tr({
          pt: 'A razão vem do mesmo motor de regras que corre no aparelho. Nada foi apagado e nada foi sobreposto.',
          en: 'The reason comes from the same rules engine that runs on the device. Nothing was deleted and nothing was overwritten.',
          zh: '原因来自设备上运行的同一套规则引擎。没有任何内容被删除或覆盖。',
        })}
      >
        {recusadas.length === 0 ? (
          <Vazio>
            {tr({ pt: 'Nenhuma recusa.', en: 'No refusals.', zh: '无拒绝记录。' })}
          </Vazio>
        ) : (
          <ul className="flex flex-col gap-5">
            {recusadas.map((e) => {
              const alvo = (e.substituto ?? e.objecto) as ObjectoCanonico | undefined;
              const actual = e.actual as ObjectoCanonico | undefined;
              return (
                <li key={e.id} className="border-b border-fio pb-5 last:border-0 last:pb-0">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <Codigo forte>{alvo?.codigo ?? '—'}</Codigo>
                    <span className="text-[13px] font-medium text-texto">{alvo?.designacao}</span>
                    <Semaforo
                      cor={e.motivo === 'conflito' ? 'ambar' : 'vermelho'}
                      rotulo={tr(ROTULO_MOTIVO[e.motivo ?? 'recusado'] ?? ROTULO_MOTIVO.recusado)}
                    />
                    <span className="ml-auto">
                      <Botao onClick={() => void arquivarRecusa(e.id as number)}>
                        {tr({ pt: 'Arquivar', en: 'Archive', zh: '归档' })}
                      </Botao>
                    </span>
                  </div>

                  {e.detalhe && (
                    <p className="mt-1.5 text-[12px] leading-relaxed text-texto-2">{e.detalhe}</p>
                  )}

                  {e.constatacoes && e.constatacoes.length > 0 && (
                    <div className="mt-2.5">
                      <Constatacoes lista={e.constatacoes} />
                    </div>
                  )}

                  {actual && (
                    <p className="mt-2.5 rounded-xl bg-bloco px-4 py-3 text-[11.5px] leading-relaxed text-texto-2">
                      {tr({
                        pt: `No servidor está a versão ${actual.versao}, alterada por ${actual.alterado_por} em ${fmt.data(actual.alterado_em)}: «${actual.designacao}». Para corrigir sem perder nenhuma das duas, anule e substitua (§24.5).`,
                        en: `The server holds version ${actual.versao}, changed by ${actual.alterado_por} on ${fmt.data(actual.alterado_em)}: «${actual.designacao}». To correct without losing either, annul and replace (§24.5).`,
                        zh: `服务器上是第 ${actual.versao} 版，由 ${actual.alterado_por} 于 ${fmt.data(actual.alterado_em)} 修改：「${actual.designacao}」。如需更正且两者都不丢失，请作废并提交替代记录（§24.5）。`,
                      })}
                    </p>
                  )}

                  <p className="mt-2 text-[11px] text-texto-3">
                    {tr(COL.data)}: {e.criada.slice(0, 10)} · {tr(ROTULO_ESCRITA[e.escrita])}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Painel>
    </Pagina>
  );
}

/**
 * Entrada da Direcção.
 *
 * É daqui que sai o testemunho que o aparelho guarda. No telemóvel do campo
 * isto acontece uma vez, na inscrição, e nunca mais: obrigar quem está num
 * campo a escrever uma palavra-passe ao sol seria o mesmo que desligar o
 * sistema.
 */
function Entrar({ aoEntrar }: { aoEntrar: () => void }) {
  const tr = useT();
  const [utilizador, setUtilizador] = React.useState('DIR-01');
  const [palavraPasse, setPalavraPasse] = React.useState('');
  const [erro, setErro] = React.useState<string | null>(null);
  const [aEntrar, setAEntrar] = React.useState(false);

  const submeter = async () => {
    setAEntrar(true);
    setErro(null);
    const r = await entrar(utilizador, palavraPasse);
    setAEntrar(false);
    if (r.bem) {
      setPalavraPasse('');
      aoEntrar();
    } else {
      setErro(r.erro);
    }
  };

  const controlo =
    'h-10 w-full rounded-xl bg-bloco px-3.5 text-[13px] text-texto outline-none focus:bg-bloco-2';

  return (
    <Painel
      titulo={tr({ pt: 'Inscrever este aparelho', en: 'Enrol this device', zh: '注册本设备' })}
      descricao={tr({
        pt: 'Só a Direcção o faz, e faz uma vez. O servidor emite um testemunho que fica guardado no aparelho.',
        en: 'Only the Directorate does this, and only once. The server issues a token that stays on the device.',
        zh: '仅由管理层操作，且只需一次。服务器签发的令牌将保存在本设备上。',
      })}
    >
      <Grelha colunas={2}>
        <Campo rotulo={tr({ pt: 'Utilizador', en: 'User', zh: '用户' })}>
          <input
            value={utilizador}
            onChange={(e) => setUtilizador(e.target.value)}
            className={controlo}
          />
        </Campo>
        <Campo rotulo={tr({ pt: 'Palavra-passe', en: 'Password', zh: '密码' })}>
          <input
            type="password"
            value={palavraPasse}
            onChange={(e) => setPalavraPasse(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void submeter()}
            className={controlo}
          />
        </Campo>
      </Grelha>

      {erro && <p className="mt-3 text-[12.5px] text-vermelho">{erro}</p>}

      <div className="mt-4">
        <Botao variante="primario" onClick={submeter} disabled={aEntrar || !palavraPasse}>
          {tr({ pt: 'Entrar', en: 'Sign in', zh: '登录' })}
        </Botao>
      </div>
    </Painel>
  );
}
