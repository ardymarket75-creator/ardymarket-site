/* ============================================================
   AudioEngine v3 — Hardyglot Language Lab
   ------------------------------------------------------------
   Cambios respecto a v2:
   - Secuencia GENÉRICA: [base, objetivo, base, objetivo].
     Ya no está amarrado a es/en/he.
   - pause() ahora SÍ pausa el audio que está sonando
     (antes solo cambiaba el flag isPlaying).
   - La velocidad (playbackRate) ahora se aplica también a la
     duración de los segmentos monolíticos (antes solo en playPhrase).
   - Soporta 3 tipos de fuente de audio por paso:
       'archivo'  -> un MP3 individual por frase (el futuro)
       'segmento' -> MP3 monolítico + [inicio, fin] (lo actual)
       'tts'      -> síntesis de voz del navegador (fallback)
   - Reanudar: si pausas y vuelves a dar play, retoma en el
     mismo paso/repetición (reinicia el segmento desde su inicio,
     que es lo pedagógicamente correcto para repetir la frase).
   ============================================================ */

const AudioEngine = {
    // La página sincroniza esto antes de cada reproducción
    sessionConfig: {
        reps: {},        // { en: 5, es: 1, ... } por código de idioma
        silenceGap: {},  // { en: 1.3, ... } segundos de silencio tras cada rep
        rate: {}         // { en: 1.0, ... } velocidad de reproducción
    },

    isPlaying: false,
    stepIndex: 0,
    repIndex: 0,

    // Referencias a lo que está sonando ahora (para poder pausarlo de verdad)
    _audioActual: null,
    _timerActual: null,
    _resolverActual: null,

    /**
     * Reproduce la secuencia completa de una frase.
     * @param {Array} pasos - [{ lang, fuente }] donde fuente viene de resolverAudio()
     *                        fuente = { tipo:'archivo', audio } |
     *                                 { tipo:'segmento', audio, sync:[ini,fin] } |
     *                                 { tipo:'tts', texto, ttsLang }
     * @param {Function} onRep - callback(lang) tras cada repetición completada
     * @returns {Promise<boolean>} true si la secuencia terminó completa,
     *                             false si fue pausada a mitad de camino
     */
    async playSequence(pasos, onRep) {
        this.isPlaying = true;

        for (; this.stepIndex < pasos.length; this.stepIndex++) {
            const paso = pasos[this.stepIndex];
            const totalReps = this.sessionConfig.reps[paso.lang] || 1;
            const gap = this.sessionConfig.silenceGap[paso.lang] ?? 1.0;
            const rate = this.sessionConfig.rate[paso.lang] || 1.0;

            for (; this.repIndex < totalReps; this.repIndex++) {
                if (!this.isPlaying) return false; // pausado: conserva índices

                await this._playPaso(paso, rate);
                if (!this.isPlaying) return false; // pausado durante el audio

                if (onRep) onRep(paso.lang);

                // Silencio entre repeticiones (para que el alumno repita)
                await this._esperar(gap * 1000);
                if (!this.isPlaying) return false;
            }
            this.repIndex = 0;
        }

        // Secuencia completa
        this.stepIndex = 0;
        this.repIndex = 0;
        this.isPlaying = false;
        window.dispatchEvent(new Event('fraseCompletada'));
        return true;
    },

    /** Reproduce un paso individual según su tipo de fuente */
    _playPaso(paso, rate) {
        const f = paso.fuente;

        if (f.tipo === 'archivo') {
            // MP3 individual: se reproduce completo, el navegador
            // ajusta la duración automáticamente con playbackRate.
            return new Promise(resolve => {
                const a = f.audio;
                this._audioActual = a;
                this._resolverActual = resolve;
                a.currentTime = 0;
                a.playbackRate = rate;
                a.onended = () => { a.onended = null; resolve(); };
                a.play().catch(() => resolve());
            });
        }

        if (f.tipo === 'segmento') {
            // MP3 monolítico: cortamos con timer, AJUSTADO por velocidad
            return new Promise(resolve => {
                const a = f.audio;
                const [ini, fin] = f.sync;
                this._audioActual = a;
                this._resolverActual = resolve;
                a.currentTime = ini;
                a.playbackRate = rate;
                a.play().catch(() => resolve());
                const duracionMs = ((fin - ini) * 1000) / rate; // <- el fix
                this._timerActual = setTimeout(() => {
                    a.pause();
                    resolve();
                }, duracionMs);
            });
        }

        // Fallback: voz sintética del navegador
        return new Promise(resolve => {
            if (!('speechSynthesis' in window)) return resolve();
            const u = new SpeechSynthesisUtterance(f.texto);
            u.lang = f.ttsLang || 'en-US';
            u.rate = rate;
            u.onend = () => resolve();
            u.onerror = () => resolve();
            this._resolverActual = resolve;
            speechSynthesis.speak(u);
        });
    },

    /** Espera interrumpible (revisa isPlaying cada 100ms) */
    _esperar(ms) {
        return new Promise(resolve => {
            const inicio = Date.now();
            const check = () => {
                if (!this.isPlaying || Date.now() - inicio >= ms) return resolve();
                setTimeout(check, 100);
            };
            check();
        });
    },

    /** Pausa REAL: detiene el audio/TTS/timer en curso y conserva la posición */
    pause() {
        this.isPlaying = false;
        if (this._timerActual) {
            clearTimeout(this._timerActual);
            this._timerActual = null;
        }
        if (this._audioActual) {
            this._audioActual.pause();
        }
        if ('speechSynthesis' in window) speechSynthesis.cancel();
        // Liberar la promesa pendiente para que playSequence retorne
        if (this._resolverActual) {
            const r = this._resolverActual;
            this._resolverActual = null;
            r();
        }
    },

    /** Reinicio total (al cambiar de frase o de configuración) */
    reset() {
        this.pause();
        this.stepIndex = 0;
        this.repIndex = 0;
    }
};
