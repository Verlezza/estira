# Estudio del proyecto

Este documento resume la investigación y las decisiones detrás de Reed, del 14 de noviembre de 2026.

## 1. El problema

Quien trabaja todo el día en la computadora pasa horas en la misma postura. Lo habitual son tensión en el cuello y los hombros, dolor en la espalda baja, molestias en las muñecas y ojos cansados. Las guías de ergonomía coinciden en tres hábitos sencillos:

- **Pausas cortas y frecuentes.** Levantarse o moverse un par de minutos cada 30 a 60 minutos funciona mejor que una sola pausa larga.
- **Estiramientos suaves.** Llegar a una tensión leve, sin dolor ni rebotes, y mantenerla de 15 a 30 segundos.
- **Descanso visual.** La regla 20-20-20: cada 20 minutos, mirar algo a unos 6 metros (20 pies) durante 20 segundos.

El obstáculo no es saber qué hacer, sino acordarse. Por eso Reed es, ante todo, una alarma con instrucciones claras.

## 2. Alternativas que ya existen

| App | Qué hace bien | Qué le falta para este caso |
|---|---|---|
| Stretchly | Recordatorios de pausa, libre y multiplataforma | Sugiere ideas en texto, sin guía animada; usa Electron, por lo que el instalador pesa unos 100 MB |
| Workrave | Libre, con ejercicios ilustrados | Interfaz antigua; no adapta los ejercicios al espacio de cada persona |
| EyeLeo | Buen descanso visual | Se centra en los ojos |
| Apps del celular | Rutinas completas | Están en otro dispositivo y no saben que llevas 2 horas en la computadora |

**Qué aporta Reed:** estiramientos ilustrados, elegidos según el espacio y los objetos que tienes, en español y con un instalador ligero.

## 3. Decisiones técnicas

### App de escritorio con Tauri 2

| Opción | Tamaño del instalador | Comentario |
|---|---|---|
| **Tauri 2** (elegida) | 3–6 MB | Usa el WebView2 que ya trae Windows 10 y 11. La interfaz es web, así que es fácil de modificar |
| Electron | 80–120 MB | Incluye un Chromium completo y consume más memoria en segundo plano |
| .NET (WPF o WinUI) | Variable | Solo Windows y más difícil de llevar luego a Mac o Linux |

Una app que pasa todo el día en la bandeja debe consumir poco. Tauri cumple con eso y deja abierta la puerta a Mac y Linux.

### Interfaz sin frameworks

Son 4 archivos de HTML, CSS y JavaScript, sin React ni empaquetador. Así no hay paso de compilación para la interfaz y cualquier persona que sepa algo de web puede contribuir.

### La "base de datos"

No hace falta un motor de base de datos:

- **El catálogo de estiramientos** está en `src/exercises.js`. Es contenido fijo que viaja con la app y se revisa como código en GitHub.
- **Las respuestas del cuestionario y las estadísticas del día** se guardan en el almacenamiento local de la app (`localStorage`).

Si en el futuro se guarda historial de semanas o meses, se puede pasar a SQLite con el plugin oficial de Tauri.

### Ilustraciones hechas con código

En lugar de dibujar o descargar imágenes, una figura se dibuja en SVG a partir de los ángulos de sus articulaciones: columna, cuello, hombros, codos, muñecas, cadera, rodillas y tobillos. Cada estiramiento es una lista de poses, y el motor interpola entre ellas.

Ventajas:

- Los 36 estiramientos ocupan unos pocos KB.
- Se adaptan al modo claro y oscuro.
- Agregar uno nuevo es escribir unos ángulos, sin herramientas de diseño.
- Los ejercicios que se hacen de ambos lados se reflejan automáticamente.
- En la v0.4.0 la animación en bucle se cambió por una ilustración fija (pose inicial tenue, final sólida, flecha y zona pintada en naranja), porque el bucle confundía: no quedaba claro si había que mantener la posición o repetir el movimiento. Cada estiramiento indica ahora "Mantén" o "Repite".

Límite: en 2D no se ve bien la rotación del tronco. El giro sentado se insinúa estrechando los hombros y girando la mirada.

### Recordatorio

- La ventana aparece encima de todo y suena un tono generado por código, sin archivos de audio.
- El temporizador corre en la interfaz. Con la ventana oculta, WebView2 puede retrasar los temporizadores hasta un minuto, lo cual no importa en pausas de 30 a 90 minutos.
- Una sola instancia: abrir Reed dos veces solo muestra la ventana.
- Al iniciar con Windows arranca minimizada en la bandeja.

## 4. El cuestionario

| Pregunta | Para qué sirve |
|---|---|
| ¿Dónde trabajas? (casa u oficina compartida) | En una oficina, prioriza los estiramientos discretos |
| ¿Cuánto espacio tienes? (silla, de pie, espacio para moverte) | Descarta los que no caben |
| ¿Puedes usar el piso? (solo si hay espacio) | Habilita gato-vaca, postura del niño y rodillas al pecho |
| ¿Qué tienes a mano? (silla firme, escritorio, pared, toalla, pelota) | Habilita los que necesitan apoyo u objetos |
| ¿Dónde sientes tensión? | Da más peso a esas zonas al elegir la rutina |
| ¿Cada cuánto? (30, 45, 60 o 90 min) | Intervalo del recordatorio |
| ¿Cuánto debe durar? (1, 3 o 5 min) | Número de estiramientos por pausa: 2, 4 o 6 |

Para elegir la rutina, cada estiramiento posible recibe un peso: más si trabaja una zona con tensión, menos si no es discreto en una oficina y mucho menos si salió en la pausa anterior. Luego se sortean según esos pesos. Así hay variedad sin perder el foco.

## 5. Seguridad del contenido

- Todos los estiramientos son suaves, sin rebotes ni posturas de fuerza, y se pueden hacer con ropa de oficina.
- Los que tienen alguna contraindicación común incluyen una advertencia, como la flexión hacia adelante con mareos o hernia lumbar.
- El aviso inicial pide consultar a un profesional si hay lesión, dolor fuerte u hormigueo.
- **Pendiente recomendado:** que una persona fisioterapeuta revise el catálogo antes de la versión 1.0.

## 6. Nombre

La app se llamó **Estira** hasta la v0.5 (una invitación: "¡estira!"). Desde la v0.6.0 se llama **Reed**, en honor a Reed Richards, el personaje que se estira. Es corto, se pronuncia igual en inglés y español y no lleva tildes. El repositorio y el identificador interno (`org.estira.desktop`) se mantienen para no perder las actualizaciones ni el historial guardado.

Otras opciones que se consideraron: *Pausa Activa* (el término que se usa en Colombia y México para estas pausas en el trabajo), *Desentume* o *Respiro*.

## 7. Próximos pasos

| Prioridad | Mejora | Por qué |
|---|---|---|
| Alta | Revisión del catálogo por fisioterapia | Confianza en el contenido |
| Alta | Firmar el instalador (por ejemplo, con SignPath, gratis para proyectos libres) | Evita el aviso de SmartScreen |
| Hecho (v0.3.0) | Detectar inactividad, llamadas y pantalla completa; actualizaciones automáticas | Menos interrupciones y versiones al día |
| Media | Horario laboral (no recordar de noche ni el fin de semana) | Menos interrupciones innecesarias |
| Media | Versión en inglés | Más alcance en GitHub |
| Baja | Historial semanal | Motivación |
| Hecho (v0.6.0) | Versión para Mac (Linux pendiente) | En Mac aún falta detectar llamadas y pantalla completa |
