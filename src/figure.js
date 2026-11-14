// Motor de la figura animada: un esqueleto 2D definido por ángulos en grados.
// Convención: un ángulo de 0 apunta hacia arriba y crece en sentido horario (90 = derecha, 180 = abajo).
//   x, y        posición de la cadera
//   sp, ch      columna baja (absoluto) y pecho (relativo a sp)
//   nk          cuello (relativo al pecho), sh = subir hombros (px), sw = ancho de hombros (giro de tronco)
//   a/f/w 1|2   brazo, antebrazo y mano (relativos; brazo 0 = colgando junto al cuerpo)
//   l/k/t 1|2   muslo (absoluto, 180 = de pie), rodilla y pie (relativos)
//   tf          escorzo del muslo (vista de frente sentado), gz = mirada a lo lejos (0..1), hr = girar la cabeza (-1..1, de frente)
// En vista "side" la figura mira a la derecha; el lado 1 es el lejano. En vista "front", 1 es el de la izquierda de la pantalla.

const LEN = { s1: 26, s2: 26, nk: 8, hd: 11, ua: 30, fa: 28, hn: 10, th: 40, sn: 40, ft: 11, SW: 16, HW: 9 };
const BASE = { x: 100, y: 130, sp: 0, ch: 0, nk: 0, sh: 0, sw: 1, a1: 0, f1: 0, w1: 0, a2: 0, f2: 0, w2: 0,
  l1: 180, k1: 0, t1: 0, l2: 180, k2: 0, t2: 0, tf: 1, gz: 0, hr: 0 };
const FLOOR = 210;

// Escenas: postura base y fondo de cada estiramiento.
const SCENES = {
  'sit-front': { view: 'front', pose: { y: 158, tf: 0.3, l1: 182, l2: 178, a1: 16, a2: -16, f1: -18, f2: 18 }, bg: ['chairFront'] },
  'sit-side': { view: 'side', pose: { x: 82, y: 170, l1: 90, l2: 90, k1: 90, k2: 90, a1: -25, f1: -55, a2: -20, f2: -55 }, bg: ['chairSide'] },
  'stand-front': { view: 'front', pose: { l1: 183, l2: 177, a1: 14, a2: -14, f1: -6, f2: 6 }, bg: [] },
  'stand-side': { view: 'side', pose: { x: 90, a1: 4, a2: -4, f1: -10, f2: -10 }, bg: [] },
  'floor-side': { view: 'side', pose: {}, bg: ['mat'], vb: '0 80 200 140' },
};

const rad = d => d * Math.PI / 180;
const step = (p, ang, len) => [p[0] + Math.sin(rad(ang)) * len, p[1] - Math.cos(rad(ang)) * len];
const pts = arr => arr.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');

function solve(q, side) {
  const hip = [q.x, q.y];
  const mid = step(hip, q.sp, LEN.s1);
  const chA = q.sp + q.ch, top = step(mid, chA, LEN.s2);
  const neckEnd = step(top, chA + q.nk, LEN.nk), head = step(neckEnd, chA + q.nk, LEN.hd);
  const sw = side ? 0 : LEN.SW * q.sw, hw = side ? 0 : LEN.HW;
  const shTop = step(top, chA, q.sh);
  const arm = (s, a, f, w) => {
    const A = chA + 180 + a, e = step(s, A, LEN.ua), h = step(e, A + f, LEN.fa);
    return [s, e, h, step(h, A + f + w, LEN.hn)];
  };
  const leg = (h0, l, k, t, dir) => {
    const kn = step(h0, l, LEN.th * q.tf), an = step(kn, l + k, LEN.sn);
    const toe = side ? step(an, l + k - 90 + t, LEN.ft) : step(an, l + k + dir * 90 + t, 6);
    return [h0, kn, an, toe];
  };
  return {
    hip, mid, top, neckEnd, head, headAng: chA + q.nk,
    sL: step(shTop, chA - 90, sw), sR: step(shTop, chA + 90, sw),
    hL: [q.x - hw, q.y], hR: [q.x + hw, q.y], mL: step(mid, q.sp - 90, sw * 0.7), mR: step(mid, q.sp + 90, sw * 0.7),
    arm1: arm(step(shTop, chA - 90, sw), q.a1, q.f1, q.w1),
    arm2: arm(step(shTop, chA + 90, sw), q.a2, q.f2, q.w2),
    leg1: leg([q.x - hw, q.y], q.l1, q.k1, q.t1, 1),
    leg2: leg([q.x + hw, q.y], q.l2, q.k2, q.t2, -1),
  };
}

const PROPS = {
  chairFront: () => `<g class="prop"><rect x="76" y="92" width="48" height="66" rx="6" class="soft"/>
    <rect x="68" y="158" width="64" height="8" rx="3"/><path d="M74 166V${FLOOR} M126 166V${FLOOR}"/></g>`,
  chairSide: () => `<g class="prop"><path d="M58 108V172" stroke-width="7"/><rect x="56" y="172" width="58" height="7" rx="3"/>
    <path d="M86 179V200 M66 ${FLOOR - 4}H108"/></g>`,
  deskSide: () => `<g class="prop"><rect x="138" y="128" width="70" height="6" rx="2"/><path d="M196 134V${FLOOR}"/></g>`,
  deskStand: () => `<g class="prop"><rect x="146" y="140" width="64" height="6" rx="2"/><path d="M196 146V${FLOOR}"/></g>`,
  monitor: () => `<g class="prop"><rect x="176" y="86" width="8" height="34" rx="2"/><path d="M180 120V128"/></g>`,
  wall: () => `<g class="prop"><rect x="176" y="20" width="10" height="${FLOOR - 20}" class="soft"/></g>`,
  mat: () => `<g class="prop"><rect x="14" y="${FLOOR - 4}" width="172" height="5" rx="2" class="soft"/></g>`,
};

function draw(q, view, extras) {
  const side = view === 'side', s = solve(q, side);
  // El contorno (halo) separa los brazos del tronco cuando se cruzan.
  const limb = (p, cls) => `<polyline class="halo" points="${pts(p)}"/><polyline class="${cls}" points="${pts(p)}"/>`;
  const far = side ? 'limb far' : 'limb';
  let out = '';
  // Objetos que dependen de la pose
  if (extras.includes('ball')) out += `<circle class="ball" cx="${((s.leg2[2][0] + s.leg2[3][0]) / 2).toFixed(1)}" cy="${FLOOR - 7}" r="7"/>`;
  out += limb(s.leg1, far) + limb(s.arm1, far);
  if (side) out += `<path class="torso" d="M${pts([s.hip])} Q${pts([s.mid])} ${pts([s.top])}"/>`;
  if (!side) out += `<polygon class="trunk" points="${pts([s.sL, s.sR, s.mR, s.hR, s.hL, s.mL])}"/>`;
  out += `<polyline class="limb" points="${pts([s.top, s.neckEnd])}"/>`;
  out += limb(s.leg2, 'limb') + limb(s.arm2, 'limb');
  // Cabeza con ojos para que se note hacia dónde mira
  const [hx, hy] = s.head, a = s.headAng;
  out += `<circle class="head" cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="${LEN.hd}"/>`;
  const eyes = side ? [step(step(s.head, a + 90, 6), a, 1)] : [step(step(s.head, a - 90, 4 - q.hr * 4), a, 1), step(step(s.head, a + 90, 4 + q.hr * 4), a, 1)];
  out += eyes.map(e => `<circle class="eye" cx="${e[0].toFixed(1)}" cy="${e[1].toFixed(1)}" r="1.6"/>`).join('');
  if (q.gz > 0.01) { const e = eyes[0]; out += `<line class="gaze" style="opacity:${q.gz.toFixed(2)}" x1="${e[0].toFixed(1)}" y1="${e[1].toFixed(1)}" x2="200" y2="${(e[1] - 6).toFixed(1)}"/>`; }
  if (extras.includes('towel')) out += `<polyline class="towel" points="${pts([s.arm1[3], s.arm2[3]])}"/>`;
  return out;
}

const ease = t => t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
const TRANS = 1.1; // segundos entre poses

function poseAt(frames, t) {
  const total = frames.reduce((n, f) => n + TRANS + (f.h ?? 1), 0);
  t %= total;
  for (let i = 0; i < frames.length; i++) {
    const prev = frames[(i - 1 + frames.length) % frames.length].q, cur = frames[i];
    if (t < TRANS) { const k = ease(t / TRANS), o = {}; for (const key in cur.q) o[key] = prev[key] + (cur.q[key] - prev[key]) * k; return o; }
    t -= TRANS;
    if (t < (cur.h ?? 1)) return cur.q;
    t -= cur.h ?? 1;
  }
  return frames[0].q;
}

// Dibuja y anima un estiramiento dentro de un <svg>. Devuelve una función para detenerlo.
function animateExercise(svg, ex, mirror = false, thumb = false) {
  const scene = SCENES[ex.scene];
  const frames = ex.frames.map(f => ({ q: { ...BASE, ...scene.pose, ...ex.base, ...f.p }, h: f.h }));
  const extras = ex.props || [];
  svg.setAttribute('viewBox', scene.vb || '0 0 200 220');
  const bg = scene.bg.concat(extras.filter(p => PROPS[p])).map(p => PROPS[p]()).join('');
  svg.innerHTML = `<g ${mirror ? 'transform="translate(200 0) scale(-1 1)"' : ''}>
    <line class="floor" x1="0" y1="${FLOOR}" x2="200" y2="${FLOOR}"/>${bg}<g class="fig"></g></g>`;
  const fig = svg.querySelector('.fig');
  const still = thumb || matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf, t0 = performance.now();
  const tick = now => {
    // Con movimiento reducido se muestra la pose principal sin animar.
    const q = still ? frames[Math.min(1, frames.length - 1)].q : poseAt(frames, (now - t0) / 1000);
    fig.innerHTML = draw(q, scene.view, extras);
    if (!still) raf = requestAnimationFrame(tick);
  };
  tick(t0);
  return () => cancelAnimationFrame(raf);
}
