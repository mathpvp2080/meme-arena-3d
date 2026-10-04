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
