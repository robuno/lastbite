# Last Bite

A dark 1v1 **survival duel** for two players. It's a blackout night. You only see what's lit, and so does your rival. He bites. She slaps, bites and throws slippers. Bring your rival to zero to win the round; win the most rounds to survive the night.

Built with vanilla JavaScript, HTML5 Canvas and WebRTC. You can play online across two browsers, or locally on one keyboard with a **split screen** (so hiding really works).

---

## Highlights

- **Asymmetric survivors.** *Him (the Biter):* Bite with bleeding, Lunge Bite, **Lights Out** (he gets night eyes), hidden **Bear Trap**, **Sniff** (sees her through anything), Wedding-gown curse. *Her (the Trickster):* Slap, Bite, **Slipper** throw, **Invisibility**, blinding **Flash**, **Decoy**, Tangerine → Potato curse, medical **Defibrillator shock**, **Break Cage** (locks him in until she lets him out) and **Break Mat** (teleports him beside her, stuck for 10 s).
- **Stealth & light.** Lamps, a breaker anyone can flip, closets, bushes and freezers to hide in (attack out of one for an ×1.8 **ambush**), and noise rings from footsteps, chewing, dancing and talking.
- **Survival.** Food pickups: İskender and sandwiches heal, strawberry matcha makes you faster, and an orange heals you and leaves a slippery peel for your rival. Dancing gives a damage buff. A kiss is a once-per-round truce, and only works if you both press it. After 100 s the freeze comes; in the Night Camp the campfire keeps you warm.
- **7 arenas:** Abandoned House, Night Camp, Dead Market, plus four with their own gimmick:
  - **Moonlight Fair** 🎡: trampolines fling you onto booth roofs and a dead roller coaster; face-in-the-hole boards to hide behind, a turning carousel.
  - **Last Stop Metro** 🚇: a train thunders down the tracks every ~20 s (bell + red signals first). The best food lies between the rails; photo booths to hide in.
  - **Whispering Library** 📚: secret bookcases (`S`) connect far-off rooms in linked pairs (matching crest colours). Hide in grandfather clocks; a fireplace beats the freeze.
  - **Frozen Lake** 🧊: everything is slippery; thin ice cracks if you stand still and drops you into freezing water (swim with jump, climb the dock ladders). Snowmen to hide in.
  
  Matches are best of 3 or best of 5.
- **Kept from Heartstring:** the characters, sweet words, chat bubbles, dance, matcha, İskender, orange and magic.
- **Serverless online play** via PeerJS, with English and Turkish built in.

---

## How to Run & Implement

Because the game uses WebRTC and asset scripts, you must serve it over HTTP/HTTPS rather than opening `index.html` as a `file://` URL (which browsers block for security).

### 1. Run Locally

Open the project folder in your terminal and run any static server:

```bash
# Using Python 3
python3 -m http.server 3000

# Or using Node.js
npx serve .

# Or using PHP
php -S localhost:3000
```

Then visit `http://localhost:3000` in your browser.

> **Tip for testing online mode locally:** Open two separate browser windows (or an incognito window), create a room in one, and enter the 5-letter room code in the other.

---

### 2. Deploy to the Web

Since this is a purely static site, deployment takes 30 seconds:

- **GitHub Pages**: Push this repo to GitHub, go to **Settings > Pages**, choose `main` branch and `/ (root)` folder, then save.
- **Vercel / Netlify / Cloudflare Pages**: Connect your repository or drag-and-drop the folder. Leave the build command blank and set the publish directory to `.`.

---

### 3. Self-Hosting PeerJS Signaling (Optional)

By default, `js/net.js` uses the public PeerJS cloud server (`0.peerjs.com`) for room discovery and WebRTC handshake. If you prefer to host your own signaling server for lower latency or a private network:

1. Install and run [peerjs-server](https://github.com/peers/peerjs-server):
   ```bash
   npx peer -p 9000
   ```
2. In `js/net.js`, add your server config to the `new global.Peer(...)` calls:
   ```javascript
   const peer = new global.Peer(id, {
     host: 'localhost', // or your server domain
     port: 9000,
     path: '/myapp'
   });
   ```

---

## Controls

Online: `A`/`D` move, `W`/`Space` jump (and `W`/`S` on ladders), `S` hide, search a hiding spot, use the breaker or drop down, `J` `K` `L` attacks, `Q` `E` `R` skills, `T` magic, `1`–`4` eat (İskender, sandwich, matcha, orange), `Z` dance, `F` kiss/truce, `5`–`9` sweet words, `C` taunts, `Enter` chat.

Same keyboard: P1 `WASD`, attacks `F G H`, skills `Q E R`, magic `T`, eat `1-4`. P2 arrows, attacks `K L ;`, skills `I O P`, magic `U`, eat `7-0`. The full list is in the in-game **Survival manual**.

`?play=1..7` in the URL jumps straight into an arena on one keyboard.

## Project Structure

```text
├── index.html     # screens, HUD, modals
├── css/style.css  # survival UI theme
└── js/
    ├── game.js    # duel engine: physics, combat, skills, light/visibility, split screen, netcode
    ├── chars.js   # character art (Him & Her), food props
    ├── maps.js    # the 7 arenas
    ├── ui.js      # menus, lobby, arena select, HUD, chat, results
    ├── net.js     # WebRTC P2P via PeerJS
    ├── audio.js   # synthesized SFX + dark drone music
    └── i18n.js    # English & Turkish
```

## License

MIT
