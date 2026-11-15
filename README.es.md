# Estira

[English](README.md) · **Español**

Estira es una aplicación de escritorio, libre y gratuita, que te recuerda hacer pausas mientras trabajas en la computadora. En cada pausa te guía con estiramientos cortos e ilustrados.

No es una app de ejercicio. Sirve para que quienes pasan el día frente a la pantalla se muevan un poco cada cierto tiempo y eviten molestias en el cuello, la espalda y las muñecas.

## Qué hace

- **Cuestionario inicial.** Pregunta cuánto espacio tienes, si puedes usar el piso, qué tienes a mano (silla firme, escritorio, pared, toalla, pelota) y dónde sientes tensión. Con eso elige los estiramientos que puedes hacer.
- **Recordatorios.** Cada 30, 45, 60 o 90 minutos la ventana aparece encima de todo con un sonido suave. Puedes empezar, posponer 10 minutos o saltar esa pausa.
- **Pausas guiadas.** De 2 a 6 estiramientos con pasos y cuenta regresiva. Cada ilustración muestra la pose inicial en tenue, la final en sólido, una flecha con el movimiento y, en naranja, la zona que se estira. También indica si hay que mantener la posición o repetir el movimiento. Los que se hacen de los dos lados se muestran reflejados.
- **Variedad.** Si tienes espacio, las pausas alternan estiramientos en silla y de pie, evitan trabajar la misma zona dos veces seguidas y dejan los de piso para el final.
- **36 estiramientos** para cuello, hombros, espalda alta y baja, muñecas, cadera y piernas, y ojos (regla 20-20-20).
- **Modo discreto.** Si trabajas en una oficina compartida, prioriza los estiramientos que no llaman la atención.
- **Sabe cuándo no estás o estás ocupado.** Si llevas 5 minutos sin usar el mouse ni el teclado (o con la pantalla bloqueada), el contador vuelve a empezar: ya te moviste. Durante una llamada (micrófono o cámara en uso), jugando en pantalla completa o presentando, no abre la ventana: aparece un aviso pequeño en la esquina, encima de todo pero sin quitarte el foco, que se cierra solo a los 25 segundos. Se repite cada 15 minutos mientras sigas ocupado. Para verlo, ejecuta `estira.exe --test-nudge`.
- **Actualizaciones automáticas.** Cuando se publica una versión nueva, Estira ofrece instalarla.
- **Bandeja del sistema.** Al cerrar la ventana, Estira sigue en la bandeja. Puede abrirse sola al iniciar Windows.
- **Español e inglés.** Usa el idioma de Windows (inglés si no es español) y se puede cambiar en Ajustes.
- **Ligera.** Usa el WebView2 que ya trae Windows: el instalador pesa menos de 2 MB.

Las ilustraciones no son archivos de imagen: una figura se dibuja con código a partir de ángulos de articulaciones (ver [`src/figure.js`](src/figure.js)).

## Instalar

1. Descarga el instalador desde la [última versión](https://github.com/Verlezza/estira/releases/latest): es el archivo `Estira_x.y.z_x64-setup.exe`.
2. Ábrelo. Se instala solo para tu usuario y no pide permisos de administrador.

Windows puede mostrar el aviso "Windows protegió su PC" porque el instalador aún no está firmado. Haz clic en **Más información → Ejecutar de todas formas**.

## Desarrollo

Necesitas:

- [Node.js](https://nodejs.org/) 20 o más reciente
- [Rust](https://rustup.rs/)
- Visual Studio Build Tools con "Desarrollo para el escritorio con C++"

```bash
npm install
npm run dev     # abre la app en modo desarrollo
npm run build   # genera el instalador en src-tauri/target/release/bundle/nsis/
```

Para trabajar solo en la interfaz no necesitas Rust: sirve la carpeta `src` con cualquier servidor estático (por ejemplo `python -m http.server -d src`) y ábrela en el navegador. Sin Tauri, la ventana no se pone al frente ni hay bandeja, pero todo lo demás funciona.

### Publicar una versión

1. Cambia la versión en `package.json`, `src-tauri/Cargo.toml` y `src-tauri/tauri.conf.json`.
2. Crea y sube una etiqueta: `git tag v0.2.0 && git push --tags`.
3. GitHub Actions compila y firma el instalador, lo publica en Releases y genera `latest.json`, que usan las copias instaladas para actualizarse.

Las actualizaciones van firmadas. El repositorio necesita el secreto `TAURI_SIGNING_PRIVATE_KEY` (Settings → Secrets and variables → Actions) con la clave privada creada con `npx tauri signer generate`. Si la clave tiene contraseña, agrega también `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. La clave pública correspondiente está en `src-tauri/tauri.conf.json`. Nunca subas la clave privada al repositorio y no la pierdas: sin ella, las copias instaladas no pueden recibir actualizaciones.

## Estructura

```
src/                 Interfaz (HTML, CSS y JavaScript sin frameworks)
  app.js             Cuestionario, temporizador, pausas, catálogo y ajustes
  exercises.js       Catálogo de estiramientos
  i18n.js            Textos en español e inglés y detección del idioma
  figure.js          Motor de la figura ilustrada
src-tauri/           Envoltura de escritorio (Rust): bandeja, autoarranque, instalador
tests/               Revisión automática del catálogo (npm test)
docs/ESTUDIO.md      Investigación y decisiones del proyecto
```

## Agregar un estiramiento

Agrega un objeto a `EXERCISES` en [`src/exercises.js`](src/exercises.js) y su traducción en `EXERCISES_EN` de [`src/i18n.js`](src/i18n.js). Los campos están explicados al inicio del archivo. La ilustración sale de una lista de poses (se dibujan la primera y la última, o las dos más distintas en los movimientos que se repiten), y `target` indica la zona a pintar: cada pose cambia solo los ángulos que se mueven respecto a la escena base (`sit-front`, `sit-side`, `stand-front`, `stand-side` o `floor-side`). La convención de ángulos está al inicio de [`src/figure.js`](src/figure.js).

Para revisar el resultado, ejecuta `npm test`, abre la app, ve a **Ver estiramientos** y toca el tuyo.

Antes de proponer uno nuevo, comprueba que sea un estiramiento suave, seguro para la mayoría de las personas y que se pueda hacer con ropa de oficina.

## Aviso

Estira no da consejo médico. Si tienes una lesión, dolor fuerte, hormigueo o una condición médica, consulta a un profesional de la salud antes de hacer estiramientos.

## Licencia

[MIT](LICENSE)
