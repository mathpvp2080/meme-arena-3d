# Ficha do PWABuilder — MEME ARENA: APOCALYPSE

Copie e cole estes valores no PWABuilder. São dados **públicos**: ficam dentro
de todo app publicado na Microsoft Store.

## A ficha completa

| Campo no PWABuilder | Valor |
|---|---|
| **Publisher display name** | `fewkss` |
| **Package ID** | `fewkss.MEMEARENAAPOCALYPSE` |
| **Publisher ID** | `CN=2963B636-05D1-40E1-BD68-FC070070CBDD` |
| **App name** | `MEME ARENA: APOCALYPSE` |
| **App version** | `1.0.1` |
| **Classic package version** | `1.0.0` |
| **URL** | `https://mathpvp2080.github.io/meme-arena-3d/` |

> ⚠️ "App version" precisa ser **maior** que "Classic package version".
> Se der erro no "App name", use exatamente o nome que aparece reservado no
> Partner Center (pode ser sem os dois pontos).

## Passo a passo

1. Abra <https://www.pwabuilder.com>
2. Cole a URL `https://mathpvp2080.github.io/meme-arena-3d/` → **Start**
3. Espere a análise. Clique em **Package for stores**.
4. No cartão **Windows**, clique em **Generate Package**.
5. Abra **"All settings"** / **"Opções avançadas"** e preencha a tabela acima.
6. **Download Package** → vem um `.zip`.
7. Descompacte. Dentro há um arquivo **`.msixbundle`** — é esse que vai pra loja.
   (O `.sideload` / `.msix` de teste **não** serve pro envio.)

## Depois: enviar no Partner Center

1. Partner Center → **Aplicativos e jogos** → clique em **MEME ARENA: APOCALYPSE**
2. **Iniciar envio** / **Start submission**
3. **Pacotes** → arraste o `.msixbundle`
4. **Preços e disponibilidade** → **Gratuito**, todos os mercados
5. **Idade** → preencher o questionário (ver notas abaixo)
6. **Listagem da Store** → usar os textos de `docs/MICROSOFT_STORE.md`
7. **Enviar para certificação**

## Respostas do questionário de classificação etária

- Violência: **sim, fantasiosa / desenho animado** (criaturas de meme, sem sangue)
- Sangue: **não**
- Conteúdo sexual: **não**
- Linguagem imprópria: **não**
- Jogos de azar: **não**
- Compras com dinheiro real: **não**
- Interação entre usuários: **SIM** — o jogo tem chat e multiplayer online
- Compartilha dados pessoais: **sim** (nome de jogador e progresso)

> A última só vale porque existe chat. Omitir isso é motivo de reprovação.

## Links que vão ser pedidos

| Campo | Valor |
|---|---|
| Política de privacidade | `https://mathpvp2080.github.io/meme-arena-3d/privacidade.html` |
| Site do produto | `https://mathpvp2080.github.io/meme-arena-3d/` |
| Suporte | `https://github.com/mathpvp2080/meme-arena-3d/issues` |

## Não confundir

- **ID do editor do Windows Phone** — sistema aposentado, não é usado.
- **ID da Symantec** — loja antiga, não é usado.
