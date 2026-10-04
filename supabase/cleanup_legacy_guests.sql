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
