// Verificación rápida del motor: node scripts/check.mjs
import { CONFIG_INICIAL, CARGAS_INICIALES, ELECTRICA_INICIAL } from '../src/data/defaults.js';
import { construir } from '../src/engine/construir.js';
import { planificar, pesoEstimado, listaDeCompras } from '../src/engine/cortes.js';
import { resumenFijaciones } from '../src/engine/fijaciones.js';
import { calcularElectrica } from '../src/engine/electrica.js';
import { electrico3d } from '../src/engine/electrico3d.js';
import { videosDe, VIDEOS } from '../src/data/videos.js';
import { ELEMENTOS } from '../src/data/elementos.js';

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

// ---- Diseño: mueble trasero de 450 mm, eléctrico a la izquierda, cocina con gas al centro, agua a la derecha ----
const cfgI = CONFIG_INICIAL;
const tra = data.partes.filter((p) => p.grupo === 'Mueble trasero');
exigir(cfgI.trasero.profundidad === 450, 'el mueble trasero debería tener 450 mm de profundidad');
exigir(cfgI.trasero.ancho === cfgI.van.ancho, 'el mueble trasero debería ir de pared a pared');
exigir(tra.every((p) => p.z + p.sz <= cfgI.van.largo + 0.5), 'el mueble trasero se sale del mamparo');

// Cada equipo y cada cable tiene un video propio (sin caer en el video genérico) y una ficha
const ids = [...data.equipos, ...e3.equipos].map((e) => e.id);
for (const id of ids) {
  exigir(VIDEOS[id], `el equipo ${id} no tiene lista de videos propia`);
  exigir(ELEMENTOS[id], `el equipo ${id} no tiene ficha en elementos.js`);
}
for (const c of [...e3.cables, ...e3.mangueras]) exigir(VIDEOS[c.video], `el cable ${c.id} usa un video que no existe: ${c.video}`);

// Los equipos no se pisan entre sí ni atraviesan la estructura del mueble (salvo los que encastran en la tapa)
const solapan = (a, b, tol = 0.5) =>
  a.x + a.sx > b.x + tol && b.x + b.sx > a.x + tol && a.y + a.sy > b.y + tol && b.y + b.sy > a.y + tol && a.z + a.sz > b.z + tol && b.z + b.sz > a.z + tol;
const interiores = [...data.equipos, ...e3.equipos.filter((e) => e.en === 'Mueble trasero')];
for (let i = 0; i < interiores.length; i++) {
  for (let j = i + 1; j < interiores.length; j++) {
    exigir(!solapan(interiores[i], interiores[j]), `los equipos ${interiores[i].id} y ${interiores[j].id} se pisan`);
  }
}
const ENCASTRADOS = ['fregadero', 'anafe', 'canilla', 'detectorGas'];
for (const e of interiores) {
  if (ENCASTRADOS.includes(e.id)) continue;
  for (const p of tra) exigir(!solapan(e, p), `el equipo ${e.id} atraviesa la pieza ${p.id} (${p.nombre})`);
}
// Orden del mueble trasero, visto desde la puerta trasera: eléctrico a la izquierda, cocina al centro y agua a la derecha
const eqE = (id) => e3.equipos.find((q) => q.id === id) || data.equipos.find((q) => q.id === id);
const centroX = (id) => eqE(id).x + eqE(id).sx / 2;
const xDiv1 = cfgI.trasero.divisor1;
const xDiv2 = cfgI.trasero.divisor2;
for (const id of ['bateria', 'inversor', 'dcdc', 'fusibles', 'fusiblePrincipal']) {
  const e = eqE(id);
  exigir(e && e.x + e.sx <= xDiv1, `${id} debería estar en la sección eléctrica (izquierda)`);
  exigir(e && freg_dist(e) > 400, `${id} debería quedar lejos del fregadero`);
}
for (const id of ['nevera', 'garrafa', 'regulador', 'anafe']) {
  exigir(centroX(id) > xDiv1 && centroX(id) < xDiv2, `${id} debería estar en la sección de la cocina (centro)`);
}
for (const id of ['fregadero', 'bidon1', 'bidon2', 'bomba', 'canilla']) {
  exigir(eqE(id).x >= xDiv2, `${id} debería estar en la sección del agua (derecha)`);
}
const bat = eqE('bateria');
exigir(bat.sx > bat.sy && bat.sx > bat.sz, 'la batería debería ir acostada (el largo sobre x)');
exigir(bat.y + bat.sy < cfgI.cama.plataforma - 20, 'la batería debería quedar bajo el plano de la cama');
function freg_dist(e) {
  const f = data.equipos.find((q) => q.id === 'fregadero');
  return f.x - (e.x + e.sx);
}
// Heladera visible: la puerta tiene color propio y abre la ficha del equipo
exigir(tra.some((p) => p.abre === 'nevera' && p.color), 'la puerta de la heladera debería tener color y abrir la heladera');
exigir(tra.some((p) => p.abre === 'garrafa'), 'falta el frente del cajón del gas');
// El cajón de bidones llega hasta el piso, queda bajo la cama y los frentes altos sobre ella
const frBid = tra.find((p) => p.nombre === 'Frente cajón de bidones');
exigir(frBid && frBid.y < 30 && frBid.y + frBid.sy <= cfgI.cama.plataforma - cfgI.materiales.estructura.t - 30, 'el frente de bidones debería llegar al piso y quedar bajo la cama');
exigir(tra.find((p) => p.nombre === 'Frente cajón bajo el fregadero').y > cfgI.cama.plataforma, 'el cajón bajo el fregadero debería quedar sobre la cama');
// Tres tiras LED y extractor sin conexión
exigir(['ledA', 'ledB', 'ledC'].every((id) => e3.equipos.some((e) => e.id === id)), 'faltan las tres tiras LED');
exigir(e3.largoC > 500, 'la tercera tira LED quedó muy corta');
exigir(!e3.cables.some((c) => c.desde === 'extractor' || c.hasta === 'extractor'), 'el extractor no debería tener cable');
const ex = e3.equipos.find((e) => e.id === 'extractor');
exigir(ex && ex.sx === 310 && ex.sz === 310, 'el extractor debería medir 310 x 310 mm con el marco');
exigir(ELECTRICA_INICIAL.switches.length === 5 && !ELECTRICA_INICIAL.switches.includes('Extractor'), 'el panel debería tener 5 interruptores sin el extractor');
exigir(!CARGAS_INICIALES.some((c) => c.id === 'extractor'), 'el extractor no debería tener consumo');
// Gas
for (const id of ['anafe', 'garrafa', 'regulador', 'valvulaGas', 'detectorGas']) exigir(data.equipos.some((e) => e.id === id), `falta el equipo de gas ${id}`);
exigir(e3.mangueras.filter((m) => m.tipo === 'gas').length === 2, 'faltan las mangueras de gas');
// La bomba de agua sigue conectada
exigir(e3.cables.some((c) => c.hasta === 'bomba') && CARGAS_INICIALES.some((c) => c.id === 'bomba'), 'la bomba de 12 V debería estar conectada');

process.exit(fallos ? 1 : 0);
