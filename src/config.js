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
  SUPABASE_URL: 'https://qmxjpgetdigryjwzpzvk.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFteGpwZ2V0ZGlncnlqd3pwenZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NzY1NDAsImV4cCI6MjEwNjQ1MjU0MH0.OQQDTan6K-dObvBVDsuuQNVpMNeodo808S4Zt8Wu_to',

  /* economia */
  START_COINS: 600,         // moedas que todo jogador novo recebe
  MULTIPLAYER_LEVEL: 5,      // nível mínimo pra entrar no multiplayer
  SELL_RATE: 0.5,            // quanto do preço você recebe ao vender
  MAX_LEVEL: 60
};
