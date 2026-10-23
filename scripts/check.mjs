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

// ---- Diseño: mueble trasero de 500 mm con una L de 670 mm a la izquierda (eléctrico), cocina con gas al centro, agua a la derecha ----
const cfgI = CONFIG_INICIAL;
const tra = data.partes.filter((p) => p.grupo === 'Mueble trasero');
exigir(cfgI.trasero.profundidad === 500, 'el mueble trasero debería tener 500 mm de profundidad');
exigir(cfgI.trasero.profundidadL === 670, 'la sección eléctrica (la L) debería tener 670 mm de profundidad');
// Medidas tomadas en la van: puerta lateral de 98 cm, vigas de 22 cm, pasarruedas de 80 x 42,5 x 18,5 cm
const vn = cfgI.van;
exigir(vn.puertaLateral.largo === 980 && vn.puertaLateral.vigas === 220, 'la puerta lateral debería medir 980 mm y las vigas 220 mm');
exigir(vn.archLargo === 800 && vn.archAlto === 425 && vn.archIntrusion === 185, 'el pasarruedas debería medir 800 x 425 x 185 mm');
exigir(vn.archInicio + vn.archLargo + vn.puertaLateral.vigas + vn.puertaLateral.largo + vn.puertaLateral.desdeMamparo === vn.largo, 'el pasarruedas, las vigas y la puerta no suman el largo útil de la van');
exigir(cfgI.cama.largo === 1700, 'la cama debería medir 170 cm de largo');
exigir(cfgI.cama.plataforma >= 430 && cfgI.cama.plataforma <= 440, 'la cama debería quedar apenas sobre el pasarruedas (43 a 44 cm)');
exigir(Math.abs(vn.largo - cfgI.cama.largo - cfgI.trasero.profundidadL) >= 0 && vn.largo - cfgI.cama.largo - cfgI.trasero.profundidadL < vn.archInicio, 'la cama más la L deberían terminar antes del pasarruedas');
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
exigir(cuentaB['Mueble trasero'] === 7 && cuentaB.Cama === 2 && cuentaB['Mueble derecho'] === 4, `cantidad de botones push inesperada: ${JSON.stringify(cuentaB)}`);
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
exigir(conContorno.length === 5, `deberían tener contorno propio 5 piezas (2 placas, 2 bandejas y el frente con arco), hay ${conContorno.length}`);
const cab = data.partes.find((p) => /^Placa de la cabecera/.test(p.nombre));
exigir(contorno(cab).esquinas === 5 && contorno(cab).recorte, 'la placa de la cabecera debería tener 5 esquinas redondeadas y un recorte');
exigir(describirPieza(cab, CONFIG_INICIAL).lineas.some((l) => /261 x 150/.test(l.texto)), 'la descripción de la cabecera debería decir el recorte de 261 x 150');
const frenteArco = data.partes.find((p) => /calar arco/.test(p.nombre));
exigir(frenteArco && contorno(frenteArco).arco && contorno(frenteArco).arco.r === 170, 'el frente con arco debería llevar el arco de R170');
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

process.exit(fallos ? 1 : 0);
