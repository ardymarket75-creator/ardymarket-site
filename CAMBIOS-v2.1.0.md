# Eri's LingoLab — v2.0.1 → v2.1.0

Archivos: `eris-lab.html`, `js/spaced-repetition.js`, `MIGRACION-v2.1.0.sql`
(`engine-v2.js` y `supabase-config.js` no cambian respecto a v2.0.1)

**Orden de despliegue:**
1. `git tag pre-v2.1.0 && git push --tags`
2. Correr `MIGRACION-v2.1.0.sql` en el editor SQL de Supabase
3. Subir los archivos

Si subís el HTML antes de la migración, el guardado va a fallar: el código
escribe columnas que todavía no existen.

---

## El ciclo de vida

    ESTUDIO ──35 reps (7 días) o botón "A repaso"──> REPASO ──día 21 superado──> GRADUADA
       ^                                              │
       └──────────── fallo o botón "↺ A estudio" ──────┘

**Estudio** · 5 reps/día. El contador muestra "Día 1" … "Día 7".

**Repaso** · el alumno escribe la frase. Los días 1, 2 y 3 de Fibonacci son
consecutivos, así que los tres aciertos seguidos *son* los tres primeros
escalones — `nivel_repaso` hace de contador de aciertos, no hay campo aparte.
El contador muestra "Día 1, 2, 3, 5, 8, 13, 21".

**Graduada** · superó el día 21 y sale del ciclo activo.

---

## Cambios

### Materno suena una sola vez
`getConfigIdioma()` creaba `reps: 5` para todo idioma y el materno heredaba ese
valor. Ahora `sincronizarEngine()` lo fija en 1. No se arregla en
`getConfigIdioma` porque un idioma puede ser materno en una sesión y objetivo
en otra: la config es compartida.

### Estrellas → contador de días
Las 5 estrellas se reemplazan por una insignia "Día N", con color distinto
según el modo (neutro en estudio, naranja en repaso, azul cuando gradúa).

### Motor de repaso
Al dar play en una frase que está en repaso, no corre el shadowing: arranca la
producción. Materno 1× → 1,5 s de pausa para decirlo en voz alta → objetivo 1×
→ el alumno escribe → se valida → se revela el original. Al cambiar de frase el
panel se cierra y el texto vuelve a ocultarse.

### Validación escrita
Ignora mayúsculas, puntuación, tildes y nikud. Tolera hasta un 10% de distancia
de edición (mínimo 1 carácter) para no castigar un dedazo.

Calibración medida sobre tus frases:

| Caso | Resultado |
|---|---|
| Idéntico | ✅ |
| Sin mayúsculas | ✅ |
| Dedazo ("dya" por "day") | ✅ dist=2 |
| Palabra cambiada ("the" por "a") | ❌ dist=3 |
| Sin tilde ("dia" por "día") | ✅ |
| Hebreo escrito sin nikud | ✅ |

El margen entre un dedazo y una palabra cambiada es de un solo punto de
distancia. Si en las pruebas te parece muy estricto o muy permisivo, el 10%
está en `evaluarRespuesta()`.

### Botón del bloque
"¡Ya!" pasa a ser un interruptor: **"A repaso"** cuando la frase está en
estudio, **"↺ A estudio"** cuando está en repaso.

### Sincronización completa con Supabase
Antes se subían solo `reps`, `stars` y `dominada`. Faltaban las fechas, así que
al cambiar de dispositivo el alumno perdía las reps del día y el límite de un
día por jornada dejaba de funcionar. Ahora suben los siete campos del ciclo.

---

## Una decisión que quiero que revises

`DIAS_REESTUDIO_TRAS_FALLO = 3` en `spaced-repetition.js`.

Dijiste que al fallar la frase vuelve a estudio. La pregunta es *cuánto* vuelve.
Puse 3 días de reestudio en lugar de los 7 completos: fallar en el día 21 y
tener que rehacer las 35 repeticiones desde cero me parece desproporcionado —
el alumno **sí** sabía la frase, la falló una vez.

Si querés el reset total, poné 7. Es una línea.

---

## Cosas que decidí sin preguntarte

**Faltar un día no rompe la racha.** Si la frase vence el día 2 y el alumno no
abre la app, queda pendiente hasta que entre. Solo un error rompe la racha, no
un día perdido. Interpreté "tres veces consecutivas" como tres producciones
correctas seguidas, no tres días de calendario seguidos.

**Después del día 21 la frase gradúa y deja de agendarse.** Antes el nivel se
topaba en 21 y la frase reaparecía cada 21 días para siempre. Si preferís que
siga circulando, quitá la rama `graduada` en `repasoAcierto()`.

---

## Pendiente para la próxima

Modo coach. Necesita `rol` en `perfiles_lab`, tabla `coach_alumnos`, y una
política RLS que deje al coach leer el progreso de sus alumnos. **La columna
`rol` no puede ser escribible por el cliente** — si lo es, cualquier alumno se
pone coach desde la consola del navegador y lee los datos de los demás.

---

## Smoke test

1. Consola muestra `v2.1.0-alfa`.
2. Play: el materno suena **una** vez, el objetivo 5.
3. El contador dice "Día N", no estrellas.
4. Botón "A repaso" en una frase → el contador pasa a naranja "Día 1" y el
   texto del objetivo se oculta.
5. Play en esa frase → materno → pausa → objetivo → aparece el campo de texto.
6. Escribir bien → ✅ y fecha del próximo control. Escribir mal → vuelve a
   estudio y muestra la frase esperada.
7. Cambiar de frase con el panel abierto: se cierra y el texto vuelve a ocultarse.
8. Recargar: el modo y el contador se conservan.
9. Entrar desde otro dispositivo: el progreso llega igual (esto antes fallaba).
