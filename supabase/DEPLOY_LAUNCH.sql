-- =====================================================================
-- MEME ARENA 3D — PATCH ÚNICO DE LANÇAMENTO (4 de outubro de 2026)
--
-- Pré-requisito: supabase/schema.sql já aplicado no projeto.
-- Execute TODO este arquivo uma vez no SQL Editor do Supabase.
-- É seguro reaplicar. Ele instala mercado/multiplayer, exclusão de conta,
-- moderação, anti-trapaça, remove somente Convidado#### legados e transfere
-- Caixas 67, forja e drops de chefe para funções autoritativas do servidor.
-- =====================================================================


-- ======================== INÍCIO: supabase/schema_multiplayer.sql ========================
-- ============================================================
-- MEME ARENA 3D — ETAPA 3: multiplayer + mercado
-- Cole TUDO isto no SQL Editor do Supabase e clique em "Run".
-- Pode rodar quantas vezes quiser, não quebra nada.
-- (Rode DEPOIS do schema.sql da Etapa 1.)
-- ============================================================

-- ------------------------------------------------------------------
-- SALAS: lista pública de partidas abertas (o jogo em si roda por
-- Realtime; esta tabela é só o "mural" para achar sala sem código).
-- ------------------------------------------------------------------
-- carimbo de atualizacao (normalmente vem do schema.sql da Etapa 1;
-- recriado aqui para este arquivo rodar sozinho sem erro)
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.rooms (
  code        text primary key,
  host_id     uuid not null references auth.users (id) on delete cascade,
  host_name   text not null,
  mode        text not null default 'coop',        -- 'coop' | 'pvp'
  map         text not null default 'arena',
  diff        text not null default 'normal',
  players     int  not null default 1,
  max_players int  not null default 4,
  state       text not null default 'lobby',       -- 'lobby' | 'playing'
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Valida novas salas mesmo quando alguém chama a API REST sem usar o cliente.
alter table public.rooms drop constraint if exists rooms_code_format;
alter table public.rooms add constraint rooms_code_format check (code ~ '^[A-Z]{4}$') not valid;
alter table public.rooms drop constraint if exists rooms_host_name_format;
alter table public.rooms add constraint rooms_host_name_format check (host_name ~ '^[A-Za-z0-9_]{3,16}$') not valid;
alter table public.rooms drop constraint if exists rooms_values_valid;
alter table public.rooms add constraint rooms_values_valid check (
  mode in ('coop','pvp') and map in ('arena','ohio','praia','esgoto','servidor') and
  diff in ('easy','norm','normal','hard','brain') and state in ('lobby','playing') and
  players between 1 and 4 and max_players between 1 and 4 and players <= max_players
) not valid;

create index if not exists rooms_updated_idx on public.rooms (updated_at desc);

drop trigger if exists rooms_touch on public.rooms;
create trigger rooms_touch before update on public.rooms
  for each row execute function public.touch_updated_at();

alter table public.rooms enable row level security;

drop policy if exists "salas leitura" on public.rooms;
create policy "salas leitura" on public.rooms for select using (true);

drop policy if exists "host cria sala" on public.rooms;
create policy "host cria sala" on public.rooms for insert
  with check (auth.uid() = host_id);

drop policy if exists "host atualiza sala" on public.rooms;
create policy "host atualiza sala" on public.rooms for update
  using (auth.uid() = host_id) with check (auth.uid() = host_id);

drop policy if exists "host apaga sala" on public.rooms;
create policy "host apaga sala" on public.rooms for delete
  using (auth.uid() = host_id);

-- faxina: some com salas paradas há mais de 15 minutos
create or replace function public.clean_rooms()
returns void language sql security definer set search_path = public as $$
  delete from public.rooms where updated_at < now() - interval '15 minutes';
$$;
revoke all on function public.clean_rooms() from public, anon;
grant execute on function public.clean_rooms() to authenticated;

-- ------------------------------------------------------------------
-- MERCADO: anúncios de itens à venda por moedas
-- ------------------------------------------------------------------
create table if not exists public.market_listings (
  id          bigserial primary key,
  seller_id   uuid not null references auth.users (id) on delete cascade,
  seller_name text not null,
  item        text not null,            -- 'skin:gatosus' | 'weapon:laser' | 'armor:pixel'
  price       int  not null,
  sold        boolean not null default false,
  buyer_name  text,
  created_at  timestamptz not null default now()
);

-- Versões antigas usavam um teto global de 1.000.000. Agora a tabela só
-- exige preço positivo; a função market_sell valida a faixa do item abaixo.
alter table public.market_listings drop constraint if exists market_listings_price_check;
alter table public.market_listings drop constraint if exists market_listings_price_positive;
alter table public.market_listings
  add constraint market_listings_price_positive check (price > 0);

-- Limites individuais de revenda. O cliente mostra a mesma faixa, mas esta
-- tabela é a autoridade: editar o JavaScript não permite anunciar fora dela.
create table if not exists public.market_price_limits (
  item       text primary key,
  min_price  int not null check (min_price > 0),
  max_price  int not null check (max_price >= min_price),
  tradable   boolean not null default true
);

insert into public.market_price_limits (item, min_price, max_price, tradable) values
  ('skin:cactopraia',       25,    300, false),
  ('skin:galinhacaos',     225,   2700, true),
  ('skin:gatosus',         400,   6400, true),
  ('skin:peixefora',       550,   8800, true),
  ('skin:pombocorreio',    700,  11200, true),
  ('skin:cogubug',         850,  13600, true),
  ('skin:magogeleia',     1125,  27000, true),
  ('skin:yetibolso',      1300,  31200, true),
  ('skin:coelhomaromba',  1700,  40800, true),
  ('skin:sapopix',        1900,  45600, true),
  ('skin:alpacarei',      2125,  51000, true),
  ('skin:dinocoach',      2375,  76000, true),
  ('skin:etbombado',      2625,  84000, true),
  ('skin:ninjameme',      2875,  92000, true),
  ('skin:lulalunar',      3625, 116000, true),
  ('skin:monstroboleto',  4000, 128000, true),
  ('skin:reicogumelo',    4500, 144000, true),
  ('skin:passaropistola', 5000, 200000, true),
  ('skin:dragaocaos',     6000, 240000, true),
  ('skin:cranio',         7000, 280000, true),
  ('skin:ouricoradio',    1050,  16800, true),
  ('skin:abelhachefe',    2175,  52200, true),
  ('skin:hywirl',         4425, 141600, true),
  ('skin:glubturbo',      7175, 287000, true),
  ('armor:hoodie',        25,    300, false),
  ('armor:cardboard',    225,   2700, true),
  ('armor:pixel',        650,  10400, true),
  ('armor:neon',        1550,  37200, true),
  ('armor:sigma',       2750,  88000, true),
  ('armor:chadplate',   5500, 220000, true),
  ('armor:protocol67',  2670,  46700, true),
  ('armor:orbit6',       900,  14400, true),
  ('armor:prism7',      3925, 125600, true),
  ('weapon:laser',       113,   1350, false),
  ('weapon:shot',        400,   6400, true),
  ('weapon:boomerang',   725,  11600, true),
  ('weapon:rpg',         950,  22800, true),
  ('weapon:gravity6',   1675,  40200, true),
  ('weapon:mini',       1875,  60000, true),
  ('weapon:prism7',     3175, 101600, true),
  ('weapon:rail',       3500, 140000, true),
  ('weapon:pulse67',    3670,  67000, true),
  ('ability:repulse6',  1050,  16800, true),
  ('ability:blink7',    2100,  50400, true),
  ('ability:overclock67',4675,149600, true)
on conflict (item) do update set
  min_price = excluded.min_price,
  max_price = excluded.max_price,
  tradable = excluded.tradable;

delete from public.market_price_limits where item in (
  'skin:chill','skin:hacker','skin:doge','skin:rizzler','skin:sigma',
  'skin:clown','skin:ghost','skin:demon','skin:gigachad','skin:king',
  'skin:sixtyseven','skin:sixorbit','skin:sevenbreak','skin:duo67',
  'skin:rookie','skin:gamer','skin:lumber','skin:striker','skin:survivor',
  'skin:scout','skin:sheriff','skin:professor','skin:dojo','skin:orcceo',
  'skin:hunter','skin:bogorc','skin:executive','skin:captain','skin:crash',
  'skin:mechred','skin:mechviolet','skin:shadow'
);

alter table public.market_price_limits enable row level security;
drop policy if exists "limites do mercado leitura" on public.market_price_limits;
create policy "limites do mercado leitura" on public.market_price_limits
  for select using (true);
grant select on public.market_price_limits to anon, authenticated;

create index if not exists market_open_idx on public.market_listings (sold, created_at desc);

alter table public.market_listings enable row level security;

drop policy if exists "mercado leitura" on public.market_listings;
create policy "mercado leitura" on public.market_listings for select using (true);

-- Escrita direta é proibida. Somente as RPCs security definer abaixo podem
-- inserir/remover anúncios depois de validar inventário e faixa de preço.
drop policy if exists "dono anuncia" on public.market_listings;
drop policy if exists "dono cancela" on public.market_listings;

-- ------------------------------------------------------------------
-- PRESENTES: itens enviados de um jogador para outro
-- ------------------------------------------------------------------
create table if not exists public.gifts (
  id         bigserial primary key,
  from_id    uuid not null references auth.users (id) on delete cascade,
  from_name  text not null,
  to_id      uuid not null references auth.users (id) on delete cascade,
  item       text not null,
  coins      int  not null default 0 check (coins >= 0),
  note       text,
  claimed    boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists gifts_to_idx on public.gifts (to_id, claimed);

alter table public.gifts enable row level security;

drop policy if exists "ve meus presentes" on public.gifts;
create policy "ve meus presentes" on public.gifts for select
  using (auth.uid() = to_id or auth.uid() = from_id);

-- ------------------------------------------------------------------
-- REGRAS DO JOGO NO SERVIDOR (impedem trapaça: tudo atômico)
-- ------------------------------------------------------------------

-- Anunciar um item: só se ele estiver mesmo no inventário; sai do inventário na hora.
create or replace function public.market_sell(p_item text, p_price int)
returns json language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid(); inv jsonb; equip jsonb; nome text;
  minimo int; maximo int; pode_vender boolean;
begin
  /* operação confiável: roda dentro do banco, a trava anti-trapaça libera */
  perform set_config('app.trusted', 'on', true);
  if me is null then return json_build_object('error','Sem sessão.'); end if;
  select min_price, max_price, tradable into minimo, maximo, pode_vender
    from public.market_price_limits where item = p_item;
  if minimo is null then return json_build_object('error','Item não reconhecido pelo mercado.'); end if;
  if not pode_vender then return json_build_object('error','Itens iniciais não podem ser vendidos.'); end if;
  if p_price is null or p_price < minimo or p_price > maximo then
    return json_build_object('error', format('Este item aceita preços de %s a %s moedas.', minimo, maximo));
  end if;
  select inventory, username, equipped into inv, nome, equip from public.profiles where id = me;
  if inv is null then return json_build_object('error','Perfil não encontrado.'); end if;
  if not (inv ? p_item) then return json_build_object('error','Você não tem esse item.'); end if;
  if (split_part(p_item, ':', 1) = 'skin' and coalesce(equip->>'skin', '') = split_part(p_item, ':', 2))
     or (split_part(p_item, ':', 1) = 'armor' and coalesce(equip->>'armor', '') = split_part(p_item, ':', 2))
     or (split_part(p_item, ':', 1) = 'ability' and coalesce(equip->>'ability', '') = split_part(p_item, ':', 2))
     or (split_part(p_item, ':', 1) = 'weapon' and coalesce(equip->'weapons', '[]'::jsonb) ? split_part(p_item, ':', 2)) then
    return json_build_object('error','Desequipe o item antes de vender.');
  end if;
  if (select count(*) from public.market_listings
        where seller_id = me and sold = false) >= 6 then
    return json_build_object('error','Você já tem 6 anúncios abertos.');
  end if;

  update public.profiles
     set inventory = (select coalesce(jsonb_agg(v), '[]'::jsonb)
                        from jsonb_array_elements(inventory) v
                       where v::text <> to_jsonb(p_item)::text)
   where id = me;

  insert into public.market_listings (seller_id, seller_name, item, price)
  values (me, nome, p_item, p_price);

  return json_build_object('ok', true);
end;
$$;

-- Cancelar anúncio: devolve o item para o inventário.
create or replace function public.market_cancel(p_id bigint)
returns json language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); it text;
begin
  /* operação confiável: roda dentro do banco, a trava anti-trapaça libera */
  perform set_config('app.trusted', 'on', true);
  if me is null then return json_build_object('error','Sem sessão.'); end if;
  delete from public.market_listings
   where id = p_id and seller_id = me and sold = false
   returning item into it;
  if it is null then return json_build_object('error','Anúncio não encontrado.'); end if;
  update public.profiles set inventory = inventory || to_jsonb(it) where id = me;
  return json_build_object('ok', true);
end;
$$;

-- Comprar: tira moedas do comprador, dá o item, paga o vendedor. Tudo junto.
create or replace function public.market_buy(p_id bigint)
returns json language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); l record; meu_saldo int; meu_inv jsonb; meu_nome text;
begin
  /* operação confiável: roda dentro do banco, a trava anti-trapaça libera */
  perform set_config('app.trusted', 'on', true);
  if me is null then return json_build_object('error','Sem sessão.'); end if;

  select * into l from public.market_listings
   where id = p_id and sold = false for update;
  if l is null then return json_build_object('error','Esse anúncio não existe mais.'); end if;
  if l.seller_id = me then return json_build_object('error','Esse anúncio é seu.'); end if;

  select coins, inventory, username into meu_saldo, meu_inv, meu_nome
    from public.profiles where id = me for update;
  if meu_saldo < l.price then return json_build_object('error','Moedas insuficientes.'); end if;
  if meu_inv ? l.item then return json_build_object('error','Você já tem esse item.'); end if;

  update public.profiles
     set coins = coins - l.price, inventory = inventory || to_jsonb(l.item)
   where id = me;
  update public.profiles set coins = coins + l.price where id = l.seller_id;
  update public.market_listings
     set sold = true, buyer_name = meu_nome where id = l.id;

  return json_build_object('ok', true, 'item', l.item, 'price', l.price);
end;
$$;

-- Presentear outro jogador pelo nome: item sai de quem envia e entra em quem recebe.
create or replace function public.send_gift(p_to text, p_item text, p_coins int default 0, p_note text default null)
returns json language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); alvo uuid; meu_nome text; inv jsonb; saldo int; inv_alvo jsonb;
begin
  /* operação confiável: roda dentro do banco, a trava anti-trapaça libera */
  perform set_config('app.trusted', 'on', true);
  if me is null then return json_build_object('error','Sem sessão.'); end if;
  select id, inventory into alvo, inv_alvo from public.profiles where lower(username) = lower(p_to);
  if alvo is null then return json_build_object('error','Jogador não encontrado.'); end if;
  if alvo = me then return json_build_object('error','Você não pode presentear você mesmo.'); end if;

  select inventory, coins, username into inv, saldo, meu_nome from public.profiles where id = me for update;
  if p_coins > 0 and saldo < p_coins then return json_build_object('error','Moedas insuficientes.'); end if;
  if p_item is not null and p_item <> '' then
    if not (inv ? p_item) then return json_build_object('error','Você não tem esse item.'); end if;
    if inv_alvo ? p_item then return json_build_object('error','Esse jogador já tem esse item.'); end if;
    update public.profiles
       set inventory = (select coalesce(jsonb_agg(v), '[]'::jsonb)
                          from jsonb_array_elements(inventory) v
                         where v::text <> to_jsonb(p_item)::text)
     where id = me;
    update public.profiles set inventory = inventory || to_jsonb(p_item) where id = alvo;
  end if;

  if p_coins > 0 then
    update public.profiles set coins = coins - p_coins where id = me;
    update public.profiles set coins = coins + p_coins where id = alvo;
  end if;

  insert into public.gifts (from_id, from_name, to_id, item, coins, note, claimed)
  values (me, meu_nome, alvo, coalesce(p_item,''), coalesce(p_coins,0), p_note, true);

  return json_build_object('ok', true);
end;
$$;

grant execute on function public.market_sell(text,int)  to authenticated;
grant execute on function public.market_cancel(bigint)  to authenticated;
grant execute on function public.market_buy(bigint)     to authenticated;
grant execute on function public.send_gift(text,text,int,text) to authenticated;


-- Lançamento: privilégios mínimos das funções com autoridade.
revoke all on function public.clean_rooms() from public, anon;
grant execute on function public.clean_rooms() to authenticated;
revoke all on function public.market_sell(text,int) from public, anon;
revoke all on function public.market_cancel(bigint) from public, anon;
revoke all on function public.market_buy(bigint) from public, anon;
revoke all on function public.send_gift(text,text,int,text) from public, anon;
grant execute on function public.market_sell(text,int) to authenticated;
grant execute on function public.market_cancel(bigint) to authenticated;
grant execute on function public.market_buy(bigint) to authenticated;
grant execute on function public.send_gift(text,text,int,text) to authenticated;

-- ========================== FIM: supabase/schema_multiplayer.sql ==========================

-- ======================== INÍCIO: supabase/schema_conta.sql ========================
-- ============================================================
-- MEME ARENA 3D — exclusão de conta pelo próprio jogador
-- Exigência das lojas de aplicativos (Microsoft Store, Google Play).
-- Cole no SQL Editor do Supabase e clique em "Run".
-- Pode rodar quantas vezes quiser.
-- ============================================================

create or replace function public.delete_my_account()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    return jsonb_build_object('error', 'Você precisa estar conectado.');
  end if;

  -- anúncios do mercado (as compras guardam só o nome público do comprador)
  begin
    delete from public.market_listings where seller_id = me;
  exception when undefined_table then null;
  end;

  -- presentes enviados e recebidos
  begin
    delete from public.gifts where from_id = me or to_id = me;
  exception when undefined_table then null;
  end;

  -- salas das quais a pessoa era anfitriã
  begin
    delete from public.rooms where host_id = me;
  exception when undefined_table then null;
  end;

  -- perfil (nível, moedas, inventário, estatísticas)
  delete from public.profiles where id = me;

  -- a conta de login em si
  delete from auth.users where id = me;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ========================== FIM: supabase/schema_conta.sql ==========================

-- ======================== INÍCIO: supabase/schema_moderacao.sql ========================
-- ============================================================
--  MEME ARENA 3D — moderação do chat
--  Tabela de denúncias + função para registrar.
--  Pode rodar quantas vezes quiser.
-- ============================================================

create table if not exists public.reports (
  id          bigserial primary key,
  reporter_id uuid references auth.users(id) on delete set null,
  alvo_nome   text not null,
  motivo      text not null,
  trecho      text,
  created_at  timestamptz not null default now()
);

create index if not exists reports_alvo_idx on public.reports (lower(alvo_nome), created_at desc);

alter table public.reports enable row level security;

-- Ninguém lê as denúncias pelo jogo: só você, pelo painel do Supabase.
drop policy if exists reports_sem_leitura on public.reports;
create policy reports_sem_leitura on public.reports
  for select using (false);

-- ------------------------------------------------------------
-- Registrar denúncia.
-- Trava anti-spam: no máximo 20 denúncias por hora por pessoa,
-- e uma denúncia por alvo a cada 10 minutos.
-- ------------------------------------------------------------
create or replace function public.report_player(p_nome text, p_motivo text, p_trecho text default null)
returns json language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); n int;
begin
  if me is null then return json_build_object('error','Sem sessão.'); end if;
  if p_nome is null or trim(p_nome) !~ '^[A-Za-z0-9_]{3,16}$' then
    return json_build_object('error','Alvo inválido.');
  end if;
  if coalesce(p_motivo,'') not in ('linguagem','assedio','odio','trapaca','spam','outro') then
    p_motivo := 'outro';
  end if;

  select count(*) into n from public.reports
   where reporter_id = me and created_at > now() - interval '1 hour';
  if n >= 20 then return json_build_object('error','Muitas denúncias. Tente mais tarde.'); end if;

  select count(*) into n from public.reports
   where reporter_id = me
     and lower(alvo_nome) = lower(p_nome)
     and created_at > now() - interval '10 minutes';
  if n >= 1 then return json_build_object('ok', true, 'nota','Você já denunciou esse jogador agora há pouco.'); end if;

  insert into public.reports (reporter_id, alvo_nome, motivo, trecho)
  values (me, left(p_nome, 40), left(coalesce(p_motivo,'outro'), 40), left(coalesce(p_trecho,''), 200));

  return json_build_object('ok', true);
end;
$$;

revoke all on function public.report_player(text, text, text) from public, anon;
grant execute on function public.report_player(text, text, text) to authenticated;

-- ------------------------------------------------------------
-- Para você ver as denúncias: rode no SQL Editor do Supabase.
--
--   select alvo_nome, motivo, count(*) as vezes, max(created_at) as ultima
--     from public.reports
--    where created_at > now() - interval '30 days'
--    group by alvo_nome, motivo
--    order by vezes desc;
-- ------------------------------------------------------------

-- ========================== FIM: supabase/schema_moderacao.sql ==========================

-- ======================== INÍCIO: supabase/schema_antitrapaca.sql ========================
-- ============================================================
-- MEME ARENA 3D — travas anti-trapaça
--
-- O navegador não é confiável: qualquer jogador pode abrir o F12 e
-- mandar "ganhei 10 milhões de moedas". Estas regras ficam DENTRO do
-- banco, onde ninguém mexe, e conferem se o que chegou faz sentido.
--
-- A estratégia é CORTAR, não recusar: se o valor é absurdo, o banco
-- grava o máximo permitido em vez de dar erro. Assim um jogador
-- honesto com relógio errado ou internet ruim nunca perde progresso,
-- e o trapaceiro simplesmente não ganha nada.
--
-- Cole TUDO isto no SQL Editor do Supabase e clique em "Run".
-- Pode rodar quantas vezes quiser.
-- ============================================================

-- ------------------------------------------------------------------
-- Diário de suspeitas: serve para você ver quem anda tentando.
-- Só o próprio dono (e você, pelo painel) consegue ler.
-- ------------------------------------------------------------------
create table if not exists public.cheat_log (
  id         bigserial primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  username   text,
  motivo     text not null,
  pedido     jsonb,
  permitido  jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cheat_log_user_idx on public.cheat_log (user_id, created_at desc);

alter table public.cheat_log enable row level security;

drop policy if exists "dono le o proprio log" on public.cheat_log;
create policy "dono le o proprio log"
  on public.cheat_log for select
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------
-- Todo perfil nasce com o mesmo estado. Isso fecha o atalho de criar a conta
-- já com moedas, nível ou inventário forjados pela API REST.
-- ------------------------------------------------------------------
create or replace function public.normalize_profile_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('app.trusted',true),'')='on' then return new; end if;
  new.level := 1;
  new.xp := 0;
  new.coins := 600;
  new.inventory := '["skin:cactopraia","armor:hoodie"]'::jsonb;
  new.equipped := '{"skin":"cactopraia","armor":"hoodie","weapons":[],"ability":""}'::jsonb;
  new.stats := '{}'::jsonb;
  return new;
end;
$$;

drop trigger if exists profiles_normalize_insert on public.profiles;
create trigger profiles_normalize_insert before insert on public.profiles
  for each row execute function public.normalize_profile_insert();
revoke all on function public.normalize_profile_insert() from public,anon,authenticated;

-- ------------------------------------------------------------------
-- A trava principal
-- ------------------------------------------------------------------
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  segundos      numeric;   -- tempo desde o último salvamento
  ganho_moedas  int;
  ganho_xp      int;
  ganho_nivel   int;
  max_moedas    int;
  max_xp        int;
  novos_itens   int;
  motivos       text := '';
  pedido        jsonb;
begin
  -- ============================================================
  -- 0. PASSE LIVRE PARA O QUE VEM DE DENTRO DO BANCO
  -- Mercado e presentes rodam em funções protegidas que já conferem
  -- tudo. Elas marcam "app.trusted" para a trava não cortar uma venda
  -- grande ou um presente generoso, que são legítimos.
  -- ============================================================
  if coalesce(current_setting('app.trusted', true), '') = 'on' then
    return new;
  end if;

  -- quanto tempo passou desde o último save (mínimo 1s para evitar divisão estranha)
  segundos := greatest(1, extract(epoch from (now() - coalesce(old.updated_at, now()))));

  pedido := jsonb_build_object(
    'coins', new.coins, 'xp', new.xp, 'level', new.level,
    'itens', jsonb_array_length(coalesce(new.inventory, '[]'::jsonb))
  );

  -- ============================================================
  -- 1. MOEDAS
  -- A melhor partida possível dá ~6 mil moedas e dura uns 10 minutos.
  -- Liberamos 8 mil de folga + 60 por segundo decorrido, com teto de
  -- 200 mil por salvamento (para quem ficou offline muito tempo).
  -- Perder moedas (comprar algo) é sempre permitido.
  -- ============================================================
  ganho_moedas := new.coins - old.coins;
  max_moedas := least(200000, 8000 + (segundos * 60)::int);

  if ganho_moedas > max_moedas then
    motivos := motivos || format('moedas +%s (máx %s); ', ganho_moedas, max_moedas);
    new.coins := old.coins + max_moedas;
  end if;

  if new.coins < 0 then new.coins := 0; end if;

  -- ============================================================
  -- 2. EXPERIÊNCIA E NÍVEL
  -- O nível nunca cai e sobe no máximo 4 por salvamento. O teto do
  -- jogo é 60.
  -- ============================================================
  ganho_xp := new.xp - old.xp;
  max_xp := least(300000, 12000 + (segundos * 80)::int);

  if ganho_xp > max_xp then
    motivos := motivos || format('xp +%s (máx %s); ', ganho_xp, max_xp);
    new.xp := old.xp + max_xp;
  end if;

  if new.xp < 0 then new.xp := 0; end if;

  ganho_nivel := new.level - old.level;

  if new.level > 60 then
    motivos := motivos || format('nível %s acima do teto; ', new.level);
    new.level := 60;
  end if;

  if ganho_nivel > 4 then
    motivos := motivos || format('nível +%s de uma vez; ', ganho_nivel);
    new.level := old.level + 4;
  end if;

  if new.level < old.level then
    -- nível não volta atrás (evita zerar para burlar outras contas)
    new.level := old.level;
  end if;

  if new.level < 1 then new.level := 1; end if;

  -- ============================================================
  -- 3. INVENTÁRIO
  -- Numa jogada normal entram 1 ou 2 itens por vez (compra, presente,
  -- conquista). Mais de 6 de uma vez é sinal de mão na massa.
  -- O catálogo inteiro tem menos de 60 itens.
  -- ============================================================
  novos_itens := jsonb_array_length(coalesce(new.inventory, '[]'::jsonb))
               - jsonb_array_length(coalesce(old.inventory, '[]'::jsonb));

  if novos_itens > 6 then
    motivos := motivos || format('inventário +%s itens de uma vez; ', novos_itens);
    new.inventory := old.inventory;
  end if;

  if jsonb_array_length(coalesce(new.inventory, '[]'::jsonb)) > 80 then
    motivos := motivos || 'inventário maior que o catálogo; ';
    new.inventory := old.inventory;
  end if;

  -- ============================================================
  -- 4. ESTATÍSTICAS
  -- Elas só crescem. Se vier um número menor, foi adulteração ou
  -- um save antigo chegando atrasado: mantemos o maior dos dois.
  -- ============================================================
  if new.stats is not null and old.stats is not null then
    new.stats := new.stats
      || jsonb_build_object('kills',
           greatest(coalesce((new.stats->>'kills')::bigint, 0),
                    coalesce((old.stats->>'kills')::bigint, 0)))
      || jsonb_build_object('games',
           greatest(coalesce((new.stats->>'games')::bigint, 0),
                    coalesce((old.stats->>'games')::bigint, 0)))
      || jsonb_build_object('bosses',
           greatest(coalesce((new.stats->>'bosses')::bigint, 0),
                    coalesce((old.stats->>'bosses')::bigint, 0)))
      || jsonb_build_object('playtime',
           greatest(coalesce((new.stats->>'playtime')::bigint, 0),
                    coalesce((old.stats->>'playtime')::bigint, 0)));

    -- recorde de pontos: uma partida excepcional passa de 300 mil com
    -- dificuldade máxima; acima de 5 milhões não existe jogando limpo.
    if coalesce((new.stats->>'bestScore')::bigint, 0) > 5000000 then
      motivos := motivos || 'recorde de pontos impossível; ';
      new.stats := new.stats || jsonb_build_object('bestScore', coalesce(old.stats->'bestScore', '0'::jsonb));
    end if;

    -- a onda mais alta registrada é limitada: ninguém passa da 200
    if coalesce((new.stats->>'bestWave')::bigint, 0) > 200 then
      motivos := motivos || 'onda impossível; ';
      new.stats := new.stats || jsonb_build_object('bestWave', coalesce(old.stats->'bestWave', '0'::jsonb));
    end if;
  end if;

  -- ============================================================
  -- 5. O NOME NÃO MUDA
  -- Trocar de nome quebraria presentes, mercado e ranking.
  -- ============================================================
  if new.username is distinct from old.username then
    motivos := motivos || 'tentou trocar de nome; ';
    new.username := old.username;
  end if;

  -- ------------------------------------------------------------
  -- registro da suspeita
  -- ------------------------------------------------------------
  if motivos <> '' then
    insert into public.cheat_log (user_id, username, motivo, pedido, permitido)
    values (old.id, old.username, motivos, pedido,
            jsonb_build_object('coins', new.coins, 'xp', new.xp, 'level', new.level));
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ------------------------------------------------------------------
-- O gatilho de carimbo precisa rodar DEPOIS da trava, senão o cálculo
-- de tempo decorrido usaria o horário já atualizado e liberaria ganho
-- infinito (bastaria salvar duas vezes seguidas).
-- Recriamos com nome que venha depois na ordem alfabética.
-- ------------------------------------------------------------------
drop trigger if exists profiles_touch on public.profiles;
drop trigger if exists zz_profiles_touch on public.profiles;
create trigger zz_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------------
-- Ranking limpo
--
-- Esconde apenas quem é REINCIDENTE: 3 ou mais suspeitas na última
-- semana. Um registro isolado pode ser relógio fora de hora, internet
-- ruim ou um save repetido — não é justo tirar alguém do ranking por
-- isso. Quem realmente trapaceia dispara várias ao mesmo tempo.
-- ------------------------------------------------------------------
-- (a visão antiga pode ter outras colunas; recriamos do zero)
drop view if exists public.leaderboard;
create view public.leaderboard as
  select p.username, p.level, p.xp,
         coalesce((p.stats->>'bestScore')::bigint, 0) as best_score,
         coalesce((p.stats->>'kills')::bigint, 0)     as kills
    from public.profiles p
   where (
     select count(*) from public.cheat_log c
      where c.user_id = p.id
        and c.created_at > now() - interval '7 days'
   ) < 3
   order by best_score desc
   limit 100;

grant select on public.leaderboard to anon, authenticated;

-- ------------------------------------------------------------------
-- Privacidade: o perfil completo é particular. O ranking acima expõe
-- exclusivamente username, nível, XP, pontuação e abates.
-- ------------------------------------------------------------------
drop policy if exists "leitura publica" on public.profiles;
drop policy if exists "dono le" on public.profiles;
create policy "dono le" on public.profiles for select
  using (auth.uid() = id);

revoke all on function public.guard_profile_update() from public, anon, authenticated;

-- ========================== FIM: supabase/schema_antitrapaca.sql ==========================

-- ======================== INÍCIO: supabase/cleanup_legacy_guests.sql ========================
-- =====================================================================
-- MEME ARENA 3D — limpeza única das antigas contas de Convidado
--
-- O cliente antigo criava usuários reais com nome Convidado#### e a mesma
-- senha pública. A versão atual usa sessionStorage e nunca envia convidados
-- ao Supabase. Execute este arquivo UMA VEZ no SQL Editor como administrador.
--
-- O filtro exige ao mesmo tempo:
--   1) username exatamente Convidado + 4 números;
--   2) e-mail técnico igual a lower(username)@players.memearena.app.
-- Isso evita apagar contas fora do padrão que originou o problema.
-- =====================================================================

do $$
declare removidas integer := 0;
begin
  with candidatas as (
    select u.id
      from auth.users u
      join public.profiles p on p.id = u.id
     where p.username ~* '^Convidado[0-9]{4}$'
       and lower(coalesce(u.email, '')) = lower(p.username) || '@players.memearena.app'
  ), apagadas as (
    delete from auth.users u
     using candidatas c
     where u.id = c.id
     returning u.id
  )
  select count(*) into removidas from apagadas;

  raise notice 'Contas antigas de Convidado removidas: %', removidas;
end;
$$;

-- Impede perfis online futuros de reutilizarem o padrão reservado.
alter table public.profiles drop constraint if exists profiles_username_not_guest;
alter table public.profiles
  add constraint profiles_username_not_guest
  check (username !~* '^Convidado[0-9]{4}$') not valid;

-- Nomes novos são sempre seguros para interface/URL. NOT VALID preserva uma
-- eventual conta antiga fora do formato e ainda bloqueia toda gravação futura.
alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles
  add constraint profiles_username_format
  check (username ~ '^[A-Za-z0-9_]{3,16}$') not valid;

-- Conferência: precisa retornar zero.
select count(*) as convidados_restantes
  from public.profiles
 where username ~* '^Convidado[0-9]{4}$';

-- ========================== FIM: supabase/cleanup_legacy_guests.sql ==========================

-- ======================== INÍCIO: supabase/schema_season_server.sql ========================
-- =====================================================================
-- MEME ARENA 3D — Temporada 67 com autoridade no servidor
--
-- Execute depois de schema_multiplayer.sql. É idempotente.
-- Caixas, caixa de fragmentos e drops de chefe passam a ser sorteados no
-- PostgreSQL. O cliente online não consegue inserir itens sazonais diretamente.
-- =====================================================================

create table if not exists public.season67_items (
  item text primary key,
  item_type text not null check (item_type in ('skin','armor','weapon','ability')),
  name text not null,
  icon text not null,
  rarity text not null check (rarity in ('common','rare','epic','legendary','mythic')),
  weight int not null check (weight > 0)
);

insert into public.season67_items (item,item_type,name,icon,rarity,weight) values
  ('skin:ouricoradio',       'skin',    'Ouriço Radioativo',     '☢',  'rare',      34),
  ('skin:abelhachefe',       'skin',    'Abelha-Chefe',           '🐝', 'epic',      17),
  ('skin:hywirl',            'skin',    'Hipnose Ambulante',      '🌀', 'legendary',  8),
  ('skin:glubturbo',         'skin',    'Glub Turbo',             '👾', 'mythic',     4),
  ('armor:protocol67',      'armor',   'Protocolo 6·7',        '🛡', 'legendary',  8),
  ('armor:orbit6',          'armor',   'Colete Órbita 6',      '🛡', 'rare',      34),
  ('armor:prism7',          'armor',   'Bastião Prisma 7',     '🛡', 'legendary',  8),
  ('weapon:pulse67',        'weapon',  'Pulso Seis-Sete',      '6⁷', 'legendary',  8),
  ('weapon:boomerang',      'weapon',  'Bumerangue 67',        '↩',  'rare',      34),
  ('weapon:gravity6',       'weapon',  'Orbe Gravitacional 6', '◉',  'epic',      17),
  ('weapon:prism7',         'weapon',  'Prisma Sete',          '7✦', 'legendary',  8),
  ('ability:repulse6',      'ability', 'Repulsão 6',           '⑥',  'rare',      34),
  ('ability:blink7',        'ability', 'Passo 7',              '⑦',  'epic',      17),
  ('ability:overclock67',   'ability', 'Sobrecarga 67',        '67', 'legendary',  8)
on conflict (item) do update set
  item_type=excluded.item_type,name=excluded.name,icon=excluded.icon,
  rarity=excluded.rarity,weight=excluded.weight;

delete from public.season67_items where item in (
  'skin:sixtyseven','skin:sixorbit','skin:sevenbreak','skin:duo67',
  'skin:crash','skin:mechred','skin:mechviolet','skin:shadow'
);

alter table public.season67_items enable row level security;
drop policy if exists "catalogo sazonal leitura" on public.season67_items;
create policy "catalogo sazonal leitura" on public.season67_items for select using (true);
grant select on public.season67_items to anon, authenticated;

-- Conversão defensiva: um perfil antigo ou cliente alterado não pode derrubar
-- a função ao gravar texto onde a temporada espera um número natural.
create or replace function public._season67_nat(p_obj jsonb, p_key text)
returns int language sql immutable set search_path = public as $$
  select case
    when coalesce(p_obj->>p_key,'') ~ '^[0-9]{1,9}$' then least((p_obj->>p_key)::int,100000000)
    else 0
  end
$$;
revoke all on function public._season67_nat(jsonb,text) from public, anon, authenticated;

-- Estado econômico separado do perfil editável pelo cliente.
create table if not exists public.season67_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pity int not null default 0 check (pity between 0 and 6),
  boxes_opened int not null default 0 check (boxes_opened >= 0),
  boosts int not null default 0 check (boosts >= 0),
  fragments int not null default 0 check (fragments >= 0),
  forged int not null default 0 check (forged >= 0),
  bosses_defeated int not null default 0 check (bosses_defeated >= 0),
  boss_drops int not null default 0 check (boss_drops >= 0),
  last_boss_reward_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.season67_progress enable row level security;
drop policy if exists "dono le progresso sazonal" on public.season67_progress;
create policy "dono le progresso sazonal" on public.season67_progress for select using (auth.uid()=user_id);
grant select on public.season67_progress to authenticated;
revoke insert,update,delete on public.season67_progress from anon,authenticated;

-- Migra uma única vez o progresso legítimo já existente nos perfis. Depois
-- disso, alterações no JSON do perfil nunca voltam a ser fonte de autoridade.
insert into public.season67_progress
  (user_id,pity,boxes_opened,boosts,fragments,forged,bosses_defeated,boss_drops)
select id,
  least(6,public._season67_nat(coalesce(stats->'season67','{}'::jsonb),'pity')),
  least(100000,public._season67_nat(coalesce(stats->'season67','{}'::jsonb),'boxesOpened')),
  least(1000,public._season67_nat(coalesce(stats->'season67','{}'::jsonb),'boosts')),
  least(100000,public._season67_nat(coalesce(stats->'season67','{}'::jsonb),'fragments')),
  least(10000,public._season67_nat(coalesce(stats->'season67','{}'::jsonb),'forged')),
  least(100000,public._season67_nat(coalesce(stats->'season67','{}'::jsonb),'bossesDefeated')),
  least(100000,public._season67_nat(coalesce(stats->'season67','{}'::jsonb),'bossDrops'))
from public.profiles
on conflict (user_id) do nothing;

-- Seleção ponderada. Função interna: não é executável diretamente pela API.
create or replace function public._season67_pick(
  p_inventory jsonb,
  p_only_missing boolean default false,
  p_type text default null
) returns text
language plpgsql volatile security definer set search_path = public as $$
declare escolhido text;
begin
  select s.item into escolhido
    from public.season67_items s
   where (p_type is null or s.item_type = p_type)
     and (not p_only_missing or not (coalesce(p_inventory,'[]'::jsonb) ? s.item))
   order by (-ln(greatest(random(), 0.0000001)) / s.weight)
   limit 1;
  return escolhido;
end;
$$;
revoke all on function public._season67_pick(jsonb,boolean,text) from public, anon, authenticated;

create or replace function public.season67_open_box(p_box text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  v_price int; v_count int; i int;
  v_coins int; v_xp int; v_level int; v_inventory jsonb; v_stats jsonb; v_season jsonb;
  v_pity int; v_boxes int; v_boosts int; v_fragments int; v_forged int;
  v_roll numeric; v_amount int; v_item text; v_type text; v_name text; v_icon text; v_rarity text;
  v_guaranteed boolean; v_results jsonb := '[]'::jsonb;
  v_xp_gain int := 0; v_coin_gain int := 0; v_need int;
begin
  if me is null then return jsonb_build_object('error','Sem sessão.'); end if;
  if now() < timestamptz '2026-10-03 00:00:00-03' or now() > timestamptz '2026-11-28 23:59:59-03' then
    return jsonb_build_object('error','As Caixas 67 só ficam disponíveis durante a temporada.');
  end if;
  if p_box = 'box67' then v_price := 670; v_count := 1;
  elsif p_box = 'vault67' then v_price := 1967; v_count := 3;
  else return jsonb_build_object('error','Caixa desconhecida.'); end if;

  select coins,xp,level,coalesce(inventory,'[]'::jsonb),coalesce(stats,'{}'::jsonb)
    into v_coins,v_xp,v_level,v_inventory,v_stats
    from public.profiles where id=me for update;
  if not found then return jsonb_build_object('error','Perfil não encontrado.'); end if;
  if v_coins < v_price then return jsonb_build_object('error','Moedas insuficientes.'); end if;

  perform set_config('app.trusted','on',true);
  insert into public.season67_progress(user_id) values(me) on conflict (user_id) do nothing;
  select pity,boxes_opened,boosts,fragments,forged
    into v_pity,v_boxes,v_boosts,v_fragments,v_forged
    from public.season67_progress where user_id=me for update;
  v_season := coalesce(v_stats->'season67','{}'::jsonb);
  v_coins := v_coins - v_price;

  for i in 1..v_count loop
    v_boxes := v_boxes + 1;
    v_guaranteed := v_pity >= 6;
    v_roll := random()*100;

    if v_guaranteed or v_roll < 18 then
      if v_guaranteed then
        v_item := public._season67_pick(v_inventory,true,null);
      else
        v_type := case when v_roll < 5 then 'skin' when v_roll < 9 then 'armor'
                       when v_roll < 14 then 'weapon' else 'ability' end;
        v_item := public._season67_pick(v_inventory,false,v_type);
      end if;
      if v_item is null then v_item := public._season67_pick(v_inventory,false,null); end if;
      select item_type,name,icon,rarity into v_type,v_name,v_icon,v_rarity
        from public.season67_items where item=v_item;
      v_pity := 0;
      if v_inventory ? v_item then
        v_fragments := v_fragments + 67;
        v_results := v_results || jsonb_build_array(jsonb_build_object(
          'type','fragments','icon','⬡','name','67 FRAGMENTOS','amount',67,
          'rarity','legendary','guaranteed',v_guaranteed,
          'desc','Item repetido convertido em fragmentos.'));
      else
        v_inventory := v_inventory || to_jsonb(v_item);
        v_results := v_results || jsonb_build_array(jsonb_build_object(
          'type','item','itemKey',v_item,'itemType',v_type,'name',v_name,'icon',v_icon,
          'rarity',v_rarity,'guaranteed',v_guaranteed,
          'desc',case when v_guaranteed then 'GARANTIA DA 7ª CAIXA' else 'ITEM EXCLUSIVO DA TEMPORADA' end));
      end if;
    else
      v_pity := least(6,v_pity+1);
      if v_roll < 60 then
        v_amount := (array[167,267,367])[1+floor(random()*3)::int];
        v_coin_gain := v_coin_gain + v_amount;
        v_results := v_results || jsonb_build_array(jsonb_build_object(
          'type','coins','icon','🪙','name',v_amount||' MOEDAS','amount',v_amount,'rarity','common'));
      elsif v_roll < 83 then
        v_amount := (array[167,267,367,467])[1+floor(random()*4)::int];
        v_xp_gain := v_xp_gain + v_amount;
        v_results := v_results || jsonb_build_array(jsonb_build_object(
          'type','xp','icon','✦','name',v_amount||' XP','amount',v_amount,'rarity','rare'));
      else
        v_amount := case when random() < .67 then 1 else 2 end;
        v_boosts := v_boosts + v_amount;
        v_results := v_results || jsonb_build_array(jsonb_build_object(
          'type','boost','icon','⚡','name','IMPULSO 67 ×'||v_amount,'amount',v_amount,'rarity','epic',
          'desc','+67% de moedas e XP nas próximas partidas.'));
      end if;
    end if;
  end loop;

  v_coins := v_coins + v_coin_gain;
  v_xp := v_xp + v_xp_gain;
  while v_level < 60 loop
    v_need := round(120*power(v_level::numeric,1.42));
    exit when v_xp < v_need;
    v_xp := v_xp-v_need; v_level := v_level+1;
  end loop;

  v_season := v_season || jsonb_build_object(
    'pity',v_pity,'boxesOpened',v_boxes,'boosts',v_boosts,
    'fragments',v_fragments,'forged',v_forged);
  v_stats := v_stats || jsonb_build_object('season67',v_season);
  update public.season67_progress set pity=v_pity,boxes_opened=v_boxes,
    boosts=v_boosts,fragments=v_fragments,forged=v_forged,updated_at=now()
    where user_id=me;
  update public.profiles set coins=v_coins,xp=v_xp,level=v_level,
    inventory=v_inventory,stats=v_stats where id=me;

  return jsonb_build_object('ok',true,'results',v_results,'progress',v_season);
end;
$$;

create or replace function public.season67_forge_box()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid(); v_inventory jsonb; v_stats jsonb; v_season jsonb;
  v_fragments int; v_boxes int; v_forged int;
  v_item text; v_type text; v_name text; v_icon text; v_rarity text;
begin
  if me is null then return jsonb_build_object('error','Sem sessão.'); end if;
  if now() < timestamptz '2026-10-03 00:00:00-03' or now() > timestamptz '2026-11-28 23:59:59-03' then
    return jsonb_build_object('error','A Caixa Garantida só fica disponível durante a temporada.');
  end if;
  select coalesce(inventory,'[]'::jsonb),coalesce(stats,'{}'::jsonb)
    into v_inventory,v_stats from public.profiles where id=me for update;
  if not found then return jsonb_build_object('error','Perfil não encontrado.'); end if;
  perform set_config('app.trusted','on',true);
  insert into public.season67_progress(user_id) values(me) on conflict (user_id) do nothing;
  select fragments,boxes_opened,forged into v_fragments,v_boxes,v_forged
    from public.season67_progress where user_id=me for update;
  v_season := coalesce(v_stats->'season67','{}'::jsonb);
  if v_fragments < 67 then return jsonb_build_object('error','Você precisa de 67 fragmentos.'); end if;
  v_item := public._season67_pick(v_inventory,true,null);
  if v_item is null then return jsonb_build_object('error','Você já possui todos os itens da Temporada 67.'); end if;
  select item_type,name,icon,rarity into v_type,v_name,v_icon,v_rarity from public.season67_items where item=v_item;

  v_inventory := v_inventory || to_jsonb(v_item);
  v_fragments := v_fragments-67; v_boxes := v_boxes+1; v_forged := v_forged+1;
  v_season := v_season || jsonb_build_object(
    'fragments',v_fragments,'pity',0,'boxesOpened',v_boxes,'forged',v_forged);
  v_stats := v_stats || jsonb_build_object('season67',v_season);
  update public.season67_progress set fragments=v_fragments,pity=0,
    boxes_opened=v_boxes,forged=v_forged,updated_at=now() where user_id=me;
  update public.profiles set inventory=v_inventory,stats=v_stats where id=me;
  return jsonb_build_object('ok',true,'reward',jsonb_build_object(
    'type','item','itemKey',v_item,'itemType',v_type,'name',v_name,'icon',v_icon,
    'rarity',v_rarity,'guaranteed',true,'desc','CAIXA GARANTIDA DE FRAGMENTOS'),
    'progress',v_season);
end;
$$;

create or replace function public.season67_boss_reward()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid(); v_inventory jsonb; v_stats jsonb; v_season jsonb;
  v_last timestamptz; v_item text; v_type text; v_name text; v_icon text; v_rarity text;
  v_fragments int; v_reward jsonb; v_drops int; v_bosses int;
begin
  if me is null then return jsonb_build_object('error','Sem sessão.'); end if;
  if now() < timestamptz '2026-10-03 00:00:00-03' or now() > timestamptz '2026-11-28 23:59:59-03' then
    return jsonb_build_object('error','Temporada encerrada.');
  end if;
  select coalesce(inventory,'[]'::jsonb),coalesce(stats,'{}'::jsonb)
    into v_inventory,v_stats from public.profiles where id=me for update;
  if not found then return jsonb_build_object('error','Perfil não encontrado.'); end if;
  perform set_config('app.trusted','on',true);
  insert into public.season67_progress(user_id) values(me) on conflict (user_id) do nothing;
  select fragments,boss_drops,bosses_defeated,last_boss_reward_at
    into v_fragments,v_drops,v_bosses,v_last
    from public.season67_progress where user_id=me for update;
  v_season := coalesce(v_stats->'season67','{}'::jsonb);
  if v_last is not null and now()-v_last < interval '4 minutes' then
    return jsonb_build_object('error','Recompensa de chefe em recarga no servidor.');
  end if;
  v_bosses := v_bosses+1;

  if random() < .67 then
    v_item := public._season67_pick(v_inventory,false,null);
    select item_type,name,icon,rarity into v_type,v_name,v_icon,v_rarity from public.season67_items where item=v_item;
    v_drops := v_drops+1;
    if v_inventory ? v_item then
      v_fragments := v_fragments+67;
      v_reward := jsonb_build_object('type','fragments','icon','⬡','name','67 FRAGMENTOS','amount',67,
        'rarity','legendary','desc','Drop repetido convertido em fragmentos.');
    else
      v_inventory := v_inventory || to_jsonb(v_item);
      v_reward := jsonb_build_object('type','item','itemKey',v_item,'itemType',v_type,'name',v_name,'icon',v_icon,
        'rarity',v_rarity,'desc','DROP ALEATÓRIO DE CHEFE');
    end if;
  else
    v_fragments := v_fragments+7;
    v_reward := jsonb_build_object('type','fragments','icon','⬡','name','7 FRAGMENTOS','amount',7,
      'rarity','rare','desc','Fragmentos de recompensa do chefe.');
  end if;

  v_last := now();
  v_season := v_season || jsonb_build_object('fragments',v_fragments,'bossDrops',v_drops,
    'bossesDefeated',v_bosses,'lastBossRewardAt',v_last);
  v_stats := v_stats || jsonb_build_object('season67',v_season);
  update public.season67_progress set fragments=v_fragments,boss_drops=v_drops,
    bosses_defeated=v_bosses,last_boss_reward_at=v_last,updated_at=now() where user_id=me;
  update public.profiles set inventory=v_inventory,stats=v_stats where id=me;
  return jsonb_build_object('ok',true,'reward',v_reward,'progress',v_season);
end;
$$;

create or replace function public.season67_consume_boost()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid(); v_stats jsonb; v_season jsonb; p public.season67_progress%rowtype;
begin
  if me is null then return jsonb_build_object('error','Sem sessão.'); end if;
  select coalesce(stats,'{}'::jsonb) into v_stats from public.profiles where id=me for update;
  if not found then return jsonb_build_object('error','Perfil não encontrado.'); end if;
  insert into public.season67_progress(user_id) values(me) on conflict (user_id) do nothing;
  select * into p from public.season67_progress where user_id=me for update;
  if p.boosts <= 0 then return jsonb_build_object('ok',true,'remaining',0); end if;

  perform set_config('app.trusted','on',true);
  p.boosts := p.boosts-1;
  update public.season67_progress set boosts=p.boosts,updated_at=now() where user_id=me;
  v_season := coalesce(v_stats->'season67','{}'::jsonb) || jsonb_build_object(
    'pity',p.pity,'boxesOpened',p.boxes_opened,'boosts',p.boosts,
    'fragments',p.fragments,'forged',p.forged,
    'bossesDefeated',p.bosses_defeated,'bossDrops',p.boss_drops,
    'lastBossRewardAt',p.last_boss_reward_at);
  v_stats := v_stats || jsonb_build_object('season67',v_season);
  update public.profiles set stats=v_stats where id=me;
  return jsonb_build_object('ok',true,'remaining',p.boosts);
end;
$$;

-- Bloqueia a inclusão direta de item sazonal. Somente as funções acima e as
-- funções confiáveis do mercado usam app.trusted=on.
create or replace function public.guard_seasonal_inventory()
returns trigger language plpgsql security definer set search_path = public as $$
declare suspeito boolean;
begin
  if coalesce(current_setting('app.trusted',true),'')='on' then return new; end if;
  select
    exists(
      select 1 from jsonb_array_elements_text(coalesce(new.inventory,'[]'::jsonb)) n(item)
       join public.season67_items s on s.item=n.item
      where not (coalesce(old.inventory,'[]'::jsonb) ? n.item)
    ) or exists(
      select 1 from jsonb_array_elements_text(coalesce(old.inventory,'[]'::jsonb)) o(item)
       join public.season67_items s on s.item=o.item
      where not (coalesce(new.inventory,'[]'::jsonb) ? o.item)
    ) into suspeito;
  if suspeito then
    begin
      insert into public.cheat_log(user_id,username,motivo,pedido,permitido)
      values(old.id,old.username,'tentou alterar item sazonal fora do servidor',
        jsonb_build_object('inventory',new.inventory),jsonb_build_object('inventory',old.inventory));
    exception when undefined_table then null;
    end;
    new.inventory := old.inventory;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_season_items on public.profiles;
create trigger profiles_guard_season_items before update on public.profiles
  for each row execute function public.guard_seasonal_inventory();

-- O JSON em profiles continua existindo para compatibilidade com a interface,
-- mas é sempre reconstruído da tabela privada. Nenhum valor econômico sazonal
-- enviado pelo cliente substitui a fonte autoritativa.
create or replace function public.guard_seasonal_progress()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  p public.season67_progress%rowtype;
  pedido jsonb; espelho jsonb;
begin
  if coalesce(current_setting('app.trusted',true),'')='on' then return new; end if;
  insert into public.season67_progress(user_id) values(old.id) on conflict (user_id) do nothing;
  select * into p from public.season67_progress where user_id=old.id for update;
  pedido := coalesce(new.stats->'season67','{}'::jsonb);
  espelho := pedido || jsonb_build_object(
    'pity',p.pity,'boxesOpened',p.boxes_opened,'boosts',p.boosts,
    'fragments',p.fragments,'forged',p.forged,
    'bossesDefeated',p.bosses_defeated,'bossDrops',p.boss_drops,
    'lastBossRewardAt',p.last_boss_reward_at);
  new.stats := jsonb_set(coalesce(new.stats,'{}'::jsonb),'{season67}',espelho,true);
  return new;
end;
$$;

drop trigger if exists profiles_guard_season_progress on public.profiles;
create trigger profiles_guard_season_progress before update on public.profiles
  for each row execute function public.guard_seasonal_progress();

revoke all on function public.guard_seasonal_inventory() from public,anon,authenticated;
revoke all on function public.guard_seasonal_progress() from public,anon,authenticated;
revoke all on function public.season67_open_box(text) from public, anon;
revoke all on function public.season67_forge_box() from public, anon;
revoke all on function public.season67_boss_reward() from public, anon;
revoke all on function public.season67_consume_boost() from public, anon;
grant execute on function public.season67_open_box(text) to authenticated;
grant execute on function public.season67_forge_box() to authenticated;
grant execute on function public.season67_boss_reward() to authenticated;
grant execute on function public.season67_consume_boost() to authenticated;

-- ========================== FIM: supabase/schema_season_server.sql ==========================
