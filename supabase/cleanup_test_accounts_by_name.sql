-- =====================================================================
-- Exclusão opcional de OUTRAS contas de teste por lista explícita
--
-- Segurança: a lista começa vazia e o script não faz nada. Adicione somente
-- nomes exatos que você reconhece como testes. Não use prefixos nem curingas.
-- Execute separadamente; este arquivo não faz parte do DEPLOY_LAUNCH.sql.
-- =====================================================================

create temporary table test_accounts_to_remove (username text primary key) on commit drop;

-- EXEMPLO (remova os comentários e troque pelos nomes exatos confirmados):
-- insert into test_accounts_to_remove(username) values
--   ('NomeExatoDoTeste1'),
--   ('NomeExatoDoTeste2');

-- Prévia: confira esta lista ANTES de executar o bloco de exclusão abaixo.
select p.id, p.username, u.created_at
  from public.profiles p
  join auth.users u on u.id=p.id
  join test_accounts_to_remove t on lower(t.username)=lower(p.username)
 order by u.created_at;

-- Exclusão limitada exclusivamente à lista acima.
delete from auth.users u
 using public.profiles p, test_accounts_to_remove t
 where p.id=u.id
   and lower(t.username)=lower(p.username);
