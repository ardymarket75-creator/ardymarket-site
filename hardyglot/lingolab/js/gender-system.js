/**
 * Gender System for Language Lab - ADAPTADO A ARDYMARKET
 * 
 * Maneja la selección y persistencia del género del usuario
 * Integrado con Supabase (tabla: profiles)
 * 
 * Schema:
 * - profiles.gender (VARCHAR(1): 'm' | 'f')
 */

const GenderSystem = {
    USER_GENDER_LOCAL_KEY: 'hardyglot_user_gender_v1',
    DEFAULT_GENDER: 'm',

    /**
     * Obtiene el género del usuario
     * Prioridad: localStorage → Supabase profiles → default
     */
    async getUserGender() {
        // 1. Primero revisar localStorage (caché local)
        let gender = localStorage.getItem(this.USER_GENDER_LOCAL_KEY);
        if (gender && ['m', 'f'].includes(gender)) {
            this.log('✅ Gender loaded from localStorage:', gender);
            return gender;
        }

        // 2. Si no existe localmente, cargar de Supabase
        if (!window.supabase) {
            this.log('⚠️ Supabase not available, using default gender');
            return this.DEFAULT_GENDER;
        }

        try {
            const { data: { session } } = await window.supabase.auth.getSession();
            
            if (!session) {
                this.log('⚠️ No session, using default gender');
                return this.DEFAULT_GENDER;
            }

            const user_id = session.user.id;

            // Cargar de profiles
            const { data, error } = await window.supabase
                .from('profiles')
                .select('gender')
                .eq('id', user_id)
                .single();

            if (error) {
                console.warn('⚠️ Error loading gender from profiles:', error);
                return this.DEFAULT_GENDER;
            }

            if (data && data.gender && ['m', 'f'].includes(data.gender)) {
                gender = data.gender;
                // Guardar en localStorage para caché
                localStorage.setItem(this.USER_GENDER_LOCAL_KEY, gender);
                this.log('✅ Gender loaded from Supabase:', gender);
                return gender;
            }

            this.log('⚠️ Gender not set in Supabase, using default');
            return this.DEFAULT_GENDER;

        } catch (err) {
            console.error('❌ Error loading gender from Supabase:', err);
            return this.DEFAULT_GENDER;
        }
    },

    /**
     * Guarda el género del usuario
     * localStorage (inmediato) + Supabase (async)
     */
    async setUserGender(gender) {
        if (!['m', 'f'].includes(gender)) {
            console.error('❌ Invalid gender:', gender);
            return false;
        }

        // 1. Guardar localmente (inmediato)
        localStorage.setItem(this.USER_GENDER_LOCAL_KEY, gender);
        this.log('✅ Gender saved to localStorage:', gender);

        // 2. Sincronizar con Supabase
        if (!window.supabase) {
            this.log('⚠️ Supabase not available, gender saved locally only');
            return true;
        }

        try {
            const { data: { session } } = await window.supabase.auth.getSession();
            
            if (!session) {
                this.log('⚠️ No session, gender saved locally only');
                return true;
            }

            const user_id = session.user.id;

            // Actualizar profiles
            const { error } = await window.supabase
                .from('profiles')
                .update({ gender: gender })
                .eq('id', user_id);

            if (error) {
                console.warn('⚠️ Error syncing gender to Supabase:', error);
                return true;  // Ya está guardado localmente
            }

            this.log('✅ Gender synced to Supabase (profiles):', gender);
            return true;

        } catch (err) {
            console.error('❌ Error syncing gender to Supabase:', err);
            return true;  // Ya está guardado localmente, es ok
        }
    },

    /**
     * Obtiene las variantes de una frase según género del usuario
     * 
     * Soporta dos estructuras:
     * - Antigua: { frase_traduccion, transliteracion }
     * - Nueva: { variantes: { m: {...}, f: {...} } }
     */
    getHebrewVariant(phraseData, userGender) {
        const heData = phraseData.idiomas_soporte?.find(d => d.idioma === 'he');

        if (!heData) {
            console.warn('⚠️ No Hebrew data in phrase:', phraseData.id);
            return null;
        }

        // Si no tiene variantes (frase antigua), retornar como está
        if (!heData.variantes) {
            this.log(`Phrase ${phraseData.id}: sin variantes (estructura antigua)`);
            return heData;
        }

        // Si es primera persona, retornar SOLO la versión del usuario
        if (phraseData.tipo === 'primera_persona') {
            const variant = heData.variantes[userGender];
            if (!variant) {
                console.warn(`⚠️ Gender ${userGender} not found for phrase ${phraseData.id}`);
                return heData.variantes.m || heData.variantes.f;
            }
            return variant;
        }

        // Si es segunda persona, retornar AMBAS
        if (phraseData.tipo === 'segunda_persona') {
            return heData.variantes;  // { m: {...}, f: {...} }
        }

        // Default
        return heData.variantes[userGender];
    },

    /**
     * Resuelve UNA variante hebrea (texto + tiempos) según género.
     * Fuente única de verdad para audio manual y renderizado single.
     * Retorna null si no hay datos hebreos.
     */
    resolveHebrewVariant(phraseData, userGender) {
        const heData = phraseData.idiomas_soporte?.find(d => d.idioma === 'he');
        if (!heData) return null;
        if (!heData.variantes) return heData;  // estructura antigua
        return heData.variantes[userGender] || heData.variantes.m || heData.variantes.f || null;
    },

    /**
     * Valida si una frase aplica al género del usuario
     */
    doesPhraseApplyToGender(phraseData, userGender) {
        if (!phraseData.genero_aplicable) {
            // Si no tiene restricción, aplica a todos
            return true;
        }

        return phraseData.genero_aplicable.includes(userGender);
    },

    /**
     * Obtiene el label del género (para UI)
     */
    getGenderLabel(gender) {
        const labels = {
            'm': '👨 Hombre',
            'f': '👩 Mujer'
        };
        return labels[gender] || 'Desconocido';
    },

    /**
     * Debug: muestra estado actual
     */
    getState() {
        return {
            gender: localStorage.getItem(this.USER_GENDER_LOCAL_KEY) || this.DEFAULT_GENDER,
            localStorageKey: this.USER_GENDER_LOCAL_KEY,
            supabaseTable: 'profiles.gender',
            hasSupabase: !!window.supabase
        };
    },

    /**
     * Debug logging (opcional)
     */
    DEBUG: false,
    log(...args) {
        if (this.DEBUG) {
            console.log('[GenderSystem]', ...args);
        }
    },

    /**
     * Enable/disable debug
     */
    setDebug(enabled) {
        this.DEBUG = enabled;
    }
};

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GenderSystem;
}
