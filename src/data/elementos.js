// Descripción de cada elemento eléctrico y de agua: qué es, dónde va y qué cuidar al instalarlo.
// La clave es el id del equipo (ver electrico3d.js y trasero.js).

export const ELEMENTOS = {
  bateriaAuto: {
    descripcion: 'Batería de arranque del Jumpy. Es la fuente de toda la instalación: el DC-DC solo carga la de 150 Ah mientras el motor está en marcha.',
    ubicacion: 'Debajo del asiento del acompañante, del lado de la puerta derecha.',
    consejos: ['No tocar el cableado original del auto: el cable nuevo sale del borne positivo con su propio fusible.', 'Revisar que el borne quede cubierto con su capuchón.'],
    busqueda: 'instalar batería auxiliar furgoneta camper desde batería del coche',
  },
  anl: {
    descripcion: 'Fusible ANL que protege el cable largo. Si el cable se pela o se aplasta, el fusible corta antes de que haya un incendio.',
    ubicacion: 'Pegado al borne positivo de la batería del auto (menos de 30 cm).',
    consejos: ['El valor sale de la tabla de cables: tiene que ser menor o igual a lo que aguanta el cable.', 'Usar portafusible ANL con tapa.'],
    busqueda: 'instalar fusible ANL batería auxiliar camper',
  },
  dcdc: {
    descripcion: 'Cargador DC-DC. Toma energía de la batería del auto con el motor en marcha y carga la batería de 150 Ah con el perfil correcto para litio.',
    ubicacion: 'Sección eléctrica del mueble trasero (la de la izquierda), al piso, entre la caja de fusibles y el inversor, detrás de la puerta de los equipos.',
    consejos: ['Tiene que ser apto para alternador inteligente (el Jumpy lo es).', 'Ponerlo cerca de la batería de 150 Ah para que el cable de salida sea corto (aquí quedan a unos 40 cm).', 'Dejar aire alrededor: se calienta cuando carga fuerte.'],
    busqueda: 'instalar cargador DC-DC camper alternador inteligente',
  },
  bateria: {
    descripcion: 'Batería de litio (LiFePO4) de 150 Ah. Alimenta la heladera, las luces, la bomba y el inversor.',
    ubicacion: 'Sección eléctrica (izquierda) del mueble trasero, al piso, contra el fondo y bajo el plano de la cama. Queda lejos del fregadero y del gas.',
    consejos: [
      'Fijarla con un marco o correas: no puede moverse al frenar. Los bornes quedan arriba, con unos 6 cm libres hasta el estante.',
      'Apoya sobre la almohadilla calefactora y la plancha aislante: con frío (menos de 0 grados) no se debe cargar.',
      'Confirmar que el BMS entrega la corriente que pide el inversor.',
      'El fusible principal va lo más cerca posible del borne positivo.',
    ],
    busqueda: 'instalar batería de litio 12v camper furgoneta',
  },
  cortacircuitos1: {
    descripcion: 'Disyuntor de 120 A de rearme manual (12-48 V, montaje en superficie, resistente al agua). Corta a mano la línea que carga la batería desde el DC-DC y salta si hay un cortocircuito.',
    ubicacion: 'Al piso de la sección eléctrica, delante de la batería (a la izquierda, junto al disyuntor 2), con la palanca hacia arriba.',
    consejos: [
      'Va en el cable positivo entre el DC-DC y la batería, lo más cerca posible del borne de la batería.',
      'Es corte manual y último recurso: un disyuntor de 120 A no protege a un cable más fino que lo que aguanta ese valor, así que el fusible de la línea se mantiene. Confirmar con la ficha de la batería que 120 A es adecuado para su BMS.',
      'Se vende de a dos y trae terminales de ojal y tornillos. Apretar bien los dos bornes y poner la tapa de goma.',
      'Para dejar la instalación sin energía, bajar la palanca antes de tocar cables.',
    ],
    busqueda: 'instalar disyuntor 120A rearme manual batería camper',
  },
  cortacircuitos2: {
    descripcion: 'Segundo disyuntor de 120 A de rearme manual. Corta a mano todo lo de 12 V que reparte la caja de fusibles (heladera, luces, bomba y calefactor).',
    ubicacion: 'Al piso de la sección eléctrica, delante de la batería, al lado del disyuntor 1.',
    consejos: [
      'Va en el positivo entre la batería y la caja de fusibles. El inversor tiene su propio fusible principal y no pasa por acá.',
      'Con este disyuntor abierto se apaga toda la instalación de 12 V menos el inversor (a menos que se corte aparte).',
      'Es la última protección: cada salida de la caja sigue llevando su fusible.',
    ],
    busqueda: 'instalar disyuntor 120A rearme manual batería camper',
  },
  calefactor: {
    descripcion: 'Almohadilla calefactora de silicona de 12 V y unos 30 W. Mantiene la batería de litio sobre 0 grados para poder cargarla con frío.',
    ubicacion: 'Plana, debajo de la batería y sobre la plancha aislante (queda tapada por la batería).',
    consejos: [
      'Tiene que estar en contacto con toda la cara de abajo de la batería: sin huecos de aire.',
      'La alimenta el termostato por una salida propia de 5 A de la caja de fusibles.',
      'Elegir una almohadilla de silicona con adhesivo y fusible o corte térmico propio.',
    ],
    busqueda: 'calefactor batería litio manta térmica 12v termostato camper',
  },
  termostato: {
    descripcion: 'Termostato de 12 V con sonda. Enciende la almohadilla cuando la batería baja de unos 4 grados y la apaga a unos 10.',
    ubicacion: 'Al piso, delante de la batería. La sonda sube pegada al costado de la batería que mira al frente.',
    consejos: [
      'Poner la sonda sobre la pared de la batería, lejos de la almohadilla, con cinta térmica o de aluminio: así mide la batería y no el calefactor.',
      'Con 4 y 10 grados queda margen antes de llegar a 0.',
      'Elegir uno que soporte 10 A o más de salida y que sea para 12 V continuo.',
      'Se alimenta siempre: no lleva interruptor.',
    ],
    busqueda: 'termostato 12v con sonda calefactor batería litio camper',
  },
  aislante: {
    descripcion: 'Plancha de espuma aislante de 10 mm. Evita que el frío del piso de la van le llegue a la batería y que el calor de la almohadilla se pierda hacia abajo.',
    ubicacion: 'Entre el piso del mueble y la almohadilla. Sobresale un poco de la batería en el frente y los costados.',
    consejos: [
      'Sirve espuma de goma tipo Armaflex o XPS; si se puede, rodear también los lados de la batería con 10 a 20 mm.',
      'No tapar los bornes ni cerrar la batería sin aire alrededor del cableado.',
      'Material no combustible o autoextinguible, si es posible.',
    ],
    busqueda: 'aislar batería litio frío espuma aislante camper',
  },
  fusiblePrincipal: {
    descripcion: 'Fusible principal del inversor. Protege el cable más grueso de la instalación.',
    ubicacion: 'Al piso de la sección eléctrica, pegado al extremo de la batería donde está el borne positivo y detrás del inversor.',
    consejos: ['Elegir el fusible por la tabla de cables de la pestaña Eléctrica.', 'Usar un portafusible de calidad (tipo MEGA o ANL).'],
    busqueda: 'fusible principal inversor camper instalación',
  },
  fusibles: {
    descripcion: 'Caja de fusibles de 12 salidas que reparte los 12 V a los equipos. Cada línea lleva su fusible y se puede conectar su negativo individual.',
    ubicacion: 'Sección eléctrica del mueble trasero, al piso y junto a la puerta de los equipos.',
    consejos: [
      'Rotular cada fusible con lo que protege.',
      'Sobran salidas: dejar lugar libre para sumar líneas más adelante.',
      'Alimentar con el cable de la tabla de cables, pasando por el disyuntor 2 (batería a caja).',
      'Usos hoy: heladera, panel de interruptores y calefactor de la batería (salida propia de 5 A).',
    ],
    busqueda: 'instalar caja de fusibles 12v camper',
  },
  inversor: {
    descripcion: 'Inversor que convierte 12 V de la batería en 230 V para los enchufes. Ya comprado. Tiene entrada para mando a distancia.',
    ubicacion: 'Sección eléctrica del mueble trasero, al piso, detrás de la puerta de los equipos y contra el divisor de la cocina.',
    consejos: ['Cables de entrada cortos y gruesos, con fusible principal.', 'Dejar ventilación: se calienta con carga.', 'Si tiene mando a distancia, conectarlo al interruptor 5 del panel.'],
    busqueda: 'instalar inversor 12v 220v camper con mando a distancia',
  },
  panelSwitches: {
    descripcion: 'Panel con 5 interruptores. Cada uno enciende o apaga una parte de la instalación.',
    ubicacion: 'En el tablero del frente de la sección eléctrica, sobre la cama, arriba de la caja de fusibles (a la izquierda del mueble trasero).',
    consejos: ['Cada interruptor lleva su fusible en la caja de fusibles.', 'Los interruptores 1 y 2 prenden dos tiras LED cada uno (centrales y laterales); el 3 es la lámpara flexible, el 4 la bomba y el 5 el mando del inversor.', 'Rotular cada interruptor.'],
    busqueda: 'instalar panel de interruptores 12v camper',
  },
  enchufe1: {
    descripcion: 'Enchufe de 230 V con carga USB-C incluida. Se alimenta del inversor.',
    ubicacion: 'En el tablero del frente de la sección eléctrica, sobre la cama y arriba del inversor, para cargar celular y notebook.',
    consejos: ['Línea de 230 V con disyuntor.', 'Usar cable de 3 hilos con tierra.', 'Mantener el cable de 230 V separado de los de 12 V.'],
    busqueda: 'instalar enchufe 220v con usb camper furgoneta',
  },
  enchufe2: {
    descripcion: 'Segundo enchufe de 230 V con USB-C. Va en derivación del primero.',
    ubicacion: 'En el tablero del frente de la sección eléctrica, al lado del primero.',
    consejos: ['Misma línea que el enchufe 1: no sumar consumos grandes en los dos a la vez.'],
    busqueda: 'instalar enchufe 220v con usb camper furgoneta',
  },
  ledA: {
    descripcion: 'Tira LED de 2 metros pegada al techo, central izquierda: pasa por el costado de la claraboya.',
    ubicacion: 'Techo, a lo largo de la van, a 6 cm del marco de la claraboya (lado de la cama). Empieza y termina igual que las otras tres.',
    consejos: [
      'Usar perfil de aluminio con difusor: la luz sale pareja y la tira no se despega.',
      'Comprobar la polaridad antes de pegar.',
      'Va al interruptor 1 del panel, junto con la tira 2: las dos luces centrales se prenden juntas.',
    ],
    busqueda: 'instalar tira led techo furgoneta camper perfil aluminio',
  },
  ledB: {
    descripcion: 'Tira LED de 2 metros pegada al techo, central derecha: pasa por el otro costado de la claraboya.',
    ubicacion: 'Techo, a lo largo de la van, a 6 cm del marco de la claraboya (lado del mueble derecho).',
    consejos: ['Misma instalación que la tira 1.', 'Va al interruptor 1 del panel, junto con la tira 1.'],
    busqueda: 'instalar tira led techo furgoneta camper perfil aluminio',
  },
  ledC: {
    descripcion: 'Tira LED de 2 metros pegada al techo, lateral izquierda: cerca de la pared de la cama.',
    ubicacion: 'Techo, a lo largo de la van, a unos 25 cm de la pared izquierda. Empieza y termina igual que las centrales.',
    consejos: [
      'Misma instalación que las centrales.',
      'Va al interruptor 2 del panel, junto con la tira 4: las dos luces laterales se prenden juntas.',
      'El techo se curva cerca de las paredes: confirmar en la van que el perfil apoya bien a esa distancia.',
    ],
    busqueda: 'instalar tira led techo furgoneta camper perfil aluminio',
  },
  ledD: {
    descripcion: 'Tira LED de 2 metros pegada al techo, lateral derecha: cerca de la pared del mueble derecho.',
    ubicacion: 'Techo, a lo largo de la van, a unos 25 cm de la pared derecha, sobre la alacena y el mueble derecho.',
    consejos: [
      'Su cable cruza el techo de lado a lado por detrás del inicio de las tiras.',
      'Va al interruptor 2 del panel, junto con la tira 3.',
      'Queda justo sobre la alacena (que llega a 125 cm): dejar espacio para el perfil.',
    ],
    busqueda: 'instalar tira led techo furgoneta camper perfil aluminio',
  },
  lampara: {
    descripcion:
      'Lámpara flexible de lectura de 12 V con cuello articulado, que se puede mover estando acostado. El modelo de referencia (MRYC) trae interruptor táctil y salida USB de 5 V y 2 A en la base. Se conecta a 12 V, no a 230 V.',
    ubicacion:
      'Pared izquierda, sobre la viga sin aislar de 22 cm que queda entre el pasarruedas y la puerta, a unos 68 cm del piso: más o menos el pecho de quien está acostado en la cama. El cable llega desde el panel por el techo y baja por la viga.',
    consejos: [
      'Va al interruptor 3 del panel: ese interruptor la deja sin energía y su propio botón táctil la prende y apaga.',
      'La viga no está aislada: el cable baja dentro de una canaleta o funda corrugada, bien sujeto, sin tocar chapa afilada.',
      'Confirmar con la ficha de la lámpara la tensión (12 V) y la corriente. Se calculó 3 W de luz más 10 W de la salida USB a máxima carga.',
      'Probar la altura acostado antes de fijarla: el colchón cambia la altura del pecho.',
    ],
    busqueda: 'instalar luz de lectura flexible 12v furgoneta camper',
  },
  extractor: {
    descripcion:
      'Claraboya o ventilación de techo que se abre a mano. No tiene ventilador ni conexión eléctrica, por eso no aparece en el panel de interruptores ni en los consumos. Está en el 3D para ubicar las luces LED.',
    ubicacion: 'Techo, sobre la zona del pasillo. Hueco de 280 x 280 mm; con el marco mide 310 x 310 mm.',
    consejos: [
      'Sellar bien el corte del techo con sellador para carrocería y revisar que no gotee.',
      'Abrirla siempre que se use el anafe: es la salida del aire caliente y de los gases de la cocción.',
      'Dejar 6 cm libres entre el marco y las tiras LED.',
    ],
    busqueda: 'instalar claraboya techo furgoneta camper',
  },
  nevera: {
    descripcion: 'Heladera de compresor 12 V de 25 L, de tapa arriba (Alpicool G22: 585 x 335 x 350 mm). Va en la sección eléctrica (izquierda) del mueble trasero, sobre el compartimento de la batería, con la tapa a ras de la mesada.',
    ubicacion: 'Sección eléctrica, arriba, detrás del frente fijo con rejillas (gris). Se abre hacia arriba por un corte de la tapa 1.',
    consejos: [
      'Calar la tapa 1 con la plantilla de la heladera (585 x 335) y dejar libre el alto de la tapa abierta.',
      'Mide 585 sin manijas y unos 598 con ellas: la sección tiene 620, así que sobran unos 22 mm. Confirmar con la heladera real.',
      'Dejar aire alrededor: necesita ventilar el compresor (rejilla abajo y arriba del frente fijo, y el hueco de atrás). Confirmar con el manual cuánto pide de cada lado.',
      'Línea propia en la caja de fusibles, sin interruptor.',
      'Queda lejos del gas: el gas está al piso de la cocina, en otra sección.',
    ],
    busqueda: 'instalar nevera compresor 12v furgoneta camper',
  },
  fregadero: {
    descripcion: 'Fregadero encastrado en la tapa 3, del lado derecho del mueble, lejos de lo eléctrico. Mide 400 mm de fondo.',
    ubicacion: 'Sección del agua (derecha) del mueble trasero, arriba. Abajo tiene el cajón y, más abajo, el cajón de los bidones.',
    consejos: [
      'Calar la tapa con la plantilla del fregadero.',
      'Sellar el borde con silicona.',
      'Desagüe con sifón hacia el bidón de aguas grises (el de adelante), con una manguera que se suelte antes de tirar el cajón.',
      'Medir el ancho real del fregadero: en el 3D es una estimación.',
    ],
    busqueda: 'instalar fregadero y grifo camper',
  },
  canilla: {
    descripcion: 'Canilla del fregadero, alimentada por la bomba de agua.',
    ubicacion: 'Sobre la tapa 3, al lado del fregadero.',
    consejos: ['Manguera de grado alimenticio con abrazaderas.'],
    busqueda: 'instalar grifo fregadero camper',
  },
  bomba: {
    descripcion: 'Bomba de agua de 12 V. Saca el agua de los bidones y la manda a la canilla.',
    ubicacion: 'Sección del agua, sobre el estante de los bidones, atrás del cajón que está bajo el fregadero.',
    consejos: [
      'Va con el interruptor 4 del panel.',
      'Fijarla sobre goma para que no vibre.',
      'Filtro de agua antes de la bomba.',
      'Se alcanza sacando el cajón de abajo del fregadero.',
      'El cable de 12 V llega desde el panel (lado izquierdo) por el fondo del mueble: dentro de una funda y lejos del caño de gas.',
    ],
    busqueda: 'instalar bomba de agua 12v camper',
  },
  bidon1: {
    descripcion: 'Bidón plano de agua limpia de 20 L (416 x 203 x 408 mm, con canilla). Va parado y girado en el cajón que llega hasta el piso, abajo del fregadero.',
    ubicacion: 'Sección del agua, cajón de abajo: atrás, cerca de la bomba. El cajón se tira hacia el pasillo, frente al mueble.',
    consejos: [
      'Dos bidones de 20 L llenos pesan unos 40 kg: correderas de carga de 45 kg o más y piso de 15 mm.',
      'Sujetar los bidones con correa dentro del cajón.',
      'La boca y la canilla miran a la pared derecha: salida a la bomba con manguera de grado alimenticio y conexión rápida.',
      'Medir el bidón al llegar, con la tapa puesta y la canilla: el 3D usa 416 x 203 x 408 y 40 mm de canilla estimados.',
      'Dejar 12 mm sobre el bidón hasta el estante: si la tapa sobresale más, subir el estante.',
    ],
    busqueda: 'instalar depósito de agua camper bidones',
  },
  bidon2: {
    descripcion: 'Bidón plano de aguas grises de 20 L, igual al de agua limpia. Recibe el desagüe del fregadero.',
    ubicacion: 'Sección del agua, cajón de abajo: adelante, delante del bidón de agua limpia.',
    consejos: [
      'Marcarlo bien (otro color o etiqueta) para no confundirlo con el de agua limpia: nunca se bebe.',
      'Desagüe del fregadero con manguera y conexión rápida: soltarla antes de tirar el cajón.',
      'En invierno se saca el bidón y se vacía entero, sin dejar agua adentro para que no se congele.',
      'Sacar el cajón entero para llenar o vaciar los bidones.',
    ],
    busqueda: 'instalar depósito de aguas grises camper',
  },
  anafe: {
    descripcion: 'Anafe de 2 hornallas empotrado en la tapa 2, en la sección del medio. Con válvula de seguridad (termocupla) que corta el gas si se apaga la llama.',
    ubicacion: 'Sección de la cocina, arriba. Abajo tiene dos cajones de cocina y, al piso, el compartimento de la garrafa con su puerta.',
    consejos: [
      'La cocina mide 330 mm de ancho y 500 de fondo: buscar uno de hasta 300 de ancho y 440 de fondo (el corte tiene que dejar unos 25 mm de tapa por lado). Las de 30 cm tipo domino suelen medir 510 de fondo: no entran sin profundizar la cocina.',
      'El 3D usa 300 x 440 x 70 mm como medida a elegir: confirmar con el anafe real y con la plantilla de corte.',
      'Cocinar siempre con la claraboya abierta.',
      'Dejar libre alrededor del anafe: nada de cortinas ni telas cerca.',
      'Fijar el anafe a la tapa con los soportes que trae.',
    ],
    busqueda: 'instalar anafe 2 hornallas camper gas',
  },
  garrafa: {
    descripcion:
      'Garrafa chica recargable, parada y fija en su compartimento, al piso del mueble y debajo de los dos cajones de cocina. Se saca una vez por semana por la puerta, se carga afuera y se vuelve a colocar.',
    ubicacion: 'Compartimento de la garrafa, al piso de la sección del medio (debajo de los cajones de cocina y del anafe), detrás de una puerta con la bisagra a la derecha.',
    consejos: [
      'Para sacarla: cerrar la llave de corte y la válvula de la garrafa, abrir la puerta, desenroscar el regulador y levantarla recta. La garrafa queda parada en un círculo calado en la base, que la traba, y el regulador y la manguera quedan en el compartimento.',
      'La puerta empieza después del borde de la cama, así que al abrirse no pasa por debajo de ella ni toca la cama. La garrafa entra con muy poca luz: medila antes de cortar la puerta.',
      'La manguera tiene que tener un bucle holgado para que la puerta se abra sin tirar de ella.',
      'Siempre parada y con correa. Nunca acostada.',
      'El compartimento de la garrafa tiene que ser aparte del resto del mueble, con una rejilla de ventilación de unos 100 cm2 hacia el exterior por el piso, justo bajo el círculo del asiento: el gas pesa más que el aire y tiene que poder salir sin entrar a la van.',
      'Cerrar la válvula de la garrafa al manejar, al dormir y al irse.',
      'Cargar solo en lugares habilitados y respetar el vencimiento de la garrafa.',
      'Que un instalador de gas matriculado revise la instalación completa: es la parte más riesgosa de la obra.',
    ],
    busqueda: 'instalación de gas furgoneta camper garrafa ventilación',
  },
  regulador: {
    descripcion: 'Regulador de presión de gas (GLP). Va enroscado en la válvula de la garrafa y baja la presión al valor que pide el anafe.',
    ubicacion: 'Arriba de la garrafa, dentro de su compartimento, bajo el estante.',
    consejos: [
      'La rosca y la presión tienen que coincidir con la garrafa y con el anafe (cambia según el país).',
      'Manguera certificada, con abrazaderas y dentro de su fecha de vencimiento.',
      'Probar todas las uniones con agua jabonosa antes de usar.',
    ],
    busqueda: 'instalar regulador de gas garrafa camper',
  },
  valvulaGas: {
    descripcion: 'Llave de corte de gas. Permite cortar el gas al anafe sin abrir la garrafa.',
    ubicacion: 'Contra el fondo, bajo el anafe y detrás de los cajones de cocina. Se alcanza sacando el cajón de cocina de arriba.',
    consejos: ['Usar llave de bola apta para gas.', 'Rotularla y que se pueda alcanzar rápido.', 'Cerrarla siempre que no se cocina.'],
    busqueda: 'instalación de gas furgoneta camper llave de corte',
  },
  detectorGas: {
    descripcion: 'Detector de gas GLP con alarma. El gas es más pesado que el aire y se junta cerca del piso.',
    ubicacion: 'En el montante entre el eléctrico y la cocina, cerca del piso, al lado de la puerta de la garrafa.',
    consejos: [
      'Instalarlo a unos 30 cm del piso y lejos del anafe y de las rejillas de ventilación.',
      'Sumar un detector de monóxido de carbono a la altura de la cama.',
      'Probarlo cada tanto con el botón de prueba.',
    ],
    busqueda: 'detector de gas autocaravana camper instalación',
  },
};

// Datos para cables y mangueras: usan el texto del propio cable
export const BUSQUEDA_CABLES = {
  dc: 'instalación eléctrica 12v furgoneta camper cableado paso a paso',
  ac: 'instalar enchufe 220v camper desde inversor',
  senal: 'inversor con mando a distancia instalación camper',
  agua: 'instalación de agua camper bomba depósito grifo',
  gas: 'instalación de gas furgoneta camper garrafa regulador',
};
