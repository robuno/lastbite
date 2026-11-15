/* Last Bite — the three night arenas.
 * Tiles: '#' solid · '=' one-way ledge (jump up through, S to drop) · '|' ladder · '.' air
 * Objects (stripped from the grid): L lamp · F campfire · H hiding spot · P food spot · E breaker · 1 his spawn · 2 her spawn */
(function (global) {
  'use strict';
  const TILE = 32;

  const THEMES = {
    house: {
      sky: ['#07080c', '#121018'], wall: '#1d1814', wallLine: 'rgba(255,220,170,0.04)', solid: '#3a2c22', solidTop: '#5a4331', solidDark: '#241a14',
      ledge: '#6b4c33', ladder: '#7a5a3a', hide: 'closet', ambient: 'dust', lamp: 'bulb', light: '255,196,120', fog: 'rgba(30,20,14,0.0)', window: true, music: 0,
    },
    forest: {
      sky: ['#03060a', '#0b1a1c'], wall: null, solid: '#1f2a1c', solidTop: '#35502c', solidDark: '#141a12',
      ledge: '#4a3624', ladder: '#5a4630', hide: 'bush', ambient: 'rain', lamp: 'lantern', light: '255,170,90', trees: true, music: 3,
    },
    market: {
      sky: ['#06080a', '#0d1214'], wall: '#141a1c', wallLine: 'rgba(160,255,230,0.035)', solid: '#2a3236', solidTop: '#4a5a60', solidDark: '#1a2024',
      ledge: '#6a7a80', ladder: '#8a9498', hide: 'freezer', ambient: 'flicker', lamp: 'tube', light: '200,255,235', shelves: true, music: 5,
    },
  };

  function blank(W, H) {
    const g = [];
    for (let y = 0; y < H; y++) { const r = []; for (let x = 0; x < W; x++) r.push(x === 0 || y === 0 || x === W - 1 || y === H - 1 ? '#' : '.'); g.push(r); }
    return {
      g, W, H,
      fill(x0, y0, x1, y1, c) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x > 0 && y > 0 && x < W - 1 && y < H - 1) g[y][x] = c; return this; },
      put(x, y, c) { if (x > 0 && y > 0 && x < W - 1 && y < H - 1) g[y][x] = c; return this; },
      ladder(x, y0, y1) { for (let y = y0; y <= y1; y++) g[y][x] = g[y][x] === '#' ? '=' : '|'; return this; },
    };
  }

  // ---------------- 1 · Abandoned House: three storeys, closets, a basement breaker ----------------
  function house() {
    const m = blank(64, 24);
    // floors (top surfaces at y=21, 15, 9)
    m.fill(1, 21, 62, 22, '#');
    m.fill(1, 15, 62, 15, '#');
    m.fill(1, 9, 62, 9, '#');
    // stairwell gaps & holes in the floors
    m.fill(35, 15, 37, 15, '.');
    m.fill(19, 9, 21, 9, '.');
    // ladders between floors
    m.ladder(9, 15, 20).ladder(52, 15, 20).ladder(30, 9, 14).ladder(58, 9, 14).ladder(4, 9, 14);
    // interior walls with doorways (2 tiles tall at the bottom)
    m.fill(24, 16, 24, 18, '#'); m.fill(44, 16, 44, 18, '#');
    m.fill(14, 10, 14, 12, '#'); m.fill(46, 10, 46, 12, '#');
    m.fill(40, 2, 40, 6, '#');
    // furniture ledges
    m.fill(16, 18, 19, 18, '='); m.fill(36, 19, 39, 19, '='); m.fill(56, 18, 59, 18, '=');
    m.fill(7, 12, 10, 12, '='); m.fill(36, 12, 39, 12, '='); m.fill(50, 12, 53, 12, '=');
    m.fill(11, 6, 14, 6, '='); m.fill(26, 5, 29, 5, '='); m.fill(48, 6, 51, 6, '=');
    // the crawl-space vent between the attic halves
    m.fill(40, 7, 40, 8, '.');
    // lamps
    for (const x of [6, 18, 31, 48, 59]) m.put(x, 16, 'L');
    for (const x of [9, 24, 41, 55]) m.put(x, 10, 'L');
    for (const x of [16, 33, 52]) m.put(x, 1, 'L');
    // hiding closets
    for (const [x, y] of [[3, 20], [27, 20], [47, 20], [17, 14], [41, 14], [60, 14], [7, 8], [34, 8], [57, 8]]) m.put(x, y, 'H');
    // food spots
    for (const [x, y] of [[14, 20], [40, 20], [58, 20], [2, 14], [23, 14], [49, 14], [24, 8], [44, 8], [62, 8]]) m.put(x, y, 'P');
    m.put(62, 20, 'E');
    m.put(4, 20, '1'); m.put(60, 8, '2');
    return m;
  }

  // ---------------- 2 · Night Camp: hills, tree branches, bushes, tents and a campfire ----------------
  function forest() {
    const m = blank(76, 24);
    // rolling ground
    const ground = (x) => 20 - Math.round(Math.sin(x * 0.11) * 1.4 + Math.sin(x * 0.29 + 1) * 0.8);
    for (let x = 1; x < 75; x++) m.fill(x, ground(x), x, 22, '#');
    // a creek bed to jump over
    m.fill(46, ground(46) - 0, 49, 21, '.');
    // rocks
    m.fill(20, ground(21) - 2, 22, ground(21) - 1, '#'); m.fill(60, ground(60) - 2, 61, ground(60) - 1, '#');
    // trees: trunks are decor, branches are ledges
    m.trees = [];
    for (const x of [8, 29, 55, 67]) {
      const g = ground(x);
      m.fill(x - 2, g - 4, x + 2, g - 4, '='); m.fill(x - 2, g - 8, x + 2, g - 8, '=');
      m.trees.push({ x: x * TILE + TILE / 2, top: (g - 12) * TILE, base: g * TILE });
      m.put(x, g - 6, 'L');
    }
    // high walkways between the canopies
    m.fill(13, ground(8) - 11, 17, ground(8) - 11, '=');
    m.fill(34, ground(29) - 10, 39, ground(29) - 10, '=');
    m.fill(45, ground(46) - 5, 50, ground(46) - 5, '=');
    m.fill(60, ground(60) - 11, 63, ground(60) - 11, '=');
    // ranger tower with a ladder
    m.fill(72, 9, 74, 9, '#'); m.ladder(71, 9, ground(71) - 1); m.put(71, 9, '=');
    m.put(73, 7, 'L');
    // campfire in the middle
    m.put(40, ground(40) - 1, 'F');
    // bushes & tents
    for (const x of [4, 15, 25, 35, 43, 52, 63, 70]) m.put(x, ground(x) - 1, 'H');
    m.put(37, ground(29) - 11, 'H'); m.put(15, ground(8) - 12, 'H');
    // food
    for (const x of [11, 24, 32, 44, 58, 66]) m.put(x, ground(x) - 1, 'P');
    m.put(74, 8, 'P'); m.put(16, ground(8) - 12, 'P'); m.put(62, ground(60) - 12, 'P'); m.put(47, ground(46) - 6, 'P');
    // the generator powering the lanterns
    m.put(72, 8, 'E');
    m.put(3, ground(3) - 1, '1'); m.put(73, ground(73) - 1, '2');
    return m;
  }

  // ---------------- 3 · Dead Market: aisles of shelves, freezers, a storage mezzanine ----------------
  function market() {
    const m = blank(66, 22);
    m.fill(1, 19, 64, 20, '#');
    // mezzanine storage level
    m.fill(1, 10, 20, 10, '#'); m.fill(46, 10, 64, 10, '#');
    m.fill(27, 7, 39, 7, '='); // hanging catwalk
    m.fill(25, 10, 27, 10, '='); m.fill(39, 10, 41, 10, '='); // steps up to the catwalk
    m.ladder(18, 10, 18); m.ladder(3, 10, 18); m.ladder(48, 10, 18); m.ladder(62, 10, 18);
    m.fill(18, 10, 18, 10, '=').fill(48, 10, 48, 10, '=');
    // shelving aisles (solid low racks with a ledge on top)
    for (const x of [8, 22, 31, 40, 54]) { m.fill(x, 16, x + 3, 18, '#'); m.fill(x, 13, x + 3, 13, '='); }
    // checkout counters
    m.fill(27, 17, 28, 18, '#'); m.fill(37, 17, 38, 18, '#');
    // fluorescent tubes
    for (const x of [6, 15, 25, 33, 41, 50, 59]) m.put(x, 11, 'L');
    for (const x of [8, 56]) m.put(x, 1, 'L');
    m.put(33, 1, 'L');
    // freezers / boxes to hide in
    for (const [x, y] of [[2, 18], [14, 18], [20, 18], [35, 18], [46, 18], [61, 18], [10, 9], [52, 9], [33, 6]]) m.put(x, y, 'H');
    // food everywhere — it is a market after all
    for (const [x, y] of [[9, 12], [23, 12], [32, 12], [41, 12], [55, 12], [5, 9], [16, 9], [57, 9], [63, 9], [30, 18], [44, 18]]) m.put(x, y, 'P');
    m.put(2, 9, 'E');
    m.put(6, 18, '1'); m.put(59, 18, '2');
    return m;
  }

  const MAPS = [
    { id: 'house', icon: '🏚️', theme: 'house', build: house },
    { id: 'forest', icon: '🌲', theme: 'forest', build: forest },
    { id: 'market', icon: '🛒', theme: 'market', build: market },
  ];

  function buildMap(i) {
    const def = MAPS[Math.max(0, Math.min(MAPS.length - 1, i | 0))];
    const m = def.build();
    const M = { id: def.id, icon: def.icon, index: MAPS.indexOf(def), theme: THEMES[def.theme], themeKey: def.theme, W: m.W, H: m.H, grid: m.g, lamps: [], fires: [], hides: [], foods: [], breaker: null, spawn: {} };
    for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) {
      const c = m.g[y][x], px = x * TILE, py = y * TILE;
      switch (c) {
        case 'L': M.lamps.push({ x: px + TILE / 2, y: py + 6, r: def.theme === 'market' ? 175 : 165, ph: (x * 7 + y * 3) % 10 }); m.g[y][x] = '.'; break;
        case 'F': M.fires.push({ x: px + TILE / 2, y: py + TILE, r: 230 }); m.g[y][x] = '.'; break;
        case 'H': M.hides.push({ x: px + TILE / 2, y: py + TILE, w: 30, h: 46, ph: x }); m.g[y][x] = '.'; break;
        case 'P': M.foods.push({ x: px + TILE / 2, y: py + TILE - 12, kind: null, t: 0 }); m.g[y][x] = '.'; break;
        case 'E': M.breaker = { x: px + TILE / 2, y: py + TILE - 18 }; m.g[y][x] = '.'; break;
        case '1': M.spawn.boy = { x: px + TILE / 2, y: py + TILE }; m.g[y][x] = '.'; break;
        case '2': M.spawn.girl = { x: px + TILE / 2, y: py + TILE }; m.g[y][x] = '.'; break;
      }
    }
    // decor: tree trunks for the forest
    M.trees = m.trees || [];
    return M;
  }

  global.Maps = { TILE, THEMES, MAPS, buildMap };
})(typeof window !== 'undefined' ? window : globalThis);
