// Lo que se mueve en el armado animado: la madera que llega, la cola que se extiende y los tornillos que entran girando.
// Todo se calcula en cada cuadro a partir del reloj del reproductor (rep.t), sin volver a dibujar React.
// Va dentro del grupo espejado del 3D: las coordenadas son las de la van, en milímetros.
import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Caja, PlacaCortada, aplicarFade, m, tieneContorno } from './Piezas3D.jsx';
import { colorTornillo } from '../engine/uniones.js';
import { TIEMPOS } from '../engine/secuencia.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const frena = (x) => 1 - Math.pow(1 - x, 3); // sale rápido y llega frenando
const suave = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

const EJES = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
const INDICE = { x: 0, y: 1, z: 2 };
const ARRIBA = new THREE.Vector3(0, 1, 0);
const ENTRA = 46; // desde cuántos mm afuera de la cara empieza a entrar cada tornillo
const VUELTAS = 4;

// La madera que llega: flota o se desliza desde afuera hasta su lugar, con un contorno rosa en el lugar donde va a quedar
function Vuelo({ rep, ev, parte, color, bordes }) {
  const g = useRef();
  const fantasma = useRef();
  const alfaPrevio = useRef(-1);

  const actualizar = () => {
    if (!g.current) return;
    const p = clamp((rep.t - ev.t0) / ev.dur);
    let k;
    let alfa;
    let mece = 0;
    if (ev.modo === 'flota') {
      // aparece arriba (0 a 22 %), se mece (hasta la mitad) y baja con frenado suave
      alfa = frena(clamp(p / 0.22));
      const baja = clamp((p - 0.5) / 0.5);
      k = 1 - suave(baja);
      mece = Math.sin(rep.t * 3.2) * 16 * (1 - baja);
    } else {
      k = 1 - frena(p);
      alfa = clamp(p / 0.3);
    }
    const d = ev.dist * k;
    g.current.position.set(m(ev.off[0] * d), m(ev.off[1] * d + mece), m(ev.off[2] * d));
    if (alfa !== alfaPrevio.current) {
      aplicarFade(g.current, alfa);
      alfaPrevio.current = alfa;
    }
    if (fantasma.current) fantasma.current.visible = p < 1;
  };
  useLayoutEffect(actualizar, []);
  useFrame(actualizar);

  const comun = { x: parte.x, y: parte.y, z: parte.z, sx: parte.sx, sy: parte.sy, sz: parte.sz, color, bordes };
  return (
    <>
      <group ref={fantasma}>
        <Caja x={parte.x} y={parte.y} z={parte.z} sx={parte.sx} sy={parte.sy} sz={parte.sz} color="#ff4f8b" opacidad={0.14} bordes="#ff4f8b" />
      </group>
      <group ref={g}>{tieneContorno(parte) ? <PlacaCortada p={parte} {...comun} /> : <Caja {...comun} />}</group>
    </>
  );
}

// La cola sobre el contacto y los tornillos de una madera, entrando uno por uno
function Atornillado({ rep, ev, data }) {
  const juntas = useMemo(() => ev.juntas.map((id) => data.juntas.find((j) => j.id === id)).filter(Boolean), [ev, data]);
  const lista = useMemo(() => {
    const porJunta = new Map();
    for (const t of data.tornillos) {
      if (!porJunta.has(t.junta)) porJunta.set(t.junta, []);
      porJunta.get(t.junta).push(t);
    }
    return juntas.flatMap((j) => porJunta.get(j.id) || []);
  }, [juntas, data]);
  const conCola = useMemo(() => (ev.cola ? juntas.filter((j) => j.cola && !j.desmontable && j.rect) : []), [ev, juntas]);

  const cana = useRef();
  const cabeza = useRef();
  const ranura = useRef();
  const colas = useRef([]);
  const util = useMemo(
    () => ({ o: new THREE.Object3D(), dir: new THREE.Vector3(), ent: new THREE.Vector3(), q0: new THREE.Quaternion(), qs: new THREE.Quaternion() }),
    []
  );

  useLayoutEffect(() => {
    if (!cana.current) return;
    const c = new THREE.Color();
    lista.forEach((t, i) => {
      c.set(colorTornillo(t.largo));
      cana.current.setColorAt(i, c);
      cabeza.current.setColorAt(i, c);
      c.set('#2b2b2b');
      ranura.current.setColorAt(i, c);
    });
    for (const im of [cana.current, cabeza.current, ranura.current]) if (im.instanceColor) im.instanceColor.needsUpdate = true;
  }, [lista]);

  const actualizar = () => {
    const { o, dir, ent, q0, qs } = util;
    const local = rep.t - ev.t0;
    // Cola: un destello amarillo sobre el contacto antes de unir
    conCola.forEach((j, i) => {
      const mesh = colas.current[i];
      if (!mesh) return;
      const f = clamp(local / ev.demoraCola);
      mesh.visible = f > 0 && f < 1;
      mesh.material.opacity = Math.sin(Math.PI * f) * 0.9;
    });
    if (!cana.current) return;
    lista.forEach((t, i) => {
      const ts = (local - ev.demoraCola - i * ev.sep) / TIEMPOS.tornillo;
      dir.set(...EJES[t.eje]).multiplyScalar(t.sentido);
      q0.setFromUnitVectors(ARRIBA, dir);
      const e = frena(clamp(ts));
      const afuera = ts <= 0 ? 0 : ENTRA * (1 - e);
      qs.setFromAxisAngle(dir, (1 - e) * Math.PI * 2 * VUELTAS);
      const escala = ts <= 0 ? 0.0001 : 1;
      ent.set(m(t.x), m(t.y), m(t.z)).addScaledVector(dir, -m(afuera));
      // Caña
      o.quaternion.copy(qs).multiply(q0);
      o.position.copy(ent).addScaledVector(dir, m(t.largo) / 2);
      o.scale.set((m(t.d) / 2) * escala, m(t.largo) * escala, (m(t.d) / 2) * escala);
      o.updateMatrix();
      cana.current.setMatrixAt(i, o.matrix);
      // Cabeza
      o.position.copy(ent).addScaledVector(dir, -m(0.4));
      o.scale.set(m(t.d) * 1.05 * escala, m(1.6) * escala, m(t.d) * 1.05 * escala);
      o.updateMatrix();
      cabeza.current.setMatrixAt(i, o.matrix);
      // Ranura de la cabeza: es lo que deja ver que gira
      o.position.copy(ent).addScaledVector(dir, -m(1.3));
      o.scale.set(m(t.d) * 0.95 * escala, m(0.9) * escala, m(t.d) * 0.22 * escala);
      o.updateMatrix();
      ranura.current.setMatrixAt(i, o.matrix);
    });
    for (const im of [cana.current, cabeza.current, ranura.current]) im.instanceMatrix.needsUpdate = true;
  };
  useLayoutEffect(actualizar, [lista, conCola]);
  useFrame(actualizar);

  const sinRayo = () => null;
  return (
    <group>
      {conCola.map((j, i) => {
        // Rectángulo de contacto: j.plano es la coordenada sobre el eje de la unión y rect da los otros dos lados
        const c = [0, 0, 0];
        const s = [0, 0, 0];
        c[INDICE[j.eje]] = j.plano;
        s[INDICE[j.eje]] = 2.2;
        c[INDICE[j.rect.u]] = (j.rect.u0 + j.rect.u1) / 2;
        s[INDICE[j.rect.u]] = j.rect.u1 - j.rect.u0;
        c[INDICE[j.rect.v]] = (j.rect.v0 + j.rect.v1) / 2;
        s[INDICE[j.rect.v]] = j.rect.v1 - j.rect.v0;
        return (
          <mesh key={j.id} ref={(el) => (colas.current[i] = el)} position={[m(c[0]), m(c[1]), m(c[2])]} visible={false} raycast={sinRayo}>
            <boxGeometry args={[m(s[0]), m(s[1]), m(s[2])]} />
            <meshBasicMaterial color="#ffe082" transparent opacity={0} depthWrite={false} />
          </mesh>
        );
      })}
      {lista.length > 0 &&
        [cana, cabeza, ranura].map((ref, k) => (
          <instancedMesh key={`${k}-${lista.length}`} ref={ref} args={[undefined, undefined, lista.length]} frustumCulled={false} raycast={sinRayo}>
            {k === 2 ? <boxGeometry args={[1, 1, 1]} /> : <cylinderGeometry args={k === 0 ? [1, 1, 1, 8] : [1, 1, 1, 10]} />}
            <meshBasicMaterial />
          </instancedMesh>
        ))}
    </group>
  );
}

export default function ArmadoAnimado({ rep, seq, indice, data, colorDe, bordeDe }) {
  const ev = seq.eventos[indice];
  const parte = useMemo(() => (ev && ev.tipo === 'pieza' ? data.partes.find((p) => p.id === ev.id) : null), [ev, data]);
  if (!ev) return null;
  if (ev.tipo === 'pieza' && parte) return <Vuelo key={`${indice}`} rep={rep} ev={ev} parte={parte} color={colorDe(parte)} bordes={bordeDe(parte)} />;
  if (ev.tipo === 'tornillos') return <Atornillado key={`${indice}`} rep={rep} ev={ev} data={data} />;
  return null;
}
