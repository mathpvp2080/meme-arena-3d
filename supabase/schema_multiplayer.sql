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
returns void language sql security definer as $$
  delete from public.rooms where updated_at < now() - interval '15 minutes';
$$;
grant execute on function public.clean_rooms() to anon, authenticated;

-- ------------------------------------------------------------------
-- MERCADO: anúncios de itens à venda por moedas
-- ------------------------------------------------------------------
create table if not exists public.market_listings (
  id          bigserial primary key,
  seller_id   uuid not null references auth.users (id) on delete cascade,
  seller_name text not null,
  item        text not null,            -- 'skin:doge' | 'weapon:laser' | 'armor:pixel'
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
  ('skin:chill',          25,    300, false),
  ('skin:hacker',        450,   7200, true),
  ('skin:doge',          600,   9600, true),
  ('skin:rizzler',      1125,  27000, true),
  ('skin:sigma',        1300,  31200, true),
  ('skin:clown',         700,  11200, true),
  ('skin:ghost',        1500,  36000, true),
  ('skin:demon',        2375,  76000, true),
  ('skin:gigachad',     3000,  96000, true),
  ('skin:king',         6250, 250000, true),
  ('skin:sixtyseven',   1670,  26700, true),
  ('skin:sixorbit',      650,  10400, true),
  ('skin:sevenbreak',   1925,  46200, true),
  ('skin:duo67',        6675, 267000, true),
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

alter table public.market_price_limits enable row level security;
drop policy if exists "limites do mercado leitura" on public.market_price_limits;
create policy "limites do mercado leitura" on public.market_price_limits
  for select using (true);
grant select on public.market_price_limits to anon, authenticated;

create index if not exists market_open_idx on public.market_listings (sold, created_at desc);

alter table public.market_listings enable row level security;

drop policy if exists "mercado leitura" on public.market_listings;
create policy "mercado leitura" on public.market_listings for select using (true);

drop policy if exists "dono anuncia" on public.market_listings;
create policy "dono anuncia" on public.market_listings for insert
  with check (auth.uid() = seller_id);

drop policy if exists "dono cancela" on public.market_listings;
create policy "dono cancela" on public.market_listings for delete
  using (auth.uid() = seller_id and sold = false);

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
returns json language plpgsql security definer as $$
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
returns json language plpgsql security definer as $$
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
returns json language plpgsql security definer as $$
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
returns json language plpgsql security definer as $$
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
