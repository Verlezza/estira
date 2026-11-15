// Motor de la figura ilustrada: un esqueleto 2D definido por ángulos en grados.
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
  'floor-front': { view: 'front', pose: { y: 196, tf: 0.9 }, bg: ['mat'], vb: '0 80 200 140' },
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
  stool: () => `<g class="prop"><rect x="74" y="172" width="40" height="7" rx="3"/><path d="M80 179V${FLOOR} M108 179V${FLOOR}"/></g>`,
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

// ---------- Ilustración fija ----------
// Se dibuja la pose inicial en tenue, la final en sólido y una flecha con el recorrido.
// La flecha va separada del cuerpo para no tapar la figura.

// Un estiramiento "se repite" si va y vuelve (encoger hombros, círculos); si no, "se mantiene".
const isRepeat = ex => ex.frames.length > 2 || Math.max(...ex.frames.map(f => f.h ?? 1)) < 2.5;

// Las dos poses más distintas entre sí: para los que se repiten, los extremos del movimiento.
function keyPoses(qs) {
  if (qs.length === 2) return qs;
  let best = [qs[0], qs[1]], max = -1;
  for (const a of qs) for (const b of qs) {
    const d = Object.keys(a).reduce((n, k) => n + Math.abs(a[k] - b[k]), 0);
    if (d > max) { max = d; best = [a, b]; }
  }
  return best;
}

function arrowSvg(q0, q1, side, both) {
  const s0 = solve(q0, side), s1 = solve(q1, side);
  // Punto que más se mueve: manos, cabeza, hombros o pies. Cabeza y hombros pesan más para que,
  // por ejemplo, al encoger los hombros la flecha vaya en el hombro y no en la mano.
  const cands = [[s0.arm1[3], s1.arm1[3], 12, 1], [s0.arm2[3], s1.arm2[3], 12, 1], [s0.head, s1.head, LEN.hd + 12, 1.5],
    [s0.sR, s1.sR, 14, 1.5], [s0.leg1[3], s1.leg1[3], 12, 1], [s0.leg2[3], s1.leg2[3], 12, 1]];
  const dist = c => Math.hypot(c[1][0] - c[0][0], c[1][1] - c[0][1]) * c[3];
  let [a, b, off] = cands.reduce((m, c) => (dist(c) > dist(m) ? c : m));
  // Movimientos pequeños (cuello, tobillos): la flecha tiene un largo mínimo para que se lea.
  const MIN = 28, len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (len < MIN) {
    const ux = len ? (b[0] - a[0]) / len : 1, uy = len ? (b[1] - a[1]) / len : 0, k = (MIN - len) / 2;
    a = [a[0] - ux * k, a[1] - uy * k]; b = [b[0] + ux * k, b[1] + uy * k];
  }
  // La flecha se corre en perpendicular al movimiento, hacia el lado opuesto al cuerpo.
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, c = s1.mid, ml = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  let nx = -(b[1] - a[1]) / ml, ny = (b[0] - a[0]) / ml;
  if ((mx + nx - c[0]) ** 2 + (my + ny - c[1]) ** 2 < (mx - c[0]) ** 2 + (my - c[1]) ** 2) { nx = -nx; ny = -ny; }
  // Si de ese lado no cabe en el dibujo, va del otro.
  const fits = k => [a, b].every(p => p[0] + nx * k * off > 6 && p[0] + nx * k * off < 194 && p[1] + ny * k * off > 6 && p[1] + ny * k * off < 214);
  if (!fits(1.6) && fits(-1.6)) { nx = -nx; ny = -ny; }
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const P = p => [clamp(p[0] + nx * off, 6, 194), clamp(p[1] + ny * off, 6, 214)];
  const p0 = P(a), p1 = P(b), d = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1;
  const bulge = Math.max(d * 0.35, 10);
  const cx = clamp((p0[0] + p1[0]) / 2 + nx * bulge, 4, 196), cy = clamp((p0[1] + p1[1]) / 2 + ny * bulge, 4, 216);
  const head = (p, from) => {
    const ang = Math.atan2(p[1] - from[1], p[0] - from[0]);
    const w = k => `${(p[0] - 8 * Math.cos(ang + k)).toFixed(1)},${(p[1] - 8 * Math.sin(ang + k)).toFixed(1)}`;
    return `<polyline class="arrow" points="${w(0.5)} ${pts([p])} ${w(-0.5)}"/>`;
  };
  return `<path class="arrow" d="M${pts([p0])} Q${cx.toFixed(1)},${cy.toFixed(1)} ${pts([p1])}"/>` +
    head(p1, [cx, cy]) + (both ? head(p0, [cx, cy]) : '');
}

// Zonas que se pueden pintar: cada una es una lista de tramos del esqueleto.
const TARGETS = {
  neck: s => [[s.top, s.neckEnd]],
  shoulders: s => [[s.sL, s.top, s.sR]],
  upper: s => [[s.mid, s.top]],
  lower: s => [[s.hip, s.mid]],
  arm1: s => [s.arm1.slice(0, 2)], arm2: s => [s.arm2.slice(0, 2)],
  fore1: s => [s.arm1.slice(1)], fore2: s => [s.arm2.slice(1)],
  thigh1: s => [s.leg1.slice(0, 2)], thigh2: s => [s.leg2.slice(0, 2)],
  shin1: s => [s.leg1.slice(1, 3)], shin2: s => [s.leg2.slice(1, 3)],
  foot1: s => [s.leg1.slice(2)], foot2: s => [s.leg2.slice(2)],
};

// Pinta la zona que se estira sobre la pose final.
function paintTarget(q, side, target) {
  const s = solve(q, side);
  return (target || '').split(' ').filter(Boolean).flatMap(k => TARGETS[k](s))
    .map(p => `<polyline class="target${p.length && (p[0] === s.hip || p[0] === s.mid) && side ? ' wide' : ''}" points="${pts(p)}"/>`).join('');
}

// Dibuja la ilustración de un estiramiento en un <svg>.
function illustrate(svg, ex, mirror = false) {
  const scene = SCENES[ex.scene], extras = ex.props || [];
  const qs = ex.frames.map(f => ({ ...BASE, ...scene.pose, ...ex.base, ...f.p }));
  const repeat = isRepeat(ex), [q0, q1] = repeat ? keyPoses(qs) : [qs[0], qs[qs.length - 1]];
  const bg = scene.bg.concat(extras.filter(p => PROPS[p])).map(p => PROPS[p]()).join('');
  svg.setAttribute('viewBox', scene.vb || '0 0 200 220');
  svg.innerHTML = `<g ${mirror ? 'transform="translate(200 0) scale(-1 1)"' : ''}>
    <line class="floor" x1="0" y1="${FLOOR}" x2="200" y2="${FLOOR}"/>${bg}
    <g class="fig ghost">${draw(q0, scene.view, extras)}</g><g class="fig">${draw(q1, scene.view, extras)}</g>
    <g class="fig">${paintTarget(q1, scene.view === 'side', ex.target)}</g>
    ${arrowSvg(q0, q1, scene.view === 'side', repeat)}</g>`;
}
