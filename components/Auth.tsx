import React, { useState } from 'react';
import { supabaseService } from '../services/supabaseService';
import { LogoIcon, SpinnerIcon, UserGroupIcon } from './Icons';

interface AuthProps {
    onLoginSuccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<'separator' | 'confirmer'>('separator');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabaseService.signIn(email, password);
                if (error) throw error;
            } else {
                if (!name) throw new Error("Nome é obrigatório para cadastro.");
                const { error } = await supabaseService.signUp(email, password, name, role);
                if (error) throw error;
            }
            onLoginSuccess();
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Ocorreu um erro na autenticação.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0B1120] p-4">
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
                        {isLogin ? 'Bem-vindo de volta' : 'Criar conta'}
                    </h2>
                    <p className="text-center text-gray-400 mb-8 text-sm">
                        {isLogin ? 'Acesse o painel de separação' : 'Junte-se à equipe de logística'}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        required
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
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
                                <span className="block w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {loading ? <SpinnerIcon className="h-5 w-5 text-white" /> : (isLogin ? 'Entrar' : 'Cadastrar')}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-700/50 text-center">
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError(null);
                            }}
                            className="text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            {isLogin ? (
                                <>Não tem uma conta? <span className="text-blue-400 font-medium">Cadastre-se</span></>
                            ) : (
                                <>Já tem uma conta? <span className="text-blue-400 font-medium">Faça Login</span></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
