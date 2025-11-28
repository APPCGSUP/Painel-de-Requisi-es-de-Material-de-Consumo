
import React, { useState } from 'react';
import { supabaseService } from '../services/supabaseService';
import { LogoIcon, SpinnerIcon } from './Icons';

interface AuthProps {
    onLoginSuccess: () => void;
}

type AuthMode = 'login' | 'signup';

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
    const [authMode, setAuthMode] = useState<AuthMode>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        try {
            if (authMode === 'login') {
                const { error } = await supabaseService.signIn(email, password);
                if (error) {
                    if (error.message.includes('Invalid login')) throw new Error('E-mail ou senha incorretos.');
                    if (error.message.includes('Email not confirmed')) throw new Error('E-mail não confirmado. Verifique sua caixa de entrada ou contate o administrador.');
                    throw error;
                }
                onLoginSuccess();
            } else if (authMode === 'signup') {
                if (!name) throw new Error("Nome é obrigatório para cadastro.");
                if (password.length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres.");
                
                // Cadastro simplificado: apenas Nome, Email e Senha. 
                // O serviço definirá o papel como 'viewer' (Visualizador) automaticamente.
                const { error } = await supabaseService.signUp(email, password, name);
                if (error) throw error;
                
                setSuccessMsg('Cadastro realizado com sucesso! Tentando login automático...');
                
                // Tenta logar automaticamente após cadastro
                const { error: loginError } = await supabaseService.signIn(email, password);
                if (!loginError) {
                     onLoginSuccess();
                } else {
                     setSuccessMsg('Cadastro realizado! Por favor, faça login.');
                     setAuthMode('login');
                }
            }
        } catch (err: any) {
            console.error(err);
            if (err.message && err.message.includes('Signups not allowed')) {
                setError("O cadastro de novos usuários está desativado no sistema. Contate o administrador.");
            } else {
                setError(err.message || "Ocorreu um erro na autenticação.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0B1120] p-4 font-sans">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[128px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[128px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-md bg-[#1F2937] border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                <div className="p-8">
                    <div className="flex justify-center mb-6">
                        <div className="bg-blue-500/10 p-3 rounded-xl">
                            <LogoIcon className="h-10 w-10 text-blue-500" />
                        </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-center text-white mb-2">
                        {authMode === 'login' ? 'Acessar Sistema' : 'Criar Nova Conta'}
                    </h2>
                    
                    {/* Tabs */}
                    <div className="flex justify-center gap-4 text-sm mb-6 mt-4 border-b border-gray-700">
                        <button 
                            onClick={() => { setAuthMode('login'); setError(null); setSuccessMsg(null); }} 
                            className={`pb-2 px-4 border-b-2 transition-colors ${authMode === 'login' ? 'border-blue-500 text-blue-400 font-medium' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                        >
                            Entrar
                        </button>
                        <button 
                            onClick={() => { setAuthMode('signup'); setError(null); setSuccessMsg(null); }} 
                            className={`pb-2 px-4 border-b-2 transition-colors ${authMode === 'signup' ? 'border-blue-500 text-blue-400 font-medium' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                        >
                            Cadastrar
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {authMode === 'signup' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    required={authMode === 'signup'}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Ex: João Silva"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="seu@email.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Senha</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                                minLength={6}
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm flex items-start gap-2 animate-pulse">
                                <span className="block w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></span>
                                <span>{error}</span>
                            </div>
                        )}
                        
                        {successMsg && (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm flex items-center gap-2">
                                <span className="block w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                {successMsg}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-2"
                        >
                            {loading ? <SpinnerIcon className="h-5 w-5 text-white" /> : (authMode === 'login' ? 'Acessar' : 'Concluir Cadastro')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Auth;
