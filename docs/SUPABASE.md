# Como ligar as contas online (Supabase) — passo a passo

O jogo **já funciona sem isso**: sem configurar nada, ele salva a conta no
próprio navegador (modo 💾 LOCAL). Siga este guia quando quiser que a conta
funcione em **qualquer dispositivo** — e é o que vai permitir o multiplayer
na Etapa 3.

Tudo aqui é **gratuito** e leva uns 10 minutos.

---

## 1. Criar a conta no Supabase

1. Abra <https://supabase.com> e clique no botão verde **Start your project**
   (canto superior direito).
2. Clique em **Continue with GitHub** e autorize — assim você usa a mesma conta
   do GitHub que já criou.

## 2. Criar o projeto

1. Já dentro do painel, clique em **New project** (botão verde, no meio da tela).
2. Preencha:
   - **Name**: `meme-arena-3d`
   - **Database Password**: clique em **Generate a password** e **copie num
     bloco de notas** (você não vai precisar dela no jogo, mas guarde).
   - **Region**: escolha `South America (São Paulo)` — é a mais perto do Brasil.
3. Clique em **Create new project** e espere ~2 minutos (aparece uma barrinha
   "Setting up project").

## 3. Criar a tabela do jogo

1. No menu da **esquerda**, clique no ícone **SQL Editor** (parece uma folha com
   `>_`).
2. Clique em **+ New query** (canto superior).
3. Abra o arquivo `supabase/schema.sql` deste repositório, **copie tudo** e
   **cole** na caixa grande do meio.
4. Clique em **Run** (botão verde no canto inferior direito, ou `Ctrl+Enter`).
5. Deve aparecer **Success. No rows returned** — é isso mesmo, deu certo.

## 4. Desativar a confirmação de e-mail (IMPORTANTE)

O jogo usa só **nome + senha**, então não dá para confirmar e-mail.

1. Menu da esquerda → **Authentication** (ícone de pessoa).
2. Na coluna que abre, clique em **Sign In / Providers** (em versões antigas:
   **Providers**).
3. Clique em **Email** para expandir.
4. **Desligue** a chavinha **Confirm email**.
5. Clique em **Save** (canto inferior direito).

> Se esquecer desta etapa, ao criar uma conta o jogo mostra a mensagem
> "Confirmação de e-mail está ativada" e não entra.

## 5. Copiar as duas chaves

1. Menu da esquerda → engrenagem **Project Settings** (bem embaixo).
2. Clique em **API Keys** (ou **API**).
3. Copie os dois valores:
   - **Project URL** → algo como `https://abcdefgh.supabase.co`
   - **anon public** (chave longa que começa com `eyJ...`)

> Essas duas chaves são **públicas de propósito** — podem ficar no GitHub sem
> problema. A segurança vem das regras RLS que o `schema.sql` criou.
> **Nunca** copie a chave `service_role`.

## 6. Colar as chaves no jogo

1. No GitHub, abra o repositório `meme-arena-3d`.
2. Entre na pasta **src** e clique no arquivo **config.js**.
3. Clique no **lápis** ✏️ (canto superior direito do arquivo) para editar.
4. Nas primeiras linhas, troque:

```js
SUPABASE_URL: '',
SUPABASE_ANON_KEY: '',
```

por (usando os seus valores):

```js
SUPABASE_URL: 'https://abcdefgh.supabase.co',
SUPABASE_ANON_KEY: 'eyJhbGciOi...sua-chave-longa...',
```

5. Desça até o fim da página e clique no botão verde **Commit changes...** e
   depois **Commit changes** de novo.
6. Espere ~1 minuto e recarregue o jogo. No topo da tela de login o selo deve
   mudar de **💾 LOCAL** para **🌐 ONLINE**.

---

## Dúvidas rápidas

**Perdi o progresso quando troquei para online?**
Sim — a conta local fica só no navegador. Crie a conta de novo no modo online;
a partir daí ela vive na nuvem.

**Dois jogadores podem usar o mesmo nome?**
Não. O banco bloqueia nomes repetidos.

**Quanto custa?**
Nada. O plano gratuito cobre 50 mil usuários ativos por mês e 500 MB de banco —
muito mais do que esse jogo precisa. Projetos sem acesso por 7 dias entram em
pausa; basta clicar em **Restore** no painel.

**Como vejo quem está jogando?**
Menu da esquerda → **Table Editor** → tabela **profiles**.
