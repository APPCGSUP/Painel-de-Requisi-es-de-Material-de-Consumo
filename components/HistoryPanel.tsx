import React from 'react';
import { Order } from '../types';
import { HistoryIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from './Icons';

interface HistoryPanelProps {
    history: Order[];
    onSelectOrder: (order: Order) => void;
    selectedOrderId?: string | null;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelectOrder, selectedOrderId }) => {
    
    const StatusIndicator = ({ order }: { order: Order }) => {
        if (order.status === 'completed') {
            if (order.completionStatus === 'complete') {
                 return <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>Completo</span>
                </div>
            }
            return <div className="flex items-center gap-1.5 text-xs text-yellow-400 font-medium">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <span>Incompleto</span>
            </div>
        }
        if (order.status === 'canceled') {
            return <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
                <XCircleIcon className="h-4 w-4" />
                <span>Cancelado</span>
            </div>
        }
        return null;
    };

    const formatTimestamp = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-gray-800 p-5 rounded-lg shadow-lg border border-gray-700 h-full">
            <div className="flex items-center gap-3 mb-4">
                <HistoryIcon className="h-6 w-6 text-gray-400" />
                <h2 className="text-xl font-bold text-gray-200">Histórico de Pedidos</h2>
            </div>
            {history.length > 0 ? (
                <ul className="space-y-3">
                    {history.map(order => (
                        <li key={order.orderId + order.timestamp}>
                            <button
                                onClick={() => onSelectOrder(order)} 
                                className={`w-full text-left bg-gray-900/50 p-3 rounded-md border transition-all
                                    ${selectedOrderId === order.orderId 
                                        ? 'border-blue-500 shadow-md shadow-blue-500/10' 
                                        : 'border-gray-700/50 hover:border-blue-500/50'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-blue-400">{order.orderId}</p>
                                        <p className="text-xs text-gray-400 mt-1">{order.requester}</p>
                                    </div>
                                    <StatusIndicator order={order} />
                                </div>
                                <p className="text-xs text-gray-500 mt-2 text-right">{formatTimestamp(order.timestamp)}</p>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-10">
                    <p className="text-sm text-gray-500">Nenhum pedido no histórico ainda.</p>
                </div>
            )}
        </div>
    );
};

export default HistoryPanel;