// Revisa que cada estiramiento del catálogo esté bien definido y se pueda dibujar.
// Uso: npm test
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

// i18n.js lee el idioma del navegador; aquí se simula uno.
const ctx = { navigator: { language: 'es' }, localStorage: { getItem: () => null }, document: { documentElement: {} } };
vm.createContext(ctx);
for (const f of ['i18n.js', 'exercises.js', 'figure.js']) vm.runInContext(fs.readFileSync(`${__dirname}/../src/${f}`, 'utf8'), ctx);
const { EXERCISES, STR, EXERCISES_EN, SCENES, BASE, draw, TARGETS } = vm.runInContext('({ EXERCISES, STR, EXERCISES_EN, SCENES, BASE, draw, TARGETS })', ctx);
const ZONES = STR.es.zones;

// Los dos idiomas deben tener las mismas claves de texto.
for (const k in STR.es) assert(k in STR.en, `falta la traducción al inglés de "${k}"`);
for (const k in STR.en) assert(k in STR.es, `falta la traducción al español de "${k}"`);

const PROPS = ['chair', 'desk', 'wall', 'towel', 'ball'];
const ids = new Set();
for (const ex of EXERCISES) {
  const where = `"${ex.id}"`;
  assert(!ids.has(ex.id), `${where} está repetido`); ids.add(ex.id);
  assert(ex.name && ex.steps?.length, `${where} necesita nombre y pasos`);
  assert(['sit', 'stand', 'room'].includes(ex.pos), `${where} tiene un pos inválido`);
  assert(ex.zones.length && ex.zones.every(z => z in ZONES), `${where} tiene una zona inválida`);
  assert(ex.needs.every(n => n.split('|').every(p => PROPS.includes(p))), `${where} necesita un objeto desconocido`);
  assert(SCENES[ex.scene], `${where} usa una escena que no existe`);
  assert(ex.secs >= 10 && ex.secs <= 60, `${where} debe durar entre 10 y 60 segundos`);
  assert(ex.frames.length >= 2, `${where} necesita al menos 2 poses`);
  assert(typeof ex.target === 'string' && ex.target.split(' ').filter(Boolean).every(k => k in TARGETS), `${where} tiene una zona a pintar inválida`);
  const en = EXERCISES_EN[ex.id];
  assert(en && en.name && en.steps.length === ex.steps.length, `${where} necesita su traducción al inglés con los mismos pasos`);
  assert(!ex.caution === !en.caution, `${where}: la advertencia debe existir en los dos idiomas`);
  for (const f of ex.frames) {
    for (const k in f.p) assert(k in BASE, `${where} usa un ángulo desconocido: ${k}`);
    const svg = draw({ ...BASE, ...SCENES[ex.scene].pose, ...f.p }, SCENES[ex.scene].view, ex.props || []);
    assert(!svg.includes('NaN'), `${where} genera coordenadas inválidas`);
  }
}
console.log(`OK: ${EXERCISES.length} estiramientos revisados.`);
