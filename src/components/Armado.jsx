// Pestaña "Armado": un tutorial por mueble, con los pasos tildables. El contenido sale de engine/tutorial.js.
import React, { useEffect, useState } from 'react';
import { useDobleToque, TACTIL } from '../util/pantalla.js';

const CLAVE_HECHOS = 'chata-armado-hechos';
const CLAVE_MUEBLE = 'chata-armado-mueble';

// El almacenamiento del navegador puede fallar (ventana privada, datos bloqueados): la pestaña tiene que andar igual
function leer(clave, vacio) {
  try {
    const v = window.localStorage.getItem(clave);
    return v ? JSON.parse(v) : vacio;
  } catch {
    return vacio;
  }
}

function guardar(clave, valor) {
  try {
    window.localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // sin almacenamiento: queda solo en memoria
  }
}

// Las tablas con muchas columnas no entran en un panel angosto: cada fila se muestra como una tarjeta
function TablaGeneral({ tabla }) {
  return (
    <div className="armado-tabla">
      <h4>{tabla.titulo}</h4>
      <div className="tarjetas">
        {tabla.filas.map((f, i) => (
          <div key={i} className="tarjeta">
            <b>{f[0]}</b>
            {f.slice(1).map((c, j) =>
              c ? (
                <div key={j}>
                  <span>{tabla.cabecera[j + 1]}:</span> {c}
                </div>
              ) : null
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TablaPiezas({ piezas, seleccion, setSeleccion, enfocar }) {
  const esDoble = useDobleToque();
  return (
    <div className="armado-tabla">
      <h4>Piezas de este paso</h4>
      <p className="nota">{TACTIL ? 'Tocá una pieza para elegirla y doble toque para verla sola.' : 'Un clic elige la pieza, doble clic la muestra sola.'}</p>
      <div className="armado-scroll">
        <table className="tabla-despiece">
          <thead>
            <tr>
              <th>Id</th>
              <th>Pieza</th>
              <th>Medida</th>
              <th>Sale de</th>
            </tr>
          </thead>
          <tbody>
            {piezas.map((p) => (
              <tr key={p.id} className={seleccion === p.id ? 'sel' : ''} onClick={(e) => (esDoble(p.id, e.timeStamp) ? enfocar(p.id) : setSeleccion(p.id))}>
                <td className="c-id">{p.id}</td>
                <td className="c-nom">{p.nombre}</td>
                <td className="c-dim">{p.medida}</td>
                <td className="c-mat">{p.corte}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Paso({ paso, numero, hecho, abierto, alternar, marcar, seleccion, setSeleccion, enfocar }) {
  return (
    <section className={`paso${hecho ? ' hecho' : ''}`}>
      <header>
        <label className="paso-check">
          <input type="checkbox" checked={hecho} onChange={() => marcar(paso.id)} aria-label={`Paso ${numero} hecho`} />
        </label>
        <button className="paso-titulo" onClick={() => alternar(paso.id)} aria-expanded={abierto}>
          <span className="paso-num">{numero}</span>
          <span>{paso.titulo}</span>
          <span className="paso-flecha">{abierto ? '−' : '+'}</span>
        </button>
      </header>
      {abierto && (
        <div className="paso-cuerpo">
          <p>{paso.intro}</p>
          {paso.hacer.length > 0 && (
            <ol>
              {paso.hacer.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ol>
          )}
          {paso.piezas.length > 0 && <TablaPiezas piezas={paso.piezas} seleccion={seleccion} setSeleccion={setSeleccion} enfocar={enfocar} />}
          {(paso.tablas || []).map((t, i) => (
            <TablaGeneral key={i} tabla={t} />
          ))}
          {(paso.ojo || []).map((o, i) => (
            <p key={i} className="ojo">
              <b>Ojo:</b> {o}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}

function Lista({ lista }) {
  return (
    <div>
      <h4>Herrajes</h4>
      <div className="armado-scroll">
        <table>
          <tbody>
            {lista.herrajes.map((h, i) => (
              <tr key={i}>
                <td>{h.cantidad}</td>
                <td>{h.nombre}</td>
                <td className="nota">{h.nota}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h4>Tornillos y fijaciones (sin el margen del 10 %)</h4>
      <div className="armado-scroll">
        <table>
          <tbody>
            {lista.fijaciones.map((h, i) => (
              <tr key={i}>
                <td>{h.cantidad}</td>
                <td>{h.nombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Armado({ tutorial, seleccion, setSeleccion, enfocar }) {
  const [idx, setIdx] = useState(() => {
    const g = leer(CLAVE_MUEBLE, 0);
    return Number.isInteger(g) && g >= 0 && g < tutorial.muebles.length ? g : 0;
  });
  const [hechos, setHechos] = useState(() => new Set(leer(CLAVE_HECHOS, [])));
  // undefined: arranca abierto el primer paso sin hacer; '': todos cerrados
  const [abierto, setAbierto] = useState(undefined);

  useEffect(() => guardar(CLAVE_MUEBLE, idx), [idx]);
  useEffect(() => guardar(CLAVE_HECHOS, [...hechos]), [hechos]);

  const m = tutorial.muebles[idx] || tutorial.muebles[0];
  const hechosAqui = m.pasos.filter((p) => hechos.has(p.id)).length;
  // El primer paso sin hacer arranca abierto, para retomar donde quedaste
  const proximo = m.pasos.find((p) => !hechos.has(p.id));

  const marcar = (id) =>
    setHechos((prev) => {
      const sig = new Set(prev);
      if (sig.has(id)) sig.delete(id);
      else sig.add(id);
      return sig;
    });
  const idAbierto = abierto === undefined ? (proximo ? proximo.id : '') : abierto;
  const alternar = (id) => setAbierto(idAbierto === id ? '' : id);

  const g = tutorial.generales;

  return (
    <div className="armado">
      <div className="armado-muebles" role="tablist">
        {tutorial.muebles.map((x, i) => {
          const n = x.pasos.filter((p) => hechos.has(p.id)).length;
          return (
            <button key={x.grupo} role="tab" aria-selected={i === idx} className={i === idx ? 'activa' : ''} onClick={() => {
                setIdx(i);
                setAbierto(undefined);
              }}>
              {x.titulo}
              <small>
                {n} de {x.pasos.length}
              </small>
            </button>
          );
        })}
      </div>

      <details className="armado-bloque">
        <summary>Antes de empezar (herramientas, reglas y seguridad)</summary>
        <h4>Herramientas</h4>
        <ul>
          {g.herramientas.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
        <h4>Reglas de unión</h4>
        <ul>
          {g.reglas.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
        <h4>Seguridad</h4>
        <ul>
          {g.seguridad.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
        <h4>Orden de los muebles</h4>
        <ol>
          {g.orden.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ol>
      </details>

      <h3>{m.titulo}</h3>
      <ul className="armado-resumen">
        {m.resumen.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
      <div className="armado-progreso" aria-label={`${hechosAqui} de ${m.pasos.length} pasos hechos`}>
        <div style={{ width: `${(100 * hechosAqui) / m.pasos.length}%` }} />
      </div>

      <details className="armado-bloque">
        <summary>Lista de herrajes y tornillos de este mueble</summary>
        <Lista lista={m.lista} />
      </details>

      <details className="armado-bloque">
        <summary>Qué falta definir antes de armar ({m.esperar.length})</summary>
        <ul>
          {m.esperar.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </details>

      {m.pasos.map((p, i) => (
        <Paso
          key={p.id}
          paso={p}
          numero={i + 1}
          hecho={hechos.has(p.id)}
          abierto={idAbierto === p.id}
          alternar={alternar}
          marcar={marcar}
          seleccion={seleccion}
          setSeleccion={setSeleccion}
          enfocar={enfocar}
        />
      ))}
    </div>
  );
}
