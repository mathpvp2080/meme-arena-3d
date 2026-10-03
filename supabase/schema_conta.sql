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

  -- anúncios do mercado (se a tabela existir)
  begin
    delete from public.market_listings where seller_id = me or buyer_id = me;
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

grant execute on function public.delete_my_account() to authenticated;
