# La Chata - diseño de muebles

Proyecto React + three.js para diseñar los 3 muebles de la Citroën Jumpy y su sistema eléctrico,
con la distribución de la foto de referencia: mueble trasero cruzado de pared a pared detrás de los asientos
(de izquierda a derecha: eléctrico al piso con la batería, inversor, DC-DC y fusibles, y sobre la cama el
panel y los enchufes con dos cajones de cocina arriba; cocina con dos cajones y, al piso, el guardado del anafe portátil a cartucho, al centro; y agua con
fregadero y bidones al piso, a la derecha), cama extensible de 71 a 120 cm de 180 cm de largo (placas de plywood con
esquinas redondeadas y ranuras en peine, varillas sobre correderas, costados fijos con una puerta que baja y portales en U que salen con la extensión), y mueble
derecho con cajones, alacena y mesa plegable.

## Uso

```
npm install
npm run dev
```

Abrir la dirección que muestra Vite (normalmente http://localhost:5173).

- `npm run check` prueba el motor de cálculo sin abrir el navegador.
- `npm run build` genera la versión para publicar.
- `node scripts/check-i18n.mjs` comprueba que español, inglés y sueco tengan las mismas claves y que lo eléctrico cubra todos los ids del motor.
- `node scripts/check-secuencia.mjs` comprueba el armado animado: cada madera llega una sola vez, los tornillos entran después de que estén las dos maderas y no queda ninguna unión sin cubrir.

## Qué calcula

- Despiece completo con medidas, espesor y material de cada pieza (exporta CSV).
- Plano de cortes por hoja, con los pasos de corte para sierra circular.
- Armado: un tutorial por mueble (pestaña Armado) con los pasos para construirlo y instalarlo: qué madera, de qué hoja sale,
  tornillos, cola, correderas de los cajones, bisagras, botones push, agujeros para cables y mangueras, y los calados de la
  heladera, el anafe y el fregadero. Sale del mismo modelo que el despiece (`src/engine/tutorial.js`), así que si cambia una
  medida cambia el tutorial. Cada mueble abre con una portada con una escalera de pasos que se va pintando de madera a
  medida que se terminan; cada paso tiene sus tareas tildables, las maderas como tablitas con su id y botones para pasar
  al siguiente. Mientras un paso está abierto, sus maderas se ven en rosa en el 3D (en el celular, con el botón "Ver estas
  maderas en el 3D"). Todo lo tildado se recuerda en el navegador; lo que todavía no se puede decidir va en "Qué falta
  definir" y lo que el diseño deja abierto va marcado con "Ojo".
- Diseño: fondo violeta con hojas claras encima, la madera contrachapada como protagonista y los ids escritos a lápiz.
  Las tipografías (Bricolage Grotesque, Instrument Sans y Permanent Marker) se instalan con npm y salen del propio sitio,
  sin pedirlas a Google.
- Visor 3D con barra de píldoras (al estilo de madera.app, en violeta): tres modos (Armado, Abierto con los cajones y las
  puertas abiertos y las varillas de la cama afuera, y Explotado), cotas del ancho, alto y fondo de cada mueble, y colores por
  rol (amarillo frentes y puertas, celeste costados, verde bases y estantes, lila fondos y cajones por dentro, madera listones).
  La bisagra de cada puerta se ubica del lado contrario a su botón push. El piso es una grilla de puntos con sombra suave.
- Dónde se fija cada mueble (piso, pared, entre muebles) y cuántos tornillos y escuadras.
- Uniones entre maderas (`src/engine/uniones.js`): la app detecta dónde se tocan las piezas (unas 190 uniones y unos 660 tornillos) y para
  cada una define cola, diámetro y largo del tornillo, separación, desde qué cara se atornilla y el pretaladro. Cara contra canto: se
  atraviesa la pieza fina y el tornillo entra 25 mm en el canto (4x40 en madera de 15 mm y en la de 12 mm del mueble trasero; 3,5x30 en el piso de 9 mm de los cajones del mueble derecho);
  cara contra cara: 4x25 o 4x30. Primer tornillo a 30 mm del extremo y uno cada 150 mm (120 mm en cajones y tapas finas, 200 mm en las
  placas de la cama, que van sin cola y solo desde arriba para poder levantarlas). Un contacto de menos de 30 mm o un canto de menos de
  12 mm va solo con cola. No se atornillan entre sí las piezas que se mueven (varillas, portales, cajones), las que cuelgan de bisagras ni
  los muebles entre sí: eso sigue en Herrajes y "Dónde van enganchados". Se ve en tres lugares: la ficha de cada pieza (doble clic) trae
  «Cómo se une», con marcas naranjas (agujero pasante) y azules (pretaladro en el canto) sobre la madera; la opción «Ver tornillos» del
  3D dibuja cada tornillo con su largo (la madera se vuelve transparente y, si elegís una pieza, se marcan los suyos); y cada paso del
  armado trae la tabla de las uniones que se hacen ahí. La lista de compras y la pestaña Herrajes usan estas cantidades, con 10 % de margen.
- Herrajes: correderas, bisagras, pistones, bisagras de piano y cierres a botón (push) redondos, uno por frente.
- Eléctrica: consumo diario, autonomía, horas de manejo para recargar, cables y fusibles. Los largos de cable
  salen del recorrido dibujado en 3D. Las corrientes se calculan a 12 V, la entrada del DC-DC se calcula aparte de su
  salida, la heladera y la bomba llevan fusible con margen de arranque, la línea de 230 V lleva disyuntor y diferencial, y la
  caída de tensión se suma a lo largo de cada camino (batería a bomba, a heladera, a luces...) y no tramo por tramo.
- Sistema eléctrico en 3D: batería del auto bajo el asiento del acompañante, fusible ANL, cable largo bajo los
  asientos, DC-DC, disyuntor de 120 A (DC-DC a batería), batería de 150 Ah, disyuntor de 120 A (batería a caja de fusibles),
  caja de fusibles de 12 salidas, calefactor de la batería (plancha aislante y almohadilla de 30 W bajo ella, termostato con sonda
  pegada a la batería y salida propia de 5 A), inversor, panel de 5 interruptores, 2 enchufes con USB-C,
  4 tiras LED de 2 m en el techo (dos centrales a los costados del extractor y dos laterales cerca de las paredes, con el mismo
  inicio y fin), lámpara flexible de lectura en la pared izquierda (el cable va por el techo y baja por la viga sin aislar de
  22 cm), bomba y mangueras de agua. El extractor del techo (310 x 310 mm con el marco) se abre a mano: está en el 3D
  pero sin conexión eléctrica.
- Botones push: cada puerta y cada cajón de los tres muebles lleva un botón negro redondo en el 3D, para ver dónde va.
- Lo que tenemos y lo que falta: el botón de la tilde en la barra del 3D pinta la madera de dos colores (verde, ya la tenemos; ámbar, falta) y cuenta las piezas de cada una. La lista inicial está en `src/data/stock.js` (toda la cama, CAM-01 a 32; falta solo la madera de 5 mm sobre el pasarruedas, CAM-33) y se cambia con la casilla «Ya la tenemos» de la tarjeta de cada pieza (doble clic en la madera); se guarda en la nube. Las varillas móviles cuentan como que están si la placa de la que salen está.
  Las varillas de la cama conservan un tirador embutido porque el canto de 15 mm es muy fino para el botón.
- Cocina sin gas fijo: anafe portátil de 2 hornallas a cartucho, guardado de canto al piso de la cocina detrás de una puerta, con dos
  cartuchos parados al lado (uno conectado y uno de repuesto). Se usa suelto sobre la tapa, en la sección de la cocina, sin calado.
- Al hacer clic en cualquier equipo, cable o manguera (en el 3D o en la pestaña Eléctrica) se abre un panel con qué
  es, dónde va, cómo se conecta y un video de YouTube recomendado.
- Modo pieza: doble clic en una madera (en el 3D, en la lista de despiece o en el plano de cortes) y las demás se desvanecen:
  la cámara vuela hasta la pieza y la deja sola, con las tres medidas en cotas, las esquinas redondeadas con su radio,
  el recorte, el arco, las ranuras y las ventanas (con su medida y su radio) y marcas de ángulo recto en los cortes rectos. Flechas del teclado (o los botones) para pasar a la
  pieza anterior o siguiente, "Dar vuelta" para ver la otra cara, "Ver el mueble de fondo" para ver dónde va y Esc para volver.
  El contorno de cada pieza y las cotas salen de `src/engine/enfoque.js`; `npm run check` los prueba en todas las piezas.
- Versión para celular y tablet (pantallas de hasta 1100 px de ancho o poca altura): una sola sección por vez, con barra de
  abajo (3D, Medidas, Despiece, Cortes, Herrajes, Eléctrica, Armado, Compras). Los modos del 3D están en la barra de arriba (lo demás, en "Opciones"), el
  doble toque en una madera la deja sola (también desde el despiece y las hojas de corte, con un botón "Ver sola"), y al salir
  se vuelve a la lista de donde se vino. En vertical la cámara inicial mira a lo largo de la van para llenar la pantalla; en
  horizontal la tarjeta de la pieza va a un costado. El panel con el video de cada equipo sube desde abajo.
- Lista de compras agrupada.
- Avisos si una pieza choca con otro mueble, con el pasarruedas o se sale de la van.

## Armado animado

En la pestaña Armado, cada paso tiene el botón **Ver armado animado** y la portada de cada mueble tiene **Ver el mueble armándose**. En el 3D las maderas del paso llegan una por una (la primera de cada módulo aparece flotando y baja; las demás se deslizan hasta apoyarse), se extiende la cola sobre el contacto y los tornillos entran girando. Una barra abajo del 3D permite pausar, saltar de madera o de paso, cambiar la velocidad (0.5x a 4x), mover la línea de tiempo y apagar la cámara automática.

- `src/engine/secuencia.js` arma la secuencia a partir de los pasos del tutorial y de las uniones: orden de las maderas, por dónde llega cada una (primero por el eje de sus uniones; si está tapado, por un lado libre) y cuándo entran los tornillos. Si cambia una medida, la secuencia cambia sola.
- `src/util/reproductor.js` lleva el reloj. El 3D lo lee en cada cuadro y la pantalla solo se vuelve a dibujar cuando cambia el evento o play y pausa.
- `src/components/ArmadoAnimado.jsx` dibuja lo que se mueve y `src/components/BarraArmado.jsx` la barra.
- Por ahora no se animan los herrajes, bisagras, manijas ni las decoraciones: solo maderas, cola y tornillos.

## Colores a mano

Con un clic en una madera aparece, abajo del 3D, una barra de colores pastel para pintarla (otra vez el mismo color, o «Sin color», la deja como estaba). El color se guarda con el proyecto en Firebase (`colorPiezas`, un `{ id: '#rrggbb' }`) y se ve en el 3D, en el modo pieza y en el armado animado. Con «lo que tenemos y lo que falta» prendido manda ese código de colores. Los colores están en `PASTELES` de `src/engine/colores.js`.

## Fondo inclinado del mueble trasero (variante opcional)

Detrás del mueble trasero, la separación metálica y los asientos dejan un hueco en cuña: mucho en el piso y casi nada arriba. En «Medidas», sección «Mueble trasero», el casillero **Fondo inclinado** (apagado por defecto) cambia el fondo plano por un solo plano inclinado que sigue ese perfil. Con 10 mm de aire (campo «Aire del fondo inclinado») queda a unos 10,9° respecto de la vertical: el mueble gana unos 143 mm de fondo abajo, donde van la batería y los bidones, y pierde unos 14 mm arriba.

- El perfil es lo que se midió con una tanza vertical el 18/11 (igual en todo el ancho, 0 = piso terminado) y está en `src/data/perfilMamparo.js`. El plano sale de ahí (`src/engine/fondoInclinado.js`): el más profundo que no toca nada con el aire pedido. Si volvés a medir, se cambian esos números y se recalcula todo.
- Con la variante prendida cambian: los dos fondos (parados, con el largo sobre la pendiente, girados en el 3D sobre su borde de abajo), los costados y los dos divisores (borde de atrás cortado en diagonal), la base, los estantes y los apoyos (más largos, hasta la cara de adelante del fondo), el recorrido del cable largo y del cable de la bomba, y el tutorial del mueble trasero (cortes en diagonal y biselado de los cantos). Las demás piezas, los ids y los frentes quedan igual.
- Los fondos inclinados no entran en el cálculo automático de uniones: sus uniones (cola y tornillos 3,5x20 cada 100 mm a las bases y los divisores) están escritas a mano en `trasero.js` y suman a Fijaciones y Compras.
- `node scripts/check.mjs` prueba siempre las dos versiones: que el plano no toque lo medido, que los equipos y cables no entren en el fondo y que nada más se mueva.

## Base reforzada de la cama (variante opcional)

En «Medidas», sección «Cama», el casillero **Base reforzada** (apagado por defecto) agrega la base que se armó en el taller. Cada módulo se arma sobre un marco de piso de listones de 45 x 45 (sus dos refuerzos de piso y dos rieles) y de ahí salen postes verticales de 30 x 30 hasta los listones de pared y los largueros.

- Los dos rieles de cada módulo son el del pasillo y el de la cara del pasarruedas (a 190 mm de la pared). El del pasillo es el listón de las bisagras (CAM-11 y CAM-13) hecho de 45 x 45 y al piso, en el mismo lugar y con el mismo id: es lo único existente que cambia, y solo con la variante prendida. Se suman 12 maderas al final de la cama (CAM-33 a CAM-44): riel del pie, riel de la cabecera, listón de piso contra la pared del pie, viga del medio de la cabecera y 8 postes. Ningún otro id ni medida se mueve.
- Los postes van sobre los marcos o la viga y suben hasta la cara de abajo de los listones de pared y de los largueros (355 mm); los dos de junto al panel central llegan hasta la placa (385 mm). El de la cabecera pegado al final del pasarruedas apoya en el piso porque ahí no se armó listón de piso.
- El tutorial suma dos pasos antes de las cajas («Marcos de piso» y «Postes verticales») y los refuerzos y los rieles se arman ahí, no más adelante. El armado animado sigue ese orden.
- Dos uniones de madera contra madera de la misma sección no entran en el cálculo automático: están escritas a mano en `cama.js` y suman a Fijaciones y Compras (cola y tornillos 4x80 de testa, y 4x50 en los postes).
- Las medidas salen de las fotos del taller y de las posiciones del modelo, no de una medición con metro: confirmar la posición de los rieles de la cara del pasarruedas y la altura real de los postes.
- `node scripts/check.mjs` prueba siempre las dos versiones: que no cambie ninguna otra madera, que nada se cruce y que cada poste apoye abajo y arriba.

## Dónde cambiar cosas

- `src/data/defaults.js`: medidas de la van, materiales, equipos y consumos iniciales.
- `src/engine/trasero.js`, `cama.js`, `derecho.js`: los tres muebles. `frentes.js` arma los frentes con puertas a ras.
- `src/engine/electrico3d.js`: posición de cada equipo eléctrico y recorrido 3D de cada cable.
- `src/engine/colores.js`: rol de color de cada madera. `src/engine/abrir.js`: cómo se mueve cada cajón y cada puerta en el modo Abierto.
- `src/engine/electrica.js`: cálculo de cables, fusibles y batería.
- `src/data/videos.js`: videos de YouTube de cada elemento. `src/data/elementos.js`: textos del panel.

## Supuestos a confirmar con medidas reales

- Medidas tomadas en la van (de atrás hacia adelante): hasta el pasarruedas 33 cm libres, pasarruedas 80 cm de largo x 42,5 cm de
  alto x 18,5 cm de profundidad, vigas sin aislar de 22 cm, puerta lateral de 98 cm (queda 9 cm antes de la mampara) y
  84 cm desde lo alto del pasarruedas hasta el techo construible. La mampara entre los asientos ya no está: tenía una curva con
  10 cm libres abajo que se usan para pasar el cable largo.
- Medidas de la batería de 150 Ah, inversor, DC-DC, caja de fusibles, batería del auto, fregadero y bidones (estimadas).
- Medidas de los disyuntores de 120 A (80 x 45 x 70 mm, se montan con la palanca hacia arriba), de la almohadilla (150 x 150 x 3 mm), del aislante (305 x 10 x 230 mm) y del termostato (60 x 35 x 22 mm), y la potencia del calefactor (30 W, un quinto del tiempo encendido, 8 horas por día).
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
- Mueble trasero de pared a pared (1720 mm) y de 500 mm de profundidad, con una L de 570 mm solo en la sección eléctrica
  (a la izquierda), que llega hasta el pie de la cama de 180 cm. Si tapa la puerta corrediza, achicar el ancho en la barra
  lateral. Secciones (x): eléctrico 15-617, cocina 632-1087 y agua 1102-1705.
- La cama queda a 40 cm: el pasarruedas izquierdo, con su tapa, mide 38 cm; con una madera de 5 mm pegada encima (CAM-33, 185 x 800 mm, sale de un
  retazo) y la placa de 15 mm la superficie llega a
  400 mm (el frente del pie y la guía de la cabecera miden 400 mm, el panel central 385 mm). El arco real mide 42,5 cm: la placa lleva un
  corte ahí, que todavía no se dibuja. Las dos placas y los dos módulos llenan los 180 cm, hasta el frente de la L. Al compartimento
  eléctrico se entra por una puerta en el costado izquierdo (la que se ve al abrir la puerta corrediza de la van), no por debajo de la cama.
  Todo lo eléctrico queda al piso, debajo del plano de la cama; el panel y los enchufes van sobre la cama, en el tablero de arriba, y los
  cajones de cocina de la L van sobre el tablero. El estante de los equipos queda a 395 mm para dejar 55 mm o más sobre los bornes.
- Mueble trasero: se arma entero afuera (cajas, estantes, marcos, cajones y puertas) en dos módulos que pasan por las puertas y se
  unen adentro de la van: el eléctrico (izquierda, con el divisor 1 como pared derecha) y el de cocina y agua (sin pared izquierda:
  apoya contra ese divisor). Por eso el fondo es de dos piezas. Después va la tapa, de un solo tablero de pared a pared (TRA-14,
  1560 x 570 mm con un escalón de 70 mm donde termina la L), que une los dos módulos por arriba. La base queda 20 mm sobre el
  piso y apoya en 6 tiras de canto (adelante, al medio y atrás de cada base). Los fondos, los pisos, los laterales, las traseras
  y las delanteras de los cajones son de la placa de 12 mm (`materiales.medio`, sale de los retazos); solo el piso del cajón de
  bidones queda de 15 mm. Cada cajón lleva una delantera de 12 mm a la que se atornilla el frente, que cierra a ras del marco.
  Los marcos se unen cara contra cara de 15 mm, por eso llevan tornillos 4x25 y no 4x40.
- Mueble derecho: se apoya sobre el pasarruedas derecho. Bajo 43 cm solo queda libre la franja del frente (cerrada con un
  frente ciego) y los dos cajones se acomodan arriba, a partir de los 45 cm.
- El frente de la cocina y del agua está en z = 1910, 70 mm detrás del frente de la L (z = 1840), donde termina la cama. El anafe
  se guarda de canto en un compartimento al piso, detrás de una puerta con la bisagra a la derecha que arranca después del borde de
  la cama (x 724 a 965), así que al abrirse nunca pasa por debajo de ella. `npm run check` verifica que el anafe y los dos cartuchos
  entren en el guardado y que la puerta quede fuera de la cama. Con el fondo de 12 mm el guardado queda de 473 mm de fondo: el anafe
  (470 x 295 x 80 mm como máximo) entra con 3 mm de luz, y un Primus Kinjia de unos 475 mm no entra. Medir el real antes de cortar el
  estante y la puerta.
  La sección de agua tapa parte de la puerta lateral derecha (z 1340 a 2320).
- Medidas estimadas de la cocina: anafe portátil de hasta 470 x 295 x 80 mm, cartucho CV 300 de 90 mm de diámetro y 105 de alto, heladera 420 x 300 x 340 mm,
  fregadero 340 de ancho x 400 de fondo, bidones de 20 L de 215 x 400 x 290 mm.
- Cocinar con un anafe a cartucho dentro de la van produce monóxido: usarlo con la claraboya abierta y con detector de monóxido de carbono.
- La cama no lleva cajones: cada ventana de los costados la cierra una puerta con bisagras de cazoleta en el borde de abajo que baja hasta el piso, como en las fotos de referencia (Standard Sliding Bed B120). Detrás queda el hueco de guardado del módulo.
- La cama es como la del instructivo (paso 10): dos módulos, uno de 120 cm (cabecera) y otro de 60 cm (pie), unidos con dos
  tornillos de 25 mm y fijados al piso con refuerzos de 4 tornillos de 25 mm por módulo. Cada módulo es una caja abierta con un
  costado FIJO del lado del pasillo (CAM-04 y CAM-05): un marco cerrado de 4 lados, de 345 mm de alto (5 a 350 mm), con una ventana de esquinas redondeadas (R40, 270 mm de alto) que aloja la puerta del módulo; el frente del pie tiene una ventana igual. Como el costado llega 5 mm más abajo que los listones de las correderas, estos pasan por encima con 5 mm de luz.
  Por afuera de cada costado va un PORTAL (CAM-31 y CAM-32): una U invertida de 395 mm de alto, a ras de la cama, con dos patas y un travesaño de 90 mm (el calado de abajo es del tamaño de la ventana del costado). Sale con las varillas (va atornillado al lomo móvil y a las puntas de los listones de las correderas), sus patas son la base de la extensión y suma 15 mm al ancho de la cama cerrada (725 mm). Cerrada, el calado de abajo del portal deja salir la puerta.
  En cada ventana va una puerta a ras (toma el radio de la ventana menos la luz de 3 mm), con una agarradera calada arriba, un botón push al centro y bisagras de cazoleta (3 en la de la cabecera, 2 en la del pie y 2 en la del frente del pie).
  Las puertas de los costados llevan las bisagras en un listón de 30 x 30 fijo en la caja, entre los refuerzos de piso; la del frente del pie las lleva sobre el refuerzo de piso que tiene detrás y baja hacia la puerta trasera. Las tres puertas quedan FIJAS en la caja (no salen con la extensión) y giran sobre su borde de abajo, por la cara de afuera, para que su esquina no roce el zócalo. Se pueden abrir con la cama cerrada (salen por el calado del portal) y con la cama extendida (quedan libres bajo la extensión).
  El lado de la pared no lleva costado: lo hace la pared de la van, y el pasarruedas pasa por ahí.
- La plataforma es un peine ("varillas intercaladas"): cada placa (cabecera de 120 cm y pie de 60 cm) se corta con ranuras abiertas hacia el
  pasillo. Los pedazos que salen de las ranuras, unidos por un lomo de 80 mm del lado del pasillo, son las varillas móviles: salen 490 mm
  hacia el pasillo y quedan intercaladas con los dedos fijos. Cerrada se ve como una placa lisa de 71 cm; abierta mide 120 cm. La cabecera
  lleva 6 varillas y el pie 3 (`cama.varillasCabecera` y `cama.varillasPie`). Todas las ranuras y todos los dedos fijos miden 100 mm
  (`cama.ranura.ancho`; con 0 se reparten en la bahía) y el peine queda centrado en cada placa: quedan 41,75 mm de madera en los dos
  extremos de las dos placas. Cada varilla (92 mm) entra con 4 mm de luz por lado (con 2 mm se chocaban al extender). Las esquinas del pasillo son R50 (un solo círculo para la placa y el lomo) y el fondo de las ranuras R20.
  Las varillas no figuran en la tabla de cortes: salen de la placa. Se cambian en `cama.ranura`, `cama.lomo`, `cama.lomoMovil` y `cama.ventana` (defaults.js).
- Placas de la cama: la de la cabecera mide 1183,5 mm y la del pie 583,5 mm de largo (710 mm de ancho, 3 mm de luz entre las dos y 15 mm
  de pared en cada extremo dentro de los 180 cm). Las dos tienen el mismo ancho y no llevan recortes. Se cambia en "Largo placa cabecera".
  Un guardado con la cama de 170 cm y la L de 670 mm pasa solo a 180 cm y 570 mm, y uno con la plataforma a 395 mm pasa a 400 mm.
- Equipos eléctricos con las medidas que tomó Marco (ancho x alto x profundidad, en cm): batería 29,5 x 28 x 20, inversor
  25,5 x 19 x 9,5, DC-DC 18,5 x 12,3 x 6,7, caja de fusibles 9 x 14, panel de interruptores 16,5 x 4, enchufes 5 x 5 y bomba de
  agua 16,4 x 9. Inversor y DC-DC van de frente a la puerta lateral (la profundidad es la que entra hacia el fondo) y la
  batería contra el fondo con los bornes arriba. Todo lo demás de la lista de equipos sigue ESTIMADO (alto de la caja de
  fusibles y profundidad de interruptores y enchufes también). Con la L de 570 mm entran uno detrás de otro los equipos del frente,
  el paso del cable largo y la batería; si algún día la L se achica tanto que no entren, el inversor se pone atravesado solo.
  Los dos cajones de cocina de la L usan correderas de 500 mm.
- Cama extensible: las varillas van a la misma altura que la placa fija. Los costados del pasillo (CAM-04 y CAM-05) son fijos y llegan a 350 mm;
  los portales (CAM-31 y CAM-32) acompañan a los listones de las correderas y salen con la extensión: van atornillados al lomo móvil y a las
  puntas de los listones, llegan a la cara de arriba de la cama (400 mm) y quedan 5 mm sobre el piso. Las correderas de bajo perfil solo tienen
  que entrar en el listón de 30 x 30. Con la cama abierta los portales quedan en x 1210 a 1225 (el mueble derecho arranca en 1320); los costados y las
  puertas se quedan en su lugar, fijas en la caja. Los portales se agregaron al final de la lista para no mover los ids de las demás piezas.
  Las varillas se deslizan sobre los largueros y el borde del pasarruedas con cinta de teflón. Abiertas quedan en voladizo: hay que probar
  la flexión con peso real. Con la cama abierta quedan 110 mm de pasillo.
- Correderas de las varillas: de carga, 500 mm, extensión total, 100 kg el par, de bajo perfil. Tienen que recorrer 490 mm: confirmar con la ficha de las que compres.
- Mesa plegable reducida a 400 mm de ancho para que no pase sobre la cama (con la de 71 cm cerrada quedan 600 mm de pasillo).
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

## Idiomas

La interfaz está en español (por defecto), inglés y sueco, con el selector ES / EN / SV en la cabecera. El idioma elegido queda guardado en el navegador.

- `src/i18n/es.js` es la fuente de todas las claves; `en.js` y `sv.js` tienen que tener exactamente las mismas.
- Lo eléctrico y el agua (equipos, cables, mangueras, consumos, avisos y fichas) están en `elec.en.js` y `elec.sv.js`, por id del elemento. Los cálculos usan siempre los datos originales: solo se traduce lo que se muestra (`src/i18n/electrico.js`). Si falta una traducción, queda el texto en español.
- Por ahora siguen en español los nombres de las piezas, el tutorial de armado y las notas que arma el motor (herrajes y compras).

