'use client';

import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface SuccessModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    buttonLabel?: string;
    onOk: () => void;
}

export default function SuccessModal({
    isOpen,
    title,
    message,
    buttonLabel = 'OK',
    onOk
}: SuccessModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onOk}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-[#FFFFF0] w-full max-w-sm rounded-lg shadow-2xl border-2 border-[#1F1F1F] overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="text-green-600" size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-[#1F1F1F] uppercase tracking-wide">{title}</h3>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8 text-center">
                    <p className="text-[#1F1F1F] font-bold text-lg leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-center">
                    <button
                        onClick={onOk}
                        className="w-full py-3 bg-[#8D0B41] hover:bg-[#7a0a38] text-white font-bold uppercase tracking-widest rounded-sm shadow-md hover:shadow-lg transition-all active:translate-y-0.5"
                    >
                        {buttonLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
