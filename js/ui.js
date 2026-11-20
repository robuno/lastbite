/* Last Bite — menus, lobby (room codes), survivor select, arenas, duel HUD, results. */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const Maps = window.Maps, Game = window.Game, Net = window.Net, Sfx = window.Sfx, I18N = window.I18N;
  const t = (k, v) => I18N.t(k, v);

  const RIVAL_KEY = 'lastbite.rivalry.v1';
  const NAME_KEY = 'lastbite.name';

  const App = {
    mode: null, // 'online' | 'local'
    role: null, // 'host' | 'guest'
    myChar: null,
    name: '', partnerName: '',
    lobby: { boy: null, girl: null }, // online: 'host'|'guest'; local: 'p1'|'p2'
    screen: 'menu', pingTimer: null, map: 0, bestOf: 3, rival: { boy: 0, girl: 0 }, chatWho: 'girl',
  };

  // ---------------- rivalry tally ----------------
  function loadRival() {
    try { const r = JSON.parse(localStorage.getItem(RIVAL_KEY)); if (r && typeof r.boy === 'number') return r; } catch (e) { /* ignore */ }
    return { boy: 0, girl: 0 };
  }
  function saveRival() { try { localStorage.setItem(RIVAL_KEY, JSON.stringify(App.rival)); } catch (e) { /* ignore */ } }
  function renderRival() { $('#menu-rivalry').textContent = App.rival.boy + App.rival.girl ? t('menu.rivalry', { b: App.rival.boy, g: App.rival.girl }) : ''; }

  // ---------------- helpers ----------------
  function show(id) {
    App.screen = id;
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === 'scr-' + id));
    $('#hud').classList.toggle('hidden', id !== 'game');
    document.body.classList.toggle('in-game', id === 'game');
    if (id !== 'game') closeModals();
    if (id === 'menu') renderRival();
  }
  function toast(msg, kind) {
    const el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => el.classList.add('out'), 3200);
    setTimeout(() => el.remove(), 3700);
  }
  function fmtTime(s) { const m = Math.floor(s / 60), r = Math.floor(s % 60); return m + ':' + String(r).padStart(2, '0'); }
  function openModal(id) { closeModals(); $('#' + id).classList.remove('hidden'); }
  function closeModals() { $$('.modal').forEach(m => m.classList.add('hidden')); Game.setPaused(false); }
  function modalOpen() { return $$('.modal').some(m => !m.classList.contains('hidden')); }
  function click() { Sfx.play('click'); }
  function charName(ch) { return t('char.' + ch); }
  function myName() { return (App.name || '').trim() || (App.myChar ? charName(App.myChar) : 'Player'); }

  // ---------------- menu ----------------
  function initMenu() {
    App.rival = loadRival();
    try { App.name = localStorage.getItem(NAME_KEY) || ''; } catch (e) { App.name = ''; }
    $('#in-name').value = App.name;
    $('#in-name').addEventListener('input', (e) => { App.name = e.target.value.slice(0, 14); try { localStorage.setItem(NAME_KEY, App.name); } catch (er) { /* ignore */ } });

    $('#btn-host').onclick = () => { click(); Sfx.ensure(); hostRoom(); };
    $('#btn-join').onclick = () => { click(); Sfx.ensure(); show('join'); setTimeout(() => $('#in-code').focus(), 50); };
    $('#btn-local').onclick = () => { click(); Sfx.ensure(); startLocal(); };
    $('#btn-help').onclick = () => { click(); openModal('mdl-help'); };
    $$('[data-back]').forEach(b => b.onclick = () => { click(); Net.leave(); show('menu'); });
    $('#btn-join-go').onclick = () => { click(); joinRoom($('#in-code').value); };
    $('#in-code').addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5); });
    $('#in-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') joinRoom($('#in-code').value); });
    $$('[data-close]').forEach(b => b.onclick = () => { click(); closeModals(); });

    const q = new URLSearchParams(location.search).get('room');
    if (q) {
      $('#in-code').value = q.toUpperCase().slice(0, 5);
      show('join');
      $('#join-status').textContent = t('join.invite');
    }
  }

  // ---------------- online: host / join ----------------
  function requirePeer() {
    if (!Net.available()) { toast(t('toast.noPeer'), 'err'); return false; }
    return true;
  }
  function hostRoom() {
    if (!requirePeer()) return;
    App.mode = 'online'; App.role = 'host'; App.lobby = { boy: null, girl: null }; App.partnerName = ''; App.myChar = null;
    show('lobby'); renderLobby();
    $('#room-code').textContent = '·····';
    $('#lobby-status').textContent = t('lobby.creating');
    wireNet();
    Net.host();
  }
  function joinRoom(code) {
    code = (code || '').toUpperCase().trim();
    if (code.length < 5) { $('#join-status').textContent = t('join.short'); return; }
    if (!requirePeer()) return;
    App.mode = 'online'; App.role = 'guest'; App.lobby = { boy: null, girl: null }; App.partnerName = ''; App.myChar = null;
    $('#join-status').textContent = t('join.connecting');
    wireNet();
    Net.join(code);
  }

  function wireNet() {
    Net.on('ready', (code) => {
      $('#room-code').textContent = code;
      $('#lobby-status').innerHTML = t('lobby.send') + ' <span class="dots"></span>';
    });
    Net.on('connected', () => {
      Sfx.play('pickup');
      if (App.role === 'guest') {
        Net.send({ t: 'hello', name: App.name });
        show('lobby'); renderLobby();
        $('#room-code').textContent = Net.code;
        $('#lobby-status').textContent = t('lobby.connected');
      } else {
        $('#lobby-status').textContent = t('lobby.joined');
      }
      startPing();
    });
    Net.on('data', onData);
    Net.on('disconnected', () => {
      stopPing();
      toast(t('toast.disc'), 'err');
      if (App.role === 'host') {
        App.lobby = { boy: App.lobby.boy === 'host' ? 'host' : null, girl: App.lobby.girl === 'host' ? 'host' : null };
        App.partnerName = '';
        Game.stop(); show('lobby'); renderLobby();
        $('#lobby-status').innerHTML = t('lobby.rejoin') + ' <span class="dots"></span>';
      } else {
        Game.stop(); Net.leave(); show('menu');
      }
    });
    Net.on('error', (e) => {
      const msg = (e && e.message) || t('toast.conn');
      if (App.screen === 'join') $('#join-status').textContent = msg;
      else toast(msg, 'err');
      if (App.role === 'host' && App.screen === 'lobby' && !Net.connected()) $('#lobby-status').textContent = t('lobby.fail', { msg });
    });
  }
  function startPing() { stopPing(); App.pingTimer = setInterval(() => Net.send({ t: 'ping', ts: Date.now() }), 2000); }
  function stopPing() { if (App.pingTimer) clearInterval(App.pingTimer); App.pingTimer = null; }

  function onData(m) {
    if (!m || typeof m !== 'object') return;
    switch (m.t) {
      case 'hello':
        if (App.role !== 'host') return;
        App.partnerName = String(m.name || '').slice(0, 14);
        Net.send({ t: 'welcome', name: App.name });
        broadcastLobby();
        break;
      case 'welcome': App.partnerName = String(m.name || '').slice(0, 14); renderLobby(); break;
      case 'lobby': if (App.role !== 'guest') return; App.lobby = m.lobby; applyLobby(); renderLobby(); break;
      case 'pick': if (App.role === 'host') hostAssign('guest', m.char); break;
      case 'nav': if (App.role === 'guest') doNav(m); break;
      case 'req': if (App.role === 'host') handleReq(m); break;
      case 'ping': Net.send({ t: 'pong', ts: m.ts }); break;
      case 'pong': Game.setPing(Date.now() - m.ts); break;
      case 'full': toast(t('toast.full'), 'err'); Net.leave(); show('menu'); break;
      default: Game.onNet(m);
    }
  }

  // ---------------- lobby ----------------
  function applyLobby() {
    if (App.mode === 'online') { const me = App.role; App.myChar = App.lobby.boy === me ? 'boy' : App.lobby.girl === me ? 'girl' : null; }
  }
  function hostAssign(who, char) {
    if (char !== 'boy' && char !== 'girl') return;
    if (App.lobby[char] && App.lobby[char] !== who) { if (who === 'host') toast(t('toast.taken')); return; }
    const otherC = char === 'boy' ? 'girl' : 'boy';
    if (App.lobby[otherC] === who) App.lobby[otherC] = null;
    App.lobby[char] = who;
    broadcastLobby();
  }
  function broadcastLobby() { Net.send({ t: 'lobby', lobby: App.lobby }); applyLobby(); renderLobby(); }
  function startLocal() {
    App.mode = 'local'; App.role = null;
    App.lobby = { boy: 'p1', girl: 'p2' };
    show('lobby'); renderLobby();
  }
  function renderLobby() {
    const online = App.mode === 'online';
    $('#lobby-online').style.display = online ? '' : 'none';
    $('#lobby-local').style.display = online ? 'none' : '';
    $$('.char-card').forEach(card => {
      const ch = card.dataset.char, owner = App.lobby[ch];
      let label = '';
      card.classList.remove('mine', 'theirs');
      if (online) {
        if (owner === App.role) { label = t('lobby.you') + (App.name ? ' · ' + App.name : ''); card.classList.add('mine'); }
        else if (owner) { label = App.partnerName || t('lobby.partner'); card.classList.add('theirs'); }
        else label = t('lobby.pick');
      } else {
        label = owner === 'p1' ? t('lobby.p1') : t('lobby.p2');
        card.classList.add(owner === 'p1' ? 'mine' : 'theirs');
      }
      card.querySelector('.char-owner').textContent = label;
    });
    const ready = online ? (App.lobby.boy && App.lobby.girl && Net.connected()) : true;
    const btn = $('#btn-lobby-go');
    btn.disabled = !ready;
    btn.textContent = online && App.role === 'guest' ? t('lobby.openMap') : t('lobby.choose');
    if (online && Net.connected() && !ready) $('#lobby-status').textContent = t('lobby.bothPick');
    else if (online && ready) $('#lobby-status').textContent = App.partnerName ? t('lobby.ready', { who: App.partnerName }) : t('lobby.readyAnon');
  }
  function initLobby() {
    $$('.char-card').forEach(card => {
      card.onclick = () => {
        click();
        const ch = card.dataset.char;
        if (App.mode === 'local') { App.lobby = ch === 'boy' ? { boy: 'p1', girl: 'p2' } : { boy: 'p2', girl: 'p1' }; renderLobby(); }
        else if (App.role === 'host') hostAssign('host', ch);
        else Net.send({ t: 'pick', char: ch });
      };
    });
    $('#btn-lobby-go').onclick = () => { click(); request({ to: 'arena' }); };
    $('#btn-lobby-leave').onclick = () => { click(); leaveAll(); };
    $('#btn-copy-code').onclick = () => copy(Net.code || $('#room-code').textContent, t('toast.codeCopied'));
    $('#btn-copy-link').onclick = () => copy(location.origin + location.pathname + '?room=' + (Net.code || ''), t('toast.linkCopied'));
    const previews = $$('.char-card canvas');
    const loop = (ts) => {
      requestAnimationFrame(loop);
      if (App.screen === 'lobby') previews.forEach(c => Game.drawPreview(c, c.parentElement.dataset.char, ts / 1000));
      if (!$('#mdl-result').classList.contains('hidden') && App.lastWinner) Game.drawPreview($('#result-avatar'), App.lastWinner, ts / 1000);
    };
    requestAnimationFrame(loop);
  }
  function copy(text, msg) {
    const done = () => toast(msg);
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
    else fallbackCopy(text, done);
  }
  function fallbackCopy(text, done) {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { toast(text); }
    ta.remove();
  }
  function leaveAll() {
    stopPing(); Game.stop(); Net.leave();
    App.mode = null; App.role = null; App.myChar = null;
    show('menu');
  }

  // ---------------- navigation (host is authoritative online) ----------------
  function request(m) {
    if (App.mode === 'online' && App.role === 'guest') { Net.send(Object.assign({ t: 'req' }, m)); return; }
    if (App.mode === 'online') {
      if (m.to === 'match' && !(App.lobby.boy && App.lobby.girl)) { toast(t('toast.needChars')); return; }
      Net.send(Object.assign({ t: 'nav' }, m));
    }
    doNav(m);
  }
  function handleReq(m) {
    if (!['arena', 'match', 'lobby'].includes(m.to)) return;
    request({ to: m.to, map: Math.max(0, Math.min(Maps.MAPS.length - 1, m.map | 0)), best: m.best === 5 ? 5 : 3 });
  }
  function doNav(m) {
    if (m.to === 'arena') { Game.stop(); show('arena'); renderArena(); }
    else if (m.to === 'match') startMatch(m.map | 0, m.best === 5 ? 5 : 3);
    else if (m.to === 'lobby') { Game.stop(); show('lobby'); renderLobby(); }
  }

  // ---------------- arena select ----------------
  function renderArena() {
    $$('#rounds .seg').forEach(b => b.classList.toggle('active', +b.dataset.best === App.bestOf));
    const grid = $('#arena-grid');
    grid.innerHTML = '';
    Maps.MAPS.forEach((def, i) => {
      const M = Maps.buildMap(i);
      const card = document.createElement('div');
      card.className = 'arena-card theme-' + def.id + (i === App.map ? ' last' : '');
      card.innerHTML = `<canvas width="360" height="140"></canvas>
        <div class="arena-body">
          <h3><span class="ai">${def.icon}</span>${t('map.' + def.id)}</h3>
          <p>${t('mapd.' + def.id)}</p>
          <div class="arena-tags"><span>${t('arena.hides', { n: M.hides.length })}</span><span>${t('arena.lamps', { n: M.lamps.length + M.fires.length })}</span><span>${t('arena.foods', { n: M.foods.length })}</span>${t('mapf.' + def.id) !== 'mapf.' + def.id ? `<span class="feat">${t('mapf.' + def.id)}</span>` : ''}</div>
          <button class="btn primary small">${t('arena.fight')}</button>
        </div>`;
      Game.drawThumb(card.querySelector('canvas'), i);
      card.querySelector('button').onclick = () => { click(); App.map = i; request({ to: 'match', map: i, best: App.bestOf }); };
      grid.appendChild(card);
    });
    $('#arena-note').textContent = t(App.mode === 'online' ? (App.role === 'host' ? 'arena.noteHost' : 'arena.noteGuest') : 'arena.noteLocal');
  }
  function initArena() {
    $('#btn-arena-back').onclick = () => { click(); request({ to: 'lobby' }); };
    $$('#rounds .seg').forEach(b => b.onclick = () => { click(); App.bestOf = +b.dataset.best; renderArena(); });
  }

  // ---------------- the match ----------------
  function startMatch(map, best) {
    App.map = map; App.bestOf = best;
    let schemes, myChar;
    if (App.mode === 'online') { applyLobby(); myChar = App.myChar || 'boy'; schemes = { [myChar]: 'solo' }; }
    else { myChar = 'boy'; schemes = { boy: App.lobby.boy === 'p1' ? 'p1' : 'p2', girl: App.lobby.girl === 'p1' ? 'p1' : 'p2' }; }
    const partner = myChar === 'boy' ? 'girl' : 'boy';
    const names = App.mode === 'online' ? { [myChar]: myName(), [partner]: App.partnerName || charName(partner) } : { boy: charName('boy'), girl: charName('girl') };
    App.names = names;
    document.body.classList.toggle('local-mode', App.mode === 'local');
    show('game');
    Game.startMatch({ mode: App.mode, myChar, schemes, names, net: App.mode === 'online' ? Net : null, map, bestOf: best, music: Sfx.musicOn });
    buildSkillbars();
    $('#hpn-boy').textContent = names.boy; $('#hpn-girl').textContent = names.girl;
    const h = $('#hud-hint'); h.textContent = t(App.mode === 'online' ? 'hint.online' : 'hint.local'); h.classList.remove('fade'); void h.offsetWidth; h.classList.add('fade');
    App.chatWho = App.mode === 'online' ? myChar : 'girl';
    $('#chat-in').value = '';
    renderChat();
  }

  // ---------------- HUD ----------------
  const skillEls = { boy: null, girl: null };
  function buildSkillbars() {
    const online = App.mode === 'online';
    const leftCh = online ? Game.myChar : (App.lobby.boy === 'p1' ? 'boy' : 'girl');
    const rightCh = leftCh === 'boy' ? 'girl' : 'boy';
    const mk = (el, ch) => {
      el.innerHTML = '';
      el.className = 'skillbar ' + (el.id === 'skills-left' ? 'left ' : 'right ') + ch;
      const slots = Game.SLOTS[ch].map(([s, icon]) => {
        const d = document.createElement('div');
        d.className = 'slot' + (s[0] === 'a' ? ' atk' : s === 'magic' ? ' magic' : '');
        d.innerHTML = `<span class="ic">${icon}</span><span class="cd"></span><kbd></kbd>`;
        el.appendChild(d); return d;
      });
      const sep = document.createElement('div'); sep.className = 'sep'; el.appendChild(sep);
      const foods = Game.FOODS.map((f) => {
        const d = document.createElement('div');
        d.className = 'slot food';
        d.innerHTML = `<span class="ic">${Game.FOOD_ICON[f]}</span><b class="cnt">0</b><kbd></kbd>`;
        el.appendChild(d); return d;
      });
      skillEls[ch] = { slots, foods };
    };
    mk($('#skills-left'), leftCh);
    if (online) { $('#skills-right').classList.add('hidden'); skillEls[rightCh] = null; }
    else { $('#skills-right').classList.remove('hidden'); mk($('#skills-right'), rightCh); }
  }
  const STATUS_ICON = { bleed: '🩸', stun: '💫', blind: '😵', invis: '👻', fast: '🍵', conf: '💃', morph: '🥔', bride: '👰', hidden: '🚪', caged: '🔒', mat: '🧘', shock: '⚡' };
  let lastPips = '';
  function renderHud(h) {
    for (const ch of ['boy', 'girl']) {
      const p = h.players[ch], card = $('#hp-' + ch), pct = Math.max(0, Math.min(100, p.hp));
      card.querySelector('.fill').style.width = pct + '%';
      card.querySelector('.ghost').style.width = pct + '%';
      card.querySelector('.num').textContent = Math.ceil(p.hp);
      card.classList.toggle('low', pct < 30);
      // online: hide what the rival is doing unless it is visible anyway
      const st = p.status, show = App.mode === 'local' || p.local;
      $('#hps-' + ch).textContent = Object.keys(STATUS_ICON).filter(k => st[k] && (show || ['bleed', 'stun', 'morph', 'bride', 'blind', 'caged', 'mat'].includes(k))).map(k => STATUS_ICON[k]).join(' ');
      const els = skillEls[ch];
      if (els) {
        p.slots.forEach((s, i) => {
          const d = els.slots[i]; if (!d) return;
          const f = s.max ? Math.min(1, s.cd / s.max) : 0;
          d.style.setProperty('--cd', f.toFixed(3));
          d.classList.toggle('ready', s.cd <= 0);
          d.querySelector('.cd').textContent = s.cd > 0.95 ? Math.ceil(s.cd) : '';
          d.querySelector('kbd').textContent = s.key;
        });
        Game.FOODS.forEach((f, i) => {
          const d = els.foods[i]; d.querySelector('.cnt').textContent = p.inv[f] || 0;
          d.classList.toggle('empty', !p.inv[f]);
          d.querySelector('kbd').textContent = p.foodKeys[i] || '';
        });
      }
    }
    $('#hud-round').textContent = t('hud.round', { n: h.round });
    $('#score-boy').textContent = h.score.boy; $('#score-girl').textContent = h.score.girl;
    const need = h.bestOf === 5 ? 3 : 2, key = h.score.boy + '|' + h.score.girl + '|' + need;
    if (key !== lastPips) {
      lastPips = key;
      let s = '';
      for (let i = 0; i < need; i++) s += `<i class="pip boy ${i < h.score.boy ? 'on' : ''}"></i>`;
      s += '<i class="pip-sep"></i>';
      for (let i = need - 1; i >= 0; i--) s += `<i class="pip girl ${i < h.score.girl ? 'on' : ''}"></i>`;
      $('#hud-pips').innerHTML = s;
    }
    const timer = $('#hud-timer');
    timer.textContent = h.freeze ? t('hud.freeze') : fmtTime(h.timeLeft);
    timer.classList.toggle('freeze', h.freeze);
    timer.classList.toggle('warn', !h.freeze && h.timeLeft < 15);
    $('#hud-power').textContent = h.power ? '' : t('hud.powerOff');
    $('#hud-ping').textContent = App.mode === 'online' && h.ping != null ? h.ping + ' ms' : '';
  }
  function initHud() {
    Game.setHooks({ hud: renderHud, matchEnd: onMatchEnd });
    $('#btn-pause').onclick = () => { click(); togglePause(); };
    const syncAudioBtns = () => { $('#btn-music').classList.toggle('off', !Sfx.musicOn); $('#btn-sfx').classList.toggle('off', !Sfx.sfxOn); };
    $('#btn-music').onclick = () => { Sfx.ensure(); Sfx.setMusic(!Sfx.musicOn); if (Sfx.musicOn) Sfx.startMusic(Game.map ? Game.map.theme.music : 0); syncAudioBtns(); };
    $('#btn-sfx').onclick = () => { Sfx.setSfx(!Sfx.sfxOn); syncAudioBtns(); click(); };
    syncAudioBtns();
    $('#btn-resume').onclick = () => { click(); closeModals(); };
    $('#btn-restart').onclick = () => { click(); closeModals(); request({ to: 'match', map: App.map, best: App.bestOf }); };
    $('#btn-toarena').onclick = () => { click(); closeModals(); request({ to: 'arena' }); };
    $('#btn-pause-help').onclick = () => { click(); openModal('mdl-help'); Game.setPaused(true); };
    $('#btn-leave').onclick = () => { click(); closeModals(); leaveAll(); };
    $('#btn-rematch').onclick = () => { click(); closeModals(); request({ to: 'match', map: App.map, best: App.bestOf }); };
    $('#btn-result-arena').onclick = () => { click(); closeModals(); request({ to: 'arena' }); };
    $('#btn-result-lobby').onclick = () => { click(); closeModals(); request({ to: 'lobby' }); };
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (App.screen === 'game' && Game.phase !== 'over') { e.preventDefault(); togglePause(); }
        else if (modalOpen() && $('#mdl-result').classList.contains('hidden')) closeModals();
      }
    });
  }
  function togglePause() {
    if (modalOpen()) { if ($('#mdl-result').classList.contains('hidden')) closeModals(); return; }
    openModal('mdl-pause');
    $('#pause-note').textContent = t(App.mode === 'online' ? 'pause.online' : 'pause.local');
    Game.setPaused(true);
  }
  function onMatchEnd(res) {
    App.rival[res.winner]++; saveRival();
    App.lastWinner = res.winner;
    if (App.screen !== 'game') return;
    const youWon = App.mode === 'online' ? res.winner === Game.myChar : null;
    $('#result-kicker').textContent = t('result.kicker');
    $('#result-title').textContent = youWon === true ? t('result.you') : youWon === false ? t('result.lost') : t('result.winner', { who: App.names[res.winner] || charName(res.winner) });
    $('#mdl-result .result-panel').dataset.winner = res.winner;
    $('#result-score').innerHTML = `<span class="sb">${App.names.boy}</span><b>${res.score.boy}</b><i>—</i><b>${res.score.girl}</b><span class="sg">${App.names.girl}</span>`;
    const row = (ch) => { const s = res.stats[ch]; return `<div class="rs ${ch}"><h4>${App.names[ch]}</h4><div><b>${Math.round(s.dmg)}</b><span>${t('result.dmg')}</span></div><div><b>${s.hits}</b><span>${t('result.hits')}</span></div><div><b>${s.eaten}</b><span>${t('result.eaten')}</span></div></div>`; };
    $('#result-stats').innerHTML = row('boy') + row('girl');
    $('#result-note').textContent = App.mode === 'online' && App.role === 'guest' ? t('result.either') : '';
    openModal('mdl-result');
    Sfx.play('win');
  }

  // ---------------- chat, sweet words & taunts ----------------
  function chatChar() { return App.mode === 'online' ? (App.myChar || Game.myChar) : (App.chatWho || 'girl'); }
  function renderChat() {
    const q = $('#chat-quick');
    q.innerHTML = '';
    const mk = (label, cls, fn) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip ' + (cls || ''); b.textContent = label;
      b.addEventListener('mousedown', (e) => e.preventDefault());
      b.onclick = () => { fn(); b.blur(); b.classList.remove('popped'); void b.offsetWidth; b.classList.add('popped'); };
      q.appendChild(b);
    };
    const chips = t('chips');
    chips.forEach((label, i) => mk(label, i < Game.NSWEET ? 'love' : 'taunt', () => Game.say(chatChar(), i)));
    mk(t('chat.eat'), 'fun', () => Game.act(chatChar(), 'iskender'));
    mk(t('chat.sandwich'), 'fun', () => Game.act(chatChar(), 'sandwich'));
    mk(t('chat.matcha'), 'fun', () => Game.act(chatChar(), 'matcha'));
    mk(t('chat.orange'), 'fun', () => Game.act(chatChar(), 'orange'));
    mk(t('chat.dance'), 'fun', () => Game.act(chatChar(), 'dance'));
    mk(t('chat.magic'), 'fun magic', () => Game.magic(chatChar()));
    mk(t('chat.kiss'), 'love', () => Game.kiss(chatChar()));
    const who = $('#chat-who');
    who.style.display = App.mode === 'online' ? 'none' : '';
    who.textContent = chatChar() === 'girl' ? '👧' : '👦';
    who.classList.toggle('girl', chatChar() === 'girl');
  }
  let typingOn = false, typingSent = 0;
  function setTypingState(on) {
    const now = Date.now();
    if (on === typingOn && !(on && now - typingSent > 3000)) return;
    typingOn = on; typingSent = now;
    Game.setTyping(chatChar(), on);
  }
  function initChat() {
    const inp = $('#chat-in');
    $('#chat-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const v = inp.value.trim();
      if (v) Game.chat(chatChar(), v);
      inp.value = ''; typingOn = false; inp.blur();
    });
    inp.addEventListener('input', () => { setTypingState(inp.value.trim().length > 0); if (Math.random() < 0.5) Sfx.play('type'); });
    inp.addEventListener('focus', () => { Game._G.keys.clear(); document.body.classList.add('chatting'); });
    inp.addEventListener('blur', () => { setTypingState(false); document.body.classList.remove('chatting'); });
    inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') { inp.value = ''; inp.blur(); } });
    $('#chat-who').addEventListener('mousedown', (e) => e.preventDefault());
    $('#chat-who').onclick = () => { click(); App.chatWho = chatChar() === 'girl' ? 'boy' : 'girl'; renderChat(); };
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || App.screen !== 'game' || modalOpen()) return;
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
      e.preventDefault(); inp.focus();
    });
  }

  // ---------------- language ----------------
  function initLang() {
    $$('#btn-lang-menu, #btn-lang-hud, #btn-lang-pause').forEach(b => {
      b.addEventListener('mousedown', (e) => e.preventDefault());
      b.onclick = () => { click(); I18N.toggle(); };
    });
    I18N.onChange(() => {
      if (App.screen === 'lobby') renderLobby();
      if (App.screen === 'arena') renderArena();
      if (App.screen === 'menu') renderRival();
      if (App.screen === 'game') { renderChat(); $('#hud-hint').textContent = t(App.mode === 'online' ? 'hint.online' : 'hint.local'); }
      if (!$('#mdl-pause').classList.contains('hidden')) $('#pause-note').textContent = t(App.mode === 'online' ? 'pause.online' : 'pause.local');
    });
    I18N.apply();
  }

  // ---------------- boot ----------------
  window.addEventListener('DOMContentLoaded', () => {
    Game.init($('#game'));
    initLang(); initMenu(); initLobby(); initArena(); initHud(); initChat();
    if (App.screen === 'menu') show('menu');
    // shortcut: ?play=2 drops straight into arena 2 on one keyboard
    const play = parseInt(new URLSearchParams(location.search).get('play'), 10);
    if (play >= 1 && play <= Maps.MAPS.length) { App.mode = 'local'; App.lobby = { boy: 'p1', girl: 'p2' }; startMatch(play - 1, 3); }
    window.addEventListener('beforeunload', () => { try { Net.leave(); } catch (e) { /* ignore */ } });
  });
  window.App = App;
})();
