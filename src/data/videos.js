// Videos recomendados de YouTube para cada elemento eléctrico, de agua y de gas.
// Los links salieron de búsquedas reales. Si alguno deja de estar disponible, se puede
// cambiar el id acá; el botón "Buscar más en YouTube" siempre funciona.

const v = (id, titulo, idioma = 'es') => ({ id, titulo, idioma });

const BATERIA_AUTO = [
  v('N3asm7M0gzI', 'Instalación Batería Auxiliar en Furgoneta Camper'),
  v('mpmkjZAqKbg', '#3 Camperización: batería bajo el asiento'),
  v('3_JtD2j422U', 'Batería auxiliar con relé separador'),
];
const FUSIBLE_ANL = [
  v('N3asm7M0gzI', 'Instalación Batería Auxiliar en Furgoneta Camper'),
  v('3_JtD2j422U', 'Batería auxiliar con relé separador'),
  v('uAlcXyG9IZc', '#7 Camperizar furgoneta: guía completa de la instalación eléctrica'),
];
const DCDC = [
  v('q294eXU2VsQ', 'Instalación Cargador Booster Orion Tr Smart 12-12 Victron para Camper'),
  v('Z7kqVsdXiMc', 'Cableado y programación cargador DC/DC Victron Smart TR 30 A'),
  v('i-Ms-wTBVIc', 'DIY Electro Camper: dónde colocar cargador, booster, MPPT e inversor'),
];
const BATERIA = [
  v('WMOBz89w-2w', 'Baterías de litio en célula camper'),
  v('lS0EJb8k7r4', 'Batería de litio en furgoneta camper'),
  v('qe7YUEiuAYg', 'Instalación Eléctrica 12V CAMPER: guía paso a paso'),
];
const CAJA_FUSIBLES = [
  v('kPnr6TFzUtk', '#7 Camperización: caja de fusibles, focos, cargadores, extractor e inversor'),
  v('fFv17Ru7E78', 'Fitting a 12V Fuse Box and Victron Battery Protect', 'en'),
  v('qe7YUEiuAYg', 'Instalación Eléctrica 12V CAMPER: guía paso a paso'),
];
const INVERSOR = [
  v('o_M50dRc7sU', 'Cómo instalar un conversor inversor 12 V a 220 V en autocaravana'),
  v('Ce5gTXQ3NFY', 'Instalación de un inversor con mando a distancia'),
  v('6LAfG9Vih94', 'Instalación eléctrica en furgoneta: guía completa'),
];
const PANEL = [
  v('dQsY33_fyPo', 'How to wire a 12v switch panel in a campervan', 'en'),
  v('9SrYVDllGEU', '12V Switch Panel Installation Made Simple', 'en'),
  v('5sxIAzTGouI', '#18 Instalación de luces LED + toma de 12 V'),
];
const ENCHUFES = [
  v('LrAcoi5fPLw', '#4 Voltímetro, USB, enchufes y luces'),
  v('7y95CQRdJoU', 'MINIBRICO #8: instalación de enchufe USB'),
  v('-Xwp3vRsbQk', 'Instalación de 220 V y 12 V en camper'),
  v('82Yb6wLYZDA', 'Install 12V and 120V outlets in camper van', 'en'),
];
const LED = [
  v('dQusMqWE4To', 'Perfil de aluminio encastrado para tira LED en autocaravana o furgoneta'),
  v('g3chxDXGr6I', 'Cómo montar LEDs dentro de una caravana o autocaravana'),
  v('ARH_SAFBcZI', 'Cómo instalar luces LED en tu furgoneta camper'),
  v('PtDUrl1rLVY', 'Cómo soldar tira LED'),
];
const LAMPARA = [
  v('5sxIAzTGouI', '#18 Instalación de luces LED + toma de 12 V'),
  v('9ValWTXneo0', 'Instalación de 12v en furgoneta'),
  v('qe7YUEiuAYg', 'Instalación Eléctrica 12V CAMPER: guía paso a paso'),
];
const CABLEADO = [
  v('6LAfG9Vih94', 'Instalación eléctrica en furgoneta: guía completa'),
  v('uAlcXyG9IZc', '#7 Camperizar furgoneta: guía completa de la instalación eléctrica'),
  v('qe7YUEiuAYg', 'Instalación Eléctrica 12V CAMPER: guía paso a paso'),
];
const NEVERA = [
  v('B-tny9P4vDM', 'Instalación nevera 12V Isotherm en barco, furgoneta camper o autocaravana'),
  v('uueaEG956ug', 'Nevera 12 V con compresor para furgoneta camper #54'),
  v('qe7YUEiuAYg', 'Instalación Eléctrica 12V CAMPER: guía paso a paso'),
];
const BOMBA = [
  v('Fwgjob2CHbE', 'Instalamos bomba de agua 12 V: el mejor sistema de agua para una camper'),
  v('ofjBmCfNpUQ', '#8 Camperización: fontanería con grifo, bomba de agua, depósitos y llenado'),
  v('RT14qz6dHRc', 'Instalación de agua completa en una camper'),
];
const FREGADERO = [
  v('hEQAibjQQEg', 'Instalación de fregadero y grifo en camper o van'),
  v('pkG8GwzoKOo', 'Grifo de fregadero para tu furgoneta'),
  v('ofjBmCfNpUQ', '#8 Camperización: fontanería con grifo, bomba de agua, depósitos y llenado'),
];
const CLARABOYA = [
  v('LdhrxeuVnH4', 'Instalación de claraboya en furgoneta camper (Dometic)'),
  v('NXihOY8SP7Q', 'Instalación de claraboya paso a paso en furgoneta camper (Fiamma)'),
  v('Y4kcG6cLIJA', 'Claraboya sin goteras en camper'),
  v('SdEQ95KtEAA', 'Aislar y sellar una claraboya de techo de autocaravana o camper'),
];
const GAS = [
  v('vOHac9Sj5rY', 'Instalación de gas en tu furgoneta'),
  v('aEN3KcUlQ34', 'Instalación de gas en furgoneta camper'),
  v('uq1QHgZLP08', 'Instalación de gas para tu furgoneta camper'),
  v('1K-qneaKoUI', 'Instalación de gas en furgoneta camper: consejos (Iveco Daily)'),
];
const ANAFE = [
  v('5RSvxdMau9o', 'Instalar un anafe de 2 hornallas de acero inoxidable para gas natural o envasado'),
  v('aEN3KcUlQ34', 'Instalación de gas en furgoneta camper'),
  v('uq1QHgZLP08', 'Instalación de gas para tu furgoneta camper'),
];
const REGULADOR = [
  v('XDEl68nehhQ', 'Instalación segura de regulador de gas paso a paso'),
  v('_1ZeVAhQU4U', 'Instalación de regulador de gas'),
  v('JGiirLZ_7Qc', 'Cómo instalar un regulador para gas propano'),
];
const DETECTOR_GAS = [
  v('Q9WPB712SCg', 'Detector de gases para autocaravanas'),
  v('vOHac9Sj5rY', 'Instalación de gas en tu furgoneta'),
];

// Clave de video por id de elemento (equipos, cables y mangueras)
export const VIDEOS = {
  bateriaAuto: BATERIA_AUTO,
  anl: FUSIBLE_ANL,
  dcdc: DCDC,
  bateria: BATERIA,
  fusiblePrincipal: CAJA_FUSIBLES,
  cortacircuitos1: BATERIA,
  cortacircuitos2: CAJA_FUSIBLES,
  calefactor: BATERIA,
  termostato: BATERIA,
  aislante: BATERIA,
  fusibles: CAJA_FUSIBLES,
  inversor: INVERSOR,
  panelSwitches: PANEL,
  enchufe1: ENCHUFES,
  enchufe2: ENCHUFES,
  ledA: LED,
  ledB: LED,
  ledC: LED,
  ledD: LED,
  lampara: LAMPARA,
  extractor: CLARABOYA,
  nevera: NEVERA,
  bomba: BOMBA,
  canilla: FREGADERO,
  fregadero: FREGADERO,
  bidon1: BOMBA,
  bidon2: BOMBA,
  anafe: ANAFE,
  garrafa: GAS,
  regulador: REGULADOR,
  valvulaGas: GAS,
  detectorGas: DETECTOR_GAS,
  gas: GAS,
  cableado: CABLEADO,
};

export function videosDe(clave) {
  return VIDEOS[clave] || VIDEOS.cableado;
}

export const urlVideo = (id) => `https://www.youtube.com/watch?v=${id}`;
export const urlEmbed = (id) => `https://www.youtube-nocookie.com/embed/${id}`;
export const urlBusqueda = (texto) => `https://www.youtube.com/results?search_query=${encodeURIComponent(texto)}`;
