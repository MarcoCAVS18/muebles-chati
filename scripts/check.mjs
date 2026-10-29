// Verificación rápida del motor: node scripts/check.mjs
import { CONFIG_INICIAL, CARGAS_INICIALES, ELECTRICA_INICIAL } from '../src/data/defaults.js';
import { construir } from '../src/engine/construir.js';
import { planificar, pesoEstimado, listaDeCompras } from '../src/engine/cortes.js';
import { resumenFijaciones } from '../src/engine/fijaciones.js';
import { calcularElectrica } from '../src/engine/electrica.js';
import { electrico3d } from '../src/engine/electrico3d.js';
import { videosDe, VIDEOS } from '../src/data/videos.js';
import { ELEMENTOS } from '../src/data/elementos.js';
import { disposicionTrasero } from '../src/engine/disposicion.js';
import { contorno, describirPieza, posarCamara, anotarPieza } from '../src/engine/enfoque.js';
import { armarTutorial, agujerosDe, caladosDe } from '../src/engine/tutorial.js';
import { rolDe, ROLES, oscurecer } from '../src/engine/colores.js';
import { planAbrir, llaveCajon } from '../src/engine/abrir.js';

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
console.log('Caminos:', ele.caminos.map((c) => `${c.nombre}: ${c.largoM.toFixed(2)} m, ${c.caidaPct.toFixed(2)} %`));
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

// ---- Diseño: mueble trasero de 500 mm con una L de 570 mm a la izquierda (eléctrico), cocina con gas al centro, agua a la derecha ----
const cfgI = CONFIG_INICIAL;
const tra = data.partes.filter((p) => p.grupo === 'Mueble trasero');
exigir(cfgI.trasero.profundidad === 500, 'el mueble trasero debería tener 500 mm de profundidad');
exigir(cfgI.trasero.profundidadL === 570, 'la sección eléctrica (la L) debería tener 570 mm de profundidad');
// Medidas tomadas en la van: puerta lateral de 98 cm, vigas de 22 cm, pasarruedas de 80 x 42,5 x 18,5 cm
const vn = cfgI.van;
exigir(vn.puertaLateral.largo === 980 && vn.puertaLateral.vigas === 220, 'la puerta lateral debería medir 980 mm y las vigas 220 mm');
exigir(vn.archLargo === 800 && vn.archAlto === 425 && vn.archIntrusion === 185, 'el pasarruedas debería medir 800 x 425 x 185 mm');
exigir(vn.archInicio + vn.archLargo + vn.puertaLateral.vigas + vn.puertaLateral.largo + vn.puertaLateral.desdeMamparo === vn.largo, 'el pasarruedas, las vigas y la puerta no suman el largo útil de la van');
exigir(cfgI.cama.largo === 1800, 'la cama debería medir 180 cm de largo');
exigir(vn.archAltoIzq === 380, 'el pasarruedas izquierdo, con su tapa, debería medir 380 mm de alto');
exigir(cfgI.cama.plataforma === vn.archAltoIzq + 15, 'la placa de la cama (15 mm) debería apoyar sobre el pasarruedas izquierdo: cama a 39,5 cm');
exigir(cfgI.cama.ancho === 710 && cfgI.cama.ancho + cfgI.cama.extension === 1200, 'la cama debería medir 71 cm cerrada y 120 cm abierta');
exigir(cfgI.cama.bandejaAncho === cfgI.cama.extension && cfgI.cama.ancho + cfgI.cama.bandejaAncho <= cfgI.materiales.estructura.hojaA, 'la bandeja debería ser el sobrante de la placa y salir de la misma lámina');
exigir(Math.abs(vn.largo - cfgI.cama.largo - cfgI.trasero.profundidadL) >= 0 && vn.largo - cfgI.cama.largo - cfgI.trasero.profundidadL < vn.archInicio, 'la cama más la L deberían terminar antes del pasarruedas');
exigir(cfgI.trasero.ancho === 1560 && cfgI.trasero.ancho <= cfgI.van.ancho, 'el mueble trasero debería medir 1560 mm de ancho y caber en la van');
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
// La heladera asoma por la tapa 1 (la tapa lleva el recorte), por eso también está encastrada
const ENCASTRADOS = ['fregadero', 'anafe', 'canilla', 'detectorGas', 'nevera'];
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
  exigir(e && freg_dist(e) >= 400, `${id} debería quedar lejos del fregadero`);
}
exigir(centroX('nevera') < xDiv1, 'la heladera debería estar en la sección eléctrica (arriba de la batería)');
for (const id of ['garrafa', 'regulador', 'anafe']) {
  exigir(centroX(id) > xDiv1 && centroX(id) < xDiv2, `${id} debería estar en la sección de la cocina (centro)`);
}
for (const id of ['fregadero', 'bidon1', 'bidon2', 'bomba', 'canilla']) {
  exigir(eqE(id).x >= xDiv2, `${id} debería estar en la sección del agua (derecha)`);
}
const bat = eqE('bateria');
exigir(bat.sx === 295 && bat.sy === 280 && bat.sz === 200, 'la batería debería medir 295 x 280 x 200 mm (ancho, alto, profundidad)');
exigir(bat.y + bat.sy < cfgI.cama.plataforma - 20, 'la batería debería quedar bajo el plano de la cama');
function freg_dist(e) {
  const f = data.equipos.find((q) => q.id === 'fregadero');
  return f.x - (e.x + e.sx);
}
// Garrafa: el cajón del gas se tira entero (frente alto incluido) y no puede chocar con la cama.
// La placa de la cabecera tiene que tener un recorte que cubra todo lo que el cajón barre sobre ella.
const bar = disposicionTrasero(cfgI).K.barridoGas;
const GAS_RECORRIDO_MIN = 300; // la garrafa de 230 mm tiene que salir del frente del mueble
exigir(bar.z1 - bar.z0 >= GAS_RECORRIDO_MIN, 'el cajón del gas debería poder salir al menos 300 mm');
for (const p of data.partes.filter((q) => q.grupo === 'Cama' && q.sx > 0)) {
  const ix0 = Math.max(bar.x0, p.x), ix1 = Math.min(bar.x1, p.x + p.sx);
  const iz0 = Math.max(bar.z0, p.z), iz1 = Math.min(bar.z1, p.z + p.sz);
  const iy = Math.min(bar.y1, p.y + p.sy) - Math.max(bar.y0, p.y);
  if (ix1 - ix0 > 0.5 && iz1 - iz0 > 0.5 && iy > 0.5) {
    const r = p.recorte;
    exigir(r && ix0 >= r.x0 - 0.5 && ix1 <= r.x1 + 0.5 && iz0 >= r.z0 - 0.5 && iz1 <= r.z1 + 0.5, `el cajón del gas, al sacarlo, choca con la pieza de la cama ${p.id} (${p.nombre})`);
  }
}
// Heladera visible: la puerta tiene color propio y abre la ficha del equipo
exigir(tra.some((p) => p.abre === 'nevera' && p.color), 'la puerta de la heladera debería tener color y abrir la heladera');
exigir(tra.some((p) => p.abre === 'garrafa'), 'falta el frente del cajón del gas');
// El cajón de bidones llega hasta el piso, queda bajo la cama y los frentes altos sobre ella
const frBid = tra.find((p) => p.nombre === 'Frente cajón de bidones');
exigir(frBid && frBid.y < 30, 'el frente de bidones debería llegar al piso');
// Sección eléctrica: todo al piso y bajo el plano de la cama; el tablero con interruptores y enchufes, sobre la cama
for (const id of ['bateria', 'inversor', 'dcdc', 'fusibles', 'fusiblePrincipal']) {
  const e = eqE(id);
  exigir(e.y < 60 && e.y + e.sy < cfgI.cama.plataforma - 20, `${id} debería ir al piso y bajo el plano de la cama`);
}
for (const id of ['panelSwitches', 'enchufe1', 'enchufe2']) {
  const e = eqE(id);
  exigir(e.y >= cfgI.cama.plataforma && e.x + e.sx <= xDiv1, `${id} debería estar en el tablero, sobre la cama y en la sección eléctrica`);
}
// La cama termina contra el frente de la L, y el cajón de cocina de la L queda sobre la cama
exigir(Math.abs(data.layout.cama.zCab - (vn.largo - cfgI.trasero.profundidadL)) < 0.5, 'la cama debería terminar contra el frente de la L del mueble trasero');
exigir(tra.find((p) => p.nombre === 'Frente cajón de cocina 1').y > cfgI.cama.plataforma, 'los cajones de cocina de la L deberían quedar sobre la cama');
// Cuatro tiras LED con el mismo inicio y fin (dos centrales junto a la claraboya, dos laterales cerca de las paredes) y extractor sin conexión
const tiras = ['ledA', 'ledB', 'ledC', 'ledD'].map((id) => e3.equipos.find((e) => e.id === id));
exigir(tiras.every(Boolean), 'faltan las cuatro tiras LED');
exigir(!e3.equipos.some((e) => e.id === 'ledE') && CONFIG_INICIAL.led.tiras === 4, 'debería haber exactamente cuatro tiras LED y ninguna central detrás del extractor');
exigir(tiras.every((t) => t.z === tiras[0].z && t.sz === tiras[0].sz && t.sz >= 1900), 'las cuatro tiras LED deberían empezar y terminar en el mismo lugar');
const [tA, tB, tC, tD] = tiras;
const cx = (t) => t.x + t.sx / 2;
exigir(cx(tA) < cx(tB) && cx(tC) < cx(tA) && cx(tD) > cx(tB), 'las laterales (3 y 4) deberían quedar fuera de las centrales (1 y 2), cerca de las paredes');
exigir(cx(tC) < 400 && CONFIG_INICIAL.van.ancho - cx(tD) < 400, 'las tiras laterales deberían quedar cerca de las paredes de la van');
exigir(!e3.cables.some((c) => c.desde === 'extractor' || c.hasta === 'extractor'), 'el extractor no debería tener cable');
const ex = e3.equipos.find((e) => e.id === 'extractor');
exigir(ex && ex.sx === 310 && ex.sz === 310, 'el extractor debería medir 310 x 310 mm con el marco');
// Las dos tiras centrales pasan por los costados de la claraboya, a 6 cm del marco o más, sin tocarla
exigir(Math.min(ex.x - (tA.x + tA.sx), tB.x - (ex.x + ex.sx)) >= 59, 'las tiras centrales deberían quedar a 6 cm o más del marco del extractor');
exigir(!tiras.some((t) => solapan(t, ex)), 'una tira LED toca el extractor');
exigir(ELECTRICA_INICIAL.switches.length === 5 && !ELECTRICA_INICIAL.switches.includes('Extractor'), 'el panel debería tener 5 interruptores sin el extractor');
exigir(/centrales/.test(ELECTRICA_INICIAL.switches[0]) && /laterales/.test(ELECTRICA_INICIAL.switches[1]) && /Lámpara/.test(ELECTRICA_INICIAL.switches[2]), 'los interruptores 1, 2 y 3 deberían ser luces centrales, laterales y lámpara');
exigir(e3.cables.some((c) => c.id === 'c_panel_ledC') && e3.cables.some((c) => c.id === 'c_panel_ledD') && !e3.cables.some((c) => /ledC.*centro/.test(c.nombre)), 'faltan los cables de las tiras laterales');
// Lámpara flexible: pared izquierda, sobre la viga de 22 cm, a la altura del pecho acostado; el cable va por el techo y baja por la viga
const lam = e3.equipos.find((e) => e.id === 'lampara');
const zViga0 = vn.archInicio + vn.archLargo;
exigir(lam && lam.x < 40, 'la lámpara debería estar pegada a la pared izquierda');
exigir(lam && lam.z >= zViga0 && lam.z + lam.sz <= zViga0 + vn.puertaLateral.vigas, 'la lámpara debería quedar sobre la viga de 22 cm entre el pasarruedas y la puerta');
exigir(lam && lam.y > cfgI.cama.plataforma + 100 && lam.y + lam.sy < cfgI.cama.plataforma + 400, 'la lámpara debería quedar a la altura del pecho de quien está acostado (sobre la cama)');
exigir(e3.escenario.some((q) => /Viga sin aislar \(izquierda\)/.test(q.nombre)), 'falta la viga izquierda en el escenario');
const cLam = e3.cables.find((c) => c.id === 'c_panel_lampara');
exigir(cLam && cLam.hasta === 'lampara' && cLam.puntos.some((p) => p[1] >= vn.alto - 20), 'el cable de la lámpara debería ir por el techo');
const ult = cLam.puntos.slice(-2);
exigir(ult[0][0] === ult[1][0] && ult[0][2] === ult[1][2] && ult[0][1] > ult[1][1] + 300, 'el cable de la lámpara debería bajar recto por la viga hasta la lámpara');
exigir(ult[1][2] >= zViga0 && ult[1][2] <= zViga0 + vn.puertaLateral.vigas, 'el cable de la lámpara debería bajar por la viga de 22 cm');
exigir(CARGAS_INICIALES.some((c) => c.id === 'lampara') && CARGAS_INICIALES.some((c) => c.id === 'ledD') && !CARGAS_INICIALES.some((c) => /centro/.test(c.nombre)), 'las cargas deberían tener las cuatro tiras y la lámpara, sin la tira central');
exigir(ele.caminos.some((c) => /lámpara/.test(c.nombre)) && ele.caminos.some((c) => /LED 4/.test(c.nombre)), 'faltan los caminos de la lámpara o de la tira 4');
// Botones push: uno por frente, sobre la cara del frente, sin pisar otras piezas
const cuentaB = {};
for (const b of data.botones) cuentaB[b.grupo] = (cuentaB[b.grupo] || 0) + 1;
exigir(cuentaB['Mueble trasero'] === 6 && cuentaB.Cama === 2 && cuentaB['Mueble derecho'] === 4, `cantidad de botones push inesperada: ${JSON.stringify(cuentaB)}`);
const botonesDeco = data.decos.filter((d) => d.forma === 'boton');
exigir(botonesDeco.length === data.botones.length, 'cada botón debería dibujarse en el 3D');
for (const b of data.botones) {
  const fr = data.partes.find((p) => p.grupo === b.grupo && p.nombre === b.nombre);
  exigir(fr, `el botón "${b.nombre}" no tiene un frente con ese nombre`);
  if (!fr) continue;
  const r = 14 + 5; // radio del botón y 5 mm de aire hasta el borde del frente
  if (b.eje[0] === 'z') {
    exigir(b.cx - r >= fr.x && b.cx + r <= fr.x + fr.sx && b.cy - r >= fr.y && b.cy + r <= fr.y + fr.sy, `el botón "${b.nombre}" se sale del frente`);
    exigir(Math.abs(b.cz - fr.z) < 0.5, `el botón "${b.nombre}" no está sobre la cara del frente`);
  } else {
    exigir(b.cz - r >= fr.z && b.cz + r <= fr.z + fr.sz && b.cy - r >= fr.y && b.cy + r <= fr.y + fr.sy, `el botón "${b.nombre}" se sale del frente`);
    exigir(Math.abs(b.cx - (b.eje[1] === '+' ? fr.x + fr.sx : fr.x)) < 0.5, `el botón "${b.nombre}" no está sobre la cara del frente`);
  }
}
for (const d of botonesDeco) {
  for (const p of data.partes) {
    if (p.nombre === d.nombre.replace('Botón push: ', '') && p.grupo === d.grupo) continue;
    exigir(!solapan(d, p), `el botón "${d.nombre}" pisa la pieza ${p.id} (${p.nombre})`);
  }
}
const filaBoton = compras.find((r) => /Cierre a botón/.test(r.item));
exigir(filaBoton && filaBoton.cantidad === data.botones.length && /2 pack/.test(filaBoton.nota), 'la lista de compras debería sumar los botones push y decir cuántos packs de 10');
exigir(!data.herrajes.some((h) => /Tirador embutido$/.test(h.nombre) || /Imán o cierre push/.test(h.nombre)), 'los tiradores y los imanes deberían haberse reemplazado por los botones push');
exigir(!CARGAS_INICIALES.some((c) => c.id === 'extractor'), 'el extractor no debería tener consumo');
// ---- Revisión eléctrica: protecciones y caídas de tensión ----
const AMP = { 0.75: 8, 1: 10, 1.5: 15, 2.5: 20, 4: 30, 6: 40, 10: 60, 16: 80, 25: 100, 35: 125, 50: 150, 70: 190, 95: 230 };
for (const t of ele.tramos.filter((q) => q.tipo !== 'senal')) {
  exigir(AMP[t.seccion] >= t.fusible, `el cable de ${t.nombre} (${t.seccion} mm2) no aguanta su protección de ${t.fusible} A`);
}
for (const c of ele.caminos) exigir(c.ok, `el camino "${c.nombre}" pasa la caída máxima (${c.caidaPct.toFixed(2)} %)`);
const tramoDe = (id) => ele.tramos.find((q) => q.id === id);
exigir(tramoDe('c_caja_nevera').fusible >= 2 * tramoDe('c_caja_nevera').amperes, 'el fusible de la heladera debería tolerar el arranque del compresor');
exigir(tramoDe('c_panel_bomba').fusible >= 2 * tramoDe('c_panel_bomba').amperes, 'el fusible de la bomba debería tolerar el arranque del motor');
exigir(tramoDe('c_largo').amperes > ELECTRICA_INICIAL.cargadorNominalA, 'la entrada del DC-DC debería calcularse con una corriente mayor que la de salida');
exigir(tramoDe('c_inv_ench1').fusible === 6, 'la línea de 230 V debería llevar un disyuntor de 6 A');
exigir(ele.filas.some((f) => f.id === 'inversorEspera'), 'falta el consumo propio del inversor');
exigir(compras.some((r) => /Interruptor diferencial/.test(r.item)), 'falta el diferencial de 230 V en la lista de compras');
exigir(!compras.some((r) => /Fusible 7\.5 A/.test(r.item) && /230/.test(r.nota)), 'la línea de 230 V no debería llevar fusible sino disyuntor');
// Gas
for (const id of ['anafe', 'garrafa', 'regulador', 'valvulaGas', 'detectorGas']) exigir(data.equipos.some((e) => e.id === id), `falta el equipo de gas ${id}`);
exigir(e3.mangueras.filter((m) => m.tipo === 'gas').length === 2, 'faltan las mangueras de gas');
// La bomba de agua sigue conectada
exigir(e3.cables.some((c) => c.hasta === 'bomba') && CARGAS_INICIALES.some((c) => c.id === 'bomba'), 'la bomba de 12 V debería estar conectada');

// ---- Modo pieza: contorno, descripción de cortes, cámara y cotas ----
const conContorno = data.partes.filter((p) => contorno(p));
exigir(conContorno.length === 9, `deberían tener contorno propio 9 piezas (2 placas, 2 bandejas, el frente del pie, 2 costados y 2 frentes de cajón), hay ${conContorno.length}`);
const cab = data.partes.find((p) => /^Placa de la cabecera/.test(p.nombre));
exigir(contorno(cab).esquinas === 5 && contorno(cab).recorte, 'la placa de la cabecera debería tener 5 esquinas redondeadas y un recorte');
const rcCab = data.layout.cama.recorte;
const medidaRecorte = `${Math.round(rcCab.x1 - rcCab.x0)} x ${Math.round(rcCab.z1 - rcCab.z0)}`;
exigir(describirPieza(cab, CONFIG_INICIAL).lineas.some((l) => l.texto.includes(medidaRecorte)), `la descripción de la cabecera debería decir el recorte de ${medidaRecorte}`);

// Cama como la del instructivo: placas con ranuras de esquinas redondeadas y costados con ventana (hueco del cajón)
const pie = data.partes.find((p) => /^Placa del pie/.test(p.nombre));
exigir(contorno(cab).huecos.length === 9 && contorno(pie).huecos.length === 4, 'las placas deberían llevar 9 y 4 ranuras');
exigir(contorno(cab).huecos.every((h) => h.tipo === 'ranura' && h.r === CONFIG_INICIAL.cama.ranura.radio), 'las ranuras de la placa deberían llevar esquinas redondeadas');
const rec = contorno(cab).recorte;
exigir(contorno(cab).huecos.every((h) => h.a1 <= rec.a0 - 49 || h.b1 <= rec.b0 + 0.5), 'las ranuras junto al recorte tienen que quedar antes de él');
const zAbs = (p, h) => [p.z + h.b0, p.z + h.b1].map((v) => Math.round(v * 10));
for (const b of data.partes.filter((p) => p.ext && p.radio)) {
  const placa = b.z + b.sz / 2 > cab.z ? cab : pie;
  const grilla = new Set(contorno(placa).huecos.map((h) => zAbs(placa, h).join()));
  exigir(b.huecos.length >= 4 && b.huecos.every((h) => grilla.has(zAbs(b, h).join())), `las ranuras de ${b.id} deberían quedar en línea con las de su placa`);
  exigir(b.huecos.every((h) => h.b0 >= 29.5 && b.sz - h.b1 >= 29.5), `las ranuras de ${b.id} dejan menos de 3 cm de madera junto a las correderas`);
}
const costados = data.partes.filter((p) => /^Costado del pasillo/.test(p.nombre));
exigir(costados.length === 2 && costados.every((p) => p.huecos.length === 1 && p.huecos[0].tipo === 'ventana'), 'cada módulo debería llevar un costado del pasillo con una ventana');
const yBandeja = Math.min(...data.partes.filter((p) => p.ext).map((p) => p.y));
exigir(costados.every((p) => p.y + p.sy <= yBandeja - 3), 'los costados del pasillo no pueden tapar la salida de las bandejas');
const frentesCajon = data.partes.filter((p) => /^Frente cajón de la cabecera|^Frente cajón del pie/.test(p.nombre));
exigir(frentesCajon.length === 2, 'faltan los frentes de los cajones de la cama');
for (const f of frentesCajon) {
  const cos = costados.find((p) => f.z >= p.z && f.z + f.sz <= p.z + p.sz);
  const v = cos && cos.huecos[0];
  exigir(v && f.y >= cos.y + v.a0 + 2.5 && f.y + f.sy <= cos.y + v.a1 - 2.5 && f.z >= cos.z + v.b0 + 2.5 && f.z + f.sz <= cos.z + v.b1 - 2.5, `${f.id} debería entrar en la ventana de su costado con 3 mm de luz`);
  exigir(Math.abs(contorno(f).radio - (v.r - 3)) < 0.01, `${f.id} debería llevar las esquinas del radio de la ventana menos la luz`);
}
exigir(data.partes.some((p) => /^Frente del pie/.test(p.nombre) && p.huecos && p.huecos.length === 1), 'el frente del pie debería llevar su ventana');
const refPiso = data.partes.filter((p) => /^Refuerzo de piso/.test(p.nombre));
exigir(refPiso.length === 4 && refPiso.every((p) => p.y === 0), 'deberían quedar 4 refuerzos de piso (2 por módulo)');
for (const p of data.partes) {
  for (const invertir of [false, true]) {
    const cam = posarCamara(p, { invertir });
    const an = anotarPieza(p, cam);
    const todo = JSON.stringify([cam.pos, cam.dist, an.cotas, an.arcos, an.marcas, an.radios]);
    exigir(!/null|NaN|Infinity/.test(todo), `el modo pieza arma mal las cotas de ${p.id}`);
    const d = [p.sx, p.sy, p.sz].sort((a, b) => b - a);
    const medidas = an.cotas.filter((c) => c.tipo === 'medida').map((c) => Math.round(c.valor * 10)).sort((a, b) => b - a);
    exigir(medidas.join() === d.map((v) => Math.round(v * 10)).join(), `las cotas de ${p.id} no coinciden con sus medidas (${medidas} contra ${d})`);
    exigir(cam.dist > 0 && Math.abs(Math.hypot(...cam.dir) - 1) < 1e-6, `la cámara del modo pieza de ${p.id} es inválida`);
  }
}
const sinContorno = data.partes.find((p) => !contorno(p));
exigir(describirPieza(sinContorno, CONFIG_INICIAL).lineas[0].tipo === 'recto', 'una pieza recta debería describirse con corte recto a 90 grados');

// ---- Disyuntores de 120 A y calefactor de la batería ----
{
  const cb1 = eqE('cortacircuitos1');
  const cb2 = eqE('cortacircuitos2');
  exigir(cb1 && cb2 && !solapan(cb1, cb2), 'faltan los dos disyuntores de 120 A o se pisan');
  exigir(cb1.y < 60 && cb2.y < 60 && cb1.x + cb1.sx <= xDiv1 && cb2.x + cb2.sx <= xDiv1, 'los disyuntores deberían ir al piso de la sección eléctrica');
  const unen = (id, a, b) => {
    const c = e3.cables.find((q) => q.id === id);
    return c && c.desde === a && c.hasta === b;
  };
  exigir(unen('c_dcdc_cb1', 'dcdc', 'cortacircuitos1') && unen('c_cb1_bat', 'cortacircuitos1', 'bateria'), 'el disyuntor 1 debería ir entre el DC-DC y la batería');
  exigir(unen('c_bat_cb2', 'bateria', 'cortacircuitos2') && unen('c_cb2_caja', 'cortacircuitos2', 'fusibles'), 'el disyuntor 2 debería ir entre la batería y la caja de fusibles');
  exigir(!e3.cables.some((c) => c.id === 'c_bat_caja' || c.id === 'c_dcdc_bat'), 'los cables viejos sin disyuntor no deberían quedar');
  // Calefactor: piso -> aislante -> almohadilla -> batería, con la almohadilla dentro de la huella de la batería
  const ais = eqE('aislante');
  const cal = eqE('calefactor');
  const ter = eqE('termostato');
  exigir(ais && cal && ter, 'faltan el aislante, la almohadilla o el termostato');
  exigir(Math.abs(cal.y - (ais.y + ais.sy)) < 0.5 && Math.abs(bat.y - (cal.y + cal.sy)) < 0.5, 'la batería debería apoyar sobre la almohadilla y esta sobre el aislante');
  exigir(cal.x >= bat.x && cal.x + cal.sx <= bat.x + bat.sx && cal.z >= bat.z && cal.z + cal.sz <= bat.z + bat.sz, 'la almohadilla debería quedar bajo la batería');
  exigir(ais.x <= bat.x && ais.x + ais.sx >= bat.x + bat.sx && ais.z <= bat.z && ais.z + ais.sz >= bat.z + bat.sz, 'el aislante debería cubrir toda la cara de abajo de la batería');
  exigir(ais.y < 60 && ter.y < 60, 'el aislante y el termostato deberían ir al piso');
  const sonda = e3.cables.find((c) => c.id === 'c_termo_sonda');
  exigir(sonda && sonda.tipo === 'senal' && sonda.hasta === 'bateria', 'la sonda del termostato debería llegar a la batería');
  const pSonda = sonda.puntos[sonda.puntos.length - 1];
  exigir(Math.abs(pSonda[2] - bat.z) <= 2 && pSonda[0] > cal.x && pSonda[0] < cal.x + cal.sx + 1, 'la sonda debería tocar la cara de la batería que mira al frente');
  exigir(unen('c_caja_calef', 'fusibles', 'termostato') && unen('c_termo_calef', 'termostato', 'calefactor'), 'el calefactor debería salir de la caja de fusibles por el termostato');
  exigir(compras.some((r) => /Fusible 5 A/.test(r.item)), 'falta el fusible de 5 A del calefactor en la lista de compras');
  exigir(compras.some((r) => /Disyuntor 120 A \(DC-DC/.test(r.item) && /Falta comprar/.test(r.nota)) && compras.some((r) => /Almohadilla calefactora/.test(r.item) && /Falta comprar/.test(r.nota)), 'los disyuntores y la almohadilla deberían figurar como pendientes de compra');
  exigir(tramoDe('c_caja_calef').fusible === 5 && tramoDe('c_termo_calef').sinFusible, 'el calefactor debería llevar un solo fusible de 5 A');
  exigir(ele.filas.some((f) => f.id === 'calefBateria') && ele.caminos.some((c) => /calefactor/.test(c.nombre)), 'faltan el consumo y el camino del calefactor');
  // Los bornes de la batería tienen que quedar bajo el estante con lugar para el cable
  exigir(L_E().yEstante - (bat.y + bat.sy) >= 55, 'la batería quedó demasiado cerca del estante para los cables de los bornes');
}
function L_E() {
  return disposicionTrasero(cfgI).E;
}

// ---- Mueble trasero: fondo en dos mitades, apoyos bajo las bases y delanteras de los cajones ----
{
  const L = disposicionTrasero(cfgI);
  const fondos = tra.filter((p) => /^Fondo /.test(p.nombre));
  exigir(fondos.length === 2 && Math.abs(fondos.reduce((s, p) => s + p.sx, 0) - (L.x1 - 2 * L.t)) < 0.5, 'las dos mitades del fondo deberían sumar el ancho interior del mueble');
  exigir(fondos.every((p) => Math.abs(p.z + p.sz - L.zB) < 0.5), 'el fondo debería apoyar contra el mamparo');
  const apoyos = tra.filter((p) => /^Apoyo bajo la base/.test(p.nombre));
  exigir(apoyos.length === 6 && apoyos.every((p) => p.y === 0 && Math.abs(p.sy - L.yBase) < 0.5), 'deberían ser 6 apoyos que llenan el hueco entre el piso y la base');
  const delanteras = tra.filter((p) => / - delantera$/.test(p.nombre));
  exigir(delanteras.length === 5, `cada cajón del mueble trasero debería tener su delantera, hay ${delanteras.length}`);
  for (const d of delanteras) {
    const nom = d.nombre.replace(/ - delantera$/, '');
    const lat = tra.find((p) => p.nombre === `${nom} - lateral`);
    exigir(lat && Math.abs(lat.z - (d.z + d.sz)) < 0.5, `la delantera de "${nom}" debería tocar el frente de sus laterales`);
    exigir(Math.abs(d.z - L.zIn) < 0.5, `la delantera de "${nom}" debería quedar pegada a la cara de atrás del marco`);
  }
  const der = data.partes.filter((p) => p.grupo === 'Mueble derecho');
  exigir(der.filter((p) => / - delantera$/.test(p.nombre)).length === 2, 'los dos cajones del mueble derecho deberían tener delantera');
}

// ---- Tutorial de armado ----
{
  const e3t = electrico3d(CONFIG_INICIAL);
  const tut = armarTutorial(data, plan, CONFIG_INICIAL, e3t);
  exigir(tut.muebles.length === 3, 'el tutorial debería tener un capítulo por mueble');
  for (const m of tut.muebles) {
    const vistas = new Set(m.pasos.flatMap((p) => p.piezas.map((x) => x.id)));
    const sin = data.partes.filter((p) => p.grupo === m.grupo && !vistas.has(p.id));
    exigir(sin.length === 0, `el tutorial de "${m.grupo}" no nombra estas piezas: ${sin.map((p) => p.id).join(', ')}`);
    exigir(m.pasos.every((p) => p.titulo && p.intro && p.hacer.length), `el tutorial de "${m.grupo}" tiene un paso sin texto`);
    exigir(new Set(m.pasos.map((p) => p.id)).size === m.pasos.length, `el tutorial de "${m.grupo}" repite el id de un paso`);
    exigir(m.lista.herrajes.length > 0 && m.esperar.length > 0, `el tutorial de "${m.grupo}" debería traer la lista de herrajes y lo que falta definir`);
    // Las piezas de cada paso tienen que ser reales y traer la hoja de la que salen
    for (const p of m.pasos) for (const x of p.piezas) exigir(data.partes.some((q) => q.id === x.id) && x.corte, `el paso ${p.id} nombra la pieza ${x.id} sin hoja de corte`);
  }
  const ag = agujerosDe(data, e3t).filter((a) => a.grupo === 'Mueble trasero');
  exigir(ag.length >= 8, `el tutorial debería listar los agujeros de los cables y mangueras, hay ${ag.length}`);
  const cal = caladosDe(data, e3t);
  for (const id of ['Heladera', 'Anafe', 'Fregadero']) exigir(cal.some((c) => c.aparato.startsWith(id)), `falta el calado de ${id} en el tutorial`);
}
// ---- Colores por rol y modo Abierto del 3D ----
{
  const rol = (id) => rolDe(data.partes.find((p) => p.id === id));
  const esperado = {
    'TRA-01': 'lateral', 'TRA-19': 'frente', 'TRA-37': 'interior', 'TRA-40': 'interior', 'TRA-57': 'interior', 'TRA-14': 'horizontal',
    'TRA-61': 'liston', 'CAM-01': 'horizontal', 'CAM-08': 'horizontal', 'CAM-14': 'frente', 'CAM-15': 'liston', 'DER-25': 'frente',
    'DER-02': 'lateral', 'DER-01': 'interior', 'DER-34': 'interior', 'DER-38': 'horizontal', 'DER-40': 'frente',
  };
  for (const [id, r] of Object.entries(esperado)) exigir(rol(id) === r, `${id} debería ser ${r} y es ${rol(id)}`);
  exigir(data.partes.every((p) => ROLES[rolDe(p)]), 'alguna pieza quedó sin rol de color');
  exigir(oscurecer('#ffffff', 0) === '#ffffff' && oscurecer('#ffffff', 1) === '#1d1259', 'oscurecer debería mezclar con el violeta de noche');

  const ab = planAbrir(data);
  const cajones = new Set(Object.values(ab.porParte).filter((m) => m.tipo === 'cajon'));
  const puertas = Object.entries(ab.porParte).filter(([, m]) => m.tipo === 'puerta');
  exigir(cajones.size === 9, `deberían abrirse 9 cajones y se abren ${cajones.size}`);
  exigir(puertas.length === 3, `deberían abrirse 3 puertas y se abren ${puertas.length}`);
  // Todos los cajones llevan su frente y su caja: el frente y la caja del gas son el mismo cajón
  exigir(llaveCajon('Frente cajón del gas') === llaveCajon('Cajón de la garrafa - lateral'), 'el frente del gas y la caja de la garrafa deberían ser el mismo cajón');
  for (const m of cajones) exigir(Math.abs(m.v[0]) + Math.abs(m.v[2]) > 0 && m.v[1] === 0, 'un cajón debería deslizar en horizontal');
  // Las bisagras están del lado contrario al botón: la de la batería queda en x = 32 (el botón está hacia x = 587)
  const bateria = ab.porParte['TRA-19'];
  exigir(bateria && Math.abs(bateria.pivote[0] - 32) < 1, 'la puerta de la batería debería girar sobre su borde izquierdo');
}
process.exit(fallos ? 1 : 0);
