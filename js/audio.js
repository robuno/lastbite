/* Last Bite — synthesized sound effects + a dark generative drone (no audio files needed). */
(function (global) {
  'use strict';
  const SCALE = [0, 3, 5, 7, 10, 12, 15, 17];
  const Sfx = {
    ac: null, master: null, musicGain: null, sfxOn: true, musicOn: true, musicTimer: null, root: 0, beat: 0, nextT: 0,
    load() {
      try {
        const s = JSON.parse(localStorage.getItem('lastbite.audio') || '{}');
        if (s.sfx === false) this.sfxOn = false;
        if (s.music === false) this.musicOn = false;
      } catch (e) { /* ignore */ }
    },
    save() { try { localStorage.setItem('lastbite.audio', JSON.stringify({ sfx: this.sfxOn, music: this.musicOn })); } catch (e) { /* ignore */ } },
    ensure() {
      if (!this.ac) {
        const AC = global.AudioContext || global.webkitAudioContext;
        if (!AC) return false;
        this.ac = new AC();
        this.master = this.ac.createGain(); this.master.gain.value = 0.45; this.master.connect(this.ac.destination);
        this.musicGain = this.ac.createGain(); this.musicGain.gain.value = this.musicOn ? 0.1 : 0; this.musicGain.connect(this.master);
      }
      if (this.ac.state === 'suspended') this.ac.resume();
      return true;
    },
    tone(freq, dur, type, vol, slide, delay, dest) {
      const ac = this.ac, t = ac.currentTime + (delay || 0);
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(dest || this.master);
      o.start(t); o.stop(t + dur + 0.05);
    },
    noise(dur, vol, freq, delay) {
      const ac = this.ac, t = ac.currentTime + (delay || 0);
      const len = Math.floor(ac.sampleRate * dur);
      const buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ac.createBufferSource(); src.buffer = buf;
      const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 800; f.Q.value = 0.8;
      const g = ac.createGain(); g.gain.value = vol || 0.2;
      src.connect(f); f.connect(g); g.connect(this.master); src.start(t);
    },
    play(name) {
      if (!this.sfxOn || !this.ensure()) return;
      switch (name) {
        case 'jump': this.tone(330, 0.14, 'square', 0.06, 1.9); break;
        case 'land': this.noise(0.08, 0.12, 300); break;
        case 'bounce': this.tone(200, 0.35, 'sine', 0.25, 4); this.tone(400, 0.25, 'triangle', 0.08, 2.5, 0.03); break;
        case 'heart': [880, 1108, 1318, 1760].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.12, 0, i * 0.06)); break;
        case 'die': this.tone(520, 0.5, 'sawtooth', 0.08, 0.25); this.noise(0.3, 0.1, 500); break;
        case 'plate': this.tone(660, 0.07, 'square', 0.05); this.tone(990, 0.07, 'square', 0.04, 0, 0.05); break;
        case 'door': this.noise(0.35, 0.08, 220); break;
        case 'anchor': this.tone(140, 0.12, 'triangle', 0.18, 0.6); this.noise(0.06, 0.1, 1800); break;
        case 'grab': this.tone(240, 0.08, 'triangle', 0.14, 0.7); break;
        case 'cp': [523, 659, 784].forEach((f, i) => this.tone(f, 0.3, 'sine', 0.13, 0, i * 0.08)); break;
        case 'crumble': this.noise(0.35, 0.16, 400); break;
        case 'pop': this.tone(700, 0.08, 'sine', 0.12, 1.6); break;
        case 'latch': [392, 523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.4, 'triangle', 0.1, 0, i * 0.07)); break;
        case 'reel': this.tone(900 + Math.random() * 200, 0.03, 'square', 0.015); break;
        case 'win': [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.14, 0, i * 0.11)); break;
        case 'kiss':
          this.tone(1500, 0.09, 'sine', 0.14, 0.45);
          [659, 784, 988, 1318].forEach((f, i) => this.tone(f, 0.45, 'triangle', 0.1, 0, 0.14 + i * 0.09));
          break;
        case 'click': this.tone(880, 0.05, 'sine', 0.08); break;
        case 'msg': this.tone(880, 0.12, 'sine', 0.12, 1.5); this.tone(1320, 0.18, 'triangle', 0.07, 1.2, 0.07); break;
        case 'love': [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.4, 'sine', 0.09, 0, i * 0.09)); break;
        case 'sip': this.noise(0.18, 0.06, 1400); this.tone(500, 0.12, 'sine', 0.05, 1.4, 0.12); break;
        case 'dance': [523, 659, 784, 659, 880, 784].forEach((f, i) => this.tone(f, 0.16, 'square', 0.035, 0, i * 0.13)); break;
        case 'type': this.tone(1200 + Math.random() * 300, 0.03, 'sine', 0.025); break;
        case 'boom': this.noise(0.4, 0.12, 260); this.tone(160, 0.3, 'sine', 0.12, 0.5); break;
        case 'whoosh': this.noise(0.5, 0.06, 1200); break;
        case 'chomp': this.noise(0.06, 0.13, 700); this.noise(0.05, 0.1, 900, 0.11); this.tone(300, 0.06, 'sine', 0.05, 0.7, 0.02); break;
        case 'shine':
          [1047, 1319, 1568, 2093, 2637, 3136].forEach((f, i) => this.tone(f, 0.5, 'sine', 0.05, 1.01, i * 0.06));
          this.tone(523, 1.2, 'triangle', 0.05, 2, 0); break;
        case 'magic': [784, 988, 1175, 1568, 1976, 2349].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.06, 1.02, i * 0.05)); this.noise(0.5, 0.04, 3000, 0.05); break;
        case 'wedding': [1047, 1319, 1568, 1319, 1568, 2093].forEach((f, i) => { this.tone(f, 0.9, 'sine', 0.07, 1, i * 0.16); this.tone(f * 2.01, 0.6, 'sine', 0.02, 1, i * 0.16); }); break;
        case 'morph': this.noise(0.25, 0.1, 900); this.tone(300, 0.3, 'sine', 0.12, 3, 0.03); break;
        case 'punch': this.noise(0.12, 0.25, 220); this.tone(110, 0.2, 'square', 0.12, 0.4); this.tone(900, 0.08, 'square', 0.05, 0.5, 0.02); break;
        case 'crunch': this.noise(0.18, 0.18, 1500); this.noise(0.25, 0.12, 400, 0.05); break;
        case 'melt': this.tone(520, 0.9, 'sine', 0.08, 0.25); this.tone(530, 0.9, 'sine', 0.05, 0.3, 0.05); this.noise(0.6, 0.04, 2500); break;
        case 'growl': this.tone(90 + Math.random() * 30, 0.6, 'sawtooth', 0.05, 0.7); this.tone(60, 0.6, 'square', 0.03, 0.8); break;
        case 'powerdown': this.tone(440, 0.8, 'sawtooth', 0.06, 0.08); this.tone(60, 0.5, 'square', 0.04, 1); this.noise(0.2, 0.08, 4000); break;
        case 'powerup': this.tone(60, 0.5, 'sawtooth', 0.05, 7); this.noise(0.08, 0.06, 3000); break;
        case 'beep': this.tone(1320, 0.06, 'square', 0.04); break;
        case 'explode': this.noise(0.9, 0.3, 160); this.noise(0.4, 0.16, 700); this.tone(70, 0.6, 'sine', 0.25, 0.4); break;
        case 'heartbeat': this.tone(62, 0.16, 'sine', 0.35, 0.7); this.tone(58, 0.16, 'sine', 0.25, 0.7, 0.2); break;
        case 'slap': this.noise(0.09, 0.4, 2600); this.noise(0.05, 0.25, 900, 0.01); this.tone(260, 0.06, 'square', 0.06, 0.5); break;
        case 'bite': this.noise(0.05, 0.3, 1200); this.tone(180, 0.09, 'square', 0.08, 0.5, 0.02); this.noise(0.04, 0.2, 2400, 0.06); break;
        case 'snap': this.tone(500, 0.05, 'triangle', 0.05, 0.6); break;
        case 'lunge': this.noise(0.25, 0.1, 700); this.tone(120, 0.2, 'sawtooth', 0.05, 1.8); break;
        case 'throw': this.noise(0.15, 0.08, 1800); break;
        case 'thwack': this.noise(0.07, 0.3, 1500); this.tone(300, 0.08, 'triangle', 0.08, 0.6); break;
        case 'thud': this.noise(0.08, 0.12, 300); break;
        case 'trap': this.noise(0.06, 0.45, 3000); this.tone(90, 0.25, 'square', 0.12, 0.5); this.noise(0.2, 0.15, 500, 0.03); break;
        case 'trapSet': this.tone(1200, 0.04, 'square', 0.04); this.tone(800, 0.05, 'square', 0.04, 0, 0.06); break;
        case 'slip': this.tone(300, 0.35, 'sine', 0.12, 3.5); this.noise(0.2, 0.08, 900, 0.2); break;
        case 'hide': this.noise(0.18, 0.08, 500); break;
        case 'found': [220, 330, 440].forEach((f, i) => this.tone(f, 0.12, 'square', 0.06, 1, i * 0.05)); this.noise(0.15, 0.12, 700); break;
        case 'flash': [1568, 2093, 2637, 3136].forEach((f, i) => this.tone(f, 0.4, 'sine', 0.07, 1.01, i * 0.03)); this.noise(0.3, 0.1, 5000); break;
        case 'invis': this.tone(900, 0.5, 'sine', 0.06, 0.3); this.tone(1400, 0.4, 'triangle', 0.03, 0.4, 0.05); break;
        case 'invisOff': this.tone(400, 0.2, 'sine', 0.05, 2); break;
        case 'sniff': this.noise(0.12, 0.1, 3500); this.noise(0.12, 0.1, 3500, 0.16); this.noise(0.2, 0.12, 3000, 0.32); break;
        case 'decoy': this.tone(700, 0.3, 'triangle', 0.06, 1.6); this.tone(1050, 0.3, 'triangle', 0.04, 1.6, 0.05); break;
        case 'decoyPop': this.noise(0.25, 0.2, 1000); this.tone(600, 0.3, 'sine', 0.08, 0.3); break;
        case 'pickup': [660, 990].forEach((f, i) => this.tone(f, 0.1, 'triangle', 0.08, 1, i * 0.05)); break;
        case 'pickupFar': this.tone(500, 0.06, 'triangle', 0.03); break;
        case 'heal': [392, 523, 659].forEach((f, i) => this.tone(f, 0.25, 'sine', 0.07, 1, i * 0.07)); break;
        case 'buff': [330, 440, 660, 880].forEach((f, i) => this.tone(f, 0.18, 'square', 0.04, 1, i * 0.05)); break;
        case 'nope': this.tone(180, 0.12, 'square', 0.05); this.tone(150, 0.14, 'square', 0.05, 1, 0.1); break;
        case 'tick': this.tone(880, 0.08, 'square', 0.06); break;
        case 'go': this.tone(110, 0.5, 'sawtooth', 0.1, 0.5); this.noise(0.4, 0.15, 400); this.tone(880, 0.25, 'square', 0.06); break;
        case 'round': this.tone(70, 1.2, 'sine', 0.25, 0.8); this.noise(0.8, 0.05, 200); break;
        case 'ko': this.tone(60, 1.4, 'sawtooth', 0.12, 0.4); this.noise(0.9, 0.25, 180); [523, 392, 262].forEach((f, i) => this.tone(f, 0.4, 'square', 0.06, 1, 0.2 + i * 0.18)); break;
        case 'freeze': this.noise(1.2, 0.08, 6000); this.tone(1800, 1, 'sine', 0.04, 0.5); break;
        case 'taunt': this.tone(140, 0.25, 'sawtooth', 0.05, 1.4); break;
        case 'boing': this.tone(160, 0.35, 'sine', 0.2, 3.2); this.tone(320, 0.25, 'triangle', 0.06, 2.4, 0.02); break;
        case 'trainBell': for (let i = 0; i < 6; i++) { this.tone(1245, 0.22, 'triangle', 0.06, 1, i * 0.28); this.tone(1480, 0.22, 'sine', 0.03, 1, i * 0.28 + 0.01); } break;
        case 'trainHorn': this.tone(233, 1.1, 'sawtooth', 0.07, 0.97); this.tone(294, 1.1, 'sawtooth', 0.05, 0.97); this.noise(2.2, 0.12, 180); this.noise(2, 0.05, 900, 0.2); break;
        case 'crash': this.noise(0.5, 0.35, 300); this.tone(80, 0.5, 'square', 0.12, 0.5); this.noise(0.3, 0.2, 2200, 0.05); break;
        case 'secret': this.noise(0.4, 0.08, 260); this.tone(140, 0.5, 'triangle', 0.08, 0.7); [523, 622, 784].forEach((f, i) => this.tone(f, 0.25, 'sine', 0.04, 1, 0.25 + i * 0.07)); break;
        case 'iceCrack': this.noise(0.08, 0.35, 4000); this.noise(0.25, 0.2, 1400, 0.04); this.tone(900, 0.2, 'square', 0.04, 0.3, 0.02); break;
        case 'creak': this.tone(700 + Math.random() * 300, 0.12, 'triangle', 0.025, 0.6); this.noise(0.06, 0.06, 3200); break;
        case 'splash': this.noise(0.45, 0.22, 700); this.noise(0.25, 0.12, 2200, 0.05); break;
        case 'swim': this.noise(0.18, 0.08, 900); break;
        case 'sparkle': [1568, 2093, 2637].forEach((f, i) => this.tone(f, 0.2, 'triangle', 0.04, 0, i * 0.05)); break;
      }
    },
    setMusic(on) { this.musicOn = on; this.save(); if (this.musicGain) this.musicGain.gain.value = on ? 0.1 : 0; },
    setSfx(on) { this.sfxOn = on; this.save(); },
    startMusic(root) {
      this.root = root || 0;
      if (!this.ensure()) return;
      if (this.musicTimer) return;
      this.nextT = this.ac.currentTime + 0.1; this.beat = 0;
      this.musicTimer = setInterval(() => this.schedule(), 120);
    },
    schedule() {
      if (!this.ac) return;
      const spb = 0.62;
      while (this.nextT < this.ac.currentTime + 0.6) {
        const b = this.beat, base = 110 * Math.pow(2, this.root / 12), at = this.nextT - this.ac.currentTime;
        const roots = [0, 0, 3, 1];
        const cr = roots[Math.floor(b / 8) % 4];
        if (b % 8 === 0) {
          this.tone(base / 2 * Math.pow(2, SCALE[cr] / 12), spb * 8.2, 'sine', 0.55, 0, at, this.musicGain);
          this.tone(base / 2 * Math.pow(2, (SCALE[cr] + 7) / 12) * 1.003, spb * 8.2, 'triangle', 0.18, 0, at, this.musicGain);
        }
        if (b % 4 === 0) { this.tone(52, 0.18, 'sine', 0.45, 0.7, at, this.musicGain); this.tone(48, 0.18, 'sine', 0.3, 0.7, at + 0.22, this.musicGain); }
        const r = Math.abs((Math.sin(b * 12.9898 + this.root) * 43758.5453) % 1);
        if (r > 0.72) {
          const deg = (cr + [0, 2, 4, 1, 5, 3, 6, 2][b % 8]) % SCALE.length;
          this.tone(base * 2 * Math.pow(2, SCALE[deg] / 12), spb * 2.6, 'sine', 0.16, 0.995, at, this.musicGain);
        }
        this.nextT += spb; this.beat++;
      }
    },
  };
  Sfx.load();
  global.Sfx = Sfx;
})(typeof window !== 'undefined' ? window : globalThis);
