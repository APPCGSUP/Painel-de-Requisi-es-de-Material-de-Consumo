
import React, { useState, useCallback, useEffect } from 'react';
import { Order, User } from './types';
import { extractOrderDataFromFile } from './services/geminiService';
import { supabaseService } from './services/supabaseService';
import { isSupabaseConfigured } from './services/supabaseClient';
import FileUpload from './components/FileUpload';
import OrderDashboard from './components/OrderDashboard';
import HistoryPanel from './components/HistoryPanel';
import HistoryOrderDetail from './components/HistoryOrderDetail';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import UserManagement from './components/UserManagement';
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
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'dashboard' | 'analytics' | 'users'>('dashboard');
    
    // State for duplicate detection
    const [duplicateCandidate, setDuplicateCandidate] = useState<{ newOrder: Order, existingOrder: Order } | null>(null);
    
    // State for App Name Editing
    const [isEditingAppName, setIsEditingAppName] = useState(false);

    // Data states - Now initialized empty, filled via Supabase or LocalStorage fallback
    const [orderHistory, setOrderHistory] = useState<Order[]>([]);
    const [incomingQueue, setIncomingQueue] = useState<Order[]>([]);
    const [users, setUsers] = useState<User[]>(MOCK_USERS);

    // Preferences
    const [currentUser, setCurrentUser] = usePersistentState<User>('currentUser', MOCK_USERS[4]);
    const [appName, setAppName] = usePersistentState<string>('appName', 'LogiTrack');

    // Initialize Data from Supabase
    useEffect(() => {
        const loadData = async () => {
            if (!isSupabaseConfigured()) {
                // Fallback to LocalStorage if Supabase Key is missing
                const storedHistory = localStorage.getItem('orderHistory');
                const storedQueue = localStorage.getItem('incomingQueue');
                const storedUsers = localStorage.getItem('users');
                
                if (storedHistory) setOrderHistory(JSON.parse(storedHistory));
                if (storedQueue) setIncomingQueue(JSON.parse(storedQueue));
                if (storedUsers) setUsers(JSON.parse(storedUsers));
                return;
            }

            try {
                setIsLoading(true);
                const [fetchedOrders, fetchedUsers] = await Promise.all([
                    supabaseService.getOrders(),
                    supabaseService.getUsers()
                ]);

                if (fetchedUsers.length > 0) {
                    setUsers(fetchedUsers);
                }

                // Separate History (Completed/Canceled) from Queue (Picking)
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
        };

        loadData();
    }, []);

    // Refresh helper
    const refreshData = async () => {
        if (!isSupabaseConfigured()) return; // Local state is updated manually in fallback mode
        
        const fetchedOrders = await supabaseService.getOrders();
        const history = fetchedOrders.filter(o => o.status === 'completed' || o.status === 'canceled');
        const queue = fetchedOrders.filter(o => o.status === 'picking');
        setOrderHistory(history);
        setIncomingQueue(queue);
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
                    
                    // Checks against current in-memory state (which mirrors DB)
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
                        } else {
                            // Local Fallback
                            setIncomingQueue(prev => {
                                const updated = [...prev, newOrder];
                                localStorage.setItem('incomingQueue', JSON.stringify(updated));
                                return updated;
                            });
                        }
                        
                        setIsLoading(false);
                        setView('dashboard');
                    }
                } catch (e) {
                    console.error(e);
                    setError('Falha ao processar o arquivo com a IA. Verifique o formato do arquivo e tente novamente.');
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
            } else {
                setIncomingQueue(prev => {
                    const updated = [...prev, newOrder];
                    localStorage.setItem('incomingQueue', JSON.stringify(updated));
                    return updated;
                });
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
        } else {
            // Local Fallback
            setOrderHistory(prev => {
                const existingIndex = prev.findIndex(o => o.orderId === finalizedOrder.orderId && o.timestamp === finalizedOrder.timestamp);
                let updatedHistory;
                if (existingIndex >= 0) {
                    updatedHistory = [...prev];
                    updatedHistory[existingIndex] = finalizedOrder;
                } else {
                    updatedHistory = [finalizedOrder, ...prev];
                }
                localStorage.setItem('orderHistory', JSON.stringify(updatedHistory));
                return updatedHistory;
            });
            // Remove from queue locally if it was there (though currentOrder usually implies it's active)
            setIncomingQueue(prev => {
                const updated = prev.filter(o => o.orderId !== finalizedOrder.orderId);
                localStorage.setItem('incomingQueue', JSON.stringify(updated));
                return updated;
            });
        }
        
        setCurrentOrder(null);
    };
    
    const handlePromoteOrder = (orderToPromote: Order) => {
        // Sets local viewing state only. 
        // In a real multi-user realtime app, we would update status to 'in_progress' in DB.
        // For this version, we just bring it to the "Active Stage" locally.
        setCurrentOrder(orderToPromote);
        setSelectedHistoryOrder(null);
    };
    
    const handlePersistUsers = async (updatedUsers: User[]) => {
        // This handler is now slightly complex because UserManagement passes the whole array.
        // We will optimize by just setting state locally for immediate UI feedback,
        // but in a real app we should handle add/update per user event.
        
        // Since UserManagement component logic sends the whole list, let's just fetch fresh from DB if using Supabase,
        // but UserManagement needs refactoring to call single saveUser.
        // For now, we will assume UserManagement component calls this after local modification.
        
        // To support the existing UserManagement interface, we need to identify what changed,
        // or simply iterate and upsert all (inefficient but works for small lists).
        
        setUsers(updatedUsers); // Optimistic update
        
        if (isSupabaseConfigured()) {
            // Find the new or updated user? 
            // For simplicity, we will save ALL users to ensure sync.
            for (const u of updatedUsers) {
                await supabaseService.saveUser(u);
            }
        } else {
            localStorage.setItem('users', JSON.stringify(updatedUsers));
        }
    }

    const handleDeleteUser = async (userId: string) => {
        if (isSupabaseConfigured()) {
            await supabaseService.deleteUser(userId);
            const freshUsers = await supabaseService.getUsers();
            setUsers(freshUsers);
        } else {
            const newUsers = users.filter(u => u.id !== userId);
            setUsers(newUsers);
            localStorage.setItem('users', JSON.stringify(newUsers));
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
        // In DB it stays 'completed' until finalized again? 
        // Or should we update DB to 'picking'? 
        // Let's keep it simple: It's a local "Reopen". When finalized again, it updates the record.
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
        } else {
            setOrderHistory(prev => {
                const updated = prev.map(o => {
                    if (o.orderId === orderToCancel.orderId && o.timestamp === orderToCancel.timestamp) {
                        return canceledOrder;
                    }
                    return o;
                });
                localStorage.setItem('orderHistory', JSON.stringify(updated));
                return updated;
            });
        }
        setSelectedHistoryOrder(null);
    };

    const renderMainContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-10 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-2xl animate-fade-in">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
                        <SpinnerIcon className="relative h-16 w-16 text-blue-400 mb-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Sincronizando Dados</h3>
                    <p className="text-gray-400 max-w-md mx-auto">Processando informações com o servidor...</p>
                </div>
            );
        }

        // Duplicate Warning Modal
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
                            O pedido <span className="text-white font-mono font-bold">{existingOrder.orderId}</span> já foi importado anteriormente e está com status: <br/>
                            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-bold border ${
                                existingOrder.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                                existingOrder.status === 'canceled' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}>
                                {statusText}
                            </span>
                        </p>
                        
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => handleConfirmDuplicateAction('resume')}
                                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-colors"
                            >
                                <HistoryIcon className="h-5 w-5" />
                                Continuar Existente
                            </button>
                            <button 
                                onClick={() => handleConfirmDuplicateAction('overwrite')}
                                className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-lg transition-colors"
                            >
                                Importar como Novo (Fila)
                            </button>
                            <button 
                                onClick={resetToUpload}
                                className="w-full py-3 px-4 bg-gray-800 text-gray-400 text-sm hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="bg-red-900/20 border border-red-500/50 backdrop-blur-md p-6 rounded-xl shadow-xl max-w-2xl mx-auto mt-10">
                    <div className="flex items-start gap-4">
                        <div className="bg-red-500/10 p-3 rounded-full">
                             <ErrorIcon className="h-8 w-8 text-red-500" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-red-200 mb-1">Erro</h3>
                            <p className="text-red-300/80 mb-4">{error}</p>
                            <button 
                                onClick={resetToUpload} 
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-red-900/20"
                            >
                                Voltar
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        if (view === 'users') {
            return (
                <UserManagement 
                    users={users} 
                    setUsers={handlePersistUsers} 
                    currentUser={currentUser} 
                    onSelectUser={setCurrentUser} 
                    onDeleteUser={handleDeleteUser}
                />
            );
        }
        if (view === 'analytics') {
            return <AnalyticsDashboard history={orderHistory} />;
        }
        if (selectedHistoryOrder) {
            return <HistoryOrderDetail 
                order={selectedHistoryOrder} 
                onClose={handleCloseHistoryDetail} 
                onContinuePicking={handleContinuePicking}
                onCancel={handleCancelHistoryOrder}
            />;
        }
        if (currentOrder) {
            return <OrderDashboard order={currentOrder} onFinalize={handleFinalizeOrder} currentUser={currentUser} userList={users} />;
        }
        
        // Default view is upload
        return <FileUpload onFileSelect={handleFileProcess} />;
    };

    return (
        <div className="min-h-screen bg-[#0B1120] text-gray-200 selection:bg-blue-500/30 selection:text-blue-200 font-sans">
            {/* Background ambient glow */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[128px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[128px]"></div>
            </div>

            <header className="sticky top-0 z-50 bg-[#0B1120]/80 backdrop-blur-xl border-b border-gray-800/60 supports-[backdrop-filter]:bg-[#0B1120]/60 no-print h-16">
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
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') setIsEditingAppName(false);
                                }}
                                autoFocus
                                className="bg-gray-800 text-white text-xl font-bold border border-blue-500 rounded px-2 py-0.5 w-48 outline-none"
                            />
                        ) : (
                            <div 
                                className="flex items-center gap-2 group cursor-pointer" 
                                onClick={() => setIsEditingAppName(true)}
                                title="Clique para editar o nome"
                            >
                                <h1 className="text-xl font-bold tracking-tight text-white">
                                    {appName === 'LogiTrack' ? (
                                        <>Logi<span className="text-blue-500">Track</span></>
                                    ) : (
                                        appName
                                    )}
                                </h1>
                                <PencilIcon className="h-3 w-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        )}
                    </div>
                    
                     <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2 mr-4 px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700/50">
                            <div className={`h-2 w-2 rounded-full ${isSupabaseConfigured() ? 'bg-green-500' : 'bg-orange-500'}`} title={isSupabaseConfigured() ? "Online (Supabase)" : "Offline (Local)"}></div>
                            <span className="text-xs text-gray-400">Logado como:</span>
                            <span className="text-sm font-semibold text-white">{currentUser.name}</span>
                        </div>

                        <button
                            onClick={() => setView('users')}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 border border-transparent
                                ${view === 'users' 
                                    ? 'bg-gray-800 text-white border-gray-700' 
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
                        >
                            <UserGroupIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">Usuários</span>
                        </button>

                        {orderHistory.length > 0 && (
                            <button
                                onClick={() => setView(view === 'analytics' ? 'dashboard' : 'analytics')}
                                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 border border-transparent
                                    ${view === 'analytics'
                                        ? 'bg-gray-800 text-white border-gray-700' 
                                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
                            >
                                <ChartBarIcon className="h-4 w-4" />
                                <span className="hidden sm:inline">{view === 'analytics' ? 'Voltar' : 'Relatórios'}</span>
                            </button>
                        )}
                        
                        {(currentOrder || selectedHistoryOrder || view !== 'dashboard') && (
                            <button
                                onClick={resetToUpload}
                                className="ml-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-900/20 transition-all hover:shadow-blue-500/20 hover:-translate-y-0.5 active:translate-y-0"
                            >
                                Novo Pedido
                            </button>
                        )}
                    </div>
                </div>
            </header>
            
            <div className="relative z-10 max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row gap-6 xl:gap-8">
                    <aside className={`lg:w-80 xl:w-96 flex-shrink-0 no-print lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] ${view !== 'dashboard' && 'hidden lg:block'}`}>
                       <HistoryPanel 
                         history={orderHistory}
                         queue={incomingQueue}
                         onSelectOrder={handleSelectHistoryOrder}
                         onPromoteOrder={handlePromoteOrder}
                         selectedOrder={selectedHistoryOrder}
                       />
                    </aside>
                    <main className="flex-1 min-w-0">
                       {renderMainContent()}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default App;
