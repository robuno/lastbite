/* Last Bite — a 1v1 survival duel in the dark.
 * Him bites. Her slaps, bites and throws slippers. Lights, traps, hiding spots, invisibility, food. Last one standing wins the round. */
(function (global) {
  'use strict';
  const Maps = global.Maps, T = Maps.TILE, C = global.Chars;
  const Sfx = global.Sfx || { play() {}, startMusic() {} };
  const PW = C.PW, PH = C.PH;
  const DT = 1 / 120;
  const P = { G: 2100, JUMP: 760, MAXFALL: 980, RUN: 225, ACC_G: 2600, ACC_A: 1500, CLIMB: 150, COYOTE: 0.1, BUF: 0.13 };
  const CAGE_W = 46, CAGE_H = 50, MAT_TIME = 10;
  const HP_MAX = 100, ROUND_TIME = 100, INTRO = 2.8, KO_TIME = 3.2;
  const VIEW_TILES = 12.5;
  const FOODS = ['iskender', 'sandwich', 'matcha', 'orange'];
  const FOOD_ICON = { iskender: '🥙', sandwich: '🥪', matcha: '🍵', orange: '🍊' };
  const NSWEET = 5, NTAUNT = 3;
  // arena gimmicks
  const PAD_BOOST = 1.55;                                                     // trampoline launch, × jump speed
  const TRAIN = { first: 14, period: 21, warn: 3.2, pass: 2.2, len: 15 * T, dmg: 24 };
  const ICE = { crackTime: 1.0, refreeze: 6.5, acc: 420, stopAcc: 260 };

  // ---------- moves ----------
  const ATK = {
    boy: {
      a1: { kind: 'bite', dmg: 10, range: 26, hitAt: 0.13, dur: 0.36, cd: 0.55, kb: 200, bleed: 3 },
      a2: { kind: 'lunge', dmg: 16, range: 24, dash: 560, dashDur: 0.22, hitAt: 0.05, hitUntil: 0.3, dur: 0.42, cd: 5, kb: 380, bleed: 4 },
    },
    girl: {
      a1: { kind: 'slap', dmg: 7, range: 30, hitAt: 0.1, dur: 0.3, cd: 0.45, kb: 480, stun: 2.6, down: true },
      a2: { kind: 'bite', dmg: 11, range: 24, hitAt: 0.15, dur: 0.4, cd: 0.85, kb: 180 },
      a3: { kind: 'slipper', proj: true, dmg: 6, speed: 580, hitAt: 0.12, dur: 0.34, cd: 2.6, stun: 0.25, kb: 220 },
    },
  };
  const SKILL_CD = {
    boy: { s1: 24, s2: 8, s3: 16, magic: 26 },
    girl: { s1: 18, s2: 14, s3: 20, magic: 26, x1: 22, x2: 26, x3: 30 },
  };
  // what the HUD shows, in order
  const SLOTS = {
    boy: [['a1', '🦷'], ['a2', '💨'], ['s1', '💡'], ['s2', '🪤'], ['s3', '👃'], ['magic', '👰']],
    girl: [['a1', '✋'], ['a2', '🦷'], ['a3', '🩴'], ['s1', '👻'], ['s2', '✨'], ['s3', '🎭'], ['magic', '🥔'], ['x1', '⚡'], ['x2', '🔒'], ['x3', '🧘']],
  };

  const KEYMAPS = {
    p1: { left: ['KeyA'], right: ['KeyD'], jump: ['KeyW', 'Space'], down: ['KeyS'], a1: ['KeyF'], a2: ['KeyG'], a3: ['KeyH'], s1: ['KeyQ'], s2: ['KeyE'], s3: ['KeyR'], magic: ['KeyT'], food: ['Digit1', 'Digit2', 'Digit3', 'Digit4'], dance: ['KeyZ'], kiss: ['KeyX'], say: ['KeyC'], taunt: ['KeyV'], x1: ['Digit5'], x2: ['Digit6'], x3: ['KeyY'] },
    p2: { left: ['ArrowLeft'], right: ['ArrowRight'], jump: ['ArrowUp'], down: ['ArrowDown'], a1: ['KeyK'], a2: ['KeyL'], a3: ['Semicolon'], s1: ['KeyI'], s2: ['KeyO'], s3: ['KeyP'], magic: ['KeyU'], food: ['Digit7', 'Digit8', 'Digit9', 'Digit0'], dance: ['KeyN'], kiss: ['KeyM'], say: ['KeyJ'], taunt: ['KeyB'], x1: ['Comma'], x2: ['Period'], x3: ['Slash'] },
    solo: { left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'], jump: ['KeyW', 'ArrowUp', 'Space'], down: ['KeyS', 'ArrowDown'], a1: ['KeyJ'], a2: ['KeyK'], a3: ['KeyL'], s1: ['KeyQ'], s2: ['KeyE'], s3: ['KeyR'], magic: ['KeyT'], food: ['Digit1', 'Digit2', 'Digit3', 'Digit4'], dance: ['KeyZ'], kiss: ['KeyF'], say: ['Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9'], taunt: ['KeyC'], x1: ['KeyU'], x2: ['KeyI'], x3: ['KeyO'] },
  };
  const tr = (k, v) => (global.I18N ? global.I18N.t(k, v) : k);
  const trList = (k, i) => { const l = tr(k); return Array.isArray(l) ? l[i] || l[0] : ''; };
  const RAINBOW = ['#ff5b6e', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#b197fc'];
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const approach = (v, t, d) => v < t ? Math.min(t, v + d) : Math.max(t, v - d);
  const other = (ch) => ch === 'boy' ? 'girl' : 'boy';
  const rr = C.rr, heartPath = C.heartPath, starPath = C.starPath;

  function makePlayer(char) {
    return {
      char, x: 0, y: 0, w: PW, h: PH, vx: 0, vy: 0, face: char === 'boy' ? 1 : -1,
      grounded: false, groundCell: null, climbing: false, dropT: 0, coyote: 0, jumpBuf: 0, jumpCut: false, dashT: 0,
      hp: HP_MAX, hurtT: 0, stunT: 0, downT: 0, trapT: 0, matT: 0, shockT: 0, blindT: 0, invisT: 0, speedT: 0, confT: 0, bleedT: 0, coldAcc: 0,
      hide: -1, hideCd: 0, ambushT: 0, portalCd: 0, trainHit: -1, wet: false,
      atkKind: null, atkT: 9, atkDur: 0, atkDef: null, atkHit: false, atkFired: false,
      cd: { a1: 0, a2: 0, a3: 0, s1: 0, s2: 0, s3: 0, magic: 0, x1: 0, x2: 0, x3: 0 },
      inv: { iskender: 1, sandwich: 1, matcha: 0, orange: 1 },
      act: null, actT: 0, actDur: 0, actFx: 0, sipped: false, chewT: 0, healLeft: 0, healRate: 0,
      kissT: 0, kissReq: -99, morphT: 0, morphForm: null, bridalT: 0, castT: 0, shineT: 0, glowT: 0,
      walkT: 0, blinkT: Math.random() * 3, squash: 0, emote: null, emoteT: 0, say: null, typing: false, typingT: 0, sayIdx: 0, tauntIdx: 0,
      stepT: 0, noiseT: 0, local: true, tx: undefined, ty: undefined, nvx: 0, nvy: 0, netAge: 0, flags: 0,
      stats: { dmg: 0, hits: 0, eaten: 0 },
    };
  }

  const G = {
    canvas: null, ctx: null, cw: 0, ch: 0, dpr: 1, zoom: 2,
    state: 'menu', mode: 'local', myChar: 'boy', names: {}, schemes: {}, net: null,
    M: null, mapIdx: 0, bestOf: 3, round: 1, score: { boy: 0, girl: 0 }, phase: 'intro', phaseT: 0, roundT: 0, freeze: false,
    power: true, powerT: 0, powerFlick: 0, train: null, trainClock: 0, trainK: [-1, -1], traps: [], peels: [], projs: [], decoy: null, cage: null, mat: null, pings: [], fx: [], particles: [], ambient: [],
    sniffT: 0, flash: null, truceUsed: false, foodTimer: 8, idc: 1, koWinner: null, slow: 1, shake: 0,
    players: null, keys: new Set(), jumpQ: { boy: false, girl: false }, downQ: { boy: false, girl: false },
    hooks: {}, ping: null, hudAcc: 0, netAcc: 0, paused: false, menuT: 0, t: 0, views: [], darks: [],
    stats: null,
  };
  const isAuth = () => G.mode !== 'online' || !G.net || G.net.role === 'host';
  function netSend(m) { if (G.mode === 'online' && G.net) G.net.send(m); }
  function nid() { return (G.myChar === 'girl' ? 'g' : 'b') + (G.idc++); }

  // =====================================================================
  //  Tiles & collision
  // =====================================================================
  function cell(tx, ty) { const M = G.M; if (tx < 0 || ty < 0 || tx >= M.W || ty >= M.H) return '#'; return M.grid[ty][tx]; }
  function ladderCell(tx, ty) { const c = cell(tx, ty); return c === '|' || (c === '=' && cell(tx, ty + 1) === '|'); }
  function onLadder(p, dy) { return ladderCell(Math.floor((p.x + PW / 2) / T), Math.floor((p.y + PH + (dy || 0)) / T)); }
  function moveX(p, dx) {
    p.x += dx;
    const y0 = Math.floor(p.y / T), y1 = Math.floor((p.y + p.h - 0.01) / T);
    if (dx > 0) {
      const tx = Math.floor((p.x + p.w - 0.01) / T);
      for (let ty = y0; ty <= y1; ty++) if (cell(tx, ty) === '#') { p.x = tx * T - p.w; p.vx = 0; p.dashT = 0; return true; }
    } else if (dx < 0) {
      const tx = Math.floor(p.x / T);
      for (let ty = y0; ty <= y1; ty++) if (cell(tx, ty) === '#') { p.x = (tx + 1) * T; p.vx = 0; p.dashT = 0; return true; }
    }
    return false;
  }
  function moveY(p, dy, noLedge) {
    const prevBottom = p.y + p.h;
    p.y += dy;
    const x0 = Math.floor(p.x / T), x1 = Math.floor((p.x + p.w - 0.01) / T);
    if (dy > 0) {
      const ty = Math.floor((p.y + p.h - 0.01) / T);
      for (let tx = x0; tx <= x1; tx++) {
        const c = cell(tx, ty);
        if (c === '#' || (c === '=' && !noLedge && prevBottom <= ty * T + 0.5)) { p.y = ty * T - p.h; p.vy = 0; p.grounded = true; p.groundCell = c; return true; }
      }
    } else if (dy < 0) {
      const ty = Math.floor(p.y / T);
      for (let tx = x0; tx <= x1; tx++) if (cell(tx, ty) === '#') { p.y = (ty + 1) * T; p.vy = 0; return true; }
    }
    return false;
  }
  function rectHit(a, x, y, w, h) { return a.x < x + w && a.x + a.w > x && a.y < y + h && a.y + a.h > y; }
  const cx = (p) => p.x + PW / 2, cy = (p) => p.y + PH / 2;
  const dist = (a, b) => Math.hypot(cx(a) - cx(b), cy(a) - cy(b));

  // =====================================================================
  //  Input
  // =====================================================================
  function anyKey(list) { for (const k of list) if (G.keys.has(k)) return true; return false; }
  function controllable() { return G.state === 'play' && !G.paused && G.phase === 'fight'; }
  function readInput(ch) {
    const sc = G.schemes[ch];
    const none = { left: false, right: false, jump: false, down: false, jumpQ: false, downQ: false };
    if (!sc || !controllable()) { G.jumpQ[ch] = false; G.downQ[ch] = false; return none; }
    const km = KEYMAPS[sc];
    const q = G.jumpQ[ch], dq = G.downQ[ch]; G.jumpQ[ch] = false; G.downQ[ch] = false;
    return { left: anyKey(km.left), right: anyKey(km.right), jump: anyKey(km.jump), down: anyKey(km.down), jumpQ: q, downQ: dq };
  }
  function onKeyDown(e) {
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    G.keys.add(e.code);
    if (G.state !== 'play' || G.paused) return;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    for (const ch of ['boy', 'girl']) {
      const sc = G.schemes[ch]; if (!sc) continue;
      const km = KEYMAPS[sc], p = G.players[ch];
      if (km.jump.includes(e.code)) G.jumpQ[ch] = true;
      if (km.down.includes(e.code)) G.downQ[ch] = true;
      const si = km.say.indexOf(e.code);
      if (si >= 0) sayPhrase(ch, km.say.length > 1 ? si : (p.sayIdx++ % NSWEET), true);
      if (km.taunt.includes(e.code)) sayPhrase(ch, NSWEET + (p.tauntIdx++ % NTAUNT), true);
      if (G.phase !== 'fight') continue;
      for (const s of ['a1', 'a2', 'a3']) if (km[s].includes(e.code)) startAttack(p, s);
      for (const s of ['s1', 's2', 's3', 'magic', 'x1', 'x2', 'x3']) if (km[s] && km[s].includes(e.code)) useSkill(p, s);
      const fi = km.food.indexOf(e.code);
      if (fi >= 0) startAct(ch, FOODS[fi], true);
      if (km.dance.includes(e.code)) startAct(ch, 'dance', true);
      if (km.kiss.includes(e.code)) requestKiss(ch, true);
    }
  }
  function onKeyUp(e) { G.keys.delete(e.code); }
  function keyLabel(code) {
    if (!code) return '';
    if (code.startsWith('Key')) return code.slice(3);
    if (code.startsWith('Digit')) return code.slice(5);
    return { Semicolon: ';', Comma: ',', Period: '.', Slash: '/', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Space: '␣' }[code] || code;
  }

  // =====================================================================
  //  Match & rounds
  // =====================================================================
  function startMatch(cfg) {
    G.mode = cfg.mode; G.myChar = cfg.myChar || 'boy'; G.names = cfg.names || {}; G.schemes = cfg.schemes || {}; G.net = cfg.net || null;
    G.mapIdx = cfg.map | 0; G.bestOf = cfg.bestOf === 5 ? 5 : 3;
    G.M = Maps.buildMap(G.mapIdx);
    G.score = { boy: 0, girl: 0 }; G.paused = false; G.ping = null; G.views = []; banners.length = 0;
    G.players = { boy: makePlayer('boy'), girl: makePlayer('girl') };
    G.stats = { boy: { dmg: 0, hits: 0, eaten: 0 }, girl: { dmg: 0, hits: 0, eaten: 0 } };
    if (G.mode === 'online') { G.players.boy.local = G.myChar === 'boy'; G.players.girl.local = G.myChar === 'girl'; }
    G.state = 'play';
    initAmbient();
    if (isAuth()) beginRound(1, randomFoods(), true);
    else { beginRound(1, G.M.foods.map(() => null), false); G.phase = 'wait'; }
    if (cfg.music !== false && Sfx.startMusic) Sfx.startMusic(G.M.theme.music);
  }
  function randomFoods() {
    return G.M.foods.map((f, i) => (i % 2 === 0 || Math.random() < 0.3) ? pickFood() : null);
  }
  function pickFood() { const r = Math.random(); return r < 0.3 ? 'sandwich' : r < 0.52 ? 'iskender' : r < 0.74 ? 'orange' : 'matcha'; }
  function beginRound(n, foods, send) {
    const M = G.M;
    G.round = n; G.phase = 'intro'; G.phaseT = 0; G.roundT = 0; G.freeze = false; G.koWinner = null; G.slow = 1;
    G.power = true; G.powerT = 0; G.powerFlick = 0.8; G.traps = []; G.peels = []; G.projs = []; G.decoy = null; G.cage = null; G.mat = null; G.pings = []; G.fx = []; G.particles = [];
    G.sniffT = 0; G.flash = null; G.truceUsed = false; G.foodTimer = 10;
    M.foods.forEach((f, i) => { f.kind = foods[i] || null; f.t = 0; });
    resetArena();
    for (const ch of ['boy', 'girl']) {
      const old = G.players[ch], p = makePlayer(ch), s = M.spawn[ch];
      p.local = old.local; p.say = old.say; p.typing = old.typing;
      p.x = s.x - PW / 2; p.y = s.y - PH; p.face = s.x < M.W * T / 2 ? 1 : -1;
      p.cd.s1 = 4; p.cd.s2 = 2; p.cd.s3 = 4; p.cd.magic = 10; p.cd.x1 = 6; p.cd.x2 = 10; p.cd.x3 = 12;
      if (!p.local) { p.tx = p.x; p.ty = p.y; }
      G.players[ch] = p;
    }
    Sfx.play('round');
    if (send) netSend({ t: 'round', n, foods, score: G.score });
  }
  function ko(loser, send) {
    if (G.phase !== 'fight') return;
    const winner = other(loser);
    G.phase = 'ko'; G.phaseT = 0; G.koWinner = winner; G.score[winner]++; G.slow = 0.3; G.shake = 0.6;
    const p = G.players[loser]; p.hp = 0; p.act = null; p.hide = -1; p.invisT = 0;
    for (let i = 0; i < 26; i++) spawnParticle(cx(p), cy(p), (Math.random() - 0.5) * 380, (Math.random() - 0.9) * 360, 1.1, i % 2 ? C.LOOK[loser].body : '#ffffff', 3 + Math.random() * 3, 'dot', 600);
    Sfx.play('ko');
    if (send) netSend({ t: 'ko', l: loser, score: G.score });
  }
  function needWins() { return G.bestOf === 5 ? 3 : 2; }
  function updatePhase(dt) {
    G.phaseT += dt;
    if (G.phase === 'intro') {
      const before = Math.ceil(INTRO - (G.phaseT - dt)), now = Math.ceil(INTRO - G.phaseT);
      if (now !== before && now > 0 && now <= 3) Sfx.play('tick');
      if (G.phaseT >= INTRO) { G.phase = 'fight'; G.phaseT = 0; Sfx.play('go'); }
    } else if (G.phase === 'fight') {
      G.roundT += dt;
      if (!G.freeze && G.roundT >= ROUND_TIME) { G.freeze = true; Sfx.play('freeze'); banner(tr('game.freeze'), '#9be7ff'); }
    } else if (G.phase === 'ko') {
      G.slow = Math.min(1, G.slow + dt * 0.5);
      if (G.phaseT >= KO_TIME) {
        const w = G.koWinner;
        if (G.score[w] >= needWins()) {
          G.phase = 'over'; G.phaseT = 0; G.slow = 1;
          if (G.hooks.matchEnd) G.hooks.matchEnd({ winner: w, score: Object.assign({}, G.score), stats: G.stats, map: G.mapIdx, bestOf: G.bestOf, rounds: G.round });
        } else if (isAuth()) beginRound(G.round + 1, randomFoods(), true);
        else G.phase = 'wait';
      }
    }
  }
  function stop() { G.state = 'menu'; G.M = null; G.players = null; G.paused = false; G.particles = []; }

  // =====================================================================
  //  Simulation
  // =====================================================================
  function step(dt) {
    G.t += dt;
    const sdt = dt * G.slow;
    updatePhase(dt);
    if (G.phase === 'wait' || G.phase === 'over') { updateParticles(sdt); return; }
    // power & lights
    if (!G.power) { G.powerT -= sdt; if (G.powerT <= 0) setPower(true, 0, false); }
    G.powerFlick = Math.max(0, G.powerFlick - sdt);
    if (G.flash) { G.flash.t -= sdt; if (G.flash.t <= 0) G.flash = null; }
    G.sniffT = Math.max(0, G.sniffT - sdt);
    if (G.mat) { G.mat.t -= sdt; if (G.mat.t <= 0) { poof(G.mat.x, G.mat.y - 4, '#9ad27f'); G.mat = null; } }
    G.shake = Math.max(0, G.shake - dt);
    if (G.decoy) { G.decoy.t -= sdt; if (G.decoy.t <= 0) { poof(G.decoy.x + PW / 2, G.decoy.y + PH / 2, '#ff7aa8'); G.decoy = null; } }
    for (const ch of ['boy', 'girl']) {
      const p = G.players[ch];
      timers(p, sdt);
      if (p.local) updateLocal(p, readInput(ch), sdt);
      else updateRemote(p, sdt);
      updateAttack(p, sdt);
      updateAct(p, sdt);
    }
    updateProjs(sdt);
    updateFoods(sdt);
    updateArena(sdt);
    updatePings(sdt);
    updateParticles(sdt);
  }

  function timers(p, dt) {
    for (const k in p.cd) p.cd[k] = Math.max(0, p.cd[k] - dt);
    p.hurtT = Math.max(0, p.hurtT - dt); p.matT = Math.max(0, p.matT - dt); p.shockT = Math.max(0, p.shockT - dt); p.stunT = Math.max(0, p.stunT - dt); p.downT = p.stunT > 0 ? Math.max(0, p.downT - dt) : 0; p.trapT = Math.max(0, p.trapT - dt);
    p.blindT = Math.max(0, p.blindT - dt); p.speedT = Math.max(0, p.speedT - dt); p.confT = Math.max(0, p.confT - dt);
    p.ambushT = Math.max(0, p.ambushT - dt); p.hideCd = Math.max(0, p.hideCd - dt); p.dropT = Math.max(0, p.dropT - dt); p.portalCd = Math.max(0, p.portalCd - dt);
    p.kissT = Math.max(0, p.kissT - dt); p.castT = Math.max(0, p.castT - dt); p.shineT = Math.max(0, p.shineT - dt); p.glowT = Math.max(0, p.glowT - dt);
    p.squash = approach(p.squash, 0, dt * 2.5);
    p.blinkT -= dt; if (p.blinkT < -0.12) p.blinkT = 2 + Math.random() * 3;
    if (p.emoteT > 0) p.emoteT -= dt;
    if (p.say) { p.say.age += dt; if (p.say.age > p.say.dur) p.say = null; }
    if (p.typing) { p.typingT -= dt; if (p.typingT <= 0) p.typing = false; }
    if (p.invisT > 0) { p.invisT = Math.max(0, p.invisT - dt); if (p.invisT === 0 && p.local) Sfx.play('invisOff'); }
    if (p.bridalT > 0) {
      p.bridalT = Math.max(0, p.bridalT - dt); p.invisT = 0;
      if (Math.random() < dt * 4) spawnParticle(cx(p) + (Math.random() - 0.5) * 26, p.y - 4, (Math.random() - 0.5) * 20, -30, 1.4, Math.random() < 0.5 ? '#ffffff' : '#ffc2d8', 3.5, Math.random() < 0.5 ? 'heart' : 'star', -10);
    }
    if (p.morphT > 0 || p.morphForm) {
      p.morphT = Math.max(0, p.morphT - dt);
      const form = p.morphT <= 0 ? null : p.morphT > C.MORPH_DUR / 2 ? 'tangerine' : 'potato';
      if (form !== p.morphForm) { p.morphForm = form; poof(cx(p), cy(p), '#ff9a1f'); Sfx.play('morph'); }
    }
    // damage over time is applied by whoever owns this body
    if (p.local && G.phase === 'fight') {
      if (p.bleedT > 0) { p.bleedT = Math.max(0, p.bleedT - dt); damageSelf(p, 1.8 * dt, 'bleed'); if (Math.random() < dt * 5) spawnParticle(cx(p), cy(p), (Math.random() - 0.5) * 30, -20, 0.6, '#d6334a', 2, 'dot', 300); }
      if (G.freeze && !nearFire(p, 110)) { p.coldAcc += dt; damageSelf(p, 2.2 * dt, 'cold'); }
      if (p.wet) { damageSelf(p, 5 * dt, 'cold'); if (p.emoteT <= 0 && !p.say) { p.emote = tr('game.freezing'); p.emoteT = 1.4; } }
      if (!G.M.theme.safeFire) for (const f of G.M.fires) if (Math.abs(cx(p) - f.x) < 16 && Math.abs(p.y + PH - f.y) < 10) { damageSelf(p, 9 * dt, 'fire'); if (Math.random() < dt * 6) p.emote = '🔥', p.emoteT = 0.6; }
    }
  }
  function nearFire(p, r) { for (const f of G.M.fires) if (Math.hypot(cx(p) - f.x, p.y + PH - f.y) < r) return true; return false; }
  function damageSelf(p, d, why) {
    if (G.phase !== 'fight' || p.hp <= 0) return;
    p.hp = Math.max(0, p.hp - d);
    if (p.hp <= 0) ko(p.char, true);
  }

  function speedMul(p) {
    let m = 1;
    if (p.speedT > 0) m *= 1.35;
    if (p.morphForm) m *= 0.65;
    if (p.bridalT > 0) m *= 0.82;
    if (p.blindT > 0) m *= 0.7;
    if (p.bleedT > 0) m *= 0.92;
    if (p.wet) m *= 0.6;
    return m;
  }

  function updateLocal(p, inp, dt) {
    p.prevX = p.x; p.prevY = p.y;
    // hiding: frozen in place until you move, jump or press down again
    if (p.hide >= 0) {
      const h = G.M.hides[p.hide];
      p.x = h.x - PW / 2; p.y = h.y - PH; p.vx = p.vy = 0;
      if (inp.left || inp.right || inp.jumpQ || inp.downQ) leaveHide(p, true, 0.7);
      return;
    }
    if (inp.downQ) interact(p);
    const caged = !!G.cage && p.char === 'boy', onMat = p.matT > 0 && !!G.mat;
    const stuck = p.trapT > 0 || onMat, stunned = p.stunT > 0 || stuck;
    let dir = stunned ? 0 : (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (p.blindT > 0 && dir && Math.random() < dt * 2) dir = -dir; // stumbling around, blinded
    if (dir && p.dashT <= 0 && !(p.atkKind && p.atkT < p.atkDur * 0.6)) p.face = dir;
    p.coyote -= dt; p.jumpBuf -= dt;
    if (inp.jumpQ && !stunned) p.jumpBuf = P.BUF;

    // ladders
    if (!stunned && !caged && !p.climbing && ((inp.jump && onLadder(p, -2)) || (inp.down && onLadder(p, 2)))) { p.climbing = true; p.jumpBuf = 0; }
    if (p.climbing) {
      if (stunned) p.climbing = false;
      else if (p.jumpBuf > 0 && dir) { p.climbing = false; p.vy = -P.JUMP * 0.7; p.vx = dir * P.RUN; p.jumpBuf = 0; Sfx.play('jump'); }
      else if (dir && !inp.jump && !inp.down) { p.climbing = false; }
    }
    if (p.climbing) {
      p.wet = inWater(p);
      const lx = (Math.floor((p.x + PW / 2) / T) + 0.5) * T - PW / 2;
      p.x += (lx - p.x) * Math.min(1, dt * 14);
      const v = ((inp.down ? 1 : 0) - (inp.jump ? 1 : 0)) * P.CLIMB * speedMul(p);
      p.vx = 0; p.vy = v; p.grounded = false;
      if (v) p.walkT += dt * 6;
      if (moveY(p, v * dt, true)) { if (v > 0) p.climbing = false; }
      if (!onLadder(p, -1) && !onLadder(p, 1)) {
        // reached the top: step onto the ledge
        p.climbing = false;
        if (v < 0) { const ty = Math.floor((p.y + PH + 4) / T); if (cell(Math.floor((p.x + PW / 2) / T), ty) === '=') { p.y = ty * T - PH; p.vy = 0; p.grounded = true; } }
      }
      return;
    }

    // horizontal
    if (p.dashT > 0) { p.dashT -= dt; p.vx = p.face * ATK.boy.a2.dash; }
    else {
      const icy = G.M.theme.slippery && p.grounded && p.groundCell === '#';
      const acc = p.grounded ? (icy ? ICE.acc : P.ACC_G) : P.ACC_A;
      const busy = p.act && p.act !== 'dance' ? 0.0 : 1;
      p.vx = approach(p.vx, dir * P.RUN * speedMul(p) * busy * (stuck ? 0 : 1), (stunned ? (icy ? ICE.stopAcc : 900) : acc) * dt);
    }
    // vertical
    const wet = inWater(p);
    if (wet !== p.wet) { p.wet = wet; splash(p, true); }
    if (wet) {
      // swimming: slow sink, hold or tap jump to swim up, leap out at the surface
      const Wt = G.M.water;
      p.vy = Math.min(140, p.vy + P.G * 0.3 * dt);
      if (inp.jump && !stunned) p.vy = Math.max(-230, p.vy - 1500 * dt);
      if (p.jumpBuf > 0 && !stunned) { p.vy = -300; p.jumpBuf = 0; Sfx.play('swim'); makeNoise(p, 240, 'splash'); }
      if (inp.jump && !stunned && p.y < Wt.top + 2 && cell(Math.floor(cx(p) / T), Math.floor((p.y - 4) / T)) !== '#') { p.vy = -640; p.jumpCut = true; splash(p, true); }
      if (Math.random() < dt * 3) spawnParticle(cx(p) + p.face * 5, p.y + 4, (Math.random() - 0.5) * 10, -40, 1, 'rgba(200,235,255,0.7)', 2.5, 'dot', -20);
    } else p.vy = Math.min(P.MAXFALL, p.vy + P.G * dt);
    if (!wet && p.jumpBuf > 0 && p.coyote > 0 && !stunned) {
      p.vy = -P.JUMP * (p.morphForm ? 0.82 : 1); p.coyote = 0; p.jumpBuf = 0; p.jumpCut = false; p.grounded = false; p.squash = -0.25;
      if (p.act) stopAct(p, true);
      Sfx.play('jump');
      for (let i = 0; i < 4; i++) spawnParticle(cx(p), p.y + PH, (Math.random() - 0.5) * 120, -Math.random() * 40, 0.35, 'rgba(200,200,210,0.5)', 3, 'dot', 200);
    }
    if (!wet && !inp.jump && p.vy < 0 && !p.jumpCut && p.dashT <= 0) { p.vy *= 0.5; p.jumpCut = true; }
    const wasGrounded = p.grounded, vyBefore = p.vy;
    moveX(p, p.vx * dt);
    p.grounded = false; p.groundCell = null;
    moveY(p, p.vy * dt, p.dropT > 0);
    if (p.grounded) {
      p.coyote = P.COYOTE;
      if (!wasGrounded && vyBefore > 300) {
        p.squash = Math.min(0.35, vyBefore / 2400); Sfx.play('land');
        if (vyBefore > 650) { makeNoise(p, 330, 'land'); stressIce(p, 0.45); }
      }
      if (!stuck && !caged) bouncePad(p);
      if (p.grounded) checkThinIce(p);
    }
    if (p.grounded && Math.abs(p.vx) > 20) {
      p.walkT += dt * Math.abs(p.vx) / 30;
      p.stepT -= dt;
      if (p.stepT <= 0) { p.stepT = 0.34; makeNoise(p, p.speedT > 0 ? 260 : 200, 'step'); }
    }
    if (onMat) { p.x = G.mat.x - PW / 2; p.vx = 0; }
    if (caged) confineToCage(p);
    checkHazards(p);
    checkPickups(p);
  }
  function confineToCage(p) {
    const c = G.cage, half = CAGE_W / 2 - 2;
    p.x = clamp(p.x, c.x - half, c.x + half - PW);
    if (p.x <= c.x - half || p.x >= c.x + half - PW) p.vx = 0;
    if (p.y < c.y - CAGE_H + 3) { p.y = c.y - CAGE_H + 3; if (p.vy < 0) p.vy = 0; }
  }

  function updateRemote(p, dt) {
    p.prevX = p.x; p.prevY = p.y;
    if (p.hide >= 0) { const h = G.M.hides[p.hide]; if (h) { p.x = h.x - PW / 2; p.y = h.y - PH; } return; }
    if (p.tx === undefined) return;
    p.netAge += dt;
    const age = Math.min(p.netAge, 0.12);
    const ex = p.tx + p.nvx * age, ey = p.ty + (p.grounded || p.climbing ? 0 : p.nvy * age);
    const d = Math.hypot(ex - p.x, ey - p.y);
    if (d > T * 5) { p.x = ex; p.y = ey; }
    else { const k = Math.min(1, dt * 20); p.x += (ex - p.x) * k; p.y += (ey - p.y) * k; }
    p.vx = p.nvx; p.vy = p.nvy;
    if ((p.grounded && Math.abs(p.vx) > 20) || (p.climbing && Math.abs(p.vy) > 10)) p.walkT += dt * Math.max(Math.abs(p.vx), Math.abs(p.vy)) / 30;
    if (p.grounded && Math.abs(p.vx) > 20) { p.stepT -= dt; if (p.stepT <= 0) { p.stepT = 0.34; makeNoise(p, 200, 'step', true); } }
  }

  // ---------- interaction key (S / ↓): hide, search, breaker, drop down ----------
  function nearHide(p) {
    let best = -1, bd = 26;
    G.M.hides.forEach((h, i) => { const d = Math.abs(cx(p) - h.x); if (d < bd && Math.abs(p.y + PH - h.y) < 10) { bd = d; best = i; } });
    return best;
  }
  function nearBreaker(p) { const b = G.M.breaker; return b && Math.abs(cx(p) - b.x) < 30 && Math.abs(cy(p) - b.y) < 34; }
  function interact(p) {
    if (p.stunT > 0 || p.trapT > 0 || p.matT > 0 || (G.cage && p.char === 'boy') || !p.grounded) {
      if (!p.grounded && !p.climbing) p.dropT = 0.2;
      return;
    }
    const hi = nearHide(p), o = G.players[other(p.char)];
    if (hi >= 0) {
      if (o.hide === hi) { found(o.char, true); return; }
      if (p.hideCd <= 0) { enterHide(p, hi); return; }
    }
    const pi = nearPortal(p);
    if (pi >= 0 && p.portalCd <= 0) { usePortal(p, pi, true); return; }
    if (nearBreaker(p)) { setPower(!G.power, 10, true); return; }
    if (onLadder(p, 2)) return;
    if (p.groundCell === '=') { p.dropT = 0.22; p.grounded = false; }
  }
  function enterHide(p, i) {
    if (p.act) stopAct(p, true);
    p.hide = i; p.vx = p.vy = 0; p.climbing = false;
    const h = G.M.hides[i]; h.shakeT = 0.4;
    Sfx.play('hide'); makeNoise(p, 240, 'rustle');
    if (p.bridalT > 0) { p.emote = tr('game.dressShows'); p.emoteT = 1.6; }
  }
  function leaveHide(p, ambush, amb) {
    const h = G.M.hides[p.hide];
    if (h) h.shakeT = 0.4;
    p.hide = -1; p.hideCd = 0.8;
    if (ambush) p.ambushT = amb;
    Sfx.play('hide'); makeNoise(p, 240, 'rustle');
  }
  // the seeker opened the closet you were hiding in
  function found(victim, send) {
    const v = G.players[victim];
    if (send && G.mode === 'online' && !v.local) { netSend({ t: 'found' }); foundFx(v); return; }
    if (v.hide < 0) return;
    leaveHide(v, false, 0); v.stunT = 0.9; v.vy = -260; v.vx = (Math.random() < 0.5 ? -1 : 1) * 160;
    foundFx(v);
    if (send) netSend({ t: 'found' });
  }
  function foundFx(v) { Sfx.play('found'); textFx(cx(v), v.y - 20, tr('game.found'), '#ffd43b', 18); G.shake = Math.max(G.shake, 0.25); }

  // =====================================================================
  //  Arena gimmicks: trampolines, the metro train, secret bookcases, thin ice & water
  // =====================================================================
  function resetArena() {
    const M = G.M;
    G.train = null; G.trainClock = 0; G.trainK = [-1, -1];
    for (const pd of M.pads) pd.t = 0;
    for (const po of M.portals) po.swingT = 0;
    for (const th of M.thin) { th.crack = 0; th.broken = 0; M.grid[th.ty][th.tx] = '#'; }
  }
  function updateArena(dt) {
    const M = G.M;
    for (const pd of M.pads) pd.t = Math.max(0, pd.t - dt);
    for (const po of M.portals) po.swingT = Math.max(0, po.swingT - dt);
    // the opponent's splashes and trampoline bounces are only seen, not simulated
    if (M.water) for (const ch of ['boy', 'girl']) { const p = G.players[ch]; if (p.local) continue; const w = inWater(p); if (w !== p.wet) { p.wet = w; splash(p, true); } }
    if (M.pads.length) for (const ch of ['boy', 'girl']) {
      const p = G.players[ch]; if (p.local) continue;
      for (const pd of M.pads) if (pd.t <= 0 && p.nvy < -700 && Math.abs(cx(p) - pd.x) < 18 && Math.abs(p.y + PH - pd.y) < 18) { pd.t = 0.35; Sfx.play('boing'); }
    }
    // metro: a fixed timetable both screens agree on
    if (M.rail) {
      if (G.phase === 'fight' || G.phase === 'ko') G.trainClock += dt;
      G.train = trainState();
      const tn = G.train;
      if (tn && tn.phase === 'warn' && G.trainK[0] !== tn.k) { G.trainK[0] = tn.k; Sfx.play('trainBell'); }
      if (tn && tn.phase === 'pass' && G.trainK[1] !== tn.k) { G.trainK[1] = tn.k; Sfx.play('trainHorn'); }
      if (tn && tn.phase === 'pass') {
        for (const ch of ['boy', 'girl']) { const p = G.players[ch]; if (p.local && Math.abs(cy(p) - M.rail.top) < 180) G.shake = Math.max(G.shake, 0.12); }
        if (Math.random() < dt * 30) { const fx = tn.dir > 0 ? tn.x0 : tn.x0 + TRAIN.len; spawnParticle(fx + (Math.random() - 0.5) * 30, M.rail.bottom - 2, -tn.dir * (80 + Math.random() * 160), -40 - Math.random() * 80, 0.4, Math.random() < 0.5 ? '#ffd27a' : '#fff3c4', 1.6, 'dot', 500); }
      }
    }
    // frozen lake: thin ice cracks under anyone who stands still, holes freeze over again
    for (const th of M.thin) {
      if (th.broken > 0) {
        th.broken -= dt;
        if (th.broken <= 0) {
          const occupied = ['boy', 'girl'].some(ch => rectHit(G.players[ch], th.tx * T, th.ty * T, T, T));
          if (occupied) th.broken = 0.3;
          else { M.grid[th.ty][th.tx] = '#'; th.crack = 0; for (let i = 0; i < 5; i++) spawnParticle(th.tx * T + Math.random() * T, th.ty * T + 2, (Math.random() - 0.5) * 30, -20, 0.6, '#e6f6ff', 2, 'star', 0); }
        }
        continue;
      }
      let on = false;
      for (const ch of ['boy', 'girl']) if (onTile(G.players[ch], th)) on = true;
      const before = th.crack;
      th.crack = on ? Math.min(1, th.crack + dt / ICE.crackTime) : Math.max(0, th.crack - dt * 0.12);
      if (on && Math.floor(before * 3) !== Math.floor(th.crack * 3) && th.crack < 1) Sfx.play('creak');
    }
  }
  function trainState() {
    const c = G.trainClock - (TRAIN.first - TRAIN.warn);
    if (c < 0) return null;
    const k = Math.floor(c / TRAIN.period), tt = c - k * TRAIN.period, dir = k % 2 ? -1 : 1, WT = G.M.W * T;
    if (tt < TRAIN.warn) return { phase: 'warn', k, dir, u: tt / TRAIN.warn };
    if (tt < TRAIN.warn + TRAIN.pass) {
      const u = (tt - TRAIN.warn) / TRAIN.pass;
      return { phase: 'pass', k, dir, u, x0: dir > 0 ? -TRAIN.len + u * (WT + TRAIN.len) : WT - u * (WT + TRAIN.len) };
    }
    return null;
  }
  // ---------- trampolines ----------
  function bouncePad(p) {
    for (const pd of G.M.pads) {
      if (Math.abs(cx(p) - pd.x) > 15 || Math.abs(p.y + PH - pd.y) > 3) continue;
      p.vy = -P.JUMP * PAD_BOOST; p.grounded = false; p.jumpCut = true; p.coyote = 0; p.squash = -0.35;
      if (p.act) stopAct(p, true);
      pd.t = 0.35; Sfx.play('boing'); makeNoise(p, 320, 'boing');
      for (let i = 0; i < 6; i++) spawnParticle(pd.x + (Math.random() - 0.5) * 20, pd.y - 6, (Math.random() - 0.5) * 120, -80 - Math.random() * 80, 0.6, RAINBOW[i % 6], 2.5, 'star5', 300, { vr: 6 });
      return true;
    }
    return false;
  }
  // ---------- secret bookcases ----------
  function nearPortal(p) {
    let best = -1, bd = 18;
    G.M.portals.forEach((po, i) => { const d = Math.abs(cx(p) - po.x); if (d < bd && Math.abs(p.y + PH - po.y) < 10) { bd = d; best = i; } });
    return best;
  }
  function usePortal(p, i, send) {
    const M = G.M, a = M.portals[i], b = a && M.portals[a.pair];
    if (!b) return;
    a.swingT = b.swingT = 0.6;
    poof(a.x, a.y - 26, a.col); poof(b.x, b.y - 26, b.col);
    Sfx.play('secret');
    if (p.local) {
      makeNoise(p, 260, 'secret');
      if (p.act) stopAct(p, true);
      p.x = b.x - PW / 2; p.y = b.y - PH; p.vx = p.vy = 0; p.climbing = false; p.portalCd = 1; p.face = b.x < M.W * T / 2 ? 1 : -1;
      makeNoise(p, 260, 'secret');
      if (send) netSend({ t: 'portal', i });
    } else { p.x = b.x - PW / 2; p.y = b.y - PH; p.tx = p.x; p.ty = p.y; }
  }
  // ---------- frozen lake ----------
  function inWater(p) { const w = G.M.water; return !!w && cx(p) > w.x0 && cx(p) < w.x1 && cy(p) > w.top && cy(p) < w.bottom; }
  function splash(p, big) {
    const w = G.M.water; if (!w) return;
    Sfx.play('splash'); makeNoise(p, 300, 'splash');
    for (let i = 0; i < (big ? 14 : 6); i++) spawnParticle(cx(p) + (Math.random() - 0.5) * 16, w.top - 2, (Math.random() - 0.5) * 160, -120 - Math.random() * 160, 0.7, i % 2 ? '#bfe6ff' : '#ffffff', 2.5, 'dot', 700);
  }
  function onTile(p, th) {
    return p.grounded && Math.abs(p.y + PH - th.ty * T) < 6 && p.x < (th.tx + 1) * T && p.x + PW > th.tx * T;
  }
  function stressIce(p, amt) { for (const th of G.M.thin) if (!th.broken && onTile(p, th)) th.crack = Math.min(1, th.crack + amt); }
  function checkThinIce(p) {
    if (!G.M.thin.length || G.phase !== 'fight') return;
    const under = [];
    let snap = false;
    G.M.thin.forEach((th, i) => { if (!th.broken && onTile(p, th)) { under.push(i); if (th.crack >= 1) snap = true; } });
    if (snap) breakIce(under, true);
  }
  function breakIce(list, send) {
    const M = G.M;
    for (const i of list) {
      const th = M.thin[i]; if (!th || th.broken > 0) continue;
      th.broken = ICE.refreeze; th.crack = 0; M.grid[th.ty][th.tx] = '.';
      for (let k = 0; k < 8; k++) spawnParticle(th.tx * T + Math.random() * T, th.ty * T + 4, (Math.random() - 0.5) * 160, -60 - Math.random() * 140, 0.8, k % 2 ? '#e6f6ff' : '#9fd3f0', 3, 'star', 600);
    }
    const th = M.thin[list[0]];
    if (th) textFx(th.tx * T + T / 2, th.ty * T - 20, tr('game.crack'), '#bfe6ff', 16);
    Sfx.play('iceCrack'); G.shake = Math.max(G.shake, 0.2);
    if (send) netSend({ t: 'ice', i: list });
  }

  // ---------- power ----------
  function setPower(on, d, send) {
    if (on === G.power && !on) { G.powerT = Math.max(G.powerT, d); return; }
    if (on === G.power) return;
    G.power = on; G.powerT = on ? 0 : d; G.powerFlick = on ? 0.9 : 0;
    Sfx.play(on ? 'powerup' : 'powerdown');
    banner(tr(on ? 'game.powerOn' : 'game.powerOff'), on ? '#ffe066' : '#ff5d5d');
    if (send) netSend({ t: 'power', on: on ? 1 : 0, d });
  }

  // ---------- hazards & pickups (each client checks its own body) ----------
  function checkHazards(p) {
    if (G.phase !== 'fight') return;
    const o = other(p.char);
    const tr0 = G.train;
    if (tr0 && tr0.phase === 'pass' && p.trainHit !== tr0.k && p.hide < 0 && rectHit(p, tr0.x0, G.M.rail.top, TRAIN.len, G.M.rail.bottom - G.M.rail.top)) {
      p.trainHit = tr0.k;
      applyHit(p.char, { d: TRAIN.dmg, kb: tr0.dir * 640, st: 1, k: 'train' }, null);
      p.vy = -560;
      p.emote = tr('game.trainHit'); p.emoteT = 1.6;
      netSend({ t: 'envHit', d: TRAIN.dmg, k: 'train' });
    }
    for (let i = G.traps.length - 1; i >= 0; i--) {
      const tp = G.traps[i];
      if (tp.owner === p.char || tp.arm > 0) continue;
      if (rectHit(p, tp.x - 11, tp.y - 10, 22, 10)) { G.traps.splice(i, 1); trapSnap(p, tp, true); }
    }
    for (let i = G.peels.length - 1; i >= 0; i--) {
      const pe = G.peels[i];
      if (pe.owner === p.char || pe.arm > 0) continue;
      if (p.grounded && rectHit(p, pe.x - 9, pe.y - 6, 18, 6)) { G.peels.splice(i, 1); slip(p, pe, true); }
    }
    for (let i = G.projs.length - 1; i >= 0; i--) {
      const pr = G.projs[i];
      if (pr.owner === p.char) continue;
      if (rectHit(p, pr.x - 7, pr.y - 5, 14, 10) && p.hide < 0) {
        G.projs.splice(i, 1);
        applyHit(p.char, { d: ATK.girl.a3.dmg, kb: Math.sign(pr.vx) * ATK.girl.a3.kb, st: ATK.girl.a3.stun, k: 'slipper' }, o);
        netSend({ t: 'projHit', id: pr.id });
      }
    }
  }
  function trapSnap(p, tp, send) {
    p.trapT = 1.8; p.vx = 0; if (p.act) stopAct(p, true); p.invisT = 0;
    applyHit(p.char, { d: 8, kb: 0, st: 0, k: 'trap' }, tp.owner);
    Sfx.play('trap'); G.shake = Math.max(G.shake, 0.2);
    if (send) netSend({ t: 'trapHit', id: tp.id });
  }
  function slip(p, pe, send) {
    p.stunT = 1.1; p.vy = -320; p.vx = (p.vx >= 0 ? 1 : -1) * 120; p.grounded = false; p.squash = 0.3;
    applyHit(p.char, { d: 4, kb: 0, st: 1.1, k: 'peel' }, pe.owner);
    Sfx.play('slip'); textFx(cx(p), p.y - 14, tr('game.slip'), '#ffb02e', 15);
    if (send) netSend({ t: 'peelHit', id: pe.id });
  }
  function checkPickups(p) {
    G.M.foods.forEach((f, i) => {
      if (!f.kind || p.inv[f.kind] >= 3) return;
      if (Math.abs(cx(p) - f.x) < 20 && Math.abs(cy(p) - f.y) < 26) {
        const k = f.kind; f.kind = null; p.inv[k]++;
        Sfx.play('pickup'); textFx(f.x, f.y - 14, '+' + FOOD_ICON[k], '#ffffff', 16);
        netSend({ t: 'take', i });
      }
    });
  }
  function updateFoods(dt) {
    for (const tp of G.traps) tp.arm = Math.max(0, tp.arm - dt);
    for (const pe of G.peels) pe.arm = Math.max(0, pe.arm - dt);
    if (!isAuth() || G.phase !== 'fight') return;
    G.foodTimer -= dt;
    if (G.foodTimer <= 0) {
      G.foodTimer = 11 + Math.random() * 6;
      const empty = G.M.foods.map((f, i) => f.kind ? -1 : i).filter(i => i >= 0);
      const active = G.M.foods.length - empty.length;
      if (empty.length && active < Math.ceil(G.M.foods.length * 0.6)) {
        const i = empty[Math.floor(Math.random() * empty.length)], k = pickFood();
        G.M.foods[i].kind = k; G.M.foods[i].t = 0;
        netSend({ t: 'food', i, k });
      }
    }
  }

  // =====================================================================
  //  Combat
  // =====================================================================
  function canFight(p) { return G.phase === 'fight' && p.stunT <= 0 && p.trapT <= 0 && p.matT <= 0 && !p.climbing && p.hp > 0; }
  function startAttack(p, slot, remote) {
    const def = ATK[p.char][slot]; if (!def) return false;
    if (!remote) {
      if (!canFight(p) || p.cd[slot] > 0 || (p.atkKind && p.atkT < p.atkDur)) return false;
      if (p.char === 'boy' && p.morphForm) { p.emote = tr('game.potatoNoBite'); p.emoteT = 1.2; Sfx.play('nope'); return false; }
      p.cd[slot] = def.cd;
      if (p.hide >= 0) leaveHide(p, true, 0.7);
      if (p.act) stopAct(p, true);
      if (p.invisT > 0) { p.invisT = 0; Sfx.play('invisOff'); }
      netSend({ t: 'atk', k: slot });
    }
    p.atkKind = def.kind; p.atkT = 0; p.atkDur = def.dur; p.atkDef = def; p.atkHit = false; p.atkFired = false;
    if (def.dash) { p.dashT = def.dashDur; p.vy = Math.min(p.vy, -140); Sfx.play('lunge'); }
    Sfx.play(def.kind === 'slap' ? 'whoosh' : def.kind === 'slipper' ? 'throw' : 'snap');
    return true;
  }
  function attackBox(p, def) {
    const reach = PW / 2 + def.range, x = p.face > 0 ? cx(p) : cx(p) - reach;
    return { x, y: p.y + 2, w: reach, h: PH - 2 };
  }
  function updateAttack(p, dt) {
    if (!p.atkKind) return;
    p.atkT += dt;
    const def = p.atkDef;
    if (p.atkT >= p.atkDur) { p.atkKind = null; return; }
    if (!p.local || !def) return;
    if (def.proj) {
      if (!p.atkFired && p.atkT >= def.hitAt) {
        p.atkFired = true;
        const pr = { id: nid(), owner: p.char, x: cx(p) + p.face * 12, y: p.y + 8, vx: p.face * def.speed, vy: -90, rot: 0, t: 0 };
        G.projs.push(pr);
        netSend({ t: 'proj', id: pr.id, x: Math.round(pr.x), y: Math.round(pr.y), vx: pr.vx });
      }
      return;
    }
    if (p.atkHit || p.atkT < def.hitAt || p.atkT > (def.hitUntil || def.hitAt + 0.06)) return;
    const b = attackBox(p, def), o = G.players[other(p.char)];
    // the decoy eats the bite and stuns him
    if (p.char === 'boy' && G.decoy && rectHit({ x: G.decoy.x, y: G.decoy.y, w: PW, h: PH }, b.x, b.y, b.w, b.h)) {
      p.atkHit = true; popDecoy(true); return;
    }
    const hiddenHit = o.hide >= 0 && Math.abs(G.M.hides[o.hide].x - (b.x + b.w / 2)) < b.w / 2 + 12;
    if (rectHit(o, b.x, b.y, b.w, b.h) || hiddenHit) {
      p.atkHit = true;
      let d = def.dmg;
      const amb = p.ambushT > 0;
      if (amb) d *= 1.8;
      if (p.confT > 0) d *= 1.3;
      d = Math.round(d);
      if (p.dashT > 0) p.dashT = 0;
      const hit = { d, kb: p.face * def.kb, st: def.stun || 0.12, dn: def.down ? 1 : 0, bl: def.bleed || 0, k: def.kind, am: amb ? 1 : 0 };
      p.ambushT = 0;
      if (o.local) applyHit(o.char, hit, p.char);
      else { netSend(Object.assign({ t: 'hit' }, hit)); hitFx(o, hit, p.char); G.stats[p.char].dmg += d; G.stats[p.char].hits++; }
    }
  }
  function applyHit(victim, h, by) {
    const v = G.players[victim];
    if (G.phase !== 'fight' || v.hp <= 0) return;
    if (v.hide >= 0) leaveHide(v, false, 0);
    v.hp = Math.max(0, v.hp - h.d);
    if (h.kb) { v.vx = h.kb; v.vy = -230; v.grounded = false; v.climbing = false; v.dashT = 0; }
    v.stunT = Math.max(v.stunT, h.st || 0);
    if (h.dn) v.downT = v.stunT;
    if (h.bl) v.bleedT = Math.max(v.bleedT, h.bl);
    v.invisT = 0;
    if (v.act) stopAct(v, true);
    if (by && G.stats[by]) { G.stats[by].dmg += h.d; G.stats[by].hits++; }
    hitFx(v, h, by);
    if (v.hp <= 0) ko(victim, true);
  }
  function hitFx(v, h, by) {
    v.hurtT = 0.35;
    const x = cx(v), y = v.y + 10;
    if (h.k === 'bite' || h.k === 'lunge') { G.fx.push({ type: 'teeth', x, y, t: 0, life: 0.45 }); Sfx.play('bite'); }
    else if (h.k === 'slap') { G.fx.push({ type: 'slap', x, y, t: 0, life: 0.4, face: Math.sign(h.kb) || 1 }); Sfx.play('slap'); }
    else if (h.k === 'slipper') { Sfx.play('thwack'); }
    else if (h.k === 'zap') { Sfx.play('trap'); }
    else if (h.k === 'train') { Sfx.play('crash'); G.shake = Math.max(G.shake, 0.6); }
    textFx(x + (Math.random() - 0.5) * 10, v.y - 6, '-' + Math.round(h.d) + (h.am ? ' ' + tr('game.ambush') : ''), h.am ? '#ffd43b' : '#ff5d5d', h.am ? 18 : 15);
    for (let i = 0; i < 8; i++) spawnParticle(x, y, (Math.random() - 0.5) * 200, -60 - Math.random() * 120, 0.5, i % 2 ? '#ffffff' : '#ff6b6b', 2.5, i % 3 ? 'dot' : 'star', 500);
    G.shake = Math.max(G.shake, h.d > 12 ? 0.3 : 0.15);
  }

  function updateProjs(dt) {
    for (let i = G.projs.length - 1; i >= 0; i--) {
      const pr = G.projs[i];
      pr.t += dt; pr.vy += 600 * dt; pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.rot += dt * 18 * Math.sign(pr.vx);
      if (cell(Math.floor(pr.x / T), Math.floor(pr.y / T)) === '#' || pr.t > 2) {
        for (let k = 0; k < 4; k++) spawnParticle(pr.x, pr.y, (Math.random() - 0.5) * 80, -40 - Math.random() * 40, 0.4, '#ff8fb8', 2, 'dot', 400);
        Sfx.play('thud'); G.projs.splice(i, 1);
      }
    }
  }

  // ---------- skills ----------
  function useSkill(p, s, remote) {
    // the cage opens with the same key that closed it
    if (!remote && s === 'x2' && p.char === 'girl' && G.cage && G.phase === 'fight' && p.hp > 0) { releaseCage(true); p.cd.x2 = SKILL_CD.girl.x2; return true; }
    if (!remote && (!canFight(p) || p.cd[s] > 0)) { if (p.cd[s] > 0 && G.phase === 'fight') Sfx.play('nope'); return false; }
    const o = G.players[other(p.char)];
    let ok = false;
    if (p.char === 'boy') {
      if (s === 's1') { setPower(false, 8, true); ok = true; p.emote = tr('act.lightsOff'); p.emoteT = 1.6; }
      else if (s === 's2') {
        if (!p.grounded) return false;
        const mine = G.traps.filter(t => t.owner === 'boy');
        if (mine.length >= 2) { const old = mine[0]; G.traps.splice(G.traps.indexOf(old), 1); netSend({ t: 'trapHit', id: old.id, silent: 1 }); }
        const tp = { id: nid(), owner: 'boy', x: cx(p), y: p.y + PH, arm: 0.7 };
        G.traps.push(tp); netSend({ t: 'trap', id: tp.id, x: Math.round(tp.x), y: Math.round(tp.y) });
        Sfx.play('trapSet'); ok = true;
      } else if (s === 's3') {
        G.sniffT = 3.5; Sfx.play('sniff'); netSend({ t: 'sniff' }); ok = true;
        p.emote = '👃 ' + tr('act.sniff'); p.emoteT = 1.6;
      } else if (s === 'magic') {
        if (dist(p, o) > 380) { p.emote = tr('game.tooFar'); p.emoteT = 1.2; Sfx.play('nope'); return false; }
        castMagic('boy', true); ok = true;
      }
    } else {
      if (s === 's1') {
        if (p.bridalT > 0) { p.emote = tr('game.dressShows'); p.emoteT = 1.4; Sfx.play('nope'); return false; }
        p.invisT = 5.5; Sfx.play('invis'); poof(cx(p), cy(p), '#c9b8ff'); netSend({ t: 'invis' }); ok = true;
      } else if (s === 's2') { doFlash(true); ok = true; }
      else if (s === 's3') {
        if (!p.grounded) return false;
        G.decoy = { x: p.x, y: p.y, face: p.face, t: 10 };
        netSend({ t: 'decoy', x: Math.round(p.x), y: Math.round(p.y), f: p.face });
        if (p.bridalT <= 0) p.invisT = Math.max(p.invisT, 1.6);
        Sfx.play('decoy'); poof(cx(p), cy(p), '#ffb3d1'); ok = true;
      } else if (s === 'magic') {
        if (dist(p, o) > 380) { p.emote = tr('game.tooFar'); p.emoteT = 1.2; Sfx.play('nope'); return false; }
        castMagic('girl', true); ok = true;
      } else if (s === 'x1') {
        if (dist(p, o) > 330) { p.emote = tr('game.tooFar'); p.emoteT = 1.2; Sfx.play('nope'); return false; }
        doZap(true); ok = true;
      } else if (s === 'x2') {
        if (dist(p, o) > 380) { p.emote = tr('game.tooFar'); p.emoteT = 1.2; Sfx.play('nope'); return false; }
        castCage(true); ok = true; p.cd.x2 = 0; return true;
      } else if (s === 'x3') {
        castMat(true); ok = true;
      }
    }
    if (ok && p.hide >= 0 && s !== 's1' && s !== 's3') leaveHide(p, false, 0);
    if (ok) p.cd[s] = SKILL_CD[p.char][s];
    return ok;
  }
  // ---------- medical shock, break cage, break mat (her extras) ----------
  function groundY(x, y) { for (let ty = Math.floor(y / T); ty < G.M.H; ty++) { const c = cell(Math.floor(x / T), ty); if (c === '#' || c === '=') return ty * T; } return y; }
  function doZap(send) {
    const g = G.players.girl, b = G.players.boy;
    g.castT = 0.6; g.emote = tr('act.zap'); g.emoteT = 2.6;
    b.shockT = 1.3;
    G.fx.push({ type: 'zap', x1: cx(g), y1: cy(g), x2: cx(b), y2: cy(b), t: 0, life: 0.9 });
    Sfx.play('flash'); G.shake = Math.max(G.shake, 0.4);
    for (let i = 0; i < 18; i++) spawnParticle(cx(b), cy(b), (Math.random() - 0.5) * 320, (Math.random() - 0.5) * 320, 0.5, i % 2 ? '#fff6b0' : '#7fdcff', 2.5, 'star', 0);
    if (b.local) {
      b.emote = tr('act.zapped'); b.emoteT = 2;
      if (b.act) stopAct(b, true);
      applyHit('boy', { d: 18, kb: 0, st: 1.3, k: 'zap' }, 'girl');
    }
    if (send) netSend({ t: 'zap' });
  }
  function castCage(send) {
    const g = G.players.girl, b = G.players.boy;
    if (G.cage) return;
    const fy = groundY(cx(b), b.y + PH - 2);
    G.cage = { x: cx(b), y: fy, t: 0 };
    g.castT = 0.6; g.emote = tr('act.cage'); g.emoteT = 3;
    poof(cx(b), fy - 20, '#c9ccd1'); Sfx.play('trapSet'); G.shake = Math.max(G.shake, 0.25);
    textFx(cx(b), fy - CAGE_H - 12, tr('game.cage'), '#c9ccd1', 16);
    if (b.local) { b.emote = tr('act.caged'); b.emoteT = 2.4; if (b.hide >= 0) leaveHide(b, false, 0); b.climbing = false; b.dashT = 0; b.matT = 0; }
    if (send) netSend({ t: 'cage', x: Math.round(G.cage.x), y: Math.round(fy) });
  }
  function releaseCage(send) {
    if (!G.cage) return;
    poof(G.cage.x, G.cage.y - 20, '#9ad27f'); Sfx.play('pop');
    textFx(G.cage.x, G.cage.y - CAGE_H - 12, tr('game.uncage'), '#9ad27f', 16);
    G.cage = null;
    if (send) netSend({ t: 'cageOpen' });
  }
  function castMat(send) {
    const g = G.players.girl, b = G.players.boy;
    // the mat goes down right beside her, on whatever floor she stands on
    let mx = cx(g) + g.face * 34;
    if (cell(Math.floor(mx / T), Math.floor((g.y + PH / 2) / T)) === '#') mx = cx(g) - g.face * 34;
    if (cell(Math.floor(mx / T), Math.floor((g.y + PH / 2) / T)) === '#') mx = cx(g);
    const my = g.grounded ? g.y + PH : groundY(mx, g.y + PH);
    applyMat(mx, my);
    g.castT = 0.6; g.emote = tr('act.mat'); g.emoteT = 3;
    if (send) netSend({ t: 'mat', x: Math.round(mx), y: Math.round(my) });
  }
  function applyMat(mx, my) {
    const b = G.players.boy;
    poof(cx(b), cy(b), '#9ad27f');
    G.mat = { x: mx, y: my, t: MAT_TIME };
    if (b.local) {
      if (b.hide >= 0) leaveHide(b, false, 0);
      b.x = mx - PW / 2; b.y = my - PH; b.vx = b.vy = 0; b.climbing = false; b.dashT = 0; b.matT = MAT_TIME;
      if (b.act) stopAct(b, true);
      b.emote = tr('act.matted'); b.emoteT = 3;
    } else { b.x = mx - PW / 2; b.y = my - PH; b.tx = b.x; b.ty = b.y; }
    poof(mx, my - 6, '#9ad27f'); Sfx.play('trap'); G.shake = Math.max(G.shake, 0.2);
    textFx(mx, my - 40, tr('game.mat'), '#9ad27f', 16);
  }
  function doFlash(send) {
    const g = G.players.girl, b = G.players.boy;
    g.shineT = C.SHINE_DUR; g.castT = 0.6; g.invisT = 0;
    if (g.hide >= 0 && g.local) leaveHide(g, false, 0);
    G.flash = { x: cx(g), y: cy(g), t: 1.4, max: 1.4 };
    Sfx.play('flash');
    for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; spawnParticle(cx(g), cy(g) - 8, Math.cos(a) * 240, Math.sin(a) * 240, 0.7, i % 2 ? '#fff6b0' : '#ffffff', 3, 'star5', 0, { vr: 6 }); }
    if (b.local && dist(g, b) < 250 && b.hide < 0) { b.blindT = 2.8; b.stunT = Math.max(b.stunT, 0.35); textFx(cx(b), b.y - 12, tr('game.blind'), '#fff6b0', 16); }
    if (send) netSend({ t: 'flash' });
  }
  function castMagic(ch, send) {
    const g = G.players.girl, b = G.players.boy;
    if (ch === 'girl') {
      b.morphT = C.MORPH_DUR; g.castT = 0.9; b.dashT = 0;
      g.emote = tr('act.morph'); g.emoteT = 3;
      Sfx.play('magic');
    } else {
      g.bridalT = 7; g.invisT = 0;
      b.emote = tr('act.bride'); b.emoteT = 3;
      Sfx.play('wedding');
      for (let i = 0; i < 18; i++) spawnParticle(cx(g), cy(g), (Math.random() - 0.5) * 220, -60 - Math.random() * 200, 1.3, ['#ffffff', '#ffd1e3', '#ff8fb8', '#fff3c4'][i % 4], 3 + Math.random() * 3, i % 3 ? 'heart' : 'star5', 160, { vr: 4 });
    }
    if (send) netSend({ t: 'magic', ch });
  }
  function popDecoy(send) {
    const d = G.decoy; if (!d) return;
    G.decoy = null;
    poof(d.x + PW / 2, d.y + PH / 2, '#ff7aa8');
    const b = G.players.boy;
    if (b.local) { b.stunT = Math.max(b.stunT, 1.3); b.dashT = 0; b.vx = 0; }
    textFx(d.x + PW / 2, d.y - 10, tr('game.decoy'), '#ff8fb8', 17);
    Sfx.play('decoyPop');
    if (send) netSend({ t: 'decoyPop' });
  }

  // ---------- kiss = once-per-round truce: both must press it, side by side ----------
  function requestKiss(ch, send) {
    const p = G.players[ch], o = G.players[other(ch)];
    if (G.phase !== 'fight') return;
    if (G.truceUsed) { p.emote = tr('game.truceUsed'); p.emoteT = 1.4; return; }
    p.kissReq = G.t;
    if (send) netSend({ t: 'kissReq' });
    if (dist(p, o) < 48 && G.t - o.kissReq < 2.5) { truce(send); return; }
    p.emote = tr('game.kissAsk'); p.emoteT = 2.2; Sfx.play('pop');
  }
  function truce(send) {
    if (G.truceUsed) return;
    G.truceUsed = true;
    const a = G.players.boy, b = G.players.girl;
    a.face = b.x >= a.x ? 1 : -1; b.face = -a.face;
    a.kissT = b.kissT = 1.4;
    for (const p of [a, b]) { if (p.local) p.hp = Math.min(HP_MAX, p.hp + 12); p.emoteT = 0; }
    const mx = (cx(a) + cx(b)) / 2, my = Math.min(a.y, b.y) + 4;
    for (let i = 0; i < 40; i++) { const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, sp = 120 + Math.random() * 240; spawnParticle(mx, my, Math.cos(ang) * sp, Math.sin(ang) * sp, 1.6 + Math.random(), ['#ff3d73', '#ff7aa8', '#ffb3c7'][i % 3], 4 + Math.random() * 6, 'heart', 120); }
    textFx(mx, my - 26, tr('game.truce'), '#ff8fb8', 18);
    Sfx.play('kiss');
  }

  // ---------- fun actions & food ----------
  function canAct(p) { return p.grounded && Math.abs(p.vx) < 60 && p.stunT <= 0 && p.trapT <= 0 && p.matT <= 0 && !p.climbing && G.phase === 'fight'; }
  const ACT_DUR = { dance: 3.2, iskender: 4.4, sandwich: 3.2, matcha: 3.0, orange: 2.6 };
  const HEAL = { iskender: 34, sandwich: 20, orange: 10 };
  function startAct(ch, kind, send, force) {
    const p = G.players && G.players[ch]; if (!p || !ACT_DUR[kind]) return false;
    if (!force) {
      if (!canAct(p) || p.act) return false;
      if (kind !== 'dance') {
        if (!p.inv[kind]) { p.emote = tr('game.noFood', { f: FOOD_ICON[kind] }); p.emoteT = 1.4; Sfx.play('nope'); return false; }
        p.inv[kind]--; G.stats[ch].eaten++;
      }
    }
    p.act = kind; p.actT = 0; p.actFx = 0; p.sipped = false; p.chewT = 0; p.actDur = ACT_DUR[kind]; p.noiseT = 0;
    p.healLeft = HEAL[kind] || 0; p.healRate = p.healLeft / p.actDur;
    const label = { dance: 'act.dance', iskender: 'act.eat', sandwich: 'act.sandwich', matcha: 'act.matcha', orange: 'act.orange' }[kind];
    p.emote = tr(label); p.emoteT = p.actDur;
    Sfx.play(kind === 'dance' ? 'dance' : 'pop');
    if (send) netSend({ t: 'act', a: kind });
    return true;
  }
  function stopAct(p, interrupted) {
    if (p.act && interrupted && p.local && p.act !== 'dance') { textFx(cx(p), p.y - 16, tr('game.dropped'), '#bbbbbb', 13); }
    if (p.emoteT > 0 && p.act) p.emoteT = Math.min(p.emoteT, 0.3);
    p.act = null; p.healLeft = 0;
  }
  function drawActKind(p) { return p.act === 'iskender' ? 'eat' : p.act; }
  function updateAct(p, dt) {
    if (!p.act) return;
    p.actT += dt;
    if (p.local) {
      if (p.actT >= p.actDur) { finishAct(p); return; }
      if (Math.abs(p.vx) > 60 || !p.grounded || p.stunT > 0) { stopAct(p, true); return; }
      if (p.healLeft > 0) { const h = Math.min(p.healLeft, p.healRate * dt); p.healLeft -= h; p.hp = Math.min(HP_MAX, p.hp + h); }
      p.noiseT -= dt;
      if (p.noiseT <= 0) { p.noiseT = 0.75; makeNoise(p, p.act === 'dance' ? 700 : 620, p.act === 'dance' ? 'music' : 'chew'); }
    } else if (p.actT > p.actDur + 0.3) { p.act = null; return; }
    const x = cx(p);
    if (p.act === 'dance') {
      p.actFx -= dt;
      if (p.actFx <= 0) { p.actFx = 0.3; spawnParticle(x + (Math.random() - 0.5) * 24, p.y - 8, (Math.random() - 0.5) * 50, -55 - Math.random() * 30, 1.3, RAINBOW[Math.floor(Math.random() * 6)], 11 + Math.random() * 4, 'note', -15, { ch: Math.random() < 0.5 ? '♪' : '♫' }); }
      return;
    }
    const k = C.sipPhase(p.actT);
    p.chewT = Math.max(0, p.chewT - dt);
    if (k > 0.9 && !p.sipped) {
      p.sipped = true; p.chewT = 0.85;
      Sfx.play(p.act === 'matcha' ? 'sip' : 'chomp');
      const cols = p.act === 'orange' ? ['#ffb02e', '#ffd36b'] : p.act === 'matcha' ? ['#ff8fb1', '#9ad27f'] : ['#c8783f', '#e9c27a'];
      for (let i = 0; i < 4; i++) spawnParticle(x + p.face * 6, p.y + 4, (Math.random() - 0.5) * 60, -30 - Math.random() * 50, 0.6, cols[i % 2], 2 + Math.random(), 'dot', 400);
      if (p.act !== 'matcha') spawnParticle(x + p.face * 8, p.y - 6, p.face * 20, -45, 1.1, '#7dff9a', 5, 'text', -20, { text: '+' });
    } else if (k < 0.1) p.sipped = false;
  }
  function finishAct(p) {
    const k = p.act;
    if (p.healLeft > 0) p.hp = Math.min(HP_MAX, p.hp + p.healLeft);
    if (k === 'dance') { p.confT = 10; textFx(cx(p), p.y - 16, tr('game.confident'), '#ffd43b', 16); Sfx.play('buff'); }
    if (k === 'matcha') { p.speedT = 10; textFx(cx(p), p.y - 16, tr('game.fast'), '#9ad27f', 16); Sfx.play('buff'); }
    if (k === 'orange') {
      const pe = { id: nid(), owner: p.char, x: cx(p) - p.face * 14, y: p.y + PH, arm: 0.6 };
      G.peels.push(pe); netSend({ t: 'peel', id: pe.id, x: Math.round(pe.x), y: Math.round(pe.y) });
    }
    if (HEAL[k]) Sfx.play('heal');
    p.act = null; p.healLeft = 0;
  }

  // ---------- talking ----------
  function sayText(ch, text, dur) {
    const p = G.players && G.players[ch]; if (!p) return;
    p.say = { text, age: 0, dur: dur || Math.min(8, 3.2 + text.length * 0.07) };
    p.emoteT = 0;
    for (let i = 0; i < 5; i++) spawnParticle(cx(p), p.y - 10, (Math.random() - 0.5) * 120, -60 - Math.random() * 90, 1.2, i % 2 ? '#ff5d8f' : '#ffc2d4', 4 + Math.random() * 3, 'heart', -10);
    if (G.phase === 'fight') makeNoise(p, 600, 'talk', !p.local);
  }
  function sayPhrase(ch, i, send) {
    const n = NSWEET + NTAUNT;
    i = ((i % n) + n) % n;
    sayText(ch, trList('phrases', i), 3.6);
    Sfx.play(i < NSWEET ? 'love' : 'taunt');
    if (send) netSend({ t: 'say', i });
  }
  function chatSay(ch, text, send) {
    text = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    if (!text) return;
    const p = G.players && G.players[ch]; if (p) p.typing = false;
    sayText(ch, text);
    Sfx.play('msg');
    if (send) netSend({ t: 'chat', text });
  }
  function setTyping(ch, on, send) {
    const p = G.players && G.players[ch]; if (!p) return;
    p.typing = !!on; p.typingT = on ? 6 : 0;
    if (send) netSend({ t: 'typing', on: on ? 1 : 0 });
  }

  // ---------- noise: footsteps, chewing, music & talk give you away ----------
  function makeNoise(p, r, kind, remote) {
    G.pings.push({ x: cx(p), y: p.y + (kind === 'step' || kind === 'land' ? PH : PH / 2), r, kind, owner: p.char, t: 0, life: kind === 'step' ? 0.7 : 1.1 });
    if (G.pings.length > 60) G.pings.shift();
  }
  function updatePings(dt) { for (let i = G.pings.length - 1; i >= 0; i--) { const n = G.pings[i]; n.t += dt; if (n.t > n.life) G.pings.splice(i, 1); } }

  // =====================================================================
  //  Network glue
  // =====================================================================
  function netTick(dt) {
    if (G.mode !== 'online' || !G.players) return;
    G.netAcc += dt;
    if (G.netAcc < 1 / 30) return;
    G.netAcc = 0;
    const p = G.players[G.myChar];
    const fl = (p.stunT > 0 ? 1 : 0) | (p.trapT > 0 ? 2 : 0) | (p.blindT > 0 ? 4 : 0) | (p.climbing ? 16 : 0) | (p.bleedT > 0 ? 32 : 0) | (p.speedT > 0 ? 64 : 0) | (p.confT > 0 ? 128 : 0) | (p.matT > 0 ? 8 : 0) | (p.downT > 0 ? 256 : 0);
    netSend({ t: 's', x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10, vx: Math.round(p.vx), vy: Math.round(p.vy), f: p.face, g: p.grounded ? 1 : 0, hd: p.hide, iv: p.invisT > 0 ? 1 : 0, hp: Math.round(p.hp * 10) / 10, a: p.act || 0, fl, rd: G.round, inv: p.inv });
  }
  function onNet(m) {
    if (!G.players || !G.M) return;
    const oc = other(G.myChar), o = G.players[oc], me = G.players[G.myChar];
    switch (m.t) {
      case 's': {
        if (m.rd !== G.round && G.phase !== 'wait') return;
        o.tx = m.x; o.ty = m.y; o.nvx = m.vx; o.nvy = m.vy; o.face = m.f; o.netAge = 0;
        if (m.g && !o.grounded && o.nvy >= 0) o.squash = 0.15;
        o.grounded = !!m.g;
        const hd = typeof m.hd === 'number' ? m.hd : -1;
        if (hd !== o.hide) { const h = G.M.hides[hd >= 0 ? hd : o.hide]; if (h) h.shakeT = 0.4; if (o.hide >= 0 && hd < 0) { o.x = o.tx; o.y = o.ty; } o.hide = hd; }
        o.invisT = m.iv ? Math.max(o.invisT, 0.2) : 0;
        if (typeof m.hp === 'number' && G.phase !== 'ko') o.hp = m.hp;
        if (m.a && !o.act) { o.act = m.a; o.actT = 0; o.actDur = ACT_DUR[m.a] || 3; }
        else if (!m.a && o.act) o.act = null;
        const fl = m.fl | 0;
        o.climbing = !!(fl & 16);
        if (fl & 256) o.downT = Math.max(o.downT, 0.1); else o.downT = 0; if (fl & 1) o.stunT = Math.max(o.stunT, 0.1); if (fl & 2) o.trapT = Math.max(o.trapT, 0.1); if (fl & 4) o.blindT = Math.max(o.blindT, 0.1);
        o.matT = fl & 8 ? 0.1 : 0; o.bleedT = fl & 32 ? 0.1 : 0; o.speedT = fl & 64 ? 0.1 : 0; o.confT = fl & 128 ? 0.1 : 0;
        if (m.inv) o.inv = m.inv;
        break;
      }
      case 'round': if (!isAuth()) { if (m.score) G.score = m.score; beginRound(m.n | 0, Array.isArray(m.foods) ? m.foods : [], false); } break;
      case 'ko': if (G.phase === 'fight') ko(m.l === 'girl' ? 'girl' : 'boy', false); if (m.score) G.score = m.score; break;
      case 'atk': startAttack(o, m.k, true); break;
      case 'hit': applyHit(G.myChar, { d: +m.d || 0, kb: +m.kb || 0, st: +m.st || 0, bl: +m.bl || 0, k: m.k, am: m.am }, oc); break;
      case 'proj': G.projs.push({ id: m.id, owner: oc, x: m.x, y: m.y, vx: m.vx, vy: -90, rot: 0, t: 0 }); break;
      case 'projHit': G.projs = G.projs.filter(p => p.id !== m.id); break;
      case 'trap': G.traps.push({ id: m.id, owner: oc, x: m.x, y: m.y, arm: 0.6 }); break;
      case 'trapHit': {
        const tp = G.traps.find(t => t.id === m.id);
        G.traps = G.traps.filter(t => t.id !== m.id);
        if (tp && !m.silent) { o.trapT = 1.8; Sfx.play('trap'); hitFx(o, { d: 8, k: 'trap' }); }
        break;
      }
      case 'peel': G.peels.push({ id: m.id, owner: oc, x: m.x, y: m.y, arm: 0.6 }); break;
      case 'peelHit': G.peels = G.peels.filter(t => t.id !== m.id); Sfx.play('slip'); textFx(cx(o), o.y - 14, tr('game.slip'), '#ffb02e', 15); break;
      case 'decoy': G.decoy = { x: m.x, y: m.y, face: m.f || 1, t: 10 }; break;
      case 'decoyPop': popDecoy(false); break;
      case 'power': setPower(!!m.on, +m.d || 8, false); break;
      case 'sniff': Sfx.play('sniff'); me.emote = tr('game.sniffed'); me.emoteT = 2; o.emote = '👃 ' + tr('act.sniff'); o.emoteT = 1.6; break;
      case 'flash': doFlash(false); break;
      case 'zap': doZap(false); break;
      case 'cage': G.cage = { x: m.x, y: m.y, t: 0 }; { const b = G.players.boy; if (b.local) { b.emote = tr('act.caged'); b.emoteT = 2.4; if (b.hide >= 0) leaveHide(b, false, 0); b.climbing = false; b.dashT = 0; } else { b.emote = null; } } poof(m.x, m.y - 20, '#c9ccd1'); Sfx.play('trapSet'); textFx(m.x, m.y - CAGE_H - 12, tr('game.cage'), '#c9ccd1', 16); break;
      case 'cageOpen': releaseCage(false); break;
      case 'mat': applyMat(m.x, m.y); break;
      case 'invis': Sfx.play('invis'); poof(cx(o), cy(o), '#c9b8ff'); break;
      case 'magic': castMagic(m.ch === 'girl' ? 'girl' : 'boy', false); break;
      case 'found': found(G.myChar, false); break;
      case 'portal': if (G.M.portals[m.i | 0]) usePortal(o, m.i | 0, false); break;
      case 'ice': if (Array.isArray(m.i)) breakIce(m.i.map(n => n | 0), false); break;
      case 'envHit': hitFx(o, { d: +m.d || 0, k: m.k }); break;
      case 'kissReq': o.kissReq = G.t; if (dist(o, me) < 48 && G.t - me.kissReq < 2.5) truce(false); else { o.emote = tr('game.kissAsk'); o.emoteT = 2.2; } break;
      case 'food': if (G.M.foods[m.i]) { G.M.foods[m.i].kind = FOODS.includes(m.k) ? m.k : null; G.M.foods[m.i].t = 0; } break;
      case 'take': if (G.M.foods[m.i]) G.M.foods[m.i].kind = null; Sfx.play('pickupFar'); break;
      case 'act': startAct(oc, m.a, false, true); break;
      case 'say': sayPhrase(oc, m.i | 0, false); break;
      case 'chat': chatSay(oc, m.text, false); break;
      case 'typing': setTyping(oc, !!m.on, false); break;
    }
  }

  // =====================================================================
  //  Particles & floating fx
  // =====================================================================
  function spawnParticle(x, y, vx, vy, life, color, size, type, g, ex) {
    if (G.particles.length > 700) return;
    const p = { x, y, vx, vy, life, max: life, color, size, type, g: g || 0, rot: Math.random() * 6 };
    if (ex) Object.assign(p, ex);
    G.particles.push(p);
  }
  function updateParticles(dt) {
    const ps = G.particles;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.life -= dt;
      if (p.life <= 0) { ps.splice(i, 1); continue; }
      p.vy += p.g * dt; p.vx *= 0.99;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.rot += dt * (p.vr !== undefined ? p.vr : 3);
    }
    for (let i = G.fx.length - 1; i >= 0; i--) { const f = G.fx[i]; f.t += dt; if (f.t > f.life) G.fx.splice(i, 1); }
    for (const h of G.M ? G.M.hides : []) if (h.shakeT > 0) h.shakeT -= dt;
  }
  function textFx(x, y, text, color, size) { G.fx.push({ type: 'text', x, y, text, color, size: size || 15, t: 0, life: 1.2 }); }
  function poof(x, y, col) {
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; spawnParticle(x, y, Math.cos(a) * 110, Math.sin(a) * 110, 0.6, 'rgba(255,255,255,0.85)', 4 + Math.random() * 3, 'dot', 0); }
    for (let i = 0; i < 6; i++) spawnParticle(x, y, (Math.random() - 0.5) * 180, -60 - Math.random() * 120, 0.8, col, 3, 'star5', 250, { vr: 6 });
  }
  const banners = [];
  function banner(text, color) { banners.push({ text, color, t: 0 }); if (banners.length > 3) banners.shift(); }
  function initAmbient() {
    G.ambient = [];
    for (let i = 0; i < 90; i++) G.ambient.push({ x: Math.random(), y: Math.random(), s: 0.5 + Math.random(), ph: Math.random() * 6.28, sp: 0.5 + Math.random() });
  }

  // =====================================================================
  //  Lighting & visibility
  // =====================================================================
  function lampOn(l) {
    if (!G.power) return 0;
    if (G.powerFlick > 0) return Math.random() < 0.5 ? 0 : 1;
    const key = G.M.themeKey;
    if (key === 'market') { const f = Math.sin(G.t * 23 + l.ph * 7) + Math.sin(G.t * 3.1 + l.ph); return f > 1.75 ? 0.15 : 1; }
    if (key === 'fair') return 0.82 + 0.18 * Math.max(0, Math.sin(G.t * 4 - l.ph * 1.3)); // chasing carnival bulbs
    if (key === 'library') return 0.9 + Math.sin(G.t * 11 + l.ph * 5) * 0.05 + Math.sin(G.t * 23 + l.ph) * 0.03; // candles
    if (key === 'metro' && l.ph === 3) return Math.sin(G.t * 31) + Math.sin(G.t * 2.3) > 1.3 ? 0.1 : 1; // one dying tube
    return 1;
  }
  function visionR(p) {
    if (p.blindT > 0) return 34;
    if (!G.power) return p.char === 'boy' ? 210 : 82;
    return 118;
  }
  function lightsFor(viewer) {
    const L = [], M = G.M, t = G.t;
    for (const l of M.lamps) { const on = lampOn(l); if (on) L.push({ x: l.x, y: l.y + 8, r: l.r * (0.97 + Math.sin(t * 2 + l.ph) * 0.03), s: on, warm: 1, col: l.col }); }
    // the train lights up the tracks as it thunders through
    const tn = G.train;
    if (tn && M.rail) {
      const ry = M.rail.top + 40;
      if (tn.phase === 'warn') { const on = Math.sin(t * 14) > 0; if (on) for (const x of [2.5 * T, (M.W - 2.5) * T]) L.push({ x, y: M.rail.top + 8, r: 70, s: 0.9, red: 1 }); }
      else {
        const front = tn.dir > 0 ? tn.x0 + TRAIN.len : tn.x0;
        L.push({ x: front + tn.dir * 60, y: ry, r: 230, s: 1, warm: 3 });
        for (let k = 1; k < 6; k++) L.push({ x: tn.x0 + k * TRAIN.len / 6, y: ry - 6, r: 95, s: 0.85, col: '255,236,180' });
      }
    }
    for (const f of M.fires) L.push({ x: f.x, y: f.y - 14, r: f.r * (0.94 + Math.sin(t * 9) * 0.03 + Math.random() * 0.03), s: 1, warm: 2 });
    if (G.flash) { const e = Math.min(1, G.flash.t / G.flash.max * 1.6); L.push({ x: G.flash.x, y: G.flash.y, r: 320 * e + 40, s: 1, warm: 3 }); }
    const g = G.players.girl;
    if (g.bridalT > 0) L.push({ x: cx(g), y: cy(g), r: 80, s: 0.9 });
    if (M.breaker && !G.power) L.push({ x: M.breaker.x, y: M.breaker.y, r: 46, s: 0.8, red: 1 });
    if (viewer) L.push({ x: cx(viewer), y: cy(viewer), r: visionR(viewer), s: 1, self: 1 });
    return L;
  }
  function lightAt(x, y, L) {
    let best = 0;
    for (const s of L) { const d = Math.hypot(x - s.x, y - s.y); if (d < s.r) { const v = s.s * (1 - (d / s.r) * (d / s.r)); if (v > best) best = v; } }
    return best;
  }
  // how visible "o" is to "viewer" (0..1)
  function visibility(viewer, o, L) {
    if (o.hide >= 0) return 0;
    if (o.invisT > 0 && o.bridalT <= 0) {
      const d = dist(viewer, o), moving = Math.abs(o.vx) > 40 || Math.abs(o.vy) > 80;
      return d < 70 ? 0.22 : moving && d < 160 ? 0.08 : 0;
    }
    let v = clamp((lightAt(cx(o), cy(o), L) - 0.12) / 0.3, 0, 1);
    if (o.bridalT > 0) v = Math.max(v, 0.9);
    return v;
  }

  // =====================================================================
  //  Rendering
  // =====================================================================
  function resize() {
    if (!G.canvas) return;
    const dpr = Math.min(2, global.devicePixelRatio || 1);
    const w = Math.floor(global.innerWidth * dpr), h = Math.floor(global.innerHeight * dpr);
    if (w !== G.cw || h !== G.ch || dpr !== G.dpr) {
      G.cw = w; G.ch = h; G.dpr = dpr;
      G.canvas.width = w; G.canvas.height = h;
    }
  }
  function darkCanvas(i, w, h) {
    let d = G.darks[i];
    if (!d) { const c = document.createElement('canvas'); d = G.darks[i] = { c, x: c.getContext('2d') }; }
    if (d.c.width !== w || d.c.height !== h) { d.c.width = w; d.c.height = h; }
    return d;
  }

  function render(dt) {
    const ctx = G.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, G.cw, G.ch);
    let views;
    if (G.mode === 'online') views = [{ ch: G.myChar, x: 0, y: 0, w: G.cw, h: G.ch }];
    else {
      const left = G.schemes.boy === 'p1' ? 'boy' : 'girl', half = Math.floor(G.cw / 2);
      views = [{ ch: left, x: 0, y: 0, w: half - 2, h: G.ch }, { ch: other(left), x: half + 2, y: 0, w: G.cw - half - 2, h: G.ch }];
    }
    views.forEach((v, i) => renderView(ctx, v, i, dt));
    if (views.length > 1) { ctx.setTransform(1, 0, 0, 1, 0, 0); const g = ctx.createLinearGradient(G.cw / 2 - 3, 0, G.cw / 2 + 3, 0); g.addColorStop(0, '#1a0f0f'); g.addColorStop(0.5, '#6b1b1b'); g.addColorStop(1, '#1a0f0f'); ctx.fillStyle = g; ctx.fillRect(Math.floor(G.cw / 2) - 2, 0, 4, G.ch); }
    drawGlobalOverlays(ctx, dt);
  }

  function renderView(ctx, v, vi, dt) {
    const M = G.M, me = G.players[v.ch], op = G.players[other(v.ch)];
    const z = Math.max(1, v.h / (VIEW_TILES * T));
    const vw = v.w / z, vh = v.h / z;
    // camera
    if (!v.cam) v.cam = G.views[vi] || { x: 0, y: 0, init: false };
    const cam = G.views[vi] = v.cam;
    let tx = cx(me) - vw / 2, ty = cy(me) - vh * 0.55;
    const maxX = M.W * T - vw, maxY = M.H * T - vh;
    tx = maxX < 0 ? maxX / 2 : clamp(tx, 0, maxX); ty = maxY < 0 ? maxY / 2 : clamp(ty, 0, maxY);
    if (!cam.init || Math.abs(cam.x - tx) > vw) { cam.x = tx; cam.y = ty; cam.init = true; }
    const k = 1 - Math.pow(0.0008, dt);
    cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
    let ox = Math.round(cam.x * z), oy = Math.round(cam.y * z);
    if (G.shake > 0) { const a = G.shake * 10 * G.dpr; ox += Math.round((Math.random() - 0.5) * a); oy += Math.round((Math.random() - 0.5) * a); }
    const L = lightsFor(me);
    const W = { ctx, v, z, ox, oy, cam, vw, vh, L, me, op };

    ctx.save();
    ctx.beginPath(); ctx.rect(v.x, v.y, v.w, v.h); ctx.clip();
    ctx.setTransform(1, 0, 0, 1, v.x, v.y);
    drawBackground(W);
    ctx.setTransform(z, 0, 0, z, v.x - ox, v.y - oy);
    drawWorld(W);
    // characters
    const opVis = G.phase === 'intro' ? 1 : visibility(me, op, L);
    W.opVis = opVis;
    if (opVis > 0.01) { ctx.globalAlpha = opVis; C.draw(ctx, drawable(op), G.t); ctx.globalAlpha = 1; }
    if (me.hide < 0) { ctx.globalAlpha = me.invisT > 0 ? 0.4 + Math.sin(G.t * 8) * 0.08 : 1; C.draw(ctx, drawable(me), G.t); ctx.globalAlpha = 1; }
    drawArenaFront(W);
    drawCage(ctx);
    drawFlashBeam(ctx);
    drawFx(ctx);
    drawParticles(ctx);
    // darkness
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawDarkness(W, vi);
    ctx.setTransform(z, 0, 0, z, v.x - ox, v.y - oy);
    drawAboveDark(W);
    ctx.setTransform(1, 0, 0, 1, v.x, v.y);
    drawViewOverlays(W);
    ctx.restore();
  }
  // a shallow copy for the art code (it expects the old field names)
  function drawable(p) {
    const d = Object.assign({}, p);
    d.act = drawActKind(p);
    d.anchored = false;
    if (p.trapT > 0 || p.matT > 0) { d.vx = 0; }
    if (p.shockT > 0) { d.x += (Math.random() - 0.5) * 4; d.y += (Math.random() - 0.5) * 2; d.hurtT = Math.max(d.hurtT, 0.1); }
    return d;
  }

  // ---------- background ----------
  function drawBackground(W) {
    const { ctx, v, cam, z } = W, th = G.M.theme, t = G.t;
    const g = ctx.createLinearGradient(0, 0, 0, v.h);
    g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, v.w, v.h);
    const bgk = G.M.themeKey;
    if (bgk === 'fair') return drawFairBg(W);
    if (bgk === 'metro') return drawMetroBg(W);
    if (bgk === 'library') return drawLibraryBg(W);
    if (bgk === 'ice') return drawIceBg(W);
    if (G.M.themeKey === 'forest') {
      // moon, stars and far treeline
      const mx = v.w * 0.75 - cam.x * z * 0.05, my = v.h * 0.18;
      const mg = ctx.createRadialGradient(mx, my, 0, mx, my, 90 * z);
      mg.addColorStop(0, 'rgba(220,235,255,0.25)'); mg.addColorStop(1, 'rgba(220,235,255,0)');
      ctx.fillStyle = mg; ctx.fillRect(mx - 90 * z, my - 90 * z, 180 * z, 180 * z);
      ctx.fillStyle = '#dfe9f5'; ctx.beginPath(); ctx.arc(mx, my, 16 * z, 0, 7); ctx.fill();
      ctx.fillStyle = th.sky[0]; ctx.beginPath(); ctx.arc(mx + 6 * z, my - 4 * z, 14 * z, 0, 7); ctx.fill();
      for (let i = 0; i < 60; i++) { const sx = ((i * 137.5) % 1000) / 1000 * v.w, sy = ((i * 71.3) % 500) / 500 * v.h * 0.5; ctx.fillStyle = `rgba(255,255,255,${0.2 + 0.3 * Math.abs(Math.sin(t + i))})`; ctx.fillRect(sx, sy, 1.5 * G.dpr, 1.5 * G.dpr); }
      for (let layer = 0; layer < 2; layer++) {
        const par = layer ? 0.45 : 0.25, base = v.h * (layer ? 0.72 : 0.62);
        ctx.fillStyle = layer ? '#07110f' : '#0a1614';
        ctx.beginPath(); ctx.moveTo(0, v.h);
        for (let x = 0; x <= v.w + 40; x += 18 * G.dpr) {
          const wx = x + cam.x * z * par, h = (Math.sin(wx * 0.013) * 0.5 + 0.5) * 40 * z + (Math.abs(Math.sin(wx * 0.051)) * 30 * z);
          ctx.lineTo(x, base - h);
        }
        ctx.lineTo(v.w, v.h); ctx.closePath(); ctx.fill();
      }
      return;
    }
    // indoor: wall with pattern
    const step = (G.M.themeKey === 'house' ? 24 : 32) * z, off = -(cam.x * z * 0.9) % step;
    ctx.fillStyle = th.wall; ctx.fillRect(0, 0, v.w, v.h);
    ctx.strokeStyle = th.wallLine; ctx.lineWidth = Math.max(1, z * 0.8);
    if (G.M.themeKey === 'house') {
      for (let x = off; x < v.w; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, v.h); ctx.stroke(); }
      // old picture frames & moonlit windows
      for (let i = 0; i < 10; i++) {
        const wx = (i * 7.3 + 3) * T * 1.1, sx = (wx - cam.x * 0.9) * z;
        if (sx < -80 * z || sx > v.w + 80 * z) continue;
        const sy = ((i % 3) * 6 + 3) * T * z - cam.y * z * 0.9;
        if (i % 2) {
          ctx.fillStyle = 'rgba(120,150,200,0.10)'; ctx.fillRect(sx, sy, 34 * z, 44 * z);
          ctx.strokeStyle = 'rgba(80,60,40,0.7)'; ctx.lineWidth = 3 * z; ctx.strokeRect(sx, sy, 34 * z, 44 * z);
          ctx.beginPath(); ctx.moveTo(sx + 17 * z, sy); ctx.lineTo(sx + 17 * z, sy + 44 * z); ctx.moveTo(sx, sy + 22 * z); ctx.lineTo(sx + 34 * z, sy + 22 * z); ctx.stroke();
        } else {
          ctx.strokeStyle = 'rgba(110,80,50,0.35)'; ctx.lineWidth = 2 * z; ctx.strokeRect(sx, sy + 8 * z, 26 * z, 20 * z);
        }
      }
    } else {
      for (let x = off; x < v.w; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, v.h); ctx.stroke(); }
      const oy = -(cam.y * z * 0.9) % step;
      for (let y = oy; y < v.h; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(v.w, y); ctx.stroke(); }
      // sale posters
      for (let i = 0; i < 8; i++) {
        const sx = ((i * 8.5 + 2) * T - cam.x * 0.9) * z, sy = (3 * T - cam.y * 0.9) * z;
        if (sx < -60 * z || sx > v.w + 60 * z) continue;
        ctx.fillStyle = i % 2 ? 'rgba(200,40,40,0.18)' : 'rgba(230,200,60,0.14)'; ctx.fillRect(sx, sy, 40 * z, 26 * z);
      }
    }
  }

  // ---------- world ----------
  function drawWorld(W) {
    const { ctx, cam, vw, vh } = W, M = G.M, th = M.theme, t = G.t;
    const x0 = Math.max(0, Math.floor(cam.x / T) - 1), x1 = Math.min(M.W - 1, Math.floor((cam.x + vw) / T) + 1);
    const y0 = Math.max(0, Math.floor(cam.y / T) - 1), y1 = Math.min(M.H - 1, Math.floor((cam.y + vh) / T) + 1);
    // tree trunks
    for (const tr0 of M.trees) {
      if (tr0.pine) { drawPine(ctx, tr0); continue; }
      ctx.fillStyle = '#1b130d'; ctx.fillRect(tr0.x - 9, tr0.top + 40, 18, tr0.base - tr0.top - 40);
      ctx.fillStyle = '#0f1d14';
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(tr0.x + Math.sin(i * 2.1) * 30, tr0.top + 40 + i * 34, 46 - i * 6, 0, 7); ctx.fill(); }
    }
    drawArenaBack(W, x0, x1, y0, y1);
    const special = M.themeKey === 'fair' || M.themeKey === 'metro' || M.themeKey === 'library' || M.themeKey === 'ice';
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const c = M.grid[ty][tx], px = tx * T, py = ty * T;
      if (special && drawSpecialTile(ctx, c, tx, ty, px, py)) continue;
      if (c === '#') {
        ctx.fillStyle = th.solid; ctx.fillRect(px, py, T, T);
        const above = cell(tx, ty - 1);
        if (above !== '#') { ctx.fillStyle = th.solidTop; ctx.fillRect(px, py, T, M.themeKey === 'forest' ? 7 : 5); if (M.themeKey === 'forest') { ctx.fillStyle = '#2c4426'; for (let k = 0; k < 4; k++) ctx.fillRect(px + k * 8 + 2, py - 3 + (k % 2), 2, 4); } }
        ctx.fillStyle = th.solidDark;
        if (M.themeKey === 'house') { if (((tx + ty * 3) % 4) === 0) ctx.fillRect(px, py + 14, T, 2); ctx.fillRect(px + ((ty % 2) ? 0 : 16), py + 6, 1.5, T - 6); }
        else if (M.themeKey === 'market') { ctx.fillRect(px, py + T - 1, T, 1); ctx.fillRect(px + T - 1, py, 1, T); }
        else if (((tx * 7 + ty * 13) % 5) === 0) { ctx.beginPath(); ctx.arc(px + 10, py + 18, 3, 0, 7); ctx.fill(); }
      } else if (c === '=') {
        ctx.fillStyle = th.ledge; ctx.fillRect(px, py, T, 7);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(px, py + 5, T, 2);
        if (M.themeKey === 'market') { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(px + 3, py + 7, 2, 10); ctx.fillRect(px + T - 5, py + 7, 2, 10); }
      }
      if (c === '|' || (c === '=' && cell(tx, ty + 1) === '|')) {
        ctx.fillStyle = th.ladder; ctx.fillRect(px + 6, py, 3, T); ctx.fillRect(px + T - 9, py, 3, T);
        for (let k = 0; k < 3; k++) ctx.fillRect(px + 6, py + 5 + k * 10, T - 12, 3);
      }
    }
    // breaker / generator
    if (M.breaker) {
      const b = M.breaker;
      ctx.fillStyle = '#4a4f55'; rr(ctx, b.x - 10, b.y - 13, 20, 26, 3); ctx.fill();
      ctx.fillStyle = '#2b2f33'; ctx.fillRect(b.x - 6, b.y - 8, 12, 14);
      ctx.fillStyle = '#c9ccd1'; ctx.fillRect(b.x - 2, G.power ? b.y - 7 : b.y, 4, 6);
      ctx.fillStyle = G.power ? '#56e39f' : (Math.sin(t * 10) > 0 ? '#ff3b3b' : '#5a1010'); ctx.beginPath(); ctx.arc(b.x + 6, b.y - 10, 1.8, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffd43b'; ctx.font = '700 8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('⚡', b.x - 5, b.y - 8);
    }
    // lamp fixtures
    for (const l of M.lamps) drawLamp(ctx, l, lampOn(l));
    for (const f of M.fires) drawFire(ctx, f, t);
    // trampolines & secret bookcases
    for (const pd of M.pads) drawPad(ctx, pd);
    M.portals.forEach((po) => drawPortal(ctx, po));
    // hiding spots
    M.hides.forEach((h, i) => drawHide(ctx, h, i, W.me));
    // food
    for (const f of M.foods) if (f.kind) {
      ctx.fillStyle = 'rgba(255,255,220,0.10)'; ctx.beginPath(); ctx.ellipse(f.x, f.y + 11, 12, 3, 0, 0, 7); ctx.fill();
      C.drawFood(ctx, f.kind, f.x, f.y, t);
      if (Math.sin(t * 3 + f.x) > 0.8) { ctx.fillStyle = '#fff'; starPath(ctx, f.x + 8, f.y - 8, 2.2, t); ctx.fill(); }
    }
    // peels
    for (const pe of G.peels) {
      ctx.save(); ctx.translate(pe.x, pe.y - 2);
      ctx.fillStyle = '#ff9a1f'; ctx.beginPath(); ctx.ellipse(-3, 0, 5, 2, 0.3, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(3, -0.5, 4.5, 1.8, -0.4, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffd88a'; ctx.beginPath(); ctx.ellipse(-3, -0.4, 3, 0.9, 0.3, 0, 7); ctx.fill();
      ctx.restore();
    }
    // traps: the owner always knows; the other only spots it up close
    for (const tp of G.traps) {
      const mine = tp.owner === W.me.char, d = Math.hypot(cx(W.me) - tp.x, W.me.y + PH - tp.y);
      const a = mine ? 0.9 : d < 64 ? (1 - d / 64) * 0.9 : 0;
      if (a <= 0.02) continue;
      ctx.globalAlpha = a; drawTrap(ctx, tp.x, tp.y, tp.arm > 0); ctx.globalAlpha = 1;
    }
    // the decoy
    if (G.decoy) {
      const d = G.decoy, fake = makePlayer('girl');
      Object.assign(fake, { x: d.x, y: d.y, face: d.face, grounded: true, blinkT: Math.sin(t * 1.3) > 0.95 ? -0.05 : 1, local: false });
      const vis = clamp((lightAt(d.x + PW / 2, d.y + PH / 2, W.L) - 0.12) / 0.3, 0, 1);
      if (vis > 0.01) { ctx.globalAlpha = vis * (W.me.char === 'girl' ? 0.55 : 1); C.draw(ctx, fake, t); ctx.globalAlpha = 1; }
    }
    if (G.mat) drawMat(ctx, G.mat);
    for (const pr of G.projs) C.drawSlipper(ctx, pr.x, pr.y, pr.rot);
  }
  // =====================================================================
  //  Arena art: Moonlight Fair, Last Stop Metro, Whispering Library, Frozen Lake
  // =====================================================================
  const hash = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
  function bgStars(ctx, v, n, top) {
    for (let i = 0; i < n; i++) {
      const sx = ((i * 137.5) % 1000) / 1000 * v.w, sy = ((i * 71.3) % 500) / 500 * v.h * top;
      ctx.fillStyle = `rgba(255,255,255,${0.2 + 0.3 * Math.abs(Math.sin(G.t + i))})`; ctx.fillRect(sx, sy, 1.5 * G.dpr, 1.5 * G.dpr);
    }
  }
  function tri(ctx, ax, ay, bx, by, qx, qy) { ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(qx, qy); ctx.closePath(); ctx.fill(); }
  function ladderTile(ctx, px, py) {
    ctx.fillStyle = G.M.theme.ladder; ctx.fillRect(px + 6, py, 3, T); ctx.fillRect(px + T - 9, py, 3, T);
    for (let k = 0; k < 3; k++) ctx.fillRect(px + 6, py + 5 + k * 10, T - 12, 3);
  }

  // ---------- backgrounds ----------
  function drawFairBg(W) {
    const { ctx, v, cam, z } = W, t = G.t;
    bgStars(ctx, v, 50, 0.45);
    // the big wheel, still turning with nobody on it
    const wx = v.w * 0.55 - cam.x * z * 0.12, wy = v.h * 0.38 - cam.y * z * 0.06, R = 130 * z, rot = t * 0.12;
    ctx.strokeStyle = '#2b1834'; ctx.lineWidth = 4 * z;
    ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx - R * 0.62, v.h); ctx.moveTo(wx, wy); ctx.lineTo(wx + R * 0.62, v.h); ctx.stroke();
    ctx.lineWidth = 2 * z;
    ctx.beginPath(); ctx.arc(wx, wy, R, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(wx, wy, R * 0.86, 0, 7); ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 12; i++) { const a = rot + i / 12 * Math.PI * 2; ctx.moveTo(wx, wy); ctx.lineTo(wx + Math.cos(a) * R, wy + Math.sin(a) * R); }
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = rot + i / 12 * Math.PI * 2, gx = wx + Math.cos(a) * R, gy = wy + Math.sin(a) * R;
      ctx.fillStyle = '#24142c'; rr(ctx, gx - 7 * z, gy + 2 * z, 14 * z, 10 * z, 3 * z); ctx.fill();
      ctx.fillStyle = 'rgba(255,170,220,0.12)'; ctx.fillRect(gx - 5 * z, gy + 4 * z, 10 * z, 3 * z);
    }
    for (let i = 0; i < 36; i++) {
      const a = rot + i / 36 * Math.PI * 2, on = (Math.floor(t * 6) + i) % 4 === 0;
      ctx.fillStyle = on ? 'rgba(255,220,120,0.9)' : 'rgba(255,120,190,0.35)';
      ctx.beginPath(); ctx.arc(wx + Math.cos(a) * R, wy + Math.sin(a) * R, (on ? 2.2 : 1.4) * z, 0, 7); ctx.fill();
    }
    ctx.fillStyle = '#3a2044'; ctx.beginPath(); ctx.arc(wx, wy, 6 * z, 0, 7); ctx.fill();
    // circus big tops further forward
    for (let i = 0; i < 5; i++) {
      const tx = ((i * 520 + 160) - cam.x * 0.3) * z, base = v.h * 0.8 - cam.y * z * 0.1, h = (90 + (i % 2) * 30) * z, w = (120 + (i % 3) * 24) * z;
      if (tx < -w || tx > v.w + w) continue;
      for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#2a1230' : '#3d1530'; tri(ctx, tx, base - h, tx - w / 2 + k * w / 6, base, tx - w / 2 + (k + 1) * w / 6, base); }
      ctx.fillStyle = '#1a0c1e'; ctx.fillRect(tx - w / 2, base, w, v.h - base);
      ctx.strokeStyle = '#4a2040'; ctx.lineWidth = 1.5 * z; ctx.beginPath(); ctx.moveTo(tx, base - h); ctx.lineTo(tx, base - h - 16 * z); ctx.stroke();
      ctx.fillStyle = '#c23a4a'; tri(ctx, tx, base - h - 16 * z, tx + 11 * z, base - h - 12 * z + Math.sin(t * 3 + i) * 2 * z, tx, base - h - 8 * z);
    }
    const g = ctx.createLinearGradient(0, v.h * 0.6, 0, v.h); g.addColorStop(0, 'rgba(70,20,70,0)'); g.addColorStop(1, 'rgba(70,20,70,0.35)');
    ctx.fillStyle = g; ctx.fillRect(0, v.h * 0.6, v.w, v.h * 0.4);
  }
  function drawMetroBg(W) {
    const { ctx, v, cam, z } = W, M = G.M, th = M.theme, par = 0.92;
    const X = (wx) => (wx - cam.x * par) * z, Y = (wy) => (wy - cam.y * par) * z;
    ctx.fillStyle = th.wall; ctx.fillRect(0, 0, v.w, v.h);
    // small white wall tiles, grimy
    const step = 12 * z, offx = -(cam.x * z * par) % step, offy = -(cam.y * z * par) % step;
    ctx.strokeStyle = th.wallLine; ctx.lineWidth = Math.max(1, z * 0.6); ctx.beginPath();
    for (let x = offx; x < v.w; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, v.h); }
    for (let y = offy; y < v.h; y += step) { ctx.moveTo(0, y); ctx.lineTo(v.w, y); }
    ctx.stroke();
    // line-colour stripes on each level
    ctx.fillStyle = 'rgba(200,50,50,0.35)'; ctx.fillRect(0, Y(13.4 * T), v.w, 5 * z);
    ctx.fillStyle = 'rgba(50,120,210,0.35)'; ctx.fillRect(0, Y(6.4 * T), v.w, 5 * z);
    // under the platform edge: the dark track wall with cables
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, Y(15 * T), v.w, Y(19 * T) - Y(15 * T));
    ctx.strokeStyle = 'rgba(30,30,30,0.9)'; ctx.lineWidth = 2 * z;
    for (const k of [16.4, 16.7]) { ctx.beginPath(); for (let x = 0; x <= v.w; x += 30 * z) ctx.lineTo(x, Y(k * T) + Math.sin((x / z + cam.x * par) * 0.02) * 3 * z); ctx.stroke(); }
    // station name signs, line maps & lightbox ads
    const fs = Math.round(7.5 * z);
    for (let i = 0; i < 5; i++) {
      const sx = X((i * 16 + 6) * T);
      if (sx < -120 * z || sx > v.w + 60 * z) continue;
      ctx.fillStyle = '#123066'; ctx.fillRect(sx, Y(10.2 * T), 74 * z, 15 * z);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(sx, Y(10.2 * T), 74 * z, 1.2 * z);
      ctx.font = `800 ${fs}px Barlow, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(tr('metro.sign'), sx + 37 * z, Y(10.2 * T) + 8 * z);
      // the line map
      const mx = sx + 120 * z, my = Y(11.2 * T);
      ctx.fillStyle = 'rgba(225,225,215,0.18)'; ctx.fillRect(mx, my, 46 * z, 28 * z);
      ctx.lineWidth = 1.5 * z;
      ctx.strokeStyle = 'rgba(220,60,60,0.6)'; ctx.beginPath(); ctx.moveTo(mx + 4 * z, my + 20 * z); ctx.lineTo(mx + 20 * z, my + 10 * z); ctx.lineTo(mx + 42 * z, my + 12 * z); ctx.stroke();
      ctx.strokeStyle = 'rgba(60,140,230,0.6)'; ctx.beginPath(); ctx.moveTo(mx + 8 * z, my + 4 * z); ctx.lineTo(mx + 22 * z, my + 16 * z); ctx.lineTo(mx + 40 * z, my + 24 * z); ctx.stroke();
      // ad up in the concourse
      const ax = sx + 40 * z, ay = Y(2.2 * T);
      const lit = G.power ? 0.22 : 0.06;
      ctx.fillStyle = `rgba(255,220,170,${lit})`; ctx.fillRect(ax, ay, 60 * z, 34 * z);
      ctx.strokeStyle = 'rgba(160,170,180,0.5)'; ctx.lineWidth = 2 * z; ctx.strokeRect(ax, ay, 60 * z, 34 * z);
      ctx.font = `${Math.round(16 * z)}px sans-serif`; ctx.globalAlpha = G.power ? 0.85 : 0.3;
      ctx.fillText(['🍵', '🥙', '🍊', '🥪', '💋'][i], ax + 30 * z, ay + 18 * z); ctx.globalAlpha = 1;
    }
  }
  let libShelf = null;
  function libShelfCanvas() {
    if (libShelf) return libShelf;
    const c = document.createElement('canvas'); c.width = 128; c.height = 96;
    const x = c.getContext('2d'), cols = ['#4a1e1a', '#1e3a2a', '#2a2a4a', '#5a4020', '#3a1830', '#24343a', '#4a3a1a'];
    x.fillStyle = '#160d08'; x.fillRect(0, 0, 128, 96);
    for (let row = 0; row < 3; row++) {
      const y0 = row * 32;
      let bx = 3;
      while (bx < 122) {
        const w = 3 + Math.floor(hash(bx, row) * 4), h = 15 + Math.floor(hash(row, bx) * 11);
        const lean = hash(bx * 7, row) < 0.06;
        x.fillStyle = cols[Math.floor(hash(bx * 3, row * 7) * cols.length)];
        if (lean) { x.save(); x.translate(bx, y0 + 28); x.rotate(-0.35); x.fillRect(0, -h, w, h); x.restore(); bx += w + 5; continue; }
        x.fillRect(bx, y0 + 28 - h, w, h);
        x.fillStyle = 'rgba(255,210,140,0.14)'; x.fillRect(bx, y0 + 28 - h + 3, w, 1); x.fillRect(bx, y0 + 28 - 5, w, 1);
        bx += w + (hash(bx, row + 9) < 0.12 ? 5 : 1);
      }
      x.fillStyle = '#2e1d12'; x.fillRect(0, y0 + 28, 128, 4);
    }
    x.fillStyle = '#2a1a10'; x.fillRect(0, 0, 3, 96); x.fillRect(125, 0, 3, 96);
    libShelf = c; return c;
  }
  function drawLibraryBg(W) {
    const { ctx, v, cam, z } = W, M = G.M, par = 0.9, t = G.t;
    ctx.fillStyle = M.theme.wall; ctx.fillRect(0, 0, v.w, v.h);
    const shelf = libShelfCanvas(), colW = 160;
    const i0 = Math.floor(cam.x * par / colW) - 1, i1 = i0 + Math.ceil(W.vw / colW) + 3;
    const j0 = Math.floor(cam.y * par / 96) - 1, j1 = j0 + Math.ceil(W.vh / 96) + 3;
    for (let i = i0; i <= i1; i++) {
      const sx = (i * colW - cam.x * par) * z;
      if (((i % 4) + 4) % 4 === 1) {
        // tall arched stained-glass windows with moonlight
        for (let j = Math.floor(j0 / 2) - 1; j <= j1 / 2 + 1; j++) {
          const wy = (j * 192 + 30 - cam.y * par) * z, ww = 70 * z, wh = 120 * z, wx = sx + (colW - 70) / 2 * z;
          const g = ctx.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, '#1c2c4a'); g.addColorStop(1, '#0d1626');
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx, wy + ww / 2); ctx.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0); ctx.lineTo(wx + ww, wy + wh); ctx.closePath(); ctx.fill();
          const panes = ['rgba(200,60,60,0.22)', 'rgba(60,120,200,0.22)', 'rgba(220,180,60,0.2)', 'rgba(80,170,110,0.2)'];
          for (let k = 0; k < 8; k++) { ctx.fillStyle = panes[(k + i + j) % 4]; ctx.fillRect(wx + (k % 2) * ww / 2 + 2 * z, wy + ww / 2 + Math.floor(k / 2) * (wh - ww / 2) / 4 + 2 * z, ww / 2 - 4 * z, (wh - ww / 2) / 4 - 4 * z); }
          ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 3 * z; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.stroke();
          ctx.fillStyle = `rgba(200,220,255,${0.05 + Math.sin(t * 0.5 + j) * 0.01})`; tri(ctx, wx, wy + wh, wx + ww, wy + wh, wx + ww * 1.6, wy + wh * 2);
        }
      } else {
        for (let j = j0; j <= j1; j++) ctx.drawImage(shelf, sx, (j * 96 - cam.y * par) * z, 128 * z, 96 * z);
      }
      ctx.fillStyle = '#24160e'; ctx.fillRect(sx + 128 * z, 0, 32 * z, v.h);
      ctx.fillStyle = 'rgba(255,200,130,0.05)'; ctx.fillRect(sx + 130 * z, 0, 3 * z, v.h);
    }
    ctx.fillStyle = 'rgba(10,5,3,0.35)'; ctx.fillRect(0, 0, v.w, v.h);
  }
  function drawIceBg(W) {
    const { ctx, v, cam, z } = W, t = G.t, d = G.dpr;
    bgStars(ctx, v, 80, 0.6);
    // the aurora
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const cw = 6 * d;
    for (let b = 0; b < 3; b++) {
      const base = v.h * (0.17 + b * 0.07), col = b === 1 ? '120,255,190' : b === 2 ? '170,120,255' : '90,220,255';
      for (let x = 0; x < v.w; x += cw) {
        const wx = x / z + cam.x * 0.08;
        const y = base + Math.sin(wx * 0.006 + t * 0.35 + b) * 30 * z + Math.sin(wx * 0.017 - t * 0.6) * 10 * z;
        const h = (36 + Math.sin(wx * 0.01 + t * 0.8 + b * 2) * 22) * z;
        const a = 0.035 + 0.03 * Math.sin(wx * 0.03 + t * 1.1 + b);
        ctx.fillStyle = `rgba(${col},${a})`; ctx.fillRect(x, y - h, cw, h);
        ctx.fillStyle = `rgba(${col},${a * 2})`; ctx.fillRect(x, y - 5 * z, cw, 5 * z);
      }
    }
    ctx.restore();
    // moon
    const mx = v.w * 0.2 - cam.x * z * 0.04, my = v.h * 0.12;
    const mg = ctx.createRadialGradient(mx, my, 0, mx, my, 70 * z); mg.addColorStop(0, 'rgba(220,240,255,0.25)'); mg.addColorStop(1, 'rgba(220,240,255,0)');
    ctx.fillStyle = mg; ctx.fillRect(mx - 70 * z, my - 70 * z, 140 * z, 140 * z);
    ctx.fillStyle = '#eef6ff'; ctx.beginPath(); ctx.arc(mx, my, 12 * z, 0, 7); ctx.fill();
    // snowy mountains
    for (let layer = 0; layer < 2; layer++) {
      const par = layer ? 0.3 : 0.15, base = v.h * (layer ? 0.74 : 0.62), sp = (layer ? 150 : 220) * z;
      const off = -(cam.x * z * par) % sp;
      for (let x = off - sp; x < v.w + sp; x += sp) {
        const k = Math.floor((x - off) / sp + cam.x * z * par / sp), h = (60 + hash(k, layer) * 70) * z * (layer ? 0.8 : 1), w = sp * 0.9;
        ctx.fillStyle = layer ? '#0b1824' : '#0e1e2e'; tri(ctx, x, base - h, x - w, base + 4 * z, x + w, base + 4 * z);
        ctx.fillStyle = layer ? 'rgba(200,225,245,0.45)' : 'rgba(200,225,245,0.3)'; tri(ctx, x, base - h, x - w * 0.28, base - h * 0.72, x + w * 0.28, base - h * 0.72);
      }
      ctx.fillStyle = layer ? '#0b1824' : '#0e1e2e'; ctx.fillRect(0, base, v.w, v.h - base);
    }
  }
  function drawPine(ctx, tr0) {
    const x = tr0.x, base = tr0.base, h = base - tr0.top;
    ctx.fillStyle = '#20150e'; ctx.fillRect(x - 5, base - 40, 10, 40);
    for (let i = 0; i < 4; i++) {
      const y = base - 26 - i * (h - 50) / 4, w = 54 - i * 10, th = (h - 30) / 3.4;
      ctx.fillStyle = '#0e2230'; tri(ctx, x, y - th, x - w, y, x + w, y);
      ctx.fillStyle = 'rgba(220,240,255,0.85)'; tri(ctx, x, y - th, x - w * 0.36, y - th * 0.62, x + w * 0.36, y - th * 0.62);
      ctx.fillStyle = 'rgba(220,240,255,0.55)'; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(x + k * w * 0.36, y - 2, w * 0.16, 2.5, 0, 0, 7); ctx.fill(); }
    }
  }

  // ---------- decor drawn behind the tiles ----------
  function drawArenaBack(W, x0, x1, y0, y1) {
    const { ctx } = W, M = G.M, key = M.themeKey, t = G.t;
    if (key === 'fair') {
      for (let ty = Math.max(1, y0); ty <= Math.min(8, y1); ty++) for (let tx = x0; tx <= x1; tx++) {
        if (M.grid[ty][tx] !== '=' || tx % 3) continue;
        // coaster lattice down to the ground
        const sx = tx * T + 16, gy = groundY(sx, ty * T + T);
        ctx.strokeStyle = 'rgba(70,40,60,0.9)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(sx, ty * T + 7); ctx.lineTo(sx, gy); ctx.stroke();
        ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(70,40,60,0.6)';
        ctx.beginPath(); for (let y = ty * T + 7; y < gy - 30; y += 40) { ctx.moveTo(sx, y); ctx.lineTo(sx + 48, y + 40); ctx.moveTo(sx + 48, y); ctx.lineTo(sx, y + 40); } ctx.stroke();
      }
      for (let tx = x0; tx <= x1; tx++) {
        if (cell(tx, 16) !== '=') continue;
        // a game booth under each striped roof
        const px = tx * T, top = 16 * T + 7, bot = 21 * T;
        ctx.fillStyle = tx % 2 ? '#4a1828' : '#5e2234'; ctx.fillRect(px, top, T, bot - top);
        ctx.fillStyle = '#3a2418'; ctx.fillRect(px, bot - 14, T, 14);
        ctx.fillStyle = '#5a3a24'; ctx.fillRect(px, bot - 14, T, 3);
        if (tx % 2 === 0) {
          // hanging prize teddy
          const bx = px + 16, by = top + 22 + Math.sin(t * 2 + tx) * 1.5;
          ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(bx, top); ctx.lineTo(bx, by - 6); ctx.stroke();
          ctx.fillStyle = ['#d98a4a', '#ff9ec4', '#8fb8ff'][tx % 3];
          ctx.beginPath(); ctx.arc(bx, by, 5, 0, 7); ctx.arc(bx - 4, by - 4, 2, 0, 7); ctx.arc(bx + 4, by - 4, 2, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.ellipse(bx, by + 8, 5, 5, 0, 0, 7); ctx.fill();
          ctx.fillStyle = '#1a0f0a'; ctx.fillRect(bx - 2, by - 1, 1, 1); ctx.fillRect(bx + 1, by - 1, 1, 1);
        } else {
          // bottles to knock over
          for (let k = 0; k < 3; k++) { ctx.fillStyle = ['#7fd6ff', '#9ad27f', '#ffd43b'][k]; ctx.fillRect(px + 6 + k * 8, bot - 24, 4, 10); ctx.fillRect(px + 7 + k * 8, bot - 27, 2, 3); }
        }
      }
      if (M.carousel) drawCarousel(ctx, M.carousel, t);
    } else if (key === 'metro') {
      const R = M.rail;
      // tunnel mouths swallow the light at both ends
      for (const [ax, dir] of [[T, 1], [(M.W - 1) * T, -1]]) {
        const g = ctx.createLinearGradient(ax, 0, ax + dir * 5 * T, 0); g.addColorStop(0, 'rgba(0,0,0,0.95)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(Math.min(ax, ax + dir * 5 * T), R.top - T, 5 * T, R.bottom - R.top + T);
        // signal post
        const sx = ax + dir * 1.5 * T, warn = G.train && G.train.phase === 'warn', on = Math.sin(t * 14) > 0;
        ctx.fillStyle = '#22272b'; ctx.fillRect(sx - 2, R.top + 10, 4, R.bottom - R.top - 10);
        ctx.fillStyle = '#111416'; rr(ctx, sx - 6, R.top + 2, 12, 20, 3); ctx.fill();
        ctx.fillStyle = warn && on ? '#ff3b3b' : '#4a1010'; ctx.beginPath(); ctx.arc(sx, R.top + 8, 3, 0, 7); ctx.fill();
        ctx.fillStyle = !warn && !(G.train && G.train.phase === 'pass') ? '#3cff8a' : '#0f3a20'; ctx.beginPath(); ctx.arc(sx, R.top + 16, 3, 0, 7); ctx.fill();
      }
      // pillars between platform and concourse
      for (let tx = 3; tx < M.W - 2; tx += 11) {
        if (tx < x0 - 1 || tx > x1 + 1) continue;
        ctx.fillStyle = '#2a3236'; ctx.fillRect(tx * T + 8, 9 * T, 16, 6 * T);
        ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(tx * T + 10, 9 * T, 3, 6 * T);
      }
    } else if (key === 'library') {
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
        if (cell(tx, ty) !== '=' || ty === 4) continue;
        // the ledge is the top of a low bookshelf
        const px = tx * T, gy = groundY(px + 16, ty * T + T);
        ctx.fillStyle = '#2a1a10'; ctx.fillRect(px, ty * T + 7, T, gy - ty * T - 7);
        for (let y = ty * T + 9; y < gy - 8; y += 16) {
          for (let k = 0; k < 6; k++) { ctx.fillStyle = ['#4a1e1a', '#1e3a2a', '#2a2a4a', '#5a4020'][(tx + k + y) % 4]; ctx.fillRect(px + 2 + k * 5, y + 2 + (k % 3), 4, 12 - (k % 3)); }
          ctx.fillStyle = '#3b2618'; ctx.fillRect(px, y + 14, T, 2);
        }
      }
      // the gallery railing
      for (let tx = x0; tx <= x1; tx++) {
        if (cell(tx, 4) !== '=') continue;
        const px = tx * T, py = 4 * T;
        ctx.fillStyle = '#5a3a20';
        for (let k = 0; k < 4; k++) ctx.fillRect(px + 3 + k * 8, py - 14, 2, 14);
        ctx.fillStyle = '#7a5530'; ctx.fillRect(px, py - 16, T, 3);
      }
    } else if (key === 'ice') {
      // fishing hut on the island
      const hx = 32 * T, hy = 13 * T + 7, hw = 7 * T, hh = 4 * T - 7;
      ctx.fillStyle = '#3a2a1e'; ctx.fillRect(hx, hy, hw, hh);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = hy + 10; y < hy + hh; y += 10) ctx.fillRect(hx, y, hw, 1.5);
      ctx.fillStyle = '#1a120c'; ctx.fillRect(hx + hw - 40, hy + hh - 40, 22, 40);
      ctx.fillStyle = G.power ? 'rgba(255,180,90,0.7)' : 'rgba(120,80,40,0.5)'; ctx.fillRect(hx + 20, hy + 20, 22, 16);
      ctx.fillStyle = '#2a1a10'; ctx.fillRect(hx + 30, hy + 20, 2, 16); ctx.fillRect(hx + 20, hy + 27, 22, 2);
      // "thin ice" signs
      for (const sx of [18.6 * T, 55.4 * T]) {
        ctx.fillStyle = '#4a3828'; ctx.fillRect(sx - 1.5, 15 * T - 26, 3, 26);
        ctx.fillStyle = '#ffd43b'; ctx.beginPath(); ctx.moveTo(sx, 15 * T - 44); ctx.lineTo(sx + 10, 15 * T - 26); ctx.lineTo(sx - 10, 15 * T - 26); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#1a1208'; ctx.font = '900 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', sx, 15 * T - 31);
      }
    }
  }
  function drawCarousel(ctx, c, t) {
    const x = c.x, top = c.top, base = c.base, R = 96;
    // canopy band with bulbs
    for (let k = 0; k < 14; k++) { ctx.fillStyle = k % 2 ? '#f1e6d2' : '#c23a4a'; ctx.fillRect(x - R - 16 + k * (R * 2 + 32) / 14, top - 25, (R * 2 + 32) / 14 + 0.5, 16); }
    for (let k = 0; k < 14; k++) { ctx.fillStyle = k % 2 ? '#c23a4a' : '#f1e6d2'; ctx.beginPath(); ctx.arc(x - R - 16 + (k + 0.5) * (R * 2 + 32) / 14, top - 9, (R * 2 + 32) / 28, 0, Math.PI); ctx.fill(); }
    for (let k = 0; k < 10; k++) { const on = (Math.floor(t * 5) + k) % 3 === 0 && G.power; ctx.fillStyle = on ? '#ffe7a8' : '#5a4a3a'; ctx.beginPath(); ctx.arc(x - R + k * R / 4.5, top - 17, 1.8, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#b08a4a'; ctx.fillRect(x - 3, top - 9, 6, base - top + 3);
    ctx.fillStyle = '#3a2418'; ctx.beginPath(); ctx.ellipse(x, base - 4, R + 12, 6, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#b08a4a'; ctx.lineWidth = 1.5; ctx.stroke();
    // horses go round and round, the ones at the back are darker
    const spin = G.power ? t * 0.9 : t * 0.15, horses = [];
    for (let i = 0; i < 5; i++) { const a = spin + i / 5 * Math.PI * 2; horses.push({ a, depth: Math.sin(a), i }); }
    horses.sort((a, b) => a.depth - b.depth);
    for (const h of horses) {
      const hx = x + Math.cos(h.a) * R, s = 0.75 + 0.25 * (h.depth * 0.5 + 0.5), bob = Math.sin(t * 3 + h.i * 1.7) * 5 * (G.power ? 1 : 0.2), hy = base - 34 + bob;
      ctx.strokeStyle = '#b08a4a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(hx, top - 9); ctx.lineTo(hx, base - 6); ctx.stroke();
      ctx.save(); ctx.translate(hx, hy); ctx.scale((-Math.sin(h.a) > 0 ? 1 : -1) * s, s);
      ctx.globalAlpha = 0.55 + 0.45 * (h.depth * 0.5 + 0.5);
      const col = ['#f1e6d2', '#ffb3d1', '#c9b8ff', '#9be7ff', '#ffe066'][h.i];
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, 11, 5.5, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(7, -3); ctx.lineTo(12, -12); ctx.lineTo(17, -10); ctx.lineTo(13, -4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-7, 3); ctx.lineTo(-11, 11); ctx.moveTo(-3, 4); ctx.lineTo(-4, 12); ctx.moveTo(5, 4); ctx.lineTo(9, 10); ctx.moveTo(8, 3); ctx.lineTo(13, 8); ctx.stroke();
      ctx.fillStyle = '#c23a4a'; ctx.fillRect(-4, -6, 7, 3);
      ctx.fillStyle = '#6a3a5e'; ctx.beginPath(); ctx.moveTo(-11, -1); ctx.quadraticCurveTo(-17, 2, -15, 8); ctx.lineTo(-11, 2); ctx.fill();
      ctx.fillStyle = '#1a0f0a'; ctx.fillRect(13, -10, 1.5, 1.5);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  // ---------- tiles with a local flavour ----------
  function drawSpecialTile(ctx, c, tx, ty, px, py) {
    const M = G.M, key = M.themeKey, th = M.theme, open = cell(tx, ty - 1) !== '#', t = G.t;
    const ladderTop = c === '=' && cell(tx, ty + 1) === '|';
    if (c === '#') {
      if (key === 'fair') {
        ctx.fillStyle = th.solid; ctx.fillRect(px, py, T, T);
        if (open) { ctx.fillStyle = '#7a4a30'; ctx.fillRect(px, py, T, 6); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(px + (tx % 2 ? 15 : 7), py, 1.2, 6); ctx.fillRect(px, py + 6, T, 1.5); }
        else if (hash(tx, ty) < 0.25) { ctx.fillStyle = th.solidDark; ctx.beginPath(); ctx.arc(px + 9 + hash(ty, tx) * 14, py + 14, 2.5, 0, 7); ctx.fill(); }
      } else if (key === 'metro') {
        ctx.fillStyle = th.solid; ctx.fillRect(px, py, T, T);
        ctx.fillStyle = th.solidDark; ctx.fillRect(px, py + T - 1, T, 1); ctx.fillRect(px + T - 1, py, 1, T);
        if (open && ty === 15) {
          ctx.fillStyle = '#8a9298'; ctx.fillRect(px, py, T, 5);
          ctx.fillStyle = '#e8c23a'; ctx.fillRect(px, py + 1, T, 2.5);
          ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let k = 0; k < 4; k++) ctx.fillRect(px + 3 + k * 8, py + 1.5, 1.5, 1.5);
        } else if (open && ty === 19) {
          ctx.fillStyle = '#3a3430'; ctx.fillRect(px, py, T, 8);
          ctx.fillStyle = 'rgba(120,110,100,0.5)'; for (let k = 0; k < 6; k++) ctx.fillRect(px + hash(tx, k) * 30, py + 2 + hash(k, tx) * 5, 2, 1.5);
          ctx.fillStyle = '#4a2e1e'; ctx.fillRect(px + 2, py - 2, 10, 3); ctx.fillRect(px + 18, py - 2, 10, 3);
          ctx.fillStyle = '#7f888e'; ctx.fillRect(px, py - 4, T, 3); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(px, py - 4, T, 1);
        } else if (open) {
          ctx.fillStyle = th.solidTop; ctx.fillRect(px, py, T, 5);
          ctx.fillStyle = (tx % 2) ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.12)'; ctx.fillRect(px, py, T, 5);
        }
      } else if (key === 'library') {
        ctx.fillStyle = th.solid; ctx.fillRect(px, py, T, T);
        ctx.fillStyle = th.solidDark; if (((tx + ty) % 3) === 0) ctx.fillRect(px, py + 18, T, 1.5); ctx.fillRect(px + ((ty % 2) ? 4 : 20), py + 7, 1.5, T - 7);
        if (open) { ctx.fillStyle = th.solidTop; ctx.fillRect(px, py, T, 5); ctx.fillStyle = '#c9a35c'; ctx.fillRect(px, py + 5, T, 1); ctx.fillStyle = 'rgba(255,220,150,0.12)'; ctx.fillRect(px + (tx % 4) * 8, py + 1.5, 3, 2); }
      } else {
        const thn = M.thinAt && M.thinAt[ty * M.W + tx];
        if (thn) {
          ctx.fillStyle = 'rgba(140,200,235,0.55)'; ctx.fillRect(px, py, T, T * 0.55);
          ctx.fillStyle = '#e9f7ff'; ctx.fillRect(px, py, T, 2.5);
          ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(px + 4 + (tx % 3) * 6, py + 5, 8, 1);
          if (thn.crack > 0.05) {
            // cracks spread as the ice gives way
            const k = thn.crack, cx0 = px + 16, cy0 = py + 3;
            ctx.strokeStyle = `rgba(255,255,255,${0.5 + k * 0.5})`; ctx.lineWidth = 0.9; ctx.beginPath();
            for (let i = 0; i < 5; i++) { const a = hash(tx, i) * Math.PI - Math.PI, L = (8 + hash(i, tx) * 12) * k; ctx.moveTo(cx0, cy0); ctx.lineTo(cx0 + Math.cos(a) * L * 0.6, cy0 + 4 + Math.abs(Math.sin(a)) * L * 0.4); ctx.lineTo(cx0 + Math.cos(a + 0.3) * L, cy0 + 2 + Math.abs(Math.sin(a + 0.3)) * L * 0.6); }
            ctx.stroke();
            if (k > 0.7 && Math.sin(t * 30) > 0) { ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(px, py, T, 4); }
          }
        } else if (ty === 17 && tx > 17 && tx < 56) {
          ctx.fillStyle = '#9fcfe9'; ctx.fillRect(px, py, T, T);
          ctx.fillStyle = '#eaf8ff'; ctx.fillRect(px, py, T, 4);
          ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(px + 6, py + 10, 12, 1.5);
        } else {
          ctx.fillStyle = th.solid; ctx.fillRect(px, py, T, T);
          if (hash(tx, ty) < 0.3) { ctx.fillStyle = th.solidDark; ctx.beginPath(); ctx.arc(px + 8 + hash(ty, tx) * 16, py + 16, 3, 0, 7); ctx.fill(); }
          if (open) {
            ctx.fillStyle = '#eef8ff'; ctx.fillRect(px, py, T, 6);
            ctx.beginPath(); for (let k = 0; k < 3; k++) ctx.arc(px + 5 + k * 11, py + 6, 3 + hash(tx, k) * 2, 0, Math.PI); ctx.fill();
            ctx.fillStyle = 'rgba(160,200,230,0.5)'; ctx.fillRect(px, py + 5, T, 1);
          }
        }
      }
      return true;
    }
    if (c === '=') {
      if (key === 'fair') {
        if (ty <= 8) {
          // roller coaster track
          ctx.fillStyle = '#5a2e3a'; for (let k = 0; k < 4; k++) ctx.fillRect(px + k * 8 + 1, py + 1, 4, 6);
          ctx.fillStyle = '#9a9aa8'; ctx.fillRect(px, py, T, 2); ctx.fillRect(px, py + 5, T, 1.5);
        } else {
          // striped booth awning
          for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? th.ledge2 : th.ledge; ctx.fillRect(px + k * 8, py, 8, 7); }
          for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? th.ledge2 : th.ledge; ctx.beginPath(); ctx.arc(px + k * 8 + 4, py + 7, 4, 0, Math.PI); ctx.fill(); }
        }
      } else if (key === 'metro') {
        if (ty === 15) {
          ctx.fillStyle = '#1a1e21'; ctx.fillRect(px, py, T, 6);
          ctx.fillStyle = '#6a7378'; for (let k = 0; k < 8; k++) ctx.fillRect(px + k * 4, py, 2, 6);
          ctx.fillStyle = '#e8c23a'; ctx.fillRect(px, py, T, 1.5);
        } else if (ty === 13) {
          ctx.fillStyle = '#4a6a8a'; ctx.fillRect(px, py, T, 5); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(px, py, T, 1);
          ctx.fillStyle = '#2a3236'; if (cell(tx - 1, ty) !== '=') ctx.fillRect(px + 3, py + 5, 3, 2 * T - 5); if (cell(tx + 1, ty) !== '=') ctx.fillRect(px + T - 6, py + 5, 3, 2 * T - 5);
        } else {
          ctx.fillStyle = '#3a4448'; ctx.fillRect(px, py, T, 6); ctx.fillStyle = '#5a666c'; ctx.fillRect(px, py, T, 1.5);
          ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px, py + 6); ctx.lineTo(px + 16, py + 1); ctx.lineTo(px + T, py + 6); ctx.stroke();
          if (tx % 3 === 1) {
            ctx.fillStyle = '#1a7a3a'; ctx.fillRect(px - 2, py + 8, 36, 11);
            ctx.fillStyle = '#ffffff'; ctx.font = '800 7px Barlow, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(tr('metro.exit') + (tx < M.W / 2 ? ' ←' : ' →'), px + 16, py + 14);
          }
        }
      } else if (key === 'library') {
        ctx.fillStyle = th.ledge; ctx.fillRect(px, py, T, 7);
        ctx.fillStyle = '#c9a35c'; ctx.fillRect(px, py, T, 1.2);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(px, py + 5, T, 2);
        if (ty !== 4 && hash(tx, ty) < 0.35) { ctx.fillStyle = ['#7a2f2a', '#2a4a6a', '#3a5a2a'][tx % 3]; ctx.fillRect(px + 6, py - 4, 12, 4); ctx.fillStyle = '#e9dcc0'; ctx.fillRect(px + 7, py - 3, 10, 1); }
      } else {
        if (ty === 11) {
          ctx.fillStyle = '#b9e0f2'; ctx.fillRect(px, py, T, 6); ctx.fillStyle = '#f2fbff'; ctx.fillRect(px, py, T, 2);
          ctx.fillStyle = 'rgba(190,230,250,0.8)';
          for (let k = 0; k < 4; k++) { const L = 5 + hash(tx, k) * 10; tri(ctx, px + k * 8 + 1, py + 6, px + k * 8 + 7, py + 6, px + k * 8 + 4, py + 6 + L); }
        } else if (ty === 14) {
          ctx.fillStyle = '#a8d6ee'; ctx.fillRect(px, py, T, 7); ctx.fillStyle = '#eaf8ff'; ctx.fillRect(px, py, T, 2);
        } else {
          ctx.fillStyle = th.ledge; ctx.fillRect(px, py, T, 7);
          ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(px + 15, py, 1, 7);
          ctx.fillStyle = '#eef8ff'; ctx.fillRect(px, py - 2, T, 3);
        }
      }
      if (ladderTop) ladderTile(ctx, px, py);
      return true;
    }
    return false;
  }

  // ---------- trampolines & bookcases ----------
  function drawPad(ctx, pd) {
    const k = pd.t > 0 ? Math.sin((1 - pd.t / 0.35) * Math.PI) : 0, x = pd.x, y = pd.y;
    ctx.save();
    ctx.fillStyle = '#3a3a44'; ctx.fillRect(x - 13, y - 6, 2, 6); ctx.fillRect(x + 11, y - 6, 2, 6);
    ctx.fillStyle = '#16161c'; ctx.beginPath(); ctx.moveTo(x - 13, y - 7); ctx.quadraticCurveTo(x, y - 7 + k * 6, x + 13, y - 7); ctx.lineTo(x + 13, y - 5); ctx.quadraticCurveTo(x, y - 5 + k * 6, x - 13, y - 5); ctx.fill();
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#f1e6d2' : '#c23a4a'; ctx.fillRect(x - 14 + i * 4.7, y - 9, 4.7, 2.5); }
    // a zigzag spring hint
    ctx.strokeStyle = 'rgba(255,220,120,0.5)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x - 4, y - 1); ctx.lineTo(x - 2, y - 4); ctx.lineTo(x, y - 1); ctx.lineTo(x + 2, y - 4); ctx.lineTo(x + 4, y - 1); ctx.stroke();
    if (Math.sin(G.t * 3 + x) > 0.85) { ctx.fillStyle = '#ffe7a8'; starPath(ctx, x, y - 14, 2, G.t); ctx.fill(); }
    ctx.restore();
  }
  function drawPortal(ctx, po) {
    const x = po.x, y = po.y, w = 30, h = 56, k = po.swingT > 0 ? Math.sin(po.swingT / 0.6 * Math.PI) : 0;
    ctx.save();
    if (k > 0) { ctx.fillStyle = '#050302'; ctx.fillRect(x - w / 2, y - h, w, h); ctx.fillStyle = `rgba(${po.col === '#7fd6ff' ? '127,214,255' : '255,200,140'},${0.25 * k})`; ctx.fillRect(x - w / 2 + 3, y - h + 3, w - 6, h - 3); }
    // swing open on its hinge
    ctx.translate(x - w / 2, 0); ctx.scale(1 - k * 0.75, 1); ctx.translate(-(x - w / 2), 0);
    ctx.fillStyle = '#3a2414'; ctx.fillRect(x - w / 2, y - h, w, h);
    ctx.fillStyle = '#2a1a0e'; ctx.fillRect(x - w / 2 + 2, y - h + 6, w - 4, h - 8);
    for (let r = 0; r < 4; r++) {
      const sy = y - h + 8 + r * 12;
      for (let b = 0; b < 6; b++) { ctx.fillStyle = ['#5a2018', '#1e4a32', '#2a2a5a', '#6a4a1e', '#4a1a3a'][Math.floor(hash(po.x + b, r) * 5)]; const bh = 8 + hash(b, po.x + r) * 3; ctx.fillRect(x - 12 + b * 4, sy + 10 - bh, 3.4, bh); }
      ctx.fillStyle = '#4a2e18'; ctx.fillRect(x - w / 2 + 2, sy + 10, w - 4, 2);
    }
    // carved crest: the same mark sits on its twin
    ctx.fillStyle = '#5a3a1e'; ctx.fillRect(x - w / 2 - 1, y - h - 3, w + 2, 4);
    ctx.fillStyle = po.col; ctx.globalAlpha = 0.55 + Math.sin(G.t * 2 + po.pair) * 0.2;
    ctx.beginPath(); ctx.moveTo(x, y - h - 9); ctx.lineTo(x + 4, y - h - 5); ctx.lineTo(x, y - h - 1); ctx.lineTo(x - 4, y - h - 5); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
    // one book sticks out — the lever
    ctx.fillStyle = '#8a2a20'; ctx.fillRect(x + 6, y - h + 30 + (k > 0 ? 2 : 0), 4, 9);
    ctx.restore();
  }

  // ---------- drawn in front of the characters ----------
  function drawArenaFront(W) {
    const { ctx } = W, M = G.M, t = G.t;
    if (G.train && G.train.phase === 'pass') drawTrain(ctx, G.train, M.rail);
    if (M.water) {
      const w = M.water;
      const g = ctx.createLinearGradient(0, w.top, 0, w.bottom); g.addColorStop(0, 'rgba(30,90,140,0.5)'); g.addColorStop(1, 'rgba(8,24,48,0.8)');
      ctx.fillStyle = g; ctx.fillRect(w.x0, w.top, w.x1 - w.x0, w.bottom - w.top);
      ctx.strokeStyle = 'rgba(180,225,255,0.18)'; ctx.lineWidth = 1;
      ctx.beginPath(); for (let x = w.x0; x < w.x1; x += 24) { const y = w.top + 30 + Math.sin(x * 0.05 + t * 1.5) * 6; ctx.moveTo(x, y); ctx.lineTo(x + 12, y + 2); } ctx.stroke();
      // the holes: open water shimmers
      for (const th of M.thin) {
        if (!th.broken) continue;
        const px = th.tx * T, a = Math.min(1, th.broken / 1.5);
        ctx.fillStyle = `rgba(20,60,100,${0.6 * a})`; ctx.fillRect(px, th.ty * T + 6, T, T - 6);
        ctx.strokeStyle = `rgba(200,235,255,${0.5 * a})`; ctx.beginPath(); ctx.moveTo(px + 2, th.ty * T + 10 + Math.sin(t * 4 + px) * 1.5); ctx.lineTo(px + T - 2, th.ty * T + 10 + Math.sin(t * 4 + px + 2) * 1.5); ctx.stroke();
        if (th.broken < 2) { ctx.fillStyle = `rgba(230,248,255,${(2 - th.broken) / 2 * 0.7})`; ctx.fillRect(px, th.ty * T, T, 4 + (2 - th.broken) * 6); }
      }
    }
  }
  function drawTrain(ctx, tn, R) {
    const top = R.top + 6, h = R.bottom - R.top - 10, carL = TRAIN.len / 3, t = G.t;
    ctx.save();
    // speed streaks behind it
    ctx.strokeStyle = 'rgba(220,230,240,0.15)'; ctx.lineWidth = 1.5;
    const tail = tn.dir > 0 ? tn.x0 : tn.x0 + TRAIN.len;
    for (let i = 0; i < 6; i++) { const y = top + 10 + i * 13; ctx.beginPath(); ctx.moveTo(tail, y); ctx.lineTo(tail - tn.dir * (80 + i * 20), y); ctx.stroke(); }
    for (let c = 0; c < 3; c++) {
      const x = tn.x0 + c * carL + 2, w = carL - 4;
      const g = ctx.createLinearGradient(0, top, 0, top + h); g.addColorStop(0, '#d5dde2'); g.addColorStop(0.5, '#a9b3b9'); g.addColorStop(1, '#7d878d');
      ctx.fillStyle = g; rr(ctx, x, top, w, h, 8); ctx.fill();
      ctx.fillStyle = '#c23a3a'; ctx.fillRect(x, top + h * 0.62, w, 6);
      ctx.fillStyle = '#2a3034'; ctx.fillRect(x + 4, top + h - 12, w - 8, 8);
      // windows with passengers… or something like them
      for (let k = 0; k < 6; k++) {
        const wx = x + 10 + k * (w - 20) / 6, ww = (w - 20) / 6 - 8;
        const door = k === 2;
        if (door) { ctx.fillStyle = '#8d979d'; ctx.fillRect(wx, top + 8, ww + 4, h - 24); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(wx + ww / 2 + 1, top + 8, 1.5, h - 24); }
        ctx.fillStyle = G.power ? '#ffe9a8' : '#c9b98a'; ctx.fillRect(wx + (door ? 3 : 0), top + 12, door ? ww - 2 : ww, h * 0.34);
        if (!door && hash(c, k) < 0.45) { ctx.fillStyle = 'rgba(40,30,20,0.7)'; ctx.beginPath(); ctx.arc(wx + ww / 2, top + 12 + h * 0.34 - 6, 5, Math.PI, 0); ctx.fill(); ctx.fillRect(wx + ww / 2 - 6, top + 12 + h * 0.34 - 6, 12, 6); }
      }
      // bogies
      for (const bx of [x + 22, x + w - 22]) { ctx.fillStyle = '#16191b'; ctx.beginPath(); ctx.arc(bx - 7, top + h + 1, 5, 0, 7); ctx.arc(bx + 7, top + h + 1, 5, 0, 7); ctx.fill(); ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.beginPath(); const a = t * 40; ctx.moveTo(bx - 7 + Math.cos(a) * 4, top + h + 1 + Math.sin(a) * 4); ctx.lineTo(bx - 7 - Math.cos(a) * 4, top + h + 1 - Math.sin(a) * 4); ctx.stroke(); }
      if (c < 2) { ctx.fillStyle = '#2a3034'; ctx.fillRect(x + w, top + h * 0.4, 4, 12); }
    }
    // the cab: headlight and destination board
    const front = tn.dir > 0 ? tn.x0 + TRAIN.len - 2 : tn.x0 + 2;
    ctx.fillStyle = '#1a1e22'; ctx.fillRect(front - (tn.dir > 0 ? 26 : 0), top + 3, 26, 8);
    ctx.fillStyle = '#ff9a3a'; ctx.font = '800 6px Barlow, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(tr('metro.sign'), front - tn.dir * 13, top + 7.5);
    ctx.fillStyle = '#fffbe6'; ctx.beginPath(); ctx.arc(front - tn.dir * 6, top + h * 0.55, 4.5, 0, 7); ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    const lg = ctx.createRadialGradient(front, top + h * 0.55, 0, front, top + h * 0.55, 70); lg.addColorStop(0, 'rgba(255,250,220,0.6)'); lg.addColorStop(1, 'rgba(255,250,220,0)');
    ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(front, top + h * 0.55); ctx.lineTo(front + tn.dir * 120, top - 10); ctx.lineTo(front + tn.dir * 120, top + h + 10); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawMat(ctx, m) {
    const a = Math.min(1, m.t * 2), pulse = 0.5 + Math.sin(G.t * 6) * 0.5;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(m.x, m.y);
    ctx.fillStyle = 'rgba(154,210,127,' + (0.15 + pulse * 0.12) + ')'; ctx.beginPath(); ctx.ellipse(0, -1, 26, 6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#2f5d46'; rr(ctx, -22, -5, 44, 6, 2); ctx.fill();
    ctx.fillStyle = '#4f9a73'; rr(ctx, -20, -5, 40, 4, 2); ctx.fill();
    ctx.fillStyle = '#e8f6d4'; ctx.font = '800 5px Barlow, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('MOLA', 0, -3);
    // sticky strings
    ctx.strokeStyle = 'rgba(190,255,150,0.6)'; ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 9, -5); ctx.quadraticCurveTo(i * 9 + Math.sin(G.t * 4 + i) * 2, -10, i * 7, -14 - pulse * 2); ctx.stroke(); }
    ctx.restore();
  }
  function drawCage(ctx) {
    const c = G.cage; if (!c) return;
    const x0 = c.x - CAGE_W / 2, top = c.y - CAGE_H, bot = c.y;
    ctx.save();
    ctx.fillStyle = 'rgba(180,190,200,0.07)'; ctx.fillRect(x0, top, CAGE_W, CAGE_H);
    ctx.strokeStyle = '#aab3bd'; ctx.lineWidth = 1.6;
    for (let i = 0; i <= 6; i++) { const x = x0 + i * CAGE_W / 6; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bot); ctx.stroke(); }
    ctx.lineWidth = 2.4; ctx.strokeStyle = '#7d8791';
    ctx.beginPath(); ctx.moveTo(x0 - 2, top); ctx.lineTo(x0 + CAGE_W + 2, top); ctx.moveTo(x0 - 2, bot - 1); ctx.lineTo(x0 + CAGE_W + 2, bot - 1); ctx.stroke();
    ctx.fillStyle = '#7d8791'; ctx.beginPath(); ctx.arc(c.x, top - 5, 4, Math.PI, 0); ctx.fill(); ctx.fillRect(c.x - 1, top - 6, 2, 6);
    // sign + padlock
    ctx.fillStyle = '#2b2f33'; rr(ctx, c.x - 17, top - 19, 34, 10, 2); ctx.fill();
    ctx.fillStyle = '#ffd43b'; ctx.font = '800 7px Barlow, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('☕ MOLA', c.x, top - 14);
    ctx.fillStyle = '#d9a441'; rr(ctx, c.x - 5, bot - 17, 10, 8, 1.5); ctx.fill();
    ctx.strokeStyle = '#d9a441'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(c.x, bot - 17, 3.2, Math.PI, 0); ctx.stroke();
    ctx.restore();
  }

  function drawLamp(ctx, l, on) {
    const kind = G.M.theme.lamp, x = l.x, y = l.y;
    if (kind === 'bulb') {
      ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 2); ctx.stroke();
      ctx.fillStyle = '#3a332c'; ctx.fillRect(x - 3, y + 1, 6, 3);
      ctx.fillStyle = on ? '#ffe7a8' : '#4a4540'; ctx.beginPath(); ctx.arc(x, y + 7, 3.6, 0, 7); ctx.fill();
    } else if (kind === 'lantern') {
      ctx.strokeStyle = '#3a2e22'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = '#2b2620'; rr(ctx, x - 4.5, y, 9, 12, 2); ctx.fill();
      ctx.fillStyle = on ? '#ffc56b' : '#3a3530'; rr(ctx, x - 3, y + 2, 6, 8, 1.5); ctx.fill();
    } else if (kind === 'string') {
      // a sagging wire of carnival bulbs
      ctx.strokeStyle = '#2a1a24'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x - 30, y - 4); ctx.quadraticCurveTo(x, y + 8, x + 30, y - 4); ctx.stroke();
      const cols = ['#ff5b8e', '#ffd36b', '#7fdcff', '#a6ff8f', '#d6a1ff'];
      for (let k = -2; k <= 2; k++) {
        const bx = x + k * 12, by = y + 2 + (1 - (k * k) / 4) * 4 - Math.abs(k) * 0.5, lit = on && ((Math.floor(G.t * 4) + k + 2) % 2 === 0 || k === 0);
        ctx.fillStyle = lit ? (k === 0 && l.col ? `rgb(${l.col})` : cols[(k + 2 + l.ph) % 5]) : '#3a2a34';
        ctx.beginPath(); ctx.arc(bx, by + 2, k === 0 ? 3 : 2, 0, 7); ctx.fill();
      }
    } else if (kind === 'metro') {
      ctx.fillStyle = '#20282c'; ctx.fillRect(x - 10, y - 6, 1.5, 6); ctx.fillRect(x + 8.5, y - 6, 1.5, 6);
      ctx.fillStyle = '#2f3a3e'; rr(ctx, x - 15, y - 1, 30, 6, 1.5); ctx.fill();
      ctx.fillStyle = on ? '#f4f8ff' : '#3d4a4e'; ctx.fillRect(x - 13, y + 4, 26, 2.5);
    } else if (kind === 'chandelier') {
      ctx.strokeStyle = '#6a5228'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 2); ctx.stroke();
      ctx.strokeStyle = '#b8913e'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(x, y + 5, 13, 3, 0, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 13, y + 5); ctx.lineTo(x, y + 1); ctx.lineTo(x + 13, y + 5); ctx.stroke();
      for (const dx of [-11, -5, 0, 5, 11]) {
        ctx.fillStyle = '#efe4cf'; ctx.fillRect(x + dx - 1, y, 2, 5);
        if (on) { const fl = Math.sin(G.t * 13 + dx) * 0.6; ctx.fillStyle = '#ffcf6b'; ctx.beginPath(); ctx.moveTo(x + dx - 1.4, y); ctx.quadraticCurveTo(x + dx + fl, y - 6, x + dx + 1.4, y); ctx.fill(); ctx.fillStyle = '#fff3c4'; ctx.beginPath(); ctx.arc(x + dx, y - 1, 0.8, 0, 7); ctx.fill(); }
      }
    } else if (kind === 'icelamp') {
      ctx.strokeStyle = '#4a5a66'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 1); ctx.stroke();
      ctx.fillStyle = '#5a6a76'; ctx.fillRect(x - 3.5, y + 1, 7, 2);
      ctx.fillStyle = on ? '#dff4ff' : '#4a5a66'; ctx.beginPath(); ctx.arc(x, y + 7, 4.6, 0, 7); ctx.fill();
      if (on) { ctx.fillStyle = 'rgba(150,215,255,0.8)'; ctx.beginPath(); ctx.arc(x, y + 7, 2.4, 0, 7); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x - 3, y + 11, 6, 1.2);
    } else {
      ctx.fillStyle = '#2f3a3e'; ctx.fillRect(x - 15, y - 1, 30, 3);
      ctx.fillStyle = on ? '#e9fff7' : '#3d4a4e'; rr(ctx, x - 13, y + 2, 26, 3.5, 1.7); ctx.fill();
    }
  }
  function drawFlames(ctx, x, y, t, s) {
    for (let i = 0; i < 3; i++) {
      const h = (16 + Math.sin(t * 13 + i * 2) * 4 - i * 3) * s, w = (9 - i * 2.4) * s;
      ctx.fillStyle = ['#ff6a1a', '#ffb02e', '#fff1a8'][i];
      ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x - w * 0.6, y - h * 0.6, x + Math.sin(t * 9 + i) * 2 * s, y - h); ctx.quadraticCurveTo(x + w * 0.6, y - h * 0.6, x + w, y); ctx.closePath(); ctx.fill();
    }
  }
  function drawFire(ctx, f, t) {
    const key = G.M.themeKey;
    if (key === 'library') {
      // a stone fireplace with a mantel
      ctx.fillStyle = '#4a4440'; ctx.fillRect(f.x - 26, f.y - 44, 52, 44);
      ctx.fillStyle = '#3a3430'; for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) ctx.fillRect(f.x - 26 + k * 13 + (r % 2) * 6, f.y - 44 + r * 11, 1, 11);
      ctx.fillStyle = '#5a3a20'; ctx.fillRect(f.x - 30, f.y - 48, 60, 5);
      ctx.fillStyle = '#0c0806'; ctx.beginPath(); ctx.moveTo(f.x - 16, f.y); ctx.lineTo(f.x - 16, f.y - 22); ctx.arc(f.x, f.y - 22, 16, Math.PI, 0); ctx.lineTo(f.x + 16, f.y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c9a35c'; ctx.fillRect(f.x - 20, f.y - 54, 3, 6); ctx.fillRect(f.x + 17, f.y - 54, 3, 6);
      ctx.fillStyle = '#3b2618'; ctx.fillRect(f.x - 10, f.y - 4, 20, 3);
      drawFlames(ctx, f.x, f.y - 4, t, 0.8);
    } else if (key === 'ice') {
      // a fire barrel
      ctx.fillStyle = '#3a3e44'; rr(ctx, f.x - 9, f.y - 16, 18, 16, 2); ctx.fill();
      ctx.fillStyle = '#2a2d31'; ctx.fillRect(f.x - 9, f.y - 11, 18, 1.5); ctx.fillRect(f.x - 9, f.y - 5, 18, 1.5);
      ctx.fillStyle = Math.sin(t * 9) > 0 ? '#ffb02e' : '#ff6a1a'; for (const dx of [-5, 0, 5]) { ctx.beginPath(); ctx.arc(f.x + dx, f.y - 8, 1.3, 0, 7); ctx.fill(); }
      drawFlames(ctx, f.x, f.y - 16, t, 0.8);
    } else {
      ctx.fillStyle = '#3b2618'; ctx.save(); ctx.translate(f.x, f.y - 3);
      ctx.rotate(0.35); ctx.fillRect(-11, -2, 22, 4); ctx.rotate(-0.7); ctx.fillRect(-11, -2, 22, 4); ctx.restore();
      drawFlames(ctx, f.x, f.y - 4, t, 1);
    }
    if (Math.random() < 0.15) spawnParticle(f.x + (Math.random() - 0.5) * 10, f.y - 16, (Math.random() - 0.5) * 20, -40 - Math.random() * 40, 0.9, '#ffb02e', 1.6, 'dot', -10);
  }
  function drawHide(ctx, h, i, viewer) {
    const kind = G.M.theme.hide, sh = h.shakeT > 0 ? Math.sin(h.shakeT * 60) * 1.4 : 0;
    const x = h.x + sh, y = h.y, mine = viewer.hide === i;
    ctx.save();
    if (kind === 'closet') {
      ctx.fillStyle = '#4a3324'; rr(ctx, x - 15, y - 46, 30, 46, 2); ctx.fill();
      ctx.fillStyle = '#5c402c'; ctx.fillRect(x - 13, y - 43, 12.5, 40); ctx.fillRect(x + 0.5, y - 43, 12.5, 40);
      ctx.fillStyle = mine ? '#0b0806' : '#20160f'; ctx.fillRect(x - 0.6, y - 43, 1.2, 40);
      ctx.fillStyle = '#c9a35c'; ctx.beginPath(); ctx.arc(x - 3, y - 23, 1.1, 0, 7); ctx.arc(x + 3, y - 23, 1.1, 0, 7); ctx.fill();
      ctx.fillStyle = '#3a281c'; ctx.fillRect(x - 16, y - 48, 32, 3);
    } else if (kind === 'bush') {
      ctx.fillStyle = '#16301c';
      for (const [dx, dy, r] of [[-9, -12, 11], [8, -13, 12], [0, -22, 12], [-2, -8, 13]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#22452a';
      for (const [dx, dy, r] of [[-6, -18, 5], [7, -20, 4], [2, -12, 5]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, 7); ctx.fill(); }
    } else if (kind === 'cutout') {
      // face-in-the-hole board: a painted strongman
      ctx.fillStyle = '#3a2418'; ctx.fillRect(x - 11, y - 10, 2.5, 10); ctx.fillRect(x + 8.5, y - 10, 2.5, 10);
      ctx.fillStyle = '#ffd43b'; rr(ctx, x - 15, y - 48, 30, 40, 3); ctx.fill();
      ctx.fillStyle = i % 2 ? '#7fd6ff' : '#ffb3d1'; rr(ctx, x - 13, y - 46, 26, 36, 2); ctx.fill();
      ctx.fillStyle = '#f1c9a0'; ctx.beginPath(); ctx.arc(x, y - 36, 7.5, 0, 7); ctx.fill();
      for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? '#ffffff' : '#c23a4a'; ctx.fillRect(x - 9, y - 29 + k * 4.5, 18, 4.5); }
      ctx.fillStyle = '#f1c9a0'; ctx.fillRect(x - 13, y - 28, 4, 9); ctx.fillRect(x + 9, y - 28, 4, 9);
      ctx.fillStyle = '#2a1a10'; ctx.fillRect(x - 15, y - 21, 8, 3); ctx.fillRect(x + 7, y - 21, 8, 3); ctx.beginPath(); ctx.arc(x - 15, y - 19.5, 3, 0, 7); ctx.arc(x - 7, y - 19.5, 3, 0, 7); ctx.arc(x + 7, y - 19.5, 3, 0, 7); ctx.arc(x + 15, y - 19.5, 3, 0, 7); ctx.fill();
      ctx.fillStyle = mine ? '#0b0608' : '#120a10'; ctx.beginPath(); ctx.arc(x, y - 36, 5, 0, 7); ctx.fill();
      ctx.fillStyle = '#5a2a1a'; ctx.beginPath(); ctx.ellipse(x - 3, y - 31.5, 3, 1.2, -0.2, 0, 7); ctx.ellipse(x + 3, y - 31.5, 3, 1.2, 0.2, 0, 7); ctx.fill();
    } else if (kind === 'booth') {
      // photo booth with a curtain
      ctx.fillStyle = '#4a5a64'; rr(ctx, x - 15, y - 48, 30, 48, 2); ctx.fill();
      ctx.fillStyle = G.power ? '#ffd43b' : '#5a5030'; ctx.fillRect(x - 13, y - 46, 26, 6);
      ctx.fillStyle = '#1a1208'; ctx.font = '900 5px Barlow, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('FOTO', x, y - 43);
      ctx.fillStyle = '#2a3236'; ctx.fillRect(x - 13, y - 38, 7, 30); ctx.fillStyle = '#8a969c'; ctx.fillRect(x - 12, y - 30, 5, 3); ctx.fillRect(x - 11, y - 24, 3, 1);
      const bulge = mine ? 1.5 : 0;
      for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? '#8a1a2a' : '#a8243a'; ctx.fillRect(x - 5 + k * 4, y - 38, 4 + (k === 4 ? 0 : 0.3), 34 + Math.sin(G.t * 1.5 + k) * 0.6 + bulge); }
      ctx.fillStyle = '#2a3236'; ctx.fillRect(x - 15, y - 4, 30, 4);
      if (mine) { ctx.fillStyle = '#050304'; ctx.fillRect(x - 2.5, y - 34, 3, 12); }
    } else if (kind === 'clock') {
      // grandfather clock — the pendulum stops while someone is inside
      ctx.fillStyle = '#3a2212'; rr(ctx, x - 10, y - 46, 20, 46, 2); ctx.fill();
      ctx.fillStyle = '#4a2c18'; ctx.beginPath(); ctx.arc(x, y - 42, 10, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#e9dcc0'; ctx.beginPath(); ctx.arc(x, y - 38, 6, 0, 7); ctx.fill();
      ctx.strokeStyle = '#1a1208'; ctx.lineWidth = 0.9; const hh = G.t * 0.05, mm = G.t * 0.6;
      ctx.beginPath(); ctx.moveTo(x, y - 38); ctx.lineTo(x + Math.sin(hh) * 3, y - 38 - Math.cos(hh) * 3); ctx.moveTo(x, y - 38); ctx.lineTo(x + Math.sin(mm) * 4.8, y - 38 - Math.cos(mm) * 4.8); ctx.stroke();
      ctx.fillStyle = mine ? '#0a0604' : '#1a0f08'; ctx.fillRect(x - 6, y - 29, 12, 23);
      const sw = mine ? 0 : Math.sin(G.t * 3.2) * 0.35;
      ctx.strokeStyle = '#c9a35c'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - 29); ctx.lineTo(x + Math.sin(sw) * 16, y - 29 + Math.cos(sw) * 16); ctx.stroke();
      ctx.fillStyle = '#c9a35c'; ctx.beginPath(); ctx.arc(x + Math.sin(sw) * 16, y - 29 + Math.cos(sw) * 16, 2.6, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x - 5, y - 28, 2, 20);
      ctx.fillStyle = '#2a1a0e'; ctx.fillRect(x - 11, y - 3, 22, 3);
    } else if (kind === 'snowman') {
      // a snowman; when someone hides inside, the eyes are alive
      ctx.fillStyle = '#e9f5fc';
      ctx.beginPath(); ctx.arc(x, y - 11, 11.5, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y - 28, 8.5, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y - 40, 6.5, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(150,190,220,0.35)'; ctx.beginPath(); ctx.arc(x + 3, y - 9, 9, 0, 7); ctx.fill();
      ctx.fillStyle = '#c23a4a'; ctx.fillRect(x - 7, y - 35, 14, 3); ctx.fillRect(x + 3, y - 34, 3, 8);
      ctx.fillStyle = '#16161c'; ctx.fillRect(x - 6, y - 47, 12, 2); ctx.fillRect(x - 4, y - 54, 8, 7);
      ctx.fillStyle = '#ff8a2e'; tri(ctx, x, y - 40, x, y - 38, x + 6, y - 39);
      ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 8, y - 28); ctx.lineTo(x - 17, y - 34); ctx.moveTo(x + 8, y - 28); ctx.lineTo(x + 17, y - 33); ctx.lineTo(x + 19, y - 36); ctx.stroke();
      ctx.fillStyle = '#16161c'; for (const dy of [-26, -21, -16]) { ctx.beginPath(); ctx.arc(x, y + dy, 0.9, 0, 7); ctx.fill(); }
      if (mine) { const look = Math.sin(G.t * 0.9) * 0.8, bl = Math.sin(G.t * 2.3) > 0.96; ctx.fillStyle = '#fff'; if (!bl) { ctx.beginPath(); ctx.arc(x - 2.5, y - 42, 1.6, 0, 7); ctx.arc(x + 2.5, y - 42, 1.6, 0, 7); ctx.fill(); ctx.fillStyle = '#1a1208'; ctx.beginPath(); ctx.arc(x - 2.5 + look, y - 42, 0.8, 0, 7); ctx.arc(x + 2.5 + look, y - 42, 0.8, 0, 7); ctx.fill(); } }
      else { ctx.fillStyle = '#16161c'; ctx.beginPath(); ctx.arc(x - 2.5, y - 42, 1, 0, 7); ctx.arc(x + 2.5, y - 42, 1, 0, 7); ctx.fill(); }
    } else {
      ctx.fillStyle = '#3c4a50'; rr(ctx, x - 15, y - 46, 30, 46, 3); ctx.fill();
      ctx.fillStyle = G.power ? 'rgba(140,230,255,0.25)' : 'rgba(40,60,70,0.6)'; rr(ctx, x - 12, y - 42, 24, 30, 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 9, y - 40); ctx.lineTo(x - 3, y - 16); ctx.stroke();
      ctx.fillStyle = '#9aa7ad'; ctx.fillRect(x + 9, y - 30, 2, 9);
    }
    if (mine && kind !== 'snowman') {
      // you: peeking eyes
      const blink = Math.sin(G.t * 2.3) > 0.96, ey = kind === 'cutout' ? y - 36 : kind === 'clock' ? y - 22 : kind === 'booth' ? y - 30 : y - 27, ex = kind === 'booth' ? x - 1 : x;
      ctx.fillStyle = '#fff6c8';
      if (!blink) { ctx.beginPath(); ctx.ellipse(ex - 3, ey, 1.6, 1.1, 0, 0, 7); ctx.ellipse(ex + 3, ey, 1.6, 1.1, 0, 0, 7); ctx.fill(); }
    }
    ctx.restore();
  }
  function drawTrap(ctx, x, y, arming) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#5b5f66'; ctx.fillRect(-10, -2, 20, 2);
    ctx.strokeStyle = '#8b9099'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(-4, -2, 6, Math.PI, Math.PI * 1.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(4, -2, 6, Math.PI * 1.1, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#c7ccd4';
    for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 2.6 - 1, -2); ctx.lineTo(i * 2.6 + 1, -2); ctx.lineTo(i * 2.6, -5); ctx.closePath(); ctx.fill(); }
    if (arming) { ctx.fillStyle = '#ff5d5d'; ctx.beginPath(); ctx.arc(0, -8, 1.2, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  function drawFlashBeam(ctx) {
    if (!G.flash) return;
    const f = G.flash, e = f.t / f.max;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 240 * (1 - e * 0.3));
    g.addColorStop(0, `rgba(255,250,210,${0.9 * e})`); g.addColorStop(0.4, `rgba(255,230,150,${0.35 * e})`); g.addColorStop(1, 'rgba(255,220,120,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, 240, 0, 7); ctx.fill();
    ctx.translate(f.x, f.y); ctx.rotate(G.t * 1.5);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, L = 90 * e + 30; ctx.fillStyle = `rgba(255,236,160,${0.35 * e})`; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 10, Math.sin(a) * 10); ctx.lineTo(Math.cos(a - 0.07) * L, Math.sin(a - 0.07) * L); ctx.lineTo(Math.cos(a + 0.07) * L, Math.sin(a + 0.07) * L); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  function drawFx(ctx) {
    for (const f of G.fx) {
      const k = f.t / f.life;
      if (f.type === 'teeth') {
        // two rows of teeth snapping shut
        const gap = Math.max(0, 1 - k * 3.2) * 9, a = 1 - Math.max(0, k - 0.5) * 2;
        ctx.save(); ctx.globalAlpha = a; ctx.translate(f.x, f.y);
        ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#7a1f2e'; ctx.lineWidth = 0.8;
        for (const s of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(-11, s * (gap + 3));
          for (let i = 0; i <= 5; i++) ctx.lineTo(-11 + i * 4.4, s * (gap + (i % 2 ? -1 : 3)));
          ctx.lineTo(11, s * (gap + 6)); ctx.lineTo(-11, s * (gap + 6)); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
        ctx.restore();
      } else if (f.type === 'zap') {
        const a = 1 - k, flick = Math.random() < 0.7;
        ctx.save(); ctx.globalAlpha = a; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        // the defibrillator paddles by her hands
        const dx = f.x2 >= f.x1 ? 1 : -1, px = f.x1 + dx * 12, py = f.y1 - 4;
        ctx.fillStyle = '#e8344e'; rr(ctx, f.x1 - 7 + dx * 4, f.y1 - 22, 14, 9, 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(f.x1 - 1 + dx * 4, f.y1 - 21, 2, 7); ctx.fillRect(f.x1 - 4 + dx * 4, f.y1 - 18, 8, 2);
        ctx.fillStyle = '#3a3f45'; rr(ctx, px - 3, py - 3, 6, 6, 1.5); ctx.fill();
        if (flick) for (const [w, col] of [[5, 'rgba(120,200,255,0.5)'], [2, '#ffffff']]) {
          ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(px, py);
          const n = 7;
          for (let i = 1; i < n; i++) { const u = i / n; ctx.lineTo(px + (f.x2 - px) * u + (Math.random() - 0.5) * 16, py + (f.y2 - py) * u + (Math.random() - 0.5) * 16); }
          ctx.lineTo(f.x2, f.y2); ctx.stroke();
        }
        // sparks around him
        ctx.strokeStyle = '#fff6b0'; ctx.lineWidth = 1.6;
        for (let i = 0; i < 4; i++) { const ang = Math.random() * 6.28, r1 = 6 + Math.random() * 6, r2 = 16 + Math.random() * 10; ctx.beginPath(); ctx.moveTo(f.x2 + Math.cos(ang) * r1, f.y2 + Math.sin(ang) * r1); ctx.lineTo(f.x2 + Math.cos(ang + 0.5) * r2, f.y2 + Math.sin(ang + 0.5) * r2); ctx.stroke(); }
        ctx.restore();
      } else if (f.type === 'slap') {
        ctx.save(); ctx.globalAlpha = 1 - k; ctx.translate(f.x, f.y);
        ctx.fillStyle = '#ffe066'; starPath(ctx, 0, 0, 10 + k * 8, k * 3); ctx.fill();
        ctx.fillStyle = '#fff'; starPath(ctx, 0, 0, 5 + k * 4, k * 3); ctx.fill();
        ctx.fillStyle = '#e8344e'; ctx.font = '900 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ŞAP!', 0, -16 - k * 8);
        ctx.restore();
      }
    }
  }
  function drawParticles(ctx) {
    for (const p of G.particles) {
      const a = Math.min(1, p.life / p.max * 1.5);
      ctx.globalAlpha = a; ctx.fillStyle = p.color;
      switch (p.type) {
        case 'heart': heartPath(ctx, p.x, p.y, p.size * 1.6); ctx.fill(); break;
        case 'star': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillRect(-p.size / 2, -0.8, p.size, 1.6); ctx.fillRect(-0.8, -p.size / 2, 1.6, p.size); ctx.restore(); break;
        case 'star5': starPath(ctx, p.x, p.y, p.size, p.rot); ctx.fill(); break;
        case 'note': case 'text':
          ctx.font = `700 ${p.size}px Barlow, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(p.ch || p.text, p.x, p.y); break;
        default: ctx.beginPath(); ctx.arc(p.x, p.y, p.size / 2, 0, 7); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  // ---------- darkness ----------
  function drawDarkness(W, vi) {
    const { ctx, v, z, ox, oy, L } = W;
    const D = darkCanvas(vi, v.w, v.h), d = D.x;
    d.setTransform(1, 0, 0, 1, 0, 0);
    d.globalCompositeOperation = 'source-over';
    d.clearRect(0, 0, v.w, v.h);
    const base = G.power ? (G.M.themeKey === 'forest' || G.M.theme.outdoor ? 0.9 : 0.86) : 0.975;
    d.fillStyle = `rgba(3,4,9,${base})`; d.fillRect(0, 0, v.w, v.h);
    d.globalCompositeOperation = 'destination-out';
    for (const s of L) {
      const sx = s.x * z - ox, sy = s.y * z - oy, sr = s.r * z;
      if (sx < -sr || sy < -sr || sx > v.w + sr || sy > v.h + sr) continue;
      const g = d.createRadialGradient(sx, sy, 0, sx, sy, sr);
      g.addColorStop(0, `rgba(0,0,0,${s.s})`); g.addColorStop(0.5, `rgba(0,0,0,${s.s * 0.75})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      d.fillStyle = g; d.beginPath(); d.arc(sx, sy, sr, 0, 7); d.fill();
    }
    ctx.drawImage(D.c, v.x, v.y);
    // colored glow
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const col = G.M.theme.light;
    for (const s of L) {
      if (s.self) continue;
      const sx = v.x + s.x * z - ox, sy = v.y + s.y * z - oy, sr = s.r * z * 0.8;
      if (sx < v.x - sr || sx > v.x + v.w + sr || sy < -sr || sy > v.h + sr) continue;
      const c = s.red ? '255,60,60' : s.warm === 2 ? '255,140,60' : s.warm === 3 ? '255,240,190' : s.col || col;
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
      g.addColorStop(0, `rgba(${c},${0.16 * s.s})`); g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  // ---------- things you notice even in the dark ----------
  function drawAboveDark(W) {
    const { ctx, me, op, L } = W, t = G.t;
    // noise rings (not your own)
    for (const n of G.pings) {
      if (n.owner === me.char) continue;
      const d = Math.hypot(cx(me) - n.x, cy(me) - n.y);
      if (d > n.r) continue;
      const k = n.t / n.life, a = (1 - k) * (1 - d / n.r) * 0.9;
      ctx.strokeStyle = n.kind === 'step' || n.kind === 'land' ? `rgba(220,220,235,${a})` : n.kind === 'music' ? `rgba(255,220,90,${a})` : n.kind === 'talk' ? `rgba(255,140,190,${a})` : `rgba(255,170,90,${a})`;
      ctx.lineWidth = 1.4;
      const R = (n.kind === 'step' ? 10 : 16) + k * (n.kind === 'step' ? 16 : 34);
      ctx.beginPath(); ctx.arc(n.x, n.y, R, n.kind === 'step' ? Math.PI : 0, Math.PI * 2); ctx.stroke();
      if (n.kind !== 'step' && n.kind !== 'land') { ctx.beginPath(); ctx.arc(n.x, n.y, R * 0.6, 0, 7); ctx.stroke(); }
      if (k < 0.1 && n.kind !== 'step') { ctx.globalAlpha = a; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(n.kind === 'chew' ? '😋' : n.kind === 'music' ? '🎵' : n.kind === 'talk' ? '💬' : n.kind === 'rustle' ? '🍃' : n.kind === 'secret' ? '📖' : n.kind === 'splash' ? '💦' : n.kind === 'boing' ? '🎈' : '❗', n.x, n.y - 22); ctx.globalAlpha = 1; }
    }
    // he can smell her: red silhouette through anything
    if (me.char === 'boy' && G.sniffT > 0) {
      const a = Math.min(1, G.sniffT * 2) * (0.55 + Math.sin(t * 9) * 0.15);
      ctx.save(); ctx.globalAlpha = a;
      ctx.strokeStyle = '#ff3b3b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx(op), cy(op) - 4, 24 + Math.sin(t * 6) * 3, 0, 7); ctx.stroke();
      ctx.globalAlpha = a * 0.7; C.draw(ctx, drawable(op), t);
      ctx.restore();
      if (Math.random() < 0.3) spawnParticle(cx(op) + (Math.random() - 0.5) * 20, cy(op), 0, -10, 1.2, 'rgba(255,80,80,0.6)', 3, 'dot', -5);
    }
    // the bride glows through the dark
    if (op.bridalT > 0 && W.opVis < 0.5 && op.hide >= 0) {
      const h = G.M.hides[op.hide];
      ctx.fillStyle = `rgba(255,255,255,${0.35 + Math.sin(t * 5) * 0.15})`; ctx.fillRect(h.x - 2, h.y - 8, 10, 6);
    }
    // floating text
    for (const f of G.fx) {
      if (f.type !== 'text') continue;
      const k = f.t / f.life;
      ctx.globalAlpha = 1 - Math.max(0, k - 0.6) * 2.5;
      ctx.font = `800 ${f.size}px Barlow, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.strokeText(f.text, f.x, f.y - k * 26);
      ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y - k * 26);
    }
    ctx.globalAlpha = 1;
  }

  // ---------- per-view screen overlays ----------
  function wrapText(ctx, text, maxW) {
    const words = String(text).split(' '), lines = [];
    let line = '';
    for (const w of words) { const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test; }
    if (line) lines.push(line);
    return lines;
  }
  function bubble(ctx, sx, sy, lines, fs, vw, opts) {
    const d = G.dpr, pad = 9 * d, lh = fs * 1.25;
    let w = 0; for (const l of lines) w = Math.max(w, ctx.measureText(l).width);
    const bw = w + pad * 2, bh = lines.length * lh + pad * 1.2;
    const bx = clamp(sx - bw / 2, 6 * d, vw - bw - 6 * d), by = sy - bh - 9 * d;
    ctx.fillStyle = (opts && opts.bg) || 'rgba(18,16,20,0.92)'; rr(ctx, bx, by, bw, bh, 6 * d); ctx.fill();
    ctx.strokeStyle = (opts && opts.border) || 'rgba(255,190,120,0.5)'; ctx.lineWidth = 1.2 * d; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx - 6 * d, by + bh); ctx.lineTo(sx, by + bh + 7 * d); ctx.lineTo(sx + 6 * d, by + bh); ctx.fillStyle = (opts && opts.bg) || 'rgba(18,16,20,0.92)'; ctx.fill();
    ctx.fillStyle = (opts && opts.fg) || '#f3e6d4';
    lines.forEach((l, i) => ctx.fillText(l, bx + bw / 2, by + pad * 0.6 + lh * (i + 0.5)));
    return by;
  }
  function heartBubble(ctx, sx, sy, text, age, dur, vw) {
    const d = G.dpr, fs = Math.round(13 * d);
    ctx.font = `700 ${fs}px Barlow, sans-serif`;
    const lines = wrapText(ctx, text, 110 * d), lh = fs * 1.12;
    let tw = 0; for (const l of lines) tw = Math.max(tw, ctx.measureText(l).width);
    const th = lines.length * lh, s = Math.max(tw / 0.7, th / 0.42, 62 * d);
    const k = Math.min(1, age / 0.35), pop = k < 1 ? 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2) : 1;
    const fade = clamp((dur - age) * 2.5, 0, 1);
    const x = clamp(sx, s * 0.55, vw - s * 0.55), y = Math.max(s * 0.45 + 60 * d, sy - s * 0.45 - 6 * d) + Math.sin(age * 3) * 3 * d;
    ctx.save(); ctx.globalAlpha = fade; ctx.translate(x, y); ctx.scale(Math.max(0.01, pop), Math.max(0.01, pop));
    const g = ctx.createLinearGradient(0, -s * 0.4, 0, s * 0.45); g.addColorStop(0, '#ff6f8f'); g.addColorStop(1, '#b3123a');
    ctx.fillStyle = g; heartPath(ctx, 0, 0, s); ctx.fill();
    ctx.strokeStyle = 'rgba(255,230,230,0.9)'; ctx.lineWidth = 2 * d; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const top = -th / 2 + lh / 2;
    lines.forEach((l, i) => ctx.fillText(l, 0, top + i * lh));
    ctx.restore();
  }
  function typingBubble(ctx, sx, sy) {
    const d = G.dpr, w = 40 * d, h = 20 * d, x = sx - w / 2, y = sy - h - 6 * d;
    ctx.fillStyle = 'rgba(18,16,20,0.92)'; rr(ctx, x, y, w, h, h / 2); ctx.fill();
    for (let i = 0; i < 3; i++) { const b = Math.max(0, Math.sin(G.t * 8 - i * 0.9)) * 4 * d; ctx.fillStyle = '#ff8f6b'; ctx.beginPath(); ctx.arc(sx + (i - 1) * 10 * d, y + h / 2 - b, 3 * d, 0, 7); ctx.fill(); }
  }
  function drawViewOverlays(W) {
    const { ctx, v, z, ox, oy, me, op, opVis } = W, d = G.dpr, t = G.t;
    const toS = (wx, wy) => ({ x: wx * z - ox, y: wy * z - oy });
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const p of [op, me]) {
      const mine = p === me;
      const sp = toS(cx(p), p.y - 16);
      const seen = mine || opVis > 0.35 || (me.char === 'boy' && G.sniffT > 0);
      let top = sp.y;
      if (p.typing) { typingBubble(ctx, sp.x, top); top -= 28 * d; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; }
      if (p.say) { heartBubble(ctx, sp.x, top, p.say.text, p.say.age, p.say.dur, v.w); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; }
      else if (p.emoteT > 0 && p.emote && seen) {
        const fs = Math.round(14 * d);
        ctx.font = `600 ${fs}px Barlow, sans-serif`;
        ctx.globalAlpha = Math.min(1, p.emoteT * 3);
        bubble(ctx, sp.x, sp.y - 4 * d, wrapText(ctx, String(p.emote), 220 * d), fs, v.w);
        ctx.globalAlpha = 1;
      } else if (seen && (!mine || G.phase === 'intro') && p.hide < 0) {
        const name = mine ? tr('game.you') : (G.names[p.char] || tr('char.' + p.char));
        const fs = Math.round(11 * d);
        ctx.font = `700 ${fs}px Barlow, sans-serif`;
        const w = ctx.measureText(name.toUpperCase()).width + 12 * d;
        ctx.fillStyle = p.char === 'boy' ? 'rgba(40,80,170,0.85)' : 'rgba(170,40,90,0.85)';
        rr(ctx, sp.x - w / 2, sp.y - 8 * d, w, 16 * d, 3 * d); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillText(name.toUpperCase(), sp.x, sp.y + 0.5 * d);
      }
    }
    // sniff arrow when she is off-screen
    if (me.char === 'boy' && G.sniffT > 0) {
      const sp = toS(cx(op), cy(op));
      if (sp.x < 0 || sp.x > v.w || sp.y < 0 || sp.y > v.h) {
        const ax = clamp(sp.x, 30 * d, v.w - 30 * d), ay = clamp(sp.y, 70 * d, v.h - 90 * d), ang = Math.atan2(sp.y - ay, sp.x - ax);
        ctx.save(); ctx.translate(ax, ay); ctx.rotate(ang);
        ctx.fillStyle = 'rgba(255,60,60,0.9)'; ctx.beginPath(); ctx.moveTo(16 * d, 0); ctx.lineTo(-8 * d, -10 * d); ctx.lineTo(-8 * d, 10 * d); ctx.closePath(); ctx.fill();
        ctx.restore(); ctx.font = `${Math.round(16 * d)}px sans-serif`; ctx.fillText('👃', ax, ay - 20 * d);
      }
    }
    // interaction hints
    if (me.hide < 0 && G.phase === 'fight') {
      let hint = null;
      const hi = nearHide(me);
      if (hi >= 0 && me.grounded) hint = op.hide === hi ? tr('game.hintSearch') : tr('game.hintHide');
      else if (nearPortal(me) >= 0 && me.grounded) hint = tr('game.hintPortal');
      else if (nearBreaker(me)) hint = tr(G.power ? 'game.hintCut' : 'game.hintFix');
      if (hint) {
        const sp = toS(cx(me), me.y + PH + 12), fs = Math.round(11 * d);
        ctx.font = `700 ${fs}px Barlow, sans-serif`;
        const label = keyLabel(KEYMAPS[G.schemes[me.char]] && KEYMAPS[G.schemes[me.char]].down[0]) + ' · ' + hint;
        const w = ctx.measureText(label).width + 14 * d;
        ctx.fillStyle = 'rgba(255,190,90,0.92)'; rr(ctx, sp.x - w / 2, sp.y - 9 * d, w, 18 * d, 3 * d); ctx.fill();
        ctx.fillStyle = '#1a1208'; ctx.fillText(label, sp.x, sp.y + 0.5 * d);
      }
    } else if (me.hide >= 0) {
      const fs = Math.round(13 * d); ctx.font = `700 ${fs}px Barlow, sans-serif`;
      ctx.fillStyle = 'rgba(255,230,200,0.8)'; ctx.fillText(tr('game.hiding'), v.w / 2, v.h - 120 * d);
    }
    // the train is coming and you are on the tracks
    if (G.train && G.train.phase === 'warn' && G.M.rail && me.y + PH > G.M.rail.top - T && G.phase === 'fight') {
      const a = 0.55 + Math.sin(t * 12) * 0.45, fs = Math.round(22 * d);
      ctx.font = `${fs}px 'Bebas Neue', Impact, sans-serif`; ctx.globalAlpha = a;
      ctx.lineWidth = 4 * d; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.strokeText(tr('game.trainWarn'), v.w / 2, v.h * 0.3);
      ctx.fillStyle = '#ff4b4b'; ctx.fillText(tr('game.trainWarn'), v.w / 2, v.h * 0.3); ctx.globalAlpha = 1;
      const g = ctx.createLinearGradient(0, v.h * 0.75, 0, v.h); g.addColorStop(0, 'rgba(255,0,0,0)'); g.addColorStop(1, `rgba(255,0,0,${0.18 * a})`);
      ctx.fillStyle = g; ctx.fillRect(0, v.h * 0.75, v.w, v.h * 0.25);
    }
    if (me.wet) {
      const g = ctx.createLinearGradient(0, 0, 0, v.h); g.addColorStop(0, 'rgba(60,140,200,0.12)'); g.addColorStop(1, 'rgba(20,60,120,0.35)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, v.w, v.h);
    }
    // screen effects
    if (me.blindT > 0) { ctx.fillStyle = `rgba(255,250,225,${Math.min(0.85, me.blindT * 0.45)})`; ctx.fillRect(0, 0, v.w, v.h); }
    const low = me.hp < 30 && G.phase === 'fight' ? (1 - me.hp / 30) : 0;
    if (low > 0 || me.hurtT > 0) {
      const a = Math.max(low * (0.45 + Math.sin(t * 6) * 0.15), me.hurtT * 1.2);
      const g = ctx.createRadialGradient(v.w / 2, v.h / 2, v.h * 0.35, v.w / 2, v.h / 2, v.h * 0.85);
      g.addColorStop(0, 'rgba(120,0,0,0)'); g.addColorStop(1, `rgba(150,0,10,${clamp(a, 0, 0.7)})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, v.w, v.h);
    }
    if (G.freeze) {
      const g = ctx.createRadialGradient(v.w / 2, v.h / 2, v.h * 0.3, v.w / 2, v.h / 2, v.h * 0.9);
      g.addColorStop(0, 'rgba(150,210,255,0)'); g.addColorStop(1, `rgba(170,220,255,${nearFire(me, 110) ? 0.12 : 0.38 + Math.sin(t * 2) * 0.05})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, v.w, v.h);
    }
    // weather / dust
    drawAmbient(ctx, v, W);
    // film grain & vignette
    const vg = ctx.createRadialGradient(v.w / 2, v.h / 2, v.h * 0.4, v.w / 2, v.h / 2, v.h * 0.95);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, v.w, v.h);
    // split-screen player label
    if (G.mode === 'local') {
      const fs = Math.round(12 * d); ctx.font = `800 ${fs}px Barlow, sans-serif`; ctx.textAlign = 'left';
      ctx.fillStyle = me.char === 'boy' ? '#8fb8ff' : '#ff9ec4';
      ctx.fillText((G.schemes[me.char] === 'p1' ? 'P1 · ' : 'P2 · ') + tr('char.' + me.char).toUpperCase(), 14 * d, v.h - 18 * d);
      ctx.textAlign = 'center';
    }
  }
  function drawAmbient(ctx, v, W) {
    const type = G.freeze ? 'snow' : G.M.theme.ambient, t = G.t, d = G.dpr;
    for (const a of G.ambient) {
      let x, y;
      if (type === 'rain') {
        x = ((a.x * v.w + t * 60 * a.sp - W.cam.x * W.z * 0.3) % v.w + v.w) % v.w; y = ((a.y + t * 1.4 * a.sp) % 1) * v.h;
        ctx.strokeStyle = 'rgba(150,180,210,0.22)'; ctx.lineWidth = d; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3 * d, y + 14 * d); ctx.stroke();
      } else if (type === 'confetti') {
        x = ((a.x * v.w + Math.sin(t * 0.8 + a.ph) * 30 * d - W.cam.x * W.z * 0.2) % v.w + v.w) % v.w; y = ((a.y + t * 0.05 * a.sp) % 1) * v.h;
        ctx.save(); ctx.translate(x, y); ctx.rotate(t * 2 * a.sp + a.ph); ctx.scale(1, Math.sin(t * 4 + a.ph));
        ctx.fillStyle = ['rgba(255,91,142,0.45)', 'rgba(255,211,107,0.45)', 'rgba(127,220,255,0.45)', 'rgba(166,255,143,0.45)'][Math.floor(a.ph) % 4];
        ctx.fillRect(-2 * d, -1 * d, 4 * d, 2 * d); ctx.restore();
      } else if (type === 'pages') {
        if (a.s < 1.2) {
          x = ((a.x * v.w + Math.sin(t * 0.3 + a.ph) * 40 * d - W.cam.x * W.z * 0.1) % v.w + v.w) % v.w; y = ((a.y - t * 0.01 * a.sp) % 1 + 1) % 1 * v.h;
          ctx.fillStyle = 'rgba(255,225,180,0.12)'; ctx.beginPath(); ctx.arc(x, y, a.s * d, 0, 7); ctx.fill();
        } else {
          // a loose page drifting through the stacks
          x = ((a.x * v.w + t * 14 * a.sp * d - W.cam.x * W.z * 0.15) % v.w + v.w) % v.w; y = ((a.y + t * 0.02 * a.sp) % 1) * v.h + Math.sin(t * 1.5 + a.ph) * 10 * d;
          ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t + a.ph) * 0.8); ctx.scale(Math.cos(t * 1.7 + a.ph), 1);
          ctx.fillStyle = 'rgba(240,225,195,0.28)'; ctx.fillRect(-4 * d, -3 * d, 8 * d, 6 * d);
          ctx.fillStyle = 'rgba(80,60,40,0.25)'; ctx.fillRect(-3 * d, -1.5 * d, 6 * d, 0.6 * d); ctx.fillRect(-3 * d, 0.5 * d, 5 * d, 0.6 * d);
          ctx.restore();
        }
      } else if (type === 'snow') {
        x = ((a.x * v.w + Math.sin(t + a.ph) * 30 * d) % v.w + v.w) % v.w; y = ((a.y + t * 0.08 * a.sp) % 1) * v.h;
        ctx.fillStyle = 'rgba(230,245,255,0.75)'; ctx.beginPath(); ctx.arc(x, y, 1.6 * a.s * d, 0, 7); ctx.fill();
      } else {
        x = ((a.x * v.w + Math.sin(t * 0.3 + a.ph) * 40 * d - W.cam.x * W.z * 0.1) % v.w + v.w) % v.w; y = ((a.y - t * 0.01 * a.sp) % 1 + 1) % 1 * v.h;
        ctx.fillStyle = type === 'flicker' ? 'rgba(200,255,235,0.10)' : 'rgba(255,225,180,0.12)'; ctx.beginPath(); ctx.arc(x, y, a.s * d, 0, 7); ctx.fill();
      }
    }
  }

  // ---------- full-screen banners (round intro, K.O.) ----------
  function drawGlobalOverlays(ctx, dt) {
    const d = G.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (G.phase === 'intro') {
      const n = Math.ceil(INTRO - G.phaseT);
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, G.ch * 0.34, G.cw, G.ch * 0.24);
      ctx.fillStyle = '#ffb35c'; ctx.font = `600 ${Math.round(18 * d)}px Barlow, sans-serif`;
      ctx.fillText(tr('game.round', { n: G.round }) + '  ·  ' + tr('map.' + G.M.id), G.cw / 2, G.ch * 0.39);
      ctx.fillStyle = '#f3e6d4'; ctx.font = `${Math.round(64 * d)}px 'Bebas Neue', Impact, sans-serif`;
      ctx.fillText(n > 0 && n <= 3 ? String(n) : tr('game.survive'), G.cw / 2, G.ch * 0.47);
      ctx.font = `600 ${Math.round(14 * d)}px Barlow, sans-serif`; ctx.fillStyle = 'rgba(243,230,212,0.7)';
      ctx.fillText(tr('game.goal'), G.cw / 2, G.ch * 0.54);
    } else if (G.phase === 'ko' || G.phase === 'over') {
      const k = Math.min(1, G.phaseT * 3), w = G.koWinner;
      ctx.fillStyle = `rgba(60,0,0,${0.45 * k})`; ctx.fillRect(0, G.ch * 0.33, G.cw, G.ch * 0.26);
      ctx.save(); ctx.translate(G.cw / 2, G.ch * 0.44); ctx.scale(1 + (1 - k) * 0.6, 1 + (1 - k) * 0.6);
      ctx.fillStyle = '#ff3b3b'; ctx.font = `${Math.round(86 * d)}px 'Bebas Neue', Impact, sans-serif`; ctx.fillText(tr('game.ko'), 0, 0);
      ctx.restore();
      if (w) {
        ctx.fillStyle = '#f3e6d4'; ctx.font = `700 ${Math.round(18 * d)}px Barlow, sans-serif`;
        ctx.fillText(tr('game.roundTo', { who: G.names[w] || tr('char.' + w) }) + '   ' + G.score.boy + ' — ' + G.score.girl, G.cw / 2, G.ch * 0.54);
      }
    } else if (G.phase === 'wait') {
      ctx.fillStyle = 'rgba(243,230,212,0.8)'; ctx.font = `600 ${Math.round(15 * d)}px Barlow, sans-serif`; ctx.fillText(tr('game.waitHost'), G.cw / 2, G.ch * 0.5);
    }
    for (let i = banners.length - 1; i >= 0; i--) {
      const b = banners[i]; b.t += dt;
      if (b.t > 2.4) { banners.splice(i, 1); continue; }
      const a = Math.min(1, b.t * 5, (2.4 - b.t) * 2.5);
      ctx.globalAlpha = a; ctx.font = `${Math.round(30 * d)}px 'Bebas Neue', Impact, sans-serif`;
      ctx.lineWidth = 4 * d; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.strokeText(b.text, G.cw / 2, G.ch * 0.22 + i * 34 * d);
      ctx.fillStyle = b.color; ctx.fillText(b.text, G.cw / 2, G.ch * 0.22 + i * 34 * d);
      ctx.globalAlpha = 1;
    }
  }

  // =====================================================================
  //  Menu scene: a swinging bulb, two survivors circling each other
  // =====================================================================
  const menuP = { boy: makePlayer('boy'), girl: makePlayer('girl') };
  function renderMenu(dt) {
    const ctx = G.ctx; G.menuT += dt; G.t += dt;
    const t = G.menuT, W = G.cw, H = G.ch, d = G.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0a0b10'); g.addColorStop(1, '#17110d');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const z = Math.max(2, H / (9 * T)), groundY = H * 0.86, cxm = W / 2;
    // floor
    ctx.fillStyle = '#2a1f17'; ctx.fillRect(0, groundY, W, H - groundY);
    ctx.fillStyle = '#3d2d20'; ctx.fillRect(0, groundY, W, 4 * z);
    // timeline: bite → slap → İskender → sandwich → flash → potato
    const ph = Math.floor(t / 3.2) % 6, pt = t % 3.2;
    const b = menuP.boy, gl = menuP.girl;
    for (const p of [b, gl]) { p.grounded = true; p.blinkT -= dt; if (p.blinkT < -0.12) p.blinkT = 2 + Math.random() * 3; p.act = null; p.atkKind = null; p.hurtT = 0; p.shineT = 0; p.castT = 0; p.blindT = 0; p.stunT = 0; p.vx = 0; }
    const gap = 30 + Math.sin(t * 0.8) * 4;
    b.x = -gap - PW / 2; gl.x = gap - PW / 2; b.y = gl.y = -PH; b.face = 1; gl.face = -1;
    if (ph === 0) { const k = pt % 1.6; if (k < 0.36) { b.atkKind = 'bite'; b.atkT = k; b.atkDur = 0.36; b.x += Math.sin(k / 0.36 * Math.PI) * 10; } if (k > 0.13 && k < 0.5) gl.hurtT = 0.5 - k; }
    else if (ph === 1) { const k = pt % 1.2; if (k < 0.3) { gl.atkKind = 'slap'; gl.atkT = k; gl.atkDur = 0.3; } if (k > 0.1 && k < 0.45) b.hurtT = 0.45 - k; }
    else if (ph === 2) { b.act = 'eat'; b.actT = pt; const k = C.sipPhase(pt); if (k > 0.9) { b.sipped = true; b.chewT = 0.8; } else if (k < 0.1) b.sipped = false; b.chewT = Math.max(0, b.chewT - dt); }
    else if (ph === 3) { gl.act = 'sandwich'; gl.actT = pt; const k = C.sipPhase(pt); if (k > 0.9) { gl.sipped = true; gl.chewT = 0.8; } else if (k < 0.1) gl.sipped = false; gl.chewT = Math.max(0, gl.chewT - dt); }
    else if (ph === 4) { gl.shineT = pt < 1.4 ? C.SHINE_DUR - pt : 0; gl.castT = pt < 0.6 ? 0.6 : 0; if (pt > 0.3 && pt < 2.6) b.blindT = 1; }
    else { gl.castT = pt < 0.9 ? 0.9 - pt : 0; b.morphT = pt > 0.3 ? Math.max(0.01, C.MORPH_DUR - (pt - 0.3) * (C.MORPH_DUR / 2.8)) : 0; b.morphForm = b.morphT > 0 ? (b.morphT > C.MORPH_DUR / 2 ? 'tangerine' : 'potato') : null; }
    if (ph !== 5) { b.morphForm = null; b.morphT = 0; }
    // swinging bulb light
    const sw = Math.sin(t * 1.3) * 0.35, lx = cxm + Math.sin(sw) * 120 * z * 0.5, ly = groundY - 70 * z + Math.cos(sw) * 30 * z;
    const flick = (Math.sin(t * 17) + Math.sin(t * 5.3)) > 1.7 || (ph === 4 && pt > 2.6 && pt < 2.9) ? 0.25 : 1;
    ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 1.5 * d; ctx.beginPath(); ctx.moveTo(cxm, 0); ctx.lineTo(lx, ly); ctx.stroke();
    ctx.setTransform(z, 0, 0, z, cxm, groundY);
    C.draw(ctx, b, t); C.draw(ctx, gl, t);
    if (ph === 4 && pt < 1.4) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const e = 1 - pt / 1.4; const fg = ctx.createRadialGradient(gl.x + PW / 2, -20, 0, gl.x + PW / 2, -20, 90); fg.addColorStop(0, `rgba(255,250,210,${e})`); fg.addColorStop(1, 'rgba(255,240,190,0)'); ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(gl.x + PW / 2, -20, 90, 0, 7); ctx.fill(); ctx.restore(); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // darkness with the bulb's pool of light
    const D = darkCanvas(3, W, H), dx = D.x;
    dx.setTransform(1, 0, 0, 1, 0, 0); dx.globalCompositeOperation = 'source-over'; dx.clearRect(0, 0, W, H);
    dx.fillStyle = 'rgba(3,4,9,0.93)'; dx.fillRect(0, 0, W, H);
    dx.globalCompositeOperation = 'destination-out';
    const R = 150 * z * flick, lg = dx.createRadialGradient(lx, ly + 20 * z, 0, lx, ly + 20 * z, R);
    lg.addColorStop(0, 'rgba(0,0,0,1)'); lg.addColorStop(0.55, 'rgba(0,0,0,0.75)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
    dx.fillStyle = lg; dx.beginPath(); dx.arc(lx, ly + 20 * z, R, 0, 7); dx.fill();
    ctx.drawImage(D.c, 0, 0);
    ctx.fillStyle = flick > 0.5 ? '#ffe7a8' : '#5a5040'; ctx.beginPath(); ctx.arc(lx, ly, 5 * z * 0.6, 0, 7); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const wg = ctx.createRadialGradient(lx, ly, 0, lx, ly, 110 * z * flick); wg.addColorStop(0, 'rgba(255,196,120,0.18)'); wg.addColorStop(1, 'rgba(255,196,120,0)');
    ctx.fillStyle = wg; ctx.beginPath(); ctx.arc(lx, ly, 110 * z, 0, 7); ctx.fill(); ctx.restore();
    // speech for the food phases
    if ((ph === 2 || ph === 3) && pt > 0.2 && pt < 3) {
      const who = ph === 2 ? b : gl, fs = Math.round(Math.max(13, 6 * z));
      ctx.font = `600 ${fs}px Barlow, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.globalAlpha = Math.min(1, (pt - 0.2) * 4, (3 - pt) * 4);
      bubble(ctx, cxm + (who.x + PW / 2) * z, groundY + (who.y - 14) * z, [tr(ph === 2 ? 'act.eat' : 'act.sandwich')], fs, W);
      ctx.globalAlpha = 1;
    }
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }

  // =====================================================================
  //  Loop
  // =====================================================================
  let last = 0, acc = 0;
  function frame(ts) {
    global.requestAnimationFrame(frame);
    const dt = Math.min(0.1, (ts - last) / 1000 || 0); last = ts;
    resize();
    if (G.state === 'play' && G.M) {
      if (!(G.paused && G.mode === 'local')) {
        acc += dt;
        let n = 0;
        while (acc >= DT && n < 14) { step(DT); acc -= DT; n++; }
        if (n >= 14) acc = 0;
      }
      netTick(dt);
      render(dt);
      G.hudAcc += dt;
      if (G.hudAcc > 0.1 && G.hooks.hud) { G.hudAcc = 0; G.hooks.hud(hudState()); }
    } else {
      renderMenu(dt);
    }
  }
  function hudState() {
    const pl = {};
    for (const ch of ['boy', 'girl']) {
      const p = G.players[ch], sc = KEYMAPS[G.schemes[ch]] || null;
      pl[ch] = {
        hp: p.hp, local: p.local, inv: p.inv, hide: p.hide >= 0,
        slots: SLOTS[ch].map(([s, icon]) => ({ s, icon, cd: p.cd[s], max: (ATK[ch][s] && ATK[ch][s].cd) || SKILL_CD[ch][s], key: sc ? keyLabel(sc[s][0]) : '' })),
        foodKeys: sc ? sc.food.map(keyLabel) : [],
        status: { bleed: p.bleedT > 0, stun: p.stunT > 0 || p.trapT > 0, blind: p.blindT > 0, invis: p.invisT > 0, fast: p.speedT > 0, conf: p.confT > 0, morph: !!p.morphForm, bride: p.bridalT > 0, hidden: p.hide >= 0, caged: ch === 'boy' && !!G.cage, mat: p.matT > 0 },
      };
    }
    return { round: G.round, bestOf: G.bestOf, score: G.score, timeLeft: Math.max(0, ROUND_TIME - G.roundT), freeze: G.freeze, power: G.power, phase: G.phase, players: pl, ping: G.ping };
  }

  function init(canvas) {
    G.canvas = canvas; G.ctx = canvas.getContext('2d');
    resize();
    global.addEventListener('keydown', onKeyDown);
    global.addEventListener('keyup', onKeyUp);
    global.addEventListener('blur', () => G.keys.clear());
    initAmbient();
    global.requestAnimationFrame(frame);
  }

  // lobby card previews: each character shows off their moves
  function drawPreview(canvas, char, t) {
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const p = makePlayer(char);
    p.face = char === 'boy' ? 1 : -1; p.grounded = true;
    p.blinkT = (Math.sin(t * 0.7 + (char === 'boy' ? 0 : 2)) > 0.97) ? -0.05 : 1;
    const ph = Math.floor(t / 2.4) % 3, k = t % 2.4;
    if (char === 'boy') {
      if (ph === 0 && k < 0.36) { p.atkKind = 'bite'; p.atkT = k; p.atkDur = 0.36; }
      else if (ph === 1) { p.act = 'eat'; p.actT = k; }
      else if (ph === 2 && k < 0.42) { p.atkKind = 'lunge'; p.atkT = k; p.atkDur = 0.42; }
    } else {
      if (ph === 0 && k < 0.3) { p.atkKind = 'slap'; p.atkT = k; p.atkDur = 0.3; }
      else if (ph === 1) { p.act = 'sandwich'; p.actT = k; }
      else if (ph === 2 && k < 0.34) { p.atkKind = 'slipper'; p.atkT = k; p.atkDur = 0.34; }
    }
    p.x = -PW / 2; p.y = -PH;
    const s = canvas.height / 60;
    ctx.setTransform(s, 0, 0, s, canvas.width / 2, canvas.height * 0.86);
    const lg = ctx.createRadialGradient(0, -30, 0, 0, -30, 34); lg.addColorStop(0, 'rgba(255,190,110,0.28)'); lg.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(0, -30, 34, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, 0, 14, 3, 0, 0, 7); ctx.fill();
    C.draw(ctx, p, t);
  }
  // tiny map thumbnails for the arena screen
  function drawThumb(canvas, i) {
    const M = Maps.buildMap(i), ctx = canvas.getContext('2d'), s = Math.min(canvas.width / M.W, canvas.height / M.H);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    const oxx = (canvas.width - M.W * s) / 2, oyy = (canvas.height - M.H * s) / 2;
    for (let y = 0; y < M.H; y++) for (let x = 0; x < M.W; x++) {
      const c = M.grid[y][x];
      if (c === '#') ctx.fillStyle = M.theme.solidTop; else if (c === '=') ctx.fillStyle = M.theme.ledge; else if (c === '|') ctx.fillStyle = M.theme.ladder; else continue;
      ctx.fillRect(oxx + x * s, oyy + y * s, Math.ceil(s), c === '=' ? Math.max(1, s * 0.35) : Math.ceil(s));
    }
    const dot = (x, y, col, r) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(oxx + x / T * s, oyy + y / T * s, r * s, 0, 7); ctx.fill(); };
    for (const l of M.lamps) dot(l.x, l.y, 'rgba(255,210,130,0.9)', 0.4);
    for (const f of M.fires) dot(f.x, f.y - 8, '#ff7a2e', 0.6);
    for (const h of M.hides) { ctx.fillStyle = 'rgba(160,120,80,0.9)'; ctx.fillRect(oxx + (h.x / T - 0.4) * s, oyy + (h.y / T - 1.4) * s, 0.8 * s, 1.4 * s); }
    if (M.water) { ctx.fillStyle = 'rgba(60,140,210,0.5)'; ctx.fillRect(oxx + M.water.x0 / T * s, oyy + M.water.top / T * s, (M.water.x1 - M.water.x0) / T * s, (M.water.bottom - M.water.top) / T * s); }
    for (const th of M.thin) { ctx.fillStyle = 'rgba(200,235,255,0.95)'; ctx.fillRect(oxx + th.tx * s, oyy + th.ty * s, Math.ceil(s), Math.max(1, s * 0.5)); }
    if (M.rail) { ctx.fillStyle = 'rgba(255,80,80,0.55)'; ctx.fillRect(oxx + s, oyy + (M.rail.top / T + 1.2) * s, (M.W - 2) * s, 0.7 * s); }
    for (const pd of M.pads) dot(pd.x, pd.y - 4, '#ff7ad9', 0.5);
    for (const po of M.portals) { ctx.fillStyle = po.col; ctx.fillRect(oxx + (po.x / T - 0.45) * s, oyy + (po.y / T - 1.8) * s, 0.9 * s, 1.8 * s); }
    dot(M.spawn.boy.x, M.spawn.boy.y - 12, '#4f8ff0', 0.6); dot(M.spawn.girl.x, M.spawn.girl.y - 12, '#ff7aa8', 0.6);
  }

  global.Game = {
    init, startMatch, stop, onNet, drawPreview, drawThumb,
    act(ch, kind) { return startAct(ch, kind, true); },
    magic(ch) { const p = G.players && G.players[ch]; return p ? useSkill(p, 'magic') : false; },
    say(ch, i) { if (G.players) sayPhrase(ch, i, true); },
    chat(ch, text) { if (G.players) chatSay(ch, text, true); },
    setTyping(ch, on) { if (G.players) setTyping(ch, on, G.mode === 'online'); },
    kiss(ch) { if (G.players) requestKiss(ch, true); },
    get mode() { return G.mode; },
    get myChar() { return G.myChar; },
    setHooks(h) { Object.assign(G.hooks, h); },
    setPaused(v) { G.paused = !!v; G.keys.clear(); },
    setPing(ms) { G.ping = ms; },
    get state() { return G.state; },
    get phase() { return G.phase; },
    get map() { return G.M; },
    KEYMAPS, SLOTS, FOODS, FOOD_ICON, keyLabel, NSWEET, NTAUNT,
    _G: G, _step: step, _render: render,
  };
})(typeof window !== 'undefined' ? window : globalThis);
