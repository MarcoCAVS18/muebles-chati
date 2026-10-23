# La Chata - diseño de muebles

Proyecto React + three.js para diseñar los 3 muebles de la Citroën Jumpy y su sistema eléctrico,
con la distribución de la foto de referencia: mueble trasero cruzado de pared a pared detrás de los asientos
(de izquierda a derecha: eléctrico al piso con la batería acostada, inversor, DC-DC y fusibles, y sobre la cama el
panel y los enchufes con dos cajones de cocina arriba; cocina con anafe, gas y heladera al piso, al centro; y agua con
fregadero y bidones al piso, a la derecha), cama extensible de 90 a 120 cm de 170 cm de largo (placas de plywood con
esquinas redondeadas, bandejas sobre correderas, caja con arco y cajones), y mueble
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
- Herrajes: correderas, bisagras, pistones, bisagras de piano y cierres a botón (push) redondos, uno por frente.
- Eléctrica: consumo diario, autonomía, horas de manejo para recargar, cables y fusibles. Los largos de cable
  salen del recorrido dibujado en 3D. Las corrientes se calculan a 12 V, la entrada del DC-DC se calcula aparte de su
  salida, la heladera y la bomba llevan fusible con margen de arranque, la línea de 230 V lleva disyuntor y diferencial, y la
  caída de tensión se suma a lo largo de cada camino (batería a bomba, a heladera, a luces...) y no tramo por tramo.
- Sistema eléctrico en 3D: batería del auto bajo el asiento del acompañante, fusible ANL, cable largo bajo los
  asientos, DC-DC, batería de 150 Ah, caja de fusibles, inversor, panel de 5 interruptores, 2 enchufes con USB-C,
  4 tiras LED de 2 m en el techo (dos centrales a los costados del extractor y dos laterales cerca de las paredes, con el mismo
  inicio y fin), lámpara flexible de lectura en la pared izquierda (el cable va por el techo y baja por la viga sin aislar de
  22 cm), bomba y mangueras de agua y de gas. El extractor del techo (310 x 310 mm con el marco) se abre a mano: está en el 3D
  pero sin conexión eléctrica.
- Botones push: cada puerta y cada cajón de los tres muebles lleva un botón negro redondo en el 3D, para ver dónde va.
  Las bandejas de la cama conservan un tirador embutido porque el canto de 15 mm es muy fino para el botón.
- Sistema de gas en 3D: garrafa chica recargable en un cajón bajo el anafe, regulador, manguera, llave de corte y
  detector de gas, con la ventilación al exterior por el piso.
- Al hacer clic en cualquier equipo, cable o manguera (en el 3D o en la pestaña Eléctrica) se abre un panel con qué
  es, dónde va, cómo se conecta y un video de YouTube recomendado.
- Modo pieza: doble clic en una madera (en el 3D, en la lista de despiece o en el plano de cortes) y las demás se desvanecen:
  la cámara vuela hasta la pieza y la deja sola, con las tres medidas en cotas, las esquinas redondeadas con su radio,
  el recorte o el arco calado y marcas de ángulo recto en los cortes rectos. Flechas del teclado (o los botones) para pasar a la
  pieza anterior o siguiente, "Dar vuelta" para ver la otra cara, "Ver el mueble de fondo" para ver dónde va y Esc para volver.
  El contorno de cada pieza y las cotas salen de `src/engine/enfoque.js`; `npm run check` los prueba en las 127 piezas.
- Lista de compras agrupada.
- Avisos si una pieza choca con otro mueble, con el pasarruedas o se sale de la van.

## Dónde cambiar cosas

- `src/data/defaults.js`: medidas de la van, materiales, equipos y consumos iniciales.
- `src/engine/trasero.js`, `cama.js`, `derecho.js`: los tres muebles. `frentes.js` arma los frentes con puertas a ras.
- `src/engine/electrico3d.js`: posición de cada equipo eléctrico y recorrido 3D de cada cable.
- `src/engine/electrica.js`: cálculo de cables, fusibles y batería.
- `src/data/videos.js`: videos de YouTube de cada elemento. `src/data/elementos.js`: textos del panel.

## Supuestos a confirmar con medidas reales

- Medidas tomadas en la van (de atrás hacia adelante): hasta el pasarruedas 33 cm libres, pasarruedas 80 cm de largo x 42,5 cm de
  alto x 18,5 cm de profundidad, vigas sin aislar de 22 cm, puerta lateral de 98 cm (queda 9 cm antes de la mampara) y
  84 cm desde lo alto del pasarruedas hasta el techo construible. La mampara entre los asientos ya no está: tenía una curva con
  10 cm libres abajo que se usan para pasar el cable largo.
- Medidas de la batería de 150 Ah, inversor, DC-DC, caja de fusibles, batería del auto, fregadero y bidones (estimadas).
- Potencia del inversor (se supuso 1000 W) y consumo de las tiras LED (9,6 W por metro, 4 horas por día cada una).
- Qué hace cada uno de los 5 interruptores (supuesto: luces centrales del techo, luces laterales del techo, lámpara flexible,
  bomba y mando del inversor).
- Botones push: tamaño supuesto de 28 mm de diámetro y 12 mm de saliente (se venden en packs de 10). La bisagra de cada puerta
  se supuso del lado del frente del mueble, por eso el botón queda cerca del borde libre.
- Tiras LED: las centrales quedan a 6 cm del marco del extractor (x 635 y 1085) y las laterales a 25 cm de cada pared
  (x 250 y 1470). Confirmar en la van si el techo curvo permite pegarlas ahí. Todas se calcularon con 4 h por día, y la
  autonomía baja a 1,7 días; se edita en la pestaña Eléctrica.
- Lámpara flexible (MRYC de 12 V con interruptor táctil y USB 5 V 2 A): 13 W estimados (3 W de luz y 10 W de USB) durante 0,5 h por día,
  base a 68 cm del piso (z 1230, centro de la viga de 22 cm). Se asumió la viga izquierda igual a la derecha.
- Mueble trasero de pared a pared (1720 mm) y de 500 mm de profundidad, con una L de 670 mm solo en la sección eléctrica
  (a la izquierda), que llega hasta el pie de la cama de 170 cm. Si tapa la puerta corrediza, achicar el ancho en la barra
  lateral. Secciones (x): eléctrico 15-617, cocina 632-1087 y agua 1102-1705.
- La cama queda a 44 cm, apenas sobre el pasarruedas, y apoya sobre él. Bajo la cama, frente a la L, queda un hueco libre de
  430 mm para abrir la puerta de la batería. Todo lo eléctrico queda al piso, debajo del plano de la cama; el panel y los
  enchufes van sobre la cama, en el tablero de arriba, y los cajones de cocina de la L van sobre el tablero.
- Mueble derecho: se apoya sobre el pasarruedas derecho. Bajo 43 cm solo queda libre la franja del frente (cerrada con un
  frente ciego) y los dos cajones se acomodan arriba, a partir de los 45 cm.
- El frente de la cocina y del agua está en z = 1910, 170 mm detrás del frente de la L (z = 1740), donde termina la placa de la
  cabecera. La garrafa se carga una vez por semana: el cajón del gas (correderas de 300 mm, frente alto) se tira entero y la
  garrafa queda fuera del mueble para levantarla, con el regulador y la manguera quedando en el cajón. Para que el frente alto
  no choque con la cama, la placa de la cabecera lleva un recorte de 261 x 150 mm en la esquina del lado de la cocina (el
  colchón lleva el mismo recorte). `npm run check` verifica que el cajón no choque al sacarlo.
  La sección de agua tapa parte de la puerta lateral derecha (z 1340 a 2320).
- Gas: la rejilla de ventilación al piso hoy cae bajo la heladera, no bajo la garrafa. Falta definir cómo ventila el cajón del gas.
- Medidas estimadas de la cocina: anafe 420 x 300 mm, garrafa de 230 mm de diámetro y 330 mm de alto, heladera 420 x 300 x 340 mm,
  fregadero 340 de ancho x 400 de fondo, bidones de 20 L de 215 x 400 x 290 mm.
- Gas: confirmar la normativa de tu país y que lo revise un instalador de gas. El cajón de la garrafa necesita una rejilla de
  ventilación hacia el exterior por el piso, detector de gas y detector de monóxido de carbono.
- Los cajones de la cama se tiran hacia el pasillo (en la foto se ven del otro lado, contra la pared).
- Placas de la cama: cabecera de 1100 mm y pie de 600 mm de largo (900 mm de ancho, 3 mm de luz entre las dos), las dos con su
  bandeja extensible. La del pie mide unos 311 mm de largo porque los primeros 255 mm son la caja con arco. Se cambia en
  "Largo placa cabecera" (un guardado con el valor anterior de 940 mm pasa solo a 1100).
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
