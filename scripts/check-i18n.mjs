// Verifica los diccionarios de idiomas: node scripts/check-i18n.mjs
// 1) en y sv tienen exactamente las claves de es (más el bloque elec), 2) los {{parametros}} coinciden,
// 3) lo eléctrico cubre todos los ids que arma el motor.
import es from '../src/i18n/es.js';
import en from '../src/i18n/en.js';
import sv from '../src/i18n/sv.js';
import { CONFIG_INICIAL, CARGAS_INICIALES, ELECTRICA_INICIAL } from '../src/data/defaults.js';
import { construir } from '../src/engine/construir.js';
import { calcularElectrica } from '../src/engine/electrica.js';
import { electrico3d } from '../src/engine/electrico3d.js';
import { ELEMENTOS, BUSQUEDA_CABLES } from '../src/data/elementos.js';

let errores = 0;
const mal = (m) => {
  errores += 1;
  console.log('ERROR:', m);
};

// Todas las hojas de un diccionario como ruta -> texto. Las claves de plural (_one/_other) cuentan como claves propias.
function hojas(obj, ruta = '', salida = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const r = ruta ? `${ruta}.${k}` : k;
    if (Array.isArray(v)) v.forEach((x, i) => (salida[`${r}.${i}`] = x));
    else if (v && typeof v === 'object') hojas(v, r, salida);
    else salida[r] = v;
  }
  return salida;
}

const params = (t) => [...String(t).matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort().join(',');

const base = hojas(es);
for (const [nombre, dic] of [['en', en], ['sv', sv]]) {
  const { elec, ...resto } = dic;
  const h = hojas(resto);
  for (const k of Object.keys(base)) if (!(k in h)) mal(`${nombre}: falta ${k}`);
  for (const k of Object.keys(h)) if (!(k in base)) mal(`${nombre}: sobra ${k}`);
  for (const k of Object.keys(base)) {
    if (k in h && params(base[k]) !== params(h[k])) mal(`${nombre}: parámetros distintos en ${k} (${params(base[k])} / ${params(h[k])})`);
    if (k in h && !String(h[k]).trim()) mal(`${nombre}: vacío ${k}`);
  }

  // Lo eléctrico, el agua y el gas
  const data = construir(CONFIG_INICIAL);
  const e3 = electrico3d(CONFIG_INICIAL);
  const res = calcularElectrica(CARGAS_INICIALES, ELECTRICA_INICIAL, e3.cables);
  const necesita = (clave, ok) => {
    if (!ok) mal(`${nombre}: falta elec.${clave}`);
  };
  const tiene = (ruta) => ruta.split('.').reduce((o, k) => (o == null ? o : o[k]), elec) != null;
  for (const e of [...data.equipos, ...e3.equipos]) {
    necesita(`equipos.${e.id}.nombre`, tiene(`equipos.${e.id}.nombre`));
    necesita(`equipos.${e.id}.nota`, tiene(`equipos.${e.id}.nota`));
    if (e.estado) necesita(`equipos.${e.id}.estado`, tiene(`equipos.${e.id}.estado`));
  }
  for (const c of [...e3.cables, ...e3.mangueras]) {
    necesita(`cables.${c.id}.nombre`, tiene(`cables.${c.id}.nombre`));
    necesita(`cables.${c.id}.nota`, tiene(`cables.${c.id}.nota`));
  }
  for (const o of [...e3.escenario, ...(e3.decos || []), ...(e3.decosElec || [])]) {
    if (o.clave) necesita(`escena.${o.clave}`, tiene(`escena.${o.clave}`));
  }
  for (const c of CARGAS_INICIALES) necesita(`cargas.${c.id}`, tiene(`cargas.${c.id}`));
  for (const f of res.filas) necesita(`cargas.${f.id}`, tiene(`cargas.${f.id}`));
  for (const c of res.caminos) necesita(`caminos.${c.id}`, tiene(`caminos.${c.id}`));
  for (const c of res.cableCompras) necesita(`compra.${c.tipo}`, tiene(`compra.${c.tipo}`));
  for (const a of res.avisosT) necesita(`avisos.${a.clave}`, tiene(`avisos.${a.clave}`));
  for (const k of ['autonomia', 'cargadorSupera', 'caminoPasa']) necesita(`avisos.${k}`, tiene(`avisos.${k}`));
  for (const id of Object.keys(ELEMENTOS)) {
    for (const campo of ['descripcion', 'ubicacion', 'busqueda']) necesita(`info.${id}.${campo}`, tiene(`info.${id}.${campo}`));
    const orig = ELEMENTOS[id].consejos || [];
    const tr = (elec.info[id] || {}).consejos || [];
    if (orig.length !== tr.length) mal(`${nombre}: elec.info.${id}.consejos tiene ${tr.length} y el original ${orig.length}`);
  }
  for (const k of Object.keys(BUSQUEDA_CABLES)) necesita(`busquedaCable.${k}`, tiene(`busquedaCable.${k}`));
  for (const k of ['caida', 'corriente', 'minima', 'acumulada']) necesita(`limite.${k}`, tiene(`limite.${k}`));
  for (let i = 0; i < 5; i += 1) necesita(`switches.${i}`, tiene(`switches.${i}`));

  // Los parámetros de lo eléctrico: solo los que el motor entrega
  const permitidos = { m: 1, hueco: 1, marco: 1, sec: 1, amp: 1, v: 1, ah: 1, nominal: 1, vCarga: 1, vEntrada: 1, ef: 1 };
  for (const [k, v] of Object.entries(hojas(elec))) {
    for (const p of params(v).split(',').filter(Boolean)) if (!permitidos[p]) mal(`${nombre}: parámetro desconocido {{${p}}} en elec.${k}`);
  }
}

console.log(errores ? `${errores} problemas` : 'Idiomas: todo coincide');
process.exit(errores ? 1 : 0);
