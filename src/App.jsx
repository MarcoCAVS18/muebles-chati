import React, { useEffect, useMemo, useRef, useState } from 'react';
import { cargarProyecto, guardarProyecto } from './almacen.js';
import { firebaseActivo } from './firebase.js';
import { CONFIG_INICIAL, CARGAS_INICIALES, ELECTRICA_INICIAL } from './data/defaults.js';
import { construir } from './engine/construir.js';
import { planificar, pesoEstimado, listaDeCompras } from './engine/cortes.js';
import { resumenFijaciones } from './engine/fijaciones.js';
import { calcularElectrica } from './engine/electrica.js';
import { electrico3d } from './engine/electrico3d.js';
import { VERSION } from './almacen.js';
import Scene3D, { VISTAS } from './components/Scene3D.jsx';
import PanelElemento from './components/PanelElemento.jsx';
import PanelPieza from './components/PanelPieza.jsx';
import { Seccion, SECCIONES_CFG, escribir } from './components/Campos.jsx';
import { Despiece, Placas, Herrajes, Electrica, Compras } from './components/Paneles.jsx';

const TABS = ['Despiece', 'Placas y cortes', 'Herrajes', 'Eléctrica', 'Compras'];

// Mezcla lo guardado con los valores iniciales: solo se conservan las claves que existen hoy
function mezclar(base, guardado) {
  if (Array.isArray(base)) return Array.isArray(guardado) ? guardado : base;
  if (base && typeof base === 'object') {
    const salida = {};
    for (const k of Object.keys(base)) {
      salida[k] = guardado && k in guardado ? mezclar(base[k], guardado[k]) : base[k];
    }
    return salida;
  }
  return typeof guardado === typeof base ? guardado : base;
}

export default function App() {
  const [cfg, setCfg] = useState(CONFIG_INICIAL);
  const [cargas, setCargas] = useState(CARGAS_INICIALES);
  const [elec, setElec] = useState(ELECTRICA_INICIAL);
  const [tab, setTab] = useState(TABS[0]);
  const [seleccion, setSeleccion] = useState('');
  const [hover, setHover] = useState('');
  const [explosion, setExplosion] = useState(0);
  const [mostrarEquipos, setMostrarEquipos] = useState(true);
  const [mostrarArcos, setMostrarArcos] = useState(true);
  const [mostrarElectrico, setMostrarElectrico] = useState(true);
  const [mostrarAsientos, setMostrarAsientos] = useState(true);
  const [transparentar, setTransparentar] = useState(false);
  const [camaAbierta, setCamaAbierta] = useState(0);
  const [elemento, setElemento] = useState('');
  const [enfoque, setEnfoque] = useState(''); // id de la madera que se mira sola (doble clic)
  const [invertir, setInvertir] = useState(false);
  const [verContexto, setVerContexto] = useState(false);
  const [vista, setVista] = useState({ clave: 'foto', n: 0 });
  const [visibles, setVisibles] = useState({
    'Mueble trasero': true,
    Cama: true,
    'Mueble derecho': true,
  });

  const [nube, setNube] = useState(firebaseActivo ? 'cargando' : 'apagada');
  const listo = useRef(false);

  // Carga inicial desde Firestore
  useEffect(() => {
    if (!firebaseActivo) return;
    cargarProyecto()
      .then((p) => {
        if (p && p.datos) {
          const d = JSON.parse(p.datos);
          // Un guardado de un diseño anterior no sirve para el diseño nuevo
          if (d.version === VERSION) {
            if (d.cfg) {
              // Un guardado con la cama de 170 cm y la L de 670 mm pasa a la cama de 180 cm (placas de 1200 y 600 mm) y la L de 570 mm
              const { cama: cm, trasero: tr } = d.cfg;
              if (cm && tr && cm.largo === 1700 && tr.profundidadL === 670) {
                cm.largo = CONFIG_INICIAL.cama.largo;
                cm.largoCabecera = CONFIG_INICIAL.cama.largoCabecera;
                tr.profundidadL = CONFIG_INICIAL.trasero.profundidadL;
              }
              setCfg(mezclar(CONFIG_INICIAL, d.cfg));
            }
            if (Array.isArray(d.cargas)) setCargas(d.cargas);
            if (d.elec) setElec(mezclar(ELECTRICA_INICIAL, d.elec));
          }
        }
        listo.current = true;
        setNube('guardado');
      })
      .catch(() => {
        listo.current = true;
        setNube('error');
      });
  }, []);

  // Guardado automático con pausa de 1,5 s después del último cambio
  useEffect(() => {
    if (!firebaseActivo || !listo.current) return undefined;
    setNube('guardando');
    const id = setTimeout(() => {
      guardarProyecto({ cfg, cargas, elec })
        .then(() => setNube('guardado'))
        .catch(() => setNube('error'));
    }, 1500);
    return () => clearTimeout(id);
  }, [cfg, cargas, elec]);

  const data = useMemo(() => construir(cfg), [cfg]);
  const plan = useMemo(() => planificar(data.partes, cfg), [data, cfg]);
  const fijaciones = useMemo(() => resumenFijaciones(data.uniones, data.anclajes), [data]);
  const peso = useMemo(() => pesoEstimado(data.partes, cfg), [data, cfg]);
  const elec3d = useMemo(() => electrico3d(cfg), [cfg]);
  const resElec = useMemo(() => calcularElectrica(cargas, elec, elec3d.cables), [cargas, elec, elec3d]);
  const compras = useMemo(() => listaDeCompras(data, plan, cfg, resElec, elec3d), [data, plan, cfg, resElec, elec3d]);
  const elementos = useMemo(
    () => [...elec3d.equipos, ...data.equipos].map((e) => ({ id: e.id, nombre: e.nombre, nota: e.nota })),
    [elec3d, data]
  );

  const cambiar = (ruta, valor) => setCfg((c) => escribir(c, ruta, valor));

  // Modo pieza: doble clic en la madera (3D, despiece o plano de cortes); flechas para pasar de una a otra
  const enfocar = (id) => {
    setElemento('');
    setSeleccion(id);
    setInvertir(false);
    setEnfoque(id);
  };
  const salir = () => setEnfoque('');
  const ir = (paso) => {
    const lista = data.partes;
    const i = lista.findIndex((p) => p.id === enfoque);
    if (i >= 0) enfocar(lista[(i + paso + lista.length) % lista.length].id);
  };
  useEffect(() => {
    if (!enfoque) return undefined;
    const tecla = (e) => {
      if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName) && e.key !== 'Escape') return;
      if (e.key === 'Escape') salir();
      else if (e.key === 'ArrowRight') ir(1);
      else if (e.key === 'ArrowLeft') ir(-1);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  });
  // Si la pieza deja de existir al cambiar las medidas, se sale del modo pieza
  useEffect(() => {
    if (enfoque && !data.partes.some((p) => p.id === enfoque)) setEnfoque('');
  }, [data, enfoque]);
  // La fila de la pieza se acerca sola en la lista
  useEffect(() => {
    if (enfoque) document.getElementById(`fila-${enfoque}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [enfoque]);
  const parteSel = data.partes.find((p) => p.id === seleccion);
  const avisos = [...data.avisos, ...plan.lista.avisos];

  return (
    <div className="app">
      <aside className="lateral">
        <h1>La Chata</h1>
        <p className="nota">Muebles a medida. Medidas en mm.</p>
        {SECCIONES_CFG.map((s) => (
          <Seccion key={s.titulo} titulo={s.titulo} campos={s.campos} cfg={cfg} cambiar={cambiar} />
        ))}
        <button className="reset" onClick={() => setCfg(CONFIG_INICIAL)}>
          Volver a las medidas iniciales
        </button>
      </aside>

      <main className="centro">
        <div className="visor">
          <Scene3D
            data={data}
            elec3d={elec3d}
            tramos={resElec.tramos}
            van={cfg.van}
            visibles={visibles}
            explosion={explosion}
            mostrarEquipos={mostrarEquipos}
            mostrarArcos={mostrarArcos}
            mostrarElectrico={mostrarElectrico}
            mostrarAsientos={mostrarAsientos}
            seleccion={seleccion}
            setSeleccion={setSeleccion}
            elemento={elemento}
            setElemento={setElemento}
            setHover={setHover}
            vista={vista}
            transparentar={transparentar}
            camaAbierta={camaAbierta}
            enfoque={enfoque}
            setEnfoque={enfocar}
            invertir={invertir}
            verContexto={verContexto}
          />
          <div className="hud">
            <div className="controles">
              {data.grupos.map((g) => (
                <label key={g}>
                  <input
                    type="checkbox"
                    checked={visibles[g]}
                    onChange={(e) => setVisibles({ ...visibles, [g]: e.target.checked })}
                  />
                  {g}
                </label>
              ))}
              <label>
                <input type="checkbox" checked={mostrarEquipos} onChange={(e) => setMostrarEquipos(e.target.checked)} />
                Agua, cocina y gas
              </label>
              <label>
                <input type="checkbox" checked={mostrarElectrico} onChange={(e) => setMostrarElectrico(e.target.checked)} />
                Eléctrico y mangueras
              </label>
              <label>
                <input type="checkbox" checked={mostrarAsientos} onChange={(e) => setMostrarAsientos(e.target.checked)} />
                Asientos
              </label>
              <label>
                <input type="checkbox" checked={mostrarArcos} onChange={(e) => setMostrarArcos(e.target.checked)} />
                Pasarruedas
              </label>
              <label>
                <input type="checkbox" checked={transparentar} onChange={(e) => setTransparentar(e.target.checked)} />
                Ver interior
              </label>
              <label>
                Vista
                <select
                  value={vista.clave}
                  onChange={(e) => {
                    setEnfoque('');
                    setVista({ clave: e.target.value, n: vista.n + 1 });
                  }}
                >
                  {Object.entries(VISTAS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Cama: {Math.round((cfg.cama.ancho + cfg.cama.extension * camaAbierta) / 10)} cm
                <input type="range" min="0" max="1" step="0.05" value={camaAbierta} onChange={(e) => setCamaAbierta(parseFloat(e.target.value))} />
              </label>
              <label>
                Vista explotada
                <input type="range" min="0" max="1" step="0.05" value={explosion} onChange={(e) => setExplosion(parseFloat(e.target.value))} />
              </label>
            </div>
            {!enfoque && (
              <div className="info">
                {hover || (parteSel ? `${parteSel.id} - ${parteSel.nombre}` : 'Pasá el mouse sobre una pieza. Doble clic en una madera para verla sola. Clic en un equipo o cable eléctrico para ver el video.')}
              </div>
            )}
          </div>
          {enfoque && (
            <PanelPieza
              partes={data.partes}
              id={enfoque}
              cfg={cfg}
              invertir={invertir}
              setInvertir={setInvertir}
              verContexto={verContexto}
              setVerContexto={setVerContexto}
              ir={ir}
              salir={salir}
            />
          )}
          <PanelElemento
            id={elemento}
            elec3d={elec3d}
            dataEquipos={data.equipos}
            tramos={resElec.tramos}
            elec={elec}
            cerrar={() => setElemento('')}
          />
        </div>
        <div className="estado">
          <span>Peso aprox. de los muebles: {Math.round(peso)} kg</span>
          <span>{data.partes.length} piezas</span>
          <span className={nube === 'error' ? 'mal' : ''}>
            Nube:{' '}
            {{ apagada: 'sin configurar', cargando: 'cargando...', guardando: 'guardando...', guardado: 'guardado', error: 'error al sincronizar' }[nube]}
          </span>
          <span className={avisos.length ? 'mal' : 'bien'}>
            {avisos.length ? `${avisos.length} aviso(s)` : 'Sin interferencias'}
          </span>
        </div>
        {avisos.length > 0 && (
          <ul className="avisos">
            {avisos.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        )}
      </main>

      <section className="derecha">
        <nav>
          {TABS.map((t) => (
            <button key={t} className={t === tab ? 'activa' : ''} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </nav>
        <div className="contenido">
          {tab === 'Despiece' && <Despiece data={data} cfg={cfg} seleccion={seleccion} setSeleccion={setSeleccion} enfocar={enfocar} />}
          {tab === 'Placas y cortes' && <Placas plan={plan} cfg={cfg} seleccion={seleccion} setSeleccion={setSeleccion} enfocar={enfocar} />}
          {tab === 'Herrajes' && <Herrajes data={data} fijaciones={fijaciones} />}
          {tab === 'Eléctrica' && (
            <Electrica
              res={resElec}
              cargas={cargas}
              setCargas={setCargas}
              elec={elec}
              setElec={setElec}
              elementos={elementos}
              elemento={elemento}
              setElemento={setElemento}
            />
          )}
          {tab === 'Compras' && <Compras filas={compras} />}
        </div>
      </section>
    </div>
  );
}
