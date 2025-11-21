
import React, { useState } from 'react';
import { Order } from '../types';
import { HistoryIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InboxIcon, ChevronRightIcon, PlayIcon } from './Icons';

interface HistoryPanelProps {
    history: Order[];
    queue?: Order[];
    onSelectOrder: (order: Order) => void;
    onPromoteOrder?: (order: Order) => void;
    selectedOrder?: Order | null;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, queue = [], onSelectOrder, onPromoteOrder, selectedOrder }) => {
    const [isQueueExpanded, setIsQueueExpanded] = useState(true);
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);

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
        <div className="bg-[#111827] rounded-xl border border-gray-800 h-full flex flex-col overflow-hidden">
            
            {/* Queue Section */}
            <div className="border-b border-gray-800 flex-shrink-0">
                <button 
                    onClick={() => setIsQueueExpanded(!isQueueExpanded)}
                    className={`w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors ${isQueueExpanded ? 'bg-gray-800/30' : ''}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${queue.length > 0 ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-800 text-gray-500'}`}>
                            <InboxIcon className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                            <h2 className="text-sm font-bold text-white tracking-tight">Fila de Entrada</h2>
                            <p className="text-xs text-gray-500">{queue.length} pedidos aguardando</p>
                        </div>
                    </div>
                    <ChevronRightIcon className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isQueueExpanded ? 'rotate-90' : ''}`} />
                </button>
                
                {isQueueExpanded && (
                    <div className="max-h-60 overflow-y-auto custom-scrollbar bg-black/20">
                        {queue.length > 0 ? (
                            <ul className="divide-y divide-gray-800">
                                {queue.map(order => (
                                    <li key={order.orderId + order.timestamp} className="group hover:bg-gray-800/50 transition-colors p-3">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-sm font-bold text-orange-400 font-mono">{order.orderId}</span>
                                            {onPromoteOrder && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onPromoteOrder(order);
                                                    }}
                                                    className="p-1.5 bg-green-600 hover:bg-green-500 text-white rounded-md shadow-lg transition-all transform hover:scale-105 active:scale-95"
                                                    title="Liberar Pedido"
                                                >
                                                    <PlayIcon className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-400 mb-1 truncate">{order.requester}</div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-gray-600 font-mono">{formatTimestamp(order.timestamp)}</span>
                                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-800 rounded text-gray-500 border border-gray-700">
                                                {order.items.length} itens
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <div className="p-6 flex flex-col items-center justify-center text-center text-gray-600">
                                <p className="text-xs">Nenhum pedido na fila.</p>
                                <p className="text-[10px] mt-1 opacity-60">Importe arquivos para preencher.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* History Section */}
            <div className="flex-1 flex flex-col min-h-0">
                <button 
                    onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors border-b border-gray-800 flex-shrink-0"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-800 rounded-lg text-gray-400">
                            <HistoryIcon className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                            <h2 className="text-sm font-bold text-white tracking-tight">Histórico Recente</h2>
                            <p className="text-xs text-gray-500">{history.length} pedidos listados</p>
                        </div>
                    </div>
                    <ChevronRightIcon className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isHistoryExpanded ? 'rotate-90' : ''}`} />
                </button>
                
                {isHistoryExpanded && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pt-2">
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
                            <div className="h-full flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-800 rounded-lg opacity-50">
                                <p className="text-sm text-gray-600">Nenhum histórico</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryPanel;
