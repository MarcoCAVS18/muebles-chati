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
    ubicacion: 'Sección izquierda del mueble trasero, zona baja, al lado del inversor.',
    consejos: ['Tiene que ser apto para alternador inteligente (el Jumpy lo es).', 'Ponerlo cerca de la batería de 150 Ah para que el cable de salida sea corto.', 'Dejar aire alrededor: se calienta cuando carga fuerte.'],
    busqueda: 'instalar cargador DC-DC camper alternador inteligente',
  },
  bateria: {
    descripcion: 'Batería de litio (LiFePO4) de 150 Ah. Alimenta la heladera, las luces, la bomba, el extractor y el inversor.',
    ubicacion: 'Sección izquierda del mueble trasero, zona baja, detrás de la cabecera de la cama.',
    consejos: ['Fijarla con un marco o correas: no puede moverse al frenar.', 'Confirmar que el BMS entrega la corriente que pide el inversor.', 'El fusible principal va lo más cerca posible del borne positivo.'],
    busqueda: 'instalar batería de litio 12v camper furgoneta',
  },
  fusiblePrincipal: {
    descripcion: 'Fusible principal del inversor. Protege el cable más grueso de la instalación.',
    ubicacion: 'Al lado de la batería, entre el borne positivo y el inversor.',
    consejos: ['Elegir el fusible por la tabla de cables de la pestaña Eléctrica.', 'Usar un portafusible de calidad (tipo MEGA o ANL).'],
    busqueda: 'fusible principal inversor camper instalación',
  },
  fusibles: {
    descripcion: 'Caja de fusibles que reparte los 12 V a los equipos. Cada línea lleva su fusible.',
    ubicacion: 'Sección izquierda del mueble trasero, zona baja, junto a la batería.',
    consejos: ['Rotular cada fusible con lo que protege.', 'Dejar lugar libre para sumar líneas más adelante.', 'Alimentar con el cable de la tabla de cables (batería a caja).'],
    busqueda: 'instalar caja de fusibles 12v camper',
  },
  inversor: {
    descripcion: 'Inversor que convierte 12 V de la batería en 230 V para los enchufes. Ya comprado. Tiene entrada para mando a distancia.',
    ubicacion: 'Sección izquierda del mueble trasero, zona baja, atrás de la batería.',
    consejos: ['Cables de entrada cortos y gruesos, con fusible principal.', 'Dejar ventilación: se calienta con carga.', 'Si tiene mando a distancia, conectarlo al interruptor 5 del panel.'],
    busqueda: 'instalar inversor 12v 220v camper con mando a distancia',
  },
  panelSwitches: {
    descripcion: 'Panel con 5 interruptores. Cada uno enciende o apaga una parte de la instalación.',
    ubicacion: 'En el frente del mueble trasero, entre las puertas F1 y F2, a la altura de la cabecera.',
    consejos: ['Cada interruptor lleva su fusible en la caja de fusibles.', 'Rotular cada interruptor.'],
    busqueda: 'instalar panel de interruptores 12v camper',
  },
  enchufe1: {
    descripcion: 'Enchufe de 230 V con carga USB-C incluida. Se alimenta del inversor.',
    ubicacion: 'En el frente del mueble trasero, arriba de la cama, para cargar celular y notebook.',
    consejos: ['Línea de 230 V con disyuntor.', 'Usar cable de 3 hilos con tierra.', 'Mantener el cable de 230 V separado de los de 12 V.'],
    busqueda: 'instalar enchufe 220v con usb camper furgoneta',
  },
  enchufe2: {
    descripcion: 'Segundo enchufe de 230 V con USB-C. Va en derivación del primero.',
    ubicacion: 'En el frente del mueble trasero, al lado del primero.',
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
  extractor: {
    descripcion: 'Extractor de techo (ventilador) para sacar humedad y calor.',
    ubicacion: 'Techo, sobre la zona de la mesa.',
    consejos: ['Sellar bien el corte del techo con sellador para carrocería.', 'Cable por el costado, con pasacables.'],
    busqueda: 'instalar extractor techo furgoneta camper',
  },
  nevera: {
    descripcion: 'Heladera de compresor 12 V. Va debajo del fregadero, en la sección izquierda del mueble trasero.',
    ubicacion: 'Sección izquierda, parte baja, detrás de la puerta F1.',
    consejos: ['Dejar aire alrededor: necesita ventilar el compresor.', 'Línea propia en la caja de fusibles, sin interruptor.'],
    busqueda: 'instalar nevera compresor 12v furgoneta camper',
  },
  fregadero: {
    descripcion: 'Fregadero encastrado en la tapa 1.',
    ubicacion: 'Sección izquierda del mueble trasero, arriba.',
    consejos: ['Calar la tapa con la plantilla del fregadero.', 'Sellar el borde con silicona.', 'Desagüe con sifón hacia un bidón de aguas grises.'],
    busqueda: 'instalar fregadero y grifo camper',
  },
  canilla: {
    descripcion: 'Canilla del fregadero, alimentada por la bomba de agua.',
    ubicacion: 'Sobre la tapa 1, al lado del fregadero.',
    consejos: ['Manguera de grado alimenticio con abrazaderas.'],
    busqueda: 'instalar grifo fregadero camper',
  },
  bomba: {
    descripcion: 'Bomba de agua de 12 V. Saca el agua de los bidones y la manda a la canilla.',
    ubicacion: 'Sección central del mueble trasero, estante superior, atrás de la puerta F2.',
    consejos: ['Va con un interruptor del panel (el 3).', 'Fijarla sobre goma para que no vibre.', 'Filtro de agua antes de la bomba.'],
    busqueda: 'instalar bomba de agua 12v camper',
  },
  bidon1: {
    descripcion: 'Bidón de agua limpia. Va en la parte baja de la sección central.',
    ubicacion: 'Sección central, parte baja, atrás de la puerta F2b.',
    consejos: ['Fijarlo con correa.', 'Unir con el otro bidón mediante una T.'],
    busqueda: 'instalar depósito de agua camper bidones',
  },
  bidon2: {
    descripcion: 'Segundo bidón de agua limpia.',
    ubicacion: 'Sección central, parte baja, atrás del otro bidón.',
    consejos: ['Salida a la bomba por la parte baja.'],
    busqueda: 'instalar depósito de agua camper bidones',
  },
};

// Datos para cables y mangueras: usan el texto del propio cable
export const BUSQUEDA_CABLES = {
  dc: 'instalación eléctrica 12v furgoneta camper cableado paso a paso',
  ac: 'instalar enchufe 220v camper desde inversor',
  senal: 'inversor con mando a distancia instalación camper',
  agua: 'instalación de agua camper bomba depósito grifo',
};
