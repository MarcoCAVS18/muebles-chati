// Ayudas para mostrar en el idioma elegido los nombres que el motor arma en español.
const GRUPOS = { 'Mueble trasero': 'trasero', Cama: 'cama', 'Mueble derecho': 'derecho' };

// Nombre del mueble (el motor usa el nombre en español como identificador)
export const nombreGrupo = (t, g) => (GRUPOS[g] ? t(`grupos.${GRUPOS[g]}`) : g);

// Nombre de la madera de una placa (estructura, fondo) o de un listón (l30x30, l45x45)
export function nombreMaterial(t, cfg, mat) {
  if (cfg.materiales && cfg.materiales[mat]) return t(`materiales.${mat}`, { mm: cfg.materiales[mat].t, defaultValue: cfg.materiales[mat].nombre });
  if (cfg.listones && cfg.listones[mat]) return t(`materiales.${mat}`, { defaultValue: cfg.listones[mat].nombre });
  return mat;
}
