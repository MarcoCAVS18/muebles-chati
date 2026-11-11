// Guardado del proyecto en Firestore: un único documento proyectos/la-chata.
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, firebaseActivo } from './firebase.js';
import { STOCK_VERSION } from './data/stock.js';

// Cambia cuando se rediseñan los muebles: un guardado de otra versión no se carga
export const VERSION = 6;

const referencia = () => doc(db, 'proyectos', 'la-chata');

export async function cargarProyecto() {
  if (!firebaseActivo) return null;
  const snap = await getDoc(referencia());
  return snap.exists() ? snap.data() : null;
}

export async function guardarProyecto({ cfg, cargas, elec, tenemos, colorPiezas }) {
  if (!firebaseActivo) return;
  // Se guarda como texto JSON para evitar problemas con estructuras anidadas
  await setDoc(referencia(), {
    datos: JSON.stringify({ version: VERSION, cfg, cargas, elec, tenemos, colorPiezas, stockV: STOCK_VERSION }),
    actualizado: new Date().toISOString(),
  });
}
