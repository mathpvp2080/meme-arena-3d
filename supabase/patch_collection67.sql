-- ============================================================
-- MEME ARENA 3D — PATCH DA COLEÇÃO SAZONAL 67
--
-- Use este arquivo quando schema_multiplayer.sql já foi aplicado antes.
-- Ele não recria tabelas e não apaga anúncios ou perfis: apenas registra
-- os novos limites e atualiza a validação de itens equipados.
-- ============================================================

begin;

-- Falha com uma mensagem clara caso o schema-base ainda não exista.
do $$
begin
  if to_regclass('public.market_price_limits') is null
     or to_regclass('public.market_listings') is null
     or to_regclass('public.profiles') is null then
    raise exception 'Schema-base ausente. Execute os arquivos supabase/schema.sql e supabase/schema_multiplayer.sql completos, sem selecionar apenas parte do texto.';
  end if;
end;
$$;

insert into public.market_price_limits (item, min_price, max_price, tradable) values
  ('skin:ouricoradio',     1050,  16800, true),
  ('skin:abelhachefe',     2175,  52200, true),
  ('skin:hywirl',          4425, 141600, true),
  ('skin:glubturbo',       7175, 287000, true),
  ('armor:orbit6',          900,  14400, true),
  ('armor:prism7',         3925, 125600, true),
  ('weapon:boomerang',      725,  11600, true),
  ('weapon:gravity6',      1675,  40200, true),
  ('weapon:prism7',        3175, 101600, true),
  ('ability:repulse6',     1050,  16800, true),
  ('ability:blink7',       2100,  50400, true),
  ('ability:overclock67',  4675, 149600, true)
on conflict (item) do update set
  min_price = excluded.min_price,
  max_price = excluded.max_price,
  tradable = excluded.tradable;

-- Atualiza a venda para impedir que uma habilidade equipada seja anunciada,
-- assim como já acontece com skin, armadura e armas.
create or replace function public.market_sell(p_item text, p_price int)
returns json language plpgsql security definer as $$
declare
  me uuid := auth.uid(); inv jsonb; equip jsonb; nome text;
  minimo int; maximo int; pode_vender boolean;
begin
  perform set_config('app.trusted', 'on', true);
  if me is null then return json_build_object('error','Sem sessão.'); end if;

  select min_price, max_price, tradable into minimo, maximo, pode_vender
    from public.market_price_limits where item = p_item;
  if minimo is null then return json_build_object('error','Item não reconhecido pelo mercado.'); end if;
  if not pode_vender then return json_build_object('error','Itens iniciais não podem ser vendidos.'); end if;
  if p_price is null or p_price < minimo or p_price > maximo then
    return json_build_object('error', format('Este item aceita preços de %s a %s moedas.', minimo, maximo));
  end if;

  select inventory, username, equipped into inv, nome, equip
    from public.profiles where id = me;
  if inv is null then return json_build_object('error','Perfil não encontrado.'); end if;
  if not (inv ? p_item) then return json_build_object('error','Você não tem esse item.'); end if;

  if (split_part(p_item, ':', 1) = 'skin'
        and coalesce(equip->>'skin', '') = split_part(p_item, ':', 2))
     or (split_part(p_item, ':', 1) = 'armor'
        and coalesce(equip->>'armor', '') = split_part(p_item, ':', 2))
     or (split_part(p_item, ':', 1) = 'ability'
        and coalesce(equip->>'ability', '') = split_part(p_item, ':', 2))
     or (split_part(p_item, ':', 1) = 'weapon'
        and coalesce(equip->'weapons', '[]'::jsonb) ? split_part(p_item, ':', 2)) then
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

grant execute on function public.market_sell(text, int) to authenticated;

commit;
