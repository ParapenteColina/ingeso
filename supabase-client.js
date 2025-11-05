// Pega tu URL y tu clave anon aquí
const SUPABASE_URL = 'https://schnsmsmyzodyqqtaqib.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjaG5zbXNteXpvZHlxcXRhcWliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyOTYwMDQsImV4cCI6MjA3Nzg3MjAwNH0.76NU9c3JxYYUkXeIZj_mmRdJMuGh-otlaU3uS6Wyujk';

// Crea el "cliente" de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);