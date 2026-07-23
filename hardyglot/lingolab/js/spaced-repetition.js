/* ============================================================
   SpacedRepetition v3 — Hardyglot Language Lab
   Ciclo de vida de una frase (por idioma)
   ------------------------------------------------------------
   ESTUDIO   5 reps/día durante 7 días (35 reps).
             El contador muestra "Día 1..7".
   REPASO    El alumno PRODUCE la frase (la escribe).
             Los días 1, 2 y 3 de Fibonacci son consecutivos:
             tres aciertos seguidos = tres días seguidos. Por eso
             nivel_repaso ES el contador de aciertos consecutivos,
             no hace falta un campo aparte.
             El contador muestra "Día 1, 2, 3, 5, 8, 13, 21".
   GRADUADA  Superó el día 21. Sale del ciclo activo.

   Un fallo devuelve la frase a ESTUDIO. El alumno no declara que
   se la sabe: lo demuestra produciéndola.
   ============================================================ */

const SpacedRepetition = {
    fibonacciDias: [1, 2, 3, 5, 8, 13, 21],

    // Días de estudio necesarios para pasar a repaso
    DIAS_ESTUDIO: 7,

    /* ⚙️ AJUSTABLE — cuántos días de estudio debe rehacer una frase que
       falló en repaso. 7 = castigo completo (rehace los 35 reps).
       3 = reintegración parcial. Fallar en el día 21 y volver a cero es
       desproporcionado: el alumno SÍ sabía la frase, la falló una vez.
       Si querés el reset total, poné 7. */
    DIAS_REESTUDIO_TRAS_FALLO: 3,

    /** Convierte un Date a 'YYYY-MM-DD' en hora local (no UTC) */
    _fechaLocal(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
    },

    /** Fecha de hoy como 'YYYY-MM-DD' (hora local del alumno) */
    hoy() {
        return this._fechaLocal(new Date());
    },

    /** Fecha del próximo repaso según el nivel alcanzado */
    /* 🐛 FIX v2.1.1 — los números 1,2,3,5,8,13,21 son días contados DESDE EL
       DOMINIO, no saltos entre un control y el siguiente. Antes se sumaba el
       número absoluto a la fecha de hoy en cada acierto, así que el calendario
       real terminaba siendo 1, 3, 6, 11, 19, 32, 53 — se abría al doble.
       Ahora se suma la DIFERENCIA con el escalón anterior. */
    proximaFecha(nivel) {
        const i = Math.min(nivel, this.fibonacciDias.length - 1);
        const anterior = i > 0 ? this.fibonacciDias[i - 1] : 0;
        const salto = Math.max(1, this.fibonacciDias[i] - anterior);
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + salto);
        return this._fechaLocal(fecha);
    },

    /** Estructura de progreso nueva y vacía */
    nuevoProgreso() {
        return {
            modo: 'estudio',
            reps: 0,
            lastRepDate: null,
            diasCompletos: 0,
            ultimoDiaCompleto: null,
            nivel_repaso: 0,
            proximo_repaso: null,
            dominada: false
        };
    },

    /* Normaliza registros viejos (con `stars`, sin `modo`) al esquema nuevo.
       Las estrellas se convierten en días de estudio cumplidos. */
    migrar(p) {
        if (!p) return this.nuevoProgreso();
        if (p.modo) return p;
        p.diasCompletos = p.diasCompletos ?? (p.stars || 0);
        p.ultimoDiaCompleto = p.ultimoDiaCompleto || p.lastStarDate || null;
        p.nivel_repaso = p.nivel_repaso || 0;
        p.proximo_repaso = p.proximo_repaso || null;
        p.modo = p.dominada ? 'repaso' : 'estudio';
        if (p.modo === 'repaso' && !p.proximo_repaso) {
            p.proximo_repaso = this.proximaFecha(p.nivel_repaso);
        }
        return p;
    },

    /** Registra un día de estudio cumplido. Devuelve true si promovió a repaso. */
    registrarDiaCompleto(p) {
        const hoy = this.hoy();
        if (p.ultimoDiaCompleto === hoy) return false;   // un día cuenta una vez
        p.diasCompletos = (p.diasCompletos || 0) + 1;
        p.ultimoDiaCompleto = hoy;
        if (p.diasCompletos >= this.DIAS_ESTUDIO) {
            this.promoverARepaso(p);
            return true;
        }
        return false;
    },

    /** Pasa la frase a modo repaso. El primer repaso cae MAÑANA (día 1). */
    promoverARepaso(p, inmediato = false) {
        p.modo = 'repaso';
        p.dominada = true;              // compatibilidad con datos viejos
        p.nivel_repaso = 0;
        /* Si el alumno pulsa "A repaso" está pidiendo que lo evalúen AHORA,
           así que el control queda disponible hoy mismo. La promoción
           automática tras los 35 reps agenda el primer control para mañana,
           que es el día 1 de la secuencia. */
        p.proximo_repaso = inmediato ? this.hoy() : this.proximaFecha(0);
    },

    /* Fase de racha: los tres primeros escalones (días 1, 2, 3) son días
       CONSECUTIVOS de calendario. A partir del escalón 3 rige el espaciado
       Fibonacci normal (5, 8, 13, 21). */
    FASE_RACHA: 3,

    /** El alumno produjo la frase correctamente en su control del día. */
    repasoAcierto(p) {
        /* 🆕 v2.1.2 — si está en la fase de racha y dejó pasar uno o más
           días sin hacer el control, los días ya no son consecutivos: la
           racha vuelve a empezar y este acierto cuenta como día 1. */
        if ((p.nivel_repaso || 0) < this.FASE_RACHA &&
            p.proximo_repaso && p.proximo_repaso < this.hoy()) {
            p.nivel_repaso = 0;
        }
        p.nivel_repaso = (p.nivel_repaso || 0) + 1;
        if (p.nivel_repaso >= this.fibonacciDias.length) {
            p.modo = 'graduada';
            p.proximo_repaso = null;
        } else {
            p.proximo_repaso = this.proximaFecha(p.nivel_repaso);
        }
    },

    /** El alumno falló su control del día.
        🆕 v2.1.2 — dos comportamientos según la fase:
        · Fase de racha (días 1-3): la frase SE QUEDA en repaso. Solo se
          reinicia la racha, y el próximo intento que cuenta es mañana.
          Así la ventana queda abierta para estudiar cuantas veces quiera.
        · Espaciado ya ganado (día 5 en adelante): fallar el control sí
          devuelve la frase a estudio — a ese nivel el error indica que el
          dominio no era real. */
    repasoFallo(p) {
        if ((p.nivel_repaso || 0) < this.FASE_RACHA) {
            p.nivel_repaso = 0;
            const m = new Date();
            m.setDate(m.getDate() + 1);
            p.proximo_repaso = this._fechaLocal(m);
            return;
        }
        p.modo = 'estudio';
        p.dominada = false;
        p.nivel_repaso = 0;
        p.proximo_repaso = null;
        p.diasCompletos = Math.max(0, this.DIAS_ESTUDIO - this.DIAS_REESTUDIO_TRAS_FALLO);
        p.ultimoDiaCompleto = null;
        p.reps = 0;
        p.lastRepDate = null;
    },

    /** Vuelta a estudio incondicional (botón manual y panel de instructor). */
    volverAEstudioTotal(p) {
        p.modo = 'estudio';
        p.dominada = false;
        p.nivel_repaso = 0;
        p.proximo_repaso = null;
        p.diasCompletos = Math.max(0, this.DIAS_ESTUDIO - this.DIAS_REESTUDIO_TRAS_FALLO);
        p.ultimoDiaCompleto = null;
        p.reps = 0;
        p.lastRepDate = null;
    },

    /** Devuelve la frase a estudio a pedido del alumno (botón manual). */
    volverAEstudio(p) {
        this.volverAEstudioTotal(p);
    },

    /** Etiqueta del contador según el modo. */
    etiquetaContador(p) {
        if (!p) return 'Día 0';
        if (p.modo === 'graduada') return 'Graduada';
        if (p.modo === 'repaso') {
            const i = Math.min(p.nivel_repaso || 0, this.fibonacciDias.length - 1);
            return 'Día ' + this.fibonacciDias[i];
        }
        return 'Día ' + (p.diasCompletos || 0);
    },

    /** ¿Esta frase tiene repaso vencido hoy? */
    vencida(p) {
        return !!(p && p.modo === 'repaso' && p.proximo_repaso && p.proximo_repaso <= this.hoy());
    },

    /** IDs de frases con repaso vencido para un idioma dado. */
    repasosPendientes(progreso, lang) {
        const pendientes = [];
        const porIdioma = progreso[lang] || {};
        for (const id in porIdioma) {
            if (this.vencida(porIdioma[id])) pendientes.push(parseInt(id));
        }
        return pendientes;
    },

    /* ------------------------------------------------------------
       VALIDACIÓN DE LA PRODUCCIÓN ESCRITA
       Compara ignorando mayúsculas, puntuación, nikud y acentos.
       Tolera hasta un 10% de distancia de edición (mínimo 1 carácter)
       para no castigar un dedazo — pero no alcanza para dar por buena
       una palabra equivocada.
       ------------------------------------------------------------ */
    normalizar(s) {
        return (s || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0591-\u05C7]/g, '')      // nikud y cantilación hebrea
            .replace(/[\u0300-\u036f]/g, '')      // acentos latinos
            .replace(/[.,;:!?¿¡"'«»""''`\-–—()]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    },

    _distancia(a, b) {
        if (a === b) return 0;
        if (!a.length) return b.length;
        if (!b.length) return a.length;
        let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
        for (let i = 1; i <= a.length; i++) {
            const fila = [i];
            for (let j = 1; j <= b.length; j++) {
                const costo = a[i - 1] === b[j - 1] ? 0 : 1;
                fila[j] = Math.min(fila[j - 1] + 1, prev[j] + 1, prev[j - 1] + costo);
            }
            prev = fila;
        }
        return prev[b.length];
    },

    /** { acierto: bool, exacto: bool, distancia: n } */
    evaluarRespuesta(escrito, esperado) {
        const a = this.normalizar(escrito);
        const b = this.normalizar(esperado);
        if (!a) return { acierto: false, exacto: false, distancia: b.length };
        const d = this._distancia(a, b);
        const tolerancia = Math.max(1, Math.floor(b.length * 0.10));
        return { acierto: d <= tolerancia, exacto: d === 0, distancia: d };
    }
};
