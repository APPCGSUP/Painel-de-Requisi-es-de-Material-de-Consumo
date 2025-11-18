import React, { useMemo, useState, useRef } from 'react';
import { Order } from '../types';
import { ChartBarIcon, CheckCircleIcon, HistoryIcon, PrintIcon, DownloadIcon, FilterIcon, FileTextIcon, TableCellsIcon, CodeBracketIcon, PhotoIcon, XCircleIcon, ChevronRightIcon } from './Icons';

interface AnalyticsDashboardProps {
    history: Order[];
}

interface StatCardProps {
    title: string;
    value: string | number;
    description: string;
    icon: React.ReactNode;
    colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon, colorClass }) => (
    <div className="bg-[#1F2937] p-6 rounded-xl border border-gray-700/50 shadow-lg hover:border-gray-600 transition-colors relative overflow-hidden group">
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
            {React.cloneElement(icon as React.ReactElement, { className: 'h-16 w-16' })}
        </div>
        <div className="relative z-10">
            <div className={`inline-flex p-3 rounded-lg mb-4 ${colorClass} bg-opacity-10`}>
                {React.cloneElement(icon as React.ReactElement, { className: `h-6 w-6 ${colorClass.replace('bg-', 'text-')}` })}
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
            <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
            <p className="text-xs text-gray-500">{description}</p>
        </div>
    </div>
);

const formatDuration = (startIso?: string, endIso?: string): string => {
    if (!startIso || !endIso) return '-';
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    if (isNaN(start) || isNaN(end) || end < start) return '-';

    let delta = Math.abs(end - start) / 1000;
    const hours = Math.floor(delta / 3600);
    delta -= hours * 3600;
    const minutes = Math.floor(delta / 60) % 60;
    delta -= minutes * 60;
    const seconds = Math.floor(delta % 60);

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
    
    return parts.join(' ');
};

const formatTimestamp = (isoString?: string, type: 'date' | 'time' | 'datetime' = 'datetime') => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    if (type === 'date') return date.toLocaleDateString('pt-BR');
    if (type === 'time') return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const StatusBadge = ({ order }: { order: Order }) => {
    let className = 'px-2.5 py-1 text-xs font-bold rounded-md inline-flex items-center gap-1.5 ';
    let text = '';
    let icon = null;

    if (order.status === 'completed') {
        if (order.completionStatus === 'complete') {
            className += 'bg-green-500/10 text-green-400 border border-green-500/20';
            text = 'Concluído';
            icon = <CheckCircleIcon className="w-3 h-3" />;
        } else {
            className += 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
            text = 'Parcial';
            icon = <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />;
        }
    } else if (order.status === 'canceled') {
        className += 'bg-red-500/10 text-red-400 border border-red-500/20';
        text = 'Cancelado';
        icon = <XCircleIcon className="w-3 h-3" />;
    }
    return <span className={className}>{icon}{text}</span>;
};


const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ history }) => {
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    
    const [isDownloadModalOpen, setDownloadModalOpen] = useState(false);
    const [isPrintPreviewOpen, setPrintPreviewOpen] = useState(false);
    
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        separator: '',
        confirmer: '',
        status: '',
        dateFrom: '',
        dateTo: '',
    });

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const reportContentRef = useRef<HTMLDivElement>(null);

    const getOrderKey = (order: Order) => `${order.orderId}-${order.timestamp}`;
    
    const uniqueSeparators = useMemo(() => [...new Set(history.map(o => o.separator).filter(Boolean))], [history]);
    const uniqueConfirmers = useMemo(() => [...new Set(history.map(o => o.confirmer).filter(Boolean))], [history]);

    const filteredHistory = useMemo(() => {
        return history.filter(order => {
            const orderDate = new Date(order.timestamp);
            const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : null;
            const dateTo = filters.dateTo ? new Date(filters.dateTo) : null;

            if (dateFrom && orderDate < dateFrom) return false;
            if (dateTo) {
                dateTo.setHours(23, 59, 59, 999);
                if (orderDate > dateTo) return false;
            }
            if (filters.separator && order.separator !== filters.separator) return false;
            if (filters.confirmer && order.confirmer !== filters.confirmer) return false;
            if (filters.status) {
                if (filters.status === 'completed_complete' && !(order.status === 'completed' && order.completionStatus === 'complete')) return false;
                if (filters.status === 'completed_incomplete' && !(order.status === 'completed' && order.completionStatus === 'incomplete')) return false;
                if (filters.status === 'canceled' && order.status !== 'canceled') return false;
            }
            return true;
        });
    }, [history, filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setCurrentPage(1);
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const clearFilters = () => {
        setCurrentPage(1);
        setFilters({ separator: '', confirmer: '', status: '', dateFrom: '', dateTo: '' });
    };

    const handlePrint = () => {
        if (selectedRows.size > 0) {
            setPrintPreviewOpen(true);
        } else {
            alert("Por favor, selecione pelo menos um pedido para imprimir.");
        }
    };
    
    const confirmPrint = () => window.print();

    const handleDownload = async (format: 'xlsx' | 'json' | 'pdf' | 'png') => {
        if (selectedRows.size === 0) {
            alert("Por favor, selecione pelo menos um pedido para baixar.");
            return;
        }
        const selectedOrders = filteredHistory.filter(order => selectedRows.has(getOrderKey(order)));
        const date = new Date().toISOString().slice(0, 10);

        if (format === 'json') {
            const dataToExport = selectedOrders.map(order => expandedRows.has(getOrderKey(order)) ? order : (({ items, ...o }) => o)(order));
            downloadBlob(new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' }), `relatorio_pedidos_${date}.json`);
        } else if (format === 'xlsx') {
            // @ts-ignore
            const XLSX = window.XLSX;
            const data: (string | number)[][] = [];
            data.push(["Status", "Nº do Pedido", "Solicitante", "Data de Início", "Data de Término", "Tempo Total", "Separador", "Conferente"]);

            selectedOrders.forEach(order => {
                data.push([
                    order.status === 'completed' ? (order.completionStatus === 'complete' ? 'Concluído' : 'Incompleto') : 'Cancelado',
                    order.orderId,
                    order.requester,
                    formatTimestamp(order.timestamp, 'datetime'),
                    formatTimestamp(order.completionTimestamp, 'datetime'),
                    formatDuration(order.timestamp, order.completionTimestamp),
                    order.separator || '',
                    order.confirmer || '',
                ]);

                if (expandedRows.has(getOrderKey(order)) && order.items.length > 0) {
                    data.push(['', 'Nº Item', 'Código', 'Descrição', 'Localização', 'Qtd. Pedida', 'Unidade', 'Status Item']);
                    const pickedItemsSet = new Set(order.pickedItems || []);
                    order.items.forEach(item => {
                        data.push(['', item.itemNo, item.code, item.description, item.location, item.quantityOrdered, item.unit, pickedItemsSet.has(item.itemNo) ? 'Separado' : 'Pendente']);
                    });
                    data.push([]);
                }
            });

            const worksheet = XLSX.utils.aoa_to_sheet(data);
            worksheet['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 25 }, { wch: 25 }];
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");
            XLSX.writeFile(workbook, `relatorio_pedidos_${date}.xlsx`);

        } else if (format === 'pdf' || format === 'png') {
            const elementToCapture = reportContentRef.current;
            if (elementToCapture) {
                // @ts-ignore
                const html2canvas = window.html2canvas;
                const canvas = await html2canvas(elementToCapture, { backgroundColor: '#1f2937', scale: 2 });
                if (format === 'png') {
                    downloadDataUrl(canvas.toDataURL('image/png'), `relatorio_pedidos_${date}.png`);
                } else {
                    // @ts-ignore
                    const { jsPDF } = window.jspdf;
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
                    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                    pdf.save(`relatorio_pedidos_${date}.pdf`);
                }
            }
        }
        setDownloadModalOpen(false);
    };
    
    const downloadBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    const downloadDataUrl = (url: string, filename: string) => {
        const a = document.createElement('a'); a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }

    const handleToggleSelect = (orderKey: string) => {
        setSelectedRows(prev => { const newSet = new Set(prev); if (newSet.has(orderKey)) newSet.delete(orderKey); else newSet.add(orderKey); return newSet; });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedRows(e.target.checked ? new Set(paginatedHistory.map(getOrderKey)) : new Set());
    };
    
    const handleToggleExpand = (orderKey: string) => {
        setExpandedRows(prev => { const newSet = new Set(prev); if (newSet.has(orderKey)) newSet.delete(orderKey); else newSet.add(orderKey); return newSet; });
    }

    const stats = useMemo(() => {
        const source = history; // Stats based on all history, not just filtered
        const totalOrders = source.length;
        const completedOrders = source.filter(o => o.status === 'completed');
        
        const completedWithTimestamps = completedOrders.filter(o => o.timestamp && o.completionTimestamp);
        const totalDurationMs = completedWithTimestamps.reduce((acc, order) => acc + (new Date(order.completionTimestamp!).getTime() - new Date(order.timestamp).getTime()), 0);
        const averageTimeMs = completedWithTimestamps.length > 0 ? totalDurationMs / completedWithTimestamps.length : 0;
        
        const totalItemsInCompletedOrders = completedOrders.reduce((acc, order) => acc + order.items.length, 0);
        const totalPickedItemsInCompletedOrders = completedOrders.reduce((acc, order) => acc + (order.pickedItems?.length || 0), 0);
        const completionRate = totalItemsInCompletedOrders > 0 ? `${((totalPickedItemsInCompletedOrders / totalItemsInCompletedOrders) * 100).toFixed(1)}%` : '0%';
    
        return {
            totalOrders,
            completedOrders: completedOrders.length,
            completionRate,
            averageSeparationTime: formatDuration(new Date(0).toISOString(), new Date(averageTimeMs).toISOString()),
        };
    }, [history]);
    
    const paginatedHistory = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredHistory, currentPage]);
    
    const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);

    const ReportTableForExport = ({ forExport = false }: { forExport?: boolean }) => {
        const ordersToRender = forExport ? filteredHistory.filter(order => selectedRows.has(getOrderKey(order))) : paginatedHistory;
        return (
          <table className="min-w-full text-sm text-left text-gray-300 bg-gray-800">
            <thead className="text-xs text-gray-400 uppercase bg-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Nº Pedido</th>
                <th scope="col" className="px-4 py-3">Solicitante</th>
                <th scope="col" className="px-4 py-3">Data Início</th>
                <th scope="col" className="px-4 py-3">Data Término</th>
                <th scope="col" className="px-4 py-3">Tempo Total</th>
                <th scope="col" className="px-4 py-3">Separador</th>
                <th scope="col" className="px-4 py-3">Conferente</th>
              </tr>
            </thead>
            <tbody>
              {ordersToRender.map(order => (
                <React.Fragment key={getOrderKey(order)}>
                  <tr className="border-b border-gray-700">
                    <td className="px-4 py-3"><StatusBadge order={order}/></td>
                    <td className="px-4 py-3 font-medium text-blue-400">{order.orderId}</td>
                    <td className="px-4 py-3">{order.requester}</td>
                    <td className="px-4 py-3">{formatTimestamp(order.timestamp, 'datetime')}</td>
                    <td className="px-4 py-3">{formatTimestamp(order.completionTimestamp, 'datetime')}</td>
                    <td className="px-4 py-3">{formatDuration(order.timestamp, order.completionTimestamp)}</td>
                    <td className="px-4 py-3">{order.separator || '-'}</td>
                    <td className="px-4 py-3">{order.confirmer || '-'}</td>
                  </tr>
                  {(forExport && expandedRows.has(getOrderKey(order))) && order.items.length > 0 && (
                    <tr className="bg-gray-900/50"><td colSpan={8} className="p-0">
                        <div className="p-4"><h4 className="text-md font-semibold text-gray-300 mb-2">Itens do Pedido:</h4>
                        <table className="min-w-full text-xs">
                            <thead className="text-gray-400"><tr><th className="py-2 px-2 text-left w-12">Status</th><th className="py-2 px-2 text-left">Código</th><th className="py-2 px-2 text-left">Descrição</th><th className="py-2 px-2 text-center">Qtd.</th></tr></thead>
                            <tbody>{order.items.map(item => (
                                <tr key={item.itemNo} className="border-t border-gray-700/50">
                                    <td className="py-2 px-2">{new Set(order.pickedItems || []).has(item.itemNo) ? <CheckCircleIcon className="h-4 w-4 text-green-500" title="Separado"/> : <XCircleIcon className="h-4 w-4 text-red-500" title="Pendente"/>}</td>
                                    <td className="py-2 px-2 font-mono">{item.code}</td><td className="py-2 px-2">{item.description}</td><td className="py-2 px-2 text-center font-bold">{item.quantityOrdered}</td>
                                </tr>
                            ))}</tbody>
                        </table></div>
                    </td></tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        );
    }
    
    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Análise de Performance</h2>
                    <p className="text-gray-400 text-sm">Visão geral da produtividade e histórico de pedidos.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors font-medium text-sm ${showFilters ? 'bg-blue-600 text-white border-blue-500' : 'bg-[#1F2937] text-gray-300 border-gray-600 hover:border-gray-500'}`}>
                        <FilterIcon className="h-4 w-4" /><span>Filtros</span>
                    </button>
                    <button onClick={() => setDownloadModalOpen(true)} disabled={selectedRows.size === 0} className="flex items-center gap-2 px-4 py-2 bg-[#1F2937] text-white rounded-lg border border-gray-600 hover:border-blue-500 hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm">
                        <DownloadIcon className="h-4 w-4" /><span>Exportar</span>
                    </button>
                    <button onClick={handlePrint} disabled={selectedRows.size === 0} className="flex items-center gap-2 px-4 py-2 bg-[#1F2937] text-white rounded-lg border border-gray-600 hover:border-blue-500 hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm">
                        <PrintIcon className="h-4 w-4" /><span>Imprimir</span>
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard title="Total de Pedidos" value={stats.totalOrders} description="Histórico completo" icon={<ChartBarIcon />} colorClass="text-blue-400 bg-blue-500" />
                <StatCard title="Pedidos Concluídos" value={stats.completedOrders} description="Processos finalizados" icon={<CheckCircleIcon />} colorClass="text-green-400 bg-green-500" />
                <StatCard title="Taxa de Conclusão" value={stats.completionRate} description="Precisão de picking" icon={<div className="text-2xl font-bold">%</div>} colorClass="text-yellow-400 bg-yellow-500" />
                <StatCard title="Tempo Médio" value={stats.averageSeparationTime} description="Por pedido finalizado" icon={<HistoryIcon />} colorClass="text-purple-400 bg-purple-500" />
            </div>

            {showFilters && (
                <div className="bg-[#1F2937] p-6 rounded-xl border border-gray-700 animate-slide-down">
                     <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Filtros Avançados</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
                        <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className="bg-[#111827] border-gray-600 text-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full" />
                        <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} className="bg-[#111827] border-gray-600 text-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full" />
                        <select name="separator" value={filters.separator} onChange={handleFilterChange} className="bg-[#111827] border-gray-600 text-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full"><option value="">Todos Separadores</option>{uniqueSeparators.map(s => <option key={s} value={s}>{s}</option>)}</select>
                        <select name="confirmer" value={filters.confirmer} onChange={handleFilterChange} className="bg-[#111827] border-gray-600 text-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full"><option value="">Todos Conferentes</option>{uniqueConfirmers.map(c => <option key={c} value={c}>{c}</option>)}</select>
                        <select name="status" value={filters.status} onChange={handleFilterChange} className="bg-[#111827] border-gray-600 text-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full"><option value="">Todos Status</option><option value="completed_complete">Concluído Completo</option><option value="completed_incomplete">Concluído Parcial</option><option value="canceled">Cancelado</option></select>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button onClick={clearFilters} className="text-sm text-blue-400 hover:text-blue-300 font-medium hover:underline">Limpar Filtros</button>
                    </div>
                </div>
            )}
            
            <div className="bg-[#1F2937] rounded-xl shadow-xl border border-gray-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-[#111827] border-b border-gray-700">
                            <tr>
                                <th scope="col" className="p-4 w-12 text-center"><input type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-offset-gray-800" onChange={handleSelectAll} checked={selectedRows.size === paginatedHistory.length && paginatedHistory.length > 0} /></th>
                                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Pedido</th>
                                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Solicitante</th>
                                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Tempo</th>
                                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Equipe</th>
                                <th scope="col" className="px-6 py-4 text-right font-semibold tracking-wider">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                            {paginatedHistory.length === 0 ? (
                                <tr><td colSpan={10} className="text-center py-16 text-gray-500 text-lg">Nenhum pedido encontrado com os filtros atuais.</td></tr>
                            ) : paginatedHistory.map(order => {
                                const orderKey = getOrderKey(order);
                                const isSelected = selectedRows.has(orderKey);
                                const isExpanded = expandedRows.has(orderKey);
                                return (
                                <React.Fragment key={orderKey}>
                                    <tr className={`transition-colors ${isSelected ? 'bg-blue-900/10' : 'hover:bg-gray-800/50'} ${isExpanded ? 'bg-gray-800/80' : ''}`}>
                                        <td className="p-4 text-center"><input type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-offset-gray-800" checked={isSelected} onChange={() => handleToggleSelect(orderKey)} /></td>
                                        <td className="px-6 py-4"><StatusBadge order={order}/></td>
                                        <td className="px-6 py-4 font-mono font-medium text-white">{order.orderId}</td>
                                        <td className="px-6 py-4 text-gray-300">{order.requester}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-white font-medium">{formatDuration(order.timestamp, order.completionTimestamp)}</div>
                                            <div className="text-xs text-gray-500">{formatTimestamp(order.completionTimestamp, 'datetime')}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs"><span className="text-gray-500">Sep:</span> {order.separator || '-'}</div>
                                            <div className="text-xs"><span className="text-gray-500">Conf:</span> {order.confirmer || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleToggleExpand(orderKey)} className={`p-2 rounded-full hover:bg-gray-700 transition-all ${isExpanded ? 'rotate-90 text-blue-400' : 'text-gray-500'}`}>
                                                <ChevronRightIcon className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                    {isExpanded && (
                                        <tr className="bg-[#111827] shadow-inner"><td colSpan={10} className="p-0">
                                            <div className="p-6 border-l-4 border-blue-500/50 ml-4 my-2">
                                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><CodeBracketIcon className="h-4 w-4"/> Detalhamento de Itens</h4>
                                                <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
                                                    <table className="min-w-full text-sm">
                                                        <thead className="bg-gray-800 text-xs text-gray-400 uppercase">
                                                            <tr>
                                                                <th className="px-4 py-2 w-16 text-center">Status</th>
                                                                <th className="px-4 py-2 text-left">Código</th>
                                                                <th className="px-4 py-2 text-left">Descrição</th>
                                                                <th className="px-4 py-2 text-center">Qtd.</th>
                                                                <th className="px-4 py-2 text-left">Local</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-700/50">
                                                            {order.items.length > 0 ? order.items.map(item => (
                                                                <tr key={item.itemNo} className="hover:bg-gray-700/30 transition-colors">
                                                                    <td className="px-4 py-3 text-center">{new Set(order.pickedItems || []).has(item.itemNo) ? <CheckCircleIcon className="h-5 w-5 text-green-500 mx-auto" title="Separado"/> : <div className="h-2 w-2 rounded-full bg-gray-600 mx-auto" title="Pendente"></div>}</td>
                                                                    <td className="px-4 py-3 font-mono text-blue-300">{item.code}</td>
                                                                    <td className="px-4 py-3 text-gray-300">{item.description}</td>
                                                                    <td className="px-4 py-3 text-center font-bold text-white">{item.quantityOrdered} <span className="text-xs font-normal text-gray-500">{item.unit}</span></td>
                                                                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{item.location}</td>
                                                                </tr>
                                                            )) : <tr><td colSpan={5} className="text-center py-4 text-gray-500">Nenhum item registrado.</td></tr>}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </td></tr>
                                    )}
                                </React.Fragment>
                            )})}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="flex justify-between items-center p-4 border-t border-gray-700 bg-[#111827]">
                        <span className="text-sm text-gray-400">{selectedRows.size} de {filteredHistory.length} selecionados</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Anterior</button>
                            <span className="text-sm text-gray-300 font-medium px-2">Página {currentPage} de {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Próximo</button>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="hidden">
                <div ref={reportContentRef} className="p-8 bg-[#111827] text-white">
                     <h1 className="text-3xl font-bold mb-2 text-white">Relatório de Expedição</h1>
                     <p className="text-gray-400 mb-8 border-b border-gray-700 pb-4">Emitido em: {new Date().toLocaleString('pt-BR')}</p>
                     <ReportTableForExport forExport={true} />
                </div>
            </div>
            
            {isDownloadModalOpen && (
                 <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={() => setDownloadModalOpen(false)}>
                    <div className="bg-[#1F2937] rounded-2xl shadow-2xl p-8 border border-gray-700 w-full max-w-2xl m-4 transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white">Exportar Relatório</h2>
                            <p className="text-gray-400 mt-2">{selectedRows.size} pedido(s) selecionado(s) para exportação.</p>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[ 
                                { format: 'pdf', icon: <FileTextIcon/>, label: 'PDF Document', color: 'hover:border-red-500 hover:text-red-400' }, 
                                { format: 'xlsx', icon: <TableCellsIcon/>, label: 'Excel Spreadsheet', color: 'hover:border-green-500 hover:text-green-400' },
                                { format: 'png', icon: <PhotoIcon/>, label: 'Image (PNG)', color: 'hover:border-purple-500 hover:text-purple-400' }, 
                                { format: 'json', icon: <CodeBracketIcon/>, label: 'JSON Data', color: 'hover:border-yellow-500 hover:text-yellow-400' } 
                            ].map(item => (
                                <button key={item.format} onClick={() => handleDownload(item.format as any)} className={`group flex flex-col items-center justify-center gap-4 p-6 bg-gray-800/50 rounded-xl border border-gray-700 transition-all duration-300 hover:bg-gray-800 hover:-translate-y-1 ${item.color}`}>
                                    <div className="p-3 bg-gray-900 rounded-lg group-hover:bg-gray-700 transition-colors text-gray-300 group-hover:text-white">
                                        {React.cloneElement(item.icon as React.ReactElement, { className: "h-8 w-8" })}
                                    </div>
                                    <span className="font-semibold text-sm text-gray-300 group-hover:text-white">{item.label}</span>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setDownloadModalOpen(false)} className="w-full mt-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors">Cancelar</button>
                    </div>
                </div>
            )}
            
            {isPrintPreviewOpen && (
                <div className="fixed inset-0 bg-[#111827] z-50 overflow-y-auto">
                    <div className="max-w-5xl mx-auto p-8 min-h-screen flex flex-col">
                        <header className="flex justify-between items-center mb-8 no-print bg-[#1F2937] p-4 rounded-xl border border-gray-700 sticky top-4 z-10 shadow-xl">
                            <div>
                                <h2 className="text-xl font-bold text-white">Pré-visualização</h2>
                                <p className="text-xs text-gray-400">Verifique o layout antes de imprimir</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setPrintPreviewOpen(false)} className="px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors">Fechar</button>
                                <button onClick={confirmPrint} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-colors flex items-center gap-2"><PrintIcon className="h-4 w-4"/> Imprimir</button>
                            </div>
                        </header>
                        <div className="print-preview-content bg-white text-black p-8 shadow-2xl min-h-[29.7cm]">
                           <div className="flex justify-between border-b-2 border-black pb-4 mb-6">
                               <h1 className="text-3xl font-bold">Relatório de Pedidos</h1>
                               <div className="text-right">
                                   <p className="text-sm font-bold">LogiTrack System</p>
                                   <p className="text-xs">{new Date().toLocaleString('pt-BR')}</p>
                               </div>
                           </div>
                           <div className="text-black">
                                <ReportTableForExport forExport={true} />
                           </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsDashboard;