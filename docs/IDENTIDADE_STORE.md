# Identidade do produto na Microsoft Store

Valores usados no PWABuilder para gerar o pacote `.msixbundle`.
São dados **públicos** — ficam dentro de todo app publicado na loja.

## Já temos

| Campo no PWABuilder | Valor |
|---|---|
| **Publisher ID** | `CN=2963B636-05D1-40E1-BD68-FC070070CBDD` |

> Origem: Partner Center → ⚙ → Configurações da conta → Identificadores → aba
> Windows → "ID do editor do Windows".

## Ainda falta pegar

Esses dois só aparecem **depois de reservar o nome do produto**.
Caminho: Partner Center → Aplicativos e jogos → clicar no produto →
menu esquerdo **Gerenciamento de produtos** → **Identidade do produto**.

| Campo no PWABuilder | Onde está na tela | Valor |
|---|---|---|
| **Package ID** | "Nome do pacote" / `Package/Identity/Name` | _(preencher)_ |
| **Publisher display name** | `Package/Properties/PublisherDisplayName` | _(preencher)_ |

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
