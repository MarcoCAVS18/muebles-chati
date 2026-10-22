import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Edges } from '@react-three/drei';

const COLORES = {
  'Mueble trasero': '#dcbc8c',
  Cama: '#e8d2a6',
  'Mueble derecho': '#cfae7c',
};

const COLOR_CABLE = {
  dc: { pos: '#d32f2f', neg: '#212121' },
  ac: { pos: '#8d6e63', neg: '#1976d2' },
  senal: { pos: '#9e9e9e', neg: '#9e9e9e' },
  agua: { pos: '#29b6f6', neg: null },
  gas: { pos: '#ff9800', neg: null },
};

const m = (v) => v / 1000;

// El modelo usa x = 0 en la pared izquierda mirando hacia los asientos (eje que no es el de three.js).
// Se espeja el eje x al dibujar para que izquierda y derecha se vean como en la van real.
// Por eso en las vistas la coordenada x del mundo es el negativo de la x de la van.
export const VISTAS = {
  foto: { nombre: 'Como la foto', pos: [3.3, 3.4, -0.6], target: [-0.86, 0.3, 1.35] },
  trasera: { nombre: 'Desde la puerta trasera', pos: [-0.86, 1.3, -2.7], target: [-0.86, 0.55, 1.6] },
  arriba: { nombre: 'Desde arriba', pos: [-0.86, 4.6, 1.25], target: [-0.86, 0, 1.2] },
  cabecera: { nombre: 'Mueble trasero (completo)', pos: [-0.86, 1.1, -0.35], target: [-0.86, 0.5, 2.2] },
  agua: { nombre: 'Agua: fregadero y bidones', pos: [-1.4, 1.2, 0.6], target: [-1.4, 0.45, 2.2] },
  cocina: { nombre: 'Cocina: anafe, gas y heladera', pos: [-0.86, 1.2, 0.6], target: [-0.86, 0.45, 2.2] },
  electrico: { nombre: 'Zona eléctrica (ver interior)', pos: [-0.35, 1.2, 0.6], target: [-0.35, 0.4, 2.2] },
  techo: { nombre: 'Techo: tiras LED y extractor', pos: [-0.86, 0.5, 0.1], target: [-0.86, 1.25, 1.6] },
  asientos: { nombre: 'Batería del auto (bajo el asiento)', pos: [-0.5, 1.5, 3.7], target: [-1.35, 0.2, 2.75] },
};

function Camara({ vista, controles }) {
  const { camera } = useThree();
  useEffect(() => {
    const v = VISTAS[vista.clave] || VISTAS.foto;
    camera.position.set(...v.pos);
    if (controles.current) {
      controles.current.target.set(...v.target);
      controles.current.update();
    }
  }, [vista, camera, controles]);
  return null;
}

function Caja({ x, y, z, sx, sy, sz, color, opacidad = 1, bordes = '#6b4f2a', onClick, onOver, onOut, emisivo, resaltar }) {
  return (
    <mesh position={[m(x + sx / 2), m(y + sy / 2), m(z + sz / 2)]} onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
      <boxGeometry args={[m(sx), m(sy), m(sz)]} />
      <meshStandardMaterial
        key={opacidad < 1 ? 'transparente' : 'opaco'}
        color={color}
        transparent={opacidad < 1}
        opacity={opacidad}
        depthWrite={opacidad >= 1}
        emissive={resaltar ? '#ff7043' : emisivo ? color : '#000000'}
        emissiveIntensity={resaltar ? 0.6 : emisivo ? 0.9 : 0}
      />
      {bordes && <Edges color={bordes} />}
    </mesh>
  );
}

// Placa con las cuatro esquinas redondeadas en planta (x, z) y espesor en y
function PlacaRedonda({ x, y, z, sx, sy, sz, radio, color, opacidad = 1, bordes, onClick, onOver, onOut }) {
  const geometria = useMemo(() => {
    const r = Math.min(m(radio), m(sx) / 2, m(sz) / 2);
    const w = m(sx);
    const h = m(sz);
    // La forma se dibuja en (u, v) y al rotar el eje x -90 grados v queda como -z
    const forma = new THREE.Shape();
    forma.moveTo(r, 0);
    forma.lineTo(w - r, 0);
    forma.absarc(w - r, -r, r, Math.PI * 1.5, Math.PI * 2, false);
    forma.lineTo(w, -h + r);
    forma.absarc(w - r, -h + r, r, 0, Math.PI * 0.5, false);
    forma.lineTo(r, -h);
    forma.absarc(r, -h + r, r, Math.PI * 0.5, Math.PI, false);
    forma.lineTo(0, -r);
    forma.absarc(r, -r, r, Math.PI, Math.PI * 1.5, false);
    return new THREE.ExtrudeGeometry(forma, { depth: m(sy), bevelEnabled: false, curveSegments: 10 });
  }, [sx, sy, sz, radio]);
  return (
    <mesh geometry={geometria} position={[m(x), m(y), m(z)]} rotation={[-Math.PI / 2, 0, 0]} onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
      <meshStandardMaterial
        key={opacidad < 1 ? 'transparente' : 'opaco'}
        color={color}
        transparent={opacidad < 1}
        opacity={opacidad}
        depthWrite={opacidad >= 1}
      />
      {bordes && <Edges color={bordes} threshold={20} />}
    </mesh>
  );
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

function Deco({ d }) {
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
  } = props;
  const controles = useRef();

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

  const seccionDe = useMemo(() => {
    const mapa = {};
    for (const t of tramos) mapa[t.id] = t.seccion;
    return mapa;
  }, [tramos]);

  const sobre = (texto) => (ev) => {
    ev.stopPropagation();
    setHover(texto);
  };
  const clic = (id) => (ev) => {
    ev.stopPropagation();
    setElemento(id);
  };

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, -2]} intensity={0.9} />
      <directionalLight position={[-3, 3, 4]} intensity={0.4} />

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
        .filter((p) => visibles[p.grupo])
        .map((p) => {
          const q = { ...desplazar(p, p.grupo) };
          if (p.ext) q.x += (data.layout.cama?.extension || 0) * camaAbierta; // las bandejas salen al pasillo
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
              // Las puertas de la heladera, del gas y de lo eléctrico abren la ficha del equipo
              if (p.abre) setElemento(p.abre);
              else setSeleccion(p.id);
            },
            onOver: sobre(`${p.id} - ${p.nombre}${p.abre ? ' (clic para ver el equipo y el video)' : ''}`),
            onOut: () => setHover(''),
          };
          return p.radio ? <PlacaRedonda key={p.id} {...comun} radio={p.radio} /> : <Caja key={p.id} {...comun} />;
        })}

      {data.decos
        .filter((d) => visibles[d.grupo])
        .map((d) => (
          <Deco key={d.id} d={d.forma ? d : desplazar(d, d.grupo)} />
        ))}

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
                onOver={sobre(`${e.nombre}: ${e.nota || ''} (clic para ver el video)`)}
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
              onOver={sobre(`${e.nombre}: ${e.nota || ''} (clic para ver el video)`)}
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
            onOver={sobre(`${c.nombre} (clic para ver el video)`)}
            onOut={() => setHover('')}
          />
        ))}

      </group>

      <OrbitControls ref={controles} makeDefault />
      <Camara vista={vista} controles={controles} />
    </>
  );
}

export default function Scene3D(props) {
  const { van } = props;
  return (
    <Canvas
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
