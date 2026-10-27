import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Caja, PlacaCortada, COLORES, aplicarFade, m, tieneContorno } from './Piezas3D.jsx';
import { PiezaEnfoque, AnotacionesDe, aMundo } from './Enfoque.jsx';
import { posarCamara } from '../engine/enfoque.js';
import { useDobleToque, TACTIL } from '../util/pantalla.js';

const COLOR_CABLE = {
  dc: { pos: '#d32f2f', neg: '#212121' },
  ac: { pos: '#8d6e63', neg: '#1976d2' },
  senal: { pos: '#9e9e9e', neg: '#9e9e9e' },
  agua: { pos: '#29b6f6', neg: null },
  gas: { pos: '#ff9800', neg: null },
};

// El modelo usa x = 0 en la pared izquierda mirando hacia los asientos (eje que no es el de three.js).
// Se espeja el eje x al dibujar para que izquierda y derecha se vean como en la van real.
// Por eso en las vistas la coordenada x del mundo es el negativo de la x de la van.
export const VISTAS = {
  foto: { nombre: 'Como la foto', pos: [3.3, 3.4, -0.6], target: [-0.86, 0.3, 1.35] },
  trasera: { nombre: 'Desde la puerta trasera', pos: [-0.86, 1.3, -2.7], target: [-0.86, 0.55, 1.6] },
  arriba: { nombre: 'Desde arriba', pos: [-0.86, 4.6, 1.25], target: [-0.86, 0, 1.2] },
  cabecera: { nombre: 'Mueble trasero (completo)', pos: [-0.86, 1.1, -0.35], target: [-0.86, 0.5, 2.2] },
  agua: { nombre: 'Agua: fregadero y bidones', pos: [-1.4, 1.2, 0.6], target: [-1.4, 0.45, 2.2] },
  cocina: { nombre: 'Cocina: anafe y gas', pos: [-0.86, 1.2, 0.6], target: [-0.86, 0.45, 2.2] },
  electrico: { nombre: 'Zona eléctrica (ver interior)', pos: [-0.35, 1.2, 0.6], target: [-0.35, 0.4, 2.2] },
  techo: { nombre: 'Techo: tiras LED y extractor', pos: [-0.86, 0.5, 0.1], target: [-0.86, 1.25, 1.6] },
  lampara: { nombre: 'Lámpara flexible (pared izquierda)', pos: [-1.1, 1.0, 0.3], target: [-0.04, 0.8, 1.23] },
  botones: { nombre: 'Botones push (frente del mueble trasero)', pos: [-0.9, 0.95, 0.9], target: [-0.9, 0.45, 1.9] },
  asientos: { nombre: 'Batería del auto (bajo el asiento)', pos: [-0.5, 1.5, 3.7], target: [-1.35, 0.2, 2.75] },
};

const FOTO_VERTICAL = { pos: [1.7, 4.3, -3.1], target: [-0.86, 0.2, 1.35] };

// Cámara: salta a una vista guardada y vuela (con arco y frenado suave) hacia la pieza elegida y de vuelta
const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function Camara({ vista, controles, anim, previa }) {
  const { camera, size } = useThree();
  const medido = size.width > 0 && size.height > 0;
  const aspecto = medido ? size.width / size.height : 1;
  useEffect(() => {
    const angosta = aspecto < 0.8;
    // En una pantalla angosta (celular en vertical) la foto se toma mirando a lo largo de la van para llenar el alto
    const v = angosta && vista.clave === 'foto' ? FOTO_VERTICAL : VISTAS[vista.clave] || VISTAS.foto;
    anim.current = null;
    previa.current = null;
    // En las demás vistas la cámara se aleja para que entre todo el ancho
    const k = angosta && vista.clave === 'foto' ? 1 : Math.min(2, Math.max(1, 0.8 / aspecto));
    const pos = new THREE.Vector3(...v.pos);
    const tgt = new THREE.Vector3(...v.target);
    pos.sub(tgt).multiplyScalar(k).add(tgt);
    camera.position.copy(pos);
    if (controles.current) {
      controles.current.target.copy(tgt);
      controles.current.update();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista, camera, controles, anim, previa, medido]);
  useFrame((_, dt) => {
    const a = anim.current;
    if (!a || !controles.current) return;
    a.t += Math.min(dt, 0.05);
    const k = Math.min(1, a.t / a.dur);
    const e = suave(k);
    // El destino se desplaza en línea recta y la cámara gira alrededor de él cambiando la distancia
    const objetivo = new THREE.Vector3().lerpVectors(a.t0, a.t1, e);
    const q = new THREE.Quaternion().slerp(a.giro, e);
    const dir = a.d0.clone().applyQuaternion(q);
    const largo = THREE.MathUtils.lerp(a.l0, a.l1, e);
    camera.position.copy(objetivo).addScaledVector(dir, largo);
    controles.current.target.copy(objetivo);
    controles.current.update();
    if (k >= 1) anim.current = null;
  });
  return null;
}

// Un tramo recto de cable: cilindro entre dos puntos
function Tramo({ a, b, r, color, emisivo }) {
  const { pos, quat, largo } = useMemo(() => {
    const va = new THREE.Vector3(m(a[0]), m(a[1]), m(a[2]));
    const vb = new THREE.Vector3(m(b[0]), m(b[1]), m(b[2]));
    const dir = vb.clone().sub(va);
    const largo = dir.length();
    const quat = new THREE.Quaternion();
    if (largo > 1e-6) quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return { pos: va.clone().add(vb).multiplyScalar(0.5), quat, largo };
  }, [a, b]);
  if (largo < 1e-6) return null;
  return (
    <mesh position={pos} quaternion={quat}>
      <cylinderGeometry args={[m(r), m(r), largo, 10]} />
      <meshStandardMaterial color={color} emissive={emisivo ? color : '#000000'} emissiveIntensity={emisivo ? 0.5 : 0} />
    </mesh>
  );
}

function Cable({ cable, seccion, elegido, onClick, onOver, onOut }) {
  const col = COLOR_CABLE[cable.tipo];
  // El grosor dibujado sale de la sección calculada (no es a escala real)
  const r = cable.tipo === 'agua' || cable.tipo === 'gas' ? 6 : 1.5 + Math.sqrt(seccion || 1.5) * 0.75;
  const juegos = [{ pts: cable.puntos, color: col.pos }];
  if (col.neg) juegos.push({ pts: cable.puntos.map((p) => [p[0] + 14, p[1], p[2] + 14]), color: col.neg });
  return (
    <group onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
      {juegos.map((j, k) =>
        j.pts.slice(1).map((p, i) => (
          <React.Fragment key={`${k}-${i}`}>
            <Tramo a={j.pts[i]} b={p} r={r} color={elegido ? '#ff7043' : j.color} emisivo={elegido} />
            <mesh position={[m(p[0]), m(p[1]), m(p[2])]}>
              <sphereGeometry args={[m(r), 10, 8]} />
              <meshStandardMaterial color={elegido ? '#ff7043' : j.color} />
            </mesh>
          </React.Fragment>
        ))
      )}
    </group>
  );
}

function Deco({ d, onOver, onOut }) {
  if (d.forma === 'boton') {
    // Botón push redondo: aro contra el frente y botón negro que sobresale. La caja (x, y, z, sx, sy, sz) lo contiene
    // y eje dice hacia dónde sale; el eje y local del cilindro apunta hacia afuera del frente.
    const sg = d.eje[1] === '+' ? 1 : -1;
    const rot = d.eje[0] === 'x' ? [0, 0, -sg * Math.PI / 2] : [sg * Math.PI / 2, 0, 0];
    const largo = d.eje[0] === 'x' ? d.sx : d.sz;
    const aro = 3;
    const rBoton = d.sy / 2;
    return (
      <group position={[m(d.x + d.sx / 2), m(d.y + d.sy / 2), m(d.z + d.sz / 2)]} rotation={rot} onPointerOver={onOver} onPointerOut={onOut}>
        <mesh position={[0, m(-largo / 2 + aro / 2), 0]}>
          <cylinderGeometry args={[m(rBoton + 3), m(rBoton + 3), m(aro), 28]} />
          <meshStandardMaterial color="#3a3a3a" />
        </mesh>
        <mesh position={[0, m(-largo / 2 + aro + (largo - aro) / 2), 0]}>
          <cylinderGeometry args={[m(rBoton), m(rBoton), m(largo - aro), 28]} />
          <meshStandardMaterial color={d.color} roughness={0.35} />
        </mesh>
      </group>
    );
  }
  if (d.forma === 'arco') {
    // Medio cilindro oscuro: marca la abertura en arco del frente de la caja del pie
    return (
      <mesh position={[m(d.cx), m(d.cy), m(d.z + d.sz / 2)]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[m(d.radio), m(d.radio), m(d.sz), 32, 1, false, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color="#2b2118" />
      </mesh>
    );
  }
  return <Caja x={d.x} y={d.y} z={d.z} sx={d.sx} sy={d.sy} sz={d.sz} color={d.color} bordes={null} />;
}

function Escena(props) {
  const {
    data, elec3d, tramos, van, visibles, explosion, mostrarEquipos, mostrarArcos, mostrarElectrico, mostrarAsientos,
    seleccion, setSeleccion, elemento, setElemento, setHover, vista, transparentar, camaAbierta,
    enfoque, setEnfoque, invertir, verContexto, reserva,
  } = props;
  const esDoble = useDobleToque();
  const controles = useRef();
  const anim = useRef(null); // vuelo de la cámara en curso
  const previa = useRef(null); // vista que había antes de entrar al modo pieza
  const grupoCtx = useRef(); // todo lo que no es la pieza elegida: se desvanece en el modo pieza
  const fade = useRef(1);
  const luzCamara = useRef();
  const { camera, size } = useThree();
  const foco = enfoque;
  const activo = !!foco;

  // Centro de cada grupo para separar las piezas al "explotar" la vista
  const centros = useMemo(() => {
    const acc = {};
    for (const p of data.partes) {
      const c = (acc[p.grupo] = acc[p.grupo] || { x: 0, y: 0, z: 0, n: 0 });
      c.x += p.x + p.sx / 2;
      c.y += p.y + p.sy / 2;
      c.z += p.z + p.sz / 2;
      c.n += 1;
    }
    for (const k of Object.keys(acc)) {
      acc[k] = { x: acc[k].x / acc[k].n, y: acc[k].y / acc[k].n, z: acc[k].z / acc[k].n };
    }
    return acc;
  }, [data]);

  const desplazar = (p, grupo) => {
    const c = centros[grupo];
    if (!explosion || !c) return p;
    return {
      ...p,
      x: p.x + (p.x + p.sx / 2 - c.x) * explosion,
      y: p.y + (p.y + p.sy / 2 - c.y) * explosion,
      z: p.z + (p.z + p.sz / 2 - c.z) * explosion,
    };
  };

  // Posición actual de una pieza: con la vista explotada y con las bandejas de la cama abiertas
  const colocada = (p) => {
    const q = { ...desplazar(p, p.grupo) };
    if (p.ext) q.x += (data.layout.cama?.extension || 0) * camaAbierta;
    if (p.recorte) {
      const dx = q.x - p.x;
      const dz = q.z - p.z;
      q.recorte = { ...p.recorte, x0: p.recorte.x0 + dx, x1: p.recorte.x1 + dx, z0: p.recorte.z0 + dz, z1: p.recorte.z1 + dz };
    }
    return q;
  };

  // Modo pieza: la pieza que se muestra, desde dónde se mira y qué piezas siguen en escena mientras se van o llegan
  const parteFoco = useMemo(() => data.partes.find((p) => p.id === foco), [data, foco]);
  const camFoco = useMemo(
    () =>
      parteFoco
        ? posarCamara(colocada(parteFoco), { invertir, xMedio: van.ancho / 2, aspecto: (size.width - (reserva?.derecha || 0)) / size.height, fovDeg: camera.fov })
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parteFoco, explosion, camaAbierta, invertir, van.ancho, size.width, size.height, reserva?.derecha]
  );
  const [vivas, setVivas] = useState([]);
  const entradas = useRef({});
  const [anotId, setAnotId] = useState('');
  const quitar = useCallback((id) => setVivas((v) => v.filter((i) => i !== id)), []);

  useEffect(() => {
    if (!foco) return;
    setVivas((v) => {
      if (v.includes(foco)) return v;
      const primera = fade.current > 0.9; // viene de la escena completa: la pieza ya está ahí y no hace falta hacerla aparecer
      entradas.current[foco] = { alfaInicial: primera ? 1 : 0, retraso: primera ? 0 : 0.3, desdeSeleccion: primera };
      return [...v, foco];
    });
  }, [foco]);

  // Las cotas aparecen cuando la cámara ya llegó (se avisa desde el cuadro de animación)
  const esperaCotas = useRef('');
  useEffect(() => {
    setAnotId('');
    esperaCotas.current = foco;
  }, [foco, invertir]);

  // Vuelo de la cámara hacia la pieza, de una pieza a la otra y de vuelta a la vista anterior.
  // Arranca en el primer cuadro después del cambio, cuando ya se midió cuánto tapa la tarjeta de abajo.
  const arranque = useRef(false);
  useEffect(() => {
    arranque.current = true;
  }, [foco, invertir]);
  const lanzarVuelo = () => {
    const c = controles.current;
    if (!c) return;
    let destino = null;
    if (camFoco) {
      if (!previa.current) previa.current = { pos: camera.position.clone(), target: c.target.clone() };
      destino = { pos: new THREE.Vector3(...aMundo(camFoco.pos)), target: new THREE.Vector3(...aMundo(camFoco.ctr)) };
    } else if (previa.current) {
      destino = previa.current;
      previa.current = null;
    }
    if (!destino) return;
    const t0 = c.target.clone();
    const d0v = camera.position.clone().sub(t0);
    const d1v = destino.pos.clone().sub(destino.target);
    const d0 = d0v.clone().normalize();
    const d1 = d1v.clone().normalize();
    anim.current = { t: 0, dur: 1.0, t0, t1: destino.target.clone(), d0, l0: d0v.length(), l1: d1v.length(), giro: new THREE.Quaternion().setFromUnitVectors(d0, d1) };
  };

  // Fundido de todo lo demás y luz que acompaña a la cámara mientras se mira una pieza
  useFrame((_, dt) => {
    if (arranque.current) {
      arranque.current = false;
      lanzarVuelo();
    }
    if (esperaCotas.current && !anim.current) {
      setAnotId(esperaCotas.current);
      esperaCotas.current = '';
    }
    const objetivo = foco ? (verContexto ? 0.1 : 0) : 1;
    if (fade.current !== objetivo) {
      fade.current += (objetivo - fade.current) * Math.min(1, Math.min(dt, 0.05) * 8);
      if (Math.abs(fade.current - objetivo) < 0.003) fade.current = objetivo;
      if (grupoCtx.current) {
        aplicarFade(grupoCtx.current, fade.current);
        grupoCtx.current.visible = fade.current > 0.004;
      }
    }
    // El encuadre se corre para que la tarjeta (abajo o al costado) no tape la pieza
    const sube = 1 - fade.current;
    if (sube > 0.001) {
      const dx = reserva?.x || 0;
      const dy = reserva ? reserva.y : 0.06 * size.height;
      camera.setViewOffset(size.width, size.height, Math.round(dx * sube), Math.round(dy * sube), size.width, size.height);
    }
    else if (camera.view && camera.view.enabled) camera.clearViewOffset();
    if (luzCamara.current) {
      luzCamara.current.intensity = 0.8 * (1 - fade.current);
      luzCamara.current.position.copy(camera.position);
    }
  });

  const seccionDe = useMemo(() => {
    const mapa = {};
    for (const t of tramos) mapa[t.id] = t.seccion;
    return mapa;
  }, [tramos]);

  const sobre = (texto) => (ev) => {
    ev.stopPropagation();
    if (!activo) setHover(texto);
  };
  const clic = (id) => (ev) => {
    ev.stopPropagation();
    if (!activo) setElemento(id);
  };

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, -2]} intensity={0.9} />
      <directionalLight position={[-3, 3, 4]} intensity={0.4} />
      <pointLight ref={luzCamara} decay={0} intensity={0} />

      <group ref={grupoCtx}>
      <group scale={[-1, 1, 1]}>
      {/* Piso y contorno interior de la van */}
      <Caja x={0} y={-12} z={0} sx={van.ancho} sy={12} sz={van.largo} color="#8d6e4a" bordes="#4b3a24" />
      <Caja x={0} y={0} z={0} sx={van.ancho} sy={van.alto} sz={van.largo} color="#9aa5b1" opacidad={0.04} bordes="#7a8794" />

      {mostrarArcos && data.arcos.map((a) => <Caja key={a.nombre} {...a} color="#555b63" opacidad={0.75} bordes="#2b2f33" />)}

      {mostrarAsientos &&
        elec3d.escenario.map((e) => (
          <Caja key={e.nombre} {...e} bordes="#263238" onOver={sobre(e.nombre)} onOut={() => setHover('')} />
        ))}
      {mostrarAsientos && elec3d.decos.map((d) => <Caja key={d.nombre} {...d} bordes={null} />)}

      {data.partes
        .filter((p) => visibles[p.grupo] && p.id !== foco)
        .map((p) => {
          const q = colocada(p);
          const elegida = seleccion === p.id;
          const color = elegida ? '#ff7043' : p.tipo === 'liston' ? '#c49a5e' : p.color || COLORES[p.grupo];
          const comun = {
            x: q.x,
            y: q.y,
            z: q.z,
            sx: p.sx,
            sy: p.sy,
            sz: p.sz,
            color,
            opacidad: transparentar ? 0.12 : 1,
            bordes: elegida ? '#bf360c' : '#6b4f2a',
            onClick: (e) => {
              e.stopPropagation();
              if (activo) return;
              // Doble clic o doble toque: la madera se queda sola en pantalla con sus medidas y cortes
              if (esDoble(p.id, e.nativeEvent && e.nativeEvent.timeStamp)) {
                setElemento('');
                setSeleccion(p.id);
                setEnfoque(p.id);
                return;
              }
              // Las puertas de la heladera, del gas y de lo eléctrico abren la ficha del equipo
              if (p.abre) setElemento(p.abre);
              else setSeleccion(p.id);
            },
            onOver: sobre(`${p.id} - ${p.nombre}${p.abre ? ` (${TACTIL ? 'toque' : 'clic'} para ver el equipo y el video)` : ''} - ${TACTIL ? 'doble toque' : 'doble clic'} para verla sola`),
            onOut: () => setHover(''),
          };
          return tieneContorno(p) ? <PlacaCortada key={p.id} p={q} {...comun} /> : <Caja key={p.id} {...comun} />;
        })}

      {data.decos
        .filter((d) => visibles[d.grupo])
        .map((d) => {
          const q = d.forma && d.forma !== 'boton' ? d : desplazar(d, d.grupo);
          // Los botones acompañan a su mueble en la vista explotada
          return <Deco key={d.id} d={q} onOver={d.forma === 'boton' ? sobre(d.nombre) : undefined} onOut={() => setHover('')} />;
        })}

      {/* Equipos de agua y cocina */}
      {mostrarEquipos &&
        data.equipos
          .filter((e) => visibles[e.grupo])
          .map((e) => {
            const q = desplazar(e, e.grupo);
            return (
              <Caja
                key={e.id}
                x={q.x}
                y={q.y}
                z={q.z}
                sx={e.sx}
                sy={e.sy}
                sz={e.sz}
                color={e.color}
                opacidad={1}
                bordes="#222"
                resaltar={elemento === e.id}
                onClick={clic(e.id)}
                onOver={sobre(`${e.nombre}: ${e.nota || ''} (${TACTIL ? 'toque' : 'clic'} para ver el video)`)}
                onOut={() => setHover('')}
              />
            );
          })}

      {/* Sistema eléctrico */}
      {mostrarElectrico &&
        elec3d.equipos.map((e) => {
          const q = desplazar(e, e.en || e.grupo);
          return (
            <Caja
              key={e.id}
              x={q.x}
              y={q.y}
              z={q.z}
              sx={e.sx}
              sy={e.sy}
              sz={e.sz}
              color={e.color}
              emisivo={e.emisivo}
              opacidad={1}
              bordes="#111"
              resaltar={elemento === e.id}
              onClick={clic(e.id)}
              onOver={sobre(`${e.nombre}: ${e.nota || ''} (${TACTIL ? 'toque' : 'clic'} para ver el video)`)}
              onOut={() => setHover('')}
            />
          );
        })}

      {mostrarElectrico && (elec3d.decosElec || []).map((d) => <Caja key={d.nombre} {...d} bordes={null} />)}

      {mostrarElectrico &&
        explosion < 0.02 &&
        [...elec3d.cables, ...elec3d.mangueras].map((c) => (
          <Cable
            key={c.id}
            cable={c}
            seccion={seccionDe[c.id]}
            elegido={elemento === c.id}
            onClick={clic(c.id)}
            onOver={sobre(`${c.nombre} (${TACTIL ? 'toque' : 'clic'} para ver el video)`)}
            onOut={() => setHover('')}
          />
        ))}

      </group>
      </group>

      {/* Modo pieza: la madera elegida (fuera del grupo que se desvanece) y sus cotas */}
      {vivas.map((id) => {
        const p = data.partes.find((x) => x.id === id);
        if (!p) return null;
        const q = colocada(p);
        const color = p.tipo === 'liston' ? '#c49a5e' : p.color || COLORES[p.grupo];
        const ent = entradas.current[id] || { alfaInicial: 1, retraso: 0, desdeSeleccion: false };
        return (
          <React.Fragment key={id}>
            <group scale={[-1, 1, 1]}>
              <PiezaEnfoque q={q} color={color} activa={id === foco} {...ent} onFin={() => quitar(id)} />
            </group>
            <AnotacionesDe key={`${id}:${invertir}`} q={q} invertir={invertir} xMedio={van.ancho / 2} fov={camera.fov} visible={id === foco && anotId === id} />
          </React.Fragment>
        );
      })}

      <OrbitControls ref={controles} makeDefault />
      <Camara vista={vista} controles={controles} anim={anim} previa={previa} />
    </>
  );
}

export default function Scene3D(props) {
  const { van } = props;
  return (
    <Canvas
      frameloop={props.visible === false ? 'never' : 'always'}
      dpr={[1, 2]}
      camera={{ position: VISTAS.foto.pos, fov: 45, near: 0.05, far: 60 }}
      onPointerMissed={() => {
        props.setSeleccion('');
        props.setElemento('');
      }}
    >
      <color attach="background" args={['#eef1f4']} />
      <Escena {...props} />
    </Canvas>
  );
}
