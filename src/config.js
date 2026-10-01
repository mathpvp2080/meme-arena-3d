/* =====================================================================
   MEME ARENA 3D — configuração do backend

   MODO LOCAL (padrão): deixe as duas chaves vazias. As contas ficam
   salvas só neste navegador. Ótimo pra testar, mas sem multiplayer
   e sem trocas entre jogadores.

   MODO ONLINE: crie um projeto grátis em https://supabase.com,
   rode o arquivo supabase/schema.sql no SQL Editor e cole abaixo as
   duas chaves que aparecem em Project Settings → API.
   A chave "anon" é PÚBLICA por design — pode ficar aqui no código.
   A segurança vem das políticas RLS definidas no schema.sql.
   ===================================================================== */
window.MA = window.MA || {};
window.MA.CONFIG = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',

  /* economia */
  START_COINS: 600,          // moedas que todo jogador novo recebe
  MULTIPLAYER_LEVEL: 5,      // nível mínimo pra entrar no multiplayer
  SELL_RATE: 0.5,            // quanto do preço você recebe ao vender
  MAX_LEVEL: 60
};
