import React, { useMemo, useState, useEffect } from 'react';
import { Order } from '../types';
import { ChartBarIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, ChevronRightIcon } from './Icons';

interface AnalyticsDashboardProps {
    history: Order[];
    onClose: () => void;
}

interface StatCardProps {
    title: string;
    value: string | number;
    description: string;
    icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon }) => (
    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 flex items-start space-x-4">
        <div className="flex-shrink-0 h-12 w-12 rounded-lg flex items-center justify-center bg-gray-700">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-100">{value}</p>
            <p className="text-xs text-gray-500">{description}</p>
        </div>
    </div>
);


const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ history, onClose }) => {
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [isPrinting, setIsPrinting] = useState<boolean>(false);

    const getOrderKey = (order: Order) => `${order.orderId}-${order.timestamp}`;

    useEffect(() => {
        if (isPrinting) {
            const handleAfterPrint = () => {
                setIsPrinting(false);
                window.removeEventListener('afterprint', handleAfterPrint);
            };
            window.addEventListener('afterprint', handleAfterPrint);
            // Timeout ensures the state has updated and re-rendered before printing
            setTimeout(() => {
                window.print();
            }, 100);
        }
    }, [isPrinting]);

    const handlePrint = () => {
        if (selectedRows.size > 0) {
            setIsPrinting(true);
        } else {
            alert("Por favor, selecione pelo menos um pedido para imprimir.");
        }
    };

    const handleToggleSelect = (orderKey: string) => {
        setSelectedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderKey)) {
                newSet.delete(orderKey);
            } else {
                newSet.add(orderKey);
            }
            return newSet;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allOrderKeys = new Set(history.map(getOrderKey));
            setSelectedRows(allOrderKeys);
        } else {
            setSelectedRows(new Set());
        }
    };
    
    const handleToggleExpand = (orderKey: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderKey)) {
                newSet.delete(orderKey);
            } else {
                newSet.add(orderKey);
            }
            return newSet;
        });
    }

    const stats = useMemo(() => {
        const totalOrders = history.length;
        const completedOrders = history.filter(o => o.status === 'completed');
        const canceledOrders = totalOrders - completedOrders.length;
        
        const totalItemsInCompletedOrders = completedOrders.reduce((acc, order) => acc + order.items.length, 0);
        const totalPickedItemsInCompletedOrders = completedOrders.reduce((acc, order) => acc + (order.pickedItems?.length || 0), 0);

        const completionRate = totalItemsInCompletedOrders > 0 
            ? ((totalPickedItemsInCompletedOrders / totalItemsInCompletedOrders) * 100).toFixed(1) + '%'
            : 'N/A';

        const totalPickedItems = history.reduce((acc, order) => acc + (order.pickedItems?.length || 0), 0);

        return {
            totalOrders,
            completedOrders: completedOrders.length,
            canceledOrders,
            totalPickedItems,
            completionRate
        };
    }, [history]);

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
    
    const renderStatus = (order: Order) => {
        if (order.status === 'completed') {
            return order.completionStatus === 'complete' ? 
                <span className="text-green-400 font-semibold">Completo</span> : 
                <span className="text-yellow-400 font-semibold">Incompleto</span>;
        }
        return <span className="text-red-400 font-semibold">Cancelado</span>;
    }

    if (isPrinting) {
        return (
            <div className="printable-section bg-gray-900 text-gray-200 p-4 sm:p-6 md:p-8">
                <h1 className="text-3xl font-bold mb-6 border-b border-gray-700 pb-4 text-white">Relatório de Pedidos</h1>
                {history
                    .filter(order => selectedRows.has(getOrderKey(order)))
                    .map(order => {
                        const orderKey = getOrderKey(order);
                        const pickedItemsSet = new Set(order.pickedItems || []);
                        return (
                            <div key={orderKey} className="mb-8 break-inside-avoid page-break-before:always first:page-break-before:auto">
                                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                                    <h2 className="text-xl font-bold text-blue-400">Pedido: {order.orderId}</h2>
                                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm text-gray-300">
                                        <p><span className="font-semibold text-gray-400">Data:</span> {formatTimestamp(order.timestamp)}</p>
                                        <p className="col-span-2"><span className="font-semibold text-gray-400">Solicitante:</span> {order.requester}</p>
                                        <p><span className="font-semibold text-gray-400">Status:</span> {renderStatus(order)}</p>
                                        <p className="col-span-2"><span className="font-semibold text-gray-400">Itens:</span> {order.pickedItems?.length ?? 0} / {order.items.length}</p>
                                    </div>
                                </div>
                                {expandedRows.has(orderKey) && (
                                     <div className="mt-4">
                                        <h3 className="text-lg font-semibold mb-2 text-gray-200">Itens do Pedido:</h3>
                                        <table className="min-w-full text-sm border border-gray-700 text-gray-300">
                                            <thead className="bg-gray-700 text-left text-gray-400">
                                                <tr>
                                                    <th className="px-3 py-2 w-12">Status</th>
                                                    <th className="px-3 py-2">Código</th>
                                                    <th className="px-3 py-2">Descrição</th>
                                                    <th className="px-3 py-2 text-center">Qtd.</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {order.items.map(item => (
                                                    <tr key={item.itemNo} className="border-b border-gray-700">
                                                        <td className="px-3 py-2 text-center">
                                                            {pickedItemsSet.has(item.itemNo) ? 
                                                                <CheckCircleIcon className="h-5 w-5 text-green-400 mx-auto" title="Separado" /> :
                                                                <XCircleIcon className="h-5 w-5 text-red-400 mx-auto" title="Pendente" />
                                                            }
                                                        </td>
                                                        <td className="px-3 py-2 font-mono">{item.code}</td>
                                                        <td className="px-3 py-2">{item.description}</td>
                                                        <td className="px-3 py-2 text-center font-bold text-white">{item.quantityOrdered}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )
                    })
                }
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 no-print">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-3">
                            <ChartBarIcon className="h-7 w-7 text-blue-500"/>
                            Análises e Relatórios
                        </h2>
                        <p className="text-gray-400 mt-1">Visão geral do desempenho da operação de separação.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 transition-colors"
                    >
                        Voltar
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                    <StatCard 
                        title="Pedidos Finalizados"
                        value={stats.totalOrders}
                        description="Total de pedidos concluídos e cancelados."
                        icon={<ChartBarIcon className="h-6 w-6 text-blue-400" />}
                    />
                    <StatCard 
                        title="Pedidos Concluídos"
                        value={stats.completedOrders}
                        description={`${stats.canceledOrders} pedidos foram cancelados.`}
                        icon={<CheckCircleIcon className="h-6 w-6 text-green-400" />}
                    />
                     <StatCard 
                        title="Total de Itens Separados"
                        value={stats.totalPickedItems}
                        description="Soma de todos os itens marcados como separados."
                        icon={<div className="text-2xl font-bold text-gray-300">#</div>}
                    />
                    <StatCard 
                        title="Taxa de Conclusão"
                        value={stats.completionRate}
                        description="Percentual de itens separados nos pedidos concluídos."
                        icon={<div className="text-2xl font-bold text-yellow-400">%</div>}
                    />
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700" id="report-section">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4 no-print">
                    <h3 className="text-xl font-bold text-gray-100">Relatório de Pedidos</h3>
                     <button
                        onClick={handlePrint}
                        disabled={selectedRows.size === 0}
                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                        title={selectedRows.size === 0 ? "Selecione ao menos um pedido" : "Imprimir pedidos selecionados"}
                    >
                        Imprimir Relatório
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                            <tr>
                                <th scope="col" className="p-3 w-12 text-center no-print">
                                    <input 
                                        type="checkbox"
                                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                        onChange={handleSelectAll}
                                        checked={selectedRows.size === history.length && history.length > 0}
                                        aria-label="Selecionar todos os pedidos"
                                    />
                                </th>
                                <th scope="col" className="px-2 py-3 w-12 no-print" aria-label="Expandir"></th>
                                <th scope="col" className="px-4 py-3">Nº Pedido</th>
                                <th scope="col" className="px-4 py-3">Data</th>
                                <th scope="col" className="px-4 py-3">Solicitante</th>
                                <th scope="col" className="px-4 py-3">Status</th>
                                <th scope="col" className="px-4 py-3 text-center">Itens (Separados / Total)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-gray-500">
                                        Nenhum dado para exibir no relatório.
                                    </td>
                                </tr>
                            )}
                            {history.map(order => {
                                const orderKey = getOrderKey(order);
                                const isSelected = selectedRows.has(orderKey);
                                const isExpanded = expandedRows.has(orderKey);
                                const pickedItemsSet = new Set(order.pickedItems || []);
                                return (
                                <React.Fragment key={orderKey}>
                                    <tr 
                                        className="border-b border-gray-700 hover:bg-gray-700/30 cursor-pointer"
                                        onClick={() => handleToggleExpand(orderKey)}
                                    >
                                        <td className="p-3 text-center no-print">
                                             <input 
                                                type="checkbox"
                                                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                                checked={isSelected}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleSelect(orderKey);
                                                }}
                                                onClick={e => e.stopPropagation()}
                                            />
                                        </td>
                                        <td className="px-2 py-3 text-center no-print">
                                            <ChevronRightIcon className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                        </td>
                                        <td className="px-4 py-3 font-medium text-blue-400">{order.orderId}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{formatTimestamp(order.timestamp)}</td>
                                        <td className="px-4 py-3">{order.requester}</td>
                                        <td className="px-4 py-3">{renderStatus(order)}</td>
                                        <td className="px-4 py-3 text-center font-mono">
                                            {order.pickedItems?.length ?? 0} / {order.items.length}
                                        </td>
                                    </tr>
                                    {isExpanded && (
                                        <tr className="bg-gray-900/50 no-print">
                                            <td colSpan={7} className="p-0">
                                                <div className="p-4">
                                                    <h4 className="text-md font-semibold text-gray-300 mb-2">Itens do Pedido:</h4>
                                                    <div className="max-h-60 overflow-y-auto pr-2">
                                                        <table className="min-w-full text-xs">
                                                            <thead className="text-gray-400">
                                                                <tr>
                                                                    <th className="py-2 px-2 text-left w-12">Status</th>
                                                                    <th className="py-2 px-2 text-left">Código</th>
                                                                    <th className="py-2 px-2 text-left">Descrição</th>
                                                                    <th className="py-2 px-2 text-center">Qtd.</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {order.items.map(item => (
                                                                    <tr key={item.itemNo} className="border-t border-gray-700/50">
                                                                        <td className="py-2 px-2">
                                                                            {pickedItemsSet.has(item.itemNo) ?
                                                                                <CheckCircleIcon className="h-4 w-4 text-green-500" title="Separado"/> :
                                                                                <XCircleIcon className="h-4 w-4 text-red-500" title="Pendente"/>
                                                                            }
                                                                        </td>
                                                                        <td className="py-2 px-2 font-mono">{item.code}</td>
                                                                        <td className="py-2 px-2">{item.description}</td>
                                                                        <td className="py-2 px-2 text-center font-bold">{item.quantityOrdered}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;