# BASTET

Sistema operativo de gestão da **LHF-Foundation**, instanciado no Projecto A —
**Farma Alcinda**, Vanduzi, Manica.

Esta é a **Fase 1** do faseamento do próprio documento (§26.1): M1 Cadastro
territorial e agronómico, M2 Operações de campo, M3 Pessoas e assiduidade, mais
o painel diário do chefe de turma. Corre sem servidor, com persistência local
em IndexedDB, em **português, inglês e mandarim**.

## Arrancar

```bash
npm install && npm run dev
```

O cliente sozinho funciona: semeia a base local com os dados da Farma Alcinda e
escreve no IndexedDB. Para o servidor:

```bash
npm run bd:subir && npm run bd:migrar && npm run semear --workspace @bastet/api
npm run dev:api
```

A Direcção entra em *Governação · Sincronização* com `DIR-01` e a palavra-passe
de `BASTET_PALAVRA_PASSE` (`alcinda`, em desenvolvimento).

```bash
npm run lint    # tsc --noEmit nos três workspaces
npm test        # 73 testes do núcleo, 7 de integração
npm run build
```

## Como está arrumado

| | |
|---|---|
| `packages/nucleo` | Modelo canónico e motor de regras. Puro: sem React, sem Dexie, sem rede. |
| `apps/web` | Cliente. Funciona sem rede e sincroniza quando houver sinal. |
| `apps/api` | Servidor. Corre **o mesmo** motor de regras, sobre PostgreSQL. |
| `infra` | Postgres em Docker e as migrações. |

O motor de regras não está duplicado: é um pacote, importado pelos dois lados.
Cada escrita que sai de um aparelho declara a versão dele — um telemóvel a
correr regras antigas é um telemóvel que não grava.

## Estado

| | |
|---|---|
| Ecrãs | 15 |
| Formulários que gravam | 9 |
| Idiomas | 3 — português, inglês, 中文 |
| Testes do motor de regras | 68 |

O sistema faz o ciclo completo numa cadeia só: **cria o talhão → emite a ordem
de trabalho → regista a folha de presença e a pesagem → o indicador muda → a
excepção aparece no painel diário.**

### Os nove formulários

| | | |
|---|---|---|
| **F-01** | Ficha de talhão | Criar e alterar, com histórico |
| **F-02** | Ficha de árvore | Amostra permanente e inventário |
| **F-03** | Admissão de trabalhador | V02 a V29 a bloquear na entrada |
| **F-05** | Relatório diário de campo | Cronometrado contra os 3 min do §25 |
| **F-06** | Folha de presença | A equipa inteira, numa transacção |
| **F-07** | Pesagem de colheita | O registo primário da produção |
| **F-12** | Monitorização fitossanitária | Contagem contra limiar, com decisão |
| **F-13** | Observação de campo | O que nenhum formulário periódico previu |
| **E-10** | Ordem de trabalho | O plano, sem o qual a V23 recusa a operação |

## O que está aqui

| Camada | Onde | O que faz |
|---|---|---|
| Idiomas | `src/i18n/` | Tipo `T`, contexto, selector, rótulos comuns |
| Domínio | `src/dominio/` | Objecto canónico (§2.3), estados (§2.4), unidades e bases (§5.3), códigos (§6.2), catálogo de indicadores (§10), parâmetros legais versionados (§19.2) |
| Regras | `src/regras/` | Cinco campos (R2), plano contra execução (§5.2), semáforo (§9.3), validações V02–V29 e avisos W01–W11 (§8), imutabilidade e correcção (§24.5). Puro e trilingue |
| Dados | `src/dados/` | Dexie, consultas do grafo (§2.2), escrita, semente da Farma Alcinda |
| Desenho | `src/design/` | Tokens, `Formulario`, `FichaObjecto`, `CartaoMetrica`, tabela, semáforo, gráfico de área |
| Módulos | `src/modulos/` | M1, M2, M3, painéis e governação |

O motor de regras é puro e testado: `src/regras/regras.test.ts`. Não depende de
React nem de Dexie — passa para o servidor sem alterações.

## As decisões que este código toma

**Não existe `number` num campo de quantidade.** O tipo `Quantidade` transporta
sempre unidade e, quando aplicável, base de medida. `8%` de humidade em noz e
`8%` em miolo são coisas diferentes, e o tipo impede escrever a segunda como a
primeira (R3, §5.3).

**Nenhum número derivado tem campo.** O peso líquido é bruto menos tara. O
índice fitossanitário é a contagem sobre as plantas amostradas. O custo
orçamentado são as jornas vezes o custo-dia da própria equipa. Um número que
se possa escrever à mão é um número que se pode escrever mal.

**Nada é apagado.** Não há `delete` em `src/dados/escrever.ts`. A correcção
faz-se por `anularESubstituir`: o original fica anulado com motivo obrigatório,
o substituto guarda a relação, ambos ficam visíveis, e só o substituto conta
para indicadores (§24.5). A alteração de uma ficha escreve no histórico cada
campo mudado, com o valor anterior e o novo.

**Cinzento não é neutro.** Um indicador sem dados aparece a cinzento e o
cinzento é tratado como falha de processo — o registo devido não foi entregue —
e não como ausência de problema (§9.3). Distingue-se de «meta por fixar», que é
falha de governação e tem outro dono.

**Os parâmetros legais não estão no código.** `src/dominio/parametros.ts` é uma
tabela versionada com data de efeito, fonte e estado de confirmação. Uma jorna
de Maio de 2025 é julgada contra as horas e os acréscimos que vigoravam em Maio
de 2025, e não contra os de hoje (§19.2).

**As divergências ficam à vista.** O ecrã *Pendências* mostra por resolver
aquilo que o documento assinala por resolver — três leituras do quadro de
pessoal, a meta de moringa sem suporte na literatura, a dotação de rega — em
vez de escolher um valor em silêncio.

**A remuneração é dado de gestão, não de conformidade.** Alimenta o custo de
mão-de-obra por hectare e por quilograma (K-PES-01 e K-PES-02) e o orçamento
das ordens de trabalho. O sistema não verifica mínimos salariais: essa é
matéria que a Direcção trata directamente com as pessoas, fora daqui.

**O idioma não é um ficheiro de traduções à parte.** Cada texto é um objecto
com as três línguas juntas — `{ pt, en, zh }` — e o tipo `T` exige as três. Um
texto por traduzir é um erro de compilação, não uma chave em falta que só
aparece em produção. E quem altera a frase portuguesa vê as outras duas na
mesma linha, em vez de as deixar para trás.

**O motor de regras continua puro.** Uma constatação transporta o `T` das três
línguas, não uma frase já resolvida: quem escolhe a língua é o ecrã. É isso que
permite ao motor correr igual no servidor, sem saber quem o está a ler.

**O número muda com a língua.** «7 072,00» em português, «7,072.00» em inglês e
em chinês; «01/09/2026», «01 Sep 2026», «2026年9月1日». Um número mal lido é um
número errado, e a convenção decimal não é decoração. Já o código nunca muda:
`FA-B01-T03`, `K-PRD-03` e `kg` são os mesmos nas três (R4).

**Os formulários de campo são cronometrados.** O F-05 e o F-07 mostram um
contador contra os 3 minutos do §25. Se passar, o formulário está errado, não
quem o preenche. Os formulários de secretária — admissão, cadastro, ordem de
trabalho — não têm cronómetro, porque a regra não se lhes aplica.

## Desenho

Tela cinzenta, cartões brancos, hierarquia pela superfície. A cor aparece de
duas maneiras e só duas: **um cartão preenchido no indicador que importa**, e
**pastilhas de estado**. Fora disso não há cor — é o que faz o semáforo do §9.3
continuar a significar alguma coisa.

## O que a semente diz

107,8 ha plantados de 700, 10 780 árvores a 10 × 10 m, campanha 2025/26 medida
em 88 fichas de pesagem. Realização do potencial em 29,5% contra os 24,9% do
diagnóstico de partida. Quadro de 43 pessoas, das quais 4 ainda sem inscrição
no INSS e 5 sem apólice de acidentes.

Estes números são para ser olhados, não para impressionar.

## O que se segue

**Bloco 3 — Fase 2 do documento, «Digitalizar».** M5 rastreabilidade primeiro
(formação de lote, secagem, transformação com balanço de massa, análises,
libertação — é onde a R6 se cumpre), depois M7 Governação e M4 Armazém.

Critério de saída, do próprio documento: **o primeiro lote rastreável até
talhão e data**.

## Fora do âmbito

M8 Financeiro · M9 Comercial · M11 Inteligência. São Fase 3 e 4; construí-los
agora seria automatizar o caos, que é o aviso do §26.1.

E há uma coisa que não é código: as **seis pendências**. A divergência de
40/41/52 pessoas no quadro, a natureza jurídica dos sazonais, a meta de moringa
sem suporte na literatura, a dotação de rega, o inventário de árvores por
fazer. O sistema mostra-as; resolvê-las é decisão do Conselho.
