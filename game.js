'use strict';

// ======================================================================
//  Revier 13 – bring die heruntergekommene Polizeistation auf Vordermann
// ======================================================================

const SAVE_KEY = 'revier13-save-v1';
const TICK_MS = 250;

const LEVEL_NAMES = ['Kaputt', 'Notdürftig', 'Renoviert', 'Modern', 'Hightech'];
const MAX_LEVEL = LEVEL_NAMES.length - 1;
const COST_MULT = [1, 2.5, 6, 14];          // Kosten für Stufe 0→1, 1→2, 2→3, 3→4
const BUILD_TIME = [4, 8, 14, 20];          // Bauzeit in Sekunden
const REP_REQUIRED = [0, 20, 100, 300];      // benötigter Ruf für die jeweilige Stufe

const ROOMS = [
  { id: 'empfang', name: 'Empfang', icon: '🛎️', base: 50,
    desc: 'Das Aushängeschild des Reviers. Bürger kommen hierher, um Anzeigen zu erstatten.',
    effect: l => `Ruf pro Einsatz +${l * 25}%`,
    decor: [['🪑', '🗞️'], ['🪑', '🪴'], ['🪑', '🪴', '🗂️'], ['🛋️', '🪴', '💻'], ['🛋️', '🖥️', '🤖']] },
  { id: 'buero', name: 'Büro', icon: '🗂️', base: 70,
    desc: 'Schreibtische für deine Beamten. Mehr Platz = mehr Personal.',
    effect: l => `Max. Beamte: ${maxOfficersFor(l)}`,
    decor: [['🪑'], ['🪑', '📠'], ['🪑', '🗄️', '☎️'], ['💻', '🪴', '🗄️'], ['🖥️', '🖥️', '🪴']] },
  { id: 'leitstelle', name: 'Leitstelle', icon: '📡', base: 110,
    desc: 'Hier gehen die Notrufe ein. Eine moderne Leitstelle bringt mehr Einsätze.',
    effect: l => `Meldungen alle ${spawnIntervalFor(l)}s, max. ${3 + l} offen` + (l >= 2 ? ', Auto-Zuweisung' : ''),
    decor: [['📻'], ['📻', '☎️'], ['☎️', '🗺️'], ['💻', '🗺️', '🎧'], ['🖥️', '🛰️', '🎧']] },
  { id: 'zellen', name: 'Zellen', icon: '🔒', base: 90,
    desc: 'Ohne funktionierende Zellen keine Festnahmen.',
    effect: l => l === 0 ? 'Festnahmen gesperrt' : `Festnahmen +${(l - 1) * 15}% Belohnung`,
    decor: [['⛓️'], ['⛓️', '🪣'], ['🛏️', '🚽'], ['🛏️', '📹'], ['🛏️', '📹', '🔐']] },
  { id: 'verhoer', name: 'Verhörraum', icon: '🎙️', base: 100,
    desc: 'Ein ruhiger Raum mit Einwegspiegel für Befragungen.',
    effect: l => l === 0 ? 'Verhöre gesperrt' : `Verhöre +${(l - 1) * 15}% Belohnung`,
    decor: [['🪑'], ['🪑', '💡'], ['🪑', '🪞'], ['🎙️', '🪞', '📹'], ['🎙️', '🖥️', '📹']] },
  { id: 'asservaten', name: 'Asservaten', icon: '📦', base: 80,
    desc: 'Beweismittel sicher lagern bringt Prämien bei jedem Fall.',
    effect: l => `Alle Belohnungen +${l * 10}%`,
    decor: [['📦'], ['📦', '📦'], ['🗄️', '📦'], ['🗄️', '🏷️', '🔐'], ['🗄️', '🔐', '🤖']] },
  { id: 'labor', name: 'Kriminallabor', icon: '🔬', base: 180,
    desc: 'Spurensicherung und DNA-Analyse für die schweren Fälle.',
    effect: l => l === 0 ? 'Spurensicherung gesperrt' : `Spurensicherung +${(l - 1) * 15}% Belohnung`,
    decor: [['🧪'], ['🧪', '🕯️'], ['🧪', '🔬'], ['🔬', '🧬', '💻'], ['🔬', '🧬', '🖥️']] },
  { id: 'garage', name: 'Fuhrpark', icon: '🚓', base: 140,
    desc: 'Funktionierende Streifenwagen bringen die Beamten schneller zum Einsatzort.',
    effect: l => `Einsatzdauer −${l * 10}%`,
    decor: [['🛞'], ['🚲', '🛞'], ['🚗', '🧰'], ['🚓', '🏍️'], ['🚓', '🚁', '🔌']] },
  { id: 'kantine', name: 'Kantine', icon: '☕', base: 60,
    desc: 'Gutes Essen hebt die Moral – motivierte Beamte arbeiten besser.',
    effect: l => `Belohnung +${l * 6}%, Ruf +${l}`,
    decor: [['🥫'], ['☕', '🥫'], ['☕', '🥨', '🪑'], ['☕', '🥗', '🍽️'], ['☕', '🥗', '🤖']] },
];
const ROOM_BY_ID = Object.fromEntries(ROOMS.map(r => [r.id, r]));

const CASE_TYPES = [
  { id: 'streife', name: 'Streifenfahrt', icon: '🚶', dur: 8, reward: 18, rep: 1, weight: 5 },
  { id: 'ruhe', name: 'Ruhestörung', icon: '📢', dur: 7, reward: 15, rep: 1, weight: 3 },
  { id: 'unfall', name: 'Verkehrsunfall', icon: '💥', dur: 12, reward: 32, rep: 2, weight: 3 },
  { id: 'anzeige', name: 'Diebstahlsanzeige', icon: '👜', dur: 10, reward: 30, rep: 2, weight: 3, needs: ['empfang', 1] },
  { id: 'festnahme', name: 'Festnahme', icon: '🔒', dur: 15, reward: 60, rep: 3, weight: 3, needs: ['zellen', 1], bonus: 'zellen' },
  { id: 'verhoer', name: 'Verhör', icon: '🎙️', dur: 14, reward: 70, rep: 3, weight: 2, needs: ['verhoer', 1], bonus: 'verhoer' },
  { id: 'spuren', name: 'Spurensicherung', icon: '🔬', dur: 18, reward: 110, rep: 4, weight: 2, needs: ['labor', 1], bonus: 'labor' },
  { id: 'einbruch', name: 'Einbruchserie', icon: '🏚️', dur: 22, reward: 160, rep: 5, weight: 1, needs: ['labor', 2] },
  { id: 'gross', name: 'Großeinsatz', icon: '🚨', dur: 30, reward: 280, rep: 8, weight: 1, needs: ['leitstelle', 3], officers: 2 },
];
const CASE_BY_ID = Object.fromEntries(CASE_TYPES.map(c => [c.id, c]));

const DEBRIS_TYPES = [
  { e: '🗑️', hp: 1 }, { e: '🕸️', hp: 1 }, { e: '🍾', hp: 1 }, { e: '📦', hp: 2 },
  { e: '🪵', hp: 2 }, { e: '💧', hp: 2 }, { e: '🧱', hp: 3 }, { e: '🪨', hp: 3 },
];

const NAMES = ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz',
  'Hoffmann', 'Koch', 'Richter', 'Klein', 'Wolf', 'Neumann', 'Schwarz', 'Zimmermann', 'Braun', 'Krüger', 'Hartmann'];
const OFFICER_ICONS = ['👮', '👮‍♀️', '👮‍♂️', '🕵️', '🕵️‍♀️', '🕵️‍♂️'];
const RANKS = [
  [0, 'Bruchbude'], [0.1, 'Baustelle'], [0.3, 'Ordentliches Revier'],
  [0.55, 'Gepflegte Wache'], [0.8, 'Modernes Revier'], [1, 'Hightech-Präsidium'],
];

// ---------------------------------------------------------------- Zustand

let state;
let uid = 1;
const nextId = () => uid++;

function newGame() {
  uid = 1;
  const s = {
    t: 0, money: 120, rep: 0, solved: 0, won: false, introSeen: false, muted: false,
    rooms: {}, officers: [], queue: [], active: [], log: [],
    nextCaseAt: 3, nextEventAt: 75, nextTrashAt: 40,
  };
  for (const r of ROOMS) {
    s.rooms[r.id] = { level: 0, debris: makeDebris(3 + Math.floor(Math.random() * 3)), build: null };
  }
  s.officers.push(makeOfficer(s));
  return s;
}

// Feste Plätze im Raum, damit sich Müllteile nicht überlappen
const DEBRIS_SLOTS = [[16, 50], [39, 50], [62, 50], [85, 50], [16, 76], [39, 76], [62, 76], [85, 76]];

function makeDebris(n) {
  const list = [];
  for (let i = 0; i < n; i++) { const d = randomDebris(list); if (d) list.push(d); }
  return list;
}
function randomDebris(existing, emoji, hp) {
  const used = new Set(existing.map(d => d.slot));
  const free = DEBRIS_SLOTS.map((_, i) => i).filter(i => !used.has(i));
  if (!free.length) return null;
  const slot = free[Math.floor(Math.random() * free.length)];
  const d = DEBRIS_TYPES[Math.floor(Math.random() * DEBRIS_TYPES.length)];
  const [x, y] = DEBRIS_SLOTS[slot];
  return { id: nextId(), slot, e: emoji || d.e, hp: hp || d.hp, x: x + (Math.random() * 6 - 3), y: y + (Math.random() * 6 - 3) };
}
function makeOfficer(s) {
  const used = new Set(s.officers.map(o => o.name));
  const free = NAMES.filter(n => !used.has(n));
  const name = free.length ? free[Math.floor(Math.random() * free.length)] : 'Neu ' + (s.officers.length + 1);
  return { id: nextId(), name, icon: OFFICER_ICONS[Math.floor(Math.random() * OFFICER_ICONS.length)], solved: 0 };
}

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ state, uid })); } catch (e) { /* ignorieren */ }
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || !data.state || !data.state.rooms) return false;
    state = data.state;
    uid = data.uid || 1000;
    for (const r of ROOMS) if (!state.rooms[r.id]) state.rooms[r.id] = { level: 0, debris: [], build: null };
    return true;
  } catch (e) { return false; }
}

// ---------------------------------------------------------------- Formeln

const lvl = id => state.rooms[id].level;
const maxOfficersFor = l => 2 + l * 2;
const spawnIntervalFor = l => Math.max(4, 12 - l * 2);
const totalLevels = () => ROOMS.reduce((a, r) => a + lvl(r.id), 0);
const modernity = () => totalLevels() / (ROOMS.length * MAX_LEVEL);

function upgradeCost(room, level) {
  return Math.round(room.base * COST_MULT[level] / 5) * 5;
}
function hireCost() {
  return Math.round(60 * Math.pow(1.7, state.officers.length - 1) / 5) * 5;
}
function caseUnlocked(ct) {
  return !ct.needs || lvl(ct.needs[0]) >= ct.needs[1];
}
function caseReward(ct) {
  let m = 1 + lvl('asservaten') * 0.10 + lvl('kantine') * 0.06 + totalLevels() * 0.02;
  if (ct.bonus) m += Math.max(0, lvl(ct.bonus) - 1) * 0.15;
  return Math.round(ct.reward * m);
}
function caseRep(ct) {
  return Math.round(ct.rep * (1 + lvl('empfang') * 0.25)) + lvl('kantine');
}
function caseDuration(ct) {
  return ct.dur * (1 - lvl('garage') * 0.10);
}
function rankName() {
  const m = modernity();
  let name = RANKS[0][1];
  for (const [th, n] of RANKS) if (m >= th) name = n;
  return name;
}
const freeOfficers = () => state.officers.filter(o => !state.active.some(a => a.officerIds.includes(o.id)));
const fmt = n => Math.floor(n).toLocaleString('de-DE');

// ---------------------------------------------------------------- Spiellogik

function tick() {
  const dt = TICK_MS / 1000;
  state.t += dt;

  // Baustellen
  for (const r of ROOMS) {
    const rs = state.rooms[r.id];
    if (rs.build && state.t >= rs.build.endsAt) {
      rs.build = null;
      rs.level++;
      dirty.rooms = dirty.staff = true;
      log(`🏗️ ${r.name} ist jetzt „${LEVEL_NAMES[rs.level]}“.`);
      toast(`${r.icon} ${r.name}: ${LEVEL_NAMES[rs.level]}!`, 'good');
      sound('build');
      confetti(rs.level >= 3 ? 30 : 14);
      if (sheetRoom === r.id) renderSheet();
      checkWin();
    }
  }

  // Neue Meldungen
  if (state.t >= state.nextCaseAt) {
    state.nextCaseAt = state.t + spawnIntervalFor(lvl('leitstelle')) * (0.7 + Math.random() * 0.6);
    if (state.queue.length < 3 + lvl('leitstelle')) spawnCase();
  }

  // Abgelaufene Meldungen
  const before = state.queue.length;
  state.queue = state.queue.filter(q => {
    if (state.t < q.expiresAt) return true;
    state.rep = Math.max(0, state.rep - 1);
    log(`⌛ ${CASE_BY_ID[q.type].name} wurde nicht bearbeitet (−1 ⭐).`);
    return false;
  });
  if (state.queue.length !== before) dirty.cases = true;

  // Auto-Zuweisung ab Leitstelle Stufe 2
  if (lvl('leitstelle') >= 2) {
    for (const q of [...state.queue]) {
      const need = CASE_BY_ID[q.type].officers || 1;
      if (freeOfficers().length >= need) assignCase(q.id, true);
    }
  }

  // Laufende Einsätze
  for (const a of [...state.active]) {
    if (state.t >= a.endsAt) finishCase(a);
  }

  // Zufällige Ereignisse
  if (state.t >= state.nextEventAt) {
    state.nextEventAt = state.t + 70 + Math.random() * 60;
    randomEvent();
  }
  // Neuer Müll in ungepflegten Räumen
  if (state.t >= state.nextTrashAt) {
    state.nextTrashAt = state.t + 35 + Math.random() * 30;
    const dirtyRooms = ROOMS.filter(r => lvl(r.id) < 2 && !state.rooms[r.id].build && state.rooms[r.id].debris.length < 5);
    if (dirtyRooms.length) {
      const r = dirtyRooms[Math.floor(Math.random() * dirtyRooms.length)];
      const d = randomDebris(state.rooms[r.id].debris);
      if (d) state.rooms[r.id].debris.push(d);
      dirty.rooms = true;
    }
  }

  render();
}

function spawnCase() {
  const options = CASE_TYPES.filter(caseUnlocked);
  const sum = options.reduce((a, c) => a + c.weight, 0);
  let roll = Math.random() * sum;
  let ct = options[0];
  for (const c of options) { roll -= c.weight; if (roll <= 0) { ct = c; break; } }
  state.queue.push({ id: nextId(), type: ct.id, createdAt: state.t, expiresAt: state.t + 35 + ct.dur });
  dirty.cases = true;
  sound('radio');
}

function assignCase(qid, auto) {
  const q = state.queue.find(x => x.id === qid);
  if (!q) return;
  const ct = CASE_BY_ID[q.type];
  const need = ct.officers || 1;
  const free = freeOfficers();
  if (free.length < need) {
    if (!auto) toast(need > 1 ? `Dafür brauchst du ${need} freie Beamte.` : 'Alle Beamten sind im Einsatz.', 'bad');
    return;
  }
  const dur = caseDuration(ct);
  state.queue = state.queue.filter(x => x.id !== qid);
  state.active.push({ id: q.id, type: q.type, officerIds: free.slice(0, need).map(o => o.id), startedAt: state.t, endsAt: state.t + dur });
  dirty.cases = dirty.staff = true;
  if (!auto) sound('click');
}

function finishCase(a) {
  const ct = CASE_BY_ID[a.type];
  const money = caseReward(ct);
  const rep = caseRep(ct);
  state.money += money;
  state.rep += rep;
  state.solved++;
  for (const oid of a.officerIds) {
    const o = state.officers.find(x => x.id === oid);
    if (o) o.solved++;
  }
  state.active = state.active.filter(x => x.id !== a.id);
  dirty.cases = dirty.staff = dirty.rooms = true;
  log(`✅ ${ct.name} erledigt: +${money} € · +${rep} ⭐`);
  floatText(`+${money} €`, document.getElementById('money'));
  sound('coin');
}

function clearDebris(roomId, debrisId, el) {
  const rs = state.rooms[roomId];
  const d = rs.debris.find(x => x.id === debrisId);
  if (!d) return;
  d.hp--;
  sound('hit');
  if (d.hp > 0) {
    if (el) { el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); }
    const hp = el && el.querySelector('.hp');
    if (hp) hp.textContent = d.hp;
    return;
  }
  rs.debris = rs.debris.filter(x => x.id !== debrisId);
  let gain = 3;
  if (Math.random() < 0.1) {
    gain += 15;
    toast('💰 Unter dem Müll lagen 15 €!', 'good');
  }
  state.money += gain;
  if (el) floatText(`+${gain} €`, el);
  if (!rs.debris.length) {
    state.rep += 1;
    toast(`✨ ${ROOM_BY_ID[roomId].name} ist aufgeräumt! (+1 ⭐)`, 'good');
  }
  dirty.rooms = true;
  if (sheetRoom === roomId) renderSheet();
  render();
}

function canUpgrade(roomId) {
  const room = ROOM_BY_ID[roomId];
  const rs = state.rooms[roomId];
  if (rs.level >= MAX_LEVEL) return { ok: false, why: 'Maximale Stufe erreicht.' };
  if (rs.build) return { ok: false, why: 'Wird gerade renoviert…' };
  if (rs.debris.length) return { ok: false, why: `Erst aufräumen! Noch ${rs.debris.length}× Müll im Raum.` };
  if (state.rep < REP_REQUIRED[rs.level]) return { ok: false, why: `Das Präsidium genehmigt das erst ab ${REP_REQUIRED[rs.level]} ⭐ Ruf.` };
  const cost = upgradeCost(room, rs.level);
  if (state.money < cost) return { ok: false, why: `Dir fehlen noch ${fmt(cost - state.money)} €.` };
  return { ok: true, cost };
}

function upgrade(roomId) {
  const chk = canUpgrade(roomId);
  if (!chk.ok) { toast(chk.why, 'bad'); return; }
  const rs = state.rooms[roomId];
  state.money -= chk.cost;
  const dur = BUILD_TIME[rs.level];
  rs.build = { startedAt: state.t, endsAt: state.t + dur };
  log(`🚧 Renovierung von ${ROOM_BY_ID[roomId].name} gestartet.`);
  sound('click');
  dirty.rooms = true;
  closeSheet();
  render();
}

function hire() {
  const max = maxOfficersFor(lvl('buero'));
  if (state.officers.length >= max) { toast('Kein Platz im Büro! Renoviere das Büro für mehr Schreibtische.', 'bad'); return; }
  const cost = hireCost();
  if (state.money < cost) { toast(`Eine Einstellung kostet ${fmt(cost)} €.`, 'bad'); return; }
  state.money -= cost;
  const o = makeOfficer(state);
  state.officers.push(o);
  log(`🤝 ${o.icon} ${o.name} verstärkt jetzt das Team.`);
  toast(`${o.icon} Willkommen im Team, ${o.name}!`, 'good');
  sound('coin');
  dirty.staff = true;
  render();
}

function randomEvent() {
  const m = modernity();
  const events = [
    () => {
      const cands = ROOMS.filter(r => !state.rooms[r.id].build);
      const r = cands[Math.floor(Math.random() * cands.length)];
      for (let i = 0; i < 2; i++) {
        const d = randomDebris(state.rooms[r.id].debris, '💧', 2);
        if (d) state.rooms[r.id].debris.push(d);
      }
      toast(`🚿 Rohrbruch im Raum ${r.name}! Schnell aufwischen.`, 'bad');
      log(`🚿 Rohrbruch im Raum ${r.name}.`);
    },
    () => {
      const amount = Math.round((60 + 400 * m) / 5) * 5;
      state.money += amount;
      toast(`🎁 Der Bürgerverein spendet ${amount} €!`, 'good');
      log(`🎁 Spende vom Bürgerverein: +${amount} €.`);
    },
    () => {
      if (m >= 0.35) {
        state.rep += 6;
        toast('📰 Die Zeitung lobt das modernisierte Revier! (+6 ⭐)', 'good');
        log('📰 Positiver Zeitungsbericht: +6 ⭐.');
      } else {
        state.rep = Math.max(0, state.rep - 2);
        toast('📰 Die Zeitung lästert über die marode Wache. (−2 ⭐)', 'bad');
        log('📰 Negativer Zeitungsbericht: −2 ⭐.');
      }
    },
    () => {
      const bonus = Math.round(20 + totalLevels() * 8);
      state.money += bonus;
      toast(`🏛️ Inspektion vom Präsidium – Zuschuss: ${bonus} €`, 'good');
      log(`🏛️ Inspektion bestanden: +${bonus} €.`);
    },
  ];
  events[Math.floor(Math.random() * events.length)]();
  dirty.rooms = true;
}

function checkWin() {
  if (!state.won && totalLevels() === ROOMS.length * MAX_LEVEL) {
    state.won = true;
    save();
    showOverlay(`
      <div class="big">🏆</div>
      <h1>Hightech-Präsidium!</h1>
      <p>Aus der Bruchbude ist das modernste Polizeirevier der Stadt geworden. Der Polizeipräsident persönlich gratuliert dir!</p>
      <p>Gelöste Fälle: <b>${fmt(state.solved)}</b><br>Ruf: <b>${fmt(state.rep)} ⭐</b><br>Team: <b>${state.officers.length} Beamte</b></p>
      <button class="btn primary wide" data-action="close-overlay">Weiterspielen</button>
      <button class="btn wide" data-action="reset">Neues Revier übernehmen</button>`);
    confetti(80);
  }
}

// ---------------------------------------------------------------- Darstellung

const $ = id => document.getElementById(id);
const dirty = { rooms: true, cases: true, staff: true };
let sheetRoom = null;

function roomHTML(r, level, opts = {}) {
  const rs = state.rooms[r.id];
  const decor = r.decor[level].map(d => `<span>${d}</span>`).join('');
  let inner = `
    <div class="lamp"></div><div class="floor"></div>
    <div class="room-name">${r.name}</div>
    <div class="room-level">${LEVEL_NAMES[level]} ${'★'.repeat(level)}${'☆'.repeat(MAX_LEVEL - level)}</div>
    <div class="room-icon">${r.icon}</div>
    <div class="decor">${decor}</div>`;
  if (opts.live) {
    for (const d of rs.debris) {
      inner += `<button class="debris" data-room="${r.id}" data-debris="${d.id}" style="left:${d.x}%;top:${d.y}%" aria-label="Müll wegräumen">${d.e}${d.hp > 1 ? `<span class="hp">${d.hp}</span>` : ''}</button>`;
    }
    if (rs.build) {
      inner += `<div class="build"><span>🚧👷🔨</span><div class="progress"><div class="bar" data-build="${r.id}"></div></div></div>`;
    } else if (canUpgrade(r.id).ok) {
      inner += `<div class="ready-dot" title="Renovierung möglich">⬆</div>`;
    }
  }
  return `<div class="room lvl-${level}" ${opts.live ? `data-room-card="${r.id}"` : ''}>${inner}</div>`;
}

function renderRooms() {
  $('station').innerHTML = ROOMS.map(r => roomHTML(r, lvl(r.id), { live: true })).join('');
}

function caseSig() {
  return state.queue.map(q => q.id).join(',') + '|' + state.active.map(a => a.id).join(',') + '|' + freeOfficers().length;
}
let lastCaseSig = '';

function renderCases() {
  const free = freeOfficers().length;
  $('queue').innerHTML = state.queue.length ? state.queue.map(q => {
    const ct = CASE_BY_ID[q.type];
    const need = ct.officers || 1;
    return `<div class="card" data-queue="${q.id}">
      <div class="ico">${ct.icon}</div>
      <div class="body">
        <div class="name">${ct.name}</div>
        <div class="meta">${caseReward(ct)} € · ${caseRep(ct)} ⭐ · ${Math.round(caseDuration(ct))}s${need > 1 ? ` · ${need} Beamte` : ''}</div>
        <div class="progress timer-bar"><div class="bar" data-expire="${q.id}"></div></div>
      </div>
      <button class="btn primary small" data-assign="${q.id}" ${free < need ? 'disabled' : ''}>Losschicken</button>
    </div>`;
  }).join('') : '<div class="empty">Ruhige Lage – keine offenen Meldungen.</div>';

  $('active').innerHTML = state.active.length ? state.active.map(a => {
    const ct = CASE_BY_ID[a.type];
    const names = a.officerIds.map(id => state.officers.find(o => o.id === id)).filter(Boolean).map(o => `${o.icon} ${o.name}`).join(', ');
    return `<div class="card">
      <div class="ico">${ct.icon}</div>
      <div class="body">
        <div class="name">${ct.name}</div>
        <div class="meta">${names}</div>
        <div class="progress"><div class="bar" data-active="${a.id}"></div></div>
      </div>
    </div>`;
  }).join('') : '<div class="empty">Niemand ist unterwegs.</div>';

  const locked = CASE_TYPES.filter(c => !caseUnlocked(c));
  if (locked.length) {
    $('active').innerHTML += `<h3>Noch gesperrt</h3>` + locked.map(c => `<div class="card locked">
      <div class="ico">${c.icon}</div>
      <div class="body"><div class="name">${c.name}</div>
      <div class="meta">Benötigt ${ROOM_BY_ID[c.needs[0]].name}: ${LEVEL_NAMES[c.needs[1]]}</div></div></div>`).join('');
  }
  $('autoInfo').textContent = lvl('leitstelle') >= 2
    ? 'Auto-Zuweisung aktiv – die Leitstelle verteilt Einsätze selbst.'
    : 'Tippe auf „Losschicken“. Ab Leitstelle „Renoviert“ läuft das automatisch.';
}

function renderStaff() {
  const busy = new Map();
  for (const a of state.active) for (const id of a.officerIds) busy.set(id, CASE_BY_ID[a.type]);
  $('staff').innerHTML = state.officers.map(o => {
    const c = busy.get(o.id);
    return `<div class="card">
      <div class="ico">${o.icon}</div>
      <div class="body"><div class="name">${o.name}</div>
      <div class="meta">${c ? `Im Einsatz: ${c.icon} ${c.name}` : 'Bereit auf der Wache'} · ${o.solved} Fälle</div></div>
    </div>`;
  }).join('');
  const max = maxOfficersFor(lvl('buero'));
  const btn = $('hireBtn');
  if (state.officers.length >= max) {
    btn.textContent = `Büro voll (${state.officers.length}/${max}) – Büro renovieren`;
    btn.disabled = true;
  } else {
    btn.textContent = `Beamten einstellen (${fmt(hireCost())} €)`;
    btn.disabled = state.money < hireCost();
  }
}

function renderLog() {
  $('log').innerHTML = state.log.map(l => `<div>${l}</div>`).join('');
}

let lastMoney = -1, lastRep = -1;
function render() {
  $('money').textContent = fmt(state.money) + ' €';
  $('rep').textContent = fmt(state.rep);
  $('officers').textContent = `${state.officers.length}/${maxOfficersFor(lvl('buero'))}`;
  const pct = Math.round(modernity() * 100);
  $('modPct').textContent = pct + '%';
  $('modBar').style.width = pct + '%';
  $('rank').textContent = rankName();
  const pill = $('casePill');
  pill.textContent = state.queue.length || '';
  pill.classList.toggle('zero', !state.queue.length);

  // Geld/Ruf ändern, ob Räume renovierbar sind
  if (Math.floor(state.money) !== lastMoney || state.rep !== lastRep) {
    lastMoney = Math.floor(state.money); lastRep = state.rep;
    dirty.rooms = true; dirty.staff = true;
    if (sheetRoom) updateSheetButton();
  }
  const sig = caseSig();
  if (sig !== lastCaseSig) { lastCaseSig = sig; dirty.cases = true; }

  if (dirty.rooms) { renderRooms(); dirty.rooms = false; }
  if (dirty.cases) { renderCases(); dirty.cases = false; }
  if (dirty.staff) { renderStaff(); renderLog(); dirty.staff = false; }

  // Fortschrittsbalken
  for (const r of ROOMS) {
    const b = state.rooms[r.id].build;
    if (!b) continue;
    const el = document.querySelector(`[data-build="${r.id}"]`);
    if (el) el.style.width = Math.min(100, (state.t - b.startedAt) / (b.endsAt - b.startedAt) * 100) + '%';
  }
  for (const a of state.active) {
    const el = document.querySelector(`[data-active="${a.id}"]`);
    if (el) el.style.width = Math.min(100, (state.t - a.startedAt) / (a.endsAt - a.startedAt) * 100) + '%';
  }
  for (const q of state.queue) {
    const el = document.querySelector(`[data-expire="${q.id}"]`);
    if (!el) continue;
    const left = (q.expiresAt - state.t) / (q.expiresAt - q.createdAt);
    el.style.width = Math.max(0, left * 100) + '%';
    el.closest('.card').classList.toggle('urgent', left < 0.3);
  }
}

// ---------------------------------------------------------------- Raum-Detailansicht

function openSheet(roomId) {
  sheetRoom = roomId;
  renderSheet();
  $('sheet').classList.remove('hidden');
  $('sheetBackdrop').classList.remove('hidden');
}
function closeSheet() {
  sheetRoom = null;
  $('sheet').classList.add('hidden');
  $('sheetBackdrop').classList.add('hidden');
}
function renderSheet() {
  if (!sheetRoom) return;
  const r = ROOM_BY_ID[sheetRoom];
  const rs = state.rooms[r.id];
  const l = rs.level;
  const isMax = l >= MAX_LEVEL;
  const preview = isMax
    ? roomHTML(r, l)
    : `${roomHTML(r, l)}<div class="arrow">➜</div>${roomHTML(r, l + 1)}`;
  $('sheet').innerHTML = `
    <h2><span>${r.icon}</span> ${r.name}</h2>
    <div class="stars">${'★'.repeat(l)}${'☆'.repeat(MAX_LEVEL - l)} · ${LEVEL_NAMES[l]}</div>
    <div class="preview">${preview}</div>
    <p>${r.desc}</p>
    <div class="effects">
      <div><span>Jetzt</span><b>${r.effect(l)}</b></div>
      ${isMax ? '' : `<div><span>Nach Renovierung</span><b style="color:var(--good)">${r.effect(l + 1)}</b></div>
      <div><span>Kosten</span><b>${fmt(upgradeCost(r, l))} €</b></div>
      <div><span>Bauzeit</span><b>${BUILD_TIME[l]} s</b></div>
      ${REP_REQUIRED[l] ? `<div><span>Benötigter Ruf</span><b>${REP_REQUIRED[l]} ⭐</b></div>` : ''}`}
    </div>
    <div class="req" id="sheetReq"></div>
    <div class="actions">
      <button class="btn" data-action="close-sheet">Schließen</button>
      ${isMax ? '' : `<button class="btn good" id="upgradeBtn" data-upgrade="${r.id}">🔨 Renovieren</button>`}
    </div>`;
  updateSheetButton();
}
function updateSheetButton() {
  const btn = $('upgradeBtn');
  const req = $('sheetReq');
  if (!btn || !sheetRoom) { if (req) req.textContent = ''; return; }
  const chk = canUpgrade(sheetRoom);
  btn.disabled = !chk.ok;
  req.textContent = chk.ok ? '' : chk.why;
}

// ---------------------------------------------------------------- Effekte

function log(msg) {
  const m = Math.floor(state.t / 60), s = Math.floor(state.t % 60);
  state.log.unshift(`<b>${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}</b> ${msg}`);
  state.log = state.log.slice(0, 40);
  dirty.staff = true;
}

function toast(msg, kind = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.textContent = msg;
  $('toasts').appendChild(el);
  setTimeout(() => el.remove(), 2600);
  while ($('toasts').children.length > 3) $('toasts').firstChild.remove();
}

function floatText(text, anchor) {
  if (!anchor) return;
  const rect = anchor.getBoundingClientRect();
  if (!rect.width) return;
  const el = document.createElement('div');
  el.className = 'float';
  el.textContent = text;
  el.style.left = rect.left + rect.width / 2 - 15 + 'px';
  el.style.top = rect.top + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

function confetti(n) {
  const items = ['🎉', '✨', '⭐', '🚓', '🎊'];
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    el.textContent = items[i % items.length];
    el.style.left = Math.random() * 100 + 'vw';
    el.style.animationDuration = 1.5 + Math.random() * 1.5 + 's';
    el.style.animationDelay = Math.random() * 0.4 + 's';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }
}

let audioCtx = null;
function sound(kind) {
  if (state.muted) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = { click: [660], hit: [180], coin: [880, 1320], radio: [520, 390], build: [523, 659, 784, 1047] }[kind] || [440];
    notes.forEach((f, i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = kind === 'hit' ? 'square' : 'triangle';
      o.frequency.value = f;
      const t0 = audioCtx.currentTime + i * 0.08;
      g.gain.setValueAtTime(0.06, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.15);
      o.connect(g).connect(audioCtx.destination);
      o.start(t0); o.stop(t0 + 0.16);
    });
  } catch (e) { /* kein Audio */ }
}

function showOverlay(html) {
  $('overlay').innerHTML = `<div class="box">${html}</div>`;
  $('overlay').classList.remove('hidden');
}
function hideOverlay() { $('overlay').classList.add('hidden'); }

function showIntro() {
  showOverlay(`
    <div class="big">🏚️🚓</div>
    <h1>Willkommen im Revier 13</h1>
    <p>Du übernimmst die Leitung des heruntergekommensten Polizeireviers der Stadt: kaputte Lampen, Spinnweben, Müll in jeder Ecke – und nur ein einziger Beamter.</p>
    <p>🧹 <b>Räume aufräumen:</b> Tippe auf den Müll.<br>
       🔨 <b>Renovieren:</b> Tippe auf einen sauberen Raum.<br>
       📻 <b>Einsätze:</b> Schicke deine Beamten los und verdiene Geld und Ruf.<br>
       ⭐ <b>Ruf</b> brauchst du für die Genehmigung größerer Umbauten.</p>
    <p>Ziel: Mach aus der Bruchbude ein <b>Hightech-Präsidium</b>!</p>
    <button class="btn primary wide" data-action="start">Dienst antreten</button>`);
}

function showMenu() {
  showOverlay(`
    <div class="big">⚙️</div>
    <h1>Menü</h1>
    <p>Gelöste Fälle: <b>${fmt(state.solved)}</b> · Spielzeit: <b>${Math.floor(state.t / 60)} min</b></p>
    <button class="btn primary wide" data-action="close-overlay">Weiterspielen</button>
    <button class="btn wide" data-action="mute">${state.muted ? '🔈 Ton einschalten' : '🔇 Ton ausschalten'}</button>
    <button class="btn wide" data-action="help">❓ Anleitung</button>
    <button class="btn wide" data-action="confirm-reset" style="background:var(--bad)">🗑️ Spielstand löschen</button>`);
}

// ---------------------------------------------------------------- Eingaben

function setTab(tab) {
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.layout > .panel').forEach(p => p.classList.toggle('show', p.dataset.panel === tab));
}

document.addEventListener('click', e => {
  const t = e.target.closest('button, [data-room-card], #sheetBackdrop');
  if (!t) return;

  if (t.dataset.debris) { clearDebris(t.dataset.room, Number(t.dataset.debris), t); return; }
  if (t.dataset.roomCard) { openSheet(t.dataset.roomCard); sound('click'); return; }
  if (t.dataset.assign) { assignCase(Number(t.dataset.assign), false); render(); return; }
  if (t.dataset.upgrade) { upgrade(t.dataset.upgrade); return; }
  if (t.dataset.tab) { setTab(t.dataset.tab); return; }
  if (t.id === 'sheetBackdrop') { closeSheet(); return; }
  if (t.id === 'hireBtn') { hire(); return; }
  if (t.id === 'menuBtn') { showMenu(); return; }

  switch (t.dataset.action) {
    case 'close-sheet': closeSheet(); break;
    case 'close-overlay': hideOverlay(); break;
    case 'start': state.introSeen = true; hideOverlay(); save(); sound('build'); break;
    case 'help': showIntro(); break;
    case 'mute': state.muted = !state.muted; save(); showMenu(); break;
    case 'confirm-reset':
      showOverlay(`<div class="big">⚠️</div><h1>Wirklich neu anfangen?</h1>
        <p>Dein ganzes Revier wird wieder zur Bruchbude.</p>
        <button class="btn wide" data-action="close-overlay">Abbrechen</button>
        <button class="btn wide" data-action="reset" style="background:var(--bad)">Ja, alles löschen</button>`);
      break;
    case 'reset':
      state = newGame();
      state.introSeen = true;
      lastCaseSig = ''; dirty.rooms = dirty.cases = dirty.staff = true;
      save(); hideOverlay(); closeSheet(); render();
      break;
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeSheet(); hideOverlay(); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });

// ---------------------------------------------------------------- Start

if (!load()) state = newGame();
setTab('station');
render();
if (!state.introSeen) showIntro();
setInterval(() => {
  // Pausieren, solange ein Overlay offen ist (Intro, Menü, Sieg)
  if ($('overlay').classList.contains('hidden')) tick();
}, TICK_MS);
setInterval(save, 5000);
