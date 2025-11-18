import React, { useState, useMemo } from 'react';
import { Order, User } from '../types';
import OrderItemCard from './OrderItemCard';
import ProgressBar from './ProgressBar';
import { XCircleIcon, CheckCircleIcon, CheckBadgeIcon } from './Icons';

interface OrderDashboardProps {
    order: Order;
    onFinalize: (status: 'completed' | 'canceled', pickedItems: Set<string>, separator?: User, confirmer?: User) => void;
    currentUser: User;
    userList: User[];
}

const OrderDashboard: React.FC<OrderDashboardProps> = ({ order, onFinalize, currentUser, userList }) => {
    const [pickedItems, setPickedItems] = useState<Set<string>>(() => new Set(order.pickedItems || []));
    const [pickerConfirmed, setPickerConfirmed] = useState(false);
    const [checkerConfirmed, setCheckerConfirmed] = useState(false);
    const [selectedSeparatorId, setSelectedSeparatorId] = useState<string>(currentUser.id);
    const [selectedConfirmerId, setSelectedConfirmerId] = useState<string>('');
    
    const separatorList = useMemo(() => userList.filter(u => u.role === 'separator'), [userList]);
    const confirmerList = useMemo(() => userList.filter(u => u.role === 'confirmer'), [userList]);

    const handleTogglePicked = (itemNo: string) => {
        if (pickerConfirmed) return; // Cannot change after confirmation
        setPickedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemNo)) {
                newSet.delete(itemNo);
            } else {
                newSet.add(itemNo);
            }
            return newSet;
        });
    };

    const handleFinalization = () => {
        if (!pickerConfirmed || !checkerConfirmed || !selectedConfirmerId || !selectedSeparatorId) {
            alert('A confirmação do separador e do conferente é necessária.');
            return;
        }
        const separator = userList.find(u => u.id === selectedSeparatorId);
        const confirmer = userList.find(u => u.id === selectedConfirmerId);
        onFinalize('completed', pickedItems, separator, confirmer);
    };

    const progress = useMemo(() => {
        if (order.items.length === 0) return 100;
        return (pickedItems.size / order.items.length) * 100;
    }, [pickedItems, order.items.length]);
    
    const sortedItems = useMemo(() => {
        return [...order.items].sort((a, b) => a.location.localeCompare(b.location));
    }, [order.items]);

    const allStepsConfirmed = pickerConfirmed && checkerConfirmed && !!selectedConfirmerId && !!selectedSeparatorId;

    return (
        <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <h3 className="text-sm font-medium text-gray-400">Nº do Pedido</h3>
                        <p className="mt-1 text-xl font-bold text-blue-400">{order.orderId}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-400">Solicitante</h3>
                        <p className="mt-1 text-lg font-semibold text-gray-200">{order.requester}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-400">Setor de Destino</h3>
                        <p className="mt-1 text-lg font-semibold text-gray-200">{order.destinationSector}</p>
                    </div>
                </div>
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium text-gray-400">Progresso da Separação</h3>
                        <span className="text-sm font-semibold text-blue-400">{pickedItems.size} de {order.items.length} itens</span>
                    </div>
                    <ProgressBar progress={progress} />
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                <h3 className="text-lg font-bold text-gray-200 mb-4">Confirmação de Etapas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-b border-gray-700 py-6">
                    {/* Picker Confirmation */}
                    <div className="space-y-3">
                        <label htmlFor="separator" className="block text-md font-medium text-gray-300">1. Separação</label>
                        <select
                            id="separator"
                            value={selectedSeparatorId}
                            onChange={(e) => setSelectedSeparatorId(e.target.value)}
                            disabled={pickerConfirmed}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-700/50 disabled:text-gray-400"
                        >
                            <option value="" disabled>Selecione um separador...</option>
                            {separatorList.map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => setPickerConfirmed(true)}
                            disabled={pickerConfirmed || !selectedSeparatorId}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 font-semibold rounded-md transition-colors disabled:cursor-not-allowed border
                                        enabled:bg-blue-600 enabled:hover:bg-blue-700 enabled:text-white enabled:border-blue-500
                                        disabled:bg-green-600/30 disabled:text-green-200 disabled:border-green-500/50"
                        >
                            <CheckBadgeIcon className="h-5 w-5" />
                            {pickerConfirmed ? 'Separação Confirmada' : 'Confirmar Separação'}
                        </button>
                    </div>
                    
                    {/* Checker Confirmation */}
                    <div className="space-y-3">
                        <label htmlFor="confirmer" className={`block text-md font-medium ${pickerConfirmed ? 'text-gray-300' : 'text-gray-500'}`}>2. Conferência</label>
                        <select 
                            id="confirmer"
                            value={selectedConfirmerId}
                            onChange={(e) => setSelectedConfirmerId(e.target.value)}
                            disabled={!pickerConfirmed || checkerConfirmed}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-700/50 disabled:text-gray-400"
                        >
                            <option value="" disabled>Selecione um conferente...</option>
                            {confirmerList.map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </select>
                         <button
                            onClick={() => setCheckerConfirmed(true)}
                            disabled={!pickerConfirmed || !selectedConfirmerId || checkerConfirmed}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 font-semibold rounded-md transition-colors disabled:cursor-not-allowed border
                                        enabled:bg-blue-600 enabled:hover:bg-blue-700 enabled:text-white enabled:border-blue-500
                                        disabled:bg-gray-600/50 disabled:text-gray-400 disabled:border-gray-500/50
                                        data-[confirmed='true']:bg-green-600/30 data-[confirmed='true']:text-green-200 data-[confirmed='true']:border-green-500/50"
                            data-confirmed={checkerConfirmed}
                        >
                            <CheckBadgeIcon className="h-5 w-5" />
                            {checkerConfirmed ? 'Conferência Confirmada' : 'Confirmar Conferência'}
                        </button>
                    </div>
                </div>
                 <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-end">
                    <button 
                        onClick={() => onFinalize('canceled', pickedItems)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600/20 text-red-300 font-semibold rounded-md border border-red-500/50 hover:bg-red-500/30 hover:text-red-200"
                    >
                        <XCircleIcon className="h-5 w-5" />
                        Cancelar Pedido
                    </button>
                    <button
                        onClick={handleFinalization}
                        disabled={!allStepsConfirmed}
                        className="flex items-center justify-center gap-2 px-4 py-2 font-semibold rounded-md border transition-all 
                                    enabled:bg-green-600/20 enabled:text-green-300 enabled:border-green-500/50 enabled:hover:bg-green-500/30 enabled:hover:text-green-200
                                    disabled:bg-gray-600/50 disabled:text-gray-400 disabled:border-gray-500/50 disabled:cursor-not-allowed"
                        title={allStepsConfirmed ? "Finalizar separação do pedido" : "Aguardando todas as confirmações"}
                    >
                         <CheckCircleIcon className="h-5 w-5" />
                        Concluir Pedido
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {sortedItems.map(item => (
                    <OrderItemCard
                        key={item.itemNo}
                        item={item}
                        isPicked={pickedItems.has(item.itemNo)}
                        onTogglePicked={handleTogglePicked}
                        isReadOnly={pickerConfirmed}
                    />
                ))}
            </div>
        </div>
    );
};

export default OrderDashboard;