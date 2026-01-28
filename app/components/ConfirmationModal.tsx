'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmationModal({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isDestructive = false,
    onConfirm,
    onCancel
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onCancel}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-[#FFFFF0] w-full max-w-md rounded-lg shadow-2xl border-2 border-[#1F1F1F] overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className={`px-6 py-4 border-b border-gray-200 flex items-center justify-between ${isDestructive ? 'bg-red-50' : 'bg-white'}`}>
                    <div className="flex items-center gap-3">
                        {isDestructive ? (
                            <AlertCircle className="text-red-600" size={24} />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-[#8D0B41]/10 flex items-center justify-center">
                                <CheckCircle2 className="text-[#8D0B41]" size={20} />
                            </div>
                        )}
                        <h3 className="text-lg font-bold text-[#1F1F1F] uppercase tracking-wide">{title}</h3>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-[#1F1F1F] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8">
                    <p className="text-[#1F1F1F] font-bold text-lg leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-600 font-bold uppercase tracking-wider hover:border-gray-400 hover:text-[#1F1F1F] transition-colors rounded-sm"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`
                            px-8 py-3 font-bold uppercase tracking-wider text-white transition-all rounded-sm shadow-md hover:shadow-lg active:translate-y-0.5
                            ${isDestructive
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-[#8D0B41] hover:bg-[#7a0a38]'
                            }
                        `}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
