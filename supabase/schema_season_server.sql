-- =====================================================================
-- MEME ARENA 3D — Temporada 67 com autoridade no servidor
--
-- Execute depois de schema_multiplayer.sql. É idempotente.
-- Caixas, caixa de fragmentos e drops de chefe passam a ser sorteados no
-- PostgreSQL. O cliente online não consegue inserir itens sazonais diretamente.
-- =====================================================================

create table if not exists public.season67_items (
  item text primary key,
  item_type text not null check (item_type='skin'),
  name text not null,
  icon text not null,
  rarity text not null,
  weight int not null check (weight>0),
  acquisition text not null default 'both'
);

alter table public.season67_items drop constraint if exists season67_items_rarity_check;
alter table public.season67_items add column if not exists acquisition text not null default 'both';
alter table public.season67_items drop constraint if exists season67_items_acquisition_check;
alter table public.season67_items add constraint season67_items_rarity_check
  check (rarity in ('uncommon','legendary','mythical','ultimate','secret'));
alter table public.season67_items add constraint season67_items_acquisition_check
  check (acquisition in ('box','boss','both'));
delete from public.season67_items;
insert into public.season67_items(item,item_type,name,icon,rarity,weight,acquisition) values
  ('skin:pizza','skin','Pizza','🍕','uncommon',400,'box'),
  ('skin:taco','skin','Taco','🌮','uncommon',400,'boss'),
  ('skin:coolramen','skin','Cool Ramen','🍜','uncommon',400,'both'),
  ('skin:avocado','skin','Avocado','🥑','uncommon',400,'boss'),
  ('skin:sunflower','skin','Sunflower','🌻','legendary',295,'box'),
  ('skin:baguette','skin','Cool Baguette','🥖','legendary',295,'boss'),
  ('skin:goldfishbag','skin','Goldfish Bag','🐠','legendary',295,'both'),
  ('skin:captainlantern','skin','Captain Lantern','🏮','mythical',200,'box'),
  ('skin:sharkperson','skin','Shark Person','🦈','mythical',200,'boss'),
  ('skin:moongirl','skin','Moon Girl','🌙','ultimate',100,'box'),
  ('skin:alienskeleton','skin','Alien Skeleton','☠️','ultimate',100,'boss'),
  ('skin:robot','skin','Robot','🤖','secret',5,'boss'),
  ('skin:tallguy','skin','Tall Guy','🕴️','secret',5,'box'),
  ('skin:skeletoncostume','skin','Skeleton Costume','💀','secret',5,'boss'),
  ('skin:burnvictim','skin','Burn Victim','🔥','secret',5,'box'),
  ('skin:chaosbaby','skin','Chaos Baby','🍼','secret',5,'boss'),
  ('skin:o','skin','O','⭕','secret',5,'box'),
  ('skin:coolbananaguy','skin','Cool Banana Guy','🍌','secret',5,'box'),
  ('skin:mousemisprint','skin','Mouse Misprint','🐭','secret',5,'boss'),
  ('skin:ramon','skin','Ramon','🧙','secret',5,'box'),
  ('skin:littlealienmenace','skin','Little Alien Menace','👽','secret',5,'boss'),
  ('skin:eggplant','skin','Eggplant','🍆','secret',5,'box'),
  ('skin:cosmicdweller','skin','Cosmic Dweller','🌌','secret',5,'box'),
  ('skin:turtle','skin','Turtle','🐢','secret',5,'boss'),
  ('skin:tnt','skin','TNT','🧨','secret',5,'box'),
  ('skin:coolpolygonalmind','skin','Cool Polygonal Mind','🧠','secret',5,'boss'),
  ('skin:eyefighter','skin','Eye Fighter','👁️','secret',5,'boss'),
  ('skin:cosmicperson','skin','Cosmic Person','✨','secret',5,'box');


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

-- ---------------------------------------------------------------------
-- Sorteio Polygonal Mind: primeiro 50% skin / 50% recursos. Somente no
-- ramo skin aplica 40 / 29,5 / 20 / 10 / 0,5 por cento de raridade.
-- ---------------------------------------------------------------------
create or replace function public._season67_skin_rarity(p_roll numeric)
returns text language sql immutable set search_path = public as $$
  select case
    when p_roll < .400 then 'uncommon'
    when p_roll < .695 then 'legendary'
    when p_roll < .895 then 'mythical'
    when p_roll < .995 then 'ultimate'
    else 'secret'
  end
$$;
revoke all on function public._season67_skin_rarity(numeric) from public,anon,authenticated;

create or replace function public._season67_pick_skin(
  p_inventory jsonb, p_only_missing boolean, p_source text, p_rarity text default null
) returns text language sql volatile set search_path = public as $$
  select s.item from public.season67_items s
  where (p_rarity is null or s.rarity=p_rarity)
    and (s.acquisition=p_source or s.acquisition='both')
    and (not p_only_missing or not (coalesce(p_inventory,'[]'::jsonb) ? s.item))
  order by random() limit 1
$$;
revoke all on function public._season67_pick_skin(jsonb,boolean,text,text) from public,anon,authenticated;

create or replace function public.season67_open_box(p_box text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid(); v_price int; v_count int; i int;
  v_coins int; v_xp int; v_level int; v_inventory jsonb; v_stats jsonb; v_season jsonb;
  v_boxes int; v_item text; v_type text; v_name text; v_icon text; v_rarity text;
  v_amount int; v_kind numeric; v_reward jsonb; v_results jsonb := '[]'::jsonb;
  v_need int;
begin
  if me is null then return jsonb_build_object('error','Sem sessão.'); end if;
  if now() < timestamptz '2026-10-03 00:00:00-03' or now() > timestamptz '2026-11-28 23:59:59-03' then
    return jsonb_build_object('error','As Caixas 67 só ficam disponíveis durante a temporada.');
  end if;
  if p_box='box67' then v_price:=670; v_count:=1;
  elsif p_box='vault67' then v_price:=1830; v_count:=3;
  else return jsonb_build_object('error','Caixa desconhecida.'); end if;

  select coins,xp,level,coalesce(inventory,'[]'::jsonb),coalesce(stats,'{}'::jsonb)
    into v_coins,v_xp,v_level,v_inventory,v_stats from public.profiles where id=me for update;
  if not found then return jsonb_build_object('error','Perfil não encontrado.'); end if;
  if v_coins < v_price then return jsonb_build_object('error','Moedas insuficientes.'); end if;
  perform set_config('app.trusted','on',true);
  insert into public.season67_progress(user_id) values(me) on conflict(user_id) do nothing;
  select boxes_opened into v_boxes from public.season67_progress where user_id=me for update;
  v_season := coalesce(v_stats->'season67','{}'::jsonb);
  v_coins := v_coins-v_price;

  for i in 1..v_count loop
    v_boxes := v_boxes+1;
    if random() < .5 then
      v_rarity := public._season67_skin_rarity(random());
      v_item := public._season67_pick_skin(v_inventory,true,'box',v_rarity);
      if v_item is null then v_item := public._season67_pick_skin(v_inventory,false,'box',v_rarity); end if;
      select item_type,name,icon,rarity into v_type,v_name,v_icon,v_rarity
        from public.season67_items where item=v_item;
      if v_inventory ? v_item then
        select greatest(250,round(min_price*.1)::int) into v_amount
          from public.market_price_limits where item=v_item;
        v_amount := coalesce(v_amount,250); v_coins := v_coins+v_amount;
        v_reward := jsonb_build_object('type','coins','icon','🪙','name',v_amount||' MOEDAS',
          'amount',v_amount,'rarity',v_rarity,'converted',true,
          'desc','SKIN REPETIDA CONVERTIDA AUTOMATICAMENTE');
      else
        v_inventory := v_inventory || to_jsonb(v_item);
        v_reward := jsonb_build_object('type','item','itemKey',v_item,'itemType',v_type,
          'name',v_name,'icon',v_icon,'rarity',v_rarity,'desc','DROP DE CAIXA');
      end if;
    else
      v_kind := random();
      if v_kind < .4 then
        v_amount := (array[250,500,750])[1+floor(random()*3)::int];
        v_coins := v_coins+v_amount;
        v_reward := jsonb_build_object('type','coins','icon','🪙','name',v_amount||' MOEDAS',
          'amount',v_amount,'rarity','common','desc','RECURSO AUTOMÁTICO');
      elsif v_kind < .75 then
        v_amount := (array[200,400,600])[1+floor(random()*3)::int];
        v_xp := v_xp+v_amount;
        v_reward := jsonb_build_object('type','xp','icon','✦','name',v_amount||' XP',
          'amount',v_amount,'rarity','uncommon','desc','RECURSO AUTOMÁTICO');
      else
        v_amount := 250; v_coins := v_coins+v_amount; v_xp := v_xp+v_amount;
        v_reward := jsonb_build_object('type','both','icon','⚡','name','250 MOEDAS + 250 XP',
          'amount',v_amount,'coins',v_amount,'xp',v_amount,'rarity','legendary',
          'desc','RECURSOS AUTOMÁTICOS');
      end if;
    end if;
    v_results := v_results || jsonb_build_array(v_reward);
  end loop;

  while v_level < 60 loop
    v_need := round(120*power(v_level::numeric,1.42)); exit when v_xp < v_need;
    v_xp:=v_xp-v_need; v_level:=v_level+1;
  end loop;
  v_season := v_season || jsonb_build_object('pity',0,'boxesOpened',v_boxes);
  v_stats := v_stats || jsonb_build_object('season67',v_season);
  update public.season67_progress set pity=0,boxes_opened=v_boxes,updated_at=now() where user_id=me;
  update public.profiles set coins=v_coins,xp=v_xp,level=v_level,inventory=v_inventory,stats=v_stats where id=me;
  return jsonb_build_object('ok',true,'results',v_results,'progress',v_season);
end;
$$;

create or replace function public.season67_forge_box()
returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object('error','A forja de fragmentos foi encerrada. Caixas e chefes usam o sorteio 50/50.')
$$;

create or replace function public.season67_boss_reward()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me uuid:=auth.uid(); v_coins int; v_xp int; v_level int; v_need int;
  v_inventory jsonb; v_stats jsonb; v_season jsonb; v_last timestamptz;
  v_item text; v_name text; v_icon text; v_rarity text; v_amount int; v_kind numeric;
  v_reward jsonb; v_drops int; v_bosses int;
begin
  if me is null then return jsonb_build_object('error','Sem sessão.'); end if;
  if now() < timestamptz '2026-10-03 00:00:00-03' or now() > timestamptz '2026-11-28 23:59:59-03' then
    return jsonb_build_object('error','Temporada encerrada.'); end if;
  select coins,xp,level,coalesce(inventory,'[]'::jsonb),coalesce(stats,'{}'::jsonb)
    into v_coins,v_xp,v_level,v_inventory,v_stats from public.profiles where id=me for update;
  if not found then return jsonb_build_object('error','Perfil não encontrado.'); end if;
  perform set_config('app.trusted','on',true);
  insert into public.season67_progress(user_id) values(me) on conflict(user_id) do nothing;
  select boss_drops,bosses_defeated,last_boss_reward_at into v_drops,v_bosses,v_last
    from public.season67_progress where user_id=me for update;
  if v_last is not null and now()-v_last < interval '20 seconds' then
    return jsonb_build_object('error','Recompensa de chefe já registrada.'); end if;
  v_bosses:=v_bosses+1;

  if random()<.5 then
    v_rarity:=public._season67_skin_rarity(random());
    v_item:=public._season67_pick_skin(v_inventory,true,'boss',v_rarity);
    if v_item is null then v_item:=public._season67_pick_skin(v_inventory,false,'boss',v_rarity); end if;
    select name,icon,rarity into v_name,v_icon,v_rarity from public.season67_items where item=v_item;
    if v_inventory ? v_item then
      select greatest(250,round(min_price*.1)::int) into v_amount from public.market_price_limits where item=v_item;
      v_amount:=coalesce(v_amount,250); v_coins:=v_coins+v_amount;
      v_reward:=jsonb_build_object('type','coins','icon','🪙','name',v_amount||' MOEDAS','amount',v_amount,
        'rarity',v_rarity,'converted',true,'desc','SKIN REPETIDA CONVERTIDA AUTOMATICAMENTE');
    else
      v_inventory:=v_inventory||to_jsonb(v_item); v_drops:=v_drops+1;
      v_reward:=jsonb_build_object('type','item','itemKey',v_item,'itemType','skin','name',v_name,
        'icon',v_icon,'rarity',v_rarity,'desc','DROP DE CHEFE');
    end if;
  else
    v_kind:=random();
    if v_kind<.4 then
      v_amount:=(array[500,1000,1500])[1+floor(random()*3)::int]; v_coins:=v_coins+v_amount;
      v_reward:=jsonb_build_object('type','coins','icon','🪙','name',v_amount||' MOEDAS','amount',v_amount,
        'rarity','common','desc','RECURSO AUTOMÁTICO');
    elsif v_kind<.75 then
      v_amount:=(array[400,800,1200])[1+floor(random()*3)::int]; v_xp:=v_xp+v_amount;
      v_reward:=jsonb_build_object('type','xp','icon','✦','name',v_amount||' XP','amount',v_amount,
        'rarity','uncommon','desc','RECURSO AUTOMÁTICO');
    else
      v_amount:=500; v_coins:=v_coins+v_amount; v_xp:=v_xp+v_amount;
      v_reward:=jsonb_build_object('type','both','icon','⚡','name','500 MOEDAS + 500 XP','amount',v_amount,
        'coins',v_amount,'xp',v_amount,'rarity','legendary','desc','RECURSOS AUTOMÁTICOS');
    end if;
  end if;
  while v_level<60 loop
    v_need:=round(120*power(v_level::numeric,1.42)); exit when v_xp<v_need;
    v_xp:=v_xp-v_need; v_level:=v_level+1;
  end loop;
  v_last:=now();
  v_season:=coalesce(v_stats->'season67','{}'::jsonb)||jsonb_build_object(
    'pity',0,'bossDrops',v_drops,'bossesDefeated',v_bosses,'lastBossRewardAt',v_last);
  v_stats:=v_stats||jsonb_build_object('season67',v_season);
  update public.season67_progress set pity=0,boss_drops=v_drops,bosses_defeated=v_bosses,
    last_boss_reward_at=v_last,updated_at=now() where user_id=me;
  update public.profiles set coins=v_coins,xp=v_xp,level=v_level,inventory=v_inventory,stats=v_stats where id=me;
  return jsonb_build_object('ok',true,'reward',v_reward,'progress',v_season);
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
