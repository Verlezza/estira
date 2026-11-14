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
  { key: 'place', q: '¿Dónde trabajas casi siempre?', hint: 'En una oficina compartida priorizamos estiramientos discretos.',
    opts: [['home', 'En casa o en un espacio privado'], ['office', 'En una oficina compartida o coworking']] },
  { key: 'space', q: '¿Cuánto espacio tienes alrededor?',
    opts: [['sit', 'Solo mi silla'], ['stand', 'Puedo ponerme de pie junto al escritorio'], ['room', 'Tengo espacio para estirar los brazos y moverme']] },
  { key: 'floor', q: '¿Puedes hacer estiramientos en el piso?', when: a => a.space === 'room',
    opts: [[true, 'Sí, tengo un tapete o una alfombra'], [false, 'Prefiero no']] },
  { key: 'props', multi: true, q: '¿Qué tienes a mano?', hint: 'Marca todo lo que tengas. Si no tienes nada, sigue igual.',
    opts: [['chair', 'Una silla firme, sin ruedas'], ['desk', 'Un escritorio o una mesa firme'], ['wall', 'Una pared libre'],
      ['towel', 'Una toalla, un cinturón o una banda'], ['ball', 'Una pelota pequeña (de tenis o de masaje)']] },
  { key: 'zones', multi: true, q: '¿Dónde sientes más tensión?', hint: 'Daremos prioridad a esas zonas.', opts: Object.entries(ZONES) },
  { key: 'every', q: '¿Cada cuánto quieres una pausa?',
    opts: [[30, 'Cada 30 minutos'], [45, 'Cada 45 minutos (recomendado)'], [60, 'Cada hora'], [90, 'Cada hora y media']] },
  { key: 'size', q: '¿Cuánto quieres que dure cada pausa?',
    opts: [['short', 'Rápida: 2 estiramientos, 1 minuto'], ['medium', 'Normal: 4 estiramientos, unos 3 minutos'], ['long', 'Completa: 6 estiramientos, unos 5 minutos']] },
];
const SIZES = { short: 2, medium: 4, long: 6 };
const RANK = { sit: 0, stand: 1, room: 2 };
const TIPS = [
  'Si puedes, levántate y camina un par de minutos.', 'Toma un vaso de agua.',
  'Revisa tu postura: pies en el piso y la pantalla a la altura de los ojos.', 'Respira profundo tres veces antes de volver.',
  'Relaja la mandíbula y deja caer los hombros.',
];

let profile = store.get('profile', null);
let nextAt = 0, paused = false, stopAnim = null;

// ---------- Pantallas ----------
let screen = '', backTo = 'home';
function show(id) {
  if (screen !== 'catalog' && screen !== 'settings') backTo = screen || 'home';
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
      body.innerHTML = `<p class="q-title">Hola, soy Estira</p>
        <p>Te voy a recordar cada cierto tiempo que hagas una pausa y te guiaré con estiramientos cortos, pensados para quienes pasan el día frente a la computadora.</p>
        <div class="note"><strong>Antes de empezar</strong><ul>
          <li>Estira hasta sentir tensión suave, nunca dolor.</li>
          <li>No rebotes y respira lento.</li>
          <li>Si tienes una lesión, dolor fuerte, hormigueo o alguna condición médica, consulta antes a un profesional de la salud.</li>
        </ul></div>
        <p class="muted">Ahora unas preguntas rápidas para elegir los estiramientos que te sirven.</p>
        <div class="grow"></div><button class="primary" id="q-next">Empezar</button>`;
      $('#q-next').onclick = () => { i++; render(); };
      return;
    }
    if (i >= list.length) {
      const n = EXERCISES.filter(e => eligible(e, answers)).length;
      body.innerHTML = `<p class="q-title">Todo listo</p>
        <p>Encontré <strong>${n} estiramientos</strong> que puedes hacer con lo que tienes. Te recordaré cada ${answers.every} minutos.</p>
        <p class="muted">Puedes cambiar tus respuestas cuando quieras en Ajustes.</p>
        ${invoke ? '<label class="check"><input type="checkbox" id="q-auto" checked> Abrir Estira al iniciar Windows</label>' : ''}
        <div class="grow"></div>
        <button class="primary" id="q-next">Comenzar</button><button class="link" id="q-back">Atrás</button>`;
      $('#q-back').onclick = () => { i--; render(); };
      $('#q-next').onclick = () => {
        if ($('#q-auto')) setAutostart($('#q-auto').checked);
        profile = answers; store.set('profile', profile); restartTimer(); show('home');
      };
      return;
    }
    const q = list[i], sel = v => q.multi ? answers[q.key].includes(v) : answers[q.key] === v;
    body.innerHTML = `<p class="q-title">${q.q}</p>${q.hint ? `<p class="muted">${q.hint}</p>` : ''}
      ${q.opts.map(([v, label], j) => `<button class="opt" data-j="${j}" aria-pressed="${sel(v)}">${label}</button>`).join('')}
      <div class="grow"></div>
      ${q.multi ? '<button class="primary" id="q-next">Siguiente</button>' : ''}
      <button class="link" id="q-back">Atrás</button>`;
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
  const out = [];
  while (out.length < SIZES[p.size] && pool.length) {
    let r = Math.random() * pool.reduce((s, x) => s + x.w, 0), i = 0;
    while (i < pool.length - 1 && (r -= pool[i].w) > 0) i++;
    out.push(pool.splice(i, 1)[0].e);
  }
  store.set('recent', out.map(e => e.id));
  return out;
}

// ---------- Temporizador ----------
// ponytail: el temporizador vive en la página; con la ventana oculta, WebView2 puede retrasar los timers
// hasta ~1 minuto. Para recordatorios de 30-90 minutos es suficiente; si hace falta precisión, moverlo a Rust.
function restartTimer(min = profile.every) { nextAt = Date.now() + min * 60000; paused = false; }
const fmt = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const clock = t => new Date(t).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
const today = () => new Date().toLocaleDateString('sv');

function renderHome() {
  if (!profile) return;
  const left = nextAt - Date.now(), total = (paused ? 60 : profile.every) * 60000;
  $('#home-label').textContent = paused ? 'En pausa. Vuelvo en' : 'Próxima pausa en';
  $('#home-time').textContent = fmt(left);
  $('#ring-bar').style.strokeDashoffset = 100 - Math.min(100, Math.max(0, left / total * 100));
  const st = store.get('stats', {}), n = st.date === today() ? st.count : 0;
  $('#home-today').textContent = n ? `Hoy llevas ${n} ${n === 1 ? 'pausa' : 'pausas'}.` : 'Aún no haces pausas hoy.';
  $('#pause').textContent = paused ? 'Reanudar' : 'Pausar 1 hora';
}

setInterval(() => {
  if (!profile) return;
  if (screen === 'home') renderHome();
  if (Date.now() >= nextAt && !['remind', 'session', 'done', 'quiz'].includes(screen)) remind();
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
function remind() {
  routine = pickRoutine(profile);
  const secs = routine.reduce((s, e) => s + e.secs * (e.sides ? 2 : 1), 0);
  $('#remind-sub').textContent = `Llevas un rato frente a la pantalla. Esta pausa toma unos ${Math.max(1, Math.round(secs / 60))} min.`;
  $('#remind-list').innerHTML = routine.map(e => `<li>${e.name}</li>`).join('');
  show('remind'); surface(); chime();
}
$('#now').onclick = remind;
$('#snooze').onclick = () => { restartTimer(10); unpin(); show('home'); toTray(); };
$('#skip').onclick = () => { restartTimer(); unpin(); show('home'); toTray(); };
$('#start').onclick = () => { unpin(); runSession(); };
$('#pause').onclick = () => { paused ? restartTimer() : (restartTimer(60), paused = true); renderHome(); };

let tick = null;
function runSession() {
  const plan = routine.flatMap(ex => ex.sides
    ? [{ ex, mirror: false, side: 'Primer lado' }, { ex, mirror: true, side: 'Segundo lado' }]
    : [{ ex, mirror: false, side: '' }]);
  let i = 0, left = 0, holding = false;
  $('#dots').innerHTML = routine.map(() => '<i></i>').join('');
  const load = () => {
    const { ex, mirror, side } = plan[i];
    stopAnim?.(); stopAnim = animateExercise($('#anim'), ex, mirror);
    $('#side').textContent = side;
    $('#ex-name').textContent = ex.name;
    $('#ex-steps').innerHTML = ex.steps.map(s => `<li>${s}</li>`).join('');
    $('#ex-caution').textContent = ex.caution || '';
    const idx = routine.indexOf(ex);
    $('#dots').querySelectorAll('i').forEach((d, j) => d.classList.toggle('on', j <= idx));
    $('#next').textContent = i === plan.length - 1 ? 'Terminar' : 'Siguiente';
    left = ex.secs; holding = false; $('#hold').textContent = 'Pausar';
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
    if (left <= 0) { chime(); next(); }
  }, 1000);
  $('#next').onclick = next;
  $('#hold').onclick = () => { holding = !holding; $('#hold').textContent = holding ? 'Seguir' : 'Pausar'; };
  $('#end').onclick = () => finish(false);
  show('session'); load();
}

function finish(completed) {
  clearInterval(tick); stopAnim?.(); stopAnim = null;
  restartTimer();
  if (completed) {
    const st = store.get('stats', {});
    store.set('stats', { date: today(), count: (st.date === today() ? st.count : 0) + 1 });
  }
  $('#done-next').textContent = `Tu próxima pausa es a las ${clock(nextAt)}.`;
  $('#done-tip').textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
  show('done');
}
$('#done-close').onclick = () => { show('home'); toTray(); };

// ---------- Catálogo ----------
$('#go-catalog').onclick = () => {
  const grid = $('#grid');
  grid.innerHTML = '';
  for (const ex of EXERCISES) {
    const ok = eligible(ex, profile);
    const b = document.createElement('button');
    b.className = `card ${ok ? 'on' : 'off'}`;
    b.innerHTML = `<svg aria-hidden="true"></svg><span>${ex.name}</span>`;
    animateExercise(b.querySelector('svg'), ex, false, true);
    b.onclick = () => openDetail(ex);
    grid.append(b);
  }
  show('catalog');
};

function openDetail(ex) {
  const d = $('#detail');
  stopAnim?.(); stopAnim = animateExercise($('#detail-anim'), ex);
  $('#detail-name').textContent = ex.name;
  const req = { sit: 'En la silla', stand: 'De pie', room: 'Con espacio' }[ex.pos] + (ex.floor ? ', en el piso' : '');
  $('#detail-meta').textContent = `${ex.zones.map(z => ZONES[z]).join(' · ')} — ${req} — ${ex.secs} s${ex.sides ? ' por lado' : ''}`;
  $('#detail-steps').innerHTML = ex.steps.map(s => `<li>${s}</li>`).join('');
  $('#detail-caution').textContent = ex.caution || '';
  d.onclose = () => { stopAnim?.(); stopAnim = null; };
  d.showModal();
}

// ---------- Ajustes ----------
$('#go-settings').onclick = async () => {
  const label = k => QUIZ.find(q => q.key === k).opts;
  const one = k => label(k).find(([v]) => v === profile[k])?.[1] ?? '—';
  const many = k => label(k).filter(([v]) => profile[k].includes(v)).map(o => o[1]).join(', ') || 'Nada';
  $('#summary').innerHTML = `<dt>Lugar</dt><dd>${one('place')}</dd><dt>Espacio</dt><dd>${one('space')}${profile.space === 'room' ? (profile.floor ? ', con piso' : ', sin piso') : ''}</dd>
    <dt>A mano</dt><dd>${many('props')}</dd><dt>Zonas</dt><dd>${many('zones')}</dd>
    <dt>Frecuencia</dt><dd>${one('every')}</dd><dt>Duración</dt><dd>${one('size')}</dd>`;
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

// ---------- Inicio ----------
if (profile) { restartTimer(); show('home'); } else startQuiz();
