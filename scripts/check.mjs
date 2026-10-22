// Verificación rápida del motor: node scripts/check.mjs
import { CONFIG_INICIAL, CARGAS_INICIALES, ELECTRICA_INICIAL } from '../src/data/defaults.js';
import { construir } from '../src/engine/construir.js';
import { planificar, pesoEstimado, listaDeCompras } from '../src/engine/cortes.js';
import { resumenFijaciones } from '../src/engine/fijaciones.js';
import { calcularElectrica } from '../src/engine/electrica.js';

const data = construir(CONFIG_INICIAL);
const plan = planificar(data.partes, CONFIG_INICIAL);
const fij = resumenFijaciones(data.uniones, data.anclajes);
const ele = calcularElectrica(CARGAS_INICIALES, ELECTRICA_INICIAL);
const compras = listaDeCompras(data, plan, CONFIG_INICIAL);

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
console.log('Tramos:', ele.tramos.map((t) => `${t.nombre}: ${t.seccion} mm2, fusible ${t.fusible} A, caída ${t.caidaPct.toFixed(2)} %`));
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
process.exit(fallos ? 1 : 0);
