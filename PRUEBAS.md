# PRUEBAS.md — Checklist de humo (2 minutos)

Correr SIEMPRE después de cada cambio, en este orden, en `http://localhost:8000`
(con DevTools abierto y "Disable cache" marcado).

## 0. Versión
- [ ] La esquina inferior derecha de Eri's Lab muestra la versión esperada
- [ ] La consola imprime "Eri's LingoLab vX.X.X" en azul

## 1. Consola limpia
- [ ] Cmd+Option+J → cero errores rojos al cargar Eri's Lab

## 2. Onboarding (solo si el cambio toca perfil/idiomas)
- [ ] Consola: `localStorage.clear()` → recargar
- [ ] Aparece el modal obligatorio: nombre + materno detectado + HEB, ENG por defecto
- [ ] No se puede cerrar sin completar

## 3. Player
- [ ] Play → suena materno → objetivo, contador sube en vivo (1/5, 2/5…)
- [ ] Pausa y play → retoma sin audios encimados
- [ ] Frase 1→2 de español: no se cuela el arranque de la siguiente

## 4. Idiomas
- [ ] Chips 🇮🇱 HEB / 🇺🇸 ENG visibles, hover muestra el nombre completo
- [ ] Clic en un chip salta a ese idioma
- [ ] El bloque hebreo muestra texto (no "sin datos")
- [ ] Botón nikud visible solo cuando el bloque en pantalla es hebreo

## 5. Navegación
- [ ] 🏠 arriba-izquierda lleva a Lingo Lab
- [ ] "Log out" está dentro de Mi configuración y cierra sesión

## 6. Persistencia (solo si el cambio toca progreso/Supabase)
- [ ] Reproducir 2 frases → recargar → el progreso sigue ahí

---
**Si algo falla:** anotar QUÉ paso falló y QUÉ dice la consola, antes de tocar nada.
**Si todo pasa:** sellar si es hito → `git tag vX.X.X && git push --tags`
