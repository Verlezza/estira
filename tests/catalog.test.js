// Revisa que cada estiramiento del catálogo esté bien definido y se pueda dibujar.
// Uso: npm test
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const ctx = {};
vm.createContext(ctx);
for (const f of ['exercises.js', 'figure.js']) vm.runInContext(fs.readFileSync(`${__dirname}/../src/${f}`, 'utf8'), ctx);
const { EXERCISES, ZONES, SCENES, BASE, draw } = vm.runInContext('({ EXERCISES, ZONES, SCENES, BASE, draw })', ctx);

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
  for (const f of ex.frames) {
    for (const k in f.p) assert(k in BASE, `${where} usa un ángulo desconocido: ${k}`);
    const svg = draw({ ...BASE, ...SCENES[ex.scene].pose, ...f.p }, SCENES[ex.scene].view, ex.props || []);
    assert(!svg.includes('NaN'), `${where} genera coordenadas inválidas`);
  }
}
console.log(`OK: ${EXERCISES.length} estiramientos revisados.`);
