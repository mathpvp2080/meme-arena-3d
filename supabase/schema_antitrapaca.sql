-- ============================================================
-- MEME ARENA 3D — travas anti-trapaça
--
-- O navegador não é confiável: qualquer jogador pode abrir o F12 e
-- mandar "ganhei 10 milhões de moedas". Estas regras ficam DENTRO do
-- banco, onde ninguém mexe, e conferem se o que chegou faz sentido.
--
-- A estratégia é CORTAR, não recusar: se o valor é absurdo, o banco
-- grava o máximo permitido em vez de dar erro. Assim um jogador
-- honesto com relógio errado ou internet ruim nunca perde progresso,
-- e o trapaceiro simplesmente não ganha nada.
--
-- Cole TUDO isto no SQL Editor do Supabase e clique em "Run".
-- Pode rodar quantas vezes quiser.
-- ============================================================

-- ------------------------------------------------------------------
-- Diário de suspeitas: serve para você ver quem anda tentando.
-- Só o próprio dono (e você, pelo painel) consegue ler.
-- ------------------------------------------------------------------
create table if not exists public.cheat_log (
  id         bigserial primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  username   text,
  motivo     text not null,
  pedido     jsonb,
  permitido  jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cheat_log_user_idx on public.cheat_log (user_id, created_at desc);

alter table public.cheat_log enable row level security;

drop policy if exists "dono le o proprio log" on public.cheat_log;
create policy "dono le o proprio log"
  on public.cheat_log for select
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------
-- Todo perfil nasce com o mesmo estado. Isso fecha o atalho de criar a conta
-- já com moedas, nível ou inventário forjados pela API REST.
-- ------------------------------------------------------------------
create or replace function public.normalize_profile_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('app.trusted',true),'')='on' then return new; end if;
  new.level := 1;
  new.xp := 0;
  new.coins := 600;
  new.inventory := '["skin:coolfries","armor:hoodie"]'::jsonb;
  new.equipped := '{"skin":"coolfries","armor":"hoodie","weapons":[],"ability":""}'::jsonb;
  new.stats := '{}'::jsonb;
  return new;
end;
$$;

drop trigger if exists profiles_normalize_insert on public.profiles;
create trigger profiles_normalize_insert before insert on public.profiles
  for each row execute function public.normalize_profile_insert();
revoke all on function public.normalize_profile_insert() from public,anon,authenticated;

-- ------------------------------------------------------------------
-- A trava principal
-- ------------------------------------------------------------------
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  segundos      numeric;   -- tempo desde o último salvamento
  ganho_moedas  int;
  ganho_xp      int;
  ganho_nivel   int;
  max_moedas    int;
  max_xp        int;
  novos_itens   int;
  motivos       text := '';
  pedido        jsonb;
begin
  -- ============================================================
  -- 0. PASSE LIVRE PARA O QUE VEM DE DENTRO DO BANCO
  -- Mercado e presentes rodam em funções protegidas que já conferem
  -- tudo. Elas marcam "app.trusted" para a trava não cortar uma venda
  -- grande ou um presente generoso, que são legítimos.
  -- ============================================================
  if coalesce(current_setting('app.trusted', true), '') = 'on' then
    return new;
  end if;

  -- quanto tempo passou desde o último save (mínimo 1s para evitar divisão estranha)
  segundos := greatest(1, extract(epoch from (now() - coalesce(old.updated_at, now()))));

  pedido := jsonb_build_object(
    'coins', new.coins, 'xp', new.xp, 'level', new.level,
    'itens', jsonb_array_length(coalesce(new.inventory, '[]'::jsonb))
  );

  -- ============================================================
  -- 1. MOEDAS
  -- A melhor partida possível dá ~6 mil moedas e dura uns 10 minutos.
  -- Liberamos 8 mil de folga + 60 por segundo decorrido, com teto de
  -- 200 mil por salvamento (para quem ficou offline muito tempo).
  -- Perder moedas (comprar algo) é sempre permitido.
  -- ============================================================
  ganho_moedas := new.coins - old.coins;
  max_moedas := least(200000, 8000 + (segundos * 60)::int);

  if ganho_moedas > max_moedas then
    motivos := motivos || format('moedas +%s (máx %s); ', ganho_moedas, max_moedas);
    new.coins := old.coins + max_moedas;
  end if;

  if new.coins < 0 then new.coins := 0; end if;

  -- ============================================================
  -- 2. EXPERIÊNCIA E NÍVEL
  -- O nível nunca cai e sobe no máximo 4 por salvamento. O teto do
  -- jogo é 60.
  -- ============================================================
  ganho_xp := new.xp - old.xp;
  max_xp := least(300000, 12000 + (segundos * 80)::int);

  if ganho_xp > max_xp then
    motivos := motivos || format('xp +%s (máx %s); ', ganho_xp, max_xp);
    new.xp := old.xp + max_xp;
  end if;

  if new.xp < 0 then new.xp := 0; end if;

  ganho_nivel := new.level - old.level;

  if new.level > 60 then
    motivos := motivos || format('nível %s acima do teto; ', new.level);
    new.level := 60;
  end if;

  if ganho_nivel > 4 then
    motivos := motivos || format('nível +%s de uma vez; ', ganho_nivel);
    new.level := old.level + 4;
  end if;

  if new.level < old.level then
    -- nível não volta atrás (evita zerar para burlar outras contas)
    new.level := old.level;
  end if;

  if new.level < 1 then new.level := 1; end if;

  -- ============================================================
  -- 3. INVENTÁRIO
  -- Numa jogada normal entram 1 ou 2 itens por vez (compra, presente,
  -- conquista). Mais de 6 de uma vez é sinal de mão na massa.
  -- O catálogo inteiro tem menos de 60 itens.
  -- ============================================================
  novos_itens := jsonb_array_length(coalesce(new.inventory, '[]'::jsonb))
               - jsonb_array_length(coalesce(old.inventory, '[]'::jsonb));

  if novos_itens > 6 then
    motivos := motivos || format('inventário +%s itens de uma vez; ', novos_itens);
    new.inventory := old.inventory;
  end if;

  if jsonb_array_length(coalesce(new.inventory, '[]'::jsonb)) > 80 then
    motivos := motivos || 'inventário maior que o catálogo; ';
    new.inventory := old.inventory;
  end if;

  -- ============================================================
  -- 4. ESTATÍSTICAS
  -- Elas só crescem. Se vier um número menor, foi adulteração ou
  -- um save antigo chegando atrasado: mantemos o maior dos dois.
  -- ============================================================
  if new.stats is not null and old.stats is not null then
    new.stats := new.stats
      || jsonb_build_object('kills',
           greatest(coalesce((new.stats->>'kills')::bigint, 0),
                    coalesce((old.stats->>'kills')::bigint, 0)))
      || jsonb_build_object('games',
           greatest(coalesce((new.stats->>'games')::bigint, 0),
                    coalesce((old.stats->>'games')::bigint, 0)))
      || jsonb_build_object('bosses',
           greatest(coalesce((new.stats->>'bosses')::bigint, 0),
                    coalesce((old.stats->>'bosses')::bigint, 0)))
      || jsonb_build_object('playtime',
           greatest(coalesce((new.stats->>'playtime')::bigint, 0),
                    coalesce((old.stats->>'playtime')::bigint, 0)));

    -- recorde de pontos: uma partida excepcional passa de 300 mil com
    -- dificuldade máxima; acima de 5 milhões não existe jogando limpo.
    if coalesce((new.stats->>'bestScore')::bigint, 0) > 5000000 then
      motivos := motivos || 'recorde de pontos impossível; ';
      new.stats := new.stats || jsonb_build_object('bestScore', coalesce(old.stats->'bestScore', '0'::jsonb));
    end if;

    -- a onda mais alta registrada é limitada: ninguém passa da 200
    if coalesce((new.stats->>'bestWave')::bigint, 0) > 200 then
      motivos := motivos || 'onda impossível; ';
      new.stats := new.stats || jsonb_build_object('bestWave', coalesce(old.stats->'bestWave', '0'::jsonb));
    end if;
  end if;

  -- ============================================================
  -- 5. O NOME NÃO MUDA
  -- Trocar de nome quebraria presentes, mercado e ranking.
  -- ============================================================
  if new.username is distinct from old.username then
    motivos := motivos || 'tentou trocar de nome; ';
    new.username := old.username;
  end if;

  -- ------------------------------------------------------------
  -- registro da suspeita
  -- ------------------------------------------------------------
  if motivos <> '' then
    insert into public.cheat_log (user_id, username, motivo, pedido, permitido)
    values (old.id, old.username, motivos, pedido,
            jsonb_build_object('coins', new.coins, 'xp', new.xp, 'level', new.level));
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ------------------------------------------------------------------
-- O gatilho de carimbo precisa rodar DEPOIS da trava, senão o cálculo
-- de tempo decorrido usaria o horário já atualizado e liberaria ganho
-- infinito (bastaria salvar duas vezes seguidas).
-- Recriamos com nome que venha depois na ordem alfabética.
-- ------------------------------------------------------------------
drop trigger if exists profiles_touch on public.profiles;
drop trigger if exists zz_profiles_touch on public.profiles;
create trigger zz_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------------
-- Ranking limpo
--
-- Esconde apenas quem é REINCIDENTE: 3 ou mais suspeitas na última
-- semana. Um registro isolado pode ser relógio fora de hora, internet
-- ruim ou um save repetido — não é justo tirar alguém do ranking por
-- isso. Quem realmente trapaceia dispara várias ao mesmo tempo.
-- ------------------------------------------------------------------
-- (a visão antiga pode ter outras colunas; recriamos do zero)
drop view if exists public.leaderboard;
create view public.leaderboard as
  select p.username, p.level, p.xp,
         coalesce((p.stats->>'bestScore')::bigint, 0) as best_score,
         coalesce((p.stats->>'kills')::bigint, 0)     as kills
    from public.profiles p
   where (
     select count(*) from public.cheat_log c
      where c.user_id = p.id
        and c.created_at > now() - interval '7 days'
   ) < 3
   order by best_score desc
   limit 100;

grant select on public.leaderboard to anon, authenticated;

-- ------------------------------------------------------------------
-- Privacidade: o perfil completo é particular. O ranking acima expõe
-- exclusivamente username, nível, XP, pontuação e abates.
-- ------------------------------------------------------------------
drop policy if exists "leitura publica" on public.profiles;
drop policy if exists "dono le" on public.profiles;
create policy "dono le" on public.profiles for select
  using (auth.uid() = id);

revoke all on function public.guard_profile_update() from public, anon, authenticated;
