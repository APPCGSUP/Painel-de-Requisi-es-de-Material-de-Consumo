import React from 'react';
import { Order } from '../types';
import { HistoryIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from './Icons';

interface HistoryPanelProps {
    history: Order[];
    onSelectOrder: (order: Order) => void;
    selectedOrder?: Order | null;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelectOrder, selectedOrder }) => {
    
    const StatusIndicator = ({ order }: { order: Order }) => {
        if (order.status === 'completed') {
            if (order.completionStatus === 'complete') {
                 return <CheckCircleIcon className="h-4 w-4 text-green-500" title="Completo" />;
            }
            return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" title="Incompleto" />;
        }
        if (order.status === 'canceled') {
            return <XCircleIcon className="h-4 w-4 text-red-500" title="Cancelado" />;
        }
        return null;
    };

    const formatTimestamp = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isSelected = (order: Order) => {
        return selectedOrder && selectedOrder.orderId === order.orderId && selectedOrder.timestamp === order.timestamp;
    };

    return (
        <div className="bg-[#111827] p-4 rounded-xl border border-gray-800 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6 px-2">
                <div className="p-2 bg-gray-800 rounded-lg text-gray-400">
                    <HistoryIcon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">Recentes</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {history.length > 0 ? (
                    <ul className="space-y-2">
                        {history.map(order => {
                             const active = isSelected(order);
                             return (
                                <li key={order.orderId + order.timestamp}>
                                    <button
                                        onClick={() => onSelectOrder(order)} 
                                        className={`w-full text-left p-3 rounded-lg border transition-all duration-200 group relative overflow-hidden
                                            ${active
                                                ? 'bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-900/20' 
                                                : 'bg-gray-800/40 border-transparent hover:bg-gray-800 hover:border-gray-700'
                                            }`}
                                    >
                                        {active && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                                        )}
                                        
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-sm font-bold ${active ? 'text-blue-400' : 'text-gray-300 group-hover:text-white'}`}>
                                                {order.orderId}
                                            </span>
                                            <StatusIndicator order={order} />
                                        </div>
                                        
                                        <div className="text-xs text-gray-500 truncate mb-2 group-hover:text-gray-400 transition-colors">
                                            {order.requester}
                                        </div>
                                        
                                        <div className="flex justify-between items-center pt-2 border-t border-gray-700/30">
                                            <span className="text-[10px] text-gray-600 font-mono">
                                                {formatTimestamp(order.timestamp)}
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-700/50 rounded text-gray-400">
                                                {order.items.length} itens
                                            </span>
                                        </div>
                                    </button>
                                </li>
                             );
                        })}
                    </ul>
                ) : (
                    <div className="h-40 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-800 rounded-lg">
                        <p className="text-sm text-gray-600">Nenhum histórico</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryPanel;