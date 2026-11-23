// Verifica la secuencia del armado animado: node scripts/check-secuencia.mjs
// 1) cada madera de cada mueble llega una sola vez, 2) cada tornillo entra cuando sus dos maderas ya están,
// 3) no se pierde ninguna unión con tornillos, 4) cuántas maderas no tienen una vía libre (llegan por la unión igual).
import { CONFIG_INICIAL } from '../src/data/defaults.js';
import { construir } from '../src/engine/construir.js';
import { planificar } from '../src/engine/cortes.js';
import { electrico3d } from '../src/engine/electrico3d.js';
import { armarTutorial } from '../src/engine/tutorial.js';
import { armarSecuencia } from '../src/engine/secuencia.js';

let errores = 0;
const mal = (m) => {
  errores += 1;
  console.log('ERROR:', m);
};

const cfg = CONFIG_INICIAL;
const data = construir(cfg);
const plan = planificar(data.partes, cfg);
const tutorial = armarTutorial(data, plan, cfg, electrico3d(cfg));

for (const m of tutorial.muebles) {
  const seq = armarSecuencia(data, m);
  const esperadas = data.partes.filter((p) => p.grupo === m.grupo).map((p) => p.id);
  const llegan = seq.eventos.filter((e) => e.tipo === 'pieza').map((e) => e.id);
  for (const id of esperadas) if (!llegan.includes(id)) mal(`${m.grupo}: ${id} no figura en la secuencia`);
  const repetidas = llegan.filter((id, i) => llegan.indexOf(id) !== i);
  for (const id of repetidas) mal(`${m.grupo}: ${id} llega más de una vez`);

  const puestas = new Set();
  const cubiertas = new Set();
  let tAnterior = -1;
  for (const e of seq.eventos) {
    if (e.t0 < tAnterior) mal(`${m.grupo}: el evento de ${e.id} empieza antes que el anterior`);
    tAnterior = e.t0 + e.dur;
    if (e.tipo === 'pieza') {
      puestas.add(e.id);
      for (const c of e.con) if (!puestas.has(c)) mal(`${m.grupo}: ${e.id} dice apoyarse en ${c}, que todavía no está`);
    } else {
      for (const jid of e.juntas) {
        const j = data.juntas.find((x) => x.id === jid);
        if (!puestas.has(j.cara) || !puestas.has(j.canto)) mal(`${m.grupo}: la unión ${jid} entra antes de tener sus dos maderas`);
        cubiertas.add(jid);
      }
    }
  }
  const sinCubrir = data.juntas.filter((j) => j.grupo === m.grupo && (j.cantidad || 0) > 0 && !cubiertas.has(j.id));
  for (const j of sinCubrir) mal(`${m.grupo}: la unión ${j.id} (${j.cara} con ${j.canto}) no tiene su evento de tornillos`);

  // La cama: ningún larguero se arma en el aire (cuelga de la placa o se apoya en los postes) y las varillas van después de las placas
  if (m.grupo === 'Cama') {
    const nombres = new Map(data.partes.map((p) => [p.id, p.nombre]));
    for (const e of seq.eventos) {
      if (e.tipo === 'pieza' && e.modo === 'flota' && /^Larguero/.test(nombres.get(e.id))) mal(`${m.grupo}: ${e.id} (larguero) aparece flotando`);
    }
    const orden = m.pasos.map((p) => p.id);
    if (orden.indexOf('cam-8') < 0 || orden.indexOf('cam-6') < orden.indexOf('cam-8')) mal(`${m.grupo}: las varillas (cam-6) deberían ir después de las placas (cam-8): ${orden}`);
    if (orden.indexOf('cam-10') > orden.indexOf('cam-8')) mal(`${m.grupo}: llevar a la van (cam-10) debería ir antes de las placas (cam-8): ${orden}`);
  }

  const min = Math.floor(seq.duracion / 60);
  const seg = Math.round(seq.duracion % 60);
  console.log(
    `${m.grupo}: ${seq.piezas} maderas, ${seq.stats.tornillos} tornillos, ${seq.pasos.length} pasos, ${min} min ${seg} s a velocidad 1; ` +
      `${seq.stats.flotantes} aparecen flotando, ${seq.stats.bloqueadas} sin vía libre`
  );
}

console.log(errores ? `${errores} errores` : 'Secuencia bien');
process.exit(errores ? 1 : 0);
