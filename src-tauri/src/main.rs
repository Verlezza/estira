// Sin consola en Windows al compilar en modo release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, State, WebviewUrl, WebviewWindowBuilder, WindowEvent, Wry,
};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_updater::UpdaterExt;

fn show(app: &AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.unminimize();
        let _ = w.set_focus();
    }
}

// ---------- Estado del sistema ----------

#[derive(serde::Serialize)]
struct Status {
    /// Segundos sin usar el mouse ni el teclado (incluye la pantalla bloqueada).
    idle: u64,
    /// En llamada (micrófono o cámara en uso), en pantalla completa o presentando.
    busy: bool,
}

#[tauri::command]
fn status() -> Status {
    Status { idle: win::idle_secs(), busy: win::fullscreen() || win::in_use("microphone") || win::in_use("webcam") }
}

#[cfg(windows)]
mod win {
    use windows_sys::Win32::Foundation::{CloseHandle, INVALID_HANDLE_VALUE};
    use windows_sys::Win32::System::Diagnostics::ToolHelp::{CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W, TH32CS_SNAPPROCESS};
    use windows_sys::Win32::System::SystemInformation::GetTickCount;
    use windows_sys::Win32::System::Threading::{OpenProcess, QueryFullProcessImageNameW, PROCESS_QUERY_LIMITED_INFORMATION};
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::{GetLastInputInfo, LASTINPUTINFO};
    use windows_sys::Win32::UI::Shell::{SHQueryUserNotificationState, QUNS_BUSY, QUNS_PRESENTATION_MODE, QUNS_RUNNING_D3D_FULL_SCREEN};
    use winreg::{enums::HKEY_CURRENT_USER, RegKey};

    pub fn idle_secs() -> u64 {
        let mut li = LASTINPUTINFO { cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32, dwTime: 0 };
        // SAFETY: li es una estructura válida con cbSize correcto.
        if unsafe { GetLastInputInfo(&mut li) } == 0 {
            return 0;
        }
        (unsafe { GetTickCount() }.wrapping_sub(li.dwTime) / 1000) as u64
    }

    /// Windows indica si hay una app en pantalla completa o una presentación.
    pub fn fullscreen() -> bool {
        let mut state = 0;
        // SAFETY: state es un entero válido donde Windows escribe el resultado.
        let ok = unsafe { SHQueryUserNotificationState(&mut state) } == 0;
        ok && matches!(state, QUNS_BUSY | QUNS_RUNNING_D3D_FULL_SCREEN | QUNS_PRESENTATION_MODE)
    }

    /// Rutas completas (en minúsculas) de los programas que están corriendo.
    fn running_exes() -> Vec<String> {
        let mut out = Vec::new();
        // SAFETY: se usan las APIs de Windows con estructuras inicializadas y se cierran los handles abiertos.
        unsafe {
            let snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
            if snap == INVALID_HANDLE_VALUE {
                return out;
            }
            let mut e: PROCESSENTRY32W = std::mem::zeroed();
            e.dwSize = std::mem::size_of::<PROCESSENTRY32W>() as u32;
            let mut ok = Process32FirstW(snap, &mut e);
            while ok != 0 {
                let h = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, e.th32ProcessID);
                if !h.is_null() {
                    let mut buf = [0u16; 1024];
                    let mut len = buf.len() as u32;
                    if QueryFullProcessImageNameW(h, 0, buf.as_mut_ptr(), &mut len) != 0 {
                        out.push(String::from_utf16_lossy(&buf[..len as usize]).to_lowercase());
                    }
                    CloseHandle(h);
                }
                ok = Process32NextW(snap, &mut e);
            }
            CloseHandle(snap);
        }
        out
    }

    /// Windows registra qué apps usan el micrófono o la cámara; LastUsedTimeStop = 0 significa "en uso ahora".
    /// Ese registro a veces queda marcado aunque la app ya cerró, así que en las apps clásicas
    /// también se comprueba que el programa siga corriendo.
    pub fn in_use(device: &str) -> bool {
        let path = format!(r"Software\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\{device}");
        let Ok(root) = RegKey::predef(HKEY_CURRENT_USER).open_subkey(path) else { return false };
        let active = |k: &RegKey| {
            k.get_value::<u64, _>("LastUsedTimeStop").is_ok_and(|v| v == 0)
                && k.get_value::<u64, _>("LastUsedTimeStart").is_ok_and(|v| v != 0)
        };
        root.enum_keys().flatten().any(|name| {
            let Ok(k) = root.open_subkey(&name) else { return false };
            // Las apps clásicas (Zoom, navegadores) están dentro de NonPackaged.
            if name == "NonPackaged" {
                let running = running_exes();
                k.enum_keys().flatten().any(|n| {
                    running.contains(&n.replace('#', "\\").to_lowercase()) && k.open_subkey(&n).is_ok_and(|c| active(&c))
                })
            } else {
                active(&k)
            }
        })
    }
}

#[cfg(not(windows))]
mod win {
    pub fn idle_secs() -> u64 { 0 }
    pub fn fullscreen() -> bool { false }
    pub fn in_use(_: &str) -> bool { false }
}

// ---------- Actualizaciones ----------

/// Devuelve la versión nueva si hay una publicada en GitHub.
#[tauri::command]
async fn check_update(app: AppHandle) -> Option<String> {
    app.updater().ok()?.check().await.ok()?.map(|u| u.version)
}

/// Descarga e instala la versión nueva; el instalador cierra y vuelve a abrir Estira.
#[tauri::command]
async fn install_update(app: AppHandle) -> Result<(), String> {
    let update = app.updater().map_err(|e| e.to_string())?.check().await.map_err(|e| e.to_string())?;
    if let Some(u) = update {
        u.download_and_install(|_, _| {}, || {}).await.map_err(|e| e.to_string())?;
        app.restart();
    }
    Ok(())
}

// ---------- Aviso discreto ----------

/// Muestra u oculta el aviso pequeño de la esquina. Se usa cuando estás en una llamada,
/// jugando o en pantalla completa: queda encima de todo pero no te quita el foco.
/// Es async a propósito: en Windows, crear ventanas desde un comando síncrono puede bloquear la app.
#[tauri::command]
async fn nudge(app: AppHandle, show: bool) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("nudge") {
        let _ = w.close();
    }
    if !show {
        return Ok(());
    }
    let (w, h, margin) = (360.0, 112.0, 16.0);
    let mut builder = WebviewWindowBuilder::new(&app, "nudge", WebviewUrl::App("nudge.html".into()))
        .title("Estira")
        .inner_size(w, h)
        .decorations(false)
        .resizable(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .focused(false)
        .visible(false);
    // Esquina inferior derecha del monitor principal, sobre la barra de tareas.
    if let Ok(Some(m)) = app.primary_monitor() {
        let (area, scale) = (m.work_area(), m.scale_factor());
        let x = (area.position.x as f64 + area.size.width as f64) / scale - w - margin;
        let y = (area.position.y as f64 + area.size.height as f64) / scale - h - margin;
        builder = builder.position(x, y);
    }
    let win = builder.build().map_err(|e| e.to_string())?;
    show_without_focus(&win);
    Ok(())
}

/// Muestra la ventana sin activarla, como las notificaciones de Windows: no te saca del juego ni de lo que escribes.
#[cfg(windows)]
fn show_without_focus(win: &tauri::WebviewWindow) {
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        GetWindowLongPtrW, SetWindowLongPtrW, SetWindowPos, ShowWindow, GWL_EXSTYLE, HWND_TOPMOST, SWP_NOACTIVATE, SWP_NOMOVE,
        SWP_NOSIZE, SW_SHOWNOACTIVATE, WS_EX_NOACTIVATE, WS_EX_TOOLWINDOW,
    };
    let Ok(h) = win.hwnd() else { return };
    let hwnd = h.0 as _;
    // SAFETY: hwnd es la ventana recién creada por Tauri y sigue viva durante estas llamadas.
    unsafe {
        let ex = GetWindowLongPtrW(hwnd, GWL_EXSTYLE);
        SetWindowLongPtrW(hwnd, GWL_EXSTYLE, ex | (WS_EX_NOACTIVATE | WS_EX_TOOLWINDOW) as isize);
        ShowWindow(hwnd, SW_SHOWNOACTIVATE);
        SetWindowPos(hwnd, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOACTIVATE | SWP_NOMOVE | SWP_NOSIZE);
    }
}

#[cfg(not(windows))]
fn show_without_focus(win: &tauri::WebviewWindow) {
    let _ = win.show();
}

/// Botones del aviso: "now" abre la pausa, "later" pospone y "close" solo lo cierra.
#[tauri::command]
fn nudge_action(app: AppHandle, action: String) {
    if let Some(w) = app.get_webview_window("nudge") {
        let _ = w.close();
    }
    if action == "now" {
        show(&app);
    }
    let _ = app.emit_to("main", "nudge-action", action);
}

// ---------- Bandeja ----------

struct Tray(MenuItem<Wry>, MenuItem<Wry>, MenuItem<Wry>);

/// La interfaz envía los textos del menú en el idioma elegido.
#[tauri::command]
fn tray_labels(tray: State<Tray>, open: String, now: String, quit: String) {
    let _ = tray.0.set_text(open);
    let _ = tray.1.set_text(now);
    let _ = tray.2.set_text(quit);
}

fn main() {
    tauri::Builder::default()
        // Una sola instancia: abrir Estira otra vez solo muestra la ventana.
        .plugin(tauri_plugin_single_instance::init(|app, _, _| show(app)))
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec!["--minimized"])))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![status, check_update, install_update, tray_labels, nudge, nudge_action])
        .setup(|app| {
            let open = MenuItem::with_id(app, "open", "Open Estira", true, None::<&str>)?;
            let now = MenuItem::with_id(app, "now", "Stretch now", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open, &now, &quit])?;
            app.manage(Tray(open, now, quit));
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
            // Para probar el aviso pequeño sin estar en una llamada: estira.exe --test-nudge (aparece a los 8 s).
            if std::env::args().any(|a| a == "--test-nudge") {
                let h = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    std::thread::sleep(std::time::Duration::from_secs(8));
                    let _ = nudge(h, true).await;
                });
            }
            Ok(())
        })
        // Cerrar la ventana la esconde en la bandeja; los recordatorios siguen corriendo.
        .on_window_event(|w, e| {
            if let (WindowEvent::CloseRequested { api, .. }, "main") = (e, w.label()) {
                api.prevent_close();
                let _ = w.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("no se pudo iniciar Estira");
}

#[cfg(test)]
mod tests {
    // Uso: cargo test -- --nocapture (muestra lo que Windows reporta en este momento).
    #[test]
    fn system_status_responds() {
        let s = super::status();
        println!("idle={}s busy={} mic={} cam={}", s.idle, s.busy, super::win::in_use("microphone"), super::win::in_use("webcam"));
        assert!(s.idle < 365 * 24 * 3600, "tiempo inactivo fuera de rango");
    }
}
