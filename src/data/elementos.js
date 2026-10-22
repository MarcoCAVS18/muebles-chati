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
    ubicacion: 'Sección eléctrica (izquierda) del mueble trasero, al piso, acostada contra el fondo y bajo el plano de la cama. Queda lejos del fregadero y del gas.',
    consejos: ['Fijarla con un marco o correas: no puede moverse al frenar. Los bornes quedan arriba, con unos 11 cm libres hasta el estante.', 'Confirmar que el BMS entrega la corriente que pide el inversor.', 'El fusible principal va lo más cerca posible del borne positivo.'],
    busqueda: 'instalar batería de litio 12v camper furgoneta',
  },
  fusiblePrincipal: {
    descripcion: 'Fusible principal del inversor. Protege el cable más grueso de la instalación.',
    ubicacion: 'Al piso de la sección eléctrica, pegado al extremo de la batería donde está el borne positivo y detrás del inversor.',
    consejos: ['Elegir el fusible por la tabla de cables de la pestaña Eléctrica.', 'Usar un portafusible de calidad (tipo MEGA o ANL).'],
    busqueda: 'fusible principal inversor camper instalación',
  },
  fusibles: {
    descripcion: 'Caja de fusibles que reparte los 12 V a los equipos. Cada línea lleva su fusible.',
    ubicacion: 'Sección eléctrica del mueble trasero, al piso y junto a la puerta de los equipos.',
    consejos: ['Rotular cada fusible con lo que protege.', 'Dejar lugar libre para sumar líneas más adelante.', 'Alimentar con el cable de la tabla de cables (batería a caja).'],
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
    consejos: ['Cada interruptor lleva su fusible en la caja de fusibles.', 'Rotular cada interruptor.'],
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
    descripcion: 'Tira LED de 2 metros pegada al techo, lado izquierdo.',
    ubicacion: 'Techo, a lo largo de la van, lado de la cama.',
    consejos: ['Usar perfil de aluminio con difusor: la luz sale pareja y la tira no se despega.', 'Comprobar la polaridad antes de pegar.'],
    busqueda: 'instalar tira led techo furgoneta camper perfil aluminio',
  },
  ledB: {
    descripcion: 'Tira LED de 2 metros pegada al techo, lado derecho.',
    ubicacion: 'Techo, a lo largo de la van, lado del mueble derecho.',
    consejos: ['Misma instalación que la tira 1.', 'Cada tira va a un interruptor distinto del panel.'],
    busqueda: 'instalar tira led techo furgoneta camper perfil aluminio',
  },
  ledC: {
    descripcion: 'Tercera tira LED, en el centro del techo. Sigue en línea con el extractor hacia la puerta trasera.',
    ubicacion: 'Techo, al centro, desde el borde trasero del extractor hacia la puerta trasera (queda de menos de 2 m).',
    consejos: [
      'Entre el extractor y la puerta no entran 2 m: cortar la tira por las marcas de corte o moverla más cerca de la puerta.',
      'Va al interruptor 3 del panel.',
      'El cable llega por el costado del extractor, no por encima.',
    ],
    busqueda: 'instalar tira led techo furgoneta camper perfil aluminio',
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
    descripcion: 'Heladera de compresor 12 V. Va abajo de la cocina, en la sección del medio del mueble trasero, apoyada casi en el piso.',
    ubicacion: 'Sección de la cocina, parte baja, detrás de la puerta gris (abajo del cajón del gas).',
    consejos: [
      'Dejar aire alrededor: necesita ventilar el compresor (rejilla abajo y arriba).',
      'Línea propia en la caja de fusibles, sin interruptor.',
      'Queda en un compartimento aparte del cajón del gas, con su estante en el medio.',
    ],
    busqueda: 'instalar nevera compresor 12v furgoneta camper',
  },
  fregadero: {
    descripcion: 'Fregadero encastrado en la tapa 3, del lado derecho del mueble, lejos de lo eléctrico. Mide 400 mm de fondo.',
    ubicacion: 'Sección del agua (derecha) del mueble trasero, arriba. Abajo tiene el cajón y, más abajo, el cajón de los bidones.',
    consejos: [
      'Calar la tapa con la plantilla del fregadero.',
      'Sellar el borde con silicona.',
      'Desagüe con sifón hacia un bidón de aguas grises.',
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
    descripcion: 'Primer bidón de agua limpia de 20 L. Va parado en el cajón que llega hasta el piso, abajo del fregadero.',
    ubicacion: 'Sección del agua, cajón de abajo (bajo la cama): se tira hacia el hueco libre frente al mueble.',
    consejos: [
      'Dos bidones de 20 L llenos pesan unos 40 kg: correderas de carga de 45 kg o más y piso de 15 mm.',
      'Sujetar los bidones con correa dentro del cajón.',
      'Unir con el otro bidón mediante una T.',
    ],
    busqueda: 'instalar depósito de agua camper bidones',
  },
  bidon2: {
    descripcion: 'Segundo bidón de agua limpia de 20 L, al lado del primero en el mismo cajón.',
    ubicacion: 'Sección del agua, cajón de abajo, a la derecha del otro bidón.',
    consejos: ['Salida a la bomba por la boca, con manguera de grado alimenticio.', 'Sacar el cajón entero para llenarlos o sacarlos.'],
    busqueda: 'instalar depósito de agua camper bidones',
  },
  anafe: {
    descripcion: 'Anafe de 2 hornallas empotrado en la tapa 2, en la sección del medio. Con válvula de seguridad (termocupla) que corta el gas si se apaga la llama.',
    ubicacion: 'Sección de la cocina, arriba. Abajo tiene el cajón de la garrafa y, más abajo, la heladera.',
    consejos: [
      'Confirmar las medidas reales del anafe y del corte de la tapa.',
      'Cocinar siempre con la claraboya abierta.',
      'Dejar libre alrededor del anafe: nada de cortinas ni telas cerca.',
      'Fijar el anafe a la tapa con los soportes que trae.',
    ],
    busqueda: 'instalar anafe 2 hornallas camper gas',
  },
  garrafa: {
    descripcion:
      'Garrafa chica recargable, parada dentro del cajón de la cocina, justo debajo del anafe. Se carga afuera y se vuelve a colocar.',
    ubicacion: 'Cajón de la cocina (sección del medio, entre el anafe y la heladera).',
    consejos: [
      'Siempre parada y con correa. Nunca acostada.',
      'El cajón del gas tiene que ser un compartimento aparte del resto del mueble, con una rejilla de ventilación de unos 100 cm2 hacia el exterior por el piso: el gas pesa más que el aire y tiene que poder salir sin entrar a la van.',
      'Cerrar la válvula de la garrafa al manejar, al dormir y al irse.',
      'Cargar solo en lugares habilitados y respetar el vencimiento de la garrafa.',
      'Que un instalador de gas matriculado revise la instalación completa: es la parte más riesgosa de la obra.',
    ],
    busqueda: 'instalación de gas furgoneta camper garrafa ventilación',
  },
  regulador: {
    descripcion: 'Regulador de presión de gas (GLP). Va enroscado en la válvula de la garrafa y baja la presión al valor que pide el anafe.',
    ubicacion: 'Arriba de la garrafa, dentro del cajón del gas.',
    consejos: [
      'La rosca y la presión tienen que coincidir con la garrafa y con el anafe (cambia según el país).',
      'Manguera certificada, con abrazaderas y dentro de su fecha de vencimiento.',
      'Probar todas las uniones con agua jabonosa antes de usar.',
    ],
    busqueda: 'instalar regulador de gas garrafa camper',
  },
  valvulaGas: {
    descripcion: 'Llave de corte de gas. Permite cortar el gas al anafe sin abrir la garrafa.',
    ubicacion: 'Atrás del anafe, en la parte alta de la sección de la cocina. Se alcanza sacando el cajón del gas.',
    consejos: ['Usar llave de bola apta para gas.', 'Rotularla y que se pueda alcanzar rápido.', 'Cerrarla siempre que no se cocina.'],
    busqueda: 'instalación de gas furgoneta camper llave de corte',
  },
  detectorGas: {
    descripcion: 'Detector de gas GLP con alarma. El gas es más pesado que el aire y se junta cerca del piso.',
    ubicacion: 'En el montante entre el eléctrico y la cocina, cerca del piso, al lado de la puerta de la heladera.',
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
