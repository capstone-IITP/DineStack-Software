import React from 'react';
import { KitchenOrder } from './kitchenTypes';

interface UpdateOrderStatusProps {
    currentStatus: KitchenOrder['status'];
    onStatusChange: (status: KitchenOrder['status']) => void;
    onClose: () => void;
}

export default function UpdateOrderStatus({ currentStatus, onStatusChange, onClose }: UpdateOrderStatusProps) {

    // Status Flow: Pending -> Preparing -> Ready -> Served

    return (
        <div>
            <div className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-widest text-center">Update Order Status</div>
            <div className="grid grid-cols-3 gap-4 h-24">

                <button
                    onClick={() => onStatusChange('Preparing')}
                    disabled={currentStatus === 'Preparing' || currentStatus === 'Ready' || currentStatus === 'Served'}
                    className={`
                        flex flex-col items-center justify-center rounded-lg font-black uppercase tracking-wider transition-all
                        ${currentStatus === 'Preparing'
                            ? 'bg-[#1F1F1F] text-white ring-4 ring-offset-2 ring-[#1F1F1F]'
                            : 'bg-blue-100 text-blue-900 hover:bg-blue-200'}
                        ${(currentStatus === 'Ready' || currentStatus === 'Served') ? 'opacity-30 grayscale' : ''}
                    `}
                >
                    Preparing
                </button>

                <button
                    onClick={() => onStatusChange('Ready')}
                    disabled={currentStatus === 'Ready' || currentStatus === 'Served'}
                    className={`
                        flex flex-col items-center justify-center rounded-lg font-black uppercase tracking-wider transition-all
                        ${currentStatus === 'Ready'
                            ? 'bg-[#8D0B41] text-white ring-4 ring-offset-2 ring-[#8D0B41]'
                            : 'bg-orange-100 text-orange-900 hover:bg-orange-200'}
                         ${currentStatus === 'Served' ? 'opacity-30 grayscale' : ''}
                    `}
                >
                    Ready
                </button>

                <button
                    onClick={() => {
                        onStatusChange('Served');
                        setTimeout(onClose, 300); // Close after brief delay
                    }}
                    className={`
                        flex flex-col items-center justify-center rounded-lg font-black uppercase tracking-wider transition-all
                        bg-green-100 text-green-900 hover:bg-green-500 hover:text-white
                    `}
                >
                    Served
                </button>

            </div>
        </div>
    );
}
