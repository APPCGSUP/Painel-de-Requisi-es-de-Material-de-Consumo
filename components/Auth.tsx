import React, { useState } from 'react';
import { supabaseService } from '../services/supabaseService';
import { LogoIcon, SpinnerIcon } from './Icons';

interface AuthProps {
    onLoginSuccess: () => void;
    onGuestLogin: () => void;
}

type AuthMode = 'login' | 'signup' | 'magic';

const Auth: React.FC<AuthProps> = ({ onLoginSuccess, onGuestLogin }) => {
    const [authMode, setAuthMode] = useState<AuthMode>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<'separator' | 'confirmer'>('separator');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        try {
            if (authMode === 'login') {
                const { error } = await supabaseService.signIn(email, password);
                if (error) throw error;
                onLoginSuccess();
            } else if (authMode === 'signup') {
                if (!name) throw new Error("Nome é obrigatório para cadastro.");
                const { error } = await supabaseService.signUp(email, password, name, role);
                if (error) throw error;
                onLoginSuccess();
            } else if (authMode === 'magic') {
                const { error } = await supabaseService.signInWithOtp(email);
                if (error) throw error;
                setSuccessMsg('Link de acesso enviado para seu e-mail! Verifique sua caixa de entrada.');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Ocorreu um erro na autenticação.");
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
                        {authMode === 'login' ? 'Bem-vindo de volta' : authMode === 'signup' ? 'Criar conta' : 'Acesso sem senha'}
                    </h2>
                    
                    {/* Tabs */}
                    <div className="flex justify-center gap-4 text-sm mb-6 mt-4">
                        <button 
                            onClick={() => { setAuthMode('login'); setError(null); setSuccessMsg(null); }} 
                            className={`pb-1 border-b-2 transition-colors ${authMode === 'login' ? 'border-blue-500 text-blue-400 font-medium' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                        >
                            Senha
                        </button>
                        <button 
                            onClick={() => { setAuthMode('magic'); setError(null); setSuccessMsg(null); }} 
                            className={`pb-1 border-b-2 transition-colors ${authMode === 'magic' ? 'border-blue-500 text-blue-400 font-medium' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                        >
                            Link Mágico
                        </button>
                        <button 
                            onClick={() => { setAuthMode('signup'); setError(null); setSuccessMsg(null); }} 
                            className={`pb-1 border-b-2 transition-colors ${authMode === 'signup' ? 'border-blue-500 text-blue-400 font-medium' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                        >
                            Cadastro
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {authMode === 'signup' && (
                            <>
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
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Função</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setRole('separator')}
                                            className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${role === 'separator' ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'}`}
                                        >
                                            Separador
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRole('confirmer')}
                                            className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${role === 'confirmer' ? 'bg-teal-500/20 border-teal-500 text-teal-400' : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'}`}
                                        >
                                            Conferente
                                        </button>
                                    </div>
                                </div>
                            </>
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

                        {authMode !== 'magic' && (
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
                        )}

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
                                <span className="block w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                {error}
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
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {loading ? <SpinnerIcon className="h-5 w-5 text-white" /> : (authMode === 'login' ? 'Entrar' : authMode === 'signup' ? 'Cadastrar' : 'Enviar Link Mágico')}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-700/50">
                         <button
                            onClick={onGuestLogin}
                            className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg border border-gray-600 transition-colors text-sm"
                        >
                            Modo Visitante (Offline)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;