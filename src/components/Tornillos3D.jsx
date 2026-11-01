// Todos los tornillos de las uniones, cada uno con su cabeza y su caña, en la posición y el largo que calcula uniones.js.
// Van dentro del grupo espejado del 3D, así que las coordenadas son las de la van, en milímetros.
import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { colorTornillo } from '../engine/uniones.js';

const m = (v) => v / 1000;
const EJES = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
const ARRIBA = new THREE.Vector3(0, 1, 0);
const SIN_DESP = [0, 0, 0];

export default function Tornillos3D({ tornillos, grupoDe, visibles, seleccion, desp }) {
  const lista = useMemo(() => tornillos.filter((t) => visibles[grupoDe.get(t.cara)]), [tornillos, grupoDe, visibles]);
  const cana = useRef();
  const cabeza = useRef();

  useLayoutEffect(() => {
    if (!cana.current || !cabeza.current) return;
    const o = new THREE.Object3D();
    const dir = new THREE.Vector3();
    const entrada = new THREE.Vector3();
    const color = new THREE.Color();
    lista.forEach((t, i) => {
      dir.set(...EJES[t.eje]).multiplyScalar(t.sentido);
      const d = (desp && desp.get(t.cara)) || SIN_DESP;
      entrada.set(m(t.x + d[0]), m(t.y + d[1]), m(t.z + d[2]));
      o.quaternion.setFromUnitVectors(ARRIBA, dir);
      // Caña: desde la cara por donde entra hasta la punta
      o.position.copy(entrada).addScaledVector(dir, m(t.largo) / 2);
      o.scale.set(m(t.d) / 2, m(t.largo), m(t.d) / 2);
      o.updateMatrix();
      cana.current.setMatrixAt(i, o.matrix);
      // Cabeza avellanada: un disco a ras de la cara
      o.position.copy(entrada).addScaledVector(dir, -m(0.4));
      o.scale.set(m(t.d) * 1.05, m(1.6), m(t.d) * 1.05);
      o.updateMatrix();
      cabeza.current.setMatrixAt(i, o.matrix);
      const mio = seleccion && (t.cara === seleccion || t.canto === seleccion);
      color.set(mio ? '#ff3d00' : seleccion ? '#9a9a9a' : colorTornillo(t.largo));
      cana.current.setColorAt(i, color);
      cabeza.current.setColorAt(i, color);
    });
    for (const im of [cana.current, cabeza.current]) {
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
    }
  }, [lista, seleccion, desp]);

  if (!lista.length) return null;
  const sinRayo = () => null; // los tornillos no tapan los clics sobre la madera
  return (
    <group>
      <instancedMesh key={`c${lista.length}`} ref={cana} args={[undefined, undefined, lista.length]} frustumCulled={false} raycast={sinRayo}>
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshBasicMaterial />
      </instancedMesh>
      <instancedMesh key={`h${lista.length}`} ref={cabeza} args={[undefined, undefined, lista.length]} frustumCulled={false} raycast={sinRayo}>
        <cylinderGeometry args={[1, 1, 1, 10]} />
        <meshBasicMaterial />
      </instancedMesh>
    </group>
  );
}
