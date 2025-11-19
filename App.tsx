import React, { useState, useCallback, useEffect } from 'react';
import { Order, User } from './types';
import { extractOrderDataFromFile } from './services/geminiService';
import FileUpload from './components/FileUpload';
import OrderDashboard from './components/OrderDashboard';
import HistoryPanel from './components/HistoryPanel';
import HistoryOrderDetail from './components/HistoryOrderDetail';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import UserManagement from './components/UserManagement';
import { LogoIcon, ErrorIcon, SpinnerIcon, ChartBarIcon, UserGroupIcon } from './components/Icons';

const MOCK_USERS: User[] = [
    { id: 'user1', name: 'Ana Costa', role: 'confirmer' },
    { id: 'user2', name: 'Bruno Lima', role: 'confirmer' },
    { id: 'user3', name: 'Carlos Dias', role: 'separator' },
    { id: 'user4', name: 'Fernanda Souza', role: 'confirmer' },
    { id: 'user5', name: 'João Silva', role: 'separator' },
];

/**
 * Custom hook for persisting state to localStorage and syncing across tabs.
 * @param key The key to use in localStorage.
 * @param defaultValue The default value if nothing is found in localStorage.
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

    // Listen for changes in other tabs to enable real-time sync
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === key && event.newValue) {
                try {
                    setState(JSON.parse(event.newValue));
                } catch (error) {
                    console.error(`Error parsing stored value on storage event for key “${key}”:`, error);
                }
            } else if (event.key === key && !event.newValue) {
                // Item was removed or cleared in another tab
                 setState(defaultValue);
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [key, defaultValue]);

    return [state, setState];
}


const App: React.FC = () => {
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'dashboard' | 'analytics' | 'users'>('dashboard');

    // Use the custom hook for persistent state
    const [orderHistory, setOrderHistory] = usePersistentState<Order[]>('orderHistory', []);
    const [users, setUsers] = usePersistentState<User[]>('users', MOCK_USERS);
    const [currentUser, setCurrentUser] = usePersistentState<User>('currentUser', MOCK_USERS[4]);
    
    const handleFileProcess = useCallback(async (file: File) => {
        setIsLoading(true);
        setError(null);
        setCurrentOrder(null);
        setSelectedHistoryOrder(null);
        setView('dashboard');

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                try {
                    const base64File = (reader.result as string).split(',')[1];
                    const orderData = await extractOrderDataFromFile(base64File, file.type);
                    setCurrentOrder({ ...orderData, status: 'picking', timestamp: new Date().toISOString() });
                } catch (e) {
                    console.error(e);
                    setError('Falha ao processar o arquivo com a IA. Verifique o formato do arquivo e tente novamente.');
                } finally {
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
    }, []);

    const resetToUpload = () => {
        setCurrentOrder(null);
        setSelectedHistoryOrder(null);
        setError(null);
        setIsLoading(false);
        setView('dashboard');
    };

    const handleFinalizeOrder = (status: 'completed' | 'canceled', pickedItems: Set<string>, separator?: User, confirmer?: User) => {
        if (!currentOrder) return;
        
        let completionStatus: 'complete' | 'incomplete' | undefined = undefined;
        if (status === 'completed') {
            completionStatus = pickedItems.size === currentOrder.items.length ? 'complete' : 'incomplete';
        }

        const finalizedOrder: Order = {
            ...currentOrder,
            status,
            pickedItems: Array.from(pickedItems),
            completionStatus,
            separator: status === 'completed' ? separator?.name : currentUser.name,
            confirmer: status === 'completed' ? confirmer?.name : undefined,
            completionTimestamp: new Date().toISOString(),
        };
        setOrderHistory(prev => [finalizedOrder, ...prev.slice(0, 19)]); // Keep history of last 20 orders
        setCurrentOrder(null);
    };
    
    const handleSelectHistoryOrder = (order: Order) => {
        setSelectedHistoryOrder(order);
        setView('dashboard');
    };
    
    const handleCloseHistoryDetail = () => {
        setSelectedHistoryOrder(null);
    };

    const handleContinuePicking = (orderToContinue: Order) => {
        setCurrentOrder({ ...orderToContinue, status: 'picking' });
        setOrderHistory(prev => prev.filter(o => !(o.orderId === orderToContinue.orderId && o.timestamp === orderToContinue.timestamp)));
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
                    <h3 className="text-2xl font-bold text-white mb-2">Processando Documento</h3>
                    <p className="text-gray-400 max-w-md mx-auto">A inteligência artificial está analisando a estrutura do seu arquivo para extrair os itens do pedido. Isso levará apenas alguns segundos.</p>
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
                            <h3 className="text-lg font-bold text-red-200 mb-1">Falha no Processamento</h3>
                            <p className="text-red-300/80 mb-4">{error}</p>
                            <button 
                                onClick={resetToUpload} 
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-red-900/20"
                            >
                                Tentar Novamente
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
                    setUsers={setUsers} 
                    currentUser={currentUser} 
                    onSelectUser={setCurrentUser} 
                />
            );
        }
        if (view === 'analytics') {
            return <AnalyticsDashboard history={orderHistory} />;
        }
        if (selectedHistoryOrder) {
            return <HistoryOrderDetail order={selectedHistoryOrder} onClose={handleCloseHistoryDetail} onContinuePicking={handleContinuePicking} />;
        }
        if (currentOrder) {
            return <OrderDashboard order={currentOrder} onFinalize={handleFinalizeOrder} currentUser={currentUser} userList={users} />;
        }
        return <FileUpload onFileSelect={handleFileProcess} />;
    };

    return (
        <div className="min-h-screen bg-[#0B1120] text-gray-200 selection:bg-blue-500/30 selection:text-blue-200 font-sans">
            {/* Background ambient glow */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[128px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[128px]"></div>
            </div>

            <header className="sticky top-0 z-50 bg-[#0B1120]/80 backdrop-blur-xl border-b border-gray-800/60 supports-[backdrop-filter]:bg-[#0B1120]/60 no-print">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={resetToUpload}>
                        <div className="bg-blue-500/10 p-1.5 rounded-lg">
                            <LogoIcon className="h-6 w-6 text-blue-500" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-white">
                            Logi<span className="text-blue-500">Track</span>
                        </h1>
                    </div>
                    
                     <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2 mr-4 px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700/50">
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
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
                    <aside className={`lg:w-80 xl:w-96 flex-shrink-0 no-print ${view !== 'dashboard' && 'hidden lg:block'}`}>
                       <HistoryPanel 
                         history={orderHistory}
                         onSelectOrder={handleSelectHistoryOrder}
                         selectedOrderId={selectedHistoryOrder?.orderId}
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