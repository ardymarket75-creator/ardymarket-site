# Eri's LingoLab — v2.0.0-alfa → v2.0.1-alfa

Archivos modificados: `eris-lab.html`, `js/engine-v2.js`, `js/spaced-repetition.js`, `supabase-config.js`

**Antes de reemplazar:** `git tag pre-v2.0.1 && git push --tags`

---

## Corregido

### 1. Corte del audio en el primer play — `engine-v2.js`
El `setTimeout` que cortaba el segmento arrancaba al llamar `play()`, no cuando el
audio empezaba a sonar. En el primer play todavía faltaba cargar metadatos, hacer
seek y bufferizar — tiempo real que el timer ya estaba quemando.

Ahora el timer se ancla al evento `playing`, con `timeupdate` como red de seguridad.
También se corrigió el margen anti-sangrado: los 70 ms se restaban después de dividir
por la velocidad, así que a 2× recortaba 140 ms de contenido real.

### 2. Zona horaria — `spaced-repetition.js`
`hoy()` usaba `toISOString()`, que devuelve UTC. En Bogotá (UTC−5) el "día" cambiaba
a las 7:00 PM: el contador de reps se reiniciaba a media tarde, el guard de una
estrella por día se rompía a las 19:01, y `proximaFecha()` agendaba 2 días en vez de 1.
Todas las fechas se construyen ahora en hora local.

### 3. Perfil de la nube destruido en dispositivos nuevos — `eris-lab.html`
`if (esPrimeraVez)` → `if (primeraVezReal)`. Un alumno con perfil que entraba desde
otro dispositivo cargaba bien el perfil y acto seguido se le pisaban los idiomas con
el default. Se agregó `persistirPreferencias()` tras cargar de la nube, para que la
siguiente recarga ya no entre por la rama de "primera vez".

### 4. `guardarPerfilNube()` subía los idiomas viejos — `eris-lab.html`
Se llamaba antes de asignar `pareja`. El perfil en Supabase iba con un guardado de
retraso. Movido después de la asignación.

### 5. Race condition en el primer play — `eris-lab.html`
`secuenciaEnCurso` se leía antes del `await audiosProntos` pero se escribía después.
Dos invocaciones podían colarse y encimar audios. El guard se toma ahora antes de
cualquier await, dentro de un `try/finally`.

### 6. `playPhrase()` no esperaba las URLs firmadas — `eris-lab.html`
Tocar el play de un bloque antes de que Supabase respondiera daba TTS robótico en
vez de la grabación real, sin aviso.

### 7. `playPhrase()` y `toggleAudio()` compartían el objeto Audio — `eris-lab.html`
`audioCache` reutiliza una instancia por URL; los seeks se pisaban. Ambos usan ahora
el mismo guard.

### 8. La rama `'archivo'` podía colgar la app — `engine-v2.js`
Solo resolvía con `onended`. Si el MP3 fallaba, la promesa quedaba pendiente para
siempre y `secuenciaEnCurso` nunca volvía a `false`. Ahora resuelve con `onerror` y
timeout de seguridad. **Relevante: esta rama pasa a ser la principal al migrar a
audios individuales.**

### 9. El materno contabilizaba repeticiones — `eris-lab.html`
`playPhrase()` subía `p.reps` también para el idioma base, contradiciendo
`incrementarEstrella()` y ensuciando la tabla `progreso` con filas invisibles.

### 10. Faltaba `btn-blur-obj` — `eris-lab.html`
El botón de ocultar/revelar texto solo existía en el bloque materno. Agregado al
bloque objetivo, que es donde tiene sentido pedagógico.

### 11. Referencias colgantes en el engine — `engine-v2.js`
`_audioActual` y `_resolverActual` no se limpiaban al completar normalmente.

### 12. Tabla equivocada en el test de conexión — `supabase-config.js`
`profiles` → `perfiles_lab`.

---

## NO incluido (pendiente de decisión)

- **`lastRepDate` / `lastStarDate` sin sincronizar.** Requiere columnas nuevas en la
  tabla `progreso`. Mientras no esté, las reps del día y el date-gating de estrellas
  siguen siendo por dispositivo.
- **No se puede desmarcar una frase "dominada".** Es un cambio de comportamiento,
  no un bug fix — lo dejo para que lo decidas.
- **Caché de URLs firmadas en `sessionStorage`.** Hoy cada recarga genera una URL
  nueva → cache-miss del navegador → se re-descargan los ~5 MB completos.
- **`traducirPalabraAuto()` contra el endpoint no documentado de Google Translate.**

---

## Smoke test

1. Consola muestra `v2.0.1-alfa`.
2. **Primer play sin recargar caché** (Ctrl+Shift+R): la primera frase suena completa.
3. Cambiar velocidad a 2× y a 0.5×: los cortes siguen alineados.
4. Play / pausa / play rápido tres veces: nunca dos audios encimados.
5. Tocar el play de un bloque en cuanto carga la página: debe sonar la grabación
   real, no TTS.
6. Marcar una frase como dominada después de las 7 PM: el repaso debe quedar
   agendado para **mañana**, no pasado mañana.
7. Hacer 5 reps antes de las 7 PM y volver a las 8 PM: el contador debe seguir en 5/5.
8. Abrir en modo incógnito con la sesión iniciada: deben aparecer **tus** idiomas,
   no hebreo+inglés por defecto.
9. El bloque objetivo ahora tiene botón "Texto" para ocultar/revelar.
