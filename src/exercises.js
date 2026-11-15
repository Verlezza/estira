// Catálogo de estiramientos. Cada uno indica qué necesita, para que el quiz filtre los que la persona puede hacer.
//   pos:    'sit' (en la silla), 'stand' (de pie junto al escritorio), 'room' (necesita espacio para moverse)
//   floor:  true si se hace en el piso
//   needs:  objetos requeridos; "a|b" significa a o b
//   discreet: se puede hacer en una oficina compartida sin llamar la atención
//   secs:   segundos por lado; sides: true repite del otro lado (la animación se refleja)
//   target: zona que se estira y se pinta en la ilustración (ver TARGETS en figure.js)
//   frames: poses de la ilustración (ver figure.js); h = segundos que se mantiene cada pose
// Los nombres de las zonas y las traducciones al inglés están en i18n.js.

const EXERCISES = [
  {
    id: 'cuello-lateral', target: 'neck', name: 'Cuello hacia el hombro', zones: ['cuello'], pos: 'sit', needs: [], discreet: true,
    scene: 'sit-front', secs: 20, sides: true,
    steps: ['Siéntate derecho con los hombros relajados.', 'Lleva la oreja hacia el hombro, sin subir el hombro.', 'Respira lento y mantén la posición.'],
    frames: [{ p: {}, h: 0.6 }, { p: { nk: 34 }, h: 3 }],
  },
  {
    id: 'cuello-flexion', target: 'neck', name: 'Mentón al pecho', zones: ['cuello', 'espalda_alta'], pos: 'sit', needs: [], discreet: true,
    scene: 'sit-side', secs: 20,
    steps: ['Siéntate derecho.', 'Baja el mentón despacio hacia el pecho.', 'Siente el estiramiento en la nuca y mantén.'],
    frames: [{ p: {}, h: 0.6 }, { p: { nk: 40, ch: 6 }, h: 3 }],
  },
  {
    id: 'barbilla-atras', target: 'neck', name: 'Barbilla hacia atrás', zones: ['cuello'], pos: 'sit', needs: [], discreet: true,
    scene: 'sit-side', secs: 30,
    steps: ['Mira al frente con la cabeza recta.', 'Lleva la barbilla hacia atrás, como haciendo papada.', 'Mantén 2 segundos y suelta. Repite unas 8 veces.'],
    caution: 'Es un movimiento corto: la cabeza se desliza hacia atrás, no se inclina.',
    frames: [{ p: { nk: 22, ch: 5 }, h: 0.6 }, { p: { nk: -8 }, h: 1.4 }],
  },
  {
    id: 'hombros-encoger', target: 'shoulders', name: 'Subir y soltar hombros', zones: ['hombros', 'cuello'], pos: 'sit', needs: [], discreet: true,
    scene: 'sit-front', secs: 30,
    steps: ['Sube los hombros hacia las orejas.', 'Mantén 2 segundos.', 'Suéltalos de golpe y relaja. Repite unas 8 veces.'],
    frames: [{ p: {}, h: 0.5 }, { p: { sh: 9, a1: 8, a2: -8 }, h: 1.2 }],
  },
  {
    id: 'brazo-cruzado', target: 'arm2', name: 'Brazo cruzado al pecho', zones: ['hombros', 'espalda_alta'], pos: 'sit', needs: [], discreet: true,
    scene: 'sit-front', secs: 20, sides: true,
    steps: ['Estira un brazo y crúzalo frente al pecho.', 'Con la otra mano, acércalo al cuerpo por encima del codo.', 'Mantén los hombros abajo.'],
    frames: [{ p: {}, h: 0.6 }, { p: { a2: 92, f2: 0, a1: -10, f1: -157, w1: 0 }, h: 3 }],
  },
  {
    id: 'pecho-apertura', target: 'upper', name: 'Apertura de pecho', zones: ['hombros', 'espalda_alta'], pos: 'sit', needs: [], discreet: true,
    scene: 'sit-side', secs: 20,
    steps: ['Pon las manos detrás de la cabeza, sin empujarla.', 'Lleva los codos hacia atrás y junta los omóplatos.', 'Abre el pecho y respira profundo.'],
    frames: [{ p: {}, h: 0.6 }, { p: { a1: 120, a2: 120, f1: 130, f2: 130, ch: -10, nk: -4 }, h: 3 }],
  },
  {
    id: 'espalda-redondear', target: 'upper', name: 'Abrazar una pelota imaginaria', zones: ['espalda_alta', 'hombros'], pos: 'sit', needs: [], discreet: true,
    scene: 'sit-side', secs: 20,
    steps: ['Estira los brazos al frente y entrelaza los dedos.', 'Empuja las manos hacia adelante y redondea la espalda alta.', 'Deja caer la cabeza entre los brazos.'],
    frames: [{ p: {}, h: 0.6 }, { p: { a1: -88, a2: -92, f1: 0, f2: 0, ch: 22, nk: 25 }, h: 3 }],
  },
  {
    id: 'lateral-sentado', target: 'arm1 upper', name: 'Inclinación lateral sentado', zones: ['espalda_alta', 'espalda_baja'], pos: 'sit', needs: [], discreet: true,
    scene: 'sit-front', secs: 20, sides: true,
    steps: ['Sube un brazo por encima de la cabeza.', 'Inclínate hacia el lado contrario, sin girar.', 'Mantén los dos glúteos apoyados en la silla.'],
    frames: [{ p: {}, h: 0.6 }, { p: { sp: 12, ch: 12, nk: 6, a1: 160, f1: 25, a2: -15, f2: 10 }, h: 3 }],
  },
  {
    id: 'giro-sentado', target: 'upper lower', name: 'Giro de tronco sentado', zones: ['espalda_baja', 'espalda_alta'], pos: 'sit', needs: [], discreet: true,
    scene: 'sit-front', secs: 20, sides: true,
    steps: ['Siéntate derecho con los pies en el piso.', 'Gira el tronco hacia un lado y apoya la mano en el respaldo.', 'La otra mano va a la rodilla. Crece hacia arriba al girar.'],
    frames: [{ p: {}, h: 0.6 }, { p: { sw: 0.4, hr: 0.8, a1: -30, f1: -5, a2: -20, f2: 30 }, h: 3 }],
  },
  {
    id: 'muneca-palma-abajo', target: 'fore2', name: 'Muñeca: palma hacia abajo', zones: ['munecas'], pos: 'sit', needs: [], discreet: true,
    scene: 'sit-side', secs: 20, sides: true,
    steps: ['Estira el brazo al frente con la palma hacia abajo.', 'Dobla la muñeca hacia abajo.', 'Con la otra mano, acerca suavemente los dedos hacia ti.'],
    frames: [{ p: {}, h: 0.6 }, { p: { a2: -90, f2: 0, w2: 75, a1: -78, f1: -15, w1: 70 }, h: 3 }],
  },
  {
    id: 'muneca-palma-arriba', target: 'fore2', name: 'Muñeca: palma hacia arriba', zones: ['munecas'], pos: 'sit', needs: [], discreet: true,
    scene: 'sit-side', secs: 20, sides: true,
    steps: ['Estira el brazo al frente con la palma hacia arriba.', 'Dobla la muñeca hacia abajo.', 'Con la otra mano, lleva los dedos hacia ti.'],
    frames: [{ p: {}, h: 0.6 }, { p: { a2: -90, f2: 0, w2: 80, a1: -82, f1: -5, w1: 95 }, h: 3 }],
  },
  {
    id: 'ojos-20-20-20', target: '', name: 'Mirar a lo lejos (20-20-20)', zones: ['ojos'], pos: 'sit', needs: [], discreet: true,
    scene: 'sit-side', props: ['deskSide', 'monitor'], secs: 20,
    steps: ['Aparta la vista de la pantalla.', 'Mira algo a unos 6 metros, por una ventana o al fondo del cuarto.', 'Parpadea despacio varias veces.'],
    frames: [{ p: { nk: 10 }, h: 1 }, { p: { nk: -6, gz: 1 }, h: 3.5 }],
  },
  {
    id: 'flexion-sentado', target: 'lower', name: 'Flexión adelante sentado', zones: ['espalda_baja'], pos: 'sit', needs: [], discreet: false,
    scene: 'sit-side', secs: 20,
    steps: ['Separa los pies al ancho de la cadera.', 'Inclínate hacia adelante y deja colgar brazos y cabeza.', 'Sube despacio, vértebra por vértebra.'],
    caution: 'Evítalo si te mareas o tienes hernia lumbar.',
    frames: [{ p: {}, h: 0.6 }, { p: { sp: 50, ch: 25, nk: 20, a1: -75, a2: -75, f1: 0, f2: 0 }, h: 3 }],
  },
  {
    id: 'figura-4', target: 'thigh2', name: 'Figura 4 sentado', zones: ['piernas', 'espalda_baja'], pos: 'sit', needs: [], discreet: false,
    scene: 'sit-front', secs: 25, sides: true,
    steps: ['Pon el tobillo sobre la rodilla contraria.', 'Con la espalda recta, inclínate un poco hacia adelante.', 'Siente el estiramiento en el glúteo.'],
    frames: [{ p: {}, h: 0.6 }, { p: { l2: 160, k2: 108, a2: -30, f2: 40, nk: 8 }, h: 3 }],
  },
  {
    id: 'pierna-extendida', target: 'thigh2 shin2', name: 'Pierna estirada sentado', zones: ['piernas'], pos: 'sit', needs: [], discreet: true,
    scene: 'sit-side', secs: 20, sides: true,
    steps: ['Siéntate en el borde de la silla.', 'Estira una pierna con el talón en el piso y la punta hacia arriba.', 'Inclínate hacia adelante con la espalda recta.'],
    frames: [{ p: {}, h: 0.6 }, { p: { l2: 120, k2: 0, t2: -30, sp: 28, ch: 6, a2: -55, f2: -10, a1: -45, f1: -15 }, h: 3 }],
  },
  {
    id: 'tobillos', target: 'shin2 foot2', name: 'Círculos de tobillo', zones: ['piernas'], pos: 'sit', needs: [], discreet: true,
    scene: 'sit-side', secs: 20, sides: true,
    steps: ['Levanta un poco un pie del piso.', 'Dibuja círculos lentos con la punta del pie.', 'Cambia de dirección a la mitad.'],
    frames: [{ p: { l2: 100, k2: 40, t2: -35 }, h: 0.2 }, { p: { l2: 100, k2: 40, t2: 30 }, h: 0.2 }],
  },
  {
    id: 'pelota-pie', target: 'foot2', name: 'Masaje del pie con pelota', zones: ['piernas'], pos: 'sit', needs: ['ball'], discreet: true,
    scene: 'sit-side', props: ['ball'], secs: 30, sides: true,
    steps: ['Pon una pelota pequeña bajo la planta del pie.', 'Ruédala del talón a los dedos con presión suave.', 'Detente un momento en los puntos tensos.'],
    frames: [{ p: { l2: 84, k2: 36, t2: 50 }, h: 0.2 }, { p: { l2: 96, k2: 30, t2: 45 }, h: 0.2 }],
  },
  {
    id: 'brazos-techo', target: 'arm1 arm2', name: 'Brazos hacia el techo', zones: ['hombros', 'espalda_alta'], pos: 'sit', needs: [], discreet: true,
    scene: 'sit-front', secs: 20,
    steps: ['Entrelaza los dedos.', 'Estira los brazos hacia el techo con las palmas arriba.', 'Crece hacia arriba y respira profundo.'],
    frames: [{ p: {}, h: 0.6 }, { p: { a1: 172, a2: -172, f1: 0, f2: 0, sh: 3 }, h: 3 }],
  },
  {
    id: 'toalla-arriba', target: 'arm1 arm2', name: 'Toalla sobre la cabeza', zones: ['hombros', 'espalda_alta'], pos: 'sit', needs: ['towel'], discreet: false,
    scene: 'sit-front', props: ['towel'], secs: 30,
    steps: ['Toma una toalla o cinturón con las manos bien separadas.', 'Súbela por encima de la cabeza con los brazos estirados.', 'Inclínate despacio a un lado y luego al otro.'],
    frames: [
      { p: { a1: 150, a2: -150, f1: 0, f2: 0 }, h: 0.6 }, { p: { a1: 150, a2: -150, f1: 0, f2: 0, sp: 12, ch: 10 }, h: 2 },
      { p: { a1: 150, a2: -150, f1: 0, f2: 0 }, h: 0.6 }, { p: { a1: 150, a2: -150, f1: 0, f2: 0, sp: -12, ch: -10 }, h: 2 },
    ],
  },
  {
    id: 'pantorrilla', target: 'shin1', name: 'Pantorrilla contra la pared', zones: ['piernas'], pos: 'stand', needs: ['desk|wall'], discreet: false,
    scene: 'stand-side', props: ['wall'], secs: 25, sides: true,
    steps: ['Apoya las manos en la pared o en el borde del escritorio.', 'Lleva una pierna atrás con el talón pegado al piso.', 'Dobla la rodilla de adelante hasta sentir la pantorrilla de atrás.'],
    frames: [{ p: { x: 104, sp: 8, a1: -98, a2: -98, f1: -25, f2: -25, w1: -40, w2: -40 }, h: 0.6 },
      { p: { x: 106, y: 136, sp: 16, a1: -104, a2: -104, f1: -40, f2: -40, w1: -40, w2: -40, l2: 168, k2: 22, l1: 205, k1: 0, t1: 0 }, h: 3 }],
  },
  {
    id: 'cuadriceps', target: 'thigh2', name: 'Cuádriceps de pie', zones: ['piernas'], pos: 'stand', needs: ['chair|desk|wall'], discreet: false,
    scene: 'stand-side', props: ['wall'], secs: 25, sides: true,
    steps: ['Apóyate con una mano en la pared, el escritorio o una silla firme.', 'Dobla una rodilla y toma el tobillo por detrás.', 'Mantén las rodillas juntas y la cadera adelante.'],
    frames: [{ p: { x: 125, a1: -90, f1: -40, w1: -50 }, h: 0.6 }, { p: { x: 125, a1: -90, f1: -40, w1: -50, l2: 182, k2: 160, a2: 18, f2: -12 }, h: 3 }],
  },
  {
    id: 'estocada', target: 'thigh1', name: 'Estocada corta de pie', zones: ['piernas', 'espalda_baja'], pos: 'stand', needs: [], discreet: false,
    scene: 'stand-side', secs: 25, sides: true,
    steps: ['Da un paso largo hacia adelante.', 'Dobla un poco las rodillas y empuja la cadera hacia adelante.', 'Sube los brazos para estirar el frente de la cadera.'],
    frames: [{ p: {}, h: 0.6 }, { p: { y: 140, l2: 150, k2: 38, l1: 212, k1: 18, t1: -20, a1: -172, a2: -175, f1: 0, f2: 0, sp: -4 }, h: 3 }],
  },
  {
    id: 'extension-pie', target: 'lower', name: 'Extensión de espalda de pie', zones: ['espalda_baja'], pos: 'stand', needs: [], discreet: true,
    scene: 'stand-side', secs: 20,
    steps: ['Ponte de pie con los pies al ancho de la cadera.', 'Apoya las manos en la parte baja de la espalda.', 'Inclínate un poco hacia atrás y mira al techo.'],
    caution: 'Es un arco suave. Si duele, reduce el movimiento.',
    frames: [{ p: { a1: 55, a2: 55, f1: -85, f2: -85, w1: -60, w2: -60 }, h: 0.6 }, { p: { a1: 55, a2: 55, f1: -85, f2: -85, w1: -60, w2: -60, sp: -10, ch: -10, nk: -12, x: 94 }, h: 3 }],
  },
  {
    id: 'lateral-pie', target: 'arm1 upper', name: 'Inclinación lateral de pie', zones: ['espalda_alta', 'espalda_baja'], pos: 'stand', needs: [], discreet: false,
    scene: 'stand-front', secs: 20, sides: true,
    steps: ['De pie, sube los dos brazos por encima de la cabeza.', 'Junta las palmas o toma una muñeca con la otra mano.', 'Inclínate hacia un lado sin echar la cadera atrás.'],
    frames: [{ p: { a1: 172, a2: -172 }, h: 0.6 }, { p: { a1: 174, a2: -186, sp: 14, ch: 12, x: 96 }, h: 3 }],
  },
  {
    id: 'circulos-brazos', target: 'arm1 arm2', name: 'Círculos de brazos', zones: ['hombros'], pos: 'room', needs: [], discreet: false,
    scene: 'stand-front', secs: 30,
    steps: ['De pie, separa los pies al ancho de la cadera.', 'Haz círculos grandes y lentos con los brazos estirados.', 'A la mitad, cambia de dirección.'],
    frames: [{ p: {}, h: 0.1 }, { p: { a1: 90, a2: -90 }, h: 0.1 }, { p: { a1: 175, a2: -175 }, h: 0.1 }, { p: { a1: 90, a2: -90 }, h: 0.1 }],
  },
  {
    id: 'isquios-escritorio', target: 'thigh2 shin2', name: 'Isquiotibiales con escritorio', zones: ['piernas', 'espalda_baja'], pos: 'stand', needs: ['desk'], discreet: false,
    scene: 'stand-side', props: ['deskStand'], secs: 25,
    steps: ['Apoya las manos en el escritorio y da dos pasos atrás.', 'Lleva la cadera hacia atrás con la espalda recta.', 'Siente la parte de atrás de las piernas.'],
    frames: [{ p: { x: 88, sp: 15, a1: -60, a2: -60, f1: -20, f2: -20 }, h: 0.6 },
      { p: { x: 78, y: 132, sp: 78, ch: 0, nk: -10, a1: -82, a2: -82, f1: 0, f2: 0, l1: 188, l2: 188 }, h: 3 }],
  },
  {
    id: 'gato-vaca', target: 'lower upper', name: 'Gato y vaca', zones: ['espalda_baja', 'espalda_alta'], pos: 'room', floor: true, needs: [], discreet: false,
    scene: 'floor-side', secs: 30,
    steps: ['Apoya manos y rodillas en el piso.', 'Al exhalar, redondea la espalda y mira al ombligo.', 'Al inhalar, arquea suave y mira al frente.'],
    frames: [
      { p: { x: 80, y: 170, sp: 33, ch: 50, nk: 50, a1: -83, a2: -83, l1: 180, l2: 180, k1: 90, k2: 90, t1: 90, t2: 90 }, h: 1 },
      { p: { x: 80, y: 170, sp: 83, ch: -50, nk: 30, a1: -33, a2: -33, l1: 180, l2: 180, k1: 90, k2: 90, t1: 90, t2: 90 }, h: 1 },
    ],
  },
  {
    id: 'postura-nino', target: 'lower', name: 'Postura del niño', zones: ['espalda_baja', 'hombros'], pos: 'room', floor: true, needs: [], discreet: false,
    scene: 'floor-side', secs: 30,
    steps: ['De rodillas, siéntate sobre los talones.', 'Lleva el pecho hacia los muslos y estira los brazos al frente.', 'Apoya la frente y respira hacia la espalda.'],
    frames: [
      { p: { x: 80, y: 170, sp: 58, ch: 0, nk: 30, a1: -58, a2: -58, l1: 180, l2: 180, k1: 90, k2: 90, t1: 90, t2: 90 }, h: 0.6 },
      { p: { x: 55, y: 190, sp: 88, ch: 6, nk: 12, a1: -170, a2: -170, f1: 0, f2: 0, l1: 110, l2: 110, k1: 160, k2: 160, t1: 90, t2: 90 }, h: 3 },
    ],
  },
  {
    id: 'rodillas-pecho', target: 'lower', name: 'Rodillas al pecho', zones: ['espalda_baja', 'piernas'], pos: 'room', floor: true, needs: [], discreet: false,
    scene: 'floor-side', secs: 30,
    steps: ['Acuéstate boca arriba.', 'Lleva las rodillas al pecho y abrázalas.', 'Balancéate suave de lado a lado si te sienta bien.'],
    frames: [
      { p: { x: 110, y: 200, sp: 270, nk: -6, a1: 0, a2: 0, l1: 30, l2: 30, k1: 130, k2: 130 }, h: 0.6 },
      { p: { x: 110, y: 200, sp: 270, nk: -14, a1: -40, a2: -40, f1: -30, f2: -30, l1: -45, l2: -45, k1: 140, k2: 140 }, h: 3 },
    ],
  },

  // ---------- Cadera ----------
  {
    id: 'cadera-silla', target: 'thigh1', name: 'Flexor de cadera en la silla', zones: ['piernas', 'espalda_baja'], pos: 'sit', needs: ['chair'], discreet: false,
    scene: 'stand-side', props: ['stool'], secs: 25, sides: true,
    steps: ['Siéntate de lado en el borde de una silla firme.', 'Lleva la pierna de afuera hacia atrás, con la rodilla apuntando al piso.', 'Mantén el tronco derecho y empuja suave la cadera hacia adelante.'],
    frames: [{ p: { x: 100, y: 170, l1: 90, l2: 90, k1: 90, k2: 90, a1: -10, f1: -33, a2: -10, f2: -33 }, h: 0.6 },
      { p: { x: 100, y: 170, l1: 90, l2: 90, k1: 90, k2: 90, l1: 215, k1: 45, t1: -30, sp: -4, a1: -10, f1: -33, a2: -10, f2: -33 }, h: 3 }],
  },
  {
    id: 'aductores-sentado', target: 'thigh1 thigh2', name: 'Aductores sentado', zones: ['piernas'], pos: 'sit', needs: [], discreet: true,
    scene: 'sit-front', secs: 25,
    steps: ['Siéntate en el borde de la silla y separa bien las rodillas.', 'Apoya las manos en la parte interna de las rodillas.', 'Inclínate un poco hacia adelante y empuja las rodillas hacia afuera.'],
    frames: [{ p: {}, h: 0.6 }, { p: { l1: 222, k1: -42, l2: 138, k2: 42, a1: 34, f1: -40, a2: -34, f2: 40 }, h: 3 }],
  },
  {
    id: 'rodilla-pecho-pie', target: 'thigh2', name: 'Rodilla al pecho de pie', zones: ['piernas', 'espalda_baja'], pos: 'stand', needs: [], discreet: false,
    scene: 'stand-side', secs: 20, sides: true,
    steps: ['De pie, sube una rodilla hacia el pecho.', 'Abrázala con las dos manos por debajo de la rodilla.', 'Mantén la espalda recta. Si pierdes el equilibrio, apóyate en la pared.'],
    frames: [{ p: {}, h: 0.6 }, { p: { l2: 68, k2: 125, a1: -38, f1: 0, a2: -36, f2: 0 }, h: 3 }],
  },
  {
    id: 'circulos-cadera', target: 'lower', name: 'Círculos de cadera', zones: ['piernas', 'espalda_baja'], pos: 'stand', needs: [], discreet: false,
    scene: 'stand-front', secs: 30,
    steps: ['De pie, separa los pies un poco más que el ancho de la cadera.', 'Pon las manos en la cintura.', 'Dibuja círculos lentos con la cadera. A la mitad, cambia de dirección.'],
    frames: [{ p: { x: 90, y: 133, sp: 7, l1: 186.5, l2: 158.7, a1: 40, f1: -120, a2: -40, f2: 120 }, h: 0.3 },
      { p: { x: 110, y: 133, sp: -7, l1: 201.3, l2: 173.5, a1: 40, f1: -120, a2: -40, f2: 120 }, h: 0.3 }],
  },
  {
    id: 'balanceo-pierna', target: 'thigh2', name: 'Balanceo de pierna', zones: ['piernas'], pos: 'stand', needs: ['chair|desk|wall'], discreet: false,
    scene: 'stand-side', props: ['wall'], secs: 30, sides: true,
    steps: ['Apóyate con una mano en la pared, el escritorio o una silla firme.', 'Balancea una pierna hacia adelante y hacia atrás, relajada.', 'Aumenta el recorrido poco a poco, sin forzar.'],
    frames: [{ p: { x: 125, a1: -90, f1: -40, w1: -50, l2: 140 }, h: 0.2 }, { p: { x: 125, a1: -90, f1: -40, w1: -50, l2: 210 }, h: 0.2 }],
  },
  {
    id: 'estocada-lateral', target: 'thigh2', name: 'Estocada lateral', zones: ['piernas'], pos: 'room', needs: [], discreet: false,
    scene: 'stand-front', secs: 25, sides: true,
    steps: ['Abre bien las piernas, con las puntas de los pies hacia adelante.', 'Dobla una rodilla y lleva la cadera hacia ese lado.', 'La otra pierna queda estirada. Siente la parte interna del muslo.'],
    frames: [{ p: { y: 136, l1: 200, l2: 160, a1: 10, a2: -10 }, h: 0.6 },
      { p: { x: 80, y: 141, l1: 200, k1: -39, l2: 153, k2: 0, a1: -20, f1: -20, a2: -20, f2: 20 }, h: 3 }],
  },
  {
    id: 'mariposa', target: 'thigh1 thigh2', name: 'Mariposa', zones: ['piernas'], pos: 'room', floor: true, needs: [], discreet: false,
    scene: 'floor-front', secs: 30,
    steps: ['Siéntate en el piso y junta las plantas de los pies.', 'Toma los pies con las manos y endereza la espalda.', 'Deja que las rodillas bajen hacia el piso, sin empujarlas.'],
    frames: [{ p: { l1: 222, k1: -150, l2: 138, k2: 150, a1: -14, f1: 6, a2: 14, f2: -6 }, h: 0.6 },
      { p: { l1: 250, k1: -166, l2: 110, k2: 166, a1: -14, f1: 6, a2: 14, f2: -6 }, h: 3 }],
  },
];
