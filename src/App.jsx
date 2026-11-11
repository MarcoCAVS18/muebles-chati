import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SelectorIdioma from './components/SelectorIdioma.jsx';
import { traductor, traducirElec3d, traducirResultado, equipoT } from './i18n/electrico.js';
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
import Barra3D, { Leyenda, LeyendaEstado, LeyendaTornillos } from './components/Barra3D.jsx';
import PanelElemento from './components/PanelElemento.jsx';
import PanelPieza from './components/PanelPieza.jsx';
import PaletaColor from './components/PaletaColor.jsx';
import { Seccion, SECCIONES_CFG, escribir } from './components/Campos.jsx';
import { Despiece, Placas, Herrajes, Electrica, Compras } from './components/Paneles.jsx';
import { Armado } from './components/Armado.jsx';
import { armarTutorial } from './engine/tutorial.js';
import { armarSecuencia } from './engine/secuencia.js';
import { crearReproductor, useReproductor } from './util/reproductor.js';
import BarraArmado from './components/BarraArmado.jsx';
import { useEsMovil, TACTIL } from './util/pantalla.js';
import { Icono } from './components/Icono.jsx';
import { TENEMOS_INICIAL, STOCK_VERSION } from './data/stock.js';
import { estadoDe, esColorValido } from './engine/colores.js';
import { cuentaTornillos } from './engine/uniones.js';

const TABS = ['Despiece', 'Placas y cortes', 'Herrajes', 'Eléctrica', 'Armado', 'Compras'];
const ICONO_TAB = { Despiece: 'lista', 'Placas y cortes': 'hoja', Herrajes: 'llave', Eléctrica: 'rayo', Armado: 'libro', Compras: 'carrito' };

// Barra de abajo en el celular: el 3D, las medidas y las pestañas de la derecha
const ITEMS_MOVIL = [
  { clave: '3D', texto: 'vista3d', icono: 'cubo' },
  { clave: 'Medidas', texto: 'medidas', icono: 'regla' },
  { clave: 'Despiece', texto: 'despiece', icono: 'lista' },
  { clave: 'Placas y cortes', texto: 'cortes', icono: 'hoja' },
  { clave: 'Herrajes', texto: 'herrajes', icono: 'llave' },
  { clave: 'Eléctrica', texto: 'electrica', icono: 'rayo' },
  { clave: 'Armado', texto: 'armado', icono: 'libro' },
  { clave: 'Compras', texto: 'compras', icono: 'carrito' },
];
// Las pestañas se identifican por su nombre en español; el texto que se ve sale de las traducciones
const CLAVE_TAB = { Despiece: 'despiece', 'Placas y cortes': 'placas', Herrajes: 'herrajes', Eléctrica: 'electrica', Armado: 'armado', Compras: 'compras' };

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
  const { t, i18n } = useTranslation();
  const lng = i18n.resolvedLanguage;
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
  const [verTornillos, setVerTornillos] = useState(false); // dibuja cada tornillo de las uniones en su lugar
  const [camaAbierta, setCamaAbierta] = useState(0);
  const [elemento, setElemento] = useState('');
  const [enfoque, setEnfoque] = useState(''); // id de la madera que se mira sola (doble clic)
  const [invertir, setInvertir] = useState(false);
  const [verContexto, setVerContexto] = useState(false);
  const [vista, setVista] = useState({ clave: 'foto', n: 0 });
  const [pasoVivo, setPasoVivo] = useState(null); // paso del Armado que está abierto: sus piezas se ven rosa en el 3D
  const esMovil = useEsMovil();
  const [panel, setPanel] = useState('3D'); // en el celular: '3D', 'Medidas' o 'Tabs' (las pestañas de la derecha)
  const [abierto, setAbierto] = useState(0); // cajones y puertas: 0 cerrados, 1 abiertos
  const [cotas, setCotas] = useState(false);
  const [colores, setColores] = useState(true); // colores por rol de la madera
  const [estado, setEstado] = useState(false); // dos colores: la madera que ya tenemos y la que falta
  const [tenemos, setTenemos] = useState(TENEMOS_INICIAL); // ids de las maderas que ya están
  const [colorPiezas, setColorPiezas] = useState({}); // color pastel elegido a mano para cada madera: { id: '#rrggbb' }
  // El modo sale de los controles, así que los controles finos y los tres botones siempre coinciden
  const modo = explosion > 0.02 ? 'explotado' : abierto > 0.02 || camaAbierta > 0.02 ? 'abierto' : 'armado';
  const elegirModo = (m) => {
    setExplosion(m === 'explotado' ? 0.5 : 0);
    setAbierto(m === 'abierto' ? 1 : 0);
    setCamaAbierta(m === 'abierto' ? 1 : 0);
  };
  const [reserva, setReserva] = useState({ y: 0, x: 0, derecha: 0 }); // lo que tapa la tarjeta del modo pieza, en px
  const origen = useRef(null); // panel desde el que se abrió una pieza o un equipo, para volver a él
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
              // Un guardado con la cama de 90 cm (bandejas de 500 mm, plataforma a 44 cm) pasa a la de 71 cm
              if (cm && cm.ancho === 900 && cm.extension === 300 && cm.bandejaAncho === 500) {
                for (const k of ['ancho', 'extension', 'plataforma']) cm[k] = CONFIG_INICIAL.cama[k];
              }
              // La cama de bandejas pasa a la de varillas en peine: la superficie queda a 400 mm (con 5 mm de fieltro) y el cabezal de las ventanas a 40 mm
              if (cm) {
                if (cm.plataforma === 395) cm.plataforma = CONFIG_INICIAL.cama.plataforma;
                if (cm.ventana && cm.ventana.cabezal === 50) cm.ventana.cabezal = CONFIG_INICIAL.cama.ventana.cabezal;
                if (cm.ranura && cm.ranura.dedo === undefined && (cm.ranura.ancho !== undefined || cm.ranura.margen !== undefined)) cm.ranura = { ...CONFIG_INICIAL.cama.ranura };
                delete cm.bandejaAncho;
                delete cm.huecoMueble;
                delete cm.cajonCabecera;
                delete cm.cajonPie;
                // El peine de 8 y 4 ranuras repartidas en la bahía pasa al de ranuras de 100 mm (6 en la cabecera y 3 en el pie); con otra
                // cantidad se conserva el reparto de antes (ancho 0)
                if (cm.ranura && cm.ranura.ancho === undefined) {
                  if (cm.varillasCabecera === 8 && cm.varillasPie === 4) {
                    cm.varillasCabecera = CONFIG_INICIAL.cama.varillasCabecera;
                    cm.varillasPie = CONFIG_INICIAL.cama.varillasPie;
                  } else {
                    cm.ranura.ancho = 0;
                  }
                }
              }
              // Un guardado con el mueble de 1720 mm (secciones de 617 y 1087) pasa al de 1560 mm, con la heladera de la G22 y el anafe angosto
              const mt = d.cfg.trasero;
              if (mt && mt.ancho === 1720 && mt.divisor1 === 617 && mt.divisor2 === 1087) {
                mt.ancho = CONFIG_INICIAL.trasero.ancho;
                mt.divisor1 = CONFIG_INICIAL.trasero.divisor1;
                mt.divisor2 = CONFIG_INICIAL.trasero.divisor2;
              }
              const ne = d.cfg.equipos && d.cfg.equipos.nevera;
              if (ne && ne.x === 420 && ne.y === 300 && ne.z === 340) d.cfg.equipos.nevera = { ...CONFIG_INICIAL.equipos.nevera };
              const an = d.cfg.equipos && d.cfg.equipos.anafe;
              if (an && an.x === 420 && an.y === 55 && an.z === 300) d.cfg.equipos.anafe = { ...CONFIG_INICIAL.equipos.anafe };
              // Un guardado con el bidón de 215 x 400 x 290 pasa al bidón plano de 416 x 203 x 408
              const bd = d.cfg.equipos && d.cfg.equipos.bidon;
              if (bd && bd.x === 215 && bd.y === 400 && bd.z === 290) d.cfg.equipos.bidon = { ...CONFIG_INICIAL.equipos.bidon };
              setCfg(mezclar(CONFIG_INICIAL, d.cfg));
            }
            // Un guardado viejo no trae los consumos nuevos: se suman los que falten
            if (Array.isArray(d.cargas)) setCargas([...d.cargas, ...CARGAS_INICIALES.filter((c) => !d.cargas.some((g) => g.id === c.id))]);
            if (d.elec) setElec(mezclar(ELECTRICA_INICIAL, d.elec));
            if (d.colorPiezas && typeof d.colorPiezas === 'object') {
              setColorPiezas(Object.fromEntries(Object.entries(d.colorPiezas).filter(([, v]) => esColorValido(v))));
            }
            // Si la lista inicial creció desde que se guardó, las maderas nuevas se suman una vez
            if (Array.isArray(d.tenemos)) {
              const ids = d.tenemos.filter((x) => typeof x === 'string');
              setTenemos(d.stockV === STOCK_VERSION ? ids : [...new Set([...ids, ...TENEMOS_INICIAL])]);
            }
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
      guardarProyecto({ cfg, cargas, elec, tenemos, colorPiezas })
        .then(() => setNube('guardado'))
        .catch(() => setNube('error'));
    }, 1500);
    return () => clearTimeout(id);
  }, [cfg, cargas, elec, tenemos, colorPiezas]);

  const data = useMemo(() => construir(cfg), [cfg]);
  const conjuntoTenemos = useMemo(() => new Set(tenemos), [tenemos]);
  const pintarPieza = (id, color) =>
    setColorPiezas((m) => {
      const n = { ...m };
      if (color) n[id] = color;
      else delete n[id];
      return n;
    });
  const alternarTenemos = (id) => setTenemos((lista) => (lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]));
  const cuentasEstado = useMemo(() => {
    const c = { tenemos: 0, falta: 0 };
    for (const p of data.partes) c[estadoDe(p, conjuntoTenemos)] += 1;
    return c;
  }, [data, conjuntoTenemos]);
  const cuentasTornillos = useMemo(() => cuentaTornillos(data.tornillos), [data]);
  const plan = useMemo(() => planificar(data.partes, cfg), [data, cfg]);
  const fijaciones = useMemo(() => resumenFijaciones(data.uniones, data.anclajes, data.juntas), [data]);
  const peso = useMemo(() => pesoEstimado(data.partes, cfg), [data, cfg]);
  const elec3d = useMemo(() => electrico3d(cfg), [cfg]);
  const resElec = useMemo(() => calcularElectrica(cargas, elec, elec3d.cables), [cargas, elec, elec3d]);
  // Lo eléctrico, el agua y el gas se calculan con los textos originales y se muestran en el idioma elegido
  const tx = useMemo(() => traductor(i18n), [lng]);
  const elec3dT = useMemo(() => traducirElec3d(elec3d, tx, cfg), [elec3d, tx, cfg]);
  const resElecT = useMemo(() => traducirResultado(resElec, tx, elec3dT), [resElec, tx, elec3dT]);
  const equiposT = useMemo(() => data.equipos.map((e) => equipoT(tx, e)), [data, tx]);
  const tutorial = useMemo(() => armarTutorial(data, plan, cfg, elec3d), [data, plan, cfg, elec3d]);
  // Armado animado: la secuencia de cada mueble sale de los pasos del tutorial y de las uniones
  const secuencias = useMemo(() => Object.fromEntries(tutorial.muebles.map((mu) => [mu.grupo, armarSecuencia(data, mu)])), [data, tutorial]);
  const reproductor = useMemo(() => crearReproductor(), []);
  const armado = useReproductor(reproductor);
  useEffect(() => {
    // Si cambia una medida mientras se reproduce, la secuencia vieja ya no sirve
    reproductor.cerrar();
  }, [secuencias, reproductor]);
  const compras = useMemo(() => listaDeCompras(data, plan, cfg, resElec, elec3d), [data, plan, cfg, resElec, elec3d]);
  const elementos = useMemo(
    () => [...elec3dT.equipos, ...equiposT].map((e) => ({ id: e.id, nombre: e.nombre, nota: e.nota })),
    [elec3dT, equiposT]
  );

  const cambiar = (ruta, valor) => setCfg((c) => escribir(c, ruta, valor));

  // Modo pieza: doble clic en la madera (3D, despiece o plano de cortes); flechas para pasar de una a otra
  // En el celular el 3D y las listas no se ven a la vez: se pasa al 3D y al cerrar se vuelve a la lista
  const aPanel3D = () => {
    if (esMovil && panel !== '3D') {
      origen.current = panel;
      setPanel('3D');
    }
  };
  const volverDel3D = () => {
    if (origen.current) {
      setPanel(origen.current);
      origen.current = null;
    }
  };
  const enfocar = (id) => {
    setElemento('');
    setSeleccion(id);
    setInvertir(false);
    aPanel3D();
    setEnfoque(id);
  };
  const salir = () => {
    setEnfoque('');
    volverDel3D();
  };
  const abrirElemento = (id) => {
    setElemento(id);
    if (id) aPanel3D();
  };
  const cerrarElemento = () => {
    setElemento('');
    volverDel3D();
  };
  const irA = (clave) => {
    if (enfoque) setEnfoque('');
    setElemento('');
    origen.current = null;
    if (clave === '3D' || clave === 'Medidas') setPanel(clave);
    else {
      if (clave !== tab || panel !== 'Tabs') requestAnimationFrame(() => document.querySelector('.contenido')?.scrollTo(0, 0));
      setTab(clave);
      setPanel('Tabs');
    }
  };
  const animar = (grupo, pasoId = '') => {
    if (!secuencias[grupo]) return;
    setEnfoque('');
    setElemento('');
    setSeleccion('');
    if (esMovil) setPanel('3D');
    reproductor.abrir(secuencias[grupo], pasoId);
  };
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
  // Cuánto tapa la tarjeta del modo pieza (abajo, o a un costado en el celular apaisado): el 3D encuadra la pieza en el resto
  useEffect(() => {
    if (!enfoque) return undefined;
    const visor = document.querySelector('.visor');
    const tarjeta = visor && visor.querySelector('.enfoque');
    if (!tarjeta) return undefined;
    const medir = () => {
      const lateral = tarjeta.offsetWidth < visor.offsetWidth * 0.7;
      const barra = visor.querySelector('.hud-arriba');
      const arriba = barra && !esMovil ? barra.offsetTop + barra.offsetHeight : 0;
      const abajo = lateral ? 0 : tarjeta.offsetHeight + 12;
      const derecha = lateral ? tarjeta.offsetWidth + 12 : 0;
      setReserva({ y: (abajo - arriba) / 2, x: derecha / 2, derecha });
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(tarjeta);
    ro.observe(visor);
    return () => ro.disconnect();
  }, [!!enfoque, esMovil]);

  const parteSel = data.partes.find((p) => p.id === seleccion);
  const resaltadas = useMemo(() => (tab === 'Armado' && pasoVivo && pasoVivo.ids.length ? new Set(pasoVivo.ids) : null), [tab, pasoVivo]);
  const avisos = [...data.avisos, ...plan.lista.avisos];

  return (
    <div className={`app${esMovil ? ' movil' : ''}${enfoque ? ' en-enfoque' : ''}`} data-panel={panel}>
      {esMovil && (
        <header className="cabecera-movil">
          <b>{t('app.nombre')}</b>
          <div className="cabecera-derecha">
            <SelectorIdioma />
            <span className={`chip-nube${nube === 'error' ? ' mal' : ''}`}>{t(`nube.${nube}`)}</span>
          </div>
        </header>
      )}
      <aside className="lateral">
        <div className="titulo-lateral">
          <h1>{t('app.nombre')}</h1>
          <SelectorIdioma />
        </div>
        <p className="nota">{t('app.subtitulo')}</p>
        {SECCIONES_CFG.map((s) => (
          <Seccion key={s.clave} clave={s.clave} titulo={s.titulo} campos={s.campos} cfg={cfg} cambiar={cambiar} />
        ))}
        <button className="reset" onClick={() => setCfg(CONFIG_INICIAL)}>
          {t('app.volverMedidas')}
        </button>
      </aside>

      <main className="centro">
        <div className="visor">
          <Scene3D
            data={data}
            equiposT={equiposT}
            elec3d={elec3dT}
            tramos={resElecT.tramos}
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
            setElemento={abrirElemento}
            setHover={setHover}
            vista={vista}
            transparentar={transparentar}
            camaAbierta={camaAbierta}
            abierto={abierto}
            cotas={cotas}
            colores={colores}
            verTornillos={verTornillos}
            estadoMadera={estado}
            tenemos={conjuntoTenemos}
            colorPiezas={colorPiezas}
            enfoque={enfoque}
            setEnfoque={enfocar}
            invertir={invertir}
            verContexto={verContexto}
            reserva={reserva}
            visible={!esMovil || panel === '3D'}
            resaltadas={resaltadas}
            armado={armado}
            reproductor={reproductor}
          />
          <div className="hud">
            <Barra3D
              vistas={VISTAS}
              vista={vista}
              cambiarVista={(clave) => {
                setEnfoque('');
                setVista({ clave, n: vista.n + 1 });
              }}
              modo={modo}
              elegirModo={elegirModo}
              cotas={cotas}
              setCotas={setCotas}
              colores={colores}
              setColores={setColores}
              estado={estado}
              setEstado={setEstado}
              cuentasEstado={cuentasEstado}
              grupos={data.grupos}
              visibles={visibles}
              setVisibles={setVisibles}
              capas={[
                { etiqueta: t('capas.equipos'), valor: mostrarEquipos, poner: setMostrarEquipos },
                { etiqueta: t('capas.electrico'), valor: mostrarElectrico, poner: setMostrarElectrico },
                { etiqueta: t('capas.asientos'), valor: mostrarAsientos, poner: setMostrarAsientos },
                { etiqueta: t('capas.pasarruedas'), valor: mostrarArcos, poner: setMostrarArcos },
                { etiqueta: t('capas.interior'), valor: transparentar, poner: setTransparentar },
                { etiqueta: t('capas.tornillos'), valor: verTornillos, poner: setVerTornillos },
              ]}
              camaTexto={t('info.camaTexto', { cm: Math.round((cfg.cama.ancho + cfg.cama.extension * camaAbierta) / 10) })}
              camaAbierta={camaAbierta}
              setCamaAbierta={setCamaAbierta}
              abierto={abierto}
              setAbierto={setAbierto}
              explosion={explosion}
              setExplosion={setExplosion}
              derecha={
                resaltadas && esMovil ? (
                  <button className="pill-cta volver-paso" onClick={() => irA('Armado')}>
                    <Icono n="izq" />
                    {t('app.paso', { n: pasoVivo.numero })}
                  </button>
                ) : tab === 'Armado' && !esMovil ? null : (
                  <button className="pill-cta" onClick={() => irA('Armado')}>
                    <Icono n="martillo" />
                    {t('app.comoSeArma')}
                  </button>
                )
              }
            />
            {!enfoque && !armado.activo && (
              <div className="hud-abajo">
                {verTornillos && !resaltadas ? <LeyendaTornillos cuentas={cuentasTornillos} /> : estado && !resaltadas ? <LeyendaEstado cuentas={cuentasEstado} /> : colores && !resaltadas && <Leyenda />}
                {parteSel && <PaletaColor id={parteSel.id} actual={colorPiezas[parteSel.id]} elegir={pintarPieza} estado={estado} />}
                <div className="info">
                {hover ||
                  (parteSel
                    ? `${parteSel.id} - ${parteSel.nombre}`
                    : resaltadas
                      ? t('info.paso', { numero: pasoVivo.numero, total: pasoVivo.total, titulo: pasoVivo.titulo })
                      : TACTIL
                      ? t('info.tactil')
                      : t('info.mouse'))}
                </div>
              </div>
            )}
          </div>
          {armado.activo && <BarraArmado rep={reproductor} data={data} />}
          {enfoque && (
            <PanelPieza
              partes={data.partes}
              uniones={data.juntasPorPieza}
              id={enfoque}
              cfg={cfg}
              invertir={invertir}
              setInvertir={setInvertir}
              verContexto={verContexto}
              setVerContexto={setVerContexto}
              tenemos={conjuntoTenemos}
              alternarTenemos={alternarTenemos}
              ir={ir}
              salir={salir}
            />
          )}
          <PanelElemento
            id={elemento}
            elec3d={elec3dT}
            dataEquipos={equiposT}
            tramos={resElecT.tramos}
            elec={elec}
            cerrar={cerrarElemento}
          />
        </div>
        <div className="estado">
          <span>{t('barraEstado.peso', { kg: Math.round(peso) })}</span>
          <span>{t('barraEstado.piezas', { count: data.partes.length })}</span>
          <span className={`nube${nube === 'error' ? ' mal' : ''}`}>{t('barraEstado.nube', { estado: t(`nubeLarga.${nube}`) })}</span>
          <span className={avisos.length ? 'mal' : 'bien'}>
            {avisos.length ? t('barraEstado.avisos', { count: avisos.length }) : t('barraEstado.sinInterferencias')}
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
          {TABS.map((nombre) => (
            <button key={nombre} className={nombre === tab ? 'activa' : ''} onClick={() => setTab(nombre)}>
              <Icono n={ICONO_TAB[nombre]} />
              {t(`tabs.${CLAVE_TAB[nombre]}`)}
            </button>
          ))}
        </nav>
        <div className="contenido">
          {tab === 'Despiece' && <Despiece data={data} cfg={cfg} seleccion={seleccion} setSeleccion={setSeleccion} enfocar={enfocar} />}
          {tab === 'Placas y cortes' && <Placas plan={plan} cfg={cfg} partes={data.partes} seleccion={seleccion} setSeleccion={setSeleccion} enfocar={enfocar} />}
          {tab === 'Herrajes' && <Herrajes data={data} fijaciones={fijaciones} />}
          {tab === 'Eléctrica' && (
            <Electrica
              res={resElecT}
              cargas={cargas}
              setCargas={setCargas}
              elec={elec}
              setElec={setElec}
              elementos={elementos}
              elemento={elemento}
              setElemento={abrirElemento}
            />
          )}
          {tab === 'Armado' && <Armado tutorial={tutorial} seleccion={seleccion} setSeleccion={setSeleccion} enfocar={enfocar} setPasoVivo={setPasoVivo} ver3D={() => irA('3D')} esMovil={esMovil} secuencias={secuencias} animar={animar} />}
          {tab === 'Compras' && <Compras filas={compras} />}
        </div>
      </section>

      {esMovil && (
        <nav className="barra-movil" aria-label={t('app.secciones')}>
          {ITEMS_MOVIL.map((it) => {
            const activo = it.clave === '3D' ? panel === '3D' : it.clave === 'Medidas' ? panel === 'Medidas' : panel === 'Tabs' && tab === it.clave;
            return (
              <button key={it.clave} className={activo ? 'activa' : ''} onClick={() => irA(it.clave)} aria-current={activo ? 'page' : undefined}>
                <Icono n={it.icono} />
                <span>{t(`movil.${it.texto}`)}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
