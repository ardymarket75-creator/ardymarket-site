/* ============================================================
   SpacedRepetition v2 — Hardyglot Language Lab
   ------------------------------------------------------------
   Cambios respecto a v1:
   - Secuencia Fibonacci alineada con la especificación pedagógica
     de Hardyglot: días 1, 2, 3, 5, 8, 13, 21 después del día 0
     (el día 0 es el día en que se marca como dominada).
   - Ya NO usa claves 'mastered_*' propias en localStorage.
     Ahora lee y escribe sobre el MISMO objeto `progreso` de la
     app (una sola fuente de verdad), que a su vez se guarda en
     localStorage y se sincroniza con Supabase.
   - Este módulo es "puro": no toca el DOM. La página decide
     cómo mostrar los repasos pendientes.
   ============================================================ */

const SpacedRepetition = {
    // Días hasta el próximo repaso según el nivel alcanzado
    fibonacciDias: [1, 2, 3, 5, 8, 13, 21],

    /** Fecha de hoy como 'YYYY-MM-DD' */
    hoy() {
        return new Date().toISOString().slice(0, 10);
    },

    /** Calcula la fecha del próximo repaso según el nivel */
    proximaFecha(nivel) {
        const dias = this.fibonacciDias[Math.min(nivel, this.fibonacciDias.length - 1)];
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + dias);
        return fecha.toISOString().slice(0, 10);
    },

    /**
     * Programa el primer repaso al marcar una frase como dominada.
     * Muta directamente la entrada de progreso.
     * @param {Object} p - progreso[lang][id]
     */
    programarPrimerRepaso(p) {
        p.dominada = true;
        p.nivel_repaso = 0;
        p.proximo_repaso = this.proximaFecha(0);
    },

    /**
     * Registra un repaso completado: sube el nivel y agenda el siguiente.
     * @param {Object} p - progreso[lang][id]
     */
    completarRepaso(p) {
        p.nivel_repaso = (p.nivel_repaso || 0) + 1;
        p.proximo_repaso = this.proximaFecha(p.nivel_repaso);
    },

    /**
     * Devuelve los IDs de frases con repaso vencido (hoy o antes)
     * para un idioma dado.
     * @param {Object} progreso - el objeto global de progreso
     * @param {string} lang - código de idioma ('en', 'he', ...)
     * @returns {number[]} ids de frases por repasar
     */
    repasosPendientes(progreso, lang) {
        const hoy = this.hoy();
        const pendientes = [];
        const porIdioma = progreso[lang] || {};
        for (const id in porIdioma) {
            const p = porIdioma[id];
            if (p.dominada && p.proximo_repaso && p.proximo_repaso <= hoy) {
                pendientes.push(parseInt(id));
            }
        }
        return pendientes;
    }
};
