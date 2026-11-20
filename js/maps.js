/* Last Bite — the night arenas.
 * Tiles: '#' solid · '=' one-way ledge (jump up through, S to drop) · '|' ladder · '.' air
 * Objects (stripped from the grid): L lamp · F campfire · H hiding spot · P food spot · E breaker · B bounce pad · 1 his spawn · 2 her spawn
 * Arena-only gimmicks are set on the builder result: portals (library), rail (metro), water + thin ice (frozen lake). */
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
    fair: {
      sky: ['#0a0612', '#1c0f22'], wall: null, solid: '#2b1f2e', solidTop: '#6a3a5e', solidDark: '#1c1420',
      ledge: '#c23a4a', ledge2: '#f1e6d2', ladder: '#b08a4a', hide: 'cutout', ambient: 'confetti', lamp: 'string', light: '255,170,220', outdoor: true, music: 2,
    },
    metro: {
      sky: ['#07090c', '#0d1116'], wall: '#1b2226', wallLine: 'rgba(220,240,255,0.05)', solid: '#30373c', solidTop: '#596369', solidDark: '#1d2327',
      ledge: '#7d878d', ladder: '#9aa4aa', hide: 'booth', ambient: 'dust', lamp: 'metro', light: '235,240,255', music: 7,
    },
    library: {
      sky: ['#0a0708', '#150e0c'], wall: '#1c120e', wallLine: 'rgba(255,200,140,0.035)', solid: '#3b2618', solidTop: '#7a2f2a', solidDark: '#24170f',
      ledge: '#6e4a2c', ladder: '#b8913e', hide: 'clock', ambient: 'pages', lamp: 'chandelier', light: '255,190,110', safeFire: true, music: 4,
    },
    ice: {
      sky: ['#02060d', '#0a1a2a'], wall: null, solid: '#2a3f52', solidTop: '#d8ecf7', solidDark: '#1a2a38',
      ledge: '#6b5240', ladder: '#7a6450', hide: 'snowman', ambient: 'snow', lamp: 'icelamp', light: '170,220,255', outdoor: true, slippery: true, safeFire: true, music: 9,
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

  // ---------------- 4 · Moonlight Fair: trampolines, booth roofs, a dead roller coaster ----------------
  function fair() {
    const m = blank(72, 24);
    m.fill(1, 21, 70, 22, '#');
    // game booths: their striped roofs are ledges
    for (const [a, b] of [[6, 11], [22, 27], [44, 49], [60, 65]]) m.fill(a, 16, b, 16, '=');
    // middle tier and the carousel roof
    m.fill(14, 12, 19, 12, '='); m.fill(33, 12, 39, 12, '='); m.fill(52, 12, 57, 12, '=');
    // the roller coaster track up high
    m.fill(4, 7, 15, 7, '='); m.fill(24, 7, 31, 7, '='); m.fill(41, 7, 48, 7, '='); m.fill(56, 7, 68, 7, '=');
    // carousel pole and a maintenance ladder to the coaster
    m.ladder(36, 12, 20); m.put(36, 12, '=');
    m.ladder(29, 7, 20); m.put(29, 7, '=');
    // trampolines: ground ones reach the middle tier, roof ones reach the coaster
    m.pads = [];
    for (const [x, y] of [[7, 20], [17, 20], [33, 20], [46, 20], [55, 20], [64, 20], [24, 15], [44, 15], [62, 15], [15, 11], [57, 11]]) m.put(x, y, 'B');
    // string lights under the roofs and hanging from the coaster
    for (const [x, y] of [[8, 17], [24, 17], [46, 17], [62, 17], [36, 13], [10, 8], [27, 8], [44, 8], [62, 8], [18, 1], [52, 1]]) m.put(x, y, 'L');
    // face-in-hole cutout boards to hide behind
    for (const [x, y] of [[10, 20], [26, 20], [41, 20], [58, 20], [8, 15], [47, 15], [17, 11], [38, 11], [66, 6]]) m.put(x, y, 'H');
    // cotton candy & snacks
    for (const [x, y] of [[13, 20], [30, 20], [50, 20], [68, 20], [10, 15], [22, 15], [64, 15], [53, 11], [34, 11], [6, 6], [27, 6], [45, 6], [60, 6]]) m.put(x, y, 'P');
    m.put(39, 20, 'E');
    m.put(2, 20, '1'); m.put(69, 20, '2');
    m.carousel = { x: 36 * 32 + 16, top: 13 * 32, base: 21 * 32 };
    m.wheel = true;
    return m;
  }

  // ---------------- 5 · Last Stop Metro: a train thunders through the tracks every 20 s ----------------
  function metro() {
    const m = blank(72, 22);
    // track bed, platform and the upper concourse
    m.fill(1, 19, 70, 20, '#');
    m.fill(1, 15, 70, 15, '#');
    m.fill(1, 8, 70, 8, '#');
    // maintenance grates and holes down to the tracks
    m.fill(12, 15, 14, 15, '='); m.ladder(13, 15, 18); m.put(13, 15, '=');
    m.fill(34, 15, 37, 15, '.'); m.ladder(35, 15, 18); m.put(35, 15, '=');
    m.fill(57, 15, 59, 15, '='); m.ladder(58, 15, 18); m.put(58, 15, '=');
    // stairs between platform and concourse, and open drops
    m.ladder(6, 8, 14).ladder(30, 8, 14).ladder(46, 8, 14).ladder(66, 8, 14);
    m.fill(20, 8, 22, 8, '.'); m.fill(52, 8, 54, 8, '.');
    // benches on the platform, sign gantries up top
    m.fill(24, 13, 26, 13, '='); m.fill(43, 13, 45, 13, '=');
    m.fill(12, 4, 17, 4, '='); m.fill(38, 4, 43, 4, '='); m.fill(58, 4, 63, 4, '=');
    // lights: platform ceiling and concourse; the tracks stay dark
    for (const x of [9, 17, 31, 42, 56, 64]) m.put(x, 9, 'L');
    for (const x of [8, 27, 49, 64]) m.put(x, 1, 'L');
    // photo booths
    for (const [x, y] of [[4, 14], [27, 14], [50, 14], [69, 14], [15, 7], [41, 7], [61, 7]]) m.put(x, y, 'H');
    // food — the tasty stuff is down on the tracks
    for (const [x, y] of [[8, 18], [24, 18], [41, 18], [50, 18], [64, 18], [18, 14], [40, 14], [62, 14], [4, 7], [25, 7], [37, 7], [57, 7], [69, 7], [14, 3], [40, 3]]) m.put(x, y, 'P');
    m.put(34, 7, 'E');
    m.put(2, 14, '1'); m.put(68, 7, '2');
    m.rail = { top: 16 * 32, bottom: 19 * 32 };
    return m;
  }

  // ---------------- 6 · Whispering Library: secret bookcases connect far-off rooms ----------------
  function library() {
    const m = blank(66, 24);
    m.fill(1, 21, 64, 22, '#');
    m.fill(1, 15, 64, 15, '#');
    m.fill(1, 9, 64, 9, '#');
    m.fill(20, 4, 44, 4, '='); // the reading gallery
    // holes in the floors
    m.fill(44, 15, 46, 15, '.'); m.fill(22, 9, 24, 9, '.');
    // brass rolling ladders
    m.ladder(15, 15, 20).ladder(50, 15, 20).ladder(27, 9, 14).ladder(54, 9, 14);
    m.ladder(32, 4, 8); m.put(32, 4, '=');
    // reading tables
    m.fill(20, 18, 23, 18, '='); m.fill(38, 18, 41, 18, '=');
    m.fill(10, 12, 13, 12, '='); m.fill(40, 12, 43, 12, '=');
    m.fill(6, 6, 9, 6, '='); m.fill(52, 6, 55, 6, '=');
    // chandeliers
    for (const x of [8, 25, 40, 58]) m.put(x, 16, 'L');
    for (const x of [18, 36, 52]) m.put(x, 10, 'L');
    for (const x of [10, 32, 58]) m.put(x, 1, 'L');
    // the fireplace keeps the freeze away
    m.put(47, 20, 'F');
    // grandfather clocks
    for (const [x, y] of [[10, 20], [28, 20], [55, 20], [20, 14], [38, 14], [61, 14], [15, 8], [46, 8]]) m.put(x, y, 'H');
    // books are not edible, but the snacks are
    for (const [x, y] of [[7, 20], [22, 20], [40, 20], [52, 20], [12, 14], [30, 14], [48, 14], [25, 8], [38, 8], [58, 8], [24, 3], [42, 3]]) m.put(x, y, 'P');
    m.put(2, 8, 'E');
    m.put(2, 20, '1'); m.put(63, 14, '2');
    // secret bookcases, in linked pairs
    m.portals = [
      [4, 20, 60, 8],
      [61, 20, 4, 14],
      [57, 14, 9, 8],
      [35, 20, 36, 3],
    ];
    return m;
  }

  // ---------------- 7 · Frozen Lake: slippery ice everywhere, thin ice cracks and drops you in ----------------
  function ice() {
    const m = blank(74, 24);
    // shores and the lake basin
    m.fill(1, 15, 17, 22, '#'); m.fill(56, 15, 72, 22, '#');
    m.fill(18, 22, 55, 22, '#');
    m.fill(18, 17, 55, 17, '#'); // the ice sheet
    // docks with ladders up out of the water (one on the island)
    m.ladder(20, 17, 21); m.ladder(35, 17, 21); m.ladder(53, 17, 21);
    // fishing hut on the island: roof ledge
    m.fill(32, 13, 38, 13, '=');
    // icicle bridges over the lake
    m.fill(24, 11, 29, 11, '='); m.fill(42, 11, 47, 11, '=');
    m.fill(22, 14, 23, 14, '='); m.fill(50, 14, 51, 14, '='); // ice floes to climb up
    // cliffs
    m.fill(3, 9, 9, 9, '='); m.fill(11, 11, 15, 11, '='); m.fill(62, 9, 69, 9, '='); m.fill(57, 11, 61, 11, '=');
    m.ladder(6, 9, 14); m.put(6, 9, '='); m.ladder(66, 9, 14); m.put(66, 9, '=');
    // which ice tiles are thin
    m.thin = [];
    for (let x = 21; x <= 52; x++) if ((x < 33 || x > 37)) m.thin.push([x, 17]);
    m.water = { x0: 18 * 32, x1: 56 * 32, top: 18 * 32, bottom: 22 * 32 };
    // snowy pines
    m.trees = [];
    for (const x of [9, 63]) m.trees.push({ x: x * 32 + 16, top: 4 * 32, base: 15 * 32, pine: true });
    // ice lanterns
    for (const [x, y] of [[10, 12], [64, 12], [35, 14], [26, 12], [45, 12], [6, 6], [66, 6], [36, 1]]) m.put(x, y, 'L');
    // the warm hut fire, out in the middle of the lake
    m.put(36, 16, 'F');
    // snowmen
    for (const [x, y] of [[4, 14], [13, 14], [60, 14], [70, 14], [34, 16], [5, 8], [67, 8]]) m.put(x, y, 'H');
    // food, some of it out on the thin ice — and two at the bottom of the lake
    for (const [x, y] of [[9, 14], [16, 14], [57, 14], [68, 14], [24, 16], [30, 16], [41, 16], [48, 16], [8, 8], [64, 8], [26, 10], [45, 10], [27, 21], [44, 21]]) m.put(x, y, 'P');
    m.put(33, 12, 'E');
    m.put(2, 14, '1'); m.put(71, 14, '2');
    return m;
  }

  const MAPS = [
    { id: 'house', icon: '🏚️', theme: 'house', build: house },
    { id: 'forest', icon: '🌲', theme: 'forest', build: forest },
    { id: 'market', icon: '🛒', theme: 'market', build: market },
    { id: 'fair', icon: '🎡', theme: 'fair', build: fair },
    { id: 'metro', icon: '🚇', theme: 'metro', build: metro },
    { id: 'library', icon: '📚', theme: 'library', build: library },
    { id: 'ice', icon: '🧊', theme: 'ice', build: ice },
  ];

  function buildMap(i) {
    const def = MAPS[Math.max(0, Math.min(MAPS.length - 1, i | 0))];
    const m = def.build();
    const M = { id: def.id, icon: def.icon, index: MAPS.indexOf(def), theme: THEMES[def.theme], themeKey: def.theme, W: m.W, H: m.H, grid: m.g, lamps: [], fires: [], hides: [], foods: [], pads: [], portals: [], thin: [], breaker: null, spawn: {} };
    const LAMP_COLS = ['255,90,140', '255,210,90', '120,220,255', '170,255,140', '210,140,255'];
    for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) {
      const c = m.g[y][x], px = x * TILE, py = y * TILE;
      switch (c) {
        case 'L': M.lamps.push({ x: px + TILE / 2, y: py + 6, r: def.theme === 'market' || def.theme === 'metro' ? 175 : 165, ph: (x * 7 + y * 3) % 10, col: def.theme === 'fair' ? LAMP_COLS[M.lamps.length % LAMP_COLS.length] : null }); m.g[y][x] = '.'; break;
        case 'B': M.pads.push({ x: px + TILE / 2, y: py + TILE, t: 0 }); m.g[y][x] = '.'; break;
        case 'F': M.fires.push({ x: px + TILE / 2, y: py + TILE, r: 230 }); m.g[y][x] = '.'; break;
        case 'H': M.hides.push({ x: px + TILE / 2, y: py + TILE, w: 30, h: 46, ph: x }); m.g[y][x] = '.'; break;
        case 'P': M.foods.push({ x: px + TILE / 2, y: py + TILE - 12, kind: null, t: 0 }); m.g[y][x] = '.'; break;
        case 'E': M.breaker = { x: px + TILE / 2, y: py + TILE - 18 }; m.g[y][x] = '.'; break;
        case '1': M.spawn.boy = { x: px + TILE / 2, y: py + TILE }; m.g[y][x] = '.'; break;
        case '2': M.spawn.girl = { x: px + TILE / 2, y: py + TILE }; m.g[y][x] = '.'; break;
      }
    }
    // decor & arena gimmicks
    M.trees = m.trees || [];
    M.carousel = m.carousel || null;
    M.wheel = !!m.wheel;
    M.rail = m.rail || null;
    M.water = m.water || null;
    const PCOL = ['#7fd6ff', '#ff8fb8', '#ffd43b', '#9ad27f'];
    (m.portals || []).forEach(([ax, ay, bx, by], k) => {
      const i = M.portals.length;
      M.portals.push({ x: ax * TILE + TILE / 2, y: (ay + 1) * TILE, pair: i + 1, col: PCOL[k % 4], swingT: 0 });
      M.portals.push({ x: bx * TILE + TILE / 2, y: (by + 1) * TILE, pair: i, col: PCOL[k % 4], swingT: 0 });
    });
    for (const [tx, ty] of m.thin || []) if (m.g[ty][tx] === '#') M.thin.push({ tx, ty, crack: 0, broken: 0 });
    M.thinAt = {};
    for (const th of M.thin) M.thinAt[th.ty * M.W + th.tx] = th;
    return M;
  }

  global.Maps = { TILE, THEMES, MAPS, buildMap };
})(typeof window !== 'undefined' ? window : globalThis);
