// Lógica de la app: cuestionario, temporizador, pausas guiadas y catálogo.
const TAURI = window.__TAURI__;
const win = TAURI?.window.getCurrentWindow();
const invoke = TAURI?.core.invoke;
const $ = s => document.querySelector(s);
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento: se usa la sesión */ } },
};

const QUIZ = [
  { key: 'place', q: 'q_place', hint: 'h_place', opts: [['home', 'o_home'], ['office', 'o_office']] },
  { key: 'space', q: 'q_space', opts: [['sit', 'o_sit'], ['stand', 'o_stand'], ['room', 'o_room']] },
  { key: 'floor', q: 'q_floor', when: a => a.space === 'room', opts: [[true, 'o_floor_yes'], [false, 'o_floor_no']] },
  { key: 'props', multi: true, q: 'q_props', hint: 'h_props',
    opts: [['chair', 'o_chair'], ['desk', 'o_desk'], ['wall', 'o_wall'], ['towel', 'o_towel'], ['ball', 'o_ball']] },
  { key: 'zones', multi: true, q: 'q_zones', hint: 'h_zones', opts: Object.keys(t('zones')).map(z => [z, z]) },
  { key: 'every', q: 'q_every', opts: [[30, 'o_30'], [45, 'o_45'], [60, 'o_60'], [90, 'o_90']] },
  { key: 'size', q: 'q_size', opts: [['short', 'o_short'], ['medium', 'o_medium'], ['long', 'o_long']] },
];
// Las opciones de zonas usan el nombre de la zona; las demás, una clave de texto.
const optLabel = (q, key) => q.key === 'zones' ? t('zones')[key] : t(key);
const SIZES = { short: 2, medium: 4, long: 6 };
const RANK = { sit: 0, stand: 1, room: 2 };
let profile = store.get('profile', null);
let nextAt = 0, paused = false, busy = false;

// ---------- Pantallas ----------
let screen = '', backTo = 'home';
function show(id) {
  if (!['catalog', 'settings', 'stats'].includes(screen)) backTo = screen || 'home';
  for (const s of document.querySelectorAll('main > section')) s.hidden = s.id !== id;
  screen = id;
  if (id === 'home') renderHome();
}
document.querySelectorAll('[data-back]').forEach(b => b.onclick = () => show(backTo === 'quiz' ? 'home' : backTo));

// ---------- Cuestionario ----------
function startQuiz() {
  const answers = { place: null, space: null, floor: false, props: [], zones: [], every: null, size: null, sound: true, ...profile };
  const steps = () => QUIZ.filter(q => !q.when || q.when(answers));
  let i = -1; // -1 = bienvenida
  const body = $('#quiz-body');
  const render = () => {
    const list = steps();
    $('#quiz-bar').style.width = `${Math.max(0, (i + 1) / (list.length + 1)) * 100}%`;
    if (i === -1) {
      body.innerHTML = `<p class="q-title">${t('hello')}</p><p>${t('intro')}</p>
        <div class="note"><strong>${t('before')}</strong><ul><li>${t('rule1')}</li><li>${t('rule2')}</li><li>${t('rule3')}</li></ul></div>
        <p class="muted">${t('quiz_intro')}</p>
        <div class="grow"></div><button class="primary" id="q-next">${t('start')}</button>`;
      $('#q-next').onclick = () => { i++; render(); };
      return;
    }
    if (i >= list.length) {
      const n = EXERCISES.filter(e => eligible(e, answers)).length;
      body.innerHTML = `<p class="q-title">${t('all_set')}</p><p>${t('found', n, answers.every)}</p>
        <p class="muted">${t('change_later')}</p>
        ${invoke ? `<label class="check"><input type="checkbox" id="q-auto" checked> ${t('autostart')}</label>` : ''}
        <div class="grow"></div>
        <button class="primary" id="q-next">${t('begin')}</button><button class="link" id="q-back">${t('prev')}</button>`;
      $('#q-back').onclick = () => { i--; render(); };
      $('#q-next').onclick = () => {
        if ($('#q-auto')) setAutostart($('#q-auto').checked);
        profile = answers; store.set('profile', profile); restartTimer(); show('home');
      };
      return;
    }
    const q = list[i], sel = v => q.multi ? answers[q.key].includes(v) : answers[q.key] === v;
    body.innerHTML = `<p class="q-title">${t(q.q)}</p>${q.hint ? `<p class="muted">${t(q.hint)}</p>` : ''}
      ${q.opts.map(([v, key], j) => `<button class="opt" data-j="${j}" aria-pressed="${sel(v)}">${optLabel(q, key)}</button>`).join('')}
      <div class="grow"></div>
      ${q.multi ? `<button class="primary" id="q-next">${t('next')}</button>` : ''}
      <button class="link" id="q-back">${t('prev')}</button>`;
    body.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      const v = q.opts[b.dataset.j][0];
      if (q.multi) {
        const arr = answers[q.key];
        arr.includes(v) ? arr.splice(arr.indexOf(v), 1) : arr.push(v);
        b.setAttribute('aria-pressed', arr.includes(v));
      } else { answers[q.key] = v; i++; render(); }
    });
    $('#q-back').onclick = () => { i--; render(); };
    if (q.multi) $('#q-next').onclick = () => { i++; render(); };
  };
  answers.props = [...answers.props]; answers.zones = [...answers.zones];
  show('quiz'); render();
}

// ---------- Selección de estiramientos ----------
function eligible(ex, p) {
  return RANK[ex.pos] <= RANK[p.space] && (!ex.floor || p.floor) && ex.needs.every(n => n.split('|').some(x => p.props.includes(x)));
}

function pickRoutine(p) {
  const recent = store.get('recent', []);
  const pool = EXERCISES.filter(e => eligible(e, p)).map(e => {
    let w = 1 + 3 * e.zones.filter(z => p.zones.includes(z)).length;
    if (p.place === 'office' && !e.discreet) w *= 0.25;
    if (recent.includes(e.id)) w *= 0.15;
    return { e, w };
  });
  // Con espacio para ponerse de pie, se alterna: uno en la silla, uno de pie (o en el piso).
  const up = x => x.e.pos !== 'sit';
  const alternate = p.space !== 'sit' && pool.some(up) && pool.some(x => !up(x));
  let wantUp = Math.random() < 0.5;
  const out = [];
  while (out.length < SIZES[p.size] && pool.length) {
    let cand = alternate ? pool.filter(x => up(x) === wantUp) : pool;
    if (!cand.length) cand = pool;
    // Evita dos seguidos de la misma zona (por ejemplo, cuello y cuello).
    const last = out.at(-1)?.zones[0], w = x => (x.e.zones[0] === last ? x.w * 0.2 : x.w);
    let r = Math.random() * cand.reduce((s, x) => s + w(x), 0), i = 0;
    while (i < cand.length - 1 && (r -= w(cand[i])) > 0) i++;
    out.push(cand[i].e);
    pool.splice(pool.indexOf(cand[i]), 1);
    wantUp = !wantUp;
  }
  // Los de piso van juntos al final: bajar al suelo y volver a subir una sola vez.
  out.sort((x, y) => !!x.floor - !!y.floor);
  store.set('recent', out.map(e => e.id));
  return out;
}

// ---------- Historial ----------
// Un resumen por día (se guardan los últimos 120): pausas, estiramientos y tiempo frente a la pantalla.
const EMPTY_DAY = () => ({ screen: 0, away: 0, reminders: 0, onTime: 0, done: 0, partial: 0, skipped: 0, snoozed: 0, exDone: 0, exSkipped: 0, ex: {} });
function logDay(fn) {
  const h = store.get('history', {}), k = today();
  fn(h[k] = { ...EMPTY_DAY(), ...h[k] });
  for (const old of Object.keys(h).sort().slice(0, -120)) delete h[old];
  store.set('history', h);
}
// Un "ciclo" va de un recordatorio a la pausa hecha o saltada; posponer no abre uno nuevo.
let cycle = null; // { at: momento del primer aviso }
function countReminder() {
  if (cycle) return;
  cycle = { at: Date.now() };
  logDay(d => d.reminders++);
}
const ON_TIME_MS = 3 * 60000; // "a tiempo" = empezaste la pausa menos de 3 min después del aviso

// ---------- Temporizador ----------
// ponytail: el temporizador vive en la página; con la ventana oculta, WebView2 puede retrasar los timers
// hasta ~1 minuto. Para recordatorios de 30-90 minutos es suficiente; si hace falta precisión, moverlo a Rust.
function restartTimer(min = profile.every, keepCycle = false) {
  nextAt = Date.now() + min * 60000; paused = false; busy = false; nudgedAt = 0;
  if (!keepCycle) cycle = null;
}
const fmt = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const clock = t => new Date(t).toLocaleTimeString(LANG, { hour: '2-digit', minute: '2-digit' });
const today = () => new Date().toLocaleDateString('sv');

function renderHome() {
  if (!profile) return;
  const left = nextAt - Date.now(), total = (paused ? 60 : profile.every) * 60000;
  $('#home-label').textContent = t(busy ? 'busy_wait' : paused ? 'paused_until' : 'next_break_in');
  $('#home-time').textContent = busy ? '…' : fmt(left);
  $('#ring-bar').style.strokeDashoffset = 100 - Math.min(100, Math.max(0, left / total * 100));
  const n = store.get('history', {})[today()]?.done || 0;
  $('#home-today').textContent = n ? t('today_n', n) : t('today_none');
  $('#pause').textContent = t(paused ? 'resume' : 'pause_hour');
}

// Estado del sistema (solo en la app de escritorio): tiempo sin usar la PC y si hay llamada o pantalla completa.
const AWAY_SECS = 5 * 60;
const NUDGE_EVERY = 15 * 60000; // mientras sigas ocupado, el aviso pequeño se repite cada 15 min
const sysStatus = () => invoke ? invoke('status').catch(() => ({ idle: 0, busy: false })) : Promise.resolve({ idle: 0, busy: false });

let checking = false, lastIdleCheck = 0, nudgedAt = 0, lastSample = Date.now();
setInterval(async () => {
  if (!profile || checking) return;
  if (screen === 'home') renderHome();
  const due = Date.now() >= nextAt, free = !['remind', 'session', 'done', 'quiz'].includes(screen);
  // Se consulta el sistema al vencer el tiempo (luego cada 30 s si sigues ocupado) y cada 30 s para ver si estás fuera.
  if (!(due && free && !busy) && Date.now() - lastIdleCheck < 30000) return;
  checking = true; lastIdleCheck = Date.now();
  try {
    const st = await sysStatus();
    // Tiempo frente a la pantalla o fuera. Los saltos largos (PC suspendida) no cuentan.
    const now = Date.now(), gap = Math.min(now - lastSample, 60000) / 1000;
    lastSample = now;
    logDay(d => { st.idle >= AWAY_SECS ? (d.away += gap) : (d.screen += gap); });
    // Si estuviste fuera 5 minutos o más (o con la pantalla bloqueada), ya te moviste: el contador vuelve a empezar.
    if (st.idle >= AWAY_SECS && free && !paused) { restartTimer(); return; }
    if (due && free) {
      // En llamada, jugando o en pantalla completa: en vez de abrir la ventana, un aviso pequeño en la esquina.
      busy = st.busy;
      if (!busy) remind(true);
      else if (Date.now() - nudgedAt > NUDGE_EVERY) { countReminder(); nudgedAt = Date.now(); invoke?.('nudge', { show: true }).catch(console.error); }
    }
  } finally { checking = false; }
}, 1000);

// ---------- Ventana (solo dentro de la app de escritorio) ----------
async function surface() {
  if (!win) return;
  try { await win.show(); await win.unminimize(); await win.setAlwaysOnTop(true); await win.setFocus(); } catch (e) { console.error(e); }
}
const unpin = () => win?.setAlwaysOnTop(false).catch(() => {});
const toTray = () => win?.hide().catch(() => {});
async function setAutostart(on) {
  try { await invoke(on ? 'plugin:autostart|enable' : 'plugin:autostart|disable'); } catch (e) { console.error(e); }
}
TAURI?.event.listen('stretch-now', () => { if (profile && screen !== 'session') remind(); });
// Botones del aviso pequeño: "now" abre la pausa, "later" pospone 10 min, "close" sigue esperando.
TAURI?.event.listen('nudge-action', ({ payload }) => {
  if (payload === 'now' && screen !== 'session') remind();
  if (payload === 'later') { logDay(d => d.snoozed++); restartTimer(10, true); renderHome(); }
});
invoke?.('tray_labels', { open: t('tray_open'), now: t('stretch_now'), quit: t('tray_quit') }).catch(() => {});

// ---------- Actualizaciones ----------
async function checkUpdate() {
  const v = await invoke?.('check_update').catch(() => null);
  if (!v) return;
  $('#update-text').textContent = t('update_available', v);
  $('#update').hidden = false;
}
$('#update-btn').onclick = async () => {
  $('#update-btn').disabled = true; $('#update-btn').textContent = t('updating');
  try { await invoke('install_update'); } catch (e) { console.error(e); $('#update-btn').textContent = t('update_failed'); }
};
if (invoke) { setTimeout(checkUpdate, 10000); setInterval(checkUpdate, 12 * 3600000); }

function chime() {
  if (!profile?.sound) return;
  try {
    const ctx = new AudioContext();
    [660, 880].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + i * 0.18;
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.75);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch { /* sin audio */ }
}

// ---------- Recordatorio y sesión ----------
let routine = [];
// auto = lo pidió el temporizador; con "Estirar ahora" no cuenta como recordatorio.
function remind(auto = false) {
  if (auto) countReminder();
  routine = pickRoutine(profile);
  const secs = routine.reduce((s, e) => s + e.secs * (e.sides ? 2 : 1), 0);
  $('#remind-sub').textContent = t('remind_sub', Math.max(1, Math.round(secs / 60)));
  $('#remind-list').innerHTML = routine.map(e => `<li>${exText(e).name}</li>`).join('');
  invoke?.('nudge', { show: false }).catch(() => {});
  show('remind'); surface(); chime();
}
$('#now').onclick = () => remind();
$('#snooze').onclick = () => { logDay(d => d.snoozed++); restartTimer(10, true); unpin(); show('home'); toTray(); };
$('#skip').onclick = () => { if (cycle) logDay(d => d.skipped++); restartTimer(); unpin(); show('home'); toTray(); };
$('#start').onclick = () => {
  if (cycle && Date.now() - cycle.at <= ON_TIME_MS) logDay(d => d.onTime++);
  unpin(); runSession();
};
$('#pause').onclick = () => { paused ? restartTimer() : (restartTimer(60), paused = true); renderHome(); };

let tick = null, spent = new Map();
function runSession() {
  const plan = routine.flatMap(ex => ex.sides
    ? [{ ex, mirror: false, side: t('side1') }, { ex, mirror: true, side: t('side2') }]
    : [{ ex, mirror: false, side: '' }]);
  let i = 0, left = 0, holding = false;
  spent = new Map(routine.map(e => [e, 0]));
  $('#dots').innerHTML = routine.map(() => '<i></i>').join('');
  const load = () => {
    const { ex, mirror, side } = plan[i];
    illustrate($('#anim'), ex, mirror);
    $('#side').textContent = [side, t(isRepeat(ex) ? 'mode_repeat' : 'mode_hold')].filter(Boolean).join(' · ');
    const tx = exText(ex);
    $('#ex-name').textContent = tx.name;
    $('#ex-steps').innerHTML = tx.steps.map(s => `<li>${s}</li>`).join('');
    $('#ex-caution').textContent = tx.caution || '';
    const idx = routine.indexOf(ex);
    $('#dots').querySelectorAll('i').forEach((d, j) => d.classList.toggle('on', j <= idx));
    $('#next').textContent = t(i === plan.length - 1 ? 'finish' : 'next');
    left = ex.secs; holding = false; $('#hold').textContent = t('pause');
    paint();
  };
  const paint = () => {
    $('#count-num').textContent = left;
    $('#count-bar').style.width = `${(1 - left / plan[i].ex.secs) * 100}%`;
  };
  const next = () => { i++; i < plan.length ? load() : finish(true); };
  clearInterval(tick);
  tick = setInterval(() => {
    if (holding || screen !== 'session') return;
    left--; paint();
    spent.set(plan[i].ex, spent.get(plan[i].ex) + 1);
    if (left <= 0) { chime(); next(); }
  }, 1000);
  $('#next').onclick = next;
  $('#hold').onclick = () => { holding = !holding; $('#hold').textContent = t(holding ? 'go_on' : 'pause'); };
  $('#end').onclick = () => finish(false);
  show('session'); load();
}

function finish(completed) {
  clearInterval(tick);
  restartTimer();
  // Un estiramiento cuenta como hecho si le dedicaste al menos la mitad de su tiempo.
  logDay(d => {
    completed ? d.done++ : d.partial++;
    for (const [ex, secs] of spent) {
      if (secs >= ex.secs * (ex.sides ? 2 : 1) / 2) { d.exDone++; d.ex[ex.id] = (d.ex[ex.id] || 0) + 1; } else d.exSkipped++;
    }
  });
  spent = new Map();
  $('#done-next').textContent = t('next_at', clock(nextAt));
  const tips = t('tips');
  $('#done-tip').textContent = tips[Math.floor(Math.random() * tips.length)];
  show('done');
}
$('#done-close').onclick = () => { show('home'); toTray(); };

// ---------- Resumen ----------
let statsDays = 7;
const hm = secs => { const m = Math.round(secs / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h` + (m % 60 ? ` ${m % 60} min` : ''); };
function renderStats() {
  const h = store.get('history', {});
  const keys = Array.from({ length: statsDays }, (_, i) => new Date(Date.now() - (statsDays - 1 - i) * 864e5).toLocaleDateString('sv'));
  const days = keys.map(k => ({ k, ...EMPTY_DAY(), ...h[k] }));
  const sum = f => days.reduce((n, d) => n + d[f], 0);
  const tot = Object.fromEntries(Object.keys(EMPTY_DAY()).filter(f => f !== 'ex').map(f => [f, sum(f)]));
  for (const b of document.querySelectorAll('#stats-range button')) b.setAttribute('aria-pressed', +b.dataset.days === statsDays);
  const pct = (a, b) => (b ? `${Math.round(a / b * 100)}%` : '—');
  // Racha: días seguidos (hasta hoy o ayer) con al menos una pausa.
  let streak = 0;
  for (let i = h[today()]?.done ? 0 : 1; ; i++) {
    if (!h[new Date(Date.now() - i * 864e5).toLocaleDateString('sv')]?.done) break;
    streak++;
  }
  const tile = (label, value, sub = '') => `<div class="tile"><span>${label}</span><strong>${value}</strong>${sub ? `<small>${sub}</small>` : ''}</div>`;
  $('#stats-tiles').innerHTML = [
    tile(t('st_done'), tot.done, t('st_of_reminders', tot.reminders)),
    tile(t('st_on_time'), pct(tot.onTime, tot.reminders), t('st_on_time_sub')),
    tile(t('st_skipped'), tot.skipped, t('st_snoozed', tot.snoozed)),
    tile(t('st_partial'), tot.partial, t('st_partial_sub')),
    tile(t('st_ex_done'), tot.exDone, t('st_per_day', (tot.exDone / statsDays).toFixed(1))),
    tile(t('st_ex_skipped'), tot.exSkipped),
    tile(t('st_screen'), hm(tot.screen), t('st_per_day', hm(tot.screen / statsDays))),
    tile(t('st_away'), hm(tot.away)),
    tile(t('st_streak'), t('st_days', streak)),
  ].join('');
  // Gráfico: pausas hechas por día (una sola serie, sin leyenda; el detalle va en el tooltip).
  const max = Math.max(1, ...days.map(d => d.done));
  const label = k => new Date(k + 'T12:00').toLocaleDateString(LANG, statsDays > 7 ? { day: 'numeric' } : { weekday: 'short' });
  $('#stats-chart').innerHTML = days.map(d => `<div class="bar-col" title="${new Date(d.k + 'T12:00').toLocaleDateString(LANG, { weekday: 'long', day: 'numeric', month: 'short' })}: ${t('st_bar_tip', d.done, d.skipped, d.snoozed)}">
      <i style="height:${d.done / max * 100}%"></i><span>${statsDays > 14 && keys.indexOf(d.k) % 5 ? '' : label(d.k)}</span></div>`).join('');
  // Los estiramientos que más hiciste.
  const count = {};
  for (const d of days) for (const [id, n] of Object.entries(d.ex)) count[id] = (count[id] || 0) + n;
  const top = Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 5);
  $('#stats-top').innerHTML = top.length
    ? top.map(([id, n]) => { const ex = EXERCISES.find(e => e.id === id); return ex ? `<li><span>${exText(ex).name}</span><b>${n}</b></li>` : ''; }).join('')
    : `<li class="muted">${t('st_none')}</li>`;
  $('#stats-empty').hidden = tot.reminders + tot.done + tot.screen > 0;
}
document.querySelectorAll('#stats-range button').forEach(b => b.onclick = () => { statsDays = +b.dataset.days; renderStats(); });
$('#go-stats').onclick = () => { renderStats(); show('stats'); };

// ---------- Catálogo ----------
$('#go-catalog').onclick = () => {
  const grid = $('#grid');
  grid.innerHTML = '';
  for (const ex of EXERCISES) {
    const ok = eligible(ex, profile);
    const b = document.createElement('button');
    b.className = `card ${ok ? 'on' : 'off'}`;
    b.innerHTML = `<svg aria-hidden="true"></svg><span>${exText(ex).name}</span>`;
    illustrate(b.querySelector('svg'), ex);
    b.onclick = () => openDetail(ex);
    grid.append(b);
  }
  show('catalog');
};

function openDetail(ex) {
  const d = $('#detail');
  illustrate($('#detail-anim'), ex);
  const tx = exText(ex);
  $('#detail-name').textContent = tx.name;
  const req = t('pos_' + ex.pos) + (ex.floor ? t('on_floor') : '');
  $('#detail-meta').textContent = `${t(isRepeat(ex) ? 'mode_repeat' : 'mode_hold')} — ${ex.zones.map(z => t('zones')[z]).join(' · ')} — ${req} — ${ex.secs} s${ex.sides ? t('per_side') : ''}`;
  $('#detail-steps').innerHTML = tx.steps.map(s => `<li>${s}</li>`).join('');
  $('#detail-caution').textContent = tx.caution || '';
  d.showModal();
}

// ---------- Ajustes ----------
$('#go-settings').onclick = async () => {
  const q = k => QUIZ.find(x => x.key === k);
  const one = k => { const o = q(k).opts.find(([v]) => v === profile[k]); return o ? optLabel(q(k), o[1]) : '—'; };
  const many = k => q(k).opts.filter(([v]) => profile[k].includes(v)).map(o => optLabel(q(k), o[1])).join(', ') || t('s_none');
  $('#summary').innerHTML = `<dt>${t('s_place')}</dt><dd>${one('place')}</dd>
    <dt>${t('s_space')}</dt><dd>${one('space')}${profile.space === 'room' ? t(profile.floor ? 'with_floor' : 'without_floor') : ''}</dd>
    <dt>${t('s_props')}</dt><dd>${many('props')}</dd><dt>${t('s_zones')}</dt><dd>${many('zones')}</dd>
    <dt>${t('s_every')}</dt><dd>${one('every')}</dd><dt>${t('s_size')}</dt><dd>${one('size')}</dd>`;
  const saved = store.get('lang', '');
  $('#opt-lang').innerHTML = [['', t('lang_auto')], ...Object.entries(LANGS)]
    .map(([v, l]) => `<option value="${v}" ${v === saved ? 'selected' : ''}>${l}</option>`).join('');
  $('#opt-sound').checked = profile.sound;
  if (invoke) {
    $('#autostart-row').hidden = false;
    try { $('#opt-autostart').checked = await invoke('plugin:autostart|is_enabled'); } catch { /* sin plugin */ }
  }
  show('settings');
};
$('#opt-sound').onchange = e => { profile.sound = e.target.checked; store.set('profile', profile); };
$('#opt-autostart').onchange = e => setAutostart(e.target.checked);
$('#redo-quiz').onclick = startQuiz;
$('#opt-lang').onchange = e => { e.target.value ? store.set('lang', e.target.value) : localStorage.removeItem('lang'); location.reload(); };

// ---------- Inicio ----------
for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
for (const el of document.querySelectorAll('[data-i18n-label]')) el.setAttribute('aria-label', t(el.dataset.i18nLabel));
if (profile) { restartTimer(); show('home'); } else startQuiz();
