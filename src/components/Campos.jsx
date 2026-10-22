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
    titulo: 'Mueble trasero (cruzado)',
    campos: [
      { ruta: 'trasero.ancho', etiqueta: 'Ancho total' },
      { ruta: 'trasero.profundidad', etiqueta: 'Profundidad' },
      { ruta: 'trasero.alto', etiqueta: 'Alto' },
      { ruta: 'trasero.zocalo', etiqueta: 'Zócalo' },
      { ruta: 'trasero.divisor1', etiqueta: 'Fin sección izquierda (x)' },
      { ruta: 'trasero.divisor2', etiqueta: 'Fin sección central (x)' },
    ],
  },
  {
    titulo: 'Cama',
    campos: [
      { ruta: 'cama.ancho', etiqueta: 'Ancho' },
      { ruta: 'cama.largo', etiqueta: 'Largo (mínimo 1700)' },
      { ruta: 'cama.plataforma', etiqueta: 'Altura de la plataforma' },
      { ruta: 'cama.largoCabecera', etiqueta: 'Largo placa cabecera' },
      { ruta: 'cama.cajonA.ancho', etiqueta: 'Cajón A: ancho' },
      { ruta: 'cama.cajonB.ancho', etiqueta: 'Cajón B: ancho' },
    ],
  },
  {
    titulo: 'Mueble derecho',
    campos: [
      { ruta: 'derecho.profundidad', etiqueta: 'Profundidad' },
      { ruta: 'derecho.largo', etiqueta: 'Largo total' },
      { ruta: 'derecho.largoCajones', etiqueta: 'Largo módulo de cajones' },
      { ruta: 'derecho.altoCajones', etiqueta: 'Altura de la mesada' },
      { ruta: 'derecho.altoPuerta', etiqueta: 'Altura módulo de la mesa' },
      { ruta: 'derecho.alacena.profundidad', etiqueta: 'Alacena: profundidad' },
      { ruta: 'derecho.alacena.base', etiqueta: 'Alacena: altura de la base' },
      { ruta: 'derecho.alacena.alto', etiqueta: 'Alacena: alto' },
      { ruta: 'mesa.ancho', etiqueta: 'Mesa plegable: ancho' },
    ],
  },
  {
    titulo: 'Equipos (estimados)',
    campos: [
      { ruta: 'equipos.bateria.x', etiqueta: 'Batería 150 Ah: largo' },
      { ruta: 'equipos.bateria.y', etiqueta: 'Batería 150 Ah: alto' },
      { ruta: 'equipos.bateria.z', etiqueta: 'Batería 150 Ah: ancho' },
      { ruta: 'equipos.inversor.x', etiqueta: 'Inversor: ancho' },
      { ruta: 'equipos.inversor.z', etiqueta: 'Inversor: largo' },
      { ruta: 'equipos.nevera.x', etiqueta: 'Heladera: ancho' },
      { ruta: 'equipos.fregadero.x', etiqueta: 'Fregadero: ancho' },
      { ruta: 'equipos.fregadero.z', etiqueta: 'Fregadero: fondo' },
      { ruta: 'led.wPorM', etiqueta: 'Tira LED: W por metro', paso: 0.1 },
    ],
  },
];
