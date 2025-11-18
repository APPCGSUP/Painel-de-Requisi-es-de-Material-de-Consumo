import React from 'react';
import { OrderItem } from '../types';
import { CheckIcon, LocationIcon } from './Icons';

interface OrderItemCardProps {
    item: OrderItem;
    isPicked: boolean;
    onTogglePicked?: (itemNo: string) => void;
    isReadOnly?: boolean;
}

const OrderItemCard: React.FC<OrderItemCardProps> = ({ item, isPicked, onTogglePicked, isReadOnly = false }) => {
    return (
        <div 
            onClick={() => !isReadOnly && onTogglePicked && onTogglePicked(item.itemNo)}
            className={`
                relative group overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer select-none
                ${isPicked 
                    ? 'bg-gray-900/40 border-green-500/30 shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]' 
                    : 'bg-[#1F2937] border-gray-700 shadow-lg hover:border-blue-500/50 hover:shadow-blue-500/10 hover:-translate-y-1'}
                ${isReadOnly ? 'cursor-default' : ''}
            `}
        >
            {/* Status Stripe */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors duration-300 ${isPicked ? 'bg-green-500' : 'bg-blue-500'}`}></div>

            <div className="p-4 pl-6">
                <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700">
                                #{item.itemNo}
                            </span>
                            <span className="text-xs font-mono text-blue-400">
                                {item.code}
                            </span>
                        </div>
                        <p className={`text-sm font-medium leading-snug line-clamp-2 transition-colors ${isPicked ? 'text-gray-500 line-through decoration-gray-600' : 'text-gray-100'}`}>
                            {item.description}
                        </p>
                    </div>
                    
                    <div className={`
                        flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 border
                        ${isPicked 
                            ? 'bg-green-500 border-green-400 text-white scale-110 shadow-lg shadow-green-900/50' 
                            : 'bg-gray-800 border-gray-600 text-gray-600 group-hover:border-gray-500'}
                    `}>
                        <CheckIcon className={`h-5 w-5 transition-transform ${isPicked ? 'scale-100' : 'scale-75 opacity-0 group-hover:opacity-50'}`} />
                    </div>
                </div>

                <div className="flex items-end justify-between mt-2 pt-3 border-t border-gray-700/50">
                    <div className="flex items-center gap-2 text-blue-300 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/10">
                         <LocationIcon className="h-4 w-4" />
                         <span className="font-mono font-bold text-sm">{item.location}</span>
                    </div>
                    
                    <div className="text-right">
                        <div className="flex items-baseline justify-end gap-1">
                            <span className={`text-2xl font-bold tracking-tight ${isPicked ? 'text-gray-500' : 'text-white'}`}>
                                {item.quantityOrdered}
                            </span>
                            <span className="text-xs text-gray-500 font-medium uppercase">{item.unit}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderItemCard;