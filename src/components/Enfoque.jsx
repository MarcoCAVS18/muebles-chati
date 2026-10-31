// Modo pieza: la madera elegida se queda sola en escena, con sus medidas, esquinas y cortes dibujados encima.
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Line, Html } from '@react-three/drei';
import { Caja, PlacaCortada, aplicarFade, tieneContorno } from './Piezas3D.jsx';
import { anotarPieza, posarCamara, COLOR_CORTE, fmt } from '../engine/enfoque.js';

// Coordenadas de la van en mm a coordenadas del mundo 3D en metros (el 3D espeja el eje x)
export const aMundo = (v) => [-v[0] / 1000, v[1] / 1000, v[2] / 1000];

const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// La pieza elegida. Aparece (o se va) con un fundido y pasa del color de selección al color de la madera.
export function PiezaEnfoque({ q, color, bordes, activa, alfaInicial, retraso, desdeSeleccion, onFin }) {
  const grupo = useRef();
  const mat = useRef();
  const alfa = useRef(alfaInicial);
  const espera = useRef(retraso);
  const tinte = useRef(desdeSeleccion ? 0 : 1);
  const terminada = useRef(false);
  const natural = useMemo(() => new THREE.Color(color), [color]);
  const naranja = useMemo(() => new THREE.Color('#ff7043'), []);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    if (activa) terminada.current = false;
    if (activa && espera.current > 0) espera.current -= d;
    else alfa.current = THREE.MathUtils.clamp(alfa.current + (activa ? d : -d) / 0.45, 0, 1);
    if (grupo.current) {
      aplicarFade(grupo.current, suave(alfa.current));
      grupo.current.visible = alfa.current > 0.002;
    }
    if (tinte.current < 1 && mat.current) {
      tinte.current = Math.min(1, tinte.current + d / 0.7);
      mat.current.color.copy(naranja).lerp(natural, suave(tinte.current));
    }
    if (!activa && alfa.current <= 0.002 && !terminada.current) {
      terminada.current = true;
      onFin();
    }
  });

  const comun = { x: q.x, y: q.y, z: q.z, color, bordes: bordes || '#3f2d14', matRef: mat };
  return (
    <group ref={grupo}>
      {tieneContorno(q) ? <PlacaCortada p={q} {...comun} /> : <Caja sx={q.sx} sy={q.sy} sz={q.sz} {...comun} />}
    </group>
  );
}

function Etiqueta({ pos, tipo, visible, children }) {
  return (
    <Html position={aMundo(pos)} center zIndexRange={[5, 0]} pointerEvents="none">
      <div className={`cota cota-${tipo}${visible ? ' visible' : ''}`}>{children}</div>
    </Html>
  );
}

const medio = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];

// Cotas, esquinas, arco y ángulos rectos. Las líneas se dibujan por delante de la pieza para que se lean siempre.
export function Anotaciones({ datos, visible }) {
  const grupo = useRef();
  const alfa = useRef(0);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    alfa.current = THREE.MathUtils.clamp(alfa.current + (visible ? d : -d) / 0.4, 0, 1);
    if (grupo.current) aplicarFade(grupo.current, suave(alfa.current));
  });

  const ajustes = { depthTest: false, transparent: true, renderOrder: 10 };
  const punta = (p, color, k) => (
    <mesh key={k} position={aMundo(p)} renderOrder={11}>
      <sphereGeometry args={[0.0036, 12, 10]} />
      <meshBasicMaterial color={color} depthTest={false} transparent />
    </mesh>
  );

  return (
    <group ref={grupo}>
      {datos.cotas.map((c, i) => {
        const color = COLOR_CORTE[c.tipo];
        return (
          <group key={`c${i}`}>
            {c.ext.map((e, k) => (
              <Line key={k} points={[aMundo(e[0]), aMundo(e[1])]} color="#7d7d7d" lineWidth={1} {...ajustes} />
            ))}
            <Line points={[aMundo(c.ini), aMundo(c.fin)]} color={color} lineWidth={2.4} {...ajustes} />
            {punta(c.ini, color, 'a')}
            {punta(c.fin, color, 'b')}
          </group>
        );
      })}
      {datos.arcos.map((a, i) => (
        <Line key={`a${i}`} points={a.pts.map(aMundo)} color={COLOR_CORTE[a.tipo]} lineWidth={4} {...ajustes} />
      ))}
      {datos.radios.map((r, i) => (
        <group key={`r${i}`}>
          <Line points={[aMundo(r.ini), aMundo(r.fin)]} color={COLOR_CORTE[r.tipo]} lineWidth={2.4} {...ajustes} />
          {punta(r.ini, COLOR_CORTE[r.tipo], 'c')}
        </group>
      ))}
      {datos.marcas.map((k, i) => (
        <Line key={`m${i}`} points={k.map(aMundo)} color={COLOR_CORTE.recto} lineWidth={2.4} {...ajustes} />
      ))}

      {datos.cotas.map((c, i) => (
        <Etiqueta key={`ec${i}`} pos={c.etiquetaPos || medio(c.ini, c.fin)} tipo={c.tipo} visible={visible}>
          {c.nombre} {fmt(c.valor)} mm
        </Etiqueta>
      ))}
      {datos.arcos
        .filter((a) => a.etiqueta)
        .map((a, i) => (
          <Etiqueta key={`ea${i}`} pos={a.pos} tipo={a.tipo} visible={visible}>
            {a.etiqueta}
          </Etiqueta>
        ))}
      {datos.radios.map((r, i) => (
        <Etiqueta key={`er${i}`} pos={medio(r.ini, r.fin)} tipo={r.tipo} visible={visible}>
          {r.etiqueta}
        </Etiqueta>
      ))}
      {datos.marcas.length > 0 && !datos.cotas.some((c) => c.nombre === 'Recorte') && (
        <Etiqueta pos={datos.marcas[0][1]} tipo="recto" visible={visible}>
          90°
        </Etiqueta>
      )}
    </group>
  );
}

// Calcula las cotas de una pieza para el lado desde el que se la mira. Solo se recalcula si cambia la pieza.
export function AnotacionesDe({ q, invertir, xMedio, fov, visible }) {
  const clave = [q.x, q.y, q.z, q.sx, q.sy, q.sz, q.recorte ? q.recorte.x0 + q.recorte.z0 : 0, invertir, xMedio].join(',');
  const datos = useMemo(() => {
    const cam = posarCamara(q, { invertir, xMedio, aspecto: 1.6, fovDeg: fov });
    return anotarPieza(q, cam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);
  return <Anotaciones datos={datos} visible={visible} />;
}

// Marcas de taladrado de una pieza: dónde entra cada tornillo. Naranja = la pieza se atraviesa (agujero pasante y
// avellanado por la cara); azul = la pieza recibe el tornillo por el canto (pretaladro fino y profundo).
export const COLOR_ATRAVIESA = '#ff7043';
export const COLOR_RECIBE = '#1e88e5';

export function UnionesPieza({ uniones, desp, visible }) {
  const items = uniones ? uniones.juntas.filter((x) => x.junta.cantidad > 0) : [];
  if (!visible || !items.length) return null;
  const ajustes = { depthTest: false, transparent: true, renderOrder: 12 };
  const mover = (p) => [p[0] + desp[0], p[1] + desp[1], p[2] + desp[2]];
  return (
    <group>
      {items.map(({ junta: j, papel }) => {
        const color = papel === 'cara' ? COLOR_ATRAVIESA : COLOR_RECIBE;
        const idx = { x: 0, y: 1, z: 2 }[j.eje];
        const fino = j.tornillo.largo - j.entran; // espesor de la pieza que se atraviesa
        const tramo = papel === 'cara' ? fino : j.entran;
        const inicios = j.puntos.map((p) => {
          const v = [p.x, p.y, p.z];
          if (papel === 'canto') v[idx] = j.plano;
          return mover(v);
        });
        const finales = inicios.map((v) => {
          const w = [...v];
          w[idx] += j.sentido * tramo;
          return w;
        });
        const centro = inicios.reduce((s, v) => [s[0] + v[0] / inicios.length, s[1] + v[1] / inicios.length, s[2] + v[2] / inicios.length], [0, 0, 0]);
        const texto =
          papel === 'cara'
            ? `${j.cantidad} × ${String(j.tornillo.d).replace('.', ',')}x${j.tornillo.largo} · Ø${String(j.pretaladro.pasante).replace('.', ',')} pasante y avellanado`
            : `${j.cantidad} × guía Ø${String(j.pretaladro.guia).replace('.', ',')} · ${fmt(j.pretaladro.prof)} mm de profundidad`;
        return (
          <group key={`${j.id}${papel}`}>
            {inicios.map((v, k) => (
              <group key={k}>
                <Line points={[aMundo(v), aMundo(finales[k])]} color={color} lineWidth={3} {...ajustes} />
                <mesh position={aMundo(v)} renderOrder={13}>
                  <sphereGeometry args={[0.0042, 12, 10]} />
                  <meshBasicMaterial color={color} depthTest={false} transparent />
                </mesh>
              </group>
            ))}
            <Etiqueta pos={centro} tipo={papel === 'cara' ? 'medida' : 'arco'} visible>
              {texto}
            </Etiqueta>
          </group>
        );
      })}
    </group>
  );
}
