import React from 'react';
import { pasosDeCorte } from '../engine/packer.js';
import { useDobleToque, TACTIL } from '../util/pantalla.js';

const n0 = (v) => Math.round(v);

export function descargar(nombre, texto, tipo = 'text/csv;charset=utf-8') {
  const blob = new Blob(['﻿' + texto], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

const csv = (filas) =>
  filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');

// ---------- Despiece ----------
export function Despiece({ data, cfg, seleccion, setSeleccion, enfocar }) {
  const esDoble = useDobleToque();
  const exportar = () => {
    const filas = [['Id', 'Mueble', 'Pieza', 'Material', 'Largo', 'Ancho', 'Espesor']];
    for (const p of data.partes) {
      const d = [p.sx, p.sy, p.sz].sort((a, b) => b - a);
      const mat = p.tipo === 'liston' ? cfg.listones[p.mat].nombre : cfg.materiales[p.mat].nombre;
      filas.push([p.id, p.grupo, p.nombre, mat, n0(d[0]), n0(d[1]), n0(d[2])]);
    }
    descargar('despiece.csv', csv(filas));
  };
  return (
    <div>
      <div className="barra">
        <span>{data.partes.length} piezas. {TACTIL ? 'Doble toque' : 'Doble clic'} en una fila para verla sola.</span>
        <button onClick={exportar}>Exportar CSV</button>
      </div>
      <table className="tabla-despiece">
        <thead>
          <tr>
            <th>Id</th>
            <th>Pieza</th>
            <th>Material</th>
            <th>Largo x Ancho x Esp.</th>
          </tr>
        </thead>
        <tbody>
          {data.partes.map((p) => {
            const d = [p.sx, p.sy, p.sz].sort((a, b) => b - a);
            const mat = p.tipo === 'liston' ? cfg.listones[p.mat].nombre : cfg.materiales[p.mat].nombre;
            return (
              <tr key={p.id} id={`fila-${p.id}`} className={seleccion === p.id ? 'sel' : ''} onClick={(e) => (esDoble(p.id, e.timeStamp) ? enfocar(p.id) : setSeleccion(p.id))}>
                <td className="c-id">{p.id}</td>
                <td className="c-nom">
                  {p.nombre}
                  {seleccion === p.id && (
                    <button
                      className="ver-sola"
                      onClick={(e) => {
                        e.stopPropagation();
                        enfocar(p.id);
                      }}
                    >
                      Ver sola
                    </button>
                  )}
                </td>
                <td className="c-mat">{mat}</td>
                <td className="c-dim">
                  {n0(d[0])} x {n0(d[1])} x {n0(d[2])}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Plano de placas ----------
function Hoja({ hoja, mat, recorte, onSel, onEnfocar, seleccion }) {
  const esDoble = useDobleToque();
  const esc = 0.22;
  const W = mat.hojaL;
  const H = mat.hojaA;
  return (
    <svg className="hoja-svg" viewBox={`0 0 ${W} ${H}`} width="100%" style={{ background: '#f6efe2', border: '1px solid #9c8359' }}>
      <rect x={recorte} y={recorte} width={W - 2 * recorte} height={H - 2 * recorte} fill="none" stroke="#c9b48a" strokeDasharray="12 8" />
      {hoja.tiras.map((t) =>
        t.items.map((it) => (
          <g key={it.id} onClick={(e) => (esDoble(it.id, e.timeStamp) ? onEnfocar(it.id) : onSel(it.id))} style={{ cursor: 'pointer' }}>
            <rect
              x={recorte + it.x}
              y={recorte + t.y}
              width={it.w}
              height={it.h}
              fill={seleccion === it.id ? '#ffab91' : '#e3c690'}
              stroke="#6b4f2a"
              strokeWidth="3"
            />
            <text x={recorte + it.x + 10} y={recorte + t.y + 46} fontSize={Math.max(26, 90 * esc)} fill="#3b2a12">
              {it.id}
            </text>
            <text x={recorte + it.x + 10} y={recorte + t.y + 90} fontSize={Math.max(24, 80 * esc)} fill="#5a4325">
              {n0(it.w)} x {n0(it.h)}
            </text>
          </g>
        ))
      )}
    </svg>
  );
}

export function Placas({ plan, cfg, partes, seleccion, setSeleccion, enfocar }) {
  const sel = partes.find((p) => p.id === seleccion);
  return (
    <div>
      <p className="nota">
        {TACTIL ? 'Tocá una pieza para elegirla y doble toque para verla sola. Deslizá a los costados para recorrer la hoja.' : 'Doble clic en una pieza para verla sola.'}
      </p>
      {sel && (
        <div className="pieza-elegida">
          <span>
            <b>{sel.id}</b> {sel.nombre}
          </span>
          <button onClick={() => enfocar(sel.id)}>Ver sola</button>
        </div>
      )}
      {Object.entries(plan.planPlacas).map(([mat, res]) => (
        <section key={mat}>
          <h3>
            {cfg.materiales[mat].nombre}: {res.hojas.length} hojas ({Math.round(res.aprovechamientoTotal * 100)} % de aprovechamiento)
          </h3>
          {res.sinColocar.length > 0 && (
            <p className="aviso">No entran en la hoja: {res.sinColocar.map((i) => i.id).join(', ')}</p>
          )}
          {res.hojas.map((h) => (
            <div key={h.numero} className="hoja">
              <h4>
                Hoja {h.numero} ({Math.round(h.aprovechamiento * 100)} % usado)
              </h4>
              <div className="hoja-scroll">
                <Hoja hoja={h} mat={cfg.materiales[mat]} recorte={res.recorte} onSel={setSeleccion} onEnfocar={enfocar} seleccion={seleccion} />
              </div>
              <details>
                <summary>Cómo cortar esta hoja</summary>
                <pre>{pasosDeCorte(h, cfg.corte).join('\n')}</pre>
              </details>
            </div>
          ))}
        </section>
      ))}
      {Object.entries(plan.planListones).map(([mat, res]) => (
        <section key={mat}>
          <h3>
            {cfg.listones[mat].nombre}: {res.barras.length} barras de {cfg.listones[mat].largo} mm
          </h3>
          {res.barras.map((b, i) => (
            <p key={i} className="barra-liston">
              Barra {i + 1}: {b.items.map((it) => `${it.id} (${n0(it.largo)})`).join(' + ')} - sobran {n0(cfg.listones[mat].largo - b.usado)} mm
            </p>
          ))}
        </section>
      ))}
      <p className="nota">
        Los cortes son de tipo guillotina: primero se cortan tiras a lo ancho de la hoja y después cada tira.
        Sirve para sierra circular con guía. Las piezas se ordenan con la veta a lo largo de la hoja.
      </p>
    </div>
  );
}

// ---------- Herrajes y fijaciones ----------
export function Herrajes({ data, fijaciones }) {
  const porGrupo = {};
  for (const h of data.herrajes) {
    const g = (porGrupo[h.grupo] = porGrupo[h.grupo] || new Map());
    const prev = g.get(h.nombre) || { cantidad: 0, notas: new Set() };
    prev.cantidad += h.cantidad;
    if (h.nota) prev.notas.add(h.nota);
    g.set(h.nombre, prev);
  }
  return (
    <div>
      <h3>Dónde van enganchados</h3>
      <table>
        <thead>
          <tr>
            <th>Mueble</th>
            <th>Punto</th>
            <th>Cómo</th>
            <th>Cant.</th>
          </tr>
        </thead>
        <tbody>
          {data.anclajes.map((a, i) => (
            <tr key={i}>
              <td>{a.grupo}</td>
              <td>{a.punto}</td>
              <td>
                {a.metodo}
                {a.nota && <div className="nota">{a.nota}</div>}
              </td>
              <td>{a.cantidad}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Herrajes por mueble</h3>
      {Object.entries(porGrupo).map(([g, mapa]) => (
        <div key={g}>
          <h4>{g}</h4>
          <table>
            <tbody>
              {[...mapa.entries()].map(([nombre, v]) => (
                <tr key={nombre}>
                  <td>{nombre}</td>
                  <td>{v.cantidad}</td>
                  <td className="nota">{[...v.notas].join('; ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <h3>Tornillos, escuadras y cola (con 10 % de margen)</h3>
      <table>
        <tbody>
          {fijaciones.totales.map((f) => (
            <tr key={f.nombre}>
              <td>{f.nombre}</td>
              <td>{f.cantidad}</td>
              <td className="nota">{f.nota}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Eléctrica ----------
export function Electrica({ res, cargas, setCargas, elec, setElec, elementos, elemento, setElemento }) {
  const cambiarCarga = (id, campo, valor) =>
    setCargas(cargas.map((c) => (c.id === id ? { ...c, [campo]: valor } : c)));
  const num = (v) => (Number.isNaN(parseFloat(v)) ? 0 : parseFloat(v));
  return (
    <div>
      <p className="nota">
        Sistema: batería del auto, fusible ANL, cable largo bajo los asientos, DC-DC, batería de 150 Ah, caja de fusibles,
        inversor, panel de 5 interruptores, 2 enchufes con USB-C, 4 tiras LED y la lámpara flexible. El extractor no lleva conexión. Sin panel solar. Tocá cualquier elemento o cable
        (acá o en el 3D) para ver cómo se instala en un video. Los consumos son estimados.
      </p>
      <div className="resumen">
        <div>
          <b>{n0(res.whDia)} Wh/día</b>
          <span>{res.ahDia.toFixed(1)} Ah/día</span>
        </div>
        <div>
          <b>{res.autonomiaDias === Infinity ? '-' : res.autonomiaDias.toFixed(1)} días</b>
          <span>autonomía sin manejar</span>
        </div>
        <div>
          <b>{res.horasConduccion.toFixed(1)} h</b>
          <span>de manejo para recargar</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Consumo</th>
            <th>W</th>
            <th>Horas</th>
            <th>Ciclo</th>
            <th>Wh/día</th>
          </tr>
        </thead>
        <tbody>
          {cargas.map((c) => {
            const fila = res.filas.find((f) => f.id === c.id);
            return (
              <tr key={c.id}>
                <td>{c.nombre}</td>
                <td>
                  <input className="mini" type="number" value={c.w} onChange={(e) => cambiarCarga(c.id, 'w', num(e.target.value))} />
                </td>
                <td>
                  <input className="mini" type="number" step="0.05" value={c.horas} onChange={(e) => cambiarCarga(c.id, 'horas', num(e.target.value))} />
                </td>
                <td>
                  <input className="mini" type="number" step="0.05" value={c.ciclo} onChange={(e) => cambiarCarga(c.id, 'ciclo', num(e.target.value))} />
                </td>
                <td>{fila ? n0(fila.wh) : '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {res.filas.filter((f) => f.calculada).map((f) => (
        <p key={f.id} className="nota">
          {f.nombre}: {f.w} W x {f.horas} h = {n0(f.wh)} Wh por día (ESTIMADO, ya está sumado en el total).
        </p>
      ))}

      <fieldset>
        <legend>Parámetros</legend>
        <label className="campo">
          <span>Batería (Ah)</span>
          <input type="number" value={elec.bateriaAh} onChange={(e) => setElec({ ...elec, bateriaAh: num(e.target.value) })} />
        </label>
        <label className="campo">
          <span>Potencia del inversor (W)</span>
          <input type="number" value={elec.inversorW} onChange={(e) => setElec({ ...elec, inversorW: num(e.target.value) })} />
        </label>
        <label className="campo">
          <span>Corriente real de carga (A)</span>
          <input type="number" value={elec.cargadorRealA} onChange={(e) => setElec({ ...elec, cargadorRealA: num(e.target.value) })} />
        </label>
        <label className="campo">
          <span>Caída máxima (%)</span>
          <input type="number" step="0.5" value={elec.caidaMaxPct} onChange={(e) => setElec({ ...elec, caidaMaxPct: num(e.target.value) })} />
        </label>
        <label className="campo">
          <span>Incluir inversor 230 V</span>
          <input type="checkbox" checked={elec.inversor} onChange={(e) => setElec({ ...elec, inversor: e.target.checked })} />
        </label>
      </fieldset>

      <h3>Elementos (tocá uno para ver el video)</h3>
      <table>
        <tbody>
          {elementos.map((e) => (
            <tr key={e.id} className={`fila-click ${elemento === e.id ? 'sel' : ''}`} onClick={() => setElemento(e.id)}>
              <td>{e.nombre}</td>
              <td className="nota">{e.nota}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Cables y fusibles (largo medido en el 3D)</h3>
      <table>
        <thead>
          <tr>
            <th>Tramo</th>
            <th>Largo</th>
            <th>A</th>
            <th>Cable</th>
            <th>Fusible</th>
            <th>Caída</th>
          </tr>
        </thead>
        <tbody>
          {res.tramos.map((t) => (
            <tr key={t.id} className={`fila-click ${elemento === t.id ? 'sel' : ''}`} onClick={() => setElemento(t.id)}>
              <td>{t.nombre}</td>
              <td>{t.largoM.toFixed(2)} m</td>
              <td>{t.amperes.toFixed(1)}</td>
              <td>{t.seccion} mm2</td>
              <td>{t.fusible} A</td>
              <td>{t.caidaPct.toFixed(1)} %</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Caída de tensión acumulada por camino</h3>
      <table>
        <thead>
          <tr>
            <th>Camino</th>
            <th>Largo</th>
            <th>Caída</th>
          </tr>
        </thead>
        <tbody>
          {res.caminos.map((c) => (
            <tr key={c.nombre} className={c.ok ? '' : 'aviso'}>
              <td>{c.nombre}</td>
              <td>{c.largoM.toFixed(2)} m</td>
              <td>
                {c.caidaPct.toFixed(1)} % (máx. {elec.caidaMaxPct} %)
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Cable a comprar</h3>
      <table>
        <tbody>
          {res.cableCompras.map((c) => (
            <tr key={c.item}>
              <td>{c.item}</td>
              <td>{c.metros} m</td>
            </tr>
          ))}
        </tbody>
      </table>

      {res.avisos.map((a, i) => (
        <p key={i} className="aviso">
          {a}
        </p>
      ))}
      <p className="nota">
        Las secciones salen de la caída de tensión y de una corriente admisible conservadora. Confirmar con la ficha del cable
        comprado antes de instalar. Todo conectado al sistema del auto: usar fusible en cada derivación y proteger los pasos por chapa.
      </p>
    </div>
  );
}

// ---------- Compras ----------
export function Compras({ filas }) {
  const exportar = () => {
    const f = [['Categoría', 'Ítem', 'Cantidad', 'Nota']];
    for (const r of filas) f.push([r.categoria, r.item, r.cantidad, r.nota]);
    descargar('compras.csv', csv(f));
  };
  const cats = [...new Set(filas.map((f) => f.categoria))];
  return (
    <div>
      <div className="barra">
        <span>Lista para llevar a Derome y al resto de tiendas</span>
        <button onClick={exportar}>Exportar CSV</button>
      </div>
      {cats.map((c) => (
        <div key={c}>
          <h3>{c}</h3>
          <table>
            <tbody>
              {filas
                .filter((f) => f.categoria === c)
                .map((f, i) => (
                  <tr key={i}>
                    <td>{f.item}</td>
                    <td>{f.cantidad}</td>
                    <td className="nota">{f.nota}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
