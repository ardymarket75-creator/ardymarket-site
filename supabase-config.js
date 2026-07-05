// supabase-config.js - ArdyMarket
const SUPABASE_URL = 'https://llrcyeikbaqxgakxcbcv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_L3oTotJ68Pbsp46lwqGalg_PeqQEipg';

// ✅ FIX: guardar referencia a la librería ANTES de pisar window.supabase,
// por si algún módulo futuro necesita supabase.createClient de nuevo.
window.supabaseLib = window.supabase;
window.supabase = window.supabaseLib.createClient(SUPABASE_URL, SUPABASE_KEY);

// Test de conexión SOLO bajo demanda (llamar manualmente desde consola):
// testSupabaseConnection()
async function testSupabaseConnection() {
    try {
        const { error } = await window.supabase
            .from('profiles')
            .select('count', { count: 'exact', head: true });
        if (error) throw error;
        console.log('✅ Conexión establecida con Hardyglot!');
    } catch (err) {
        console.error('❌ Error técnico:', err.message);
    }
}
