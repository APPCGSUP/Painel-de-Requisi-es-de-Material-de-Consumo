import { createClient } from '@supabase/supabase-js';

// URL do projeto fornecido pelo usuário
const PROJECT_ID = 'lrqogpbvaicwnvlfbzjr';
const SUPABASE_URL = `https://${PROJECT_ID}.supabase.co`;

// A chave deve vir das variáveis de ambiente por segurança
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

// Evita erro crítico se a chave não existir. Retorna null se não configurado.
export const supabase = SUPABASE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

// Função auxiliar para verificar se o Supabase está configurado
export const isSupabaseConfigured = () => {
    return !!supabase;
};