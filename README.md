<div align="center">

![MEME ARENA 3D — Temporada 67](assets/splash-season67.jpg)

# 💀 MEME ARENA 3D

**Um shooter de arena 3D que roda direto no navegador.**
Sobreviva a ondas infinitas de memes, escolha perks, derrube chefes gigantes.

[**▶ JOGAR AGORA**](https://mathpvp2080.github.io/meme-arena-3d/)

`Three.js` · `WebGL` · `WebAudio` · **zero dependências em runtime** · **zero build**

</div>

---

## 🎮 Sobre

A internet colapsou e o **Brainrot** vazou dos servidores: os memes ganharam forma 3D.
Escolha entre animais, plantas e monstros absurdos, monte o equipamento e segure a arena.

### Temporada 1 · 67

- **Período:** 03/10/2026 a 28/11/2026; a próxima temporada começa em 29/11/2026.
- Identidade visual própria em azul elétrico, rosa-magenta, ciano e violeta, com a **Arena 67**.
- **Caixa 67** e **Cofre 67** usam somente moedas virtuais. Cada abertura e cada
  chefe escolhem primeiro **50% skin / 50% recursos automáticos** (moedas, XP ou ambos).
- No ramo de skin, as chances condicionais são: **40% Uncommon, 29,5% Legendary,
  20% Mythical, 10% Ultimate e 0,5% Secret**. Uma recompensa entrega no máximo uma skin.
- Skins Common são exclusivas da loja do sistema. As outras 28 skins indicam se vêm
  de caixa, chefe ou ambos; repetidas são convertidas automaticamente em moedas.
- Cada skin tem valor-base progressivo dentro de sua raridade. No mercado de jogadores,
  o preço é fixo em **70% do valor-base** e o vendedor recebe o total, sem taxa.
- A temporada usa o conceito numérico do meme. Não inclui música, voz, foto ou
  arte da trend; ambientes, efeitos e sons são autorais. Os modelos 3D externos
  são identificados e creditados conforme suas licenças.

As 33 skins jogáveis usam avatares R1/R2 do projeto **Polygonal Mind 100 Avatars**,
transformados em GLBs compactos com rig e clipes `idle`, `run` e `punch`. O catálogo
inclui objetos, comidas, pessoas e criaturas com geometrias próprias. O corpo
procedural permanece apenas como fallback de carregamento.
Equipamentos, efeitos e os visuais de reserva dos NPCs continuam gerados por código.
Os quatro inimigos ativos usam seus próprios GLBs creditados. A entrada e o lobby usam
duas artes autorais da Temporada 67; a trilha e os efeitos são sintetizados com WebAudio.

## ✨ Funcionalidades

| | |
|---|---|
| 🧟 **4 inimigos** | Doge Corrompido, Tralalero Tralala, Tung Tung Sahur e Bombardiro Crocodilo |
| 👹 **4 chefes** | Versões gigantes de Doge, Tralalero, Tung Tung e Bombardiro, em rotação a cada 5 ondas |
| 🔫 **9 armas** | Laser, shotgun, bumerangue, RPG, orbe gravitacional, minigun, prisma, railgun e Pulso 67 |
| ✦ **3 habilidades** | Repulsão 6, Passo 7 e Sobrecarga 67 com mecânicas e recargas próprias |
| 🃏 **20 perks** | Escolha 1 de 3 cartas a cada onda. Comuns, raras e épicas. Acumulam entre si |
| 🧠 **Ultimate** | Encha o medidor de Brainrot e vire invencível com dano x1.8 e cadência dobrada |
| 🎁 **6 itens** | Cura, dano dobrado, velocidade, escudo, overdrive e a Nuke de Meme |
| 👑 **Elites** | Inimigos com coroa dourada: 2.6x vida e 2.4x pontos |
| 🤖 **7 tipos de IA** | Perseguir, flanquear, orbitar, atirar, investir, teleportar e bombardear |
| 📊 **4 dificuldades** | Normie, Meme Lord, Sigma e Brainrot |
| 🏆 **Progressão** | Combo multiplicador, 7 ranks, recordes locais e estatísticas de fim de partida |
| 🧭 **Lobby Meme Arena** | Identidade permanente em adesivos recortados, personagem central, menu lateral colorido e modo pré-definido acima do JOGAR compacto; apenas o fundo acompanha a temporada |
| 📱 **Mobile** | Joystick virtual, botões de ação e layout responsivo |
| 🔌 **Offline** | PWA com service worker — instala e joga sem internet |

## 🕹️ Controles

| Tecla | Ação |
|---|---|
| `W` `A` `S` `D` | Mover |
| `Mouse` | Olhar / mirar |
| `Clique esquerdo` | Atirar |
| `Espaço` | Pular |
| `Shift` | Dash (com frames de invencibilidade) |
| `Q` / `Roda` / `1`–`3` | Trocar entre as armas equipadas |
| `F` | Usar habilidade especial equipada |
| `E` | Ultimate (Brainrot em 100%) |
| `Esc` / `P` | Pausar |
| `M` | Mudo |

No celular: joystick à esquerda, botões de ação à direita, arraste na tela para olhar.

## 🚀 Publicar no GitHub Pages

O projeto é **estático puro** — não precisa de build, bundler nem Node.

```bash
git init
git add .
git commit -m "feat: Meme Arena 3D"
git branch -M main
git remote add origin https://github.com/mathpvp2080/meme-arena-3d.git
git push -u origin main
```

Depois, no GitHub: **Settings → Pages → Source: `Deploy from a branch` → Branch: `main` / `(root)` → Save**.

Em ~1 minuto o jogo estará em `https://mathpvp2080.github.io/meme-arena-3d/`.

> Já existe um workflow em `.github/workflows/deploy.yml` caso prefira usar
> **Settings → Pages → Source: GitHub Actions**. Os dois caminhos funcionam.

## 💻 Rodar localmente

Precisa de um servidor HTTP — abrir o `index.html` por `file://` não funciona
(o navegador bloqueia o carregamento dos scripts).

```bash
python3 -m http.server 3000
# ou
npx serve .
```

Acesse `http://localhost:3000`.

## 📁 Estrutura

```
meme-arena-3d/
├── index.html              # markup do jogo e de todas as telas
├── css/style.css           # HUD, menus, cards de perk, responsivo
├── src/
│   ├── utils.js            # helpers, storage, polyfill de CapsuleGeometry
│   ├── data.js             # inimigos, chefes, armas, perks, dificuldades
│   ├── audio.js            # síntese WebAudio + trilha gerativa adaptativa
│   ├── textures.js         # texturas procedurais em canvas
│   ├── world.js            # arena, luzes, céu, obstáculos e colisão
│   ├── entities.js         # pool de partículas, jogador, inimigos, itens
│   ├── ui.js               # HUD, radar, feed de abates, telas
│   └── game.js             # loop, input, combate, ondas e fluxo
├── lib/three.min.js        # Three.js r128 (local, sem CDN)
├── assets/                 # favicon e capa
├── sw.js                   # service worker (offline)
└── manifest.webmanifest    # PWA
```

## 🛠️ Detalhes técnicos

- **Pool de partículas** de 520 meshes reutilizadas — sem alocação durante o combate.
- **Cache de geometrias** por tipo de inimigo; só os materiais são clonados.
- **3 níveis de qualidade** que ajustam pixel ratio, sombras, número de luzes e densidade de partículas.
- **Trilha adaptativa**: a intensidade da música sobe junto com o número da onda e no Ultimate.
- **Correção de cor**: todas as texturas em `sRGBEncoding` com tone mapping ACES Filmic.
- Validação automatizada com `npm test`: catálogo, referências, assets, PWA, convidado e patch SQL.
- Pipeline reproduzível dos avatares: `POLYGONAL_SOURCE=/caminho/100Avatars npm run build:polygonal-skins`.

### Console de debug

```js
MEMEARENA.skipToWave(5)   // pula direto pro primeiro chefe
MEMEARENA.god()           // vida infinita
MEMEARENA.perk('crit')    // concede um perk
MEMEARENA.nuke()          // limpa a tela
MEMEARENA.kill()          // força o game over
```

## 📄 Licença

MIT — use, modifique e publique à vontade.
Three.js é distribuído sob a licença MIT (© three.js authors).

## 👤 Contas, economia e progressão (novo)

- **Conta com nome e senha** — sem e-mail real. Não existe recuperação automática,
  então a senha deve ser guardada. O modo **Convidado** usa somente `sessionStorage`,
  termina com a sessão e nunca cria usuário no Supabase.
- Para publicar o backend, aplique [`supabase/schema.sql`](supabase/schema.sql), depois
  [`supabase/DEPLOY_LAUNCH.sql`](supabase/DEPLOY_LAUNCH.sql). Esse deploy já inclui a
  migração; ela também está separada em [`supabase/patch_polygonal_mind_skins.sql`](supabase/patch_polygonal_mind_skins.sql)
  para bancos publicados que precisem apenas trocar o catálogo.
- **Todo jogador começa igual**: skin *Cool Fries*, armadura *Moletom Básico* e
  **600 moedas** — o bastante para comprar a arma inicial (Laser de Doge, 450).
- **Nível e XP** até o nível 60. Ganhe XP e moedas a cada partida (pontos,
  abates, ondas e chefes, multiplicados pela dificuldade).
- **Loja e inventário** com 33 skins Polygonal Mind completas e animadas,
  9 armaduras, 9 armas, 3 habilidades e caixas sazonais.
  As armaduras dão **+HP** e **redução de dano**.
- **Inventário** para equipar até 3 armas e anunciar skins negociáveis no mercado.
  O preço de cada skin é 30% menor que o valor-base e não há taxa do vendedor.
- **Figurinhas cosméticas** de todos os mapas, NPCs e chefes na loja, com álbum
  de coleção e um distintivo equipável visível no perfil e no lobby. Figurinhas
  não aumentam atributos e não liberam mapas ou matchmaking.
- **Multiplayer** destrava no **nível 5** (chega na Etapa 3).

> As armas não são mais liberadas por onda: agora você as **compra e equipa**.

## 🎭 NPCs e mapas (Etapa 2)

- **Quatro inimigos com GLB próprio**: Doge Corrompido, Tralalero Tralala,
  Tung Tung Sahur e Bombardiro Crocodilo.
- **Quatro chefes gigantes** reutilizam os mesmos modelos em escala maior:
  Doge Supremo, Tralalero Colossal, Tung Tung Titã e Bombardiro Crocodilo.
  Eles se alternam a cada cinco ondas e ficam mais fortes a cada nova rotação.
- **Fallback procedural** mantém cada inimigo e chefe jogável se o carregamento
  externo falhar; barra de vida, brilho, colisão e IA permanecem separados do visual.
- **6 mapas** que mudam céu, chão, névoa, luzes, obstáculos e cartazes. O mapa
  é sorteado a cada nova partida e não depende de compra ou nível:

| Mapa | Modos |
|---|---|
| 6⁷ Arena 67 | Solo, Coop e competitivo |
| 🌽 Planície de Ohio | Solo, Coop e competitivo |
| 🚽 Esgoto Skibidi | Solo, Coop e competitivo |
| 🦈 Praia Italiana | Solo, Coop e competitivo |
| 🧠 Servidor do Algoritmo | Solo, Coop e competitivo |
| 🏙️ Cidade do Caos | PvP e PvPvE |

A **Cidade do Caos** usa uma seleção da versão gratuita do **KayKit City Builder
Bits 1.0**, em CC0 1.0: ruas, prédios, carros, iluminação e mobiliário urbano.
A licença e a fonte estão preservadas em `assets/kaykit-city/` e em
[`ATTRIBUTIONS.md`](ATTRIBUTIONS.md).

## 🌐 Multiplayer (Etapa 3 — parte 1)

Libera no **nível 5**. A aba de modo do lobby pré-seleciona Solo, Coop ou
Equipes; o botão **JOGAR** inicia o modo escolhido ou abre a sala correspondente.

- **Solo PvE** — um jogador contra as hordas; dificuldade automática pelo nível da conta.
- **Coop PvE** — 2–6 jogadores na mesma equipe; resistência e ritmo das hordas
  escalam pelo número de jogadores e pelas ondas.
- **PvP puro** — Equipe Rosa contra Equipe Ciano, 2–6 por equipe, sem NPCs.
- **PvPvE** — as mesmas equipes com NPCs cuja ameaça cresce a cada 10 abates de NPC.
- O competitivo normaliza vida, proteção, multiplicadores e arma para não virar
  pay-to-win; vence a primeira equipe a chegar a 20 abates.
- Sala com **código de 4 letras** para chamar os amigos, mais a lista de
  **salas abertas** para entrar em um clique e migração automática de anfitrião.
- Quem cai renasce sozinho (7s no Coop, 4s no competitivo).

Para funcionar pela internet é preciso rodar `supabase/schema_multiplayer.sql`
no SQL Editor do Supabase. Sem isso, o multiplayer ainda funciona em **modo
local** entre abas do mesmo navegador.

O mercado de itens (vender/presentear) usa o mesmo SQL. As 28 skins não Common
vêm de Caixas 67, de chefes ou de ambos. Depois, podem ser revendidas pelo preço
fixo de 70% validado no navegador e no servidor; 100% desse preço vai ao vendedor.

## Créditos de recursos externos

Os créditos, fontes, licenças e adaptações dos modelos 3D de terceiros estão
registrados em [`ATTRIBUTIONS.md`](ATTRIBUTIONS.md) e também aparecem dentro do
jogo em **Opções → Créditos dos modelos 3D**.
