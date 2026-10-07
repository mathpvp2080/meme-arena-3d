-- =====================================================================
-- MEME ARENA 3D — MIGRAÇÃO DO CATÁLOGO KENNEY BLOCKY CHARACTERS 2.0
--
-- Execute uma vez depois de DEPLOY_LAUNCH.sql em bancos já publicados.
-- Substitui somente as skins jogáveis. NPCs, armas, armaduras e progresso
-- permanecem intactos. É idempotente e preserva compras/equipamentos antigos.
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

-- Autoriza a troca de IDs sazonais dentro desta transação sem disparar a
-- proteção antitrapaça destinada às gravações feitas pelo cliente.
select set_config('app.trusted', 'on', true);

-- Preserva cada skin antiga como a skin nova equivalente, inclusive nos
-- inventários que já possuíam mais de uma entrada ou estavam equipados.
with mapping(old_item,new_item) as (values
  ('skin:chill',       'skin:rookie'),
  ('skin:hacker',      'skin:gamer'),
  ('skin:doge',        'skin:lumber'),
  ('skin:rizzler',     'skin:scout'),
  ('skin:sigma',       'skin:sheriff'),
  ('skin:clown',       'skin:striker'),
  ('skin:ghost',       'skin:professor'),
  ('skin:demon',       'skin:orcceo'),
  ('skin:gigachad',    'skin:hunter'),
  ('skin:king',        'skin:executive'),
  ('skin:sixtyseven',  'skin:crash'),
  ('skin:sixorbit',    'skin:mechred'),
  ('skin:sevenbreak',  'skin:mechviolet'),
  ('skin:duo67',       'skin:shadow')
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
        when 'chill' then 'rookie'
        when 'hacker' then 'gamer'
        when 'doge' then 'lumber'
        when 'rizzler' then 'scout'
        when 'sigma' then 'sheriff'
        when 'clown' then 'striker'
        when 'ghost' then 'professor'
        when 'demon' then 'orcceo'
        when 'gigachad' then 'hunter'
        when 'king' then 'executive'
        when 'sixtyseven' then 'crash'
        when 'sixorbit' then 'mechred'
        when 'sevenbreak' then 'mechviolet'
        when 'duo67' then 'shadow'
        when '' then 'rookie'
        else p.equipped->>'skin'
      end),
      true
    );

-- Anúncios antigos continuam válidos e passam a entregar o modelo substituto.
with mapping(old_item,new_item) as (values
  ('skin:chill','skin:rookie'), ('skin:hacker','skin:gamer'),
  ('skin:doge','skin:lumber'), ('skin:rizzler','skin:scout'),
  ('skin:sigma','skin:sheriff'), ('skin:clown','skin:striker'),
  ('skin:ghost','skin:professor'), ('skin:demon','skin:orcceo'),
  ('skin:gigachad','skin:hunter'), ('skin:king','skin:executive'),
  ('skin:sixtyseven','skin:crash'), ('skin:sixorbit','skin:mechred'),
  ('skin:sevenbreak','skin:mechviolet'), ('skin:duo67','skin:shadow')
)
update public.market_listings l set item=m.new_item from mapping m where l.item=m.old_item;

insert into public.market_price_limits (item,min_price,max_price,tradable) values
  ('skin:rookie',          25,    300, false),
  ('skin:gamer',          450,   7200, true),
  ('skin:lumber',         600,   9600, true),
  ('skin:striker',        700,  11200, true),
  ('skin:survivor',       875,  14000, true),
  ('skin:scout',         1125,  27000, true),
  ('skin:sheriff',       1300,  31200, true),
  ('skin:professor',     1500,  36000, true),
  ('skin:dojo',          1800,  43200, true),
  ('skin:orcceo',        2375,  76000, true),
  ('skin:hunter',        3000,  96000, true),
  ('skin:bogorc',        3750, 120000, true),
  ('skin:executive',     6250, 250000, true),
  ('skin:captain',       7500, 300000, true),
  ('skin:crash',         1670,  26700, true),
  ('skin:mechred',        650,  10400, true),
  ('skin:mechviolet',    1925,  46200, true),
  ('skin:shadow',        6675, 267000, true)
on conflict (item) do update set
  min_price=excluded.min_price,
  max_price=excluded.max_price,
  tradable=excluded.tradable;

delete from public.market_price_limits where item in (
  'skin:chill','skin:hacker','skin:doge','skin:rizzler','skin:sigma',
  'skin:clown','skin:ghost','skin:demon','skin:gigachad','skin:king',
  'skin:sixtyseven','skin:sixorbit','skin:sevenbreak','skin:duo67'
);

insert into public.season67_items (item,item_type,name,icon,rarity,weight) values
  ('skin:crash',       'skin','Dublê de Respawn','⚠', 'mythic', 4),
  ('skin:mechred',     'skin','Mecha Rubi','🤖',       'rare', 34),
  ('skin:mechviolet',  'skin','Mecha Violeta','🤖',    'epic', 17),
  ('skin:shadow',      'skin','Ninja Sem Sinal','🥷',  'mythic', 4)
on conflict (item) do update set
  item_type=excluded.item_type,
  name=excluded.name,
  icon=excluded.icon,
  rarity=excluded.rarity,
  weight=excluded.weight;

delete from public.season67_items where item in (
  'skin:sixtyseven','skin:sixorbit','skin:sevenbreak','skin:duo67'
);

-- Contas criadas depois do patch também começam com a nova skin.
create or replace function public.normalize_profile_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('app.trusted',true),'')='on' then return new; end if;
  new.level := 1;
  new.xp := 0;
  new.coins := 600;
  new.inventory := '["skin:rookie","armor:hoodie"]'::jsonb;
  new.equipped := '{"skin":"rookie","armor":"hoodie","weapons":[],"ability":""}'::jsonb;
  new.stats := '{}'::jsonb;
  return new;
end;
$$;
revoke all on function public.normalize_profile_insert() from public,anon,authenticated;

commit;
