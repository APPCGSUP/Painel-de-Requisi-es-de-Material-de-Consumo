import React, { useMemo } from 'react';
import { Order } from '../types';
import OrderItemCard from './OrderItemCard';
import ProgressBar from './ProgressBar';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, HistoryIcon } from './Icons';

interface HistoryOrderDetailProps {
    order: Order;
    onClose: () => void;
    onContinuePicking: (order: Order) => void;
}

const HistoryOrderDetail: React.FC<HistoryOrderDetailProps> = ({ order, onClose, onContinuePicking }) => {
    
    const pickedItemsSet = useMemo(() => new Set(order.pickedItems || []), [order.pickedItems]);

    const progress = useMemo(() => {
        if (order.items.length === 0) return 100;
        return (pickedItemsSet.size / order.items.length) * 100;
    }, [pickedItemsSet, order.items.length]);

    const sortedItems = useMemo(() => {
        return [...order.items].sort((a, b) => a.location.localeCompare(b.location));
    }, [order.items]);

    const formatTimestamp = (isoString?: string, type: 'date' | 'time' = 'date') => {
        if (!isoString) return '-';
        const date = new Date(isoString);
        if (type === 'date') {
            return date.toLocaleDateString('pt-BR');
        }
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };
    
    const StatusBadge = () => {
        if (order.status === 'completed') {
            const isComplete = order.completionStatus === 'complete';
            return (
                <div className={`flex items-center gap-2 font-bold text-lg ${isComplete ? 'text-green-400' : 'text-yellow-400'}`}>
                    {isComplete ? <CheckCircleIcon className="h-6 w-6" /> : <ExclamationTriangleIcon className="h-6 w-6" />}
                    <span>{isComplete ? 'Concluído (Completo)' : 'Concluído (Incompleto)'}</span>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-2 text-red-400">
                <XCircleIcon className="h-6 w-6" />
                <span className="text-lg font-bold">Pedido Cancelado</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                    <div>
                        <h3 className="text-sm font-medium text-gray-400">Detalhes do Pedido</h3>
                        <p className="mt-1 text-2xl font-bold text-blue-400">{order.orderId}</p>
                    </div>
                    <StatusBadge />
                </div>

                {order.status === 'canceled' && order.cancellationReason && (
                    <div className="mb-6 bg-red-900/20 border border-red-800 p-4 rounded-lg">
                        <h4 className="text-md font-semibold text-red-300 mb-1">Motivo do Cancelamento</h4>
                        <p className="text-sm text-red-200 whitespace-pre-wrap">{order.cancellationReason}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <h3 className="text-sm font-medium text-gray-400">Solicitante</h3>
                        <p className="mt-1 text-lg font-semibold text-gray-200">{order.requester}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-400">Setor de Destino</h3>
                        <p className="mt-1 text-lg font-semibold text-gray-200">{order.destinationSector}</p>
                    </div>
                     <div>
                        <h3 className="text-sm font-medium text-gray-400">Data</h3>
                        <p className="mt-1 text-lg font-semibold text-gray-200">{formatTimestamp(order.timestamp, 'date')}</p>
                    </div>
                     <div>
                        <h3 className="text-sm font-medium text-gray-400">Início da Separação</h3>
                        <p className="mt-1 text-lg font-semibold text-gray-200">{formatTimestamp(order.timestamp, 'time')}</p>
                    </div>
                     <div>
                        <h3 className="text-sm font-medium text-gray-400">Término da Conferência</h3>
                        <p className="mt-1 text-lg font-semibold text-gray-200">{formatTimestamp(order.completionTimestamp, 'time')}</p>
                    </div>
                    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-700">
                        <div>
                            <h3 className="text-sm font-medium text-gray-400">Separador</h3>
                            <p className="mt-1 text-lg font-semibold text-gray-200">{order.separator || '-'}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-400">Conferente</h3>
                            <p className="mt-1 text-lg font-semibold text-gray-200">{order.confirmer || '-'}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium text-gray-400">Resultado da Separação</h3>
                        <span className="text-sm font-semibold text-blue-400">{pickedItemsSet.size} de {order.items.length} itens separados</span>
                    </div>
                    <ProgressBar progress={progress} />
                </div>
                 <div className="mt-6 pt-6 border-t border-gray-700 flex flex-col sm:flex-row gap-4 justify-end">
                    {order.status === 'completed' && order.completionStatus === 'incomplete' && (
                        <button
                            onClick={() => onContinuePicking(order)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors"
                        >
                            <HistoryIcon className="h-5 w-5" />
                            Continuar Separação
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 transition-colors"
                    >
                        Voltar
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {sortedItems.map(item => (
                    <OrderItemCard
                        key={item.itemNo}
                        item={item}
                        isPicked={pickedItemsSet.has(item.itemNo)}
                        isReadOnly={true}
                    />
                ))}
            </div>
        </div>
    );
};

export default HistoryOrderDetail;