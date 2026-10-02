# Publicar o MEME ARENA: APOCALYPSE na Microsoft Store

Guia passo a passo, do zero. Você **não** precisa instalar nada no PC nem usar
o terminal: tudo é feito por sites.

Tempo estimado: ~40 minutos de trabalho + 1 a 3 dias de espera pela análise da
Microsoft.

Custo: **R$ 0,00**. A Microsoft removeu a taxa de cadastro para contas
individuais.

---

## Antes de começar, tenha em mãos

- Uma **conta Microsoft** (a mesma do Windows, Outlook, Xbox — qualquer uma serve).
- Um **documento com foto** (RG ou CNH) para a verificação de identidade.
- A câmera do celular ou do PC (vão pedir uma selfie).

---

## PARTE 1 — Criar a conta de desenvolvedor (grátis)

1. Abra <https://partner.microsoft.com/dashboard/registration>
2. Clique no botão **"Get started for free"** / **"Introdução gratuitamente"**.
3. Entre com sua **conta Microsoft**.
4. Escolha **"Individual developer"** / **"Desenvolvedor individual"**.
   > Não escolha "Company": essa custa US$ 99 e exige CNPJ.
5. Preencha:
   - **Publisher display name**: o nome que aparece na loja como autor do jogo.
     Sugestão: `MathPvP Games`. (Pode ser seu apelido; não precisa ser nome real.)
   - País/região: **Brasil**.
6. Faça a **verificação de identidade**: enviar foto do documento + uma selfie.
   Costuma sair na hora, mas pode levar até 1 dia útil.
7. Quando aprovar, anote o seu **Publisher ID**. Para encontrá-lo:
   Partner Center → engrenagem ⚙ no topo → **Account settings** → **Identity** / **Organization profile**.
   Você vai copiar 3 valores de lá na Parte 3:
   - `Package/Identity/Name` (algo como `12345MathPvPGames.MEMEARENAAPOCALYPSE`)
   - `Package/Identity/Publisher` (algo como `CN=ABCD1234-...`)
   - `Package/Properties/PublisherDisplayName`

---

## PARTE 2 — Reservar o nome do jogo

1. No Partner Center, menu da esquerda → **Apps and games** → botão **+ New product** → **MSIX or PWA app**.
2. Em **"Reserve your app's name"**, digite:

   ```
   MEME ARENA: APOCALYPSE
   ```

   Se estiver ocupado, tente nesta ordem:
   - `MEME ARENA APOCALYPSE`
   - `MEME ARENA: APOCALYPSE 3D`
   - `Meme Arena Apocalypse - Brainrot`

   > 💡 Reservar nome é **grátis e sem limite**. Reserve os três de uma vez:
   > você escolhe qual usar só na hora de publicar.
3. Clique em **Reserve product name**.

---

## PARTE 3 — Gerar o pacote com o PWABuilder

O jogo já está preparado (manifesto, ícones, capturas de tela e service worker).

1. Abra <https://www.pwabuilder.com>
2. Cole a URL do jogo e clique em **Start**:

   ```
   https://mathpvp2080.github.io/meme-arena-3d/
   ```

3. Espere a análise. Deve dar nota alta nos três cartões
   (**Manifest**, **Service Worker**, **Security**). Se algum item aparecer em
   amarelo, me avise com um print.
4. Clique em **Package for stores** → cartão **Windows** → **Generate Package**.
5. Vai abrir um formulário. Preencha **exatamente** com os dados do seu Partner Center:

   | Campo | O que colocar |
   |---|---|
   | Package ID | o `Package/Identity/Name` da Parte 1 |
   | Publisher display name | o `PublisherDisplayName` da Parte 1 |
   | Publisher ID | o `Package/Identity/Publisher` (começa com `CN=`) |
   | App name | `MEME ARENA: APOCALYPSE` |
   | App version | `1.0.1` |
   | Classic package version | `1.0.0` |

   > ⚠️ A "App version" precisa ser **maior** que a "Classic package version".

6. Clique em **Download Package**. Você vai receber um `.zip`.
7. Descompacte: dentro tem um arquivo **`.msixbundle`** — é esse que vai pra loja.

---

## PARTE 4 — Enviar para a loja

No Partner Center, dentro do produto que você reservou, preencha as seções:

### 4.1 Pricing and availability
- **Price**: `Free`
- **Markets**: deixe todos (ou escolha só Brasil se preferir começar pequeno).
- **Visibility**: `Public`

### 4.2 Properties
- **Category**: `Games` → subcategoria `Action & adventure`
- **Privacy policy URL**:

  ```
  https://mathpvp2080.github.io/meme-arena-3d/privacidade.html
  ```

- **Website**:

  ```
  https://mathpvp2080.github.io/meme-arena-3d/
  ```

- **Support contact info**: seu e-mail, ou
  `https://github.com/mathpvp2080/meme-arena-3d/issues`

### 4.3 Age ratings
Responda o questionário da IARC. Para este jogo:
- Violência: **sim, fantasiosa / cartunesca**, sem sangue realista.
- Sem conteúdo sexual, sem drogas, sem jogo de azar, sem palavrão.
- **Compras no app: NÃO** (a moeda é fictícia e só se ganha jogando).
- **Interação entre usuários: SIM** (tem chat no multiplayer) — isso é importante
  marcar, senão pode ser reprovado depois.

A classificação deve sair em torno de **10+ / Livre**.

### 4.4 Packages
Arraste o arquivo **`.msixbundle`** que você baixou na Parte 3.

### 4.5 Store listing (textos prontos abaixo)
Copie e cole da seção seguinte.

### 4.6 Submit
Clique em **Submit to the Store**. A análise leva de **1 a 3 dias**.
Você recebe e-mail quando for aprovado (ou se precisar corrigir algo).

---

## Textos prontos para a listagem

**Nome do produto**

```
MEMEPOCALYPSE
```

**Descrição curta (até 100 caracteres)**

```
Sobreviva a ondas infinitas de memes da internet nesta arena 3D de ação.
```

**Descrição completa**

```
A internet colapsou e os memes ganharam corpo. Bem-vindo ao apocalipse.

MEME ARENA: APOCALYPSE é um jogo de ação em terceira pessoa (ou primeira, se preferir)
onde você enfrenta ondas infinitas de criaturas inspiradas na cultura da
internet. Cada onda vem mais rápida, mais forte e mais absurda que a anterior.

O QUE TEM NO JOGO

• 5 mapas — Arena Brainrot, Planície de Ohio, Esgoto Skibidi, Praia do Tubarão
  e Núcleo do Servidor, cada um com ambientação, cores e perigos próprios.
• 16 inimigos diferentes, dos corredores rápidos aos tanques blindados, mais
  versões de elite com coroa dourada.
• 5 chefes com três fases cada, invocação de lacaios e ataques especiais.
• 20 melhorias permanentes — a cada onda vencida você escolhe uma de três cartas.
• Arsenal de armas, de pistola a lançador, cada uma com cadência e dano próprios.
• Modo Brainrot: encha a barra matando memes e vire invencível por alguns
  segundos, com dano quase dobrado.
• Progressão de conta com nível, experiência, moedas e sete patentes.
• Loja de skins e armaduras, inventário e mercado entre jogadores.
• MULTIPLAYER ONLINE: co-op para até 4 pessoas contra as ondas, ou PvP todos
  contra todos — primeiro a 10 abates leva. Salas por código de 4 letras.
• Chat rápido na sala e sistema de presentes entre jogadores.

CONTROLES

WASD para mover, mouse para mirar, espaço para pular, Shift para o dash com
invulnerabilidade, E para a ultimate, V para alternar entre primeira e terceira
pessoa. Também funciona com controles de toque.

GRATUITO DE VERDADE

Sem anúncios. Sem compras com dinheiro real. Toda a moeda do jogo é ganha
jogando. Seu progresso fica salvo na sua conta e acompanha você em qualquer
aparelho.
```

**Palavras-chave de busca** (até 7)

```
meme, brainrot, arena, ação 3d, sobrevivência, multiplayer, horda
```

**Capturas de tela** (já estão no repositório, em `assets/screens/`)

| Arquivo | Legenda sugerida |
|---|---|
| `01-arena.png` | A arena neon: ondas de memes vindo pra cima |
| `02-ohio.png` | Planície de Ohio e seu milharal infinito |
| `03-praia.png` | Praia do Tubarão |
| `04-esgoto.png` | Esgoto Skibidi |
| `05-servidor.png` | Núcleo do Servidor |
| `06-hub.png` | Seu perfil: nível, moedas e patente |
| `07-loja.png` | Loja de skins e armas |

> Baixe-as em
> <https://github.com/mathpvp2080/meme-arena-3d/tree/main/assets/screens>
> (clique na imagem → botão **Download raw file**).

**Notas para a certificação** (campo "Notes for certification")

```
O jogo é 100% gratuito, sem anúncios e sem compras com dinheiro real.
Para testar o modo multiplayer basta criar uma conta dentro do jogo
(nome de jogador e senha, sem e-mail) e chegar ao nível 5, ou usar a
conta de teste: usuário "Teste831354", senha "senha123".
O multiplayer libera no nível 5; a conta de teste já está acima disso.
```

---

## Antes de enviar: rode estes SQL

O botão **Opções → Apagar minha conta** precisa de uma função no banco
(exigência da loja: o usuário tem que conseguir apagar os próprios dados).

**1) `supabase/schema_conta.sql`** — botão "Apagar minha conta"
**2) `supabase/schema_multiplayer.sql`** (de novo, foi atualizado) — mercado e presentes
**3) `supabase/schema_antitrapaca.sql`** — travas contra moedas/níveis falsos

Para cada um: Supabase → **SQL Editor** → **New query** → colar tudo → **Run**.
Rode na ordem acima. Todos podem ser rodados mais de uma vez sem quebrar nada.

---

## Se der problema

| Mensagem | O que fazer |
|---|---|
| "Package identity does not match" | Os 3 campos da Parte 3 estão diferentes do Partner Center. Copie de novo, sem espaços sobrando. |
| "App version must be greater than..." | Aumente a "App version" (ex.: `1.0.2`) e gere o pacote de novo. |
| PWABuilder reclama do manifesto | Aperte Ctrl+Shift+R na página do jogo e tente de novo; pode ser cache. |
| Reprovado por "user-generated content" | Marque "interação entre usuários = sim" na classificação etária. |
