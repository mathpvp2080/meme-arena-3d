-- =====================================================================
-- MEME ARENA 3D — MIGRAÇÃO PARA POLYGONAL MIND 100 AVATARS R1/R2
--
-- Execute uma vez depois de DEPLOY_LAUNCH.sql em bancos já publicados.
-- É idempotente: preserva inventários, skin equipada e anúncios ao substituir
-- apenas o catálogo jogável. NPCs, armas, armaduras e progresso não mudam.
-- =====================================================================

begin;

DO $$
begin
  if to_regclass('public.profiles') is null
     or to_regclass('public.market_price_limits') is null
     or to_regclass('public.market_listings') is null
     or to_regclass('public.season67_items') is null then
    raise exception 'Schema-base ausente. Execute supabase/DEPLOY_LAUNCH.sql antes deste patch.';
  end if;
end;
$$;

select set_config('app.trusted', 'on', true);

create temporary table skin_catalog_migration(old_id text primary key, new_id text not null) on commit drop;
insert into skin_catalog_migration values
  ('chill','coolfries'), ('hacker','sunflower'), ('doge','hotdog'), ('rizzler','coolramen'),
  ('sigma','alienskeleton'), ('clown','milk'), ('ghost','skeletoncostume'), ('demon','burnvictim'),
  ('gigachad','sharkperson'), ('king','captainlantern'), ('sixtyseven','cosmicdweller'),
  ('sixorbit','turtle'), ('sevenbreak','eyefighter'), ('duo67','cosmicperson'),
  ('rookie','coolfries'), ('gamer','milk'), ('lumber','hotdog'), ('striker','pizza'),
  ('survivor','taco'), ('scout','coolramen'), ('sheriff','sunflower'), ('professor','baguette'),
  ('dojo','robot'), ('orcceo','goldfishbag'), ('hunter','moongirl'),
  ('bogorc','littlealienmenace'), ('executive','captainlantern'), ('captain','sharkperson'),
  ('crash','cosmicdweller'), ('mechred','turtle'), ('mechviolet','eyefighter'),
  ('shadow','skeletoncostume'),
  ('cactopraia','coolfries'), ('galinhacaos','milk'), ('gatosus','hotdog'),
  ('peixefora','pizza'), ('pombocorreio','taco'), ('cogubug','coolramen'),
  ('magogeleia','sunflower'), ('yetibolso','baguette'), ('coelhomaromba','goldfishbag'),
  ('sapopix','captainlantern'), ('alpacarei','sharkperson'), ('dinocoach','moongirl'),
  ('etbombado','alienskeleton'), ('ninjameme','robot'), ('lulalunar','tallguy'),
  ('monstroboleto','skeletoncostume'), ('reicogumelo','burnvictim'),
  ('passaropistola','chaosbaby'), ('dragaocaos','o'), ('cranio','coolbananaguy'),
  ('ouricoradio','cosmicdweller'), ('abelhachefe','turtle'), ('hywirl','eyefighter'),
  ('glubturbo','cosmicperson');

-- Inventários antigos são reescritos na mesma posição e duplicatas consolidadas.
update public.profiles p
set inventory = (
      select coalesce(jsonb_agg(to_jsonb(d.item) order by d.first_position), '[]'::jsonb)
      from (
        select x.item, min(x.position) first_position
        from (
          select case when m.new_id is null then e.item else 'skin:' || m.new_id end item,
                 e.position
          from jsonb_array_elements_text(coalesce(p.inventory,'[]'::jsonb))
               with ordinality e(item,position)
          left join skin_catalog_migration m
            on e.item = 'skin:' || m.old_id
        ) x group by x.item
      ) d
    ),
    equipped = jsonb_set(
      coalesce(p.equipped,'{}'::jsonb), '{skin}',
      to_jsonb(coalesce(
        (select m.new_id from skin_catalog_migration m
          where m.old_id = coalesce(p.equipped->>'skin','')),
        nullif(p.equipped->>'skin',''), 'coolfries'
      )), true
    );

-- O anúncio continua existindo, agora com o substituto e seu preço fixo de 70%.
update public.market_listings l
set item = 'skin:' || m.new_id
from skin_catalog_migration m
where l.item = 'skin:' || m.old_id;

create temporary table polygonal_skin_market(
  id text primary key, market_price int not null, tradable boolean not null
) on commit drop;
insert into polygonal_skin_market values
  ('coolfries',10,false), ('milk',1750,true), ('hotdog',3500,true),
  ('washingmachine',5250,true), ('fridge',7000,true),
  ('pizza',7000,true), ('taco',10500,true), ('coolramen',14000,true), ('avocado',17500,true),
  ('sunflower',17500,true), ('baguette',22750,true), ('goldfishbag',28000,true),
  ('captainlantern',28000,true), ('sharkperson',42000,true),
  ('moongirl',42000,true), ('alienskeleton',70000,true),
  ('robot',70000,true), ('tallguy',109375,true), ('skeletoncostume',148750,true),
  ('burnvictim',188125,true), ('chaosbaby',227500,true), ('o',266875,true),
  ('coolbananaguy',306250,true), ('mousemisprint',345625,true), ('ramon',385000,true),
  ('littlealienmenace',424375,true), ('eggplant',463750,true),
  ('cosmicdweller',503125,true), ('turtle',542500,true), ('tnt',581875,true),
  ('coolpolygonalmind',621250,true), ('eyefighter',660625,true), ('cosmicperson',700000,true);

insert into public.market_price_limits(item,min_price,max_price,tradable)
select 'skin:' || id,
       case when tradable then market_price else 0 end,
       case when tradable then market_price else 0 end,
       tradable
from polygonal_skin_market
on conflict(item) do update set
  min_price=excluded.min_price, max_price=excluded.max_price, tradable=excluded.tradable;

update public.market_listings l
set price = m.market_price
from polygonal_skin_market m
where l.item = 'skin:' || m.id and l.sold=false;

delete from public.market_price_limits p
where p.item like 'skin:%'
  and not exists (select 1 from polygonal_skin_market m where p.item='skin:'||m.id);

-- A tabela sazonal passa a conter somente skins não Common e sua fonte válida.
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

-- Contas criadas depois do patch também começam no catálogo aprovado.
create or replace function public.normalize_profile_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('app.trusted',true),'')='on' then return new; end if;
  new.level := 1; new.xp := 0; new.coins := 600;
  new.inventory := '["skin:coolfries","armor:hoodie"]'::jsonb;
  new.equipped := '{"skin":"coolfries","armor":"hoodie","weapons":[],"ability":""}'::jsonb;
  new.stats := '{}'::jsonb;
  return new;
end;
$$;
revoke all on function public.normalize_profile_insert() from public,anon,authenticated;

commit;
