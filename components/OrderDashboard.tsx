import React, { useState, useMemo } from 'react';
import { Order } from '../types';
import OrderItemCard from './OrderItemCard';
import ProgressBar from './ProgressBar';
import { XCircleIcon, CheckCircleIcon } from './Icons';

interface OrderDashboardProps {
    order: Order;
    onFinalize: (status: 'completed' | 'canceled', pickedItems: Set<string>) => void;
}

const OrderDashboard: React.FC<OrderDashboardProps> = ({ order, onFinalize }) => {
    // Inicializa o estado com os itens já separados, caso o pedido esteja sendo continuado.
    const [pickedItems, setPickedItems] = useState<Set<string>>(() => new Set(order.pickedItems || []));

    const handleTogglePicked = (itemNo: string) => {
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

    const progress = useMemo(() => {
        if (order.items.length === 0) return 100;
        return (pickedItems.size / order.items.length) * 100;
    }, [pickedItems, order.items.length]);
    
    const sortedItems = useMemo(() => {
        return [...order.items].sort((a, b) => a.location.localeCompare(b.location));
    }, [order.items]);

    const allItemsPicked = progress === 100;

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
                <div className="mt-6 pt-6 border-t border-gray-700 flex flex-col sm:flex-row gap-4 justify-end">
                    <button 
                        onClick={() => onFinalize('canceled', pickedItems)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600/20 text-red-300 font-semibold rounded-md border border-red-500/50 hover:bg-red-500/30 hover:text-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 transition-all"
                    >
                        <XCircleIcon className="h-5 w-5" />
                        Cancelar Pedido
                    </button>
                    <button
                        onClick={() => onFinalize('completed', pickedItems)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600/20 text-green-300 font-semibold rounded-md border border-green-500/50 transition-all hover:bg-green-500/30 hover:text-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500"
                        title={allItemsPicked ? "Finalizar separação do pedido" : "Finalizar com itens pendentes"}
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
                    />
                ))}
            </div>
        </div>
    );
};

export default OrderDashboard;