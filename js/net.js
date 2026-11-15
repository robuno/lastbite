/* Peer-to-peer networking via PeerJS (WebRTC). Works on static hosting such as Netlify.
 * The host registers a peer id derived from a short room code; the guest connects to it. */
(function (global) {
  'use strict';
  const PREFIX = 'lastbite-duel-v1-';
  const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  function genCode() {
    let s = '';
    for (let i = 0; i < 5; i++) s += ALPHA[Math.floor(Math.random() * ALPHA.length)];
    return s;
  }

  const Net = {
    peer: null, conn: null, role: null, code: null, handlers: {},
    on(ev, fn) { this.handlers[ev] = fn; },
    emit(ev, a) { if (this.handlers[ev]) this.handlers[ev](a); },
    available() { return typeof global.Peer === 'function'; },
    connected() { return !!(this.conn && this.conn.open); },

    host() {
      this.leave();
      this.role = 'host';
      const tryOpen = (attempt) => {
        this.code = genCode();
        const peer = new global.Peer(PREFIX + this.code, { debug: 1 });
        this.peer = peer;
        peer.on('open', () => this.emit('ready', this.code));
        peer.on('connection', (c) => {
          if (this.conn && this.conn.open) {
            c.on('open', () => { c.send({ t: 'full' }); setTimeout(() => c.close(), 400); });
            return;
          }
          this.attach(c);
        });
        peer.on('disconnected', () => { if (!peer.destroyed) { try { peer.reconnect(); } catch (e) { /* ignore */ } } });
        peer.on('error', (e) => {
          if (e.type === 'unavailable-id' && attempt < 5) { peer.destroy(); tryOpen(attempt + 1); return; }
          this.emit('error', e);
        });
      };
      tryOpen(0);
    },

    join(code) {
      this.leave();
      this.role = 'guest';
      this.code = code.toUpperCase().trim();
      const peer = new global.Peer({ debug: 1 });
      this.peer = peer;
      let done = false;
      const timer = setTimeout(() => { if (!done) this.emit('error', { type: 'timeout', message: global.I18N ? global.I18N.t('net.timeout') : 'Could not reach the room. Check the code and try again.' }); }, 15000);
      peer.on('open', () => {
        const c = peer.connect(PREFIX + this.code, { reliable: true, serialization: 'json' });
        c.on('open', () => { done = true; clearTimeout(timer); });
        this.attach(c);
      });
      peer.on('error', (e) => {
        done = true; clearTimeout(timer);
        if (e.type === 'peer-unavailable') e.message = global.I18N ? global.I18N.t('net.notFound') : 'Room not found.';
        this.emit('error', e);
      });
    },

    attach(c) {
      this.conn = c;
      c.on('open', () => this.emit('connected'));
      c.on('data', (d) => this.emit('data', d));
      c.on('close', () => { if (this.conn === c) { this.conn = null; this.emit('disconnected'); } });
      c.on('error', () => { /* close handler covers it */ });
    },

    send(m) { if (this.conn && this.conn.open) { try { this.conn.send(m); } catch (e) { /* ignore */ } } },

    leave() {
      const c = this.conn, p = this.peer;
      this.conn = null; this.peer = null; this.role = null;
      try { if (c) c.close(); } catch (e) { /* ignore */ }
      try { if (p) p.destroy(); } catch (e) { /* ignore */ }
    },
  };
  global.Net = Net;
})(typeof window !== 'undefined' ? window : globalThis);
