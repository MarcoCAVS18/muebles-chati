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
      { ruta: 'van.archLargo', etiqueta: 'Pasarruedas: largo' },
      { ruta: 'van.archIntrusion', etiqueta: 'Pasarruedas: entra' },
      { ruta: 'van.archAlto', etiqueta: 'Pasarruedas derecho: alto' },
      { ruta: 'van.archAltoIzq', etiqueta: 'Pasarruedas izquierdo: alto (con su tapa)' },
      { ruta: 'van.puertaLateral.largo', etiqueta: 'Puerta lateral: largo' },
      { ruta: 'van.puertaLateral.vigas', etiqueta: 'Vigas sin aislar (antes de la puerta)' },
      { ruta: 'van.puertaLateral.desdeMamparo', etiqueta: 'Puerta lateral: distancia a la mampara' },
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
      { ruta: 'trasero.profundidad', etiqueta: 'Profundidad (cocina y agua)' },
      { ruta: 'trasero.profundidadL', etiqueta: 'Profundidad de la L (eléctrico)' },
      { ruta: 'trasero.alto', etiqueta: 'Alto' },
      { ruta: 'trasero.zocalo', etiqueta: 'Zócalo' },
      { ruta: 'trasero.divisor1', etiqueta: 'Fin del eléctrico (x)' },
      { ruta: 'trasero.divisor2', etiqueta: 'Fin de la cocina (x)' },
    ],
  },
  {
    titulo: 'Cama extensible',
    campos: [
      { ruta: 'cama.ancho', etiqueta: 'Ancho cerrada' },
      { ruta: 'cama.extension', etiqueta: 'Cuánto se agranda' },
      { ruta: 'cama.radio', etiqueta: 'Radio de esquinas' },
      { ruta: 'cama.largo', etiqueta: 'Largo (180 cm, de pared a pared del mueble trasero)' },
      { ruta: 'cama.plataforma', etiqueta: 'Altura de la plataforma (pasarruedas + fieltro + placa)' },
      { ruta: 'cama.fieltro', etiqueta: 'Fieltro sobre el pasarruedas' },
      { ruta: 'cama.largoCabecera', etiqueta: 'Largo del módulo de la cabecera' },
      { ruta: 'cama.varillasPie', etiqueta: 'Varillas del módulo del pie' },
      { ruta: 'cama.varillasCabecera', etiqueta: 'Varillas del módulo de la cabecera' },
      { ruta: 'cama.ranura.ancho', etiqueta: 'Ancho de cada ranura (0 = repartir en la bahía)' },
      { ruta: 'cama.ranura.dedo', etiqueta: 'Dedo fijo respecto de la ranura (1 = igual)' },
      { ruta: 'cama.ranura.radio', etiqueta: 'Ranuras: radio del fondo' },
      { ruta: 'cama.lomo', etiqueta: 'Lomo fijo (contra la pared)' },
      { ruta: 'cama.lomoMovil', etiqueta: 'Lomo móvil (lado del pasillo)' },
      { ruta: 'cama.alturaCorredera', etiqueta: 'Alto máximo de las correderas' },
      { ruta: 'cama.ventana.radio', etiqueta: 'Ventanas: radio de esquinas' },
      { ruta: 'cama.ventana.zocalo', etiqueta: 'Ventanas: madera abajo' },
      { ruta: 'cama.ventana.cabezal', etiqueta: 'Ventanas: madera arriba' },
      { ruta: 'cama.ventana.margen', etiqueta: 'Ventanas: margen a los lados' },
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
      { ruta: 'equipos.nevera.y', etiqueta: 'Heladera: alto' },
      { ruta: 'equipos.nevera.z', etiqueta: 'Heladera: fondo' },
      { ruta: 'equipos.fregadero.x', etiqueta: 'Fregadero: ancho (estimado)' },
      { ruta: 'equipos.fregadero.z', etiqueta: 'Fregadero: fondo' },
      { ruta: 'equipos.bidon.x', etiqueta: 'Bidón 20 L: largo (a lo ancho del cajón)' },
      { ruta: 'equipos.bidon.y', etiqueta: 'Bidón 20 L: alto' },
      { ruta: 'equipos.bidon.z', etiqueta: 'Bidón 20 L: grosor (a lo largo del cajón)' },
      { ruta: 'equipos.bidon.canilla', etiqueta: 'Bidón 20 L: lo que sobresale la canilla' },
      { ruta: 'equipos.anafe.x', etiqueta: 'Anafe: ancho' },
      { ruta: 'equipos.anafe.z', etiqueta: 'Anafe: fondo' },
      { ruta: 'equipos.garrafa.x', etiqueta: 'Garrafa: diámetro (estimado)' },
      { ruta: 'equipos.garrafa.y', etiqueta: 'Garrafa: alto (estimado)' },
      { ruta: 'led.wPorM', etiqueta: 'Tira LED: W por metro', paso: 0.1 },
    ],
  },
  {
    titulo: 'Techo (extractor, tiras LED) y lámpara',
    campos: [
      { ruta: 'extractor.x', etiqueta: 'Extractor: centro (x)' },
      { ruta: 'extractor.z', etiqueta: 'Extractor: centro (z desde atrás)' },
      { ruta: 'extractor.hueco', etiqueta: 'Extractor: hueco del techo' },
      { ruta: 'extractor.marco', etiqueta: 'Extractor: con el marco' },
      { ruta: 'led.x1', etiqueta: 'Tira LED 1 (central izquierda): posición (x)' },
      { ruta: 'led.x2', etiqueta: 'Tira LED 2 (central derecha): posición (x)' },
      { ruta: 'led.x3', etiqueta: 'Tira LED 3 (lateral izquierda): posición (x)' },
      { ruta: 'led.x4', etiqueta: 'Tira LED 4 (lateral derecha): posición (x)' },
      { ruta: 'lampara.z', etiqueta: 'Lámpara flexible: posición (z desde atrás)' },
      { ruta: 'lampara.y', etiqueta: 'Lámpara flexible: altura de la base' },
    ],
  },
];
