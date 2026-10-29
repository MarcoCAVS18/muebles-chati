# La Chata - diseño de muebles

Proyecto React + three.js para diseñar los 3 muebles de la Citroën Jumpy y su sistema eléctrico,
con la distribución de la foto de referencia: mueble trasero cruzado de pared a pared detrás de los asientos
(de izquierda a derecha: eléctrico al piso con la batería, inversor, DC-DC y fusibles, y sobre la cama el
panel y los enchufes con dos cajones de cocina arriba; cocina con anafe, gas y heladera al piso, al centro; y agua con
fregadero y bidones al piso, a la derecha), cama extensible de 71 a 120 cm de 180 cm de largo (placas de plywood con
esquinas redondeadas y ranuras en peine, varillas sobre correderas, costados con ventana y cajones), y mueble
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
  22 cm), bomba y mangueras de agua y de gas. El extractor del techo (310 x 310 mm con el marco) se abre a mano: está en el 3D
  pero sin conexión eléctrica.
- Botones push: cada puerta y cada cajón de los tres muebles lleva un botón negro redondo en el 3D, para ver dónde va.
  Las varillas de la cama conservan un tirador embutido porque el canto de 15 mm es muy fino para el botón.
- Sistema de gas en 3D: garrafa chica recargable fija en un compartimento con puerta bajo el anafe, regulador, manguera, llave de corte y
  detector de gas, con la ventilación al exterior por el piso.
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
- La cama queda a 40 cm: el pasarruedas izquierdo, con su tapa, mide 38 cm; con 5 mm de fieltro y la placa de 15 mm la superficie llega a
  400 mm (el frente del pie y la guía de la cabecera miden 400 mm, el panel central 385 mm). El arco real mide 42,5 cm: la placa lleva un
  corte ahí, que todavía no se dibuja. Las dos placas y los dos módulos llenan los 180 cm, hasta el frente de la L. Al compartimento
  eléctrico se entra por una puerta en el costado izquierdo (la que se ve al abrir la puerta corrediza de la van), no por debajo de la cama.
  Todo lo eléctrico queda al piso, debajo del plano de la cama; el panel y los enchufes van sobre la cama, en el tablero de arriba, y los
  cajones de cocina de la L van sobre el tablero. El estante de los equipos queda a 395 mm para dejar 55 mm o más sobre los bornes.
- Mueble trasero: se arma en dos módulos que pasan por las puertas y se unen adentro de la van: el eléctrico (izquierda, con el
  divisor 1 como pared derecha) y el de cocina y agua (sin pared izquierda: apoya contra ese divisor). Por eso el fondo es de
  dos piezas. La base queda 20 mm sobre el piso y apoya en 6 tiras de canto (adelante, al medio y atrás de cada base). Cada
  cajón lleva un panel delantero de 15 mm al que se atornilla el frente, que cierra a ras del marco. Los marcos y las
  delanteras se unen cara contra cara de 15 mm, por eso llevan tornillos 4x25 y no 4x40.
- Mueble derecho: se apoya sobre el pasarruedas derecho. Bajo 43 cm solo queda libre la franja del frente (cerrada con un
  frente ciego) y los dos cajones se acomodan arriba, a partir de los 45 cm.
- El frente de la cocina y del agua está en z = 1910, 70 mm detrás del frente de la L (z = 1840), donde termina la cama. La garrafa
  va fija y parada en su compartimento, detrás de una puerta con la bisagra a la derecha que arranca después del borde de la cama
  (x 724 a 965), así que al abrirse nunca pasa por debajo de ella. Apoya a través de un círculo calado en la base (240 mm de
  diámetro) que la traba; el regulador queda arriba, bajo el estante. `npm run check` verifica que la garrafa entre en el círculo y
  que la puerta quede fuera de la cama. La garrafa entra con unos 5 mm de luz en el hueco de la puerta: medirla antes de cortar.
  La sección de agua tapa parte de la puerta lateral derecha (z 1340 a 2320).
- Gas: la rejilla de ventilación al piso va justo bajo el círculo del asiento de la garrafa (el gas pesa más que el aire). Falta definir el corte en el piso con el instalador.
- Medidas estimadas de la cocina: anafe 420 x 300 mm, garrafa de 230 mm de diámetro y 330 mm de alto, heladera 420 x 300 x 340 mm,
  fregadero 340 de ancho x 400 de fondo, bidones de 20 L de 215 x 400 x 290 mm.
- Gas: confirmar la normativa de tu país y que lo revise un instalador de gas. El compartimento de la garrafa necesita una rejilla de
  ventilación hacia el exterior por el piso, detector de gas y detector de monóxido de carbono.
- Los cajones de la cama se tiran hacia el pasillo (en la foto se ven del otro lado, contra la pared).
- La cama es como la del instructivo (paso 10): dos módulos, uno de 120 cm (cabecera) y otro de 60 cm (pie), unidos con dos
  tornillos de 25 mm y fijados al piso con refuerzos de 4 tornillos de 25 mm por módulo. Cada módulo es una caja abierta con un
  costado del lado del pasillo (que sale con la extensión de la cama) con una ventana grande de esquinas redondeadas (R40, 305 mm de alto); el frente del pie tiene otra.
  En cada ventana de los costados va un cajón con el frente a ras (el frente toma el radio de la ventana menos la luz de 3 mm).
  El lado de la pared no lleva costado: lo hace la pared de la van, y el pasarruedas pasa por ahí.
- La plataforma es un peine ("varillas intercaladas"): cada placa (cabecera de 120 cm y pie de 60 cm) se corta con ranuras abiertas hacia el
  pasillo. Los pedazos que salen de las ranuras, unidos por un lomo de 80 mm del lado del pasillo, son las varillas móviles: salen 490 mm
  hacia el pasillo y quedan intercaladas con los dedos fijos. Cerrada se ve como una placa lisa de 71 cm; abierta mide 120 cm. La cabecera
  lleva 8 varillas y el pie 4 (`cama.varillasCabecera` y `cama.varillasPie`); el dedo fijo mide lo mismo que la ranura y cada varilla entra con
  2 mm de luz por lado. Las esquinas del pasillo son R50 (un solo círculo para la placa y el lomo) y el fondo de las ranuras R20.
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
- Cama extensible: las varillas van a la misma altura que la placa fija. Los costados del pasillo (CAM-04 y CAM-05) acompañan a los listones de las
  correderas y salen con la extensión: van atornillados al lomo móvil y a las puntas de los listones, llegan hasta la cara de abajo de la placa
  (385 mm) y quedan 5 mm sobre el piso. Por eso las ventanas de los cajones miden 305 mm de alto y las correderas de bajo perfil solo tienen
  que entrar en el listón de 30 x 30. Con la cama abierta el costado queda en x 1195 y cada cajón sale como máximo unos 475 mm antes de tocarlo.
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
