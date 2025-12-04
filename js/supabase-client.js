// js/supabase-client.js

// 1. TUS CREDENCIALES (Ya están puestas las correctas que me pasaste)
const PROJECT_URL = 'https://schnsmsmyzodyqqtaqib.supabase.co';
const PROJECT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjaG5zbXNteXpvZHlxcXRhcWliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyOTYwMDQsImV4cCI6MjA3Nzg3MjAwNH0.76NU9c3JxYYUkXeIZj_mmRdJMuGh-otlaU3uS6Wyujk';

// 2. INICIALIZAR EL CLIENTE
// Verificamos si la librería cargó desde el HTML
if (typeof supabase === 'undefined') {
    console.error('❌ CRÍTICO: La librería de Supabase no se ha cargado. Revisa tu HTML.');
} else {
    // Inicializamos la conexión usando tus claves
    const client = supabase.createClient(PROJECT_URL, PROJECT_KEY);

    // 3. HACERLO GLOBAL
    // Guardamos el cliente en 'window.supabase' para que admin.js lo pueda usar
    window.supabase = client;
    
    console.log("✅ Supabase inicializado correctamente.");
}