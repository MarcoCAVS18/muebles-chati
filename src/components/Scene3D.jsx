import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Edges } from '@react-three/drei';

const COLORES = {
  'Mueble izquierdo': '#dcbc8c',
  Cama: '#e8d2a6',
  'Mueble derecho': '#cfae7c',
};

const m = (v) => v / 1000;

function Caja({ x, y, z, sx, sy, sz, color, opacidad = 1, bordes = '#6b4f2a', onClick, onOver, onOut, wire }) {
  return (
    <mesh
      position={[m(x + sx / 2), m(y + sy / 2), m(z + sz / 2)]}
      onClick={onClick}
      onPointerOver={onOver}
      onPointerOut={onOut}
    >
      <boxGeometry args={[m(sx), m(sy), m(sz)]} />
      <meshStandardMaterial color={color} transparent={opacidad < 1} opacity={opacidad} wireframe={wire} />
      {bordes && <Edges color={bordes} />}
    </mesh>
  );
}

function Escena({ data, van, visibles, explosion, mostrarEquipos, mostrarArcos, seleccion, setSeleccion, setHover }) {
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

  const desplazar = (p) => {
    if (!explosion) return p;
    const c = centros[p.grupo];
    const px = p.x + p.sx / 2;
    const py = p.y + p.sy / 2;
    const pz = p.z + p.sz / 2;
    return {
      ...p,
      x: p.x + (px - c.x) * explosion,
      y: p.y + (py - c.y) * explosion,
      z: p.z + (pz - c.z) * explosion,
    };
  };

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, -2]} intensity={0.9} />
      <directionalLight position={[-3, 3, 4]} intensity={0.4} />

      {/* Piso y contorno interior de la van */}
      <Caja x={0} y={-12} z={0} sx={van.ancho} sy={12} sz={van.largo} color="#8d6e4a" bordes="#4b3a24" />
      <Caja x={0} y={0} z={0} sx={van.ancho} sy={van.alto} sz={van.largo} color="#9aa5b1" opacidad={0.04} bordes="#7a8794" />

      {mostrarArcos &&
        data.arcos.map((a) => (
          <Caja key={a.nombre} {...a} color="#555b63" opacidad={0.75} bordes="#2b2f33" />
        ))}

      {data.partes
        .filter((p) => visibles[p.grupo])
        .map((p) => {
          const q = desplazar(p);
          const elegida = seleccion === p.id;
          const color = elegida ? '#ff7043' : p.tipo === 'liston' ? '#c49a5e' : COLORES[p.grupo];
          return (
            <Caja
              key={p.id}
              x={q.x}
              y={q.y}
              z={q.z}
              sx={p.sx}
              sy={p.sy}
              sz={p.sz}
              color={color}
              bordes={elegida ? '#bf360c' : '#6b4f2a'}
              onClick={(e) => {
                e.stopPropagation();
                setSeleccion(p.id);
              }}
              onOver={(e) => {
                e.stopPropagation();
                setHover(`${p.id} - ${p.nombre}`);
              }}
              onOut={() => setHover('')}
            />
          );
        })}

      {mostrarEquipos &&
        data.equipos
          .filter((e) => visibles[e.grupo])
          .map((e) => {
            const q = desplazar(e);
            return (
              <Caja
                key={e.nombre}
                x={q.x}
                y={q.y}
                z={q.z}
                sx={e.sx}
                sy={e.sy}
                sz={e.sz}
                color={e.color}
                opacidad={0.85}
                bordes="#222"
                onOver={(ev) => {
                  ev.stopPropagation();
                  setHover(`${e.nombre}: ${e.nota || ''}`);
                }}
                onOut={() => setHover('')}
              />
            );
          })}

      <OrbitControls target={[m(van.ancho / 2), 0.45, m(van.largo / 2)]} makeDefault />
    </>
  );
}

export default function Scene3D(props) {
  const { van } = props;
  return (
    <Canvas
      camera={{ position: [m(van.ancho) + 1.6, 2.2, -2.6], fov: 45, near: 0.05, far: 50 }}
      onPointerMissed={() => props.setSeleccion('')}
    >
      <color attach="background" args={['#eef1f4']} />
      <Escena {...props} />
    </Canvas>
  );
}
