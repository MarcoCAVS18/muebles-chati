// Pestaña "Armado": un camino por mueble. Portada con la escalera de pasos, y cada paso abierto con sus tareas tildables.
// El contenido sale de engine/tutorial.js; acá solo se arma la experiencia.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDobleToque, TACTIL } from '../util/pantalla.js';
import { Icono } from './Icono.jsx';
import '../armado.css';

const CLAVES = {
  hechos: 'chata-armado-hechos',
  mueble: 'chata-armado-mueble',
  tareas: 'chata-armado-tareas',
  herramientas: 'chata-armado-herramientas',
};

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

const conjunto = (clave) => {
  const g = leer(clave, []);
  return new Set(Array.isArray(g) ? g : []);
};

// Cada tarea arranca con su primera oración en negrita para poder recorrerlas de un vistazo
function partir(texto) {
  const m = /^(.{12,160}?[.:])\s+(?=[A-ZÁÉÍÓÚÑ¿¡«(0-9])([\s\S]+)$/.exec(texto);
  return m ? { titulo: m[1], resto: m[2] } : { titulo: '', resto: texto };
}

/* ---------- La escalera: un escalón por paso ---------- */
// Proyección más baja que la isométrica de 30 grados: así la escalera entra ancha en la portada
const AX = 0.95;
const AY = 0.34;
const ESC = 40; // la escalera se dibuja en unidades de 40 para que los trazos y los números tengan tamaño de pixel
const proyectar = (x, y, z) => [(x - y) * AX * ESC, ((x + y) * AY - z) * ESC];
const pts = (lista) => lista.map((p) => p.join(',')).join(' ');

function Escalera({ pasos, hechos, actual, nuevo, abrir, completo }) {
  const n = pasos.length;
  const ancho = 0.92;
  const fondo = 2.2;
  const alto = 0.42;
  const bloques = pasos.map((p, i) => {
    const y0 = -(i + 1) * ancho;
    const y1 = -i * ancho;
    const zt = (i + 1) * alto;
    return {
      i,
      p,
      top: [proyectar(0, y0, zt), proyectar(fondo, y0, zt), proyectar(fondo, y1, zt), proyectar(0, y1, zt)],
      der: [proyectar(fondo, y0, 0), proyectar(fondo, y1, 0), proyectar(fondo, y1, zt), proyectar(fondo, y0, zt)],
      izq: [proyectar(0, y1, 0), proyectar(fondo, y1, 0), proyectar(fondo, y1, zt), proyectar(0, y1, zt)],
      centro: proyectar(fondo / 2, (y0 + y1) / 2, zt),
    };
  });
  // Bandera sobre el último escalón
  const ult = bloques[n - 1];
  const pie = ult.centro;
  const punta = [pie[0], pie[1] - 2.6 * ESC];
  const banderin = [punta, [punta[0] + 1.5 * ESC, punta[1] + 0.5 * ESC], [punta[0], punta[1] + 1 * ESC]];
  const todos = bloques.flatMap((b) => [...b.top, ...b.der, ...b.izq]).concat(banderin, [pie]);
  const x0 = Math.min(...todos.map((q) => q[0])) - 10;
  const x1 = Math.max(...todos.map((q) => q[0])) + 10;
  const y0 = Math.min(...todos.map((q) => q[1])) - 10;
  const y1 = Math.max(...todos.map((q) => q[1])) + 10;

  return (
    <svg className="esc" viewBox={`${x0} ${y0} ${x1 - x0} ${y1 - y0}`} role="group" aria-label="Escalera de pasos del mueble">
      <polygon className={`esc-asta${completo ? ' ok' : ''}`} points={pts([[pie[0] - 1.8, pie[1]], [pie[0] + 1.8, pie[1]], [punta[0] + 1.8, punta[1]], [punta[0] - 1.8, punta[1]]])} />
      <polygon className={`esc-banderin${completo ? ' ok' : ''}`} points={pts(banderin)} />
      {[...bloques].reverse().map((b) => {
        const estado = hechos.has(b.p.id) ? 'hecho' : actual === b.p.id ? 'actual' : 'pend';
        const rotulo = `Paso ${b.i + 1}: ${b.p.titulo}. ${estado === 'hecho' ? 'Hecho' : estado === 'actual' ? 'Sigue este' : 'Pendiente'}`;
        return (
          <g
            key={b.p.id}
            className={`esc-paso esc-${estado}${nuevo === b.p.id ? ' esc-nuevo' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={rotulo}
            onClick={() => abrir(b.p.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                abrir(b.p.id);
              }
            }}
          >
            <title>{rotulo}</title>
            <polygon className="esc-der" points={pts(b.der)} />
            <polygon className="esc-izq" points={pts(b.izq)} />
            <polygon className="esc-top" points={pts(b.top)} />
            <text className="esc-num" x={b.centro[0]} y={b.centro[1]} textAnchor="middle" dominantBaseline="central">
              {estado === 'hecho' ? '✓' : b.i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- Piezas del paso, como tablitas con su rótulo a lápiz ---------- */
function Piezas({ piezas, seleccion, setSeleccion, enfocar }) {
  const esDoble = useDobleToque();
  const [todas, setTodas] = useState(false);
  const lista = todas ? piezas : piezas.slice(0, 8);
  return (
    <section className="a-bloque">
      <h3>
        Maderas de este paso <span className="a-cuenta">{piezas.length}</span>
      </h3>
      <p className="nota">{TACTIL ? 'Tocá una para verla en el 3D. Doble toque para verla sola.' : 'Un clic la marca en el 3D. Doble clic la muestra sola.'}</p>
      <ul className="a-maderas">
        {lista.map((p) => (
          <li key={p.id}>
            <button className={`a-madera${seleccion === p.id ? ' sel' : ''}`} onClick={(e) => (esDoble(p.id, e.timeStamp) ? enfocar(p.id) : setSeleccion(p.id))}>
              <span className="a-id">{p.id}</span>
              <span className="a-nombre">{p.nombre}</span>
              <span className="a-medida">{p.medida}</span>
              <span className="a-corte">{p.corte}</span>
            </button>
          </li>
        ))}
      </ul>
      {piezas.length > 8 && (
        <button className="a-sec a-ver-mas" onClick={() => setTodas(!todas)}>
          {todas ? 'Ver menos' : `Ver las ${piezas.length} maderas`}
        </button>
      )}
    </section>
  );
}

// Las tablas anchas se muestran como una tarjeta por fila: se leen en el celular sin deslizar
function Tabla({ tabla }) {
  return (
    <details className="a-det a-tabla" open={tabla.filas.length <= 6}>
      <summary>
        <span>{tabla.titulo}</span>
        <span className="a-cuenta">{tabla.filas.length}</span>
        <Icono n="abajo" />
      </summary>
      <div className="a-tarjetas">
        {tabla.filas.map((f, i) => (
          <div key={i} className="a-tarjeta">
            <b>{f[0]}</b>
            {f.slice(1).map((c, j) =>
              c ? (
                <div key={j}>
                  <span>{tabla.cabecera[j + 1]}</span> {c}
                </div>
              ) : null
            )}
          </div>
        ))}
      </div>
    </details>
  );
}

/* ---------- Un paso abierto ---------- */
function PasoAbierto({ paso, numero, total, tareas, alternarTarea, hecho, hacerYSeguir, anterior, hayAnterior, alMapa, deshacer, seleccion, setSeleccion, enfocar, ver3D, esMovil }) {
  const tildadas = paso.hacer.filter((_, i) => tareas.has(`${paso.id}:${i}`)).length;
  return (
    <div className="a-paso">
      <header className="a-paso-cab">
        <button className="a-sec a-volver" onClick={alMapa}>
          <Icono n="izq" />
          Todos los pasos
        </button>
        <span className="a-posicion">
          Paso {numero} de {total}
        </span>
      </header>
      <div className="a-cinta" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <i key={i} className={i + 1 < numero ? 'pasado' : i + 1 === numero ? 'ahora' : ''} />
        ))}
      </div>

      <h2 className="a-titulo-paso">{paso.titulo}</h2>
      <p className="a-intro">{paso.intro}</p>

      {paso.piezas.length > 0 &&
        (esMovil ? (
          <button className="a-ver3d" onClick={ver3D}>
            <Icono n="cubo" />
            Ver estas maderas en el 3D
          </button>
        ) : (
          <p className="a-aviso3d">
            <i aria-hidden="true" />
            Las maderas de este paso están en rosa en el 3D.
          </p>
        ))}

      {paso.hacer.length > 0 && (
        <section className="a-bloque">
          <h3>
            Qué hacer{' '}
            <span className="a-cuenta">
              {tildadas} de {paso.hacer.length}
            </span>
          </h3>
          <ol className="a-tareas">
            {paso.hacer.map((h, i) => {
              const k = `${paso.id}:${i}`;
              const ok = tareas.has(k);
              const { titulo, resto } = partir(h);
              return (
                <li key={k} className={`a-tarea${ok ? ' ok' : ''}`}>
                  <button className="a-check" role="checkbox" aria-checked={ok} aria-label={`Tarea ${i + 1}`} onClick={() => alternarTarea(k)}>
                    <Icono n="check" />
                  </button>
                  <div className="a-tarea-texto" onClick={() => alternarTarea(k)}>
                    {titulo ? (
                      <>
                        <b>{titulo}</b> {resto}
                      </>
                    ) : (
                      resto
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {(paso.ojo || []).map((o, i) => (
        <p key={i} className="a-ojo">
          <Icono n="aviso" />
          <span>
            <b>Ojo.</b> {o}
          </span>
        </p>
      ))}

      {paso.piezas.length > 0 && <Piezas piezas={paso.piezas} seleccion={seleccion} setSeleccion={setSeleccion} enfocar={enfocar} />}
      {(paso.tablas || []).map((t, i) => (
        <Tabla key={i} tabla={t} />
      ))}

      <footer className="a-pie">
        {hayAnterior && (
          <button className="a-sec a-pie-ant" onClick={anterior} aria-label="Paso anterior">
            <Icono n="izq" />
          </button>
        )}
        {hecho && (
          <button className="a-sec" onClick={deshacer}>
            Desmarcar
          </button>
        )}
        <button className="a-principal" onClick={hacerYSeguir}>
          {hecho ? 'Siguiente paso' : numero === total ? 'Terminar el mueble' : 'Paso hecho, siguiente'}
          <Icono n="der" />
        </button>
      </footer>
    </div>
  );
}

/* ---------- Antes de empezar: herramientas tildables, reglas, seguridad y orden ---------- */
function Taller({ generales, herramientas, alternarHerramienta }) {
  const [vista, setVista] = useState('herramientas');
  const tildadas = generales.herramientas.filter((_, i) => herramientas.has(`h${i}`)).length;
  const vistas = [
    ['herramientas', `Herramientas ${tildadas}/${generales.herramientas.length}`],
    ['reglas', 'Reglas de unión'],
    ['seguridad', 'Seguridad'],
    ['orden', 'Orden de los muebles'],
  ];
  return (
    <details className="a-det a-taller">
      <summary>
        <span>Antes de empezar</span>
        <span className="a-cuenta">
          {tildadas} de {generales.herramientas.length}
        </span>
        <Icono n="abajo" />
      </summary>
      <div className="a-segmentos" role="tablist">
        {vistas.map(([k, t]) => (
          <button key={k} role="tab" aria-selected={vista === k} className={vista === k ? 'activa' : ''} onClick={() => setVista(k)}>
            {t}
          </button>
        ))}
      </div>
      {vista === 'herramientas' && (
        <ul className="a-lista-tilde">
          {generales.herramientas.map((x, i) => {
            const ok = herramientas.has(`h${i}`);
            return (
              <li key={i} className={ok ? 'ok' : ''}>
                <button className="a-check" role="checkbox" aria-checked={ok} aria-label="Ya la tengo" onClick={() => alternarHerramienta(`h${i}`)}>
                  <Icono n="check" />
                </button>
                <span onClick={() => alternarHerramienta(`h${i}`)}>{x}</span>
              </li>
            );
          })}
        </ul>
      )}
      {vista === 'reglas' && (
        <ul className="a-lista">
          {generales.reglas.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      )}
      {vista === 'seguridad' && (
        <ul className="a-lista a-lista-aviso">
          {generales.seguridad.map((x, i) => (
            <li key={i}>
              <Icono n="aviso" />
              <span>{x}</span>
            </li>
          ))}
        </ul>
      )}
      {vista === 'orden' && (
        <ol className="a-lista a-lista-orden">
          {generales.orden.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ol>
      )}
    </details>
  );
}

/* ---------- Pestaña ---------- */
export function Armado({ tutorial, seleccion, setSeleccion, enfocar, setPasoVivo, ver3D, esMovil }) {
  const [idx, setIdx] = useState(() => {
    const g = leer(CLAVES.mueble, 0);
    return Number.isInteger(g) && g >= 0 && g < tutorial.muebles.length ? g : 0;
  });
  const [hechos, setHechos] = useState(() => conjunto(CLAVES.hechos));
  const [tareas, setTareas] = useState(() => conjunto(CLAVES.tareas));
  const [herramientas, setHerramientas] = useState(() => conjunto(CLAVES.herramientas));
  const [abierto, setAbierto] = useState(''); // id del paso abierto; vacío es la portada del mueble
  const [nuevo, setNuevo] = useState(''); // el último escalón que se terminó: se asienta con una animación
  const tope = useRef(null);

  useEffect(() => guardar(CLAVES.mueble, idx), [idx]);
  useEffect(() => guardar(CLAVES.hechos, [...hechos]), [hechos]);
  useEffect(() => guardar(CLAVES.tareas, [...tareas]), [tareas]);
  useEffect(() => guardar(CLAVES.herramientas, [...herramientas]), [herramientas]);

  const m = tutorial.muebles[idx] || tutorial.muebles[0];
  const pasos = m.pasos;
  const i = pasos.findIndex((p) => p.id === abierto);
  const paso = i >= 0 ? pasos[i] : null;
  const hechosAqui = pasos.filter((p) => hechos.has(p.id)).length;
  const proximo = pasos.find((p) => !hechos.has(p.id));
  const completo = hechosAqui === pasos.length;

  // El 3D resalta las maderas del paso abierto
  useEffect(() => {
    if (!setPasoVivo) return undefined;
    setPasoVivo(paso ? { ids: paso.piezas.map((p) => p.id), titulo: paso.titulo, numero: i + 1, total: pasos.length } : null);
    return () => setPasoVivo(null);
  }, [paso && paso.id, m.grupo]);

  // Al cambiar de paso o de mueble se vuelve al principio de la hoja
  useEffect(() => {
    const el = tope.current && tope.current.closest('.contenido');
    if (el) el.scrollTo({ top: 0 });
  }, [abierto, idx]);

  const alternar = (set, setSet) => (k) =>
    setSet((prev) => {
      const sig = new Set(prev);
      if (sig.has(k)) sig.delete(k);
      else sig.add(k);
      return sig;
    });
  const alternarTarea = alternar(tareas, setTareas);
  const alternarHerramienta = alternar(herramientas, setHerramientas);

  const abrir = (id) => setAbierto(id);
  const hacerYSeguir = () => {
    if (!hechos.has(paso.id)) {
      setHechos((prev) => new Set(prev).add(paso.id));
      setNuevo(paso.id);
    }
    const sig = pasos[i + 1];
    setAbierto(sig ? sig.id : '');
  };
  const deshacer = () =>
    setHechos((prev) => {
      const sig = new Set(prev);
      sig.delete(paso.id);
      return sig;
    });

  const g = tutorial.generales;
  const tareasDe = (p) => p.hacer.filter((_, k) => tareas.has(`${p.id}:${k}`)).length;

  return (
    <div className={`armado ${paso ? 'en-paso' : 'en-mapa'}`} ref={tope}>
      <div className="a-muebles" role="tablist">
        {tutorial.muebles.map((x, k) => {
          const n = x.pasos.filter((p) => hechos.has(p.id)).length;
          return (
            <button
              key={x.grupo}
              role="tab"
              aria-selected={k === idx}
              className={k === idx ? 'activa' : ''}
              onClick={() => {
                setIdx(k);
                setAbierto('');
              }}
            >
              {x.titulo.replace('Mueble ', '').replace(/^./, (c) => c.toUpperCase())}
              <small>
                {n}/{x.pasos.length}
              </small>
            </button>
          );
        })}
      </div>

      {paso ? (
        <PasoAbierto
          paso={paso}
          numero={i + 1}
          total={pasos.length}
          tareas={tareas}
          alternarTarea={alternarTarea}
          hecho={hechos.has(paso.id)}
          hacerYSeguir={hacerYSeguir}
          anterior={() => setAbierto(pasos[i - 1].id)}
          hayAnterior={i > 0}
          alMapa={() => setAbierto('')}
          deshacer={deshacer}
          seleccion={seleccion}
          setSeleccion={setSeleccion}
          enfocar={enfocar}
          ver3D={ver3D}
          esMovil={esMovil}
        />
      ) : (
        <>
          <section className={`a-hero${completo ? ' completo' : ''}`}>
            <h2>{m.titulo}</h2>
            <p className="a-hero-texto">{m.resumen[0]}</p>
            <div className="a-escena">
              <dl className="a-datos">
                <div>
                  <dt>pasos</dt>
                  <dd>{pasos.length}</dd>
                </div>
                <div>
                  <dt>maderas</dt>
                  <dd>{m.cantidadPiezas}</dd>
                </div>
                <div>
                  <dt>herrajes</dt>
                  <dd>{m.cantidadHerrajes}</dd>
                </div>
              </dl>
              <Escalera pasos={pasos} hechos={hechos} actual={proximo && proximo.id} nuevo={nuevo} abrir={abrir} completo={completo} />
            </div>
            <div className="a-hero-pie">
              <button className="a-cta" onClick={() => abrir((proximo || pasos[0]).id)}>
                {completo ? 'Repasar desde el principio' : hechosAqui === 0 ? 'Empezar el armado' : `Seguir con el paso ${pasos.indexOf(proximo) + 1}`}
                <Icono n={completo ? 'bandera' : 'martillo'} />
              </button>
              <span className="a-hero-estado">{completo ? 'Mueble terminado' : `${hechosAqui} de ${pasos.length} pasos hechos`}</span>
            </div>
          </section>

          <section className="a-bloque a-resumen">
            <h3>En pocas palabras</h3>
            <ul className="a-lista">
              {m.resumen.map((x, k) => (
                <li key={k}>{x}</li>
              ))}
            </ul>
          </section>

          <Taller generales={g} herramientas={herramientas} alternarHerramienta={alternarHerramienta} />

          {m.esperar.length > 0 && (
            <details className="a-det a-falta">
              <summary>
                <span>Qué falta definir antes de armar</span>
                <span className="a-cuenta">{m.esperar.length}</span>
                <Icono n="abajo" />
              </summary>
              <ul className="a-lista a-lista-aviso">
                {m.esperar.map((x, k) => (
                  <li key={k}>
                    <Icono n="aviso" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <section className="a-bloque">
            <h3>Los {pasos.length} pasos</h3>
            <ol className="a-camino">
              {pasos.map((p, k) => {
                const ok = hechos.has(p.id);
                const ahora = proximo && proximo.id === p.id;
                const n = tareasDe(p);
                return (
                  <li key={p.id}>
                    <button className={`a-fila${ok ? ' hecho' : ''}${ahora ? ' ahora' : ''}`} onClick={() => abrir(p.id)}>
                      <span className="a-num">{ok ? <Icono n="check" /> : k + 1}</span>
                      <span className="a-fila-texto">
                        <span className="a-fila-titulo">{p.titulo}</span>
                        <span className="a-fila-meta">{ok ? 'Hecho' : p.hacer.length ? `${n} de ${p.hacer.length} tareas` : 'Sin tareas'}</span>
                      </span>
                      {ahora && <span className="a-ahora">Sigue este</span>}
                      <Icono n="der" />
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>

          <details className="a-det a-compras">
            <summary>
              <span>Qué comprar para este mueble</span>
              <span className="a-cuenta">{m.lista.herrajes.length + m.lista.fijaciones.length}</span>
              <Icono n="abajo" />
            </summary>
            <h4>Herrajes</h4>
            <ul className="a-cantidades">
              {m.lista.herrajes.map((h, k) => (
                <li key={k}>
                  <b>{h.cantidad}</b>
                  <span>
                    {h.nombre}
                    {h.nota && <small>{h.nota}</small>}
                  </span>
                </li>
              ))}
            </ul>
            <h4>Tornillos y fijaciones</h4>
            <p className="nota">Cantidades justas, sin el 10 % de margen.</p>
            <ul className="a-cantidades">
              {m.lista.fijaciones.map((h, k) => (
                <li key={k}>
                  <b>{h.cantidad}</b>
                  <span>{h.nombre}</span>
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </div>
  );
}
