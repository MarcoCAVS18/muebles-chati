// Cajas y placas con contorno que usan la escena completa y el modo pieza.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Edges } from '@react-three/drei';
import { contorno } from '../engine/enfoque.js';

export const m = (v) => v / 1000;

export const COLORES = {
  'Mueble trasero': '#dcbc8c',
  Cama: '#e8d2a6',
  'Mueble derecho': '#cfae7c',
};

export function Caja({ x, y, z, sx, sy, sz, color, opacidad = 1, bordes = '#6b4f2a', onClick, onDoubleClick, onOver, onOut, emisivo, resaltar, matRef }) {
  return (
    <mesh position={[m(x + sx / 2), m(y + sy / 2), m(z + sz / 2)]} onClick={onClick} onDoubleClick={onDoubleClick} onPointerOver={onOver} onPointerOut={onOut}>
      <boxGeometry args={[m(sx), m(sy), m(sz)]} />
      <meshStandardMaterial
        ref={matRef}
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

// Placa con esquinas redondeadas, recorte o arco calado. El contorno sale de enfoque.js (el mismo que usan las cotas).
// p es la pieza original (da el contorno) y x, y, z su posición actual (puede estar desplazada por la vista explotada).
export function PlacaCortada({ p, x, y, z, color, opacidad = 1, bordes, onClick, onDoubleClick, onOver, onOut, matRef }) {
  const c = useMemo(() => contorno(p), [p.x, p.z, p.sx, p.sy, p.sz, p.radio, p.recorte, p.calado]);
  const geometria = useMemo(() => {
    const forma = new THREE.Shape();
    for (const k of c.cmds) {
      if (k.t === 'M') forma.moveTo(m(k.u), m(k.v));
      else if (k.t === 'L') forma.lineTo(m(k.u), m(k.v));
      else forma.absarc(m(k.cu), m(k.cv), m(k.r), k.a0, k.a1, true);
    }
    const espesor = c.plano === 'xz' ? p.sy : p.sz;
    return new THREE.ExtrudeGeometry(forma, { depth: m(espesor), bevelEnabled: false, curveSegments: 28 });
  }, [c, p.sy, p.sz]);
  // En las placas planas la forma se dibuja en (u, v) y al rotar -90 grados en x, v queda como -z y el espesor como y
  return (
    <mesh
      geometry={geometria}
      position={[m(x), m(y), m(z)]}
      rotation={c.plano === 'xz' ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onPointerOver={onOver}
      onPointerOut={onOut}
    >
      <meshStandardMaterial
        ref={matRef}
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

// Opacidad de todo un grupo: multiplica la que tenía cada material y la devuelve cuando f vuelve a 1
export function aplicarFade(raiz, f) {
  raiz.traverse((o) => {
    if (!o.material) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const mt of mats) {
      if (mt.userData.baseOp === undefined) {
        mt.userData.baseOp = mt.opacity;
        mt.userData.baseTr = mt.transparent;
        mt.userData.baseDw = mt.depthWrite;
      }
      const tr = mt.userData.baseTr || f < 0.999;
      if (mt.transparent !== tr) {
        mt.transparent = tr;
        mt.needsUpdate = true;
      }
      mt.opacity = mt.userData.baseOp * f;
      mt.depthWrite = f < 0.999 ? false : mt.userData.baseDw;
    }
  });
}
