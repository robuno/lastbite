/* Last Bite — character art (Him & Her), food props and shared canvas helpers. */
(function (global) {
  'use strict';
  const PW = 22, PH = 28;
  const SHINE_DUR = 1.4, MORPH_DUR = 7;
  const LOOK = {
    boy: { body: '#4f8ff0', bodyDark: '#3a6fc4', hair: '#4a2f22', skin: '#ffd8bd', shoe: '#2d3a5a', accent: '#8fd0ff' },
    girl: { body: '#ff7aa8', bodyDark: '#e0578a', hair: '#1b1820', skin: '#ffe0c8', shoe: '#7a2e52', accent: '#ffd0e2', bow: '#ff3f7f' },
  };
  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function heartPath(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + 0.45 * s);
    ctx.bezierCurveTo(x - 0.62 * s, y + 0.02 * s, x - 0.52 * s, y - 0.5 * s, x, y - 0.18 * s);
    ctx.bezierCurveTo(x + 0.52 * s, y - 0.5 * s, x + 0.62 * s, y + 0.02 * s, x, y + 0.45 * s);
    ctx.closePath();
  }
  function starPath(ctx, x, y, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const rr2 = i % 2 ? r * 0.45 : r, a = rot + i / 10 * Math.PI * 2 - Math.PI / 2; ctx.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); }
    ctx.closePath();
  }
  function sipPhase(t) {
    const ph = (t % 1.8) / 1.8;
    const k = ph < 0.25 ? 0 : ph < 0.4 ? (ph - 0.25) / 0.15 : ph < 0.75 ? 1 : ph < 0.9 ? 1 - (ph - 0.75) / 0.15 : 0;
    return k * k * (3 - 2 * k);
  }

  function drawCharacter(ctx, p, t) {
    const C = LOOK[p.char], girl = p.char === 'girl';
    const moving = p.grounded && Math.abs(p.vx) > 20 && !p.anchored;
    const wt = p.walkT;
    const air = !p.grounded && !p.anchored;
    const dance = p.act === 'dance' && !p.anchored, sipping = p.act === 'matcha' && !p.anchored, eating = p.act === 'eat' && !p.anchored;
    const orange = p.act === 'orange' && !p.anchored;
    const sandwich = p.act === 'sandwich' && !p.anchored;
    const atk = p.atkKind && p.atkT < (p.atkDur || 0.4) ? p.atkKind : null;
    const ak = atk ? Math.min(1, p.atkT / (p.atkDur || 0.4)) : 0;
    const biting = atk === 'bite' || atk === 'lunge', slapping = atk === 'slap', throwing = atk === 'slipper';
    const hurt = (p.hurtT || 0) > 0, stunned = (p.stunT || 0) > 0 || (p.trapT || 0) > 0;
    const db = (p.actT || 0) * 9, sk = sipping ? sipPhase(p.actT || 0) : 0, ek = eating || orange || sandwich ? sipPhase(p.actT || 0) : 0;
    const wandUp = girl && !p.anchored && ((p.castT || 0) > 0 || (p.superT || 0) > 0);
    const shining = girl && (p.shineT > 0 || wandUp) && !dance && !sipping && !eating && !orange && !p.anchored;
    const glowing = !girl && p.glowT > 0;
    const chewing = (eating || orange || sandwich) && (p.chewT > 0 || (ek > 0.9));
    const bride = girl && (p.bridalT || 0) > 0;
    const punching = !girl && (p.punchT || 0) > 0;
    const busyHands = dance || sipping || eating || orange || sandwich || shining || punching || slapping || throwing;
    ctx.save();
    ctx.translate(p.x + p.w / 2, p.y + p.h);
    if (dance) { ctx.translate(0, -Math.abs(Math.sin(db)) * 3); ctx.rotate(Math.sin(db) * 0.14); }
    if (p.anchored && p.wallSide) ctx.rotate(p.wallSide * 0.12);
    const kissing = (p.kissT || 0) > 0;
    if (kissing) ctx.rotate(p.face * 0.22 * Math.min(1, p.kissT * 3, (1.4 - p.kissT) * 6));
    if (hurt) ctx.translate(Math.sin(p.hurtT * 60) * 1.5, 0);
    if ((p.downT || 0) > 0 && p.stunT > 0) { ctx.translate(p.face * 20, -7); ctx.rotate(-p.face * Math.PI / 2); }
    const sq = p.squash || 0;
    ctx.scale(p.face * (1 + sq * 0.6), 1 - sq * 0.6);
    if (biting) ctx.rotate(Math.sin(ak * Math.PI) * (atk === 'lunge' ? 0.42 : 0.3));
    if (slapping) ctx.rotate(Math.sin(ak * Math.PI) * 0.12);
    if (p.climbing) ctx.rotate(Math.sin((p.walkT || 0) * 1.2) * 0.05);
    const crouch = p.anchored && !p.wallSide ? 3 : 0;
    const bob = moving ? Math.abs(Math.sin(wt)) * -1.5 : Math.sin(t * 2.2 + (girl ? 1 : 0)) * 0.4;
    if (!girl && p.morphForm) { drawMorph(ctx, p, t, moving, air, bob); ctx.restore(); return; }

    // anchor glow
    if (p.anchored) {
      ctx.fillStyle = 'rgba(255,214,102,0.35)';
      ctx.beginPath(); ctx.ellipse(0, -1, 14, 4, 0, 0, 7); ctx.fill();
    }
    // legs
    ctx.fillStyle = C.shoe;
    const la = moving ? Math.sin(wt) * 4 : dance ? Math.sin(db) * 3.5 : 0;
    if (air) { rr(ctx, -6, -9, 5, 6, 2); ctx.fill(); rr(ctx, 1, -7, 5, 6, 2); ctx.fill(); }
    else if (crouch) { rr(ctx, -9, -5, 6, 5, 2); ctx.fill(); rr(ctx, 3, -5, 6, 5, 2); ctx.fill(); }
    else { rr(ctx, -6 + la * 0.6, -6 - Math.max(0, la) * 0.3, 5, 6, 2); ctx.fill(); rr(ctx, 1 - la * 0.6, -6 - Math.max(0, -la) * 0.3, 5, 6, 2); ctx.fill(); }

    ctx.translate(0, crouch + bob);
    if (bride) {
      const sw = Math.sin(t * 2.6) * 2 - (moving ? 4 : 0) - (air ? 3 : 0);
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.beginPath(); ctx.moveTo(-4, -40); ctx.quadraticCurveTo(-16, -36, -19 + sw, -18); ctx.quadraticCurveTo(-21 + sw * 1.4, -6, -17 + sw * 1.6, 0); ctx.lineTo(-7, -2); ctx.quadraticCurveTo(-12, -20, -2, -34); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,220,235,0.9)'; ctx.lineWidth = 0.6; ctx.stroke();
    }
    // back hair (girl)
    if (girl) {
      ctx.fillStyle = C.hair;
      rr(ctx, -12, -36, 20, 22, 8); ctx.fill();
      const sw = Math.sin(t * 3) * 1.5 - (air ? 2 : 0) - (moving ? 1.5 : 0) + (dance ? Math.sin(db) * 3.5 : 0);
      ctx.beginPath(); ctx.moveTo(-11, -30); ctx.quadraticCurveTo(-17 + sw, -22, -12 + sw, -12); ctx.lineTo(-6, -16); ctx.closePath(); ctx.fill();
    }
    // body
    ctx.fillStyle = C.body;
    if (bride) {
      // wedding gown: fitted bodice, wide flowing skirt with a scalloped lace hem
      const sway = Math.sin(t * 3) * 0.8 + (moving ? Math.sin(wt) * 1.2 : 0);
      const gg = ctx.createLinearGradient(0, -20, 0, 0);
      gg.addColorStop(0, '#ffffff'); gg.addColorStop(1, '#f3e8f4');
      ctx.fillStyle = gg;
      ctx.beginPath(); ctx.moveTo(-5.5, -20); ctx.lineTo(5.5, -20); ctx.lineTo(5, -13); ctx.quadraticCurveTo(12, -6, 14 + sway, 0);
      for (let i = 0; i < 6; i++) { const x = 14 + sway - (i + 1) * (28 / 6); ctx.quadraticCurveTo(x + 2.3, 2.2, x, 0); }
      ctx.quadraticCurveTo(-12, -6, -5, -13); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ead7ec'; ctx.lineWidth = 0.6; ctx.stroke();
      ctx.fillStyle = '#ffd6e7'; ctx.fillRect(-5.5, -13.8, 11, 1.4);
      ctx.fillStyle = 'rgba(230,200,235,0.9)';
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(-11.7 + sway * 0.5 + i * 4.7, -1.4, 0.7, 0, 7); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-4 + i * 4, -7 + (i % 2), 0.6, 0, 7); ctx.fill(); }
      ctx.save(); ctx.scale(p.face, 1);
      ctx.fillStyle = '#ff7aa8';
      ctx.beginPath(); ctx.arc(0, -17.4, 0.9, 0, 7); ctx.fill();
      rr(ctx, -0.8, -16, 1.6, 2.6, 0.7); ctx.fill();
      ctx.restore();
    } else if (girl) {
      ctx.beginPath(); ctx.moveTo(-6, -19); ctx.lineTo(6, -19); ctx.quadraticCurveTo(9, -10, 10, -5); ctx.lineTo(-10, -5); ctx.quadraticCurveTo(-9, -10, -6, -19); ctx.closePath(); ctx.fill();
      ctx.fillStyle = C.bodyDark; ctx.fillRect(-10, -7, 20, 2);
      // the letter "i" on her dress (un-flipped so it always reads correctly)
      ctx.save(); ctx.scale(p.face, 1);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, -15.6, 1.25, 0, 7); ctx.fill();
      rr(ctx, -1.05, -13.6, 2.1, 5.2, 1); ctx.fill();
      ctx.restore();
    } else {
      rr(ctx, -7, -19, 14, 14, 4); ctx.fill();
      ctx.fillStyle = C.bodyDark; ctx.fillRect(-7, -9, 14, 3);
    }
    if (bride) {
      // pearl necklace instead of the scarf
      ctx.fillStyle = '#fffaf0';
      for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(-5 + i * 1.65, -20 + Math.sin(i / 6 * Math.PI) * 1.6, 0.85, 0, 7); ctx.fill(); }
    } else {
    // scarf (red, matches the string)
    ctx.fillStyle = '#e8344e';
    rr(ctx, -7, -21, 14, 4.5, 2); ctx.fill();
    const flap = Math.sin(t * 8 + (girl ? 2 : 0)) * 2 + (moving || air ? 2 : 0);
    ctx.beginPath(); ctx.moveTo(-5, -19); ctx.quadraticCurveTo(-11, -17 + flap * 0.3, -14 - flap, -14 + flap * 0.5); ctx.lineTo(-11 - flap * 0.5, -12); ctx.quadraticCurveTo(-8, -15, -3, -17); ctx.closePath(); ctx.fill();
    }
    // arms
    ctx.fillStyle = C.skin;
    if (dance && !air) { const u = Math.sin(db); ctx.beginPath(); ctx.arc(-10.5, -25 + u * 3.5, 2.8, 0, 7); ctx.arc(10.5, -25 - u * 3.5, 2.8, 0, 7); ctx.fill(); }
    else if (sipping) { ctx.beginPath(); ctx.arc(-8.5, -12, 2.8, 0, 7); ctx.fill(); }
    else if (eating || orange || sandwich) { /* hands are drawn with the food */ }
    else if (slapping || throwing) { ctx.beginPath(); ctx.arc(-8.5, -13, 2.8, 0, 7); ctx.fill(); }
    else if (p.climbing) { const u = Math.sin((p.walkT || 0) * 2); ctx.beginPath(); ctx.arc(-7, -27 + u * 3, 2.8, 0, 7); ctx.arc(7, -27 - u * 3, 2.8, 0, 7); ctx.fill(); }
    else if (punching) { ctx.beginPath(); ctx.arc(-8.5, -14, 2.8, 0, 7); ctx.fill(); }
    else if (bride && !air && !p.anchored) { /* hands hold the bouquet */ }
    else if (shining) { ctx.beginPath(); ctx.arc(-8.5, -12, 2.8, 0, 7); ctx.fill(); }
    else if (p.anchored && p.wallSide) { ctx.beginPath(); ctx.arc(9, -22, 2.8, 0, 7); ctx.arc(9, -14, 2.8, 0, 7); ctx.fill(); }
    else if (p.anchored) { ctx.beginPath(); ctx.arc(-8, -8, 2.8, 0, 7); ctx.arc(8, -8, 2.8, 0, 7); ctx.fill(); }
    else if (air) { ctx.beginPath(); ctx.arc(-9, -21, 2.8, 0, 7); ctx.arc(9, -20, 2.8, 0, 7); ctx.fill(); }
    else { const as = moving ? Math.sin(wt + Math.PI) * 2 : 0; ctx.beginPath(); ctx.arc(-8.5, -12 + as, 2.8, 0, 7); ctx.arc(8.5, -12 - as, 2.8, 0, 7); ctx.fill(); }
    // head
    ctx.fillStyle = C.skin;
    ctx.beginPath(); ctx.arc(0, -30, 10.5, 0, 7); ctx.fill();
    // hair
    ctx.fillStyle = C.hair;
    if (girl) {
      ctx.beginPath(); ctx.arc(0, -31, 11.2, Math.PI * 0.98, Math.PI * 2.02); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-11, -32); ctx.quadraticCurveTo(-2, -28, 4, -34); ctx.quadraticCurveTo(8, -29, 11, -31); ctx.lineTo(10, -37); ctx.lineTo(-10, -37); ctx.closePath(); ctx.fill();
      if (bride) {
        // tiara with little flowers
        ctx.fillStyle = '#ffd86b';
        ctx.beginPath(); ctx.moveTo(-7, -40); ctx.lineTo(-5, -45); ctx.lineTo(-2.5, -41.5); ctx.lineTo(0.5, -47); ctx.lineTo(3, -41.5); ctx.lineTo(5.5, -45); ctx.lineTo(7, -40); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#9be7ff'; ctx.beginPath(); ctx.arc(0.5, -43.6, 1.2, 0, 7); ctx.fill();
        ctx.fillStyle = '#ff8fb8'; ctx.beginPath(); ctx.arc(-5, -43, 0.8, 0, 7); ctx.arc(5.5, -43, 0.8, 0, 7); ctx.fill();
        for (const [fx, fy] of [[-9.5, -38.5], [9.5, -38.5]]) {
          ctx.fillStyle = '#ffffff'; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; ctx.beginPath(); ctx.arc(fx + Math.cos(a) * 1.5, fy + Math.sin(a) * 1.5, 1.2, 0, 7); ctx.fill(); }
          ctx.fillStyle = '#ffcf4d'; ctx.beginPath(); ctx.arc(fx, fy, 0.9, 0, 7); ctx.fill();
        }
      } else {
      // bow
      ctx.fillStyle = C.bow;
      ctx.save(); ctx.translate(-5, -41); ctx.rotate(-0.3);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-7, -4); ctx.lineTo(-7, 4); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(7, -4); ctx.lineTo(7, 4); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, 7); ctx.fill(); ctx.restore();
      }
    } else {
      ctx.beginPath(); ctx.arc(0, -31, 11.2, Math.PI * 0.95, Math.PI * 2.05); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-11, -31); ctx.lineTo(-8, -27); ctx.lineTo(-5, -31); ctx.lineTo(-1, -28); ctx.lineTo(3, -32); ctx.lineTo(7, -29); ctx.lineTo(11, -32); ctx.lineTo(11, -36); ctx.lineTo(-11, -36); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-2, -41); ctx.quadraticCurveTo(2, -46, 6, -43); ctx.quadraticCurveTo(3, -42, 2, -40); ctx.closePath(); ctx.fill();
    }
    // face
    const blink = p.blinkT < 0 || kissing || sk > 0.6;
    if (hurt || stunned) {
      // squeezed >< eyes
      ctx.strokeStyle = '#2b2140'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
      for (const ex of [1.5, 7]) { ctx.beginPath(); ctx.moveTo(ex - 1.6, -30); ctx.lineTo(ex + 0.6, -28.4); ctx.lineTo(ex - 1.6, -27); ctx.stroke(); }
    } else if ((p.blindT || 0) > 0) {
      ctx.strokeStyle = '#2b2140'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-0.5, -28.5); ctx.lineTo(3.5, -28.5); ctx.moveTo(5, -28.5); ctx.lineTo(9, -28.5); ctx.stroke();
    } else if (dance || glowing || chewing) {
      ctx.strokeStyle = '#2b2140'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(1.5, -27.6, 1.7, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); ctx.beginPath(); ctx.arc(7, -27.6, 1.7, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    } else {
      ctx.fillStyle = '#2b2140';
      const eh = blink ? 0.4 : 2.3;
      ctx.beginPath(); ctx.ellipse(1.5, -28.5, 1.6, eh, 0, 0, 7); ctx.ellipse(7, -28.5, 1.6, eh, 0, 0, 7); ctx.fill();
      if (!blink) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(2, -29.5, 0.6, 0, 7); ctx.arc(7.5, -29.5, 0.6, 0, 7); ctx.fill(); }
    }
    ctx.fillStyle = glowing ? 'rgba(255,80,120,0.75)' : sipping || dance || eating ? 'rgba(255,100,130,0.6)' : 'rgba(255,120,140,0.45)';
    const bl = glowing || chewing ? 1.35 : 1;
    ctx.beginPath(); ctx.ellipse(-2, -25, 2.2 * bl, 1.4 * bl, 0, 0, 7); ctx.ellipse(9.5, -25, 2 * bl, 1.4 * bl, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#7a3a3a'; ctx.lineWidth = 1; ctx.lineCap = 'round';
    if (biting || (hurt && !chewing)) {
      // wide open mouth with little white teeth
      const o = biting ? Math.sin(Math.min(1, ak * 1.6) * Math.PI) : 0.6;
      ctx.fillStyle = '#7a1f2e'; ctx.beginPath(); ctx.ellipse(5, -24.4, 2.6, 0.6 + o * 2.2, 0, 0, 7); ctx.fill();
      if (biting) {
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 3; i++) { const tx = 3 + i * 1.6; ctx.beginPath(); ctx.moveTo(tx - 0.7, -24.4 - o * 2); ctx.lineTo(tx + 0.7, -24.4 - o * 2); ctx.lineTo(tx, -23.2 - o * 1.6); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(tx - 0.7, -24.4 + o * 2); ctx.lineTo(tx + 0.7, -24.4 + o * 2); ctx.lineTo(tx, -25.6 + o * 1.6); ctx.closePath(); ctx.fill(); }
      }
    } else if (chewing) { ctx.fillStyle = '#a8434f'; const o = Math.abs(Math.sin((p.actT || 0) * 16)); ctx.beginPath(); ctx.ellipse(4.5, -24.6, 1.8, 0.4 + o * 1.1, 0, 0, 7); ctx.fill(); }
    else if (dance || glowing) { ctx.fillStyle = '#a8434f'; ctx.beginPath(); ctx.arc(4.5, -25.2, 2, 0, Math.PI); ctx.fill(); }
    else if ((eating || orange || sandwich) && ek > 0.5) { ctx.fillStyle = '#a8434f'; ctx.beginPath(); ctx.ellipse(4.5, -24.6, 1.7, 1.6, 0, 0, 7); ctx.fill(); }
    else if (sk > 0.4) { ctx.beginPath(); ctx.arc(4.5, -24.8, 0.9, 0, 7); ctx.stroke(); }
    else {
      ctx.beginPath();
      if (p.vy > 400 && air) ctx.arc(4.5, -24, 1.5, 0, 7); else ctx.arc(4.5, -25, 1.8, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
    if (girl) { ctx.strokeStyle = '#2b2140'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(8.5, -31); ctx.lineTo(9.8, -32); ctx.moveTo(3, -31); ctx.lineTo(1.6, -32); ctx.stroke(); }
    if (sipping) {
      const cx = 9.5 - sk * 2, cy = -12 - sk * 6;
      drawMatchaCup(ctx, cx, cy);
      ctx.fillStyle = C.skin; ctx.beginPath(); ctx.arc(cx + 3, cy + 1.2, 2.8, 0, 7); ctx.fill();
    }
    if (eating) {
      drawIskender(ctx, 4.5, -9.5, p);
      ctx.fillStyle = C.skin; ctx.beginPath(); ctx.arc(-3.5, -9, 2.8, 0, 7); ctx.fill();
      // fork: plate -> mouth
      const hx = 11 - ek * 3, hy = -12 - ek * 11.5;
      const tx = hx - 4.2 + ek * 0.4, ty = hy - 1.5 - ek * 1.2;
      ctx.strokeStyle = '#c9ced8'; ctx.lineWidth = 1.1; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(hx + 1.5, hy + 0.8); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.lineWidth = 0.55;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx - 2, ty - 0.6 + i * 0.75); ctx.stroke(); }
      if (!p.sipped && ek > 0.02) { ctx.fillStyle = '#9a4f2a'; rr(ctx, tx - 3.4, ty - 1.4, 2.8, 2.2, 0.8); ctx.fill(); ctx.fillStyle = '#d9302c'; ctx.fillRect(tx - 3.2, ty - 1.5, 2.4, 0.7); }
      ctx.fillStyle = C.skin; ctx.beginPath(); ctx.arc(hx, hy, 2.8, 0, 7); ctx.fill();
    }
    if (orange) {
      // a juicy orange: a few bites taken out of it already
      const hx = 9.5 - ek * 2.5, hy = -12 - ek * 9;
      const bites = Math.min(3, Math.floor((p.actT || 0) / 1.8 + (p.sipped ? 1 : 0)));
      ctx.save(); ctx.translate(hx - 1.5, hy - 3.2);
      const og = ctx.createRadialGradient(-1.2, -1.2, 0.5, 0, 0, 4.6);
      og.addColorStop(0, '#ffc15a'); og.addColorStop(1, '#ff8a00');
      ctx.fillStyle = og; ctx.beginPath(); ctx.arc(0, 0, 4.4, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(200,90,0,0.5)'; for (const [dx, dy] of [[1.6, 1.4], [-1.8, 0.8], [0.4, -1.9], [2.4, -0.8]]) { ctx.beginPath(); ctx.arc(dx, dy, 0.3, 0, 7); ctx.fill(); }
      if (bites > 0) {
        ctx.fillStyle = '#ffd88a'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 4.4, -Math.PI * 0.55, -Math.PI * 0.55 + bites * 0.55); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 0.4; for (let i = 0; i <= bites; i++) { const a = -Math.PI * 0.55 + i * 0.55; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 4.2, Math.sin(a) * 4.2); ctx.stroke(); }
      }
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(-1.8, -2, 1.1, 0.6, -0.6, 0, 7); ctx.fill();
      ctx.fillStyle = '#4caf50'; ctx.beginPath(); ctx.ellipse(1.6, -4.6, 1.7, 0.7, -0.5, 0, 7); ctx.fill();
      ctx.restore();
      ctx.fillStyle = C.skin; ctx.beginPath(); ctx.arc(hx, hy, 2.8, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(-8.5, -12, 2.8, 0, 7); ctx.fill();
    }
    if (sandwich) {
      const hx = 9.5 - ek * 2.5, hy = -12 - ek * 9;
      const bites = Math.min(4, Math.floor((p.actT || 0) / 1.8 + (p.sipped ? 1 : 0)));
      drawSandwich(ctx, hx - 1, hy - 3, bites);
      ctx.fillStyle = C.skin; ctx.beginPath(); ctx.arc(hx, hy, 2.8, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(-8.5, -12, 2.8, 0, 7); ctx.fill();
    }
    if (slapping) {
      // a big open-hand swing from behind her head to the front, with swoosh lines
      const a = -2.4 + Math.min(1, ak * 1.7) * 2.6, R = 15;
      const hx = Math.cos(a) * R + 1, hy = -20 + Math.sin(a) * R;
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(1, -20, R + 2, Math.max(-2.4, a - 1.2), a); ctx.stroke();
      ctx.beginPath(); ctx.arc(1, -20, R - 2, Math.max(-2.4, a - 0.8), a); ctx.stroke();
      ctx.fillStyle = C.body; ctx.save(); ctx.translate(1, -20); ctx.rotate(a); rr(ctx, 0, -2.2, R - 3, 4.4, 2.2); ctx.fill(); ctx.restore();
      ctx.fillStyle = C.skin; ctx.save(); ctx.translate(hx, hy); ctx.rotate(a); rr(ctx, -2.5, -3.6, 5.4, 7.2, 2.4); ctx.fill(); ctx.restore();
    }
    if (throwing) {
      const k = Math.min(1, ak * 1.6), a = -2.6 + k * 2.4, R = 13;
      const hx = Math.cos(a) * R + 1, hy = -21 + Math.sin(a) * R;
      ctx.fillStyle = C.body; ctx.save(); ctx.translate(1, -21); ctx.rotate(a); rr(ctx, 0, -2, R - 3, 4, 2); ctx.fill(); ctx.restore();
      if (k < 0.55) drawSlipper(ctx, hx, hy - 3, a + 1.4);
      ctx.fillStyle = C.skin; ctx.beginPath(); ctx.arc(hx, hy, 2.8, 0, 7); ctx.fill();
    }
    if (bride && !busyHands && !air && !p.anchored) {
      // bouquet held in both hands
      const bx = 6, by = -12;
      ctx.strokeStyle = '#5aa04a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(bx - 1, by + 1); ctx.lineTo(bx + 1, by + 7); ctx.moveTo(bx + 1, by + 1); ctx.lineTo(bx + 2.5, by + 6.5); ctx.stroke();
      ctx.fillStyle = '#ff9ec4'; ctx.fillRect(bx - 0.5, by + 2.2, 3, 1.6);
      const fl = [[-2.5, -1, '#ffffff'], [1.5, -2.5, '#ff7aa8'], [4, 0, '#ffffff'], [0.5, 1, '#ffc2d8'], [-1, -3.5, '#ff4f8b'], [3, -4, '#ffffff']];
      for (const [dx, dy, col] of fl) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(bx + dx, by + dy, 1.9, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#6cc35a'; ctx.beginPath(); ctx.ellipse(bx - 4, by + 0.5, 1.8, 0.8, 0.5, 0, 7); ctx.ellipse(bx + 6, by - 1, 1.8, 0.8, -0.5, 0, 7); ctx.fill();
      ctx.fillStyle = C.skin; ctx.beginPath(); ctx.arc(bx - 1.5, by + 4, 2.6, 0, 7); ctx.arc(bx + 2.5, by + 4.5, 2.6, 0, 7); ctx.fill();
    }
    if (punching) {
      // SUPER punch: the fist shoots forward with speed lines
      const k = 1 - p.punchT / 0.55, ext = Math.sin(Math.min(1, k * 2.2) * Math.PI * 0.5) * (1 - Math.max(0, k - 0.6) * 2);
      const fx = 9 + ext * 11, fy = -15;
      ctx.strokeStyle = 'rgba(255,230,140,0.85)'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(fx - 6 - ext * 8, fy + i * 3); ctx.lineTo(fx - 5, fy + i * 3); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,220,110,0.45)'; ctx.beginPath(); ctx.arc(fx, fy, 7 + ext * 2, 0, 7); ctx.fill();
      ctx.fillStyle = C.body; rr(ctx, 4, fy - 2.5, fx - 6, 5, 2.5); ctx.fill();
      ctx.fillStyle = C.skin; ctx.beginPath(); ctx.arc(fx, fy, 4.4, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(150,90,70,0.6)'; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(fx + 1.5, fy - 2.6); ctx.lineTo(fx + 1.5, fy + 2.6); ctx.moveTo(fx - 0.5, fy - 3); ctx.lineTo(fx - 0.5, fy + 3); ctx.stroke();
    }
    if (shining) {
      // she raises a little star wand (higher and bigger for the SUPER power)
      const sup = (p.superT || 0) > 0;
      const e = wandUp ? 1 : Math.min(1, (SHINE_DUR - p.shineT) * 5);
      const hx = 9.5, hy = -13 - 11 * e - (sup ? 6 : 0);
      ctx.strokeStyle = '#f4d58d'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + 4.5, hy - 7); ctx.stroke();
      ctx.fillStyle = C.skin; ctx.beginPath(); ctx.arc(hx, hy, 2.8, 0, 7); ctx.fill();
      const sx = hx + 5.2, sy = hy - 8.2;
      const ss = sup ? 1.6 : 1;
      ctx.fillStyle = sup ? 'rgba(255,150,230,0.5)' : 'rgba(255,240,150,0.45)'; ctx.beginPath(); ctx.arc(sx, sy, (5 + Math.sin(t * 9) * 0.8) * ss, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffd43b'; starPath(ctx, sx, sy, 3.6 * ss, t * (sup ? 9 : 3)); ctx.fill();
      ctx.fillStyle = '#fff'; starPath(ctx, sx - 0.4, sy - 0.4, 1.3, t * 3); ctx.fill();
    }
    if (stunned) {
      ctx.fillStyle = '#ffe066';
      for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; starPath(ctx, Math.cos(a) * 9, -44 + Math.sin(a) * 2.5, 2.4, a); ctx.fill(); }
    }
    ctx.restore();
  }

  // the boy as a tangerine or a potato (cute face, tiny feet, still wearing his red scarf)
  function drawMorph(ctx, p, t, moving, air, bob) {
    const form = p.morphForm, wt = p.walkT;
    const ag = Math.min(1, (form === 'tangerine' ? MORPH_DUR - p.morphT : MORPH_DUR / 2 - p.morphT) * 4);
    const sc = 0.6 + 0.4 * (1 - Math.pow(1 - ag, 3)) + Math.sin(ag * Math.PI) * 0.15;
    // feet
    ctx.fillStyle = LOOK.boy.shoe;
    const la = moving ? Math.sin(wt) * 3 : 0;
    if (air) { rr(ctx, -6, -6, 5, 5, 2); ctx.fill(); rr(ctx, 1, -5, 5, 5, 2); ctx.fill(); }
    else { rr(ctx, -6 + la * 0.6, -5, 5, 5, 2); ctx.fill(); rr(ctx, 1 - la * 0.6, -5, 5, 5, 2); ctx.fill(); }
    ctx.translate(0, bob - 3);
    ctx.scale(sc, sc);
    const cy = -14;
    if (form === 'tangerine') {
      const g = ctx.createRadialGradient(-4, cy - 5, 2, 0, cy, 14);
      g.addColorStop(0, '#ffc15a'); g.addColorStop(0.6, '#ff9a1f'); g.addColorStop(1, '#f07800');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, cy, 13, 12, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(190,80,0,0.35)';
      for (const [dx, dy] of [[-8, -3], [-5, 5], [7, 4], [9, -4], [-2, 8], [3, -8], [-9, 2]]) { ctx.beginPath(); ctx.arc(dx, cy + dy, 0.6, 0, 7); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(-6, cy - 6, 3, 1.6, -0.6, 0, 7); ctx.fill();
      ctx.fillStyle = '#6b4a2b'; ctx.fillRect(-0.8, cy - 14, 1.6, 3);
      ctx.fillStyle = '#4caf50'; ctx.beginPath(); ctx.ellipse(3.5, cy - 13, 4, 1.7, -0.4 + Math.sin(t * 3) * 0.1, 0, 7); ctx.fill();
      ctx.fillStyle = '#66c35a'; ctx.beginPath(); ctx.ellipse(-3, cy - 13.5, 3, 1.4, 0.5, 0, 7); ctx.fill();
    } else {
      const g = ctx.createRadialGradient(-3, cy - 5, 2, 0, cy, 15);
      g.addColorStop(0, '#e2b07a'); g.addColorStop(1, '#a8743f');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(0, cy, 11, 14, 0.12, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(-8, cy + 6, 4.5, 0, 7); ctx.arc(8.5, cy - 4, 4, 0, 7); ctx.arc(-5, cy - 10, 4.5, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(110,70,30,0.45)';
      for (const [dx, dy, r] of [[-6, -6, 1], [6, 7, 1.2], [8, -8, 0.8], [-8, 5, 0.9], [2, 11, 0.8]]) { ctx.beginPath(); ctx.ellipse(dx, cy + dy, r, r * 0.7, 0.4, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#7bc96f'; ctx.beginPath(); ctx.ellipse(-3, cy - 15.5, 1, 2.6, -0.4 + Math.sin(t * 4) * 0.2, 0, 7); ctx.ellipse(-0.5, cy - 15, 1, 2.2, 0.4, 0, 7); ctx.fill();
    }
    // scarf
    ctx.fillStyle = '#e8344e';
    rr(ctx, -6, cy + 5, 12, 3.4, 1.7); ctx.fill();
    const flap = Math.sin(t * 8) * 2 + (moving || air ? 2 : 0);
    ctx.beginPath(); ctx.moveTo(-4, cy + 7); ctx.quadraticCurveTo(-9, cy + 9, -12 - flap, cy + 11 + flap * 0.4); ctx.lineTo(-9, cy + 12); ctx.quadraticCurveTo(-6, cy + 10, -2, cy + 8.5); ctx.closePath(); ctx.fill();
    // face
    const blink = p.blinkT < 0;
    ctx.fillStyle = '#2b2140';
    ctx.beginPath(); ctx.ellipse(1, cy - 1.5, 1.6, blink ? 0.4 : 2.3, 0, 0, 7); ctx.ellipse(6.5, cy - 1.5, 1.6, blink ? 0.4 : 2.3, 0, 0, 7); ctx.fill();
    if (!blink) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(1.5, cy - 2.5, 0.6, 0, 7); ctx.arc(7, cy - 2.5, 0.6, 0, 7); ctx.fill(); }
    if (form === 'potato') { ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-0.5, cy - 5.5); ctx.lineTo(2.5, cy - 4.8); ctx.moveTo(8, cy - 5.5); ctx.lineTo(5, cy - 4.8); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,90,110,0.55)'; ctx.beginPath(); ctx.ellipse(-2.5, cy + 2, 2.2, 1.3, 0, 0, 7); ctx.ellipse(9.5, cy + 2, 2, 1.3, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#7a3a3a'; ctx.lineWidth = 1; ctx.lineCap = 'round';
    ctx.beginPath(); if (form === 'potato') ctx.arc(4, cy + 3.6, 1.2, 0, 7); else ctx.arc(4, cy + 2, 1.9, 0.2, Math.PI - 0.2); ctx.stroke();
  }

  // İskender kebab on a plate: pide cubes, döner slices, tomato sauce, butter, yoghurt, pepper and tomato
  function drawIskender(ctx, cx, cy, p) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(cx, cy + 1.6, 9.5, 2.2, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(cx, cy, 9.5, 2.8, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#4c7fd6'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(cx, cy, 8.4, 2.2, 0, 0, 7); ctx.stroke();
    // pide cubes
    ctx.fillStyle = '#e2b26a';
    for (let i = 0; i < 4; i++) { rr(ctx, cx - 5.5 + i * 2.7, cy - 2.4 - (i % 2) * 0.4, 2.5, 2.1, 0.6); ctx.fill(); }
    // döner slices
    const sl = ['#8c4523', '#a8582f', '#7a3b1d', '#b0653a'];
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = sl[i % 4];
      ctx.beginPath(); ctx.ellipse(cx - 4.6 + i * 2.2, cy - 3.6 - Math.sin(i * 1.3) * 0.5, 1.9, 1.05, -0.35 + i * 0.12, 0, 7); ctx.fill();
    }
    // tomato sauce + melted butter glaze
    ctx.fillStyle = 'rgba(214,40,36,0.85)';
    ctx.beginPath(); ctx.ellipse(cx - 1, cy - 4.1, 4.8, 1, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,214,90,0.8)'; ctx.beginPath(); ctx.ellipse(cx - 2.4, cy - 4.5, 1.6, 0.45, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(cx + 0.4, cy - 4.7, 1.2, 0.4);
    // yoghurt dollop
    ctx.fillStyle = '#fbfbf6'; ctx.beginPath(); ctx.arc(cx - 6.6, cy - 1.6, 1.9, 0, 7); ctx.arc(cx - 6.1, cy - 2.9, 1.2, 0, 7); ctx.fill();
    // roasted green pepper + tomato
    ctx.fillStyle = '#3f9b3a'; ctx.beginPath(); ctx.ellipse(cx + 6.3, cy - 1.5, 2.5, 0.85, -0.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#2c7a2a'; ctx.fillRect(cx + 8.1, cy - 3.2, 0.5, 1);
    ctx.fillStyle = '#e8402f'; ctx.beginPath(); ctx.arc(cx + 4.3, cy - 2.4, 1.35, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(cx + 3.9, cy - 2.8, 0.4, 0, 7); ctx.fill();
    ctx.restore();
  }

  // iced strawberry matcha latte: pink strawberry milk at the bottom, matcha on top
  function drawMatchaCup(ctx, cx, cy) {
    const w1 = 3.7, w2 = 2.8, h = 4.8;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(cx - w1, cy - h); ctx.lineTo(cx + w1, cy - h); ctx.lineTo(cx + w2, cy + h); ctx.lineTo(cx - w2, cy + h); ctx.closePath();
    ctx.save(); ctx.clip();
    const g = ctx.createLinearGradient(0, cy - h, 0, cy + h);
    g.addColorStop(0, 'rgba(255,255,255,0.6)'); g.addColorStop(0.1, '#7cc46a'); g.addColorStop(0.42, '#a6d98c');
    g.addColorStop(0.52, '#fff3ea'); g.addColorStop(0.64, '#ffb3c9'); g.addColorStop(1, '#ff6f98');
    ctx.fillStyle = g; ctx.fillRect(cx - w1, cy - h, w1 * 2, h * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(cx - 2.5, cy - 2.5, 2, 2); ctx.fillRect(cx + 0.6, cy - 1.2, 1.8, 1.8);
    ctx.fillStyle = '#e8344e'; ctx.beginPath(); ctx.arc(cx - 1, cy + 3, 0.65, 0, 7); ctx.arc(cx + 1.3, cy + 2.2, 0.6, 0, 7); ctx.arc(cx + 0.2, cy + 3.9, 0.5, 0, 7); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 0.7; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(cx - w1 + 1, cy - h + 1.5, 0.7, h * 1.4);
    ctx.fillStyle = '#ffffff'; rr(ctx, cx - w1 - 0.7, cy - h - 1.3, (w1 + 0.7) * 2, 1.6, 0.8); ctx.fill();
    ctx.strokeStyle = '#ff5d8f'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx + 0.8, cy - h - 0.6); ctx.lineTo(cx - 3, cy - h - 4); ctx.stroke();
    ctx.fillStyle = '#ff3355'; ctx.beginPath(); ctx.moveTo(cx + w1 - 1.8, cy - h - 1.6); ctx.quadraticCurveTo(cx + w1 + 1.6, cy - h - 2.8, cx + w1 + 0.6, cy - h + 1.4); ctx.quadraticCurveTo(cx + w1 - 1.4, cy - h + 0.4, cx + w1 - 1.8, cy - h - 1.6); ctx.fill();
    ctx.fillStyle = '#51cf66'; ctx.beginPath(); ctx.ellipse(cx + w1 - 0.6, cy - h - 2.4, 1.2, 0.6, -0.4, 0, 7); ctx.fill();
    ctx.restore();
  }

  // =====================================================================
  //  World entities

  // a toasted sandwich: bread, lettuce, tomato, cheese
  function drawSandwich(ctx, cx, cy, bites) {
    ctx.save(); ctx.translate(cx, cy);
    ctx.fillStyle = '#d99a4e'; rr(ctx, -5, 1, 10, 2.6, 1.2); ctx.fill();
    ctx.fillStyle = '#6cc35a'; ctx.beginPath(); ctx.moveTo(-5.6, 1); for (let i = 0; i <= 6; i++) ctx.lineTo(-5.6 + i * 1.9, i % 2 ? 0 : 1.4); ctx.lineTo(5.6, 1.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.moveTo(-5, -0.2); ctx.lineTo(5, -0.2); ctx.lineTo(3.5, 1.6); ctx.lineTo(1, 0.6); ctx.lineTo(-2, 1.8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8402f'; ctx.fillRect(-4, -1.2, 3.2, 1.1); ctx.fillRect(0.8, -1.2, 3.2, 1.1);
    ctx.fillStyle = '#e8b06a'; rr(ctx, -5.2, -4, 10.4, 3, 1.4); ctx.fill();
    ctx.fillStyle = 'rgba(140,80,30,0.5)'; ctx.fillRect(-3, -3.2, 1.2, 0.5); ctx.fillRect(0.5, -3.4, 1.2, 0.5); ctx.fillRect(2.8, -2.9, 1, 0.5);
    if (bites > 0) { ctx.globalCompositeOperation = 'destination-out'; for (let i = 0; i < bites; i++) { ctx.beginPath(); ctx.arc(5.4 - i * 1.6, -1 + (i % 2), 2, 0, 7); ctx.fill(); } }
    ctx.restore();
  }
  function drawOrange(ctx, cx, cy, s) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s || 1, s || 1);
    const og = ctx.createRadialGradient(-1.2, -1.2, 0.5, 0, 0, 4.6);
    og.addColorStop(0, '#ffc15a'); og.addColorStop(1, '#ff8a00');
    ctx.fillStyle = og; ctx.beginPath(); ctx.arc(0, 0, 4.4, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(-1.8, -2, 1.1, 0.6, -0.6, 0, 7); ctx.fill();
    ctx.fillStyle = '#4caf50'; ctx.beginPath(); ctx.ellipse(1.6, -4.6, 1.7, 0.7, -0.5, 0, 7); ctx.fill();
    ctx.restore();
  }
  // the house slipper (terlik) she throws
  function drawSlipper(ctx, x, y, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
    ctx.fillStyle = '#3a2a6a'; ctx.beginPath(); ctx.ellipse(0, 0, 7, 3, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff8fb8'; ctx.beginPath(); ctx.ellipse(2.5, -1.4, 3.6, 2.2, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(2.5, -2.6, 0.9, 0, 7); ctx.fill();
    ctx.restore();
  }
  function drawFood(ctx, kind, cx, cy, t) {
    const bob = Math.sin((t || 0) * 3 + cx) * 1.5;
    ctx.save(); ctx.translate(0, bob);
    if (kind === 'iskender') drawIskender(ctx, cx, cy + 3, null);
    else if (kind === 'sandwich') { ctx.save(); ctx.translate(cx, cy); ctx.scale(1.3, 1.3); drawSandwich(ctx, 0, 0, 0); ctx.restore(); }
    else if (kind === 'matcha') { ctx.save(); ctx.translate(cx, cy); ctx.scale(1.3, 1.3); drawMatchaCup(ctx, 0, 0); ctx.restore(); }
    else if (kind === 'orange') drawOrange(ctx, cx, cy, 1.4);
    ctx.restore();
  }

  global.Chars = { PW, PH, LOOK, SHINE_DUR, MORPH_DUR, rr, heartPath, starPath, sipPhase, draw: drawCharacter, drawIskender, drawMatchaCup, drawSandwich, drawOrange, drawSlipper, drawFood };
})(typeof window !== 'undefined' ? window : globalThis);
