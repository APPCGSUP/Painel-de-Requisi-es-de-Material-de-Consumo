
import { createClient } from '@supabase/supabase-js';

// SEU ID DO PROJETO
const PROJECT_ID = 'lrqogpbvaicwnvlfbzjr';
const SUPABASE_URL = `https://${PROJECT_ID}.supabase.co`;

// Chave fornecida pelo usuário (Anon Public Key)
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxycW9ncGJ2YWljd252bGZiempyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDg5ODgsImV4cCI6MjA3OTEyNDk4OH0.WpyY-3JIgfvCVspzct89veguZG0okLUCn5RQT9VJBic';

// Inicializa o cliente
export const supabase = (SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

// Função auxiliar para verificar se o Supabase está configurado
export const isSupabaseConfigured = () => {
    return !!supabase;
};
