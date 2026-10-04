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
  ('skin:sixtyseven',       'skin',    'Corredor 67',          '67', 'mythic',     4),
  ('skin:sixorbit',         'skin',    'Seis em Órbita',       '6',  'rare',      34),
  ('skin:sevenbreak',       'skin',    'Sete Quebra-Loop',     '7',  'epic',      17),
  ('skin:duo67',            'skin',    'Fusão 67',             '67', 'mythic',     4),
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
