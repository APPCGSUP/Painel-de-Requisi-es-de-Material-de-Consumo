import React, { useState, useCallback } from 'react';
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
    { id: 'currentUser', name: 'João Silva', role: 'separator' },
];

const CURRENT_USER: User = { id: 'currentUser', name: 'João Silva', role: 'separator' };

const App: React.FC = () => {
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<Order | null>(null);
    const [orderHistory, setOrderHistory] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'dashboard' | 'analytics' | 'users'>('dashboard');
    const [users, setUsers] = useState<User[]>(MOCK_USERS);

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
            separator: status === 'completed' ? separator?.name : CURRENT_USER.name,
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
                <div className="flex flex-col items-center justify-center text-center p-10 bg-gray-800 rounded-lg shadow-2xl">
                    <SpinnerIcon className="h-12 w-12 text-blue-500 mb-4" />
                    <p className="text-lg font-medium text-gray-300">Analisando documento...</p>
                    <p className="text-sm text-gray-400">Aguarde, a inteligência artificial está extraindo os dados do pedido.</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg shadow-lg">
                    <div className="flex items-center">
                        <ErrorIcon className="h-6 w-6 text-red-500 mr-3" />
                        <div>
                            <p className="text-md font-semibold text-red-200">Ocorreu um erro</p>
                            <p className="text-sm">{error}</p>
                            <button onClick={resetToUpload} className="mt-2 text-sm font-semibold text-red-200 hover:underline">Tentar novamente</button>
                        </div>
                    </div>
                </div>
            );
        }
        if (view === 'users') {
            return <UserManagement users={users} setUsers={setUsers} />;
        }
        if (view === 'analytics') {
            return <AnalyticsDashboard history={orderHistory} />;
        }
        if (selectedHistoryOrder) {
            return <HistoryOrderDetail order={selectedHistoryOrder} onClose={handleCloseHistoryDetail} onContinuePicking={handleContinuePicking} />;
        }
        if (currentOrder) {
            return <OrderDashboard order={currentOrder} onFinalize={handleFinalizeOrder} currentUser={CURRENT_USER} userList={users} />;
        }
        return <FileUpload onFileSelect={handleFileProcess} />;
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 selection:bg-blue-500 selection:text-white">
            <header className="bg-gray-900/70 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-700 no-print">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <LogoIcon className="h-8 w-auto text-blue-500" />
                        <h1 className="text-2xl font-bold text-gray-100">Painel de Separação</h1>
                    </div>
                     <div className="flex items-center gap-4">
                        <button
                            onClick={() => setView('users')}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 text-gray-300 font-semibold rounded-md border border-gray-600 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-colors"
                        >
                            <UserGroupIcon className="h-5 w-5" />
                            Gerenciar Usuários
                        </button>
                        {orderHistory.length > 0 && (
                            <button
                                onClick={() => setView(view === 'analytics' ? 'dashboard' : 'analytics')}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 text-gray-300 font-semibold rounded-md border border-gray-600 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-colors"
                            >
                                <ChartBarIcon className="h-5 w-5" />
                                {view === 'analytics' ? 'Voltar ao Painel' : 'Análises'}
                            </button>
                        )}
                        {(currentOrder || selectedHistoryOrder || view !== 'dashboard') && (
                            <button
                                onClick={resetToUpload}
                                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-colors"
                            >
                                Carregar Novo Pedido
                            </button>
                        )}
                    </div>
                </div>
            </header>
            
            <div className="max-w-screen-2xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    <aside className={`lg:w-1/4 xl:w-1/5 no-print ${view !== 'dashboard' && 'hidden'}`}>
                       <HistoryPanel 
                         history={orderHistory}
                         onSelectOrder={handleSelectHistoryOrder}
                         selectedOrderId={selectedHistoryOrder?.orderId}
                       />
                    </aside>
                    <main className="flex-1">
                       {renderMainContent()}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default App;