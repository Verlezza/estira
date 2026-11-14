// Sin consola en Windows al compilar en modo release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, WindowEvent,
};
use tauri_plugin_autostart::MacosLauncher;

fn show(app: &AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.unminimize();
        let _ = w.set_focus();
    }
}

fn main() {
    tauri::Builder::default()
        // Una sola instancia: abrir Estira otra vez solo muestra la ventana.
        .plugin(tauri_plugin_single_instance::init(|app, _, _| show(app)))
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec!["--minimized"])))
        .setup(|app| {
            let open = MenuItem::with_id(app, "open", "Abrir Estira", true, None::<&str>)?;
            let now = MenuItem::with_id(app, "now", "Estirar ahora", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Salir", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open, &now, &quit])?;
            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Estira")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, e| match e.id.as_ref() {
                    "open" => show(app),
                    "now" => {
                        show(app);
                        let _ = app.emit("stretch-now", ());
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, e| {
                    if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = e {
                        show(tray.app_handle());
                    }
                })
                .build(app)?;
            // Al arrancar con Windows se queda en la bandeja; abierto a mano, se muestra.
            if !std::env::args().any(|a| a == "--minimized") {
                show(app.handle());
            }
            Ok(())
        })
        // Cerrar la ventana la esconde en la bandeja; los recordatorios siguen corriendo.
        .on_window_event(|w, e| {
            if let WindowEvent::CloseRequested { api, .. } = e {
                api.prevent_close();
                let _ = w.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("no se pudo iniciar Estira");
}
