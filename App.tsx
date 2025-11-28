
import React, { useState, useCallback, useEffect } from 'react';
import { Order, User } from './types';
import { extractOrderDataFromFile } from './services/geminiService';
import { supabaseService } from './services/supabaseService';
import { isSupabaseConfigured, supabase } from './services/supabaseClient';
import FileUpload from './components/FileUpload';
import OrderDashboard from './components/OrderDashboard';
import HistoryPanel from './components/HistoryPanel';
import HistoryOrderDetail from './components/HistoryOrderDetail';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import UserManagement from './components/UserManagement';
import Auth from './components/Auth';
import { LogoIcon, ErrorIcon, SpinnerIcon, ChartBarIcon, UserGroupIcon, ExclamationTriangleIcon, CheckCircleIcon, HistoryIcon, PencilIcon } from './components/Icons';

const MOCK_USERS: User[] = [
    { id: 'user1', name: 'Charles', role: 'confirmer' },
    { id: 'user2', name: 'Vicente', role: 'confirmer' },
    { id: 'user3', name: 'Diego', role: 'separator' },
    { id: 'user4', name: 'Zé Maria', role: 'confirmer' },
    { id: 'user5', name: 'Rodrigo', role: 'separator' },
];

/**
 * Hook for persistent local state (Used now mainly for App Name and Preferences)
 */
function usePersistentState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => {
        try {
            const storedValue = localStorage.getItem(key);
            if (storedValue !== null) {
                return JSON.parse(storedValue);
            }
        } catch (error) {
            console.error(`Error reading localStorage key “${key}”:`, error);
        }
        return defaultValue;
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key, state]);

    return [state, setState];
}

const App: React.FC = () => {
    // Auth State
    const [session, setSession] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);

    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'dashboard' | 'analytics' | 'users'>('dashboard');
    
    // State for duplicate detection
    const [duplicateCandidate, setDuplicateCandidate] = useState<{ newOrder: Order, existingOrder: Order } | null>(null);
    
    // State for App Name Editing
    const [isEditingAppName, setIsEditingAppName] = useState(false);

    // Data states
    const [orderHistory, setOrderHistory] = useState<Order[]>([]);
    const [incomingQueue, setIncomingQueue] = useState<Order[]>([]);
    const [users, setUsers] = useState<User[]>(MOCK_USERS);

    // Preferences
    const [currentUser, setCurrentUser] = usePersistentState<User>('currentUser', { id: 'guest', name: 'Visitante', role: 'viewer' });
    const [appName, setAppName] = usePersistentState<string>('appName', 'Painel de Requisições');

    // Auth Initialization
    useEffect(() => {
        if (isSupabaseConfigured()) {
            supabase!.auth.getSession().then(({ data: { session } }) => {
                setSession(session);
                setAuthLoading(false);
            });

            const {
                data: { subscription },
            } = supabase!.auth.onAuthStateChange((event, session) => {
                setSession(session);
                setAuthLoading(false);
                
                // Tratamento robusto para erro de Refresh Token
                if ((event as string) === 'TOKEN_REFRESH_ERROR') {
                    console.warn('Erro ao atualizar token. Forçando logout para segurança.');
                    handleLogout();
                }
            });

            return () => subscription.unsubscribe();
        } else {
            setAuthLoading(false);
        }
    }, []);

    // Load Data based on Auth State
    useEffect(() => {
        const loadData = async () => {
            if (!isSupabaseConfigured()) return;

            if (session) {
                try {
                    setIsLoading(true);
                    
                    // Identify current user from DB
                    const myProfile = await supabaseService.getCurrentUserProfile();
                    if (myProfile) {
                        setCurrentUser(myProfile);
                    } else {
                        // Se falhar ao pegar o perfil, tenta usar o que está no local storage ou mantém o default,
                        // mas idealmente deveria forçar uma nova tentativa ou logout se crítico.
                        console.warn("Perfil não carregado do Supabase, usando local.");
                    }

                    const [fetchedOrders, fetchedUsers] = await Promise.all([
                        supabaseService.getOrders(),
                        supabaseService.getUsers()
                    ]);

                    if (fetchedUsers.length > 0) {
                        setUsers(fetchedUsers);
                    }

                    const history = fetchedOrders.filter(o => o.status === 'completed' || o.status === 'canceled');
                    const queue = fetchedOrders.filter(o => o.status === 'picking');

                    setOrderHistory(history);
                    setIncomingQueue(queue);

                } catch (err) {
                    console.error("Falha ao carregar dados do Supabase", err);
                    setError("Erro ao conectar com o banco de dados.");
                } finally {
                    setIsLoading(false);
                }
            }
        };

        if (!authLoading) {
            loadData();
        }
    }, [session, authLoading]);

    const refreshData = async () => {
        if (!isSupabaseConfigured()) return;
        
        const fetchedOrders = await supabaseService.getOrders();
        const history = fetchedOrders.filter(o => o.status === 'completed' || o.status === 'canceled');
        const queue = fetchedOrders.filter(o => o.status === 'picking');
        setOrderHistory(history);
        setIncomingQueue(queue);
    };

    const handleLogout = async () => {
        await supabaseService.signOut();
        setSession(null);
        // Limpar dados locais sensíveis ao sair
        localStorage.removeItem('currentUser');
        setCurrentUser({ id: 'guest', name: 'Visitante', role: 'viewer' });
        setView('dashboard');
    };

    const handleFileProcess = useCallback(async (file: File) => {
        setIsLoading(true);
        setError(null);
        setCurrentOrder(null);
        setSelectedHistoryOrder(null);
        setDuplicateCandidate(null);

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                try {
                    const base64File = (reader.result as string).split(',')[1];
                    const orderData = await extractOrderDataFromFile(base64File, file.type);
                    
                    const existingInHistory = orderHistory.find(o => o.orderId === orderData.orderId);
                    const existingInQueue = incomingQueue.find(o => o.orderId === orderData.orderId);

                    if (existingInHistory) {
                        setDuplicateCandidate({
                            newOrder: { ...orderData, status: 'picking', timestamp: new Date().toISOString() },
                            existingOrder: existingInHistory
                        });
                        setIsLoading(false);
                    } else if (existingInQueue) {
                        setError(`O pedido ${orderData.orderId} já está na fila de espera.`);
                        setIsLoading(false);
                    } else {
                        const newOrder: Order = { ...orderData, status: 'picking', timestamp: new Date().toISOString() };
                        
                        if (isSupabaseConfigured()) {
                            await supabaseService.createOrder(newOrder);
                            await refreshData();
                        }
                        
                        setIsLoading(false);
                        setView('dashboard');
                    }
                } catch (e: any) {
                    console.error(e);
                    // Specific handling for quota errors or general AI failures
                    if (e.toString().includes('429') || e.message?.includes('429') || e.message?.includes('quota')) {
                        setError('Cota da API excedida. Por favor, verifique seu plano ou tente novamente mais tarde.');
                    } else {
                        setError('Falha ao processar o arquivo com a IA. ' + (e.message || 'Verifique o formato do arquivo.'));
                    }
                    setIsLoading(false);
                }
            };
            reader.onerror = () => {
                setError('Não foi possível ler o arquivo.');
                setIsLoading(false);
            };
        } catch (e) {
            console.error(e);
            setError('Ocorreu um erro inesperado.');
            setIsLoading(false);
        }
    }, [orderHistory, incomingQueue]);

    const handleConfirmDuplicateAction = async (action: 'resume' | 'overwrite') => {
        if (!duplicateCandidate) return;

        if (action === 'resume') {
            setCurrentOrder(duplicateCandidate.existingOrder);
            setDuplicateCandidate(null);
        } else {
            const newOrder = duplicateCandidate.newOrder;
            
            if (isSupabaseConfigured()) {
                setIsLoading(true);
                await supabaseService.createOrder(newOrder);
                await refreshData();
                setIsLoading(false);
            }

            setDuplicateCandidate(null);
            setView('dashboard');
        }
    };

    const resetToUpload = () => {
        setCurrentOrder(null);
        setSelectedHistoryOrder(null);
        setDuplicateCandidate(null);
        setError(null);
        setIsLoading(false);
        setView('dashboard');
    };

    const handleFinalizeOrder = async (status: 'completed' | 'canceled', pickedItems: Set<string>, separator?: User, confirmer?: User) => {
        if (!currentOrder) return;
        
        let completionStatus: 'complete' | 'incomplete' | undefined = undefined;
        if (status === 'completed') {
            completionStatus = pickedItems.size === currentOrder.items.length ? 'complete' : 'incomplete';
        }

        const completionTimestamp = new Date().toISOString();
        const finalizedOrder: Order = {
            ...currentOrder,
            status,
            pickedItems: Array.from(pickedItems),
            completionStatus,
            separator: status === 'completed' ? separator?.name : currentUser.name,
            confirmer: status === 'completed' ? confirmer?.name : undefined,
            completionTimestamp,
        };

        if (isSupabaseConfigured()) {
            setIsLoading(true);
            try {
                await supabaseService.updateOrder(finalizedOrder);
                await refreshData();
            } catch(e) {
                setError("Erro ao salvar finalização do pedido.");
            } finally {
                setIsLoading(false);
            }
        }
        
        setCurrentOrder(null);
    };
    
    const handlePromoteOrder = (orderToPromote: Order) => {
        setCurrentOrder(orderToPromote);
        setSelectedHistoryOrder(null);
    };
    
    const handlePersistUsers = async (updatedUsers: User[]) => {
        setUsers(updatedUsers);
        if (isSupabaseConfigured()) {
            for (const u of updatedUsers) {
                await supabaseService.saveUser(u);
            }
        }
    }

    const handleDeleteUser = async (userId: string) => {
        if (isSupabaseConfigured()) {
            await supabaseService.deleteUser(userId);
            const freshUsers = await supabaseService.getUsers();
            setUsers(freshUsers);
        }
    }
    
    const handleSelectHistoryOrder = (order: Order) => {
        setSelectedHistoryOrder(order);
        setView('dashboard');
    };
    
    const handleCloseHistoryDetail = () => {
        setSelectedHistoryOrder(null);
    };

    const handleContinuePicking = (orderToContinue: Order) => {
        setCurrentOrder({ ...orderToContinue, status: 'picking' });
        setSelectedHistoryOrder(null);
    };
    
    const handleCancelHistoryOrder = async (orderToCancel: Order) => {
        const canceledOrder: Order = {
            ...orderToCancel,
            status: 'canceled',
            completionStatus: undefined,
            cancellationReason: 'Cancelado manualmente via painel de histórico',
            completionTimestamp: new Date().toISOString()
        };

        if (isSupabaseConfigured()) {
            setIsLoading(true);
            await supabaseService.updateOrder(canceledOrder);
            await refreshData();
            setIsLoading(false);
        }
        setSelectedHistoryOrder(null);
    };

    // --- RENDER CONDITIONS ---

    if (authLoading) {
         return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#0B1120]">
                <SpinnerIcon className="h-10 w-10 text-blue-500 mb-4" />
                <p className="text-gray-400">Carregando sistema...</p>
            </div>
        );
    }

    // Show Auth Screen if connected to Supabase but not logged in
    if (isSupabaseConfigured() && !session) {
        return <Auth onLoginSuccess={() => {}} />;
    }

    const renderMainContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-10 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-2xl animate-fade-in">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
                        <SpinnerIcon className="relative h-16 w-16 text-blue-400 mb-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Processando</h3>
                    <p className="text-gray-400 max-w-md mx-auto">Aguarde enquanto os dados são atualizados...</p>
                </div>
            );
        }

        if (duplicateCandidate) {
            const { existingOrder } = duplicateCandidate;
            const statusText = existingOrder.status === 'completed' 
                ? (existingOrder.completionStatus === 'complete' ? 'Concluído' : 'Concluído Parcialmente') 
                : (existingOrder.status === 'canceled' ? 'Cancelado' : 'Em Andamento');
            
            return (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] animate-fade-in">
                    <div className="bg-[#1F2937] p-8 rounded-xl border border-yellow-500/30 shadow-2xl max-w-md w-full text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500"></div>
                        <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Pedido Já Existente</h3>
                        <p className="text-gray-400 mb-6">
                            O pedido <span className="text-white font-mono font-bold">{existingOrder.orderId}</span> já foi importado anteriormente.
                            <span className={`block mt-2 font-bold ${
                                existingOrder.status === 'completed' ? 'text-green-400' : 
                                existingOrder.status === 'canceled' ? 'text-red-400' : 'text-blue-400'
                            }`}>
                                {statusText}
                            </span>
                        </p>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => handleConfirmDuplicateAction('resume')} className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2">
                                <HistoryIcon className="h-5 w-5" /> Continuar Existente
                            </button>
                            <button onClick={() => handleConfirmDuplicateAction('overwrite')} className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-lg">Importar como Novo</button>
                            <button onClick={resetToUpload} className="w-full py-3 px-4 bg-gray-800 text-gray-400 text-sm hover:text-white">Cancelar</button>
                        </div>
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="bg-red-900/20 border border-red-500/50 backdrop-blur-md p-6 rounded-xl shadow-xl max-w-2xl mx-auto mt-10">
                    <div className="flex items-start gap-4">
                        <div className="bg-red-500/10 p-3 rounded-full"><ErrorIcon className="h-8 w-8 text-red-500" /></div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-red-200 mb-1">Erro</h3>
                            <p className="text-red-300/80 mb-4">{error}</p>
                            <button onClick={resetToUpload} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg">Voltar</button>
                        </div>
                    </div>
                </div>
            );
        }
        if (view === 'users') return <UserManagement users={users} setUsers={handlePersistUsers} currentUser={currentUser} onSelectUser={() => {}} onDeleteUser={handleDeleteUser} />;
        if (view === 'analytics') return <AnalyticsDashboard history={orderHistory} />;
        if (selectedHistoryOrder) return <HistoryOrderDetail order={selectedHistoryOrder} onClose={handleCloseHistoryDetail} onContinuePicking={handleContinuePicking} onCancel={handleCancelHistoryOrder} />;
        if (currentOrder) return <OrderDashboard order={currentOrder} onFinalize={handleFinalizeOrder} currentUser={currentUser} userList={users} />;
        
        return <FileUpload onFileSelect={handleFileProcess} />;
    };

    const isOnline = isSupabaseConfigured();

    return (
        <div className="min-h-screen bg-[#0B1120] text-gray-200 selection:bg-blue-500/30 selection:text-blue-200 font-sans">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[128px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[128px]"></div>
            </div>

            <header className="sticky top-0 z-50 bg-[#0B1120]/80 backdrop-blur-xl border-b border-gray-800/60 h-16">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-500/10 p-1.5 rounded-lg cursor-pointer" onClick={resetToUpload}>
                            <LogoIcon className="h-6 w-6 text-blue-500" />
                        </div>
                        {isEditingAppName ? (
                            <input 
                                type="text"
                                value={appName}
                                onChange={(e) => setAppName(e.target.value)}
                                onBlur={() => setIsEditingAppName(false)}
                                onKeyDown={(e) => e.key === 'Enter' && setIsEditingAppName(false)}
                                autoFocus
                                className="bg-gray-800 text-white text-xl font-bold border border-blue-500 rounded px-2 py-0.5 w-64 outline-none"
                            />
                        ) : (
                            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingAppName(true)}>
                                <h1 className="text-xl font-bold tracking-tight text-white">{appName}</h1>
                                <PencilIcon className="h-3 w-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        )}
                    </div>
                    
                     <div className="flex items-center gap-3">
                        <div className={`hidden md:flex items-center gap-2 mr-4 px-3 py-1.5 rounded-lg border ${isOnline ? 'bg-green-500/10 border-green-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
                            <div className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-orange-500'}`}></div>
                            <span className={`text-xs font-bold uppercase tracking-wider ${isOnline ? 'text-green-400' : 'text-orange-400'}`}>
                                {isOnline ? 'NUVEM • SINCRONIZADO' : 'DESCONECTADO'}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 px-2">
                             <span className="text-xs text-gray-400 hidden sm:inline">Olá,</span>
                             <span className="text-sm font-semibold text-white">{currentUser.name}</span>
                        </div>
                        
                        <button onClick={handleLogout} className="text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors border border-red-500/20">Sair</button>

                        <div className="h-6 w-px bg-gray-700 mx-1"></div>

                        <button onClick={() => setView('users')} className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${view === 'users' ? 'bg-gray-800 text-white border border-gray-700' : 'text-gray-400 hover:bg-gray-800/50'}`}>
                            <UserGroupIcon className="h-4 w-4" /><span className="hidden sm:inline">Equipe</span>
                        </button>
                        {orderHistory.length > 0 && (
                            <button onClick={() => setView(view === 'analytics' ? 'dashboard' : 'analytics')} className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${view === 'analytics' ? 'bg-gray-800 text-white border border-gray-700' : 'text-gray-400 hover:bg-gray-800/50'}`}>
                                <ChartBarIcon className="h-4 w-4" /><span className="hidden sm:inline">{view === 'analytics' ? 'Voltar' : 'Relatórios'}</span>
                            </button>
                        )}
                        {(currentOrder || selectedHistoryOrder || view !== 'dashboard') && (
                            <button onClick={resetToUpload} className="ml-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-lg">Novo Pedido</button>
                        )}
                    </div>
                </div>
            </header>
            
            <div className="relative z-10 max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row gap-6 xl:gap-8">
                    <aside className={`lg:w-80 xl:w-96 flex-shrink-0 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] ${view !== 'dashboard' && 'hidden lg:block'}`}>
                       <HistoryPanel history={orderHistory} queue={incomingQueue} onSelectOrder={handleSelectHistoryOrder} onPromoteOrder={handlePromoteOrder} selectedOrder={selectedHistoryOrder} />
                    </aside>
                    <main className="flex-1 min-w-0">{renderMainContent()}</main>
                </div>
            </div>
        </div>
    );
};

export default App;
