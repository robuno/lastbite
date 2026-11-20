/* Last Bite — English / Türkçe translations. */
(function (global) {
  'use strict';
  const KEY = 'lastbite.lang';

  const EN = {
    'title': 'Last Bite — a survival duel for two',
    'menu.kicker': 'Night 1 · the power grid is down',
    'menu.logo': '<span>Last</span> <span class="bite">Bite</span>',
    'menu.tagline': 'Two survivors. One dark night. Only one walks out.',
    'menu.name': 'Callsign', 'menu.namePh': 'e.g. Alex',
    'menu.host': 'Create a room', 'menu.join': 'Join with a code', 'menu.local': 'Same keyboard · split screen', 'menu.help': 'Survival manual',
    'menu.rivalry': 'Rivalry on this device — Him {b} : {g} Her',
    'join.title': 'Find your rival', 'join.sub': 'Enter the 5-letter room code they sent you.', 'join.go': 'Join', 'back': 'Back',
    'join.invite': 'Invite found! Set your callsign on the main menu if you like, then press Join.',
    'join.short': 'Room codes have 5 characters.', 'join.connecting': 'Connecting…',
    'lobby.code': 'Room code', 'lobby.copyCode': 'Copy code', 'lobby.copyLink': 'Copy invite link', 'lobby.waiting': 'Waiting for your rival…',
    'lobby.who': 'Pick your side', 'lobby.whoSub': "Click a survivor to make it Player 1's (left half of the screen).", 'lobby.leave': 'Leave',
    'lobby.choose': 'Choose arena →', 'lobby.openMap': 'Open arenas →',
    'char.boy': 'Him', 'char.girl': 'Her', 'char.boyRole': 'The Biter', 'char.girlRole': 'The Trickster',
    'lobby.boyMoves': '<li>🦷 Bite · bleeding</li><li>💨 Lunge bite</li><li>💡 Lights out · night eyes</li><li>🪤 Hidden bear trap</li><li>👃 Sniff her out</li><li>👰 Wedding gown curse</li>',
    'lobby.girlMoves': '<li>✋ Slap · big knockback</li><li>🦷 Bite</li><li>🩴 Throw a slipper</li><li>👻 Invisibility</li><li>✨ Blinding flash</li><li>🎭 Decoy · 🥔 Potato curse</li><li>⚡ Defibrillator shock</li><li>🔒 Break cage · 🧘 Break mat</li>',
    'lobby.creating': 'Creating your room…', 'lobby.send': 'Send this code (or the invite link) to your rival. Waiting for them…',
    'lobby.connected': 'Connected! Pick your survivor.', 'lobby.joined': 'Your rival is here! Pick your survivors.',
    'lobby.rejoin': 'Waiting for your rival to re-join with the same code…', 'lobby.fail': 'Could not create the room: {msg}',
    'lobby.bothPick': 'Both players pick a survivor to continue.', 'lobby.ready': 'Ready. {who} is in the dark with you.', 'lobby.readyAnon': 'Ready. Your rival is in the dark with you.',
    'lobby.you': 'You', 'lobby.partner': 'Rival', 'lobby.pick': 'Click to pick', 'lobby.p1': 'P1 · left screen · WASD', 'lobby.p2': 'P2 · right screen · Arrows',
    'toast.codeCopied': 'Code copied!', 'toast.linkCopied': 'Invite link copied — send it to your rival!', 'toast.disc': 'Your rival disconnected.',
    'toast.noPeer': 'Online library failed to load. Check your internet connection and refresh.', 'toast.taken': 'Your rival already picked that one.',
    'toast.full': 'That room already has two players.', 'toast.needChars': 'Both players need a survivor first.', 'toast.conn': 'Connection problem.',
    'net.timeout': 'Could not reach the room. Check the code and try again.', 'net.notFound': 'Room not found. Is the code right, and is your rival still in the lobby?',
    'arena.lobby': '← Lobby', 'arena.kicker': 'Choose where you fight', 'arena.title': 'Arenas', 'arena.rounds': 'Rounds', 'arena.bo3': 'Best of 3', 'arena.bo5': 'Best of 5',
    'arena.fight': 'Fight here ▶', 'arena.noteHost': 'Either of you can pick — you both drop in together.', 'arena.noteGuest': 'Pick an arena — you both drop in together.', 'arena.noteLocal': 'Split screen: P1 on the left, P2 on the right. No peeking!',
    'arena.hides': '{n} hiding spots', 'arena.lamps': '{n} lights', 'arena.foods': '{n} food spots',
    'map.house': 'Abandoned House', 'map.forest': 'Night Camp', 'map.market': 'Dead Market',
    'map.fair': 'Moonlight Fair', 'map.metro': 'Last Stop Metro', 'map.library': 'Whispering Library', 'map.ice': 'Frozen Lake',
    'mapd.fair': 'A closed-down funfair. Trampolines fling you onto booth roofs and the old roller coaster; hide behind face-in-the-hole boards while the carousel turns.',
    'mapd.metro': 'Every 20 seconds a train thunders down the tracks. The best food lies between the rails — listen for the bell and climb out in time.',
    'mapd.library': 'Pull the right book: secret bookcases connect far-off rooms. Hide inside grandfather clocks; the fireplace keeps the freeze away.',
    'mapd.ice': 'Everything is slippery. Thin ice cracks if you stand still and drops you into freezing water. Snowmen make great hiding spots.',
    'mapf.fair': '🎪 Trampolines', 'mapf.metro': '🚇 Passing train', 'mapf.library': '📖 Secret passages', 'mapf.ice': '🧊 Thin ice & slipping',
    'metro.sign': 'LAST STOP', 'metro.exit': 'EXIT',
    'mapd.house': 'Three creaking floors, closets to hide in, a breaker in the cellar. Ladders between storeys.',
    'mapd.forest': 'Bushes, tree branches and a campfire that never goes out. When the freeze comes, the fire keeps you alive.',
    'mapd.market': 'Aisles of shelves, flickering tubes, freezers to hide in — and food everywhere.',
    'hud.music': 'Music', 'hud.sfx': 'Sound effects', 'hud.menu': 'Menu (Esc)', 'hud.lang': 'Language', 'hud.round': 'Round {n}', 'hud.powerOff': '⚡ POWER OUT', 'hud.freeze': '❄ FREEZING',
    'hint.online': 'Move A/D · Jump W · Hide/Use S · Attacks J K L · Skills Q E R · Magic T · Her extras U I O · Eat 1-4 · Dance Z · Kiss F · Words 5-9 · Taunt C · Chat Enter',
    'hint.local': 'P1: WASD · F G H attack · Q E R skills · T magic · 1-4 eat   |   P2: Arrows · K L ; attack · I O P skills · U magic · 7-0 eat',
    'pause.title': 'Hold your breath', 'pause.resume': 'Resume', 'pause.restart': 'Restart match', 'pause.arena': 'Change arena', 'pause.controls': 'Survival manual', 'pause.quit': 'Quit to main menu',
    'pause.online': 'The night does not stop online — Restart and Change Arena affect both of you.', 'pause.local': 'Game paused.',
    'result.rematch': 'Rematch', 'result.arena': 'Other arena', 'result.lobby': 'Lobby', 'result.either': 'Either of you can pick what is next.',
    'result.kicker': 'Last one standing', 'result.winner': '{who} survived the night', 'result.you': 'You survived the night', 'result.lost': 'You did not make it',
    'result.dmg': 'damage', 'result.hits': 'hits', 'result.eaten': 'food eaten', 'result.rounds': 'rounds',
    'help.title': 'Survival manual',
    'help.sub': 'It is a blackout. You can only see what is lit — and so can your rival. Bring their health to zero to win the round. Win the most rounds to survive the night.',
    'help.basics': 'Everyone', 'help.boy': 'Him — the Biter', 'help.girl': 'Her — the Trickster', 'help.local': 'Same keyboard (split screen)', 'help.food': 'Food & fun', 'help.tricks': 'Survival tips', 'help.ok': 'Understood',
    'help.basicKeys': '<li><kbd>A</kbd><kbd>D</kbd> move · <kbd>W</kbd>/<kbd>Space</kbd> jump · <kbd>W</kbd>/<kbd>S</kbd> on ladders climb</li><li><kbd>S</kbd> <b>hide</b> in a closet/bush/freezer · open the one your rival hides in · flip the <b>breaker</b> · drop through ledges</li><li><kbd>J</kbd> <kbd>K</kbd> <kbd>L</kbd> attacks · <kbd>Q</kbd> <kbd>E</kbd> <kbd>R</kbd> skills · <kbd>T</kbd> magic</li><li><kbd>F</kbd> kiss — if you <b>both</b> press it side by side: truce, +12 health (once a round)</li><li><kbd>5</kbd>–<kbd>9</kbd> sweet words · <kbd>C</kbd> taunts · <kbd>Enter</kbd> chat</li>',
    'help.boyKeys': '<li><kbd>J</kbd> 🦷 Bite — 10 dmg + bleeding</li><li><kbd>K</kbd> 💨 Lunge bite — dash forward, 16 dmg</li><li><kbd>Q</kbd> 💡 Lights out — every lamp dies for 8 s; you get night eyes, she barely sees</li><li><kbd>E</kbd> 🪤 Bear trap — invisible to her until she is right on it (max 2)</li><li><kbd>R</kbd> 👃 Sniff — see her through walls, darkness, invisibility and closets</li><li><kbd>T</kbd> 👰 Wedding gown — she glows white, cannot vanish and moves slower</li>',
    'help.girlKeys': '<li><kbd>J</kbd> ✋ Slap — huge knockback, he lies on the floor for ~2.5 s</li><li><kbd>K</kbd> 🦷 Bite — 11 dmg</li><li><kbd>L</kbd> 🩴 Slipper — thrown from range</li><li><kbd>Q</kbd> 👻 Invisibility — 5.5 s, attacking breaks it</li><li><kbd>E</kbd> ✨ Flash — lights up the room and blinds him if he is close</li><li><kbd>R</kbd> 🎭 Decoy — a fake you; biting it stuns him</li><li><kbd>T</kbd> 🥔 Curse — he becomes a tangerine, then a potato: slow, and he cannot bite</li><li><kbd>U</kbd> ⚡ Medical shock — a defibrillator zaps him for 18 dmg and stuns him (close range)</li><li><kbd>I</kbd> 🔒 Break cage — locks him in a cage until you press it again to let him out</li><li><kbd>O</kbd> 🧘 Break mat — teleports him onto a mat beside you, stuck for 10 s</li>',
    'help.localKeys': '<li>P1 (left): <kbd>WASD</kbd> · attacks <kbd>F</kbd><kbd>G</kbd><kbd>H</kbd> · skills <kbd>Q</kbd><kbd>E</kbd><kbd>R</kbd> · magic <kbd>T</kbd> · her extras <kbd>5</kbd><kbd>6</kbd><kbd>Y</kbd> · eat <kbd>1</kbd>–<kbd>4</kbd> · dance <kbd>Z</kbd> · kiss <kbd>X</kbd> · words <kbd>C</kbd> · taunt <kbd>V</kbd></li><li>P2 (right): <kbd>←↑↓→</kbd> · attacks <kbd>K</kbd><kbd>L</kbd><kbd>;</kbd> · skills <kbd>I</kbd><kbd>O</kbd><kbd>P</kbd> · magic <kbd>U</kbd> · her extras <kbd>,</kbd><kbd>.</kbd><kbd>/</kbd> · eat <kbd>7</kbd>–<kbd>0</kbd> · dance <kbd>N</kbd> · kiss <kbd>M</kbd> · words <kbd>J</kbd> · taunt <kbd>B</kbd></li>',
    'help.foodKeys': '<li><kbd>1</kbd> 🥙 İskender — heals 34 over 4 s</li><li><kbd>2</kbd> 🥪 Sandwich — heals 20 over 3 s</li><li><kbd>3</kbd> 🍵 Strawberry matcha — run 35% faster for 10 s</li><li><kbd>4</kbd> 🍊 Orange — heals 10 and leaves a slippery peel behind for your rival</li><li><kbd>Z</kbd> 💃 Dance — finish it for +30% damage for 10 s</li><li>Eating and dancing make noise. Getting hit drops your food.</li>',
    'help.tips': '<li>🌑 Your rival only appears when they stand in light — or right next to you.</li><li>👂 Footsteps, chewing, music and talking make <b>noise rings</b> your rival can see.</li><li>🚪 Attack straight out of a hiding spot for an <b>ambush</b>: ×1.8 damage.</li><li>⚡ Anyone can flip the breaker to kill or restore the lights.</li><li>❄️ After 100 s the freeze comes and you both lose health — stay by a fire if there is one.</li><li>🎡 Every arena has its own trick: trampolines at the fair, a train in the metro, secret bookcases (<kbd>S</kbd>) in the library, thin ice on the lake.</li>',
    'chat.ph': 'Say something… (Enter) — it gives you away', 'chat.send': 'Send', 'chat.who': 'Who is talking?',
    'chat.dance': '💃 Dance', 'chat.matcha': '🍵 Matcha', 'chat.eat': '🥙 İskender', 'chat.sandwich': '🥪 Sandwich', 'chat.orange': '🍊 Orange', 'chat.magic': '🪄 Magic', 'chat.kiss': '💋 Truce kiss',
    'phrases': ['I love you so much 💕', "You're my everything ✨", 'Come here, kiss me 😘', "You're amazing! 🌟", "Don't ever let go 🫶", 'Come and catch me 😈', "I'm gonna bite you 🦷", 'Where are you? 👀'],
    'chips': ['💕 Love you', '✨ My everything', '😘 Kiss me', '🌟 Amazing', '🫶 Never let go', '😈 Catch me', '🦷 Gonna bite you', '👀 Where are you?'],
    'act.matcha': 'Drinking strawberry matcha 🍓🍵', 'act.eat': 'Eating İskender 🥙😋', 'act.sandwich': 'Eating a sandwich 🥪😋', 'act.orange': 'Eating an orange 🍊', 'act.dance': '💃 ♪ ♫',
    'act.morph': "I'm turning you into a tangerine and a potato, my love 🍊🥔", 'act.bride': "I'd love so much to see you like this, my love 💍",
    'act.zap': 'Time for a little shock therapy, my love ⚡🩺', 'act.zapped': 'BZZZZT ⚡⚡', 'act.cage': 'Sit in the break cage and rest a little, my love ☕🔒', 'act.caged': 'Let me out! 🔒', 'act.mat': 'Come on over to your break mat, my love 🧘☕', 'act.matted': "I'm stuck to the break mat! 😵",
    'game.cage': 'BREAK CAGE!', 'game.uncage': 'BREAK OVER', 'game.mat': 'BREAK MAT!',
    'act.lightsOff': 'Lights out 💡', 'act.sniff': 'sniff sniff…',
    'game.you': 'You', 'game.round': 'Round {n}', 'game.survive': 'SURVIVE', 'game.goal': 'Bring your rival to zero. Stay out of the light.',
    'game.ko': 'K.O.', 'game.roundTo': 'Round to {who}', 'game.waitHost': 'Waiting for the next round…',
    'game.freeze': 'THE FREEZE IS COMING', 'game.powerOn': 'POWER RESTORED', 'game.powerOff': 'LIGHTS OUT',
    'game.found': 'FOUND YOU!', 'game.slip': 'SLIP!', 'game.ambush': 'AMBUSH', 'game.blind': 'BLINDED!', 'game.decoy': 'DECOY!',
    'game.potatoNoBite': "Potatoes can't bite 🥔", 'game.tooFar': 'Too far away…', 'game.dressShows': 'The gown shows 👰',
    'game.truceUsed': 'No more truces this round', 'game.kissAsk': 'Truce? 💋', 'game.truce': 'TRUCE 💞 +12',
    'game.noFood': 'No {f} left — find some!', 'game.dropped': 'dropped it…', 'game.confident': 'CONFIDENT +30%', 'game.fast': 'MATCHA RUSH',
    'game.sniffed': '👃 He is sniffing you out!', 'game.hintHide': 'hide', 'game.hintSearch': 'search!', 'game.hintCut': 'cut power', 'game.hintFix': 'restore power', 'game.hintPortal': 'secret passage',
    'game.trainWarn': '🚇 TRAIN COMING — GET OFF THE TRACKS!', 'game.trainHit': 'Hit by the train! 🚇💥', 'game.crack': 'CRACK!', 'game.freezing': 'Freezing! 🥶',
    'game.hiding': 'Hiding… move or attack to burst out (ambush!)',
  };

  const TR = {
    'title': 'Son Isırık — iki kişilik hayatta kalma düellosu',
    'menu.kicker': '1. gece · şehrin elektriği kesik',
    'menu.logo': '<span>Son</span> <span class="bite">Isırık</span>',
    'menu.tagline': 'İki hayatta kalan. Tek karanlık gece. Sabahı sadece biri görecek.',
    'menu.name': 'Kod adın', 'menu.namePh': 'ör. Ayşe',
    'menu.host': 'Oda oluştur', 'menu.join': 'Kodla katıl', 'menu.local': 'Tek klavye · bölünmüş ekran', 'menu.help': 'Hayatta kalma kılavuzu',
    'menu.rivalry': 'Bu cihazdaki rekabet — Erkek {b} : {g} Kız',
    'join.title': 'Rakibini bul', 'join.sub': 'Sana gönderdiği 5 harfli oda kodunu yaz.', 'join.go': 'Katıl', 'back': 'Geri',
    'join.invite': 'Davet bulundu! İstersen ana menüde kod adını yaz, sonra Katıl\'a bas.',
    'join.short': 'Oda kodu 5 karakterdir.', 'join.connecting': 'Bağlanıyor…',
    'lobby.code': 'Oda kodu', 'lobby.copyCode': 'Kodu kopyala', 'lobby.copyLink': 'Davet linkini kopyala', 'lobby.waiting': 'Rakibin bekleniyor…',
    'lobby.who': 'Tarafını seç', 'lobby.whoSub': '1. Oyuncu (ekranın sol yarısı) olmak istediğin karaktere tıkla.', 'lobby.leave': 'Ayrıl',
    'lobby.choose': 'Arena seç →', 'lobby.openMap': 'Arenaları aç →',
    'char.boy': 'Erkek', 'char.girl': 'Kız', 'char.boyRole': 'Isırgan', 'char.girlRole': 'Hileci',
    'lobby.boyMoves': '<li>🦷 Isırık · kanama</li><li>💨 Atılarak ısırma</li><li>💡 Işıkları kes · gece gözü</li><li>🪤 Gizli ayı kapanı</li><li>👃 Kokusunu al</li><li>👰 Gelinlik büyüsü</li>',
    'lobby.girlMoves': '<li>✋ Tokat · uçurur</li><li>🦷 Isırık</li><li>🩴 Terlik fırlat</li><li>👻 Görünmezlik</li><li>✨ Kör eden ışık</li><li>🎭 Yem · 🥔 Patates büyüsü</li><li>⚡ Şok cihazı</li><li>🔒 Mola kafesi · 🧘 Mola paspası</li>',
    'lobby.creating': 'Odan oluşturuluyor…', 'lobby.send': 'Bu kodu (ya da davet linkini) rakibine gönder. Bekleniyor…',
    'lobby.connected': 'Bağlandın! Karakterini seç.', 'lobby.joined': 'Rakibin geldi! Karakterlerinizi seçin.',
    'lobby.rejoin': 'Rakibinin aynı kodla tekrar katılması bekleniyor…', 'lobby.fail': 'Oda oluşturulamadı: {msg}',
    'lobby.bothPick': 'Devam etmek için ikiniz de karakter seçin.', 'lobby.ready': 'Hazır. {who} seninle karanlıkta.', 'lobby.readyAnon': 'Hazır. Rakibin seninle karanlıkta.',
    'lobby.you': 'Sen', 'lobby.partner': 'Rakip', 'lobby.pick': 'Seçmek için tıkla', 'lobby.p1': '1.O · sol ekran · WASD', 'lobby.p2': '2.O · sağ ekran · Oklar',
    'toast.codeCopied': 'Kod kopyalandı!', 'toast.linkCopied': 'Davet linki kopyalandı — rakibine gönder!', 'toast.disc': 'Rakibinin bağlantısı koptu.',
    'toast.noPeer': 'Çevrimiçi kütüphane yüklenemedi. İnternet bağlantını kontrol edip sayfayı yenile.', 'toast.taken': 'Rakibin onu zaten seçti.',
    'toast.full': 'Bu odada zaten iki oyuncu var.', 'toast.needChars': 'Önce iki oyuncunun da karakter seçmesi gerek.', 'toast.conn': 'Bağlantı sorunu.',
    'net.timeout': 'Odaya ulaşılamadı. Kodu kontrol edip tekrar dene.', 'net.notFound': 'Oda bulunamadı. Kod doğru mu, rakibin hâlâ lobide mi?',
    'arena.lobby': '← Lobi', 'arena.kicker': 'Nerede dövüşeceğinizi seçin', 'arena.title': 'Arenalar', 'arena.rounds': 'Raunt', 'arena.bo3': '3 rauntta 2', 'arena.bo5': '5 rauntta 3',
    'arena.fight': 'Burada dövüş ▶', 'arena.noteHost': 'İkiniz de seçebilirsiniz — birlikte içeri düşersiniz.', 'arena.noteGuest': 'Bir arena seç — birlikte içeri düşersiniz.', 'arena.noteLocal': 'Bölünmüş ekran: 1.O solda, 2.O sağda. Kopya çekmek yok!',
    'arena.hides': '{n} saklanma yeri', 'arena.lamps': '{n} ışık', 'arena.foods': '{n} yemek noktası',
    'map.house': 'Terk Edilmiş Ev', 'map.forest': 'Gece Kampı', 'map.market': 'Ölü Market',
    'map.fair': 'Ay Işığı Lunaparkı', 'map.metro': 'Son Durak Metrosu', 'map.library': 'Fısıldayan Kütüphane', 'map.ice': 'Donmuş Göl',
    'mapd.fair': 'Kapanmış bir lunapark. Trambolinler seni stant çatılarına ve eski hız trenine fırlatır; atlıkarınca dönerken yüz deliği panolarının arkasına saklan.',
    'mapd.metro': 'Her 20 saniyede raylardan bir tren gürleyerek geçer. En iyi yemekler rayların arasında — zili duyunca zamanında yukarı çık.',
    'mapd.library': 'Doğru kitabı çek: gizli kitaplıklar uzak odaları birbirine bağlar. Ayaklı saatlerin içine saklan; şömine ayazı uzak tutar.',
    'mapd.ice': 'Her yer kaygan. İnce buzda durursan çatlar ve seni buz gibi suya düşürür. Kardan adamlar harika saklanma yeri.',
    'mapf.fair': '🎪 Trambolinler', 'mapf.metro': '🚇 Geçen tren', 'mapf.library': '📖 Gizli geçitler', 'mapf.ice': '🧊 İnce buz & kayma',
    'metro.sign': 'SON DURAK', 'metro.exit': 'ÇIKIŞ',
    'mapd.house': 'Gıcırdayan üç kat, saklanacak dolaplar, bodrumda bir sigorta kutusu. Katlar arası merdivenler.',
    'mapd.forest': 'Çalılar, ağaç dalları ve hiç sönmeyen bir kamp ateşi. Ayaz bastırınca seni ateş hayatta tutar.',
    'mapd.market': 'Raf koridorları, titreyen floresanlar, saklanacak dondurucular — ve her yerde yemek.',
    'hud.music': 'Müzik', 'hud.sfx': 'Ses efektleri', 'hud.menu': 'Menü (Esc)', 'hud.lang': 'Dil', 'hud.round': '{n}. Raunt', 'hud.powerOff': '⚡ ELEKTRİK YOK', 'hud.freeze': '❄ AYAZ',
    'hint.online': 'Hareket A/D · Zıpla W · Saklan/Kullan S · Saldırı J K L · Yetenek Q E R · Büyü T · Kız ekstraları U I O · Ye 1-4 · Dans Z · Öp F · Sözler 5-9 · Laf at C · Sohbet Enter',
    'hint.local': '1.O: WASD · F G H saldırı · Q E R yetenek · T büyü · 1-4 ye   |   2.O: Oklar · K L ; saldırı · I O P yetenek · U büyü · 7-0 ye',
    'pause.title': 'Nefesini tut', 'pause.resume': 'Devam et', 'pause.restart': 'Maçı yeniden başlat', 'pause.arena': 'Arena değiştir', 'pause.controls': 'Hayatta kalma kılavuzu', 'pause.quit': 'Ana menüye dön',
    'pause.online': 'Çevrimiçi gece durmaz — Yeniden Başlat ve Arena Değiştir ikinizi de etkiler.', 'pause.local': 'Oyun duraklatıldı.',
    'result.rematch': 'Rövanş', 'result.arena': 'Başka arena', 'result.lobby': 'Lobi', 'result.either': 'Sıradakini ikiniz de seçebilirsiniz.',
    'result.kicker': 'Ayakta kalan son kişi', 'result.winner': 'Geceyi {who} atlattı', 'result.you': 'Geceyi sen atlattın', 'result.lost': 'Sabahı göremedin',
    'result.dmg': 'hasar', 'result.hits': 'vuruş', 'result.eaten': 'yenen yemek', 'result.rounds': 'raunt',
    'help.title': 'Hayatta kalma kılavuzu',
    'help.sub': 'Elektrikler kesik. Sadece aydınlıkta olanı görebilirsin — rakibin de öyle. Raundu kazanmak için canını sıfıra indir. En çok raundu kazanan geceyi atlatır.',
    'help.basics': 'Herkes', 'help.boy': 'Erkek — Isırgan', 'help.girl': 'Kız — Hileci', 'help.local': 'Tek klavye (bölünmüş ekran)', 'help.food': 'Yemek & eğlence', 'help.tricks': 'Hayatta kalma ipuçları', 'help.ok': 'Anladım',
    'help.basicKeys': '<li><kbd>A</kbd><kbd>D</kbd> hareket · <kbd>W</kbd>/<kbd>Boşluk</kbd> zıpla · merdivende <kbd>W</kbd>/<kbd>S</kbd> tırman</li><li><kbd>S</kbd> dolaba/çalıya/dondurucuya <b>saklan</b> · rakibin saklandığını aç · <b>sigortayı</b> indir/kaldır · çıkıntıdan aşağı in</li><li><kbd>J</kbd> <kbd>K</kbd> <kbd>L</kbd> saldırılar · <kbd>Q</kbd> <kbd>E</kbd> <kbd>R</kbd> yetenekler · <kbd>T</kbd> büyü</li><li><kbd>F</kbd> öpücük — yan yanayken <b>ikiniz de</b> basarsanız: ateşkes, +12 can (raunt başına bir kez)</li><li><kbd>5</kbd>–<kbd>9</kbd> tatlı sözler · <kbd>C</kbd> laf atma · <kbd>Enter</kbd> sohbet</li>',
    'help.boyKeys': '<li><kbd>J</kbd> 🦷 Isırık — 10 hasar + kanama</li><li><kbd>K</kbd> 💨 Atılarak ısırma — ileri fırla, 16 hasar</li><li><kbd>Q</kbd> 💡 Işıkları kes — 8 sn tüm lambalar söner; sende gece gözü olur, o zor görür</li><li><kbd>E</kbd> 🪤 Ayı kapanı — tam üstüne gelene kadar görünmez (en fazla 2)</li><li><kbd>R</kbd> 👃 Kokla — onu duvarların, karanlığın, görünmezliğin ve dolapların ardından gör</li><li><kbd>T</kbd> 👰 Gelinlik — beyaz parlar, görünmez olamaz ve yavaşlar</li>',
    'help.girlKeys': '<li><kbd>J</kbd> ✋ Tokat — uçurur, ~2,5 sn yerde yatırır</li><li><kbd>K</kbd> 🦷 Isırık — 11 hasar</li><li><kbd>L</kbd> 🩴 Terlik — uzaktan fırlat</li><li><kbd>Q</kbd> 👻 Görünmezlik — 5,5 sn, saldırınca bozulur</li><li><kbd>E</kbd> ✨ Işık — odayı aydınlatır, yakınındaysa onu kör eder</li><li><kbd>R</kbd> 🎭 Yem — sahte bir sen; ısırırsa sersemler</li><li><kbd>T</kbd> 🥔 Büyü — önce mandalina, sonra patates olur: yavaşlar ve ısıramaz</li><li><kbd>U</kbd> ⚡ Şok cihazı — defibrilatörle 18 hasar verir ve sersemletir (yakın mesafe)</li><li><kbd>I</kbd> 🔒 Mola kafesi — tekrar basıp bırakana kadar onu kafese kilitler</li><li><kbd>O</kbd> 🧘 Mola paspası — onu yanındaki paspasa ışınlar, 10 sn yapışıp kalır</li>',
    'help.localKeys': '<li>1.O (sol): <kbd>WASD</kbd> · saldırı <kbd>F</kbd><kbd>G</kbd><kbd>H</kbd> · yetenek <kbd>Q</kbd><kbd>E</kbd><kbd>R</kbd> · büyü <kbd>T</kbd> · kız ekstraları <kbd>5</kbd><kbd>6</kbd><kbd>Y</kbd> · ye <kbd>1</kbd>–<kbd>4</kbd> · dans <kbd>Z</kbd> · öp <kbd>X</kbd> · söz <kbd>C</kbd> · laf <kbd>V</kbd></li><li>2.O (sağ): <kbd>←↑↓→</kbd> · saldırı <kbd>K</kbd><kbd>L</kbd><kbd>;</kbd> · yetenek <kbd>I</kbd><kbd>O</kbd><kbd>P</kbd> · büyü <kbd>U</kbd> · kız ekstraları <kbd>,</kbd><kbd>.</kbd><kbd>/</kbd> · ye <kbd>7</kbd>–<kbd>0</kbd> · dans <kbd>N</kbd> · öp <kbd>M</kbd> · söz <kbd>J</kbd> · laf <kbd>B</kbd></li>',
    'help.foodKeys': '<li><kbd>1</kbd> 🥙 İskender — 4 sn\'de 34 can</li><li><kbd>2</kbd> 🥪 Sandviç — 3 sn\'de 20 can</li><li><kbd>3</kbd> 🍵 Çilekli matcha — 10 sn %35 daha hızlı koş</li><li><kbd>4</kbd> 🍊 Portakal — 10 can, arkanda rakibin için kaygan bir kabuk bırakır</li><li><kbd>Z</kbd> 💃 Dans — bitirirsen 10 sn %30 fazla hasar</li><li>Yemek ve dans ses çıkarır. Darbe alırsan yemeğin düşer.</li>',
    'help.tips': '<li>🌑 Rakibin sadece ışıkta — ya da dibindeyken — görünür.</li><li>👂 Ayak sesi, çiğneme, müzik ve konuşma rakibinin görebileceği <b>ses halkaları</b> yapar.</li><li>🚪 Saklandığın yerden doğrudan saldır: <b>pusu</b>, ×1,8 hasar.</li><li>⚡ Herkes sigortayı indirip ışıkları söndürebilir ya da geri açabilir.</li><li>❄️ 100 sn sonra ayaz basar, ikinizin de canı azalır — ateş varsa yanında kal.</li><li>🎡 Her arenanın kendi numarası var: lunaparkta trambolinler, metroda tren, kütüphanede gizli kitaplıklar (<kbd>S</kbd>), gölde ince buz.</li>',
    'chat.ph': 'Bir şey yaz… (Enter) — yerini belli eder', 'chat.send': 'Gönder', 'chat.who': 'Kim konuşuyor?',
    'chat.dance': '💃 Dans', 'chat.matcha': '🍵 Matcha', 'chat.eat': '🥙 İskender', 'chat.sandwich': '🥪 Sandviç', 'chat.orange': '🍊 Portakal', 'chat.magic': '🪄 Büyü', 'chat.kiss': '💋 Ateşkes öpücüğü',
    'phrases': ['Seni çok seviyorum 💕', 'Sen benim her şeyimsin ✨', 'Gel buraya, öp beni 😘', 'Harikasın! 🌟', 'Beni hiç bırakma 🫶', 'Gel de yakala beni 😈', 'Seni ısıracağım 🦷', 'Neredesin? 👀'],
    'chips': ['💕 Seni seviyorum', '✨ Her şeyimsin', '😘 Öp beni', '🌟 Harikasın', '🫶 Bırakma beni', '😈 Yakala beni', '🦷 Isıracağım', '👀 Neredesin?'],
    'act.matcha': 'Çilekli matcha içiyorum 🍓🍵', 'act.eat': 'İskender yiyorum 🥙😋', 'act.sandwich': 'Sandviç yiyorum 🥪😋', 'act.orange': 'Portakal yiyorum 🍊', 'act.dance': '💃 ♪ ♫',
    'act.morph': 'Seni mandalina ve patatese çeviriyorum aşkım 🍊🥔', 'act.bride': 'Seni böyle görmeyi çok istiyorum aşkım 💍',
    'act.zap': 'Sana biraz şok tedavisi aşkım ⚡🩺', 'act.zapped': 'ZZZZRT ⚡⚡', 'act.cage': 'Mola kafesine gir de biraz dinlen aşkım ☕🔒', 'act.caged': 'Çıkarın beni! 🔒', 'act.mat': 'Gel bakalım mola paspasına aşkım 🧘☕', 'act.matted': 'Mola paspasına yapıştım! 😵',
    'game.cage': 'MOLA KAFESİ!', 'game.uncage': 'MOLA BİTTİ', 'game.mat': 'MOLA PASPASI!',
    'act.lightsOff': 'Işıklar sönsün 💡', 'act.sniff': 'kokluyorum…',
    'game.you': 'Sen', 'game.round': '{n}. Raunt', 'game.survive': 'HAYATTA KAL', 'game.goal': 'Rakibinin canını sıfırla. Işıktan uzak dur.',
    'game.ko': 'NAKAVT', 'game.roundTo': 'Raunt: {who}', 'game.waitHost': 'Sıradaki raunt bekleniyor…',
    'game.freeze': 'AYAZ GELİYOR', 'game.powerOn': 'ELEKTRİK GELDİ', 'game.powerOff': 'IŞIKLAR SÖNDÜ',
    'game.found': 'BULDUM SENİ!', 'game.slip': 'KAYDI!', 'game.ambush': 'PUSU', 'game.blind': 'KÖR OLDU!', 'game.decoy': 'YEM!',
    'game.potatoNoBite': 'Patatesler ısıramaz 🥔', 'game.tooFar': 'Çok uzakta…', 'game.dressShows': 'Gelinlik belli oluyor 👰',
    'game.truceUsed': 'Bu raunt başka ateşkes yok', 'game.kissAsk': 'Ateşkes? 💋', 'game.truce': 'ATEŞKES 💞 +12',
    'game.noFood': '{f} kalmadı — bul biraz!', 'game.dropped': 'düşürdü…', 'game.confident': 'ÖZGÜVEN +%30', 'game.fast': 'MATCHA HIZI',
    'game.sniffed': '👃 Kokunu alıyor!', 'game.hintHide': 'saklan', 'game.hintSearch': 'ara!', 'game.hintCut': 'elektriği kes', 'game.hintFix': 'elektriği aç', 'game.hintPortal': 'gizli geçit',
    'game.trainWarn': '🚇 TREN GELİYOR — RAYLARDAN ÇIK!', 'game.trainHit': 'Tren çarptı! 🚇💥', 'game.crack': 'ÇATIRT!', 'game.freezing': 'Donuyorum! 🥶',
    'game.hiding': 'Saklanıyorsun… hareket et ya da saldır (pusu!)',
  };

  function detect() {
    try { const s = localStorage.getItem(KEY); if (s === 'en' || s === 'tr') return s; } catch (e) { /* ignore */ }
    const n = (global.navigator && (navigator.language || '')).toLowerCase();
    return n.startsWith('tr') ? 'tr' : 'en';
  }

  const I18N = {
    lang: detect(),
    listeners: [],
    dict() { return this.lang === 'tr' ? TR : EN; },
    t(key, vars) {
      let s = this.dict()[key];
      if (s === undefined) s = EN[key];
      if (s === undefined) return key;
      if (typeof s === 'string' && vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
      return s;
    },
    set(lang) {
      if (lang !== 'en' && lang !== 'tr') return;
      this.lang = lang;
      try { localStorage.setItem(KEY, lang); } catch (e) { /* ignore */ }
      this.apply();
      this.listeners.forEach(fn => { try { fn(lang); } catch (e) { /* ignore */ } });
    },
    toggle() { this.set(this.lang === 'tr' ? 'en' : 'tr'); },
    onChange(fn) { this.listeners.push(fn); },
    apply(root) {
      root = root || document;
      document.documentElement.lang = this.lang;
      document.title = this.t('title');
      root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = this.t(el.dataset.i18n); });
      root.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = this.t(el.dataset.i18nHtml); });
      root.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = this.t(el.dataset.i18nPh); });
      root.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = this.t(el.dataset.i18nTitle); });
      root.querySelectorAll('.lang-btn').forEach(el => { el.innerHTML = this.lang === 'tr' ? '<b>TR</b>·EN' : 'TR·<b>EN</b>'; });
    },
  };
  global.I18N = I18N;
})(typeof window !== 'undefined' ? window : globalThis);
