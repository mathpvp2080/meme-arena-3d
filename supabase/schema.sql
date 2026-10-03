-- ============================================================
-- MEME ARENA 3D — banco de dados (Supabase / PostgreSQL)
-- Cole TUDO isto no SQL Editor do Supabase e clique em "Run".
-- Pode rodar mais de uma vez sem quebrar nada.
-- ============================================================

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text unique not null,
  level       int  not null default 1,
  xp          int  not null default 0,
  coins       int  not null default 600,
  inventory   jsonb not null default '[]'::jsonb,
  equipped    jsonb not null default '{}'::jsonb,
  stats       jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- buscas rápidas do ranking
create index if not exists profiles_level_idx on public.profiles (level desc, xp desc);
create index if not exists profiles_username_idx on public.profiles (lower(username));

-- carimbo automático de atualização
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ============================================================
-- SEGURANÇA (Row Level Security)
-- Qualquer pessoa pode LER (precisamos disso para o ranking),
-- mas só o dono pode CRIAR ou ALTERAR o próprio perfil.
-- ============================================================
alter table public.profiles enable row level security;

drop policy if exists "leitura publica" on public.profiles;
create policy "leitura publica"
  on public.profiles for select
  using (true);

drop policy if exists "dono insere" on public.profiles;
create policy "dono insere"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "dono atualiza" on public.profiles;
create policy "dono atualiza"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "dono apaga" on public.profiles;
create policy "dono apaga"
  on public.profiles for delete
  using (auth.uid() = id);

-- ============================================================
-- Ranking público já pronto (sem expor nada sensível)
-- ============================================================
-- A versão anti-trapaça também recria esta view e usa bigint. Remover antes
-- evita conflito de tipo/ordem das colunas ao reaplicar o schema-base.
drop view if exists public.leaderboard;
create view public.leaderboard as
  select username, level, xp,
         coalesce((stats->>'bestScore')::bigint, 0) as best_score,
         coalesce((stats->>'bestWave')::bigint, 0)  as best_wave,
         coalesce((stats->>'kills')::bigint, 0)     as kills
  from public.profiles
  order by best_score desc
  limit 100;

grant select on public.leaderboard to anon, authenticated;
