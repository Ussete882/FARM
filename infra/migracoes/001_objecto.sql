-- ============================================================================
-- BASTET — o objecto canónico (§2.3)
--
-- «Todos os objectos do sistema partilham o mesmo esqueleto. É isto que permite
-- que o mesmo motor de auditoria, de pesquisa e de histórico sirva o sistema
-- inteiro.»
--
-- O esquema lê isso à letra: uma tabela, com o esqueleto em colunas e os campos
-- próprios de cada tipo em `dados`. Um talhão, um trabalhador, uma ordem de
-- trabalho e um lote são a mesma linha com `tipo` diferente.
--
-- A alternativa — uma tabela por entidade — daria dezanove tabelas com dezanove
-- cópias das mesmas doze colunas, e dezanove sítios onde o histórico podia ser
-- implementado de maneira ligeiramente diferente. A este volume, o custo de
-- consultar `jsonb` é nenhum e a coerência vale tudo.
-- ============================================================================

create table objecto (
  id            text primary key,
  -- R4: o código é imutável. Nunca há um `update` que lhe toque.
  codigo        text        not null unique,
  designacao    text        not null,
  tipo          text        not null,
  estado        text        not null,
  -- §2.3: pessoa responsável, nunca uma equipa nem um cargo vago.
  dono          text        not null,

  criado_em     date        not null,
  criado_por    text        not null,
  alterado_em   date        not null,
  alterado_por  text        not null,
  -- Bloqueio optimista. O cliente envia a versão que leu; se não bater certo,
  -- a escrita é recusada em vez de sobrepor o trabalho de outra pessoa.
  versao        integer     not null check (versao >= 1),

  notas         text,
  -- §24.5: ninguém apaga. Um registo corrigido fica anulado, com motivo, e o
  -- substituto aponta para ele. Os dois continuam visíveis.
  anulado       jsonb,
  relacoes      jsonb       not null default '[]'::jsonb,
  historico     jsonb       not null default '[]'::jsonb,
  anexos        jsonb       not null default '[]'::jsonb,
  -- Campos próprios do tipo: área e declive num talhão, presença numa jorna.
  dados         jsonb       not null default '{}'::jsonb,

  -- Cursor de leitura para a sincronização. Ver a nota no `trigger` abaixo.
  sequencia     bigint      not null,
  actualizado   timestamptz not null default now()
);

comment on table objecto is
  'Esqueleto canónico do §2.3. Uma linha por objecto, seja qual for o tipo.';

-- ----------------------------------------------------------------------------
-- O cursor da sincronização
--
-- Um `bigserial` não serve: só avança no `insert`, e uma alteração passaria
-- despercebida a quem lê por cursor — um telemóvel que sincronizasse a seguir
-- nunca veria a alteração. A sequência é carimbada em `insert` e em `update`.
-- ----------------------------------------------------------------------------

create sequence seq_objecto;

create function carimbar_sequencia() returns trigger as $$
begin
  new.sequencia := nextval('seq_objecto');
  new.actualizado := now();
  return new;
end;
$$ language plpgsql;

create trigger objecto_carimbar
  before insert or update on objecto
  for each row execute function carimbar_sequencia();

-- ----------------------------------------------------------------------------
-- R4 em guarda na própria base
--
-- O núcleo já recusa alterar o código em `alterar()`, mas o núcleo é código e
-- código contorna-se. A base não.
-- ----------------------------------------------------------------------------

create function recusar_mudanca_de_codigo() returns trigger as $$
begin
  if new.codigo is distinct from old.codigo then
    raise exception
      'O código é imutável (R4): tentativa de mudar % para %.', old.codigo, new.codigo;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger objecto_codigo_imutavel
  before update on objecto
  for each row execute function recusar_mudanca_de_codigo();

-- ----------------------------------------------------------------------------
-- Índices
-- ----------------------------------------------------------------------------

create index objecto_tipo_idx      on objecto (tipo);
create index objecto_sequencia_idx on objecto (sequencia);
create index objecto_dono_idx      on objecto (dono);
create index objecto_estado_idx    on objecto (tipo, estado);
-- Perguntas sobre campos próprios do tipo: «que jornas deste trabalhador»,
-- «que pesagens deste talhão».
create index objecto_dados_idx     on objecto using gin (dados jsonb_path_ops);
