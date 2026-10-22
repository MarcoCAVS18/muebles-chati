// Guardado del proyecto en Firestore: un único documento proyectos/la-chata.
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, firebaseActivo } from './firebase.js';

// Cambia cuando se rediseñan los muebles: un guardado de otra versión no se carga
export const VERSION = 4;

const referencia = () => doc(db, 'proyectos', 'la-chata');

export async function cargarProyecto() {
  if (!firebaseActivo) return null;
  const snap = await getDoc(referencia());
  return snap.exists() ? snap.data() : null;
}

export async function guardarProyecto({ cfg, cargas, elec }) {
  if (!firebaseActivo) return;
  // Se guarda como texto JSON para evitar problemas con estructuras anidadas
  await setDoc(referencia(), {
    datos: JSON.stringify({ version: VERSION, cfg, cargas, elec }),
    actualizado: new Date().toISOString(),
  });
}
