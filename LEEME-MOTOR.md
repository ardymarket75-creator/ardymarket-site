# El Motor ArdyMarket — regla de oro: se referencia, nunca se copia

## Estructura en el repo ardymarket-site

```
ardymarket-site/
├── engine/                        ← EL MOTOR (única copia en todo el ecosistema)
│   ├── audio-engine.js            AudioEngine v3 (cascada archivo→segmento→tts)
│   ├── spaced-repetition.js       v2.1 (+repasosPendientesRaw para IDs no numéricos)
│   └── texto-interactivo.js       v1 NUEVO (hover-glosa, interlineado, audio por palabra)
├── betmidrash/
│   ├── index.html                 El edificio · 10 salas
│   ├── beit-hatefila.html         Shajarit funcionando (consumidor del motor)
│   └── data/
│       ├── diccionario-he.json    Diccionario canónico (IDs he-NNNNNN)
│       ├── shajarit-edot-hamizrach.json   El rezo = composición por referencias
│       ├── textos/modeh-ani.json
│       └── tanaj/tehilim-113.json  Tehilim viven en el Tanaj; el rezo los referencia
└── hardyglot/ ...                 (existente — migrar sus <script src="js/engine-v2.js">
                                    a <script src="/engine/audio-engine.js"> cuando sea cómodo)
```

## Cómo probar (local)
1. Copia `engine/` y `betmidrash/` a la raíz de tu repo ardymarket-site.
2. Abre con Live Server de VS Code (fetch de JSON no funciona con file://).
3. Entra a betmidrash/index.html → Beit HaTefilá.
   - Hover sobre palabra = glosa · click = pronunciación (TTS he-IL)
   - "Mostrar traducciones" = interlineado
   - Frases ★ matriz → "Dominada" → Fibonacci del motor
   - Frases no-matriz → "Agregar a mi repaso" (caso Sofer)
   - Comentarios: 📜 jajam / 💡 aclaración moderna

## Migración de Hardyglot al motor (fast-follow, sin prisa)
En eris-lab.html cambiar:
  <script src="js/engine-v2.js">        → <script src="/engine/audio-engine.js">
  <script src="js/spaced-repetition.js"> → <script src="/engine/spaced-repetition.js">
Borrar las copias locales SOLO después de verificar. Desde ese momento,
un fix en /engine/ llega a todos los productos a la vez.

## Hosting (decisión registrada)
- GitHub = repo (siempre). GitHub Pages = hosting actual (suficiente).
- Al escalar: hosting → Cloudflare Pages (mismo repo, cero cambios de código,
  ancho de banda ilimitado, convive con R2 para audio).
