import React from 'react';
import { useTranslation } from 'react-i18next';
import { nombreGrupo, nombreMaterial } from '../i18n/util.js';
import { traductor } from '../i18n/electrico.js';
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
  const { t } = useTranslation();
  const esDoble = useDobleToque();
  const exportar = () => {
    const filas = [[t('paneles.id'), t('paneles.mueble'), t('paneles.pieza'), t('paneles.material'), t('paneles.largo'), t('paneles.ancho'), t('paneles.espesor')]];
    for (const p of data.partes) {
      const d = [p.sx, p.sy, p.sz].sort((a, b) => b - a);
      filas.push([p.id, nombreGrupo(t, p.grupo), p.nombre, nombreMaterial(t, cfg, p.mat), n0(d[0]), n0(d[1]), n0(d[2])]);
    }
    descargar('despiece.csv', csv(filas));
  };
  return (
    <div>
      <div className="barra">
        <span>{t(TACTIL ? 'paneles.despiece.ayudaToque' : 'paneles.despiece.ayudaClic', { count: data.partes.length })}</span>
        <button onClick={exportar}>{t('paneles.exportarCsv')}</button>
      </div>
      <table className="tabla-despiece">
        <thead>
          <tr>
            <th>{t('paneles.id')}</th>
            <th>{t('paneles.pieza')}</th>
            <th>{t('paneles.material')}</th>
            <th>{t('paneles.dimensiones')}</th>
          </tr>
        </thead>
        <tbody>
          {data.partes.map((p) => {
            const d = [p.sx, p.sy, p.sz].sort((a, b) => b - a);
            const mat = nombreMaterial(t, cfg, p.mat);
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
                      {t('paneles.verSola')}
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
  const { t } = useTranslation();
  const sel = partes.find((p) => p.id === seleccion);
  return (
    <div>
      <p className="nota">
        {t(TACTIL ? 'paneles.placas.notaToque' : 'paneles.placas.notaClic')}
      </p>
      {sel && (
        <div className="pieza-elegida">
          <span>
            <b>{sel.id}</b> {sel.nombre}
          </span>
          <button onClick={() => enfocar(sel.id)}>{t('paneles.verSola')}</button>
        </div>
      )}
      {Object.entries(plan.planPlacas).map(([mat, res]) => (
        <section key={mat}>
          <h3>
            {t('paneles.placas.hojas', { material: nombreMaterial(t, cfg, mat), count: res.hojas.length, pct: Math.round(res.aprovechamientoTotal * 100) })}
          </h3>
          {res.sinColocar.length > 0 && (
            <p className="aviso">{t('paneles.placas.sinColocar', { ids: res.sinColocar.map((i) => i.id).join(', ') })}</p>
          )}
          {res.hojas.map((h) => (
            <div key={h.numero} className="hoja">
              <h4>
                {t('paneles.placas.hoja', { n: h.numero, pct: Math.round(h.aprovechamiento * 100) })}
              </h4>
              <div className="hoja-scroll">
                <Hoja hoja={h} mat={cfg.materiales[mat]} recorte={res.recorte} onSel={setSeleccion} onEnfocar={enfocar} seleccion={seleccion} />
              </div>
              <details>
                <summary>{t('paneles.placas.comoCortar')}</summary>
                <pre>{pasosDeCorte(h, cfg.corte).join('\n')}</pre>
              </details>
            </div>
          ))}
        </section>
      ))}
      {Object.entries(plan.planListones).map(([mat, res]) => (
        <section key={mat}>
          <h3>
            {t('paneles.placas.barras', { material: nombreMaterial(t, cfg, mat), count: res.barras.length, largo: cfg.listones[mat].largo })}
          </h3>
          {res.barras.map((b, i) => (
            <p key={i} className="barra-liston">
              {t('paneles.placas.barra', { n: i + 1, items: b.items.map((it) => `${it.id} (${n0(it.largo)})`).join(' + '), mm: n0(cfg.listones[mat].largo - b.usado) })}
            </p>
          ))}
        </section>
      ))}
      <p className="nota">{t('paneles.placas.guillotina')}</p>
    </div>
  );
}

// ---------- Herrajes y fijaciones ----------
export function Herrajes({ data, fijaciones }) {
  const { t } = useTranslation();
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
      <h3>{t('paneles.herrajes.dondeVan')}</h3>
      <table>
        <thead>
          <tr>
            <th>{t('paneles.mueble')}</th>
            <th>{t('paneles.herrajes.punto')}</th>
            <th>{t('paneles.herrajes.como')}</th>
            <th>{t('paneles.herrajes.cant')}</th>
          </tr>
        </thead>
        <tbody>
          {data.anclajes.map((a, i) => (
            <tr key={i}>
              <td>{nombreGrupo(t, a.grupo)}</td>
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

      <h3>{t('paneles.herrajes.porMueble')}</h3>
      {Object.entries(porGrupo).map(([g, mapa]) => (
        <div key={g}>
          <h4>{nombreGrupo(t, g)}</h4>
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

      <h3>{t('paneles.herrajes.tornillos')}</h3>
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
  const { t, i18n } = useTranslation();
  const tx = traductor(i18n);
  const cambiarCarga = (id, campo, valor) =>
    setCargas(cargas.map((c) => (c.id === id ? { ...c, [campo]: valor } : c)));
  const num = (v) => (Number.isNaN(parseFloat(v)) ? 0 : parseFloat(v));
  return (
    <div>
      <p className="nota">{t('paneles.electrica.sistema')}</p>
      <div className="resumen">
        <div>
          <b>{t('paneles.electrica.whDia', { n: n0(res.whDia) })}</b>
          <span>{t('paneles.electrica.ahDia', { n: res.ahDia.toFixed(1) })}</span>
        </div>
        <div>
          <b>{res.autonomiaDias === Infinity ? '-' : t('paneles.electrica.autonomia', { n: res.autonomiaDias.toFixed(1) })}</b>
          <span>{t('paneles.electrica.autonomiaTexto')}</span>
        </div>
        <div>
          <b>{t('paneles.electrica.horas', { n: res.horasConduccion.toFixed(1) })}</b>
          <span>{t('paneles.electrica.manejoTexto')}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>{t('paneles.electrica.consumo')}</th>
            <th>W</th>
            <th>{t('paneles.electrica.horasCol')}</th>
            <th>{t('paneles.electrica.ciclo')}</th>
            <th>{t('paneles.electrica.whCol')}</th>
          </tr>
        </thead>
        <tbody>
          {cargas.map((c) => {
            const fila = res.filas.find((f) => f.id === c.id);
            return (
              <tr key={c.id}>
                <td>{tx(`elec.cargas.${c.id}`, c.nombre)}</td>
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
          {t('paneles.electrica.calculada', { nombre: f.nombre, w: f.w, horas: f.horas, wh: n0(f.wh) })}
        </p>
      ))}

      <fieldset>
        <legend>{t('paneles.electrica.parametros')}</legend>
        <label className="campo">
          <span>{t('paneles.electrica.bateria')}</span>
          <input type="number" value={elec.bateriaAh} onChange={(e) => setElec({ ...elec, bateriaAh: num(e.target.value) })} />
        </label>
        <label className="campo">
          <span>{t('paneles.electrica.inversorW')}</span>
          <input type="number" value={elec.inversorW} onChange={(e) => setElec({ ...elec, inversorW: num(e.target.value) })} />
        </label>
        <label className="campo">
          <span>{t('paneles.electrica.cargador')}</span>
          <input type="number" value={elec.cargadorRealA} onChange={(e) => setElec({ ...elec, cargadorRealA: num(e.target.value) })} />
        </label>
        <label className="campo">
          <span>{t('paneles.electrica.caidaMax')}</span>
          <input type="number" step="0.5" value={elec.caidaMaxPct} onChange={(e) => setElec({ ...elec, caidaMaxPct: num(e.target.value) })} />
        </label>
        <label className="campo">
          <span>{t('paneles.electrica.incluirInversor')}</span>
          <input type="checkbox" checked={elec.inversor} onChange={(e) => setElec({ ...elec, inversor: e.target.checked })} />
        </label>
      </fieldset>

      <h3>{t('paneles.electrica.elementos')}</h3>
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

      <h3>{t('paneles.electrica.cablesFusibles')}</h3>
      <table>
        <thead>
          <tr>
            <th>{t('paneles.electrica.tramo')}</th>
            <th>{t('paneles.largo')}</th>
            <th>A</th>
            <th>{t('paneles.electrica.cable')}</th>
            <th>{t('paneles.electrica.fusible')}</th>
            <th>{t('paneles.electrica.caida')}</th>
          </tr>
        </thead>
        <tbody>
          {res.tramos.map((tr) => (
            <tr key={tr.id} className={`fila-click ${elemento === tr.id ? 'sel' : ''}`} onClick={() => setElemento(tr.id)}>
              <td>{tr.nombre}</td>
              <td>{tr.largoM.toFixed(2)} m</td>
              <td>{tr.amperes.toFixed(1)}</td>
              <td>{tr.seccion} mm2</td>
              <td>{tr.sinFusible || tr.tipo === 'senal' ? '-' : `${tr.fusible} A`}</td>
              <td>{tr.caidaPct.toFixed(1)} %</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>{t('paneles.electrica.caidaAcumulada')}</h3>
      <table>
        <thead>
          <tr>
            <th>{t('paneles.electrica.camino')}</th>
            <th>{t('paneles.largo')}</th>
            <th>{t('paneles.electrica.caida')}</th>
          </tr>
        </thead>
        <tbody>
          {res.caminos.map((c) => (
            <tr key={c.nombre} className={c.ok ? '' : 'aviso'}>
              <td>{c.nombre}</td>
              <td>{c.largoM.toFixed(2)} m</td>
              <td>
                {t('paneles.electrica.caidaMaxima', { pct: c.caidaPct.toFixed(1), max: elec.caidaMaxPct })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>{t('paneles.electrica.cableComprar')}</h3>
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
      <p className="nota">{t('paneles.electrica.nota')}</p>
    </div>
  );
}

// ---------- Compras ----------
export function Compras({ filas }) {
  const { t } = useTranslation();
  const exportar = () => {
    const f = [[t('paneles.compras.categoria'), t('paneles.compras.item'), t('paneles.compras.cantidad'), t('paneles.compras.nota')]];
    for (const r of filas) f.push([r.categoria, r.item, r.cantidad, r.nota]);
    descargar('compras.csv', csv(f));
  };
  const cats = [...new Set(filas.map((f) => f.categoria))];
  return (
    <div>
      <div className="barra">
        <span>{t('paneles.compras.lista')}</span>
        <button onClick={exportar}>{t('paneles.exportarCsv')}</button>
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
