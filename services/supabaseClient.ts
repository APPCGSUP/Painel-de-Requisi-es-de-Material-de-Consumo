
import { createClient } from '@supabase/supabase-js';

// SEU ID DO PROJETO (Atualizado)
const PROJECT_ID = '60b6b959-6332-4470-8a33-a07a9c6f8701';
const SUPABASE_URL = `https://${PROJECT_ID}.supabase.co`;

// Chave fornecida pelo usuário
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_PP0SWUYFCj0W-zeX9xuMIQ_-97HPJkW';

// Inicializa o cliente apenas se a chave estiver presente
// Removemos a verificação estrita de 'eyJ' para aceitar o formato fornecido
export const supabase = (SUPABASE_KEY && SUPABASE_KEY !== 'COLE_SUA_CHAVE_SUPABASE_AQUI')
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

// Função auxiliar para verificar se o Supabase está configurado
export const isSupabaseConfigured = () => {
    return !!supabase;
};
