-- =====================================================================
-- MEME ARENA 3D — MIGRAÇÃO PARA O ELENCO QUATERNIUS ULTIMATE MONSTERS
--
-- Execute uma vez depois de DEPLOY_LAUNCH.sql em bancos já publicados.
-- Substitui somente skins jogáveis, incluindo o catálogo original e a versão
-- Kenney rejeitada. NPCs, armas, armaduras e progresso ficam intactos.
-- O patch é idempotente e preserva compras, equipamento e anúncios existentes.
-- =====================================================================

begin;

DO $$
begin
  if to_regclass('public.profiles') is null
     or to_regclass('public.market_price_limits') is null
     or to_regclass('public.market_listings') is null
     or to_regclass('public.season67_items') is null then
    raise exception 'Schema-base ausente. Execute supabase/schema.sql e supabase/DEPLOY_LAUNCH.sql antes deste patch.';
  end if;
end;
$$;

select set_config('app.trusted', 'on', true);

-- O mesmo mapa cobre contas que ainda estão no catálogo original e contas que
-- já receberam a migração Kenney. Entradas duplicadas são consolidadas.
with mapping(old_item,new_item) as (values
  ('skin:chill',       'skin:cactopraia'),
  ('skin:hacker',      'skin:magogeleia'),
  ('skin:doge',        'skin:gatosus'),
  ('skin:rizzler',     'skin:sapopix'),
  ('skin:sigma',       'skin:etbombado'),
  ('skin:clown',       'skin:galinhacaos'),
  ('skin:ghost',       'skin:cranio'),
  ('skin:demon',       'skin:dragaocaos'),
  ('skin:gigachad',    'skin:coelhomaromba'),
  ('skin:king',        'skin:reicogumelo'),
  ('skin:sixtyseven',  'skin:ouricoradio'),
  ('skin:sixorbit',    'skin:abelhachefe'),
  ('skin:sevenbreak',  'skin:hywirl'),
  ('skin:duo67',       'skin:glubturbo'),
  ('skin:rookie',      'skin:cactopraia'),
  ('skin:gamer',       'skin:galinhacaos'),
  ('skin:lumber',      'skin:gatosus'),
  ('skin:striker',     'skin:peixefora'),
  ('skin:survivor',    'skin:pombocorreio'),
  ('skin:scout',       'skin:cogubug'),
  ('skin:sheriff',     'skin:magogeleia'),
  ('skin:professor',   'skin:yetibolso'),
  ('skin:dojo',        'skin:ninjameme'),
  ('skin:orcceo',      'skin:monstroboleto'),
  ('skin:hunter',      'skin:dinocoach'),
  ('skin:bogorc',      'skin:glubturbo'),
  ('skin:executive',   'skin:reicogumelo'),
  ('skin:captain',     'skin:passaropistola'),
  ('skin:crash',       'skin:ouricoradio'),
  ('skin:mechred',     'skin:abelhachefe'),
  ('skin:mechviolet',  'skin:hywirl'),
  ('skin:shadow',      'skin:cranio')
)
update public.profiles p
set inventory = (
      select coalesce(jsonb_agg(d.item order by d.first_position), '[]'::jsonb)
      from (
        select x.item, min(x.position) as first_position
        from (
          select coalesce(m.new_item,e.item) as item, e.position
          from jsonb_array_elements_text(coalesce(p.inventory,'[]'::jsonb))
               with ordinality as e(item,position)
          left join mapping m on m.old_item=e.item
        ) x
        group by x.item
      ) d
    ),
    equipped = jsonb_set(
      coalesce(p.equipped,'{}'::jsonb),
      '{skin}',
      to_jsonb(case coalesce(p.equipped->>'skin','')
        when 'chill' then 'cactopraia'
        when 'hacker' then 'magogeleia'
        when 'doge' then 'gatosus'
        when 'rizzler' then 'sapopix'
        when 'sigma' then 'etbombado'
        when 'clown' then 'galinhacaos'
        when 'ghost' then 'cranio'
        when 'demon' then 'dragaocaos'
        when 'gigachad' then 'coelhomaromba'
        when 'king' then 'reicogumelo'
        when 'sixtyseven' then 'ouricoradio'
        when 'sixorbit' then 'abelhachefe'
        when 'sevenbreak' then 'hywirl'
        when 'duo67' then 'glubturbo'
        when 'rookie' then 'cactopraia'
        when 'gamer' then 'galinhacaos'
        when 'lumber' then 'gatosus'
        when 'striker' then 'peixefora'
        when 'survivor' then 'pombocorreio'
        when 'scout' then 'cogubug'
        when 'sheriff' then 'magogeleia'
        when 'professor' then 'yetibolso'
        when 'dojo' then 'ninjameme'
        when 'orcceo' then 'monstroboleto'
        when 'hunter' then 'dinocoach'
        when 'bogorc' then 'glubturbo'
        when 'executive' then 'reicogumelo'
        when 'captain' then 'passaropistola'
        when 'crash' then 'ouricoradio'
        when 'mechred' then 'abelhachefe'
        when 'mechviolet' then 'hywirl'
        when 'shadow' then 'cranio'
        when '' then 'cactopraia'
        else p.equipped->>'skin'
      end),
      true
    );

-- Anúncios antigos continuam válidos e passam a entregar o substituto.
with mapping(old_item,new_item) as (values
  ('skin:chill','skin:cactopraia'), ('skin:hacker','skin:magogeleia'),
  ('skin:doge','skin:gatosus'), ('skin:rizzler','skin:sapopix'),
  ('skin:sigma','skin:etbombado'), ('skin:clown','skin:galinhacaos'),
  ('skin:ghost','skin:cranio'), ('skin:demon','skin:dragaocaos'),
  ('skin:gigachad','skin:coelhomaromba'), ('skin:king','skin:reicogumelo'),
  ('skin:sixtyseven','skin:ouricoradio'), ('skin:sixorbit','skin:abelhachefe'),
  ('skin:sevenbreak','skin:hywirl'), ('skin:duo67','skin:glubturbo'),
  ('skin:rookie','skin:cactopraia'), ('skin:gamer','skin:galinhacaos'),
  ('skin:lumber','skin:gatosus'), ('skin:striker','skin:peixefora'),
  ('skin:survivor','skin:pombocorreio'), ('skin:scout','skin:cogubug'),
  ('skin:sheriff','skin:magogeleia'), ('skin:professor','skin:yetibolso'),
  ('skin:dojo','skin:ninjameme'), ('skin:orcceo','skin:monstroboleto'),
  ('skin:hunter','skin:dinocoach'), ('skin:bogorc','skin:glubturbo'),
  ('skin:executive','skin:reicogumelo'), ('skin:captain','skin:passaropistola'),
  ('skin:crash','skin:ouricoradio'), ('skin:mechred','skin:abelhachefe'),
  ('skin:mechviolet','skin:hywirl'), ('skin:shadow','skin:cranio')
)
update public.market_listings l set item=m.new_item from mapping m where l.item=m.old_item;

insert into public.market_price_limits (item,min_price,max_price,tradable) values
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
  ('skin:glubturbo',      7175, 287000, true)
on conflict (item) do update set
  min_price=excluded.min_price,
  max_price=excluded.max_price,
  tradable=excluded.tradable;

delete from public.market_price_limits where item in (
  'skin:chill','skin:hacker','skin:doge','skin:rizzler','skin:sigma',
  'skin:clown','skin:ghost','skin:demon','skin:gigachad','skin:king',
  'skin:sixtyseven','skin:sixorbit','skin:sevenbreak','skin:duo67',
  'skin:rookie','skin:gamer','skin:lumber','skin:striker','skin:survivor',
  'skin:scout','skin:sheriff','skin:professor','skin:dojo','skin:orcceo',
  'skin:hunter','skin:bogorc','skin:executive','skin:captain','skin:crash',
  'skin:mechred','skin:mechviolet','skin:shadow'
);

insert into public.season67_items (item,item_type,name,icon,rarity,weight) values
  ('skin:ouricoradio','skin','Ouriço Radioativo','☢','rare',34),
  ('skin:abelhachefe','skin','Abelha-Chefe','🐝','epic',17),
  ('skin:hywirl','skin','Hipnose Ambulante','🌀','legendary',8),
  ('skin:glubturbo','skin','Glub Turbo','👾','mythic',4)
on conflict (item) do update set
  item_type=excluded.item_type,
  name=excluded.name,
  icon=excluded.icon,
  rarity=excluded.rarity,
  weight=excluded.weight;

delete from public.season67_items where item in (
  'skin:sixtyseven','skin:sixorbit','skin:sevenbreak','skin:duo67',
  'skin:crash','skin:mechred','skin:mechviolet','skin:shadow'
);

-- Contas criadas depois do patch também começam com a nova skin.
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
revoke all on function public.normalize_profile_insert() from public,anon,authenticated;

commit;
