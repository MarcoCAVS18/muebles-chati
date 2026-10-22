# La Chata - diseño de muebles

Proyecto React + three.js para diseñar los 3 muebles de la Citroën Jumpy y su sistema eléctrico,
con la distribución de la foto de referencia: mueble trasero cruzado detrás de los asientos (fregadero,
heladera, bidones, batería e inversor), cama extensible de 90 a 120 cm (placas de plywood con esquinas redondeadas, bandejas sobre correderas, caja con arco y cajones), y mueble
derecho con cajones, alacena y mesa plegable.

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
- Eléctrica: consumo diario, autonomía, horas de manejo para recargar, cables y fusibles. Los largos de cable
  salen del recorrido dibujado en 3D.
- Sistema eléctrico en 3D: batería del auto bajo el asiento del acompañante, fusible ANL, cable largo bajo los
  asientos, DC-DC, batería de 150 Ah, caja de fusibles, inversor, panel de 5 interruptores, 2 enchufes con USB-C,
  2 tiras LED de 2 m en el techo, extractor, bomba y mangueras de agua.
- Al hacer clic en cualquier equipo, cable o manguera (en el 3D o en la pestaña Eléctrica) se abre un panel con qué
  es, dónde va, cómo se conecta y un video de YouTube recomendado.
- Lista de compras agrupada.
- Avisos si una pieza choca con otro mueble, con el pasarruedas o se sale de la van.

## Dónde cambiar cosas

- `src/data/defaults.js`: medidas de la van, materiales, equipos y consumos iniciales.
- `src/engine/trasero.js`, `cama.js`, `derecho.js`: los tres muebles. `frentes.js` arma los frentes con puertas a ras.
- `src/engine/electrico3d.js`: posición de cada equipo eléctrico y recorrido 3D de cada cable.
- `src/engine/electrica.js`: cálculo de cables, fusibles y batería.
- `src/data/videos.js`: videos de YouTube de cada elemento. `src/data/elementos.js`: textos del panel.

## Supuestos a confirmar con medidas reales

- Largo y entrada del pasarruedas (estimados).
- Medidas de la batería de 150 Ah, inversor, DC-DC, caja de fusibles, batería del auto, fregadero y bidones (estimadas).
- Potencia del inversor (se supuso 1000 W) y consumo de las tiras LED (9,6 W por metro).
- Qué hace cada uno de los 5 interruptores (supuesto: luces 1, luces 2, bomba, extractor y mando del inversor).
- Los cajones de la cama se tiran hacia el pasillo (en la foto se ven del otro lado, contra la pared).
- Cama extensible: al abrir, la bandeja queda 16 mm más baja que la placa fija (la cubre el colchón o un relleno de 15 mm).
  La zona del pie (caja con arco) no se extiende: ahí la cama sigue en 90 cm. Con la cama abierta quedan 110 mm de pasillo.
- Correderas de las bandejas: de carga, 500 mm, extensión total, 100 kg el par. Confirmar con la ficha de las que compres.
- Mesa plegable reducida a 400 mm de ancho para que no pase sobre la cama de 90 cm.
- Consumos de cada aparato.
- Tamaño de hoja que vende Derome (se usó 2440 x 1220).
- Ejes del modelo: x = 0 en la pared izquierda mirando desde la puerta trasera hacia los asientos, z = 0 en la
  puerta trasera. El 3D se dibuja espejado en x para que izquierda y derecha se vean como en la van real.
- El tablero de la foto no se puede medir: las medidas de cada frente y de las ranuras salen de la imagen.

## Firebase (base de datos y hosting)

El proyecto usa Firestore para guardar las medidas (documento `proyectos/la-chata`, con guardado
automático) y Hosting para publicar la app.

1. Copiar `.env.example` a `.env` y completar los valores de la configuración web de Firebase.
2. `npm install -g firebase-tools` y después `firebase login`.
3. Crear la base Firestore desde la consola de Firebase (modo producción).
4. `npm run deploy` compila y publica Hosting. Para publicar solo las reglas: `firebase deploy --only firestore:rules`.

Las reglas actuales dejan abierto solo ese documento, sin login. Quien tenga la URL puede leerlo y
modificarlo. Si querés cerrarlo, hay que agregar Firebase Auth.
