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
        <div className={`
            bg-gray-800/50 rounded-lg shadow-lg border-l-4 transition-all duration-300 group
            ${!isReadOnly && 'hover:shadow-blue-500/10 hover:border-blue-400'}
            ${isPicked ? 'border-green-500 bg-gray-800' : 'border-blue-500'}
        `}>
            <div className="p-5">
                <div className="flex justify-between items-start">
                    <p className={`text-sm font-medium text-gray-400 ${isPicked ? 'line-through' : ''}`}>Item #{item.itemNo} - {item.code}</p>
                    <button
                        onClick={() => onTogglePicked && onTogglePicked(item.itemNo)}
                        disabled={isReadOnly}
                        className={`
                            flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200
                            ${isPicked ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-gray-700 text-gray-400'}
                            ${!isReadOnly && 'group-hover:bg-green-500/20 group-hover:text-green-300'}
                            ${isReadOnly && 'cursor-default'}
                        `}
                        aria-label={isPicked ? (isReadOnly ? 'Item separado' : 'Desmarcar item') : (isReadOnly ? 'Item não separado' : 'Marcar como separado')}
                    >
                        <CheckIcon className="h-5 w-5" />
                    </button>
                </div>
                <p className={`mt-2 text-md font-semibold text-gray-200 ${isPicked ? 'line-through text-gray-500' : ''}`}>
                    {item.description}
                </p>
            </div>
            <div className="bg-gray-900/50 px-5 py-3 rounded-b-lg border-t border-gray-700">
                <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center space-x-2 text-blue-400 font-semibold">
                         <LocationIcon className="h-5 w-5" />
                         <span>{item.location}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-gray-100">{item.quantityOrdered}</span>
                        <span className="ml-1 text-gray-400">{item.unit}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderItemCard;