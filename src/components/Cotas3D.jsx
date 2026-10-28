// Herramienta de cotas: el ancho, el alto y el fondo de cada mueble, dibujados a su alrededor.
// Va fuera del grupo espejado (las líneas gruesas se rompen con una escala negativa), así que pasa las coordenadas de la van
// a las del mundo con aMundo, igual que las cotas del modo pieza.
import React from 'react';
import { Line, Html } from '@react-three/drei';
import { fmt } from '../engine/enfoque.js';
import { aMundo } from './Enfoque.jsx';

const mt = aMundo;
const suma = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const ajustes = { depthTest: false, transparent: true, renderOrder: 12 };

function Cota({ a, b, fuera, etiqueta }) {
  const p = suma(a, fuera);
  const q = suma(b, fuera);
  const medio = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2];
  return (
    <group>
      <Line points={[mt(suma(a, fuera, 0.15)), mt(suma(a, fuera, 1.25))]} color="#ffffff" lineWidth={1} opacity={0.55} {...ajustes} />
      <Line points={[mt(suma(b, fuera, 0.15)), mt(suma(b, fuera, 1.25))]} color="#ffffff" lineWidth={1} opacity={0.55} {...ajustes} />
      <Line points={[mt(p), mt(q)]} color="#ffffff" lineWidth={2.2} {...ajustes} />
      {[p, q].map((e, i) => (
        <mesh key={i} position={mt(e)} renderOrder={13}>
          <sphereGeometry args={[0.006, 10, 8]} />
          <meshBasicMaterial color="#ffffff" depthTest={false} transparent />
        </mesh>
      ))}
      <Html position={mt(medio)} center zIndexRange={[5, 0]} pointerEvents="none">
        <div className="cota-g">{etiqueta}</div>
      </Html>
    </group>
  );
}

// cajas: [{ grupo, caja: [x0, y0, z0, x1, y1, z1] }] con el mueble armado y cerrado
export function CotasGlobales({ cajas }) {
  const o = 110;
  return (
    <group>
      {cajas.map(({ grupo, caja }) => {
        const [x0, y0, z0, x1, y1, z1] = caja;
        const corto = grupo.replace(/^Mueble /, '');
        return (
          <group key={grupo}>
            <Cota a={[x0, y0, z0]} b={[x1, y0, z0]} fuera={[0, 0, -o]} etiqueta={<><i>{corto}</i> {fmt(x1 - x0)} mm</>} />
            <Cota a={[x0, y0, z0]} b={[x0, y1, z0]} fuera={[-o, 0, -o]} etiqueta={<>{fmt(y1 - y0)} mm</>} />
            <Cota a={[x0, y0, z0]} b={[x0, y0, z1]} fuera={[-o, 0, 0]} etiqueta={<>{fmt(z1 - z0)} mm</>} />
          </group>
        );
      })}
    </group>
  );
}
