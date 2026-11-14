// Aviso pequeño de la esquina (ver nudge.html).
for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
for (const el of document.querySelectorAll('[data-i18n-label]')) el.setAttribute('aria-label', t(el.dataset.i18nLabel));
animateExercise(document.getElementById('fig'), EXERCISES.find(e => e.id === 'brazos-techo'));
const act = action => window.__TAURI__?.core.invoke('nudge_action', { action });
for (const b of document.querySelectorAll('[data-action]')) b.onclick = () => act(b.dataset.action);
// Se cierra solo a los 25 s, salvo que tengas el mouse encima.
let timer = setTimeout(() => act('close'), 25000);
document.body.onmouseenter = () => clearTimeout(timer);
document.body.onmouseleave = () => { timer = setTimeout(() => act('close'), 8000); };
