// El suelo del escenario: una grilla de puntos que se desvanece hacia afuera y una sombra suave bajo la van.
import React, { useMemo } from 'react';
import * as THREE from 'three';

const LADO = 20; // metros que cubre la grilla
const PUNTOS = 80; // puntos por lado: uno cada 25 cm

function texturaPuntos() {
  const N = 2048;
  const paso = N / PUNTOS;
  const lienzo = document.createElement('canvas');
  lienzo.width = N;
  lienzo.height = N;
  const g = lienzo.getContext('2d');
  const R = N / 2;
  for (let y = paso / 2; y < N; y += paso) {
    for (let x = paso / 2; x < N; x += paso) {
      const d = Math.hypot(x - R, y - R) / R;
      if (d >= 1) continue;
      g.fillStyle = `rgba(255,255,255,${(Math.pow(1 - d, 1.7) * 0.75).toFixed(3)})`;
      g.beginPath();
      g.arc(x, y, 2.4, 0, Math.PI * 2);
      g.fill();
    }
  }
  const t = new THREE.CanvasTexture(lienzo);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// Rectángulo con el borde difuminado, calculado pixel a pixel (el filtro blur del lienzo no existe en todos los navegadores)
function texturaSombra(ancho, largo, margen) {
  const W = 256;
  const H = Math.max(64, Math.round((W * (largo + 2 * margen)) / (ancho + 2 * margen)));
  const lienzo = document.createElement('canvas');
  lienzo.width = W;
  lienzo.height = H;
  const g = lienzo.getContext('2d');
  const img = g.createImageData(W, H);
  const hx = (ancho / (ancho + 2 * margen)) * (W / 2);
  const hy = (largo / (largo + 2 * margen)) * (H / 2);
  // La sombra se apaga del todo antes del borde del plano, para que no quede un marco visible
  const difuso = (margen / (ancho + 2 * margen)) * W * 0.92;
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const qx = Math.abs(i + 0.5 - W / 2) - hx;
      const qy = Math.abs(j + 0.5 - H / 2) - hy;
      const sd = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0);
      const k = Math.min(1, Math.max(0, 1 - sd / difuso));
      const o = (j * W + i) * 4;
      img.data[o] = 18;
      img.data[o + 1] = 6;
      img.data[o + 2] = 84;
      img.data[o + 3] = Math.round(255 * 0.55 * k * k);
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(lienzo);
  t.colorSpace = THREE.SRGBColorSpace;
  return { t, relacion: (largo + 2 * margen) / (ancho + 2 * margen) };
}

export function Piso({ van }) {
  const puntos = useMemo(() => texturaPuntos(), []);
  const margen = 1.3;
  const ancho = van.ancho / 1000;
  const largo = van.largo / 1000;
  const sombra = useMemo(() => texturaSombra(ancho, largo, margen), [ancho, largo]);
  // El 3D espeja el eje x: el centro de la van queda en x negativo
  const cx = -ancho / 2;
  const cz = largo / 2;
  return (
    <group>
      <mesh position={[cx, -0.0185, cz]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-2}>
        <planeGeometry args={[LADO, LADO]} />
        <meshBasicMaterial map={puntos} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[cx, -0.0165, cz]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
        <planeGeometry args={[ancho + 2 * margen, largo + 2 * margen]} />
        <meshBasicMaterial map={sombra.t} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
