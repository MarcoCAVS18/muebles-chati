# La Chata - diseño de muebles

Proyecto React + three.js para diseñar los 3 muebles de la Citroën Jumpy: mueble izquierdo,
cama con cajones y mueble derecho (pileta, alacena y mesa plegable).

## Uso

```
npm install
npm run dev
```

Abrir la dirección que muestra Vite (normalmente http://localhost:5173).

- `npm run check` prueba el motor de cálculo sin abrir el navegador.
- `npm run build` genera la versión para publicar.

## Qué calcula

- Despiece completo con medidas, espesor y material de cada pieza (exporta CSV).
- Plano de cortes por hoja, con los pasos de corte para sierra circular.
- Dónde se fija cada mueble (piso, pared, entre muebles) y cuántos tornillos y escuadras.
- Herrajes: correderas, bisagras, pistones, bisagras de piano, tiradores.
- Eléctrica: consumo diario, autonomía, horas de manejo para recargar, cables y fusibles.
- Lista de compras agrupada.
- Avisos si una pieza choca con otro mueble, con el pasarruedas o se sale de la van.

## Dónde cambiar cosas

- `src/data/defaults.js`: medidas de la van, materiales, equipos y consumos iniciales.
- `src/engine/mueble.js`: mueble bajo y alacena.
- `src/engine/cama.js`: cama, cajones y mesa.
- `src/engine/electrica.js`: cálculo de cables y batería.

## Supuestos a confirmar con medidas reales

- Largo y entrada del pasarruedas (estimados).
- Medidas de batería, DC-DC, caja de fusibles, pileta y tanque (estimadas).
- Consumos de cada aparato.
- Tamaño de hoja que vende Derome (se usó 2440 x 1220).
- La disposición de cada mueble sigue la foto de referencia. Si en la van el mueble de la pileta
  va del otro lado, hay que cambiar los lados en `src/engine/construir.js`.

## Firebase (base de datos y hosting)

El proyecto usa Firestore para guardar las medidas (documento `proyectos/la-chata`, con guardado
automático) y Hosting para publicar la app.

1. Copiar `.env.example` a `.env` y completar los valores de la configuración web de Firebase.
2. `npm install -g firebase-tools` y después `firebase login`.
3. Crear la base Firestore desde la consola de Firebase (modo producción).
4. `npm run deploy` compila y publica Hosting. Para publicar solo las reglas: `firebase deploy --only firestore:rules`.

Las reglas actuales dejan abierto solo ese documento, sin login. Quien tenga la URL puede leerlo y
modificarlo. Si querés cerrarlo, hay que agregar Firebase Auth.
