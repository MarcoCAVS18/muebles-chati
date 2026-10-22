// Verificación rápida del motor: node scripts/check.mjs
import { CONFIG_INICIAL, CARGAS_INICIALES, ELECTRICA_INICIAL } from '../src/data/defaults.js';
import { construir } from '../src/engine/construir.js';
import { planificar, pesoEstimado, listaDeCompras } from '../src/engine/cortes.js';
import { resumenFijaciones } from '../src/engine/fijaciones.js';
import { calcularElectrica } from '../src/engine/electrica.js';
import { electrico3d } from '../src/engine/electrico3d.js';
import { videosDe } from '../src/data/videos.js';

const data = construir(CONFIG_INICIAL);
const plan = planificar(data.partes, CONFIG_INICIAL);
const fij = resumenFijaciones(data.uniones, data.anclajes);
const e3 = electrico3d(CONFIG_INICIAL);
const ele = calcularElectrica(CARGAS_INICIALES, ELECTRICA_INICIAL, e3.cables);
const compras = listaDeCompras(data, plan, CONFIG_INICIAL, ele, e3);

const porGrupo = {};
for (const p of data.partes) porGrupo[p.grupo] = (porGrupo[p.grupo] || 0) + 1;

console.log('Piezas por mueble:', porGrupo);
console.log('Equipos:', data.equipos.map((e) => e.nombre));
console.log('Avisos de geometría:', data.avisos);
console.log('Avisos de cortes:', plan.lista.avisos);
for (const [mat, res] of Object.entries(plan.planPlacas)) {
  console.log(`Placas ${mat}: ${res.hojas.length} hojas, aprovechamiento ${(res.aprovechamientoTotal * 100).toFixed(1)} %, sin colocar: ${res.sinColocar.length}`);
}
for (const [mat, res] of Object.entries(plan.planListones)) {
  console.log(`Listones ${mat}: ${res.barras.length} barras, sin colocar: ${res.sinColocar.length}`);
}
console.log('Peso estimado (kg):', pesoEstimado(data.partes, CONFIG_INICIAL).toFixed(1));
console.log('Fijaciones:', fij.totales.map((f) => `${f.nombre}: ${f.cantidad}`));
console.log('Eléctrica: Wh/dia', ele.whDia.toFixed(0), 'Ah/dia', ele.ahDia.toFixed(1), 'autonomía d', ele.autonomiaDias.toFixed(1), 'h conducción', ele.horasConduccion.toFixed(1));
console.log('Tramos:', ele.tramos.map((t) => `${t.nombre}: ${t.largoM.toFixed(2)} m, ${t.amperes.toFixed(1)} A, ${t.seccion} mm2, fusible ${t.fusible} A, caída ${t.caidaPct.toFixed(2)} %`));
console.log('Cable a comprar:', ele.cableCompras.map((c) => `${c.item}: ${c.metros} m`));
console.log('Filas de compras:', compras.length);

// Comprobaciones duras
let fallos = 0;
const exigir = (cond, msg) => {
  if (!cond) {
    console.error('FALLA:', msg);
    fallos++;
  }
};
exigir(data.partes.every((p) => p.sx > 0 && p.sy > 0 && p.sz > 0), 'hay piezas con medida cero o negativa');
exigir(new Set(data.partes.map((p) => p.id)).size === data.partes.length, 'ids de pieza repetidos');
for (const res of Object.values(plan.planPlacas)) {
  for (const h of res.hojas) {
    for (const t of h.tiras) {
      const ancho = t.items.reduce((s, i) => s + i.w, 0) + (t.items.length - 1) * CONFIG_INICIAL.corte.kerf;
      exigir(ancho <= CONFIG_INICIAL.materiales.estructura.hojaL, 'una tira excede el largo de la hoja');
    }
  }
}

// Cada elemento eléctrico y cada cable tiene video, y ningún cable atraviesa un equipo
const cajas = [...data.equipos, ...e3.equipos];
const dentro = (p, b, m = 1) =>
  p[0] > b.x + m && p[0] < b.x + b.sx - m && p[1] > b.y + m && p[1] < b.y + b.sy - m && p[2] > b.z + m && p[2] < b.z + b.sz - m;
for (const e of e3.equipos) exigir(videosDe(e.id).length > 0, `sin video para ${e.id}`);
for (const c of [...e3.cables, ...e3.mangueras]) {
  exigir(videosDe(c.video).length > 0, `sin video para el cable ${c.id}`);
  for (let i = 1; i < c.puntos.length; i++) {
    const a = c.puntos[i - 1];
    const b = c.puntos[i];
    const n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 4));
    for (let k = 0; k <= n; k++) {
      const p = [0, 1, 2].map((j) => a[j] + ((b[j] - a[j]) * k) / n);
      for (const q of cajas) {
        if (q.id !== c.desde && q.id !== c.hasta) exigir(!dentro(p, q), `el cable ${c.id} atraviesa ${q.id}`);
      }
    }
  }
}
exigir(data.avisos.length === 0, 'hay avisos de geometría');
// La cama extendida: las bandejas tienen que existir y moverse hasta 1200 mm de ancho
const bandejas = data.partes.filter((p) => p.ext && p.radio);
exigir(bandejas.length === 2, 'faltan las dos bandejas extensibles');
const xMax = Math.max(...bandejas.map((p) => p.x + p.sx + CONFIG_INICIAL.cama.extension));
exigir(xMax - CONFIG_INICIAL.cama.x0 >= 1200 - 1, 'la cama extendida no llega a 120 cm');
exigir(data.partes.filter((p) => p.radio).length >= 4, 'faltan placas con esquinas redondeadas');
exigir(data.decos.every((d) => d.id), 'decos sin id');
process.exit(fallos ? 1 : 0);
