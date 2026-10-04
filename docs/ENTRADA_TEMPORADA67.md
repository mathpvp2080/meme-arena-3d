# Direção de arte da entrada — Temporada 67

## Leitura da referência

A referência funciona como *key art* de um jogo de ação por causa de uma hierarquia visual muito clara:

1. **Formato panorâmico e leitura em três faixas**
   - céu escuro e título no terço superior;
   - horizonte luminoso e personagens no centro;
   - grade em perspectiva, partículas e silhuetas no terço inferior.
2. **Ponto de fuga central**
   - a grade, o sol e a arquitetura lateral conduzem o olhar ao personagem principal;
   - portais e prédios formam uma moldura simétrica sem deixar a cena estática.
3. **Silhuetas fáceis de reconhecer**
   - protagonista humanoide no centro, em pose diagonal;
   - personagens grandes nas laterais equilibram o peso visual;
   - figuras menores no fundo criam profundidade.
4. **Cor e iluminação**
   - base azul-marinho e violeta muito escura;
   - ciano e magenta como luzes dominantes;
   - um foco quente no horizonte separa os personagens do fundo;
   - explosões laterais produzem contraluz e reflexos na grade.
5. **Acabamento dos personagens**
   - proporções de brinquedo e linguagem cartoon 3D;
   - cabeça pequena/arredondada, tronco simples, mãos e calçados grandes;
   - materiais polidos, contornos de luz e expressões legíveis à distância.
6. **Tipografia**
   - nome muito grande, condensado e inclinado;
   - degradê claro/ciano para rosa e dourado;
   - contorno claro, extrusão escura e brilho neon;
   - subtítulo menor imediatamente abaixo.
7. **Sensação de ação**
   - pose do herói, disparo, estilhaços, diagonais e partículas apontam para o centro;
   - a composição permanece organizada porque o céu atrás do título é calmo.

## Adaptação para Meme Arena 3D

A entrada nova mantém essa linguagem visual sem copiar personagens, memes desenhados, logotipos ou placas da referência.

- O personagem central usa o acabamento cartoon arredondado do jogo, moletom azul-marinho e uma arma sci-fi autoral.
- A lateral esquerda apresenta um personagem cujo corpo é literalmente o número **6**.
- A lateral direita apresenta um personagem cujo corpo é literalmente o número **7**.
- O plano intermediário mostra a fusão **67**, unida por um núcleo luminoso.
- Os inimigos secundários são cubos, orbes e pirâmides geométricas originais.
- A paleta segue a Temporada 67: azul `#6572ff`, magenta `#ff4fbd`, ciano `#2de2ff`, violeta `#9b65ff` e azul-marinho.
- O sol usa calor apenas como contraste; verde e laranja não são cores principais.
- O título é HTML/CSS, e não parte da imagem. Isso mantém o texto nítido, acessível e responsivo.
- O botão de entrada, a classificação Livre e o estado de carregamento permanecem funcionais sobre a arte.

## Resposta a diferentes telas

- **Desktop e paisagem:** a arte usa `cover`, valorizando a escala dos personagens e preenchendo a tela.
- **Celular em retrato:** a arte completa usa largura de 100% sobre um fundo azul-marinho, evitando cortar os personagens 6 e 7.
- **Telas baixas:** título e controles reduzem de tamanho e mantêm áreas independentes.
- A imagem é pré-carregada e também entra no cache offline do service worker.

## Continuidade visual no menu principal

O lobby passa a usar uma segunda arte de ambiente, sem personagens ou texto, para
não competir com a prévia 3D equipada pelo jogador. Ela mantém a mesma cidade
synthwave, grade refletiva, arquitetura violeta e iluminação ciano/magenta da
entrada.

A interface foi reorganizada como um cockpit único de vidro:

- barra superior integrada para perfil, temporada, moedas, metas e opções;
- navegação lateral com ícones vetoriais próprios, em vez de emojis de estilos diferentes;
- palco central com iluminação e pedestal alinhados ao fundo cinematográfico;
- cartão do evento sem o morro verde anterior, substituído por horizonte e grade neon;
- botão Jogar com hierarquia mais forte e acabamento coerente com a entrada;
- dock inferior unificado para passe, progresso, estatísticas e classificação Livre;
- tipografia, bordas, sombras, espaçamento e estados de interação padronizados.

O fundo do lobby está em `assets/hub-season67.jpg` e também integra o cache offline.
