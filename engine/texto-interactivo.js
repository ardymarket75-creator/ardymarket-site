/* ============================================================
   TextoInteractivo v1 — Motor ArdyMarket
   ------------------------------------------------------------
   Módulo GENÉRICO del motor (sirve a Bet Midrash, Hardyglot y
   futuros módulos). Renderiza texto palabra-por-palabra donde
   cada palabra:
     - muestra su glosa (traducción) al hacer hover
     - reproduce su pronunciación al hacer click
     - puede mostrar la glosa fija debajo (modo interlineado)

   Modelo de datos (decisiones de arquitectura Bet Midrash):
     - Diccionario por IDs opacos: 'he-000001' → entrada canónica.
       La llave semántica es la forma CON NIKUD; el ID es la llave
       técnica (a prueba de correcciones de nikud/glosa).
     - Cada token de un texto referencia el diccionario por ID y
       puede llevar 'glosa_override' (la traducción es interpretativa
       y sigue a los jajamim: default global + override local).
     - Audio de palabra: matriz {rito × locutor}; si no hay archivo,
       cae a TTS del navegador (mismo patrón de cascada que el
       AudioEngine de Hardyglot).

   Este módulo es de solo-lectura sobre el DOM del contenedor que
   se le entrega; no conoce Supabase ni el progreso del alumno.
   ============================================================ */

const TextoInteractivo = {
    diccionarios: {},   // { 'he': { 'he-000001': {...}, ... }, 'es': {...} }
    idiomaGlosa: 'es',  // idioma en que se muestran las glosas
    _cssInyectado: false,

    /** Carga (o fusiona) un diccionario de un idioma. lista = [{id, nikud|texto, translit, glosas, audio}] */
    cargarDiccionario(lang, lista) {
        if (!this.diccionarios[lang]) this.diccionarios[lang] = {};
        for (const entrada of lista) this.diccionarios[lang][entrada.id] = entrada;
    },

    /** Busca una entrada por ID en el diccionario de su prefijo ('he-000001' → dicc 'he') */
    entrada(id) {
        const lang = id.split('-')[0];
        return (this.diccionarios[lang] || {})[id] || null;
    },

    /**
     * Renderiza una frase como palabras interactivas dentro de `contenedor`.
     * @param {HTMLElement} contenedor
     * @param {Array} tokens - [{ dicc_id, superficie?, glosa_override? }]
     *        superficie: forma exacta como aparece en el texto (si difiere
     *        de la forma canónica del diccionario).
     * @param {Object} opts - { rito, locutor, ttsLang, interlineado }
     */
    render(contenedor, tokens, opts = {}) {
        this._inyectarCSS();
        contenedor.innerHTML = '';
        contenedor.classList.add('ti-frase');
        if (opts.interlineado) contenedor.classList.add('ti-interlineado');

        for (const token of tokens) {
            const e = this.entrada(token.dicc_id) || {};
            const glosa = token.glosa_override
                || (e.glosas ? e.glosas[this.idiomaGlosa] : '')
                || '';
            const superficie = token.superficie || e.nikud || e.texto || '?';

            const wrap = document.createElement('span');
            wrap.className = 'ti-palabra-wrap';

            const span = document.createElement('span');
            span.className = 'ti-palabra';
            span.textContent = superficie;
            span.dataset.glosa = glosa;
            if (e.translit) span.title = e.translit;
            span.addEventListener('click', () => this.pronunciar(token.dicc_id, superficie, opts));
            wrap.appendChild(span);

            const sub = document.createElement('span');
            sub.className = 'ti-glosa';
            sub.textContent = glosa;
            wrap.appendChild(sub);

            contenedor.appendChild(wrap);
            contenedor.appendChild(document.createTextNode(' '));
        }
    },

    /** Activa/desactiva el modo interlineado (todas las glosas visibles) */
    setInterlineado(contenedor, activo) {
        contenedor.classList.toggle('ti-interlineado', !!activo);
    },

    /**
     * Pronuncia una palabra. Cascada: archivo (según rito/locutor) → TTS.
     * Reutiliza el patrón de fuentes del AudioEngine.
     */
    pronunciar(dicc_id, textoFallback, opts = {}) {
        const e = this.entrada(dicc_id);
        const rito = opts.rito || 'edot_hamizrach';

        // 1) ¿Hay archivo de audio para este rito?
        const url = e && e.audio && e.audio[rito] && (e.audio[rito].url || null);
        if (url) {
            const a = new Audio(url);
            a.play().catch(() => {});
            return;
        }

        // 2) Fallback: TTS del navegador
        if (!('speechSynthesis' in window)) return;
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance((e && (e.sin_nikud || e.nikud)) || textoFallback);
        u.lang = opts.ttsLang || 'he-IL';
        u.rate = opts.ttsRate || 0.85;
        speechSynthesis.speak(u);
    },

    /** Estilos del componente (una sola vez por página) */
    _inyectarCSS() {
        if (this._cssInyectado) return;
        this._cssInyectado = true;
        const css = document.createElement('style');
        css.textContent = `
        .ti-frase { line-height: 2.6; }
        .ti-palabra-wrap { display: inline-flex; flex-direction: column; align-items: center; vertical-align: top; }
        .ti-palabra { cursor: pointer; border-radius: 6px; padding: 0 3px; position: relative; transition: background .15s; }
        .ti-palabra:hover { background: rgba(30, 58, 138, 0.10); }
        .ti-palabra:hover::after {
            content: attr(data-glosa);
            position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
            background: #1f2937; color: #fff; font-size: 12.5px; font-family: 'Urbanist', sans-serif;
            padding: 4px 10px; border-radius: 6px; white-space: nowrap; z-index: 30;
            direction: ltr; pointer-events: none;
        }
        .ti-glosa { display: none; font-size: 11.5px; color: #6b7280; font-family: 'Urbanist', sans-serif; direction: ltr; max-width: 110px; text-align: center; line-height: 1.25; padding-top: 2px; }
        .ti-interlineado .ti-glosa { display: block; }
        .ti-interlineado .ti-palabra:hover::after { display: none; }
        `;
        document.head.appendChild(css);
    }
};
