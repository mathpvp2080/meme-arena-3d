/* MEME ARENA 3D — moderação do chat
   Três recursos exigidos pela classificação etária:
     1. filtro de linguagem (aplicado no envio E no recebimento)
     2. bloquear jogador
     3. denunciar jogador
*/
(function (MA) {
  'use strict';

  /* ---------------------------------------------------------------
     1. FILTRO DE LINGUAGEM

     O filtro roda também em QUEM RECEBE a mensagem. Isso é o que faz
     a moderação valer: mesmo que alguém altere o próprio jogo para
     mandar palavrão, quem está do outro lado continua vendo censurado.
     --------------------------------------------------------------- */

  /* DUAS listas, e a diferença importa.

     PREFIXOS: trechos longos e inconfundíveis. Valem em qualquer
     posição, então pegam plural e derivados ("caralhos", "putinha").

     EXATAS: palavras curtas que VIVEM DENTRO de palavras inocentes.
     "rola" mora em contROLAr, "puta" em disPUTA e rePUTAção, "fag" em
     FAGulha. Essas só valem como palavra inteira (com plural simples),
     senão o filtro censura o jogador falando de computador. */

  const PREFIXOS = [
    /* português */
    'arrombad', 'baitol', 'boceta', 'boquet', 'buceta', 'cacete',
    'caralh', 'chupad', 'cornud', 'cuzao', 'cuzinh', 'desgracad',
    'fdp', 'filhadaputa', 'filhodaputa', 'fodas', 'fodase', 'foder', 'fodid',
    'piroca', 'porra', 'punhet', 'putaria', 'putinh', 'putona',
    'vagabund', 'viadinh', 'viado', 'xoxota', 'xereca', 'merda', 'bosta',
    'escrot', 'otari', 'retardad', 'imbecil', 'babaca',
    /* ódio / discriminação — tolerância zero */
    'crioul', 'nazista', 'hitler',
    /* inglês */
    'asshole', 'bastard', 'bitch', 'blowjob', 'motherf', 'nigg',
    'dumbass', 'fuck', 'retard', 'whore', 'jerkoff'
  ];

  const EXATAS = [
    'rola', 'rolas', 'puta', 'putas', 'pqp', 'krl', 'vtnc', 'tnc',
    'cu', 'cus', 'pau', 'macaco', 'macacos', 'idiota', 'idiotas',
    'fag', 'fags', 'cock', 'cocks', 'dick', 'dicks', 'pussy', 'cunt',
    'shit', 'slut', 'sluts', 'wank', 'kys', 'fodeu'
  ];

  /* Tira acento, repetição e disfarce com número/símbolo:
     "p0rr@aaa" e "P  O  R  R  A" caem no mesmo lugar. */
  function normalizar(txt) {
    return String(txt)
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[0@]/g, 'o').replace(/[1!|]/g, 'i').replace(/3/g, 'e')
      .replace(/4/g, 'a').replace(/5\$/g, 's').replace(/7/g, 't')
      .replace(/[^a-z]/g, '');
  }

  /* "caaaaralhooo" e "fuuuuck": esmaga TODA letra repetida.
     Testamos as duas formas, porque esmagar tudo transforma
     "porra" em "pora" — então a forma original também precisa valer. */
  function esmagar(txt) {
    return txt.replace(/(.)\1+/g, '$1');
  }

  /* n = normalizado, e = normalizado com letras repetidas esmagadas */
  function barrado(n, e) {
    for (let i = 0; i < EXATAS.length; i++) {
      if (n === EXATAS[i] || e === EXATAS[i]) return true;
    }
    for (let i = 0; i < PREFIXOS.length; i++) {
      const p = PREFIXOS[i];
      if (n.indexOf(p) >= 0 || e.indexOf(esmagar(p)) >= 0) return true;
    }
    return false;
  }

  MA.Mod = {

    /* Devolve { texto, sujo }. Palavra barrada vira ●●●●. */
    filtrar(texto) {
      const bruto = String(texto == null ? '' : texto);
      let sujo = false;

      const limpo = bruto.split(/(\s+)/).map(pedaco => {
        if (!pedaco.trim()) return pedaco;
        const n = normalizar(pedaco);
        if (!n) return pedaco;
        const e = esmagar(n);
        if (barrado(n, e)) {
          sujo = true;
          return '●'.repeat(Math.max(3, Math.min(pedaco.length, 8)));
        }
        return pedaco;
      }).join('');

      /* frase inteira grudada, pra escapar do corte por espaço */
      if (!sujo) {
        const colado = normalizar(bruto);
        const coladoE = esmagar(colado);
        for (let i = 0; i < PREFIXOS.length; i++) {
          const p = PREFIXOS[i];
          if (colado.indexOf(p) >= 0 || coladoE.indexOf(esmagar(p)) >= 0) {
            return { texto: '●●●●●●', sujo: true };
          }
        }
      }
      return { texto: limpo, sujo };
    },

    /* ---------------------------------------------------------------
       2. BLOQUEAR
       Lista local: vale pra todas as salas, não precisa de servidor.
       --------------------------------------------------------------- */

    _lista: null,

    bloqueados() {
      if (!this._lista) {
        try { this._lista = MA.store.get('bloqueados', []) || []; }
        catch (e) { this._lista = []; }
      }
      return this._lista;
    },

    estaBloqueado(nome) {
      if (!nome) return false;
      const alvo = String(nome).toLowerCase();
      return this.bloqueados().some(n => String(n).toLowerCase() === alvo);
    },

    bloquear(nome) {
      if (!nome || this.estaBloqueado(nome)) return;
      this.bloqueados().push(String(nome));
      MA.store.set('bloqueados', this._lista);
      MA.MetaUI && MA.MetaUI.toast('🚫 <b>' + MA.esc(nome) + '</b> bloqueado. Você não vê mais as mensagens dele.');
      MA.MPUI && MA.MPUI.renderPlayers && MA.MPUI.renderPlayers();
    },

    desbloquear(nome) {
      const alvo = String(nome).toLowerCase();
      this._lista = this.bloqueados().filter(n => String(n).toLowerCase() !== alvo);
      MA.store.set('bloqueados', this._lista);
      MA.MetaUI && MA.MetaUI.toast('✅ <b>' + MA.esc(nome) + '</b> desbloqueado.');
      MA.MPUI && MA.MPUI.renderPlayers && MA.MPUI.renderPlayers();
    },

    /* ---------------------------------------------------------------
       3. DENUNCIAR
       Guarda no Supabase. Sem conexão, guarda local pra não perder.
       --------------------------------------------------------------- */

    _ultimas: {},   /* nome -> última frase vista, pra anexar na denúncia */

    lembrar(nome, texto) {
      if (nome) this._ultimas[String(nome).toLowerCase()] = String(texto || '').slice(0, 200);
    },

    async denunciar(nome, motivo) {
      if (!nome) return;
      const trecho = this._ultimas[String(nome).toLowerCase()] || '';
      const sb = MA.Net && MA.Net.online && MA.Net.impl && MA.Net.impl.sb
        ? MA.Net.impl.sb : null;

      if (sb) {
        try {
          const { data, error } = await sb.rpc('report_player', {
            p_nome: String(nome).slice(0, 40),
            p_motivo: String(motivo || 'outro').slice(0, 40),
            p_trecho: trecho
          });
          if (error) throw error;
          if (data && data.error) throw new Error(data.error);
        } catch (e) {
          console.warn('[Mod] denúncia não foi enviada, guardando local', e);
          this._guardarLocal(nome, motivo, trecho);
        }
      } else {
        this._guardarLocal(nome, motivo, trecho);
      }

      MA.MetaUI && MA.MetaUI.toast(
        '🚩 Denúncia registrada contra <b>' + MA.esc(nome) + '</b>.<br>' +
        '<span class="dim">Quer parar de ver esse jogador agora? Use o 🚫 na lista.</span>'
      );
    },

    _guardarLocal(nome, motivo, trecho) {
      try {
        const f = MA.store.get('denuncias', []) || [];
        f.push({ nome, motivo, trecho, quando: Date.now() });
        MA.store.set('denuncias', f.slice(-30));
      } catch (e) { /* ignora */ }
    },

    /* Abre o menuzinho de motivos. */
    pedirMotivo(nome) {
      const anterior = document.getElementById('modReport');
      if (anterior) anterior.remove();

      const MOTIVOS = [
        ['linguagem', '🤬 Linguagem ofensiva'],
        ['assedio', '😠 Assédio ou ameaça'],
        ['odio', '🚷 Discurso de ódio'],
        ['trapaca', '🎯 Trapaça'],
        ['spam', '📢 Spam ou propaganda'],
        ['outro', '❓ Outro motivo']
      ];

      const bg = document.createElement('div');
      bg.id = 'modReport';
      bg.className = 'modback';
      bg.innerHTML =
        '<div class="modbox">' +
        '<div class="modtit">🚩 Denunciar <b>' + MA.esc(nome) + '</b></div>' +
        '<div class="moddim">Escolha o motivo. Seu nome não é mostrado ao jogador denunciado.</div>' +
        MOTIVOS.map(m => '<button class="btn sec modopt" data-m="' + m[0] + '">' + m[1] + '</button>').join('') +
        '<button class="btn tiny modcancel">cancelar</button>' +
        '</div>';
      document.body.appendChild(bg);

      bg.querySelectorAll('.modopt').forEach(b => {
        b.onclick = () => { this.denunciar(nome, b.dataset.m); bg.remove(); };
      });
      bg.querySelector('.modcancel').onclick = () => bg.remove();
      bg.onclick = e => { if (e.target === bg) bg.remove(); };
    }
  };

})(window.MA = window.MA || {});
