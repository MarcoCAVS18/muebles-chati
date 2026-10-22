import React from 'react';

export function leer(obj, ruta) {
  return ruta.split('.').reduce((o, k) => o[k], obj);
}

export function escribir(obj, ruta, valor) {
  const copia = structuredClone(obj);
  const claves = ruta.split('.');
  let o = copia;
  for (let i = 0; i < claves.length - 1; i++) o = o[claves[i]];
  o[claves[claves.length - 1]] = valor;
  return copia;
}

export function Seccion({ titulo, campos, cfg, cambiar }) {
  return (
    <fieldset>
      <legend>{titulo}</legend>
      {campos.map((c) => (
        <label key={c.ruta} className="campo">
          <span>{c.etiqueta}</span>
          {c.tipo === 'check' ? (
            <input
              type="checkbox"
              checked={leer(cfg, c.ruta)}
              onChange={(e) => cambiar(c.ruta, e.target.checked)}
            />
          ) : (
            <input
              type="number"
              step={c.paso || 1}
              value={leer(cfg, c.ruta)}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!Number.isNaN(v)) cambiar(c.ruta, v);
              }}
            />
          )}
        </label>
      ))}
    </fieldset>
  );
}

export const SECCIONES_CFG = [
  {
    titulo: 'Vehículo (mm)',
    campos: [
      { ruta: 'van.ancho', etiqueta: 'Ancho de piso' },
      { ruta: 'van.largo', etiqueta: 'Largo de piso' },
      { ruta: 'van.alto', etiqueta: 'Alto de pared' },
      { ruta: 'van.margenTrasero', etiqueta: 'Margen trasero (baúl)' },
      { ruta: 'van.archInicio', etiqueta: 'Pasarruedas: inicio desde atrás' },
      { ruta: 'van.archLargo', etiqueta: 'Pasarruedas: largo (estimado)' },
      { ruta: 'van.archIntrusion', etiqueta: 'Pasarruedas: entra (estimado)' },
      { ruta: 'van.archAlto', etiqueta: 'Pasarruedas: alto' },
    ],
  },
  {
    titulo: 'Materiales',
    campos: [
      { ruta: 'materiales.estructura.t', etiqueta: 'Placa estructura (mm)' },
      { ruta: 'materiales.fondo.t', etiqueta: 'Placa fondos (mm)' },
      { ruta: 'materiales.estructura.hojaL', etiqueta: 'Hoja: largo' },
      { ruta: 'materiales.estructura.hojaA', etiqueta: 'Hoja: ancho' },
      { ruta: 'corte.kerf', etiqueta: 'Corte de sierra (mm)' },
      { ruta: 'corte.recorte', etiqueta: 'Recorte de borde (mm)' },
      { ruta: 'corte.rotar', etiqueta: 'Permitir rotar piezas', tipo: 'check' },
    ],
  },
  {
    titulo: 'Mueble izquierdo',
    campos: [
      { ruta: 'izquierdo.profundidad', etiqueta: 'Profundidad' },
      { ruta: 'izquierdo.largo', etiqueta: 'Largo' },
      { ruta: 'izquierdo.alto', etiqueta: 'Alto' },
      { ruta: 'izquierdo.zocalo', etiqueta: 'Zócalo' },
      { ruta: 'izquierdo.nevera.largo', etiqueta: 'Bahía heladera' },
      { ruta: 'izquierdo.cajones.largo', etiqueta: 'Bahía cajones' },
      { ruta: 'izquierdo.cajones.n', etiqueta: 'Cantidad de cajones' },
    ],
  },
  {
    titulo: 'Cama',
    campos: [
      { ruta: 'cama.ancho', etiqueta: 'Ancho' },
      { ruta: 'cama.largo', etiqueta: 'Largo (mínimo 1700)' },
      { ruta: 'cama.base', etiqueta: 'Altura del marco' },
      { ruta: 'cama.marco', etiqueta: 'Alto del marco' },
      { ruta: 'cama.separacion', etiqueta: 'Separación listones' },
      { ruta: 'cama.largoCajon', etiqueta: 'Largo de cajón' },
      { ruta: 'cama.altoCajon', etiqueta: 'Alto de cajón' },
    ],
  },
  {
    titulo: 'Mueble derecho',
    campos: [
      { ruta: 'derecho.profundidad', etiqueta: 'Profundidad' },
      { ruta: 'derecho.largo', etiqueta: 'Largo' },
      { ruta: 'derecho.alto', etiqueta: 'Alto' },
      { ruta: 'derecho.alacena.profundidad', etiqueta: 'Alacena: profundidad' },
      { ruta: 'derecho.alacena.separacion', etiqueta: 'Alacena: separación' },
    ],
  },
  {
    titulo: 'Mesa plegable',
    campos: [
      { ruta: 'mesa.ancho', etiqueta: 'Ancho (hacia el centro)' },
      { ruta: 'mesa.largo', etiqueta: 'Largo' },
      { ruta: 'mesa.altura', etiqueta: 'Altura' },
    ],
  },
  {
    titulo: 'Equipos (estimados)',
    campos: [
      { ruta: 'equipos.bateria.x', etiqueta: 'Batería: largo' },
      { ruta: 'equipos.bateria.z', etiqueta: 'Batería: ancho' },
      { ruta: 'equipos.bateria.y', etiqueta: 'Batería: alto' },
      { ruta: 'equipos.pileta.x', etiqueta: 'Pileta: profundidad' },
      { ruta: 'equipos.pileta.z', etiqueta: 'Pileta: largo' },
      { ruta: 'equipos.pileta.y', etiqueta: 'Pileta: alto del cuenco' },
    ],
  },
];
