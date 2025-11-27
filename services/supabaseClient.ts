
import { createClient } from '@supabase/supabase-js';

// SEU ID DO PROJETO
const PROJECT_ID = 'lrqogpbvaicwnvlfbzjr';
const SUPABASE_URL = `https://${PROJECT_ID}.supabase.co`;

// --- IMPORTANTE: COLE SUA CHAVE 'ANON PUBLIC' DO SUPABASE ABAIXO ---
// 1. Vá em Settings (Engrenagem) -> API -> Project API keys -> anon public
// 2. A chave correta é longa e começa com "eyJ..."
// 3. Substitua o texto entre aspas abaixo pela sua chave:
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_PP0SWUYFCj0W-zeX9xuMIQ_-97HPJkW';

// Inicializa o cliente apenas se a chave estiver presente e tiver o formato correto (JWT)
export const supabase = (SUPABASE_KEY && SUPABASE_KEY.startsWith('eyJ'))
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

// Função auxiliar para verificar se o Supabase está configurado
export const isSupabaseConfigured = () => {
    return !!supabase;
};