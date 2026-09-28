-- ============================================================================
-- BASTET — quem entra, e com que poderes (§24.5)
--
-- A Farma Alcinda tem 22 pessoas e **um** telemóvel com aplicação. Isto não é
-- um sistema de 22 contas: são duas ou três, e um aparelho inscrito.
--
-- O PIN de quatro dígitos tem dez mil combinações. Autenticar um servidor com
-- isso seria um buraco, por isso o PIN **não autentica o servidor**: desbloqueia
-- a aplicação no aparelho. Quem fala com o servidor é o testemunho de
-- dispositivo, que a Direcção emitiu uma vez, autenticada por palavra-passe, e
-- que a Direcção pode revogar se o telemóvel se perder.
-- ============================================================================

create table utilizador (
  id                  text primary key,
  nome                text        not null,
  -- Papel do §24.5. A matriz de poderes vive no núcleo, para o cliente poder
  -- esconder o que esta pessoa não pode fazer em vez de a deixar tentar.
  papel               text        not null,
  -- Código do trabalhador, quando é um. A Direcção não consta do quadro.
  trabalhador         text,
  -- Só quem entra pelo navegador. O aparelho de campo não tem.
  palavra_passe_hash  text,
  activo              boolean     not null default true,
  criado              timestamptz not null default now()
);

comment on column utilizador.palavra_passe_hash is
  'argon2id. Nulo em utilizadores que só entram por aparelho inscrito.';

-- ----------------------------------------------------------------------------
-- Aparelhos inscritos
-- ----------------------------------------------------------------------------

create table aparelho (
  id               text primary key,
  designacao       text        not null,
  utilizador       text        not null references utilizador (id),
  inscrito_por     text        not null references utilizador (id),
  inscrito         timestamptz not null default now(),
  ultimo_contacto  timestamptz,
  -- Revogar não apaga: o aparelho continua no registo, com a data em que
  -- deixou de valer. Saber que um telemóvel existiu e foi revogado é
  -- informação; apagá-lo é perdê-la (§24.5).
  revogado         timestamptz
);

-- ----------------------------------------------------------------------------
-- Sessões
--
-- Uma sessão de navegador dura horas; uma de aparelho dura um ano, porque o
-- telemóvel pode passar uma semana sem rede e obrigá-lo a autenticar de novo
-- no meio de um campo seria o mesmo que o desligar.
-- ----------------------------------------------------------------------------

create table sessao (
  testemunho_hash  text primary key,
  utilizador       text        not null references utilizador (id),
  aparelho         text        references aparelho (id),
  criada           timestamptz not null default now(),
  expira           timestamptz not null,
  terminada        timestamptz
);

create index sessao_utilizador_idx on sessao (utilizador);
create index sessao_aparelho_idx   on sessao (aparelho);

-- ----------------------------------------------------------------------------
-- Recepção — o que cada aparelho enviou, aceite ou recusado
--
-- O histórico do objecto diz o que mudou. Isto diz **o que chegou**, de que
-- aparelho, a correr que versão das regras, e se foi aceite. Quando um número
-- estiver errado daqui a seis meses, é aqui que se vê por onde entrou.
-- ----------------------------------------------------------------------------

create table recepcao (
  id             bigserial primary key,
  utilizador     text        not null,
  aparelho       text,
  versao_nucleo  text        not null,
  escrita        text        not null,
  objecto_codigo text        not null,
  aceite         boolean     not null,
  motivo         text,
  constatacoes   jsonb,
  recebido       timestamptz not null default now()
);

create index recepcao_objecto_idx  on recepcao (objecto_codigo);
create index recepcao_recebido_idx on recepcao (recebido desc);
