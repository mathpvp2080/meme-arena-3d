# Identidade do produto na Microsoft Store

Valores usados no PWABuilder para gerar o pacote `.msixbundle`.
São dados **públicos** — ficam dentro de todo app publicado na loja.

## Já temos

| Campo no PWABuilder | Valor |
|---|---|
| **Package ID** | `fewkss.MEMEARENAAPOCALYPSE` |
| **Publisher ID** | `CN=2963B636-05D1-40E1-BD68-FC070070CBDD` |

## Ainda falta

| Campo no PWABuilder | Onde está na tela | Valor |
|---|---|---|
| **Publisher display name** | `Package/Properties/PublisherDisplayName` | _(provavelmente `fewkss`)_ |

## Demais campos do PWABuilder

| Campo | Valor |
|---|---|
| URL | `https://mathpvp2080.github.io/meme-arena-3d/` |
| App name | `MEME ARENA: APOCALYPSE` |
| App version | `1.0.1` |
| Classic package version | `1.0.0` |

> ⚠️ "App version" precisa ser **maior** que "Classic package version".

## Não confundir

- **ID do editor do Windows Phone** (`b935636a-1adf-...`) — sistema aposentado,
  **não é usado**.
- **ID da Symantec** — só para apps da Store antiga. Não é usado.
