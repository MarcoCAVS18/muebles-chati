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
// La cama extendida: las varillas móviles (una por placa) tienen que existir y moverse hasta 1200 mm de ancho
const varillasM = data.partes.filter((p) => p.ext && p.perfil && p.salidaDe);
exigir(varillasM.length === 2, 'faltan los dos juegos de varillas móviles');
const xMax = Math.max(...varillasM.map((p) => p.x + p.sx + CONFIG_INICIAL.cama.extension));
exigir(xMax - CONFIG_INICIAL.cama.x0 >= 1200 - 1, 'la cama extendida no llega a 120 cm');
exigir(data.partes.filter((p) => p.perfil).length === 4, 'faltan los contornos de las placas y de las varillas');
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
exigir(cfgI.cama.plataforma === vn.archAltoIzq + cfgI.cama.fieltro + 15, 'la placa de la cama (15 mm) debería apoyar sobre el pasarruedas izquierdo con su fieltro de 5 mm: cama a 40 cm');
exigir(cfgI.cama.plataforma === 400 && data.layout.cama.yB === 385 && data.layout.cama.yT === 400, 'la superficie de la cama debería estar a 400 mm y el panel central a 385 mm');
exigir(cfgI.cama.ancho === 710 && cfgI.cama.ancho + cfgI.cama.extension === 1200, 'la cama debería medir 71 cm cerrada y 120 cm abierta');
exigir(cfgI.cama.varillasPie === 4 && cfgI.cama.varillasCabecera === 8, 'la cama debería llevar 4 varillas en el módulo del pie y 8 en el de la cabecera');
{
  // Las dos placas y sus dos módulos llenan los 180 cm, del mamparo de la cama a la L del mueble trasero
  const camaP = data.partes.filter((q) => q.grupo === 'Cama');
  const zMin = Math.min(...camaP.map((q) => q.z));
  const zMaxC = Math.max(...camaP.map((q) => q.z + q.sz));
  exigir(Math.abs(zMaxC - data.layout.cama.zCab) < 0.5 && Math.abs(zMin - data.layout.cama.zPie) < 0.5 && zMaxC - zMin === cfgI.cama.largo, 'la cama debería ocupar los 180 cm completos');
  const pl = data.partes.filter((q) => /^Placa de/.test(q.nombre));
  exigir(pl.length === 2 && pl.every((q) => q.sx === cfgI.cama.ancho) && pl.every((q) => !q.recorte), 'las dos placas deberían medir lo mismo de ancho y no llevar recortes');
  const guia = data.partes.find((q) => /^Guía de la cabecera/.test(q.nombre));
  const frP = data.partes.find((q) => /^Frente del pie/.test(q.nombre));
  const pan = data.partes.find((q) => /^Panel central/.test(q.nombre));
  exigir(guia && frP && guia.sy === 400 && frP.sy === 400 && pan && pan.sy === 385, 'el frente del pie y la guía deberían medir 400 mm y el panel central 385 mm');
  const luzPlacas = pl.map((q) => q.z).sort((a, b) => a - b);
  exigir(Math.abs(luzPlacas[1] - (luzPlacas[0] + pl.find((q) => q.z === luzPlacas[0]).sz) - 3) < 0.01, 'las dos placas deberían dejar 3 mm de luz entre sí');
  // Las varillas salen de las ranuras de su placa (4 y 8) con 2 mm de luz y no se cuentan como hoja aparte
  for (const v of varillasM) {
    const placa = data.partes.find((q) => q.id === v.salidaDe);
    exigir(placa && placa.perfil.n === v.perfil.n && v.perfil.n === (/cabecera/.test(placa.nombre) ? 8 : 4), `las varillas ${v.id} deberían tener tantas varillas como ranuras tiene su placa`);
    exigir(Math.abs(v.perfil.anchoVarilla - (v.perfil.ancho - 2 * cfgI.cama.luzVarilla)) < 1e-6, `las varillas ${v.id} deberían entrar con la luz pedida`);
  }
}
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
  // La garrafa baja por el círculo del asiento de la base de la cocina (se revisa más abajo que entre en el círculo)
  for (const p of tra) if (!(e.id === 'garrafa' && p.nombre === 'Base (cocina y agua)')) exigir(!solapan(e, p), `el equipo ${e.id} atraviesa la pieza ${p.id} (${p.nombre})`);
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
// Garrafa FIJA en su compartimento: la puerta con la bisagra a la derecha empieza después del borde de la cama, la base
// lleva un círculo de asiento y nada de la cama se cruza con el barrido de la puerta.
const dispo = disposicionTrasero(cfgI);
const Kd = dispo.K;
exigir(Kd.puerta.x0 >= data.layout.cama.x1 + 4 - 0.01, 'la puerta de la garrafa debería empezar después del borde de la cama (con 4 mm de aire)');
exigir(Kd.puerta.x1 <= Kd.puerta.x0 + 260 && Kd.puerta.x1 - Kd.puerta.x0 >= data.equipos.find((e) => e.id === 'garrafa').sx + 5, 'el hueco de la puerta debería dejar pasar la garrafa');
{
  const g = data.equipos.find((e) => e.id === 'garrafa');
  const baseK = tra.find((p) => p.nombre === 'Base (cocina y agua)');
  const asi = (baseK.huecos || []).find((h) => h.tipo === 'asiento');
  exigir(asi, 'la base de la cocina debería llevar el círculo de asiento de la garrafa');
  exigir(Math.abs((asi.a1 - asi.a0) / 2 - Kd.asiento.r) < 0.01 && asi.r === (asi.a1 - asi.a0) / 2, 'el asiento de la garrafa debería ser un círculo');
  exigir(Math.max(g.sx, g.sz) <= 2 * Kd.asiento.r - 10 + 0.01, 'la garrafa tiene que entrar en el círculo del asiento');
  exigir(Math.abs(g.x + g.sx / 2 - Kd.asiento.cx) < 0.5 && Math.abs(g.z + g.sz / 2 - Kd.asiento.cz) < 0.5, 'la garrafa debería estar centrada en su asiento');
  const reg = data.equipos.find((e) => e.id === 'regulador');
  exigir(reg.y >= g.y + g.sy - 0.5 && reg.y + reg.sy <= Kd.yEstante + 0.5, 'el regulador debería ir sobre la garrafa y bajo el estante');
  const puerta = tra.find((p) => /^Puerta de la garrafa/.test(p.nombre));
  exigir(puerta && puerta.abre === 'garrafa' && Math.abs(puerta.x - (Kd.puerta.x0 + 2)) < 0.01, 'falta la puerta de la garrafa o está mal ubicada');
  exigir(puerta.y + puerta.sy <= Kd.yEstante, 'la puerta de la garrafa no puede pasar del estante');
  exigir(!tra.some((p) => /Cajón de la garrafa|cajón del gas/i.test(p.nombre)), 'ya no debería haber un cajón de la garrafa');
}
// Compartimento eléctrico: se entra por una puerta en el costado izquierdo (la que se ve al abrir la puerta corrediza), no por debajo de la cama
{
  const cI = tra.find((p) => p.nombre === 'Costado izquierdo');
  const hp = (cI.huecos || []).find((h) => h.tipo === 'puerta');
  exigir(hp, 'el costado izquierdo debería llevar el calado de la puerta lateral');
  const pl = tra.find((p) => /^Puerta lateral/.test(p.nombre));
  exigir(pl && pl.abre === 'bateria' && pl.x === 0, 'falta la puerta lateral del compartimento eléctrico o no está contra la pared');
  exigir(pl.z >= cI.z + hp.b0 && pl.z + pl.sz <= cI.z + hp.b1 && pl.y >= cI.y + hp.a0 && pl.y + pl.sy <= cI.y + hp.a1, 'la puerta lateral debería entrar en su calado');
  exigir(pl.z >= vn.largo - cfgI.trasero.profundidadL - 1 && pl.z + pl.sz <= vn.largo, 'la puerta lateral debería quedar a la altura del compartimento eléctrico');
  exigir(!tra.some((p) => /^Puerta de la batería/.test(p.nombre)), 'la puerta de la batería por debajo de la cama ya no existe');
  exigir(tra.some((p) => /^Frente fijo del eléctrico/.test(p.nombre)), 'falta el frente fijo del eléctrico');
}
// Heladera visible: la puerta tiene color propio y abre la ficha del equipo
exigir(tra.some((p) => p.abre === 'nevera' && p.color), 'la puerta de la heladera debería tener color y abrir la heladera');
exigir(tra.some((p) => p.abre === 'garrafa'), 'falta la puerta de la garrafa');
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
exigir(cuentaB['Mueble trasero'] === 6 && cuentaB.Cama === 3 && cuentaB['Mueble derecho'] === 4, `cantidad de botones push inesperada: ${JSON.stringify(cuentaB)}`);
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
    if (p.silueta && p.silueta.tipo === 'portal') {
      // El botón de la puerta de la cama queda dentro del calado del portal que tiene delante, sin tocar sus patas ni su travesaño
      if (!solapan(d, p)) continue;
      const s = p.silueta;
      exigir(d.z >= p.z + s.n0 && d.z + d.sz <= p.z + s.n1 && d.y >= p.y && d.y + d.sy <= p.y + s.a1, `el botón "${d.nombre}" debería entrar en el calado del portal ${p.id}`);
      continue;
    }
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
exigir(conContorno.length === 14, `deberían tener contorno propio 14 piezas (2 placas, 2 juegos de varillas, el frente del pie con su puerta, 2 costados fijos, 2 portales, 2 puertas de los módulos, el costado izquierdo con su puerta y la base de la cocina con su asiento), hay ${conContorno.length}`);
const cab = data.partes.find((p) => /^Placa de la cabecera/.test(p.nombre));
const pie = data.partes.find((p) => /^Placa del pie/.test(p.nombre));
exigir(contorno(cab).esquinas === 4 && contorno(cab).peine && !contorno(cab).recorte, 'la placa de la cabecera debería ser un peine de 4 esquinas redondeadas, sin recorte');
exigir(!contorno(cab).huecos || contorno(cab).huecos.length === 0, 'las ranuras del peine son parte del contorno, no huecos');
exigir(describirPieza(cab, CONFIG_INICIAL).lineas.some((l) => /ranuras/.test(l.texto)), 'la descripción de la placa debería hablar de las ranuras');

// Cama en peine: las ranuras son abiertas hacia el pasillo, las varillas entran en ellas con la luz pedida
{
  const cm = CONFIG_INICIAL.cama;
  const cmds = (p) => contorno(p).cmds;
  // Todos los contornos cierran sobre sí mismos y no tienen coordenadas inválidas
  for (const p of [cab, pie, ...varillasM]) {
    const c = cmds(p);
    exigir(c[0].t === 'M' && c.every((k) => Object.values(k).every((v) => typeof v !== 'number' || Number.isFinite(v))), `el contorno de ${p.id} tiene valores inválidos`);
    const dentro = c.filter((k) => k.t !== 'A').every((k) => k.u >= -0.01 && k.u <= p.sx + 0.01 && -k.v >= -0.01 && -k.v <= p.sz + 0.01);
    exigir(dentro, `el contorno de ${p.id} se sale de su caja`);
  }
  // La cantidad de varillas sale de la configuración y las esquinas del pasillo son R50
  exigir(cab.perfil.n === cm.varillasCabecera && pie.perfil.n === cm.varillasPie, 'la cantidad de ranuras debería coincidir con la configuración');
  exigir(contorno(cab).radio === cm.radio, 'las esquinas del pasillo de la placa deberían ser R50');
  // Ancho de dedo igual al de la ranura (proporción 1) y varilla = ranura menos las dos luces
  exigir(Math.abs(cab.perfil.costilla - cab.perfil.ancho * cm.ranura.dedo) < 1e-6, 'el dedo fijo debería medir lo que la ranura por la proporción pedida');
  // Las varillas, abiertas, quedan intercaladas con los dedos: ninguna varilla pisa un dedo
  for (const v of varillasM) {
    const placa = data.partes.find((q) => q.id === v.salidaDe);
    const pf = placa.perfil;
    for (const z0 of pf.ranuras) {
      const a = z0 + pf.luz;
      const b = z0 + pf.ancho - pf.luz;
      exigir(a >= placa.z - 0.01 && b <= placa.z + placa.sz + 0.01, `una varilla de ${v.id} se sale de su placa`);
      exigir(v.z <= a + 0.01 && v.z + v.sz >= b - 0.01, `la caja de ${v.id} no cubre sus varillas`);
    }
    exigir(v.y === data.layout.cama.yB && v.sy === 15, `las varillas ${v.id} deberían ir a la altura de la placa y mismo espesor`);
  }
}
const costados = data.partes.filter((p) => /^Costado del pasillo/.test(p.nombre));
exigir(costados.length === 2 && costados.every((p) => !p.silueta && p.huecos.length === 1 && p.huecos[0].tipo === 'ventana'), 'cada módulo debería llevar un costado fijo del pasillo, un marco cerrado con una ventana');
// Los costados del pasillo son FIJOS (CAM-04 y CAM-05): quedan un poco sobre el piso y llegan hasta debajo de los listones de las correderas,
// que pasan por encima con 5 mm de luz. El portal que sale con las varillas va por afuera de cada uno
const lay = data.layout.cama;
exigir(costados.every((p) => !p.ext && p.y > 0 && p.y <= 10 && Math.abs(p.y + p.sy - lay.yCostado) < 0.01 && Math.abs(p.x - (lay.x1 - p.sx)) < 0.01), 'los costados del pasillo deberían quedar fijos, sobre el piso y bajo los listones de las correderas');
const listonesCorr = data.partes.filter((p) => /^Listón de la corredera/.test(p.nombre));
const portales = data.partes.filter((p) => /^Portal del pasillo/.test(p.nombre));
exigir(portales.length === 2 && portales.every((p) => p.ext && p.silueta && p.silueta.tipo === 'portal'), 'cada módulo debería llevar un portal en U invertida que sale con las varillas');
for (const po of portales) {
  const cos = costados.find((q) => Math.abs(q.z - po.z) < 0.01 && Math.abs(q.sz - po.sz) < 0.01);
  exigir(cos && Math.abs(po.x - (cos.x + cos.sx)) < 0.01, `el portal ${po.id} debería ir pegado por afuera del costado fijo`);
  exigir(Math.abs(po.y + po.sy - lay.yT) < 0.01 && po.y > 0 && po.y <= 10, `el portal ${po.id} debería llegar a la cara de arriba de la cama (a ras de las varillas) y no tocar el piso`);
  const vc = cos && cos.huecos[0];
  exigir(vc && Math.abs(po.silueta.n0 - vc.b0) < 0.01 && Math.abs(po.silueta.n1 - vc.b1) < 0.01 && Math.abs(po.y + po.silueta.a1 - (cos.y + vc.a1)) < 0.01, `el calado del portal ${po.id} debería coincidir con la ventana del costado fijo`);
  exigir(po.y + po.sy - (cos.y + cos.sy) >= 40, `el travesaño del portal ${po.id} debería tapar la franja entre el costado fijo y la placa`);
  // Los listones de las correderas terminan contra una pata del portal (por dentro) y pasan sobre el costado fijo
  for (const l of listonesCorr.filter((q) => q.z >= po.z && q.z + q.sz <= po.z + po.sz)) {
    const enPata = (l.z >= po.z && l.z + l.sz <= po.z + po.silueta.n0) || (l.z >= po.z + po.silueta.n1 && l.z + l.sz <= po.z + po.sz);
    exigir(enPata && Math.abs(l.x + l.sx - po.x) < 0.01, `el listón ${l.id} debería terminar contra una pata del portal ${po.id}`);
    exigir(l.y - (cos.y + cos.sy) >= 5 - 1e-6, `el listón ${l.id} debería pasar al menos 5 mm por encima del costado fijo`);
  }
}
exigir(Math.abs(Math.max(...portales.map((q) => q.x + q.sx)) - (lay.x1 + portales[0].sx)) < 0.01, 'el portal debería sumar su espesor al ancho de la cama cerrada');
exigir(listonesCorr.length === 4 && listonesCorr.every((p) => p.ext), 'los 4 listones de las correderas deberían salir con las varillas');
exigir(lay.yPan === lay.yB, 'la cara de abajo de la placa debería quedar a 385 mm');
const frentesCajon = data.partes.filter((p) => p.grupo === 'Cama' && /^Puerta del módulo/.test(p.nombre));
exigir(frentesCajon.length === 2, 'faltan las puertas de los módulos de la cama');
exigir(!data.partes.some((p) => p.grupo === 'Cama' && /cajón|Cajón/.test(p.nombre)), 'la cama ya no lleva cajones');
// Las puertas quedan fijas en la caja (no salen con la extensión), bajan sobre su borde de abajo y las bisagras van a un listón fijo pegado al costado cerrado
exigir(frentesCajon.every((p) => !p.ext && p.bisagraAbajo), 'las puertas de la cama deberían quedar fijas en la caja y bajar sobre su borde de abajo');
{
  const lb = data.partes.filter((p) => /^Listón de las bisagras/.test(p.nombre));
  exigir(lb.length === 2 && lb.every((p) => !p.ext && Math.abs(p.x + p.sx - costados[0].x) < 0.01), 'los listones de las bisagras deberían quedar fijos contra la cara de adentro del costado cerrado');
  for (const f of frentesCajon) {
    const l = lb.find((q) => q.z <= f.z + 3 && q.z + q.sz >= f.z + f.sz - 3);
    exigir(l && l.y + l.sy <= f.y && f.y - (l.y + l.sy) <= 5, `${f.id} debería tener su listón de bisagras justo bajo el borde de abajo`);
    exigir((f.huecos || []).length === 1 && f.huecos[0].tipo === 'agarradera', `${f.id} debería llevar su agarradera`);
  }
  const bisag = data.herrajes.find((h) => h.grupo === 'Cama' && /Bisagra de cazoleta/.test(h.nombre));
  exigir(bisag && bisag.cantidad === 7, 'la cama debería llevar 7 bisagras de cazoleta (3 en la cabecera, 2 en el pie y 2 en la puerta del frente del pie)');
  exigir(!data.herrajes.some((h) => h.grupo === 'Cama' && /corredera/i.test(h.nombre) && /cajón|Cajón/.test(h.nota || '')), 'no deberían quedar correderas de cajón en la cama');
  exigir(data.botones.filter((b) => b.grupo === 'Cama').length === 3 && data.decos.filter((d) => d.forma === 'boton' && d.grupo === 'Cama').every((d) => !d.ext), 'los 3 botones de las puertas de la cama deberían quedar fijos en la caja');
}
for (const f of frentesCajon) {
  const cos = costados.find((p) => f.z >= p.z && f.z + f.sz <= p.z + p.sz);
  const v = cos && cos.huecos[0];
  exigir(v && Math.abs(f.x - cos.x) < 0.01 && f.y >= cos.y + v.a0 + 2.5 && f.y + f.sy <= cos.y + v.a1 - 2.5 && f.z >= cos.z + v.b0 + 2.5 && f.z + f.sz <= cos.z + v.b1 - 2.5, `${f.id} debería entrar en la ventana de su costado con 3 mm de luz`);
  exigir(Math.abs(contorno(f).radio - (v.r - 3)) < 0.01, `${f.id} debería llevar las esquinas del radio de la ventana menos la luz`);
  // Cerrada, la puerta sale por el calado del portal que tiene delante
  const po = portales.find((q) => Math.abs(q.z - cos.z) < 0.01);
  exigir(po && f.z >= po.z + po.silueta.n0 && f.z + f.sz <= po.z + po.silueta.n1 && f.y >= po.y && f.y + f.sy <= po.y + po.silueta.a1, `${f.id} debería pasar por el calado del portal al abrir`);
}
const frentePie = data.partes.find((p) => /^Frente del pie/.test(p.nombre));
exigir(frentePie && frentePie.huecos && frentePie.huecos.length === 1, 'el frente del pie debería llevar su ventana');
// La puerta del frente del pie entra en su ventana con 3 mm de luz y apoya sobre el refuerzo de piso (sus bisagras van ahí)
{
  const pf = data.partes.find((p) => /^Puerta del frente del pie/.test(p.nombre));
  const v = frentePie.huecos[0];
  exigir(pf && pf.bisagraAbajo && !pf.ext, 'la puerta del frente del pie debería ser fija y bajar sobre su borde de abajo');
  exigir(pf && pf.x >= frentePie.x + v.a0 + 2.5 && pf.x + pf.sx <= frentePie.x + v.a1 - 2.5 && pf.y >= frentePie.y + v.b0 + 2.5 && pf.y + pf.sy <= frentePie.y + v.b1 - 2.5, 'la puerta del frente del pie debería entrar en su ventana con 3 mm de luz');
  const refF = data.partes.find((p) => /^Refuerzo de piso del módulo del pie \(frente\)/.test(p.nombre));
  exigir(refF && Math.abs(refF.y + refF.sy - pf.y) < 0.01 && pf.x >= refF.x && pf.x + pf.sx <= refF.x + refF.sx, 'la puerta del frente del pie debería apoyar su borde de abajo sobre el refuerzo de piso');
  exigir((pf.huecos || []).length === 1 && pf.huecos[0].tipo === 'agarradera', 'la puerta del frente del pie debería llevar su agarradera');
}
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
  exigir(delanteras.length === 4, `cada cajón del mueble trasero debería tener su delantera, hay ${delanteras.length}`);
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
    'TRA-01': 'lateral', 'TRA-19': 'frente', 'TRA-25': 'frente', 'TRA-66': 'frente', 'TRA-39': 'interior', 'TRA-40': 'interior', 'TRA-57': 'liston', 'TRA-14': 'horizontal',
    'TRA-61': 'liston', 'CAM-01': 'horizontal', 'CAM-08': 'horizontal', 'CAM-10': 'frente', 'CAM-11': 'liston', 'CAM-25': 'liston', 'CAM-29': 'liston', 'DER-25': 'frente',
    'DER-02': 'lateral', 'DER-01': 'interior', 'DER-34': 'interior', 'DER-38': 'horizontal', 'DER-40': 'frente',
  };
  for (const [id, r] of Object.entries(esperado)) exigir(rol(id) === r, `${id} debería ser ${r} y es ${rol(id)}`);
  exigir(data.partes.every((p) => ROLES[rolDe(p)]), 'alguna pieza quedó sin rol de color');
  exigir(oscurecer('#ffffff', 0) === '#ffffff' && oscurecer('#ffffff', 1) === '#1d1259', 'oscurecer debería mezclar con el violeta de noche');

  const ab = planAbrir(data);
  const cajones = new Set(Object.values(ab.porParte).filter((m) => m.tipo === 'cajon'));
  const puertas = Object.entries(ab.porParte).filter(([, m]) => m.tipo === 'puerta');
  exigir(cajones.size === 6, `deberían abrirse 6 cajones y se abren ${cajones.size}`);
  exigir(puertas.length === 4, `deberían abrirse 4 puertas y se abren ${puertas.length}`);
  const tapas = Object.entries(ab.porParte).filter(([, m]) => m.tipo === 'tapa' || m.tipo === 'tapaX');
  exigir(tapas.length === 3 && tapas.every(([, m]) => Math.abs(Math.abs(m.giro) - Math.PI / 2) < 1e-6), 'las tres puertas de la cama deberían bajar 90 grados sobre su borde de abajo');
  exigir(tapas.filter(([, m]) => m.tipo === 'tapa').length === 2 && tapas.filter(([, m]) => m.tipo === 'tapaX').length === 1, 'dos puertas bajan hacia el pasillo (eje en z) y la del frente del pie hacia la puerta trasera (eje en x)');
  // Las puertas de los costados giran sobre su borde de abajo, por la cara de afuera: la esquina de abajo no baja y no roza el zócalo
  const pCab = data.partes.find((q) => q.id === 'CAM-10');
  exigir(Math.abs(ab.porParte['CAM-10'].pivote[0] - (pCab.x + pCab.sx)) < 0.01 && Math.abs(ab.porParte['CAM-10'].pivote[1] - pCab.y) < 0.01, 'la puerta del costado debería girar sobre su borde de abajo, por la cara de afuera');
  const tapaPie = ab.porParte['CAM-14'];
  exigir(tapaPie && tapaPie.tipo === 'tapaX' && Math.abs(tapaPie.pivote[0] - 45) < 0.01, 'la puerta del frente del pie debería girar sobre su borde de abajo (a 45 mm del piso)');
  // Todos los cajones llevan su frente y su caja: el frente y los laterales de cada cajón son el mismo cajón
  exigir(llaveCajon('Frente cajón de cocina 1') === llaveCajon('Cajón de cocina 1 - lateral'), 'el frente de un cajón y su caja deberían ser el mismo cajón');
  for (const m of cajones) exigir(Math.abs(m.v[0]) + Math.abs(m.v[2]) > 0 && m.v[1] === 0, 'un cajón debería deslizar en horizontal');
  // Las bisagras están del lado contrario al botón. La puerta de la garrafa gira sobre su borde derecho (hueco 724 a 965)
  const garrafaP = ab.porParte['TRA-25'];
  exigir(garrafaP && Math.abs(garrafaP.pivote[0] - 963) < 1.5, 'la puerta de la garrafa debería girar sobre su borde derecho');
  // La puerta lateral gira sobre el borde del lado del mamparo y se abre hacia el pasillo de la van
  const lateralP = ab.porParte['TRA-66'];
  const lat = data.partes.find((q) => q.id === 'TRA-66');
  exigir(lateralP && Math.abs(lateralP.pivote[1] - (lat.z + lat.sz)) < 3, 'la puerta lateral debería girar sobre su borde del lado del mamparo');
}
process.exit(fallos ? 1 : 0);
