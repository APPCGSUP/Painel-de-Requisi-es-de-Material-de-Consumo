import React, { useMemo, useState, useRef } from 'react';
import { Order } from '../types';
import { ChartBarIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, ChevronRightIcon, PrintIcon, DownloadIcon, FilterIcon, FileTextIcon, TableCellsIcon, CodeBracketIcon, PhotoIcon } from './Icons';

// @ts-ignore
const { jsPDF } = window.jspdf;
// @ts-ignore
const html2canvas = window.html2canvas;
// @ts-ignore
const XLSX = window.XLSX;

interface AnalyticsDashboardProps {
    history: Order[];
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
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const clearFilters = () => {
        setFilters({ separator: '', confirmer: '', status: '', dateFrom: '', dateTo: '' });
    };

    const handlePrint = () => {
        if (selectedRows.size > 0) {
            setPrintPreviewOpen(true);
        } else {
            alert("Por favor, selecione pelo menos um pedido para imprimir.");
        }
    };
    
    const confirmPrint = () => {
      window.print();
    }

    const handleDownload = async (format: 'xlsx' | 'json' | 'pdf' | 'png') => {
        if (selectedRows.size === 0) {
            alert("Por favor, selecione pelo menos um pedido para baixar.");
            return;
        }
        const selectedOrders = filteredHistory.filter(order => selectedRows.has(getOrderKey(order)));
        const date = new Date().toISOString().slice(0, 10);

        if (format === 'json') {
            const dataToExport = selectedOrders.map(order => {
                if(expandedRows.has(getOrderKey(order))) {
                    return order;
                }
                const { items, ...orderWithoutItems } = order;
                return orderWithoutItems;
            });
            const jsonString = JSON.stringify(dataToExport, null, 2);
            downloadBlob(new Blob([jsonString], { type: 'application/json' }), `relatorio_pedidos_${date}.json`);
        } else if (format === 'xlsx') {
            const data: (string | number)[][] = [];
            const mainHeaders = ["ID Pedido", "Data", "Início", "Término", "Solicitante", "Setor Destino", "Status", "Separador", "Conferente"];
            data.push(mainHeaders);

            selectedOrders.forEach(order => {
                data.push([
                    order.orderId,
                    formatTimestamp(order.timestamp, 'date'),
                    formatTimestamp(order.timestamp, 'time'),
                    formatTimestamp(order.completionTimestamp, 'time'),
                    order.requester,
                    order.destinationSector,
                    order.status === 'completed' ? (order.completionStatus === 'complete' ? 'Completo' : 'Incompleto') : 'Cancelado',
                    order.separator || '',
                    order.confirmer || ''
                ]);

                const isExpanded = expandedRows.has(getOrderKey(order));
                if (isExpanded && order.items.length > 0) {
                    data.push(['', 'Nº Item', 'Código', 'Descrição', 'Localização', 'Qtd. Pedida', 'Unidade', 'Status Item']);
                    const pickedItemsSet = new Set(order.pickedItems || []);
                    
                    order.items.forEach(item => {
                        data.push([
                            '',
                            item.itemNo,
                            item.code,
                            item.description,
                            item.location,
                            item.quantityOrdered,
                            item.unit,
                            pickedItemsSet.has(item.itemNo) ? 'Separado' : 'Pendente'
                        ]);
                    });
                    data.push([]); // Blank row for spacing
                }
            });

            const worksheet = XLSX.utils.aoa_to_sheet(data);
            worksheet['!cols'] = [
                { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 20 },
                { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 20 }
            ];
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório de Pedidos");
            XLSX.writeFile(workbook, `relatorio_pedidos_${date}.xlsx`);

        } else if (format === 'pdf' || format === 'png') {
            const elementToCapture = reportContentRef.current;
            if (elementToCapture) {
                const canvas = await html2canvas(elementToCapture, { backgroundColor: '#1f2937', scale: 2 });
                if (format === 'png') {
                    const dataUrl = canvas.toDataURL('image/png');
                    downloadDataUrl(dataUrl, `relatorio_pedidos_${date}.png`);
                } else { // PDF
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
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    const downloadDataUrl = (url: string, filename: string) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    const handleToggleSelect = (orderKey: string) => {
        setSelectedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderKey)) newSet.delete(orderKey); else newSet.add(orderKey);
            return newSet;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedRows(e.target.checked ? new Set(filteredHistory.map(getOrderKey)) : new Set());
    };
    
    const handleToggleExpand = (orderKey: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderKey)) newSet.delete(orderKey); else newSet.add(orderKey);
            return newSet;
        });
    }

    const stats = useMemo(() => {
        const source = filteredHistory;
        const totalOrders = source.length;
        const completedOrders = source.filter(o => o.status === 'completed');
        const canceledOrders = totalOrders - completedOrders.length;
        const totalItemsInCompletedOrders = completedOrders.reduce((acc, order) => acc + order.items.length, 0);
        const totalPickedItemsInCompletedOrders = completedOrders.reduce((acc, order) => acc + (order.pickedItems?.length || 0), 0);
        const completionRate = totalItemsInCompletedOrders > 0 ? ((totalPickedItemsInCompletedOrders / totalItemsInCompletedOrders) * 100).toFixed(1) + '%' : 'N/A';
        const totalPickedItems = source.reduce((acc, order) => acc + (order.pickedItems?.length || 0), 0);

        return { totalOrders, completedOrders: completedOrders.length, canceledOrders, totalPickedItems, completionRate };
    }, [filteredHistory]);

    const formatTimestamp = (isoString?: string, type: 'date' | 'time' | 'datetime' = 'datetime') => {
        if (!isoString) return '-';
        const date = new Date(isoString);
        if (type === 'date') return date.toLocaleDateString('pt-BR');
        if (type === 'time') return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };
    
    const renderStatus = (order: Order) => {
        if (order.status === 'completed') {
            return order.completionStatus === 'complete' ? <span className="text-green-400 font-semibold">Completo</span> : <span className="text-yellow-400 font-semibold">Incompleto</span>;
        }
        return <span className="text-red-400 font-semibold">Cancelado</span>;
    }

    const ReportTableForExport = ({ forExport = false }: { forExport?: boolean }) => {
        const ordersToRender = forExport ? filteredHistory.filter(order => selectedRows.has(getOrderKey(order))) : filteredHistory;

        return (
          <table className="min-w-full text-sm text-left text-gray-300 bg-gray-800">
            <thead className="text-xs text-gray-400 uppercase bg-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3">Nº Pedido</th>
                <th scope="col" className="px-4 py-3">Data</th>
                <th scope="col" className="px-4 py-3">Início</th>
                <th scope="col" className="px-4 py-3">Término</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Separador</th>
                <th scope="col" className="px-4 py-3">Conferente</th>
                <th scope="col" className="px-4 py-3 text-center">Itens</th>
              </tr>
            </thead>
            <tbody>
              {ordersToRender.map(order => (
                <React.Fragment key={getOrderKey(order)}>
                  <tr className="border-b border-gray-700">
                    <td className="px-4 py-3 font-medium text-blue-400">{order.orderId}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatTimestamp(order.timestamp, 'date')}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatTimestamp(order.timestamp, 'time')}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatTimestamp(order.completionTimestamp, 'time')}</td>
                    <td className="px-4 py-3">{renderStatus(order)}</td>
                    <td className="px-4 py-3">{order.separator || '-'}</td>
                    <td className="px-4 py-3">{order.confirmer || '-'}</td>
                    <td className="px-4 py-3 text-center font-mono">{order.pickedItems?.length ?? 0} / {order.items.length}</td>
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
        <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 no-print">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-3"><ChartBarIcon className="h-7 w-7 text-blue-500"/>Análises e Relatórios</h2>
                        <p className="text-gray-400 mt-1">Visão geral do desempenho da operação de separação.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                    <StatCard title="Pedidos Exibidos" value={stats.totalOrders} description="Total de pedidos que correspondem aos filtros." icon={<ChartBarIcon className="h-6 w-6 text-blue-400" />} />
                    <StatCard title="Pedidos Concluídos" value={stats.completedOrders} description={`${stats.canceledOrders} pedidos foram cancelados.`} icon={<CheckCircleIcon className="h-6 w-6 text-green-400" />} />
                    <StatCard title="Total de Itens Separados" value={stats.totalPickedItems} description="Soma de itens separados nos pedidos exibidos." icon={<div className="text-2xl font-bold text-gray-300">#</div>} />
                    <StatCard title="Taxa de Conclusão" value={stats.completionRate} description="Percentual de itens separados nos pedidos concluídos." icon={<div className="text-2xl font-bold text-yellow-400">%</div>} />
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 no-print" id="report-section">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <h3 className="text-xl font-bold text-gray-100">Relatório de Pedidos</h3>
                    <div className="flex items-center gap-2">
                         <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700"><FilterIcon className="h-5 w-5" /><span>Filtros</span></button>
                         <button onClick={handlePrint} disabled={selectedRows.size === 0} className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 disabled:bg-gray-500/50 disabled:cursor-not-allowed"><PrintIcon className="h-5 w-5" /><span>Imprimir</span></button>
                         <button onClick={() => setDownloadModalOpen(true)} disabled={selectedRows.size === 0} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-blue-800/50 disabled:cursor-not-allowed"><DownloadIcon className="h-5 w-5" /><span>Download</span></button>
                    </div>
                </div>

                {showFilters && (
                    <div className="bg-gray-900/50 p-4 rounded-md mb-4 border border-gray-700">
                         <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
                            <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className="bg-gray-700 border-gray-600 text-gray-300 rounded-md focus:ring-blue-500" placeholder="De" />
                            <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} className="bg-gray-700 border-gray-600 text-gray-300 rounded-md focus:ring-blue-500" placeholder="Até" />
                            <select name="separator" value={filters.separator} onChange={handleFilterChange} className="bg-gray-700 border-gray-600 text-gray-300 rounded-md focus:ring-blue-500"><option value="">Todos Separadores</option>{uniqueSeparators.map(s => <option key={s} value={s}>{s}</option>)}</select>
                            <select name="confirmer" value={filters.confirmer} onChange={handleFilterChange} className="bg-gray-700 border-gray-600 text-gray-300 rounded-md focus:ring-blue-500"><option value="">Todos Conferentes</option>{uniqueConfirmers.map(c => <option key={c} value={c}>{c}</option>)}</select>
                            <select name="status" value={filters.status} onChange={handleFilterChange} className="bg-gray-700 border-gray-600 text-gray-300 rounded-md focus:ring-blue-500"><option value="">Todos Status</option><option value="completed_complete">Completo</option><option value="completed_incomplete">Incompleto</option><option value="canceled">Cancelado</option></select>
                        </div>
                        <button onClick={clearFilters} className="mt-4 text-sm text-blue-400 hover:underline">Limpar Filtros</button>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                            <tr>
                                <th scope="col" className="p-3 w-12 text-center"><input type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded" onChange={handleSelectAll} checked={selectedRows.size === filteredHistory.length && filteredHistory.length > 0} /></th>
                                <th scope="col" className="px-2 py-3 w-12" aria-label="Expandir"></th>
                                <th scope="col" className="px-4 py-3">Nº Pedido</th>
                                <th scope="col" className="px-4 py-3">Data</th>
                                <th scope="col" className="px-4 py-3">Início</th>
                                <th scope="col" className="px-4 py-3">Término</th>
                                <th scope="col" className="px-4 py-3">Status</th>
                                <th scope="col" className="px-4 py-3">Separador</th>
                                <th scope="col" className="px-4 py-3">Conferente</th>
                                <th scope="col" className="px-4 py-3 text-center">Itens</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHistory.length === 0 ? (
                                <tr><td colSpan={10} className="text-center py-10 text-gray-500">Nenhum pedido corresponde aos filtros.</td></tr>
                            ) : filteredHistory.map(order => {
                                const orderKey = getOrderKey(order);
                                const isSelected = selectedRows.has(orderKey);
                                const isExpanded = expandedRows.has(orderKey);
                                return (
                                <React.Fragment key={orderKey}>
                                    <tr className="border-b border-gray-700 hover:bg-gray-700/30 cursor-pointer" onClick={() => handleToggleExpand(orderKey)}>
                                        <td className="p-3 text-center"><input type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded" checked={isSelected} onChange={e => { e.stopPropagation(); handleToggleSelect(orderKey); }} onClick={e => e.stopPropagation()} /></td>
                                        <td className="px-2 py-3 text-center"><ChevronRightIcon className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} /></td>
                                        <td className="px-4 py-3 font-medium text-blue-400">{order.orderId}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{formatTimestamp(order.timestamp, 'date')}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{formatTimestamp(order.timestamp, 'time')}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{formatTimestamp(order.completionTimestamp, 'time')}</td>
                                        <td className="px-4 py-3">{renderStatus(order)}</td>
                                        <td className="px-4 py-3">{order.separator || '-'}</td>
                                        <td className="px-4 py-3">{order.confirmer || '-'}</td>
                                        <td className="px-4 py-3 text-center font-mono">{order.pickedItems?.length ?? 0} / {order.items.length}</td>
                                    </tr>
                                    {isExpanded && (
                                        <tr className="bg-gray-900/50"><td colSpan={10} className="p-0">
                                            <div className="p-4"><h4 className="text-md font-semibold text-gray-300 mb-2">Itens do Pedido:</h4>
                                            <div className="max-h-60 overflow-y-auto pr-2"><table className="min-w-full text-xs">
                                                <thead className="text-gray-400"><tr><th className="py-2 px-2 text-left w-12">Status</th><th className="py-2 px-2 text-left">Código</th><th className="py-2 px-2 text-left">Descrição</th><th className="py-2 px-2 text-center">Qtd.</th></tr></thead>
                                                <tbody>{order.items.map(item => (
                                                    <tr key={item.itemNo} className="border-t border-gray-700/50">
                                                        <td className="py-2 px-2">{new Set(order.pickedItems || []).has(item.itemNo) ? <CheckCircleIcon className="h-4 w-4 text-green-500" title="Separado"/> : <XCircleIcon className="h-4 w-4 text-red-500" title="Pendente"/>}</td>
                                                        <td className="py-2 px-2 font-mono">{item.code}</td><td className="py-2 px-2">{item.description}</td><td className="py-2 px-2 text-center font-bold">{item.quantityOrdered}</td>
                                                    </tr>
                                                ))}</tbody>
                                            </table></div></div>
                                        </td></tr>
                                    )}
                                </React.Fragment>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="absolute -left-[9999px] top-0" aria-hidden="true">
                <div ref={reportContentRef} className="p-4 bg-gray-800">
                  <ReportTableForExport forExport={true} />
                </div>
            </div>
            
            {isDownloadModalOpen && (
                 <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setDownloadModalOpen(false)}>
                    <div className="bg-gray-800 rounded-lg shadow-2xl p-6 border border-gray-700 w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-gray-100">Escolha o Formato do Relatório</h2>
                        <p className="text-gray-400 mt-2">O relatório será gerado com base nos {selectedRows.size} pedidos selecionados. Itens de pedidos expandidos serão incluídos.</p>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            {[ { format: 'pdf', icon: <FileTextIcon/>, label: 'PDF' }, { format: 'png', icon: <PhotoIcon/>, label: 'PNG (Imagem)' }, { format: 'xlsx', icon: <TableCellsIcon/>, label: 'Excel (.xlsx)' }, { format: 'json', icon: <CodeBracketIcon/>, label: 'JSON' } ].map(item => (
                                <button key={item.format} onClick={() => handleDownload(item.format as any)} className="flex flex-col items-center justify-center gap-2 p-6 bg-gray-700/50 rounded-md border border-gray-600 hover:bg-gray-700 hover:border-blue-500 transition-colors">
                                    <div className="h-8 w-8 text-gray-300">{item.icon}</div>
                                    <span className="font-semibold text-gray-200">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {isPrintPreviewOpen && (
                <div className="fixed inset-0 bg-gray-900 z-50 overflow-y-auto">
                    <div className="max-w-7xl mx-auto p-8">
                        <header className="flex justify-between items-center mb-8 no-print">
                            <h2 className="text-2xl font-bold text-gray-100">Pré-visualização de Impressão</h2>
                            <div className="flex gap-4">
                                <button onClick={() => setPrintPreviewOpen(false)} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700">Fechar</button>
                                <button onClick={confirmPrint} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">Confirmar Impressão</button>
                            </div>
                        </header>
                        <div className="print-preview-content bg-gray-900 text-gray-200 p-4">
                           <h1 className="text-3xl font-bold mb-2">Relatório de Pedidos</h1>
                           <p className="text-gray-400 mb-6">Emitido em: {new Date().toLocaleString('pt-BR')}</p>
                           <ReportTableForExport forExport={true} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsDashboard;