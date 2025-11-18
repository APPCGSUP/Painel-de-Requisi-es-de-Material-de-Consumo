import React, { useState, useMemo } from 'react';
import { Order, User } from '../types';
import OrderItemCard from './OrderItemCard';
import ProgressBar from './ProgressBar';
import { XCircleIcon, CheckCircleIcon, CheckBadgeIcon, UserGroupIcon } from './Icons';

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
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header Stats & Progress */}
            <div className="bg-[#1F2937]/60 backdrop-blur-md rounded-xl border border-gray-700/50 overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-gray-700/50">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-2 text-gray-400 text-sm uppercase tracking-wider font-bold mb-1">
                                <span>Pedido</span>
                                <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs border border-blue-500/20">{order.orderId}</span>
                            </div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                {order.requester}
                                <span className="text-gray-500 font-normal text-lg">/</span>
                                <span className="text-gray-300 font-normal">{order.destinationSector}</span>
                            </h2>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-white tabular-nums tracking-tight">
                                <span className={pickedItems.size === order.items.length ? "text-green-400" : "text-blue-400"}>
                                    {pickedItems.size}
                                </span>
                                <span className="text-gray-600 mx-1">/</span>
                                <span className="text-gray-400">{order.items.length}</span>
                            </div>
                            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">Itens Separados</div>
                        </div>
                    </div>
                    <ProgressBar progress={progress} />
                </div>
                
                {/* Workflow Actions */}
                <div className="bg-[#111827]/50 p-6">
                    <div className="flex items-center gap-2 mb-4 text-gray-400 text-sm font-semibold uppercase tracking-wider">
                         <UserGroupIcon className="h-4 w-4" />
                         Fluxo de Validação
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Picker Step */}
                        <div className={`
                            relative p-4 rounded-lg border transition-all duration-300
                            ${pickerConfirmed ? 'bg-green-900/10 border-green-500/30' : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'}
                        `}>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-gray-300">1. Responsável pela Separação</label>
                                {pickerConfirmed && <CheckBadgeIcon className="h-5 w-5 text-green-500" />}
                            </div>
                            <div className="flex gap-3">
                                <select
                                    value={selectedSeparatorId}
                                    onChange={(e) => setSelectedSeparatorId(e.target.value)}
                                    disabled={pickerConfirmed}
                                    className="flex-1 bg-[#111827] border border-gray-600 text-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:opacity-50"
                                >
                                    <option value="" disabled>Selecione...</option>
                                    {separatorList.map(user => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => setPickerConfirmed(true)}
                                    disabled={pickerConfirmed || !selectedSeparatorId}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
                                        ${pickerConfirmed 
                                            ? 'bg-green-500/20 text-green-400 cursor-default border border-green-500/20' 
                                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed'}
                                    `}
                                >
                                    {pickerConfirmed ? 'Confirmado' : 'Assinar'}
                                </button>
                            </div>
                        </div>
                        
                        {/* Checker Step */}
                        <div className={`
                            relative p-4 rounded-lg border transition-all duration-300
                            ${checkerConfirmed ? 'bg-green-900/10 border-green-500/30' : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'}
                            ${!pickerConfirmed && 'opacity-50 grayscale'}
                        `}>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-gray-300">2. Responsável pela Conferência</label>
                                {checkerConfirmed && <CheckBadgeIcon className="h-5 w-5 text-green-500" />}
                            </div>
                            <div className="flex gap-3">
                                <select 
                                    value={selectedConfirmerId}
                                    onChange={(e) => setSelectedConfirmerId(e.target.value)}
                                    disabled={!pickerConfirmed || checkerConfirmed}
                                    className="flex-1 bg-[#111827] border border-gray-600 text-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:opacity-50"
                                >
                                    <option value="" disabled>Selecione...</option>
                                    {confirmerList.map(user => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </select>
                                 <button
                                    onClick={() => setCheckerConfirmed(true)}
                                    disabled={!pickerConfirmed || !selectedConfirmerId || checkerConfirmed}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
                                        ${checkerConfirmed
                                            ? 'bg-green-500/20 text-green-400 cursor-default border border-green-500/20' 
                                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 disabled:bg-gray-700 disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed'}
                                    `}
                                >
                                    {checkerConfirmed ? 'Confirmado' : 'Assinar'}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-gray-700/50 flex justify-end items-center gap-4">
                        <button 
                            onClick={() => onFinalize('canceled', pickedItems)}
                            className="text-gray-400 hover:text-red-400 text-sm font-medium transition-colors flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10"
                        >
                            <XCircleIcon className="h-5 w-5" />
                            Cancelar Pedido
                        </button>
                        <button
                            onClick={handleFinalization}
                            disabled={!allStepsConfirmed}
                            className={`
                                flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-xl transition-all duration-300 transform
                                ${allStepsConfirmed 
                                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:scale-[1.02] shadow-green-900/20' 
                                    : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-70'}
                            `}
                        >
                             <CheckCircleIcon className="h-5 w-5" />
                             {allStepsConfirmed ? 'Finalizar Processo' : 'Aguardando Assinaturas'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Items Grid */}
            <div>
                <div className="flex justify-between items-end mb-4">
                     <h3 className="text-lg font-bold text-white">Lista de Separação</h3>
                     <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Ordenado por Localização</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
        </div>
    );
};

export default OrderDashboard;