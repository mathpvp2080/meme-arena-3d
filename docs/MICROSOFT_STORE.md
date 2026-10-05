# Publicar o MEME ARENA 3D na Microsoft Store

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
   MEME ARENA 3D
   ```

   Se estiver ocupado, tente nesta ordem:
   - `MEME ARENA 67`
   - `MEME ARENA 3D — TEMPORADA 67`
   - `Arena 67 3D`

   > Use sempre a identidade aprovada no Partner Center. O identificador interno
   > antigo do pacote pode continuar igual para preservar atualizações.
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
   | App name | `MEME ARENA 3D` |
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

Classificação confirmada pela IARC/loja: **Livre (L)** — equivalente a *Everyone*. Esse é o selo exibido na entrada do jogo, na Política de Privacidade e nos Termos; mantenha os três iguais em qualquer atualização.

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
MEME ARENA 3D
```

**Descrição curta (até 100 caracteres)**

```
Sobreviva a ondas infinitas de memes da internet nesta arena 3D de ação.
```

**Descrição completa**

```
O protocolo 6·7 abriu a arena. Seis partes coragem, sete partes caos.

MEME ARENA 3D é um jogo de ação em terceira pessoa (ou primeira, se preferir)
onde você enfrenta ondas infinitas em uma cidade neon. Cada onda vem mais
rápida, mais forte e mais absurda que a anterior.

O QUE TEM NO JOGO

• 5 mapas — Arena Brainrot, Planície de Ohio, Esgoto Skibidi, Praia do Tubarão
  e Núcleo do Servidor, cada um com ambientação, cores e perigos próprios.
• 16 inimigos diferentes, dos corredores rápidos aos tanques blindados, mais
  versões de elite com coroa dourada.
• 5 chefes com três fases cada, invocação de lacaios e ataques especiais.
• 20 melhorias permanentes — a cada onda vencida você escolhe uma de três cartas.
• 14 skins, 9 armaduras, 9 armas e 3 habilidades com modelos e mecânicas próprias.
• Temporada 67 com caixas de moeda virtual, chances visíveis, garantia da 7ª
  abertura, fragmentos de duplicata e recompensas aleatórias de chefe.
• Modo Brainrot: encha a barra durante o combate e ative a ultimate.
• Progressão de conta com nível, experiência, moedas e sete patentes.
• Loja, inventário, prévias 3D, presentes e mercado entre jogadores.
• MULTIPLAYER ONLINE: co-op para até 4 pessoas contra as ondas, ou PvP todos
  contra todos — primeiro a 10 abates leva. Salas por código de 4 letras.
• Chat rápido na sala e sistema de presentes entre jogadores.

CONTROLES

WASD para mover, mouse para mirar, espaço para pular, Shift para o dash com
invulnerabilidade, E para a ultimate, V para alternar entre primeira e terceira
pessoa. Também funciona com controles de toque.

GRATUITO DE VERDADE

Sem anúncios. Sem compras com dinheiro real. Toda a moeda do jogo é ganha
jogando. A conta online sincroniza o progresso; o modo Convidado é temporário,
fica somente na sessão do navegador e não cria cadastro no servidor.
```

**Palavras-chave de busca** (até 7)

```
meme, brainrot, arena, ação 3d, sobrevivência, multiplayer, horda
```

**Capturas de tela** (já estão no repositório, em `assets/screens/`)

| Arquivo | Legenda sugerida |
|---|---|
| `00-season67.jpg` | Arte oficial da Temporada 67 |
| `01-arena.png` | A arena neon: ondas vindo pra cima |
| `02-ohio.png` | Planície de Ohio e seu milharal infinito |
| `03-praia.png` | Praia do Tubarão |
| `04-esgoto.png` | Esgoto Skibidi |
| `05-servidor.png` | Núcleo do Servidor |

> As capturas antigas `06-hub.png` e `07-loja.png` não devem ser enviadas. Refaça
> lobby e loja em um aparelho real depois da aprovação visual final.

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


---

## Reprovação 10.1.2.10 (tela em branco) — o que foi feito

**Relatório de 05/10/2026, Product ID `9MW26RG35NDT`:** "the product does not
display any content and it only displays a blank screen after launch"
(Microsoft Surface Laptop, build 26200.8037).

### Diagnóstico

A máquina de certificação é um notebook/VM sem GPU dedicada e com rede
restrita. Três pontos do jogo transformavam isso em tela preta:

1. **WebGL recusado.** O renderer era criado só com
   `powerPreference:'high-performance'`. Se o contexto falha, `boot()` lançava
   erro e o jogo parava.
2. **Botão de recuperação invisível.** A tela de erro existia, mas o botão
   "ENTRAR NA ARENA" só ganha opacidade com a classe `.ready`, que nunca era
   adicionada no caminho de falha. Resultado: fundo escuro e nada clicável.
3. **Rede sem tempo limite.** O SDK do Supabase vinha de CDN com `await` sem
   timeout. Com a rede bloqueada, a promessa nunca resolvia e nenhuma tela era
   exibida depois da entrada.

Ainda somava-se o título recortado por gradiente
(`-webkit-background-clip:text` + `color:transparent`), que não é pintado em
alguns rasterizadores por software: o texto ficava literalmente invisível.

### Correções (todas validadas por `npm test`)

| Correção | Onde |
|---|---|
| Renderer tenta 3 configurações, incluindo WebGL por software (`failIfMajorPerformanceCaveat:false`) | `src/game.js` |
| Tela de falha fica visível e com botão "RECARREGAR JOGO" clicável | `src/game.js`, `css/season67.css` |
| Aviso específico quando não há WebGL (driver/aceleração) | `src/game.js` |
| `MA.Net.init()` e `MA.Net.restore()` com tempo limite de 7s | `src/game.js` |
| Carregamento do SDK remoto com tempo limite de 8s e queda para modo local | `src/net.js` |
| Rede de segurança: em 12s sempre há uma tela na frente do jogador | `src/game.js` |
| CSS crítico embutido no `index.html` (conteúdo visível mesmo sem as folhas externas) | `index.html` |
| Fallback de cor sólida quando o recorte de texto por gradiente não existe | `css/season67.css` |
| `display` do manifesto passou de `fullscreen` para `standalone` (recomendado para pacote Windows) | `manifest.webmanifest` |

### Como reenviar

1. **Publique o site atualizado** — o pacote da Store é um PWA hospedado: ele
   carrega `https://mathpvp2080.github.io/meme-arena-3d/`. Enquanto o GitHub
   Pages não servir esta versão, o app da loja continua com o código antigo.
2. Abra a URL no Edge e force `Ctrl+Shift+R`. Confirme que a entrada aparece.
3. Gere o pacote de novo no PWABuilder com:
   - **App version** `1.0.2`
   - **Classic package version** `1.0.1`
   (os demais campos seguem em `docs/IDENTIDADE_STORE.md`)
4. Instale o `.sideload.msix` do zip no seu PC e **abra o app** antes de enviar.
   Teste também com a internet desligada: a entrada precisa aparecer mesmo assim.
5. Partner Center → novo envio → suba o `.msixbundle` → em **Notas para
   certificação**, cole o texto abaixo.

### Texto para "Notes to certification"

```
Product ID: 9MW26RG35NDT

Thank you for the detailed report (10.1.2.10, blank screen on launch).

Root cause: the WebGL context was requested only with
powerPreference:"high-performance" and the recovery UI stayed hidden when the
context failed, so on a machine without hardware acceleration the app showed a
dark, empty screen. Network calls also had no timeout, which could leave the
first screen unrendered on a restricted network.

Fixes in this build (1.0.2):
- WebGL context is now created with three progressive fallbacks, including a
  software-rendering friendly configuration.
- If 3D is unavailable, a visible, readable message and a working
  "reload" button are displayed instead of a blank screen.
- All network calls have timeouts (7-8s) and the app falls back to fully
  offline local mode.
- A watchdog guarantees that a screen is presented within 12 seconds of launch.
- Critical CSS is inlined so content renders even if stylesheets fail.

The app is fully playable offline after launch and requires no sign-in: the
first screen offers "JOGAR COMO CONVIDADO" (play as guest).
```
