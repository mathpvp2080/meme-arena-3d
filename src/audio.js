/* MEME ARENA 3D — áudio 100% procedural (WebAudio), sem arquivos externos */
(function (MA) {
  'use strict';

  const A = {
    ctx: null, master: null, musicGain: null, sfxGain: null,
    muted: false, volume: 0.6, musicVol: 0.45, intensity: 0,
    step: 0, nextNote: 0, timer: null, ready: false,

    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : this.volume;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -16; comp.ratio.value = 7; comp.release.value = .25;
      this.master.connect(comp); comp.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = this.musicVol;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 1;
      this.sfxGain.connect(this.master);

      // reverb leve para os SFX
      this.conv = this.ctx.createConvolver();
      this.conv.buffer = this._impulse(1.1, 2.4);
      const wet = this.ctx.createGain(); wet.gain.value = .18;
      this.sfxGain.connect(this.conv); this.conv.connect(wet); wet.connect(this.master);

      this.ready = true;
      this._startSequencer();
    },

    _impulse(dur, decay) {
      const rate = this.ctx.sampleRate, len = Math.floor(rate * dur);
      const buf = this.ctx.createBuffer(2, len, rate);
      for (let c = 0; c < 2; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
      return buf;
    },

    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
    setVolume(v) { this.volume = v; if (this.master) this.master.gain.value = this.muted ? 0 : v; },
    setMusicVolume(v) { this.musicVol = v; if (this.musicGain) this.musicGain.gain.value = v; },
    toggleMute() {
      this.muted = !this.muted;
      if (this.master) this.master.gain.value = this.muted ? 0 : this.volume;
      return this.muted;
    },

    /* ------------------------------------------------------------ SFX -- */
    tone(freq, dur, type, vol, slideTo, dest) {
      if (!this.ready || this.muted) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(Math.max(20, freq), t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol || .2), t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(dest || this.sfxGain);
      o.start(t); o.stop(t + dur + .02);
    },

    noise(dur, vol, filterFreq, type) {
      if (!this.ready || this.muted) return;
      const t = this.ctx.currentTime, n = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const s = this.ctx.createBufferSource(); s.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = type || 'lowpass'; f.frequency.value = filterFreq || 1200;
      const g = this.ctx.createGain(); g.gain.value = vol || .3;
      s.connect(f); f.connect(g); g.connect(this.sfxGain); s.start(t);
    },

    shoot(kind) {
      switch (kind) {
        case 'shot':   this.noise(.2, .32, 1100); this.tone(130, .15, 'square', .16, 48); break;
        case 'rocket': this.tone(190, .26, 'triangle', .18, 740); this.noise(.22, .18, 700); break;
        case 'rail':   this.tone(1500, .3, 'sawtooth', .16, 160); this.noise(.3, .14, 4200, 'highpass'); break;
        default:       this.tone(900, .085, 'sawtooth', .12, 230);
      }
    },
    hit()     { this.tone(430, .055, 'square', .09, 270); },
    crit()    { this.tone(1200, .1, 'square', .14, 1900); },
    kill()    { this.tone(320, .09, 'square', .14, 840); setTimeout(() => this.tone(660, .11, 'square', .1, 1180), 65); },
    hurt()    { this.noise(.32, .36, 480); this.tone(170, .3, 'sawtooth', .18, 58); },
    pickup()  { [660, 990, 1320].forEach((f, i) => setTimeout(() => this.tone(f, .09, 'sine', .16), i * 65)); },
    boom()    { this.noise(.7, .55, 380); this.tone(68, .55, 'sawtooth', .28, 24); },
    dash()    { this.tone(480, .18, 'sine', .13, 1500); this.noise(.16, .12, 3000, 'highpass'); },
    jump()    { this.tone(430, .11, 'sine', .09, 720); },
    switchW() { this.tone(720, .07, 'square', .1); setTimeout(() => this.tone(980, .07, 'square', .08), 55); },
    ui()      { this.tone(820, .05, 'triangle', .1); },
    deny()    { this.tone(160, .16, 'square', .12, 90); },
    waveUp()  { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, .2, 'triangle', .16), i * 100)); },
    bossIn()  { [110, 110, 98, 87].forEach((f, i) => setTimeout(() => { this.tone(f, .45, 'sawtooth', .24); this.noise(.3, .2, 300); }, i * 230)); },
    perk()    { [392, 523, 659, 880].forEach((f, i) => setTimeout(() => this.tone(f, .22, 'sine', .15), i * 90)); },
    gameOver(){ [523, 440, 349, 262, 196].forEach((f, i) => setTimeout(() => this.tone(f, .45, 'sawtooth', .18), i * 230)); },
    ult()     { [262, 330, 392, 523, 659, 784].forEach((f, i) => setTimeout(() => this.tone(f, .3, 'sawtooth', .14), i * 70)); },

    /* --------------------------------------------------------- música -- */
    setIntensity(v) { this.intensity = MA.clamp(v, 0, 1); },

    _startSequencer() {
      const BASS = [55, 55, 65.41, 55, 73.42, 55, 49, 58.27];
      const LEAD = [440, 523.25, 659.25, 587.33, 523.25, 440, 392, 523.25];
      clearInterval(this.timer);
      this.timer = setInterval(() => {
        if (!this.ready || this.muted || !MA.Game || !MA.Game.musicOn()) return;
        const i = this.step++;
        const g = this.musicGain;
        const inten = this.intensity;
        const n = BASS[i % BASS.length];
        this.tone(n, .24, 'sawtooth', .085 + inten * .03, null, g);
        if (i % 2 === 0) this.noise(.04, .07 + inten * .05, 7000, 'highpass');
        if (i % 4 === 0) { this.tone(48, .16, 'sine', .16, 32, g); }
        if (inten > .25 && i % 4 === 2) this.tone(n * 2, .12, 'square', .035, null, g);
        if (inten > .5 && i % 8 === 6) this.tone(LEAD[(i / 2 | 0) % LEAD.length], .22, 'triangle', .05, null, g);
        if (inten > .75 && i % 2 === 1) this.noise(.05, .06, 9000, 'highpass');
      }, 240);
    }
  };

  MA.Audio = A;
})(window.MA);
