# Estira

**English** · [Español](README.es.md)

Estira is a free, open-source desktop app that reminds you to take breaks while you work at the computer. Each break guides you through short, animated stretches.

It is not a workout app. It helps people who spend all day in front of a screen move a little every so often, to prevent neck, back and wrist discomfort.

## Features

- **Setup questionnaire.** Asks how much space you have, whether you can use the floor, what you have at hand (sturdy chair, desk, wall, towel, ball) and where you feel tension. It uses your answers to pick the stretches you can do.
- **Reminders.** Every 30, 45, 60 or 90 minutes the window pops up on top with a soft chime. You can start, snooze for 10 minutes or skip that break.
- **Guided breaks.** 2 to 6 animated stretches with steps and a countdown. Stretches done on both sides repeat with the animation mirrored.
- **29 stretches** for the neck, shoulders, upper and lower back, wrists, hips and legs, and eyes (20-20-20 rule).
- **Discreet mode.** If you work in a shared office, it favors stretches that don't draw attention.
- **System tray.** Closing the window keeps Estira in the tray. It can start automatically with Windows.
- **English and Spanish.** Uses your Windows language (English unless it is Spanish), and you can change it in Settings.
- **Lightweight.** It uses the WebView2 runtime that comes with Windows, so the installer is about 1 MB.

The animations are not images or videos: a figure is drawn in code from joint angles (see [`src/figure.js`](src/figure.js)).

## Install

1. Download the installer from the [latest release](https://github.com/Verlezza/estira/releases/latest): the file `Estira_x.y.z_x64-setup.exe`.
2. Open it. It installs for your user only and doesn't need administrator rights.

Windows may show "Windows protected your PC" because the installer isn't signed yet. Click **More info → Run anyway**.

## Development

You need:

- [Node.js](https://nodejs.org/) 20 or newer
- [Rust](https://rustup.rs/)
- Visual Studio Build Tools with "Desktop development with C++"

```bash
npm install
npm run dev     # opens the app in development mode
npm run build   # builds the installer in src-tauri/target/release/bundle/nsis/
npm test        # checks the stretch catalog and translations
```

To work only on the interface you don't need Rust: serve the `src` folder with any static server (for example `python -m http.server -d src`) and open it in the browser. Without Tauri the window won't come to the front and there's no tray, but everything else works.

### Publishing a version

1. Update the version in `package.json`, `src-tauri/Cargo.toml` and `src-tauri/tauri.conf.json`.
2. Create and push a tag: `git tag v0.3.0 && git push --tags`.
3. GitHub Actions builds the installer and publishes it in Releases.

## Project structure

```
src/                 Interface (plain HTML, CSS and JavaScript, no frameworks)
  app.js             Questionnaire, timer, breaks, catalog and settings
  exercises.js       Stretch catalog (Spanish source)
  i18n.js            Spanish and English texts, language detection
  figure.js          Animated figure engine
src-tauri/           Desktop shell (Rust): tray, autostart, installer
tests/               Automatic catalog check (npm test)
docs/ESTUDIO.md      Research and project decisions (in Spanish)
```

The code comments and project docs are in Spanish.

## Adding a stretch

Add an object to `EXERCISES` in [`src/exercises.js`](src/exercises.js) and its translation to `EXERCISES_EN` in [`src/i18n.js`](src/i18n.js). The fields are described at the top of the file. The animation is a list of poses: each pose only changes the angles that move relative to the base scene (`sit-front`, `sit-side`, `stand-front`, `stand-side` or `floor-side`). The angle convention is described at the top of [`src/figure.js`](src/figure.js).

To check the result, run `npm test`, open the app, go to **See stretches** and tap yours.

A new stretch should be gentle, safe for most people and doable in office clothes.

## Disclaimer

Estira does not give medical advice. If you have an injury, strong pain, tingling or a medical condition, check with a health professional before stretching.

## License

[MIT](LICENSE)
