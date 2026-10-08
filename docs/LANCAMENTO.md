# Plano de lançamento — MEME ARENA 3D · Temporada 67

Atualizado em **4 de outubro de 2026**.

## 1. Publicação técnica

1. Publique esta branch em um ambiente HTTPS.
2. Em um projeto Supabase novo, execute primeiro `supabase/schema.sql`.
3. Execute **todo** o arquivo `supabase/DEPLOY_LAUNCH.sql` no SQL Editor.
   - O patch pode ser reaplicado.
   - Ele remove somente contas cujo perfil corresponde exatamente a `Convidado` + quatro números **e** cujo e-mail técnico corresponde ao mesmo username.
   - Ele reserva esse padrão, instala exclusão de conta, moderação, anti-trapaça e economia sazonal autoritativa.
4. Para apagar outros testes, edite a lista exata em `supabase/cleanup_test_accounts_by_name.sql`, confira a prévia e somente então execute. Não use prefixos ou curingas.
5. Rode as consultas de verificação no final desta página.

A chave `anon` do Supabase pode aparecer no cliente; a proteção real é feita por RLS, funções autenticadas e validações no banco. Nunca coloque uma `service_role` no repositório ou no navegador.

## 2. Verificação do Supabase

```sql
-- Nenhum convidado legado deve permanecer.
select count(*) from public.profiles where username ~* '^Convidado[0-9]{4}$';

-- As três operações sazonais devem existir.
select proname
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('season67_open_box','season67_forge_box','season67_boss_reward');

-- Conferir RLS nas tabelas públicas.
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
order by relname;

-- Limpeza operacional sugerida.
delete from public.rooms where updated_at < now() - interval '15 minutes';
delete from public.reports where created_at < now() - interval '180 days';
```

No painel de autenticação:

- manter cadastro por e-mail habilitado, pois o jogo usa um e-mail técnico interno;
- manter confirmação de e-mail desabilitada enquanto o produto não pedir um endereço real;
- configurar limites de cadastro/login compatíveis com o público e acompanhar picos;
- revisar logs de autenticação, `cheat_log` e denúncias após o lançamento.

## 3. Contas e privacidade

- **Convidado:** existe apenas em `sessionStorage`; não chama `signUp`, não cria `auth.users` e não usa a senha pública antiga.
- **Conta:** usa username e senha. O jogador é avisado antes do cadastro de que ainda não existe recuperação automática.
- **Exclusão:** Opções → Apagar minha conta executa `delete_my_account()`.
- **Documentos:** `privacidade.html` e `termos.html`, também acessíveis pelas Opções.
- **Retenção:** executar a limpeza de denúncias antigas periodicamente ou agendá-la no banco.

## 4. Economia e integridade

Para contas online, o servidor é a autoridade de:

- Caixa 67 e Cofre 67, com ramo inicial 50% skin / 50% recursos;
- distribuição condicional de raridade 40 / 29,5 / 20 / 10 / 0,5%;
- conversão automática de skins repetidas em moedas;
- drops de chefe e recarga anti-duplicação;
- anúncios, cancelamentos, compras e presentes do mercado.

O trigger `guard_seasonal_inventory` rejeita inserção direta de item sazonal pelo cliente. O modo local/convidado mantém a simulação local, sem participar do mercado online.

## 5. QA obrigatório antes de abrir ao público

Execute:

```bash
npm test
for f in src/*.js sw.js scripts/*.mjs; do node --check "$f"; done
```

Faça também a matriz manual em aparelhos reais:

| Área | Casos mínimos |
|---|---|
| Entrada | arte carrega; classificação e botão aparecem; teclado, mouse e toque entram |
| Conta | criar, sair, entrar, senha errada, nome reservado, apagar conta |
| Convidado | entrar, recarregar a aba, jogar, sair; confirmar zero registros no Supabase |
| Lobby | escala em 1366×768, 1920×1080, celular horizontal e tela com notch |
| Combate | cada uma das 9 armas e 3 habilidades; chefe; pausa; Opções acima da pausa |
| Temporada | Caixa 67, Cofre, saldo insuficiente, garantia, duplicata, forja e drop de chefe |
| Mercado | vender, cancelar, comprar, presentear, concorrência entre duas contas |
| Multiplayer | criar sala, entrar, desconectar, bloquear e denunciar |
| PWA | instalar, atualizar do cache v34 para v35, abrir offline e recuperar conexão |
| Acessibilidade | `prefers-reduced-motion`, zoom e navegação por foco nos menus |

Compatibilidade-alvo: versões atuais de Chrome/Edge e Firefox em desktop; Chrome Android e Safari iOS em paisagem. WebGL e WebAudio são obrigatórios para o modo 3D.

## 6. Itens externos que exigem decisão humana

Estes pontos não podem ser aprovados apenas por código:

1. **Classificação indicativa oficial:** o selo Livre no jogo é a apresentação pretendida. Confirme a classificação no órgão/plataforma de distribuição antes de tratá-la como oficial.
2. **Propriedade intelectual:** o jogo contém nomes e referências a memes/personagens de terceiros no catálogo de inimigos e itens. A Temporada 67 usa números e arte própria, mas o catálogo antigo requer autorização, substituição por criações originais ou parecer jurídico antes de uma campanha comercial ampla.
3. **Contas de teste fora do padrão:** só o responsável pelo projeto pode confirmar os nomes exatos. Use a lista explícita; nunca apague por prefixo genérico.
4. **Capturas das lojas:** refaça as screenshots depois da aprovação visual final em aparelhos reais. Não use capturas antigas que mostrem o lobby anterior.

## 7. Rollback

- O frontend estático pode voltar ao commit anterior sem migrar dados.
- Não remova imediatamente as funções sazonais após rollback: clientes em cache podem continuar chamando-as.
- Antes de alterar tabelas, exporte `profiles`, `market_listings`, `gifts`, `reports` e `cheat_log` pelo painel administrativo.
- O patch de limpeza de convidados é intencionalmente irreversível; aplique somente após backup.
