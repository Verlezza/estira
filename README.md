# Reed

**English** · [Español](README.es.md)

Reed is a free, open-source app for Windows and Mac that reminds you to take breaks while you work at the computer. Each break guides you through short, illustrated stretches.

It is not a workout app. It helps people who spend all day in front of a screen move a little every so often, to prevent neck, back and wrist discomfort.

## Features

- **Setup questionnaire.** Asks how much space you have, whether you can use the floor, what you have at hand (sturdy chair, desk, wall, towel, ball) and where you feel tension. It uses your answers to pick the stretches you can do.
- **Reminders.** Every 30, 45, 60 or 90 minutes the window pops up on top with a soft chime. You can start, snooze for 10 minutes or skip that break.
- **Guided breaks.** 2 to 6 stretches with steps and a countdown, with 5 seconds before each one to get into position. Each illustration shows the start pose faded, the end pose solid, an arrow with the movement and, in orange, the area being stretched. It also says whether to hold the position or repeat the movement. Stretches done on both sides are mirrored.
- **Variety and order.** If you have room, each break mixes seated and standing stretches, but groups them so you change position as little as possible: seated first, then standing (those that use the same support together) and floor stretches last.
- **Summary.** A screen with your breaks done, on-time rate, skipped and snoozed breaks, stretches done and not done, screen time, time away, your streak and a chart per day (today, 7 or 30 days). Everything stays on your computer.
- **36 stretches** for the neck, shoulders, upper and lower back, wrists, hips and legs, and eyes (20-20-20 rule).
- **Discreet mode.** If you work in a shared office, it favors stretches that don't draw attention.
- **Knows when you're away or busy.** If you haven't touched the mouse or keyboard for 5 minutes (or the screen is locked), the countdown restarts: you already moved. During a call (microphone or camera in use), while gaming in full screen or presenting, it doesn't open the window: a small, discreet notice slides into the corner, stays on top without taking focus and closes itself after 25 seconds. It repeats every 15 minutes while you're busy. To preview it, run `Reed.exe --test-nudge`. On Mac it detects when you're away, but not calls or full screen yet.
- **Automatic updates.** When a new version is published, Reed offers to install it.
- **System tray.** Closing the window keeps Reed in the tray. It can start automatically when you log in.
- **English and Spanish.** Uses your system language (English unless it is Spanish), and you can change it in Settings.
- **Lightweight.** It uses the web view built into Windows (WebView2) and macOS, so the installer is only a few MB.

The illustrations are not image files: a figure is drawn in code from joint angles (see [`src/figure.js`](src/figure.js)).

## Install

Download it from the [latest release](https://github.com/Verlezza/estira/releases/latest).

**Windows**

1. Download `Reed_x.y.z_x64-setup.exe` and open it. It installs for your user only and doesn't need administrator rights.
2. Windows may show "Windows protected your PC" because the installer isn't signed yet. Click **More info → Run anyway**.

**Mac** (macOS 10.15 or newer, Apple Silicon or Intel)

1. Download `Reed_x.y.z_universal.dmg`, open it and drag Reed to Applications.
2. The first time, macOS says it can't verify the app because it isn't notarized by Apple. Go to **System Settings → Privacy & Security** and click **Open Anyway**.

If you used Estira (the previous name, up to v0.5), close it from the tray and uninstall it before installing Reed, leaving "delete app data" unchecked: Reed keeps your history.

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
3. GitHub Actions builds and signs the installer, publishes it in Releases and generates `latest.json`, which installed copies use to update themselves.

The updates are signed. The repository needs the secret `TAURI_SIGNING_PRIVATE_KEY` (Settings → Secrets and variables → Actions) with the private key created by `npx tauri signer generate`. If the key has a password, also add `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. The matching public key is in `src-tauri/tauri.conf.json`. Never commit the private key, and don't lose it: without it, installed copies can't receive updates.

## Project structure

```
src/                 Interface (plain HTML, CSS and JavaScript, no frameworks)
  app.js             Questionnaire, timer, breaks, catalog and settings
  exercises.js       Stretch catalog (Spanish source)
  i18n.js            Spanish and English texts, language detection
  figure.js          Illustrated figure engine
src-tauri/           Desktop shell (Rust): tray, autostart, installer
tests/               Automatic catalog check (npm test)
docs/ESTUDIO.md      Research and project decisions (in Spanish)
```

The code comments and project docs are in Spanish.

## Adding a stretch

Add an object to `EXERCISES` in [`src/exercises.js`](src/exercises.js) and its translation to `EXERCISES_EN` in [`src/i18n.js`](src/i18n.js). The fields are described at the top of the file. The illustration comes from a list of poses (the first and last are drawn, or the two most different ones for repeated movements), and `target` names the area to paint: each pose only changes the angles that move relative to the base scene (`sit-front`, `sit-side`, `stand-front`, `stand-side` or `floor-side`). The angle convention is described at the top of [`src/figure.js`](src/figure.js).

To check the result, run `npm test`, open the app, go to **See stretches** and tap yours.

A new stretch should be gentle, safe for most people and doable in office clothes.

## Disclaimer

Reed does not give medical advice. If you have an injury, strong pain, tingling or a medical condition, check with a health professional before stretching.

## License

[MIT](LICENSE)
