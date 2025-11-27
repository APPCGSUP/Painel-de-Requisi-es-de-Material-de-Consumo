
import { createClient } from '@supabase/supabase-js';

// SEU ID DO PROJETO (Já configurado)
const PROJECT_ID = 'lrqogpbvaicwnvlfbzjr';
const SUPABASE_URL = `https://${PROJECT_ID}.supabase.co`;

// --- IMPORTANTE: COLE SUA CHAVE 'ANON PUBLIC' ABAIXO ---
// Se estiver rodando localmente, você pode colar a string direta aqui.
// Exemplo: const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5c...';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_PP0SWUYFCj0W-zeX9xuMIQ_-97HPJkW';

// Inicializa o cliente apenas se a chave estiver presente
export const supabase = (SUPABASE_KEY && SUPABASE_KEY !== 'sb_publishable_PP0SWUYFCj0W-zeX9xuMIQ_-97HPJkW')
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

// Função auxiliar para verificar se o Supabase está configurado
export const isSupabaseConfigured = () => {
    return !!supabase;
};
