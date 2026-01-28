'use client';

import React, { useState } from 'react';
import { Delete, Lock, ChefHat, ChevronLeft } from 'lucide-react';

interface CreateKitchenPinProps {
    onBack: () => void;
    onPinSet: (pin: string) => void;
}

export default function CreateKitchenPin({ onBack, onPinSet }: CreateKitchenPinProps) {
    const [pin, setPin] = useState('');
    const [isConfirming, setIsConfirming] = useState(false);
    const [firstPin, setFirstPin] = useState('');
    const [error, setError] = useState('');

    const handleNumberClick = (num: number) => {
        if (pin.length < 4) {
            setPin(prev => prev + num);
            setError('');
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
        setError('');
    };

    const handleSubmit = () => {
        if (pin.length !== 4) return;

        if (!isConfirming) {
            setFirstPin(pin);
            setIsConfirming(true);
            setPin('');
        } else {
            if (pin === firstPin) {
                onPinSet(pin);
            } else {
                setError('PINs do not match. Try again.');
                setPin('');
                setIsConfirming(false);
                setFirstPin('');
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#FFFFF0] text-[#1F1F1F] font-mono flex flex-col items-center justify-center p-6 selection:bg-[#8D0B41] selection:text-white relative overflow-hidden">

            <button
                onClick={onBack}
                className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-[#1F1F1F] transition-colors"
            >
                <ChevronLeft size={20} />
                <span className="text-xs font-bold uppercase">Cancel</span>
            </button>

            {/* Background Icon */}
            <ChefHat className="absolute -bottom-20 -right-20 text-[#8D0B41] opacity-5 w-96 h-96" />

            <div className="w-full max-w-sm z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#8D0B41]/10 rounded-full mb-6">
                        <Lock size={32} className="text-[#8D0B41]" />
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tight mb-2">
                        {isConfirming ? 'Confirm PIN' : 'Set Kitchen PIN'}
                    </h1>
                    <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">
                        {isConfirming ? 'Re-enter to verify' : 'Create a 4-digit code'}
                    </p>
                </div>

                {/* PIN Display */}
                <div className="flex justify-center gap-4 mb-10 h-16">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className={`
                            w-12 h-16 border-b-4 flex items-center justify-center text-3xl transition-all
                            ${pin[i]
                                ? 'border-[#8D0B41] text-[#1F1F1F]'
                                : 'border-gray-200 text-transparent'}
                            ${error ? 'animate-shake border-red-500' : ''}
                        `}>
                            {pin[i] ? '•' : ''}
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="text-center mb-6 text-red-600 text-xs font-bold uppercase tracking-wider animate-shake">
                        {error}
                    </div>
                )}

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num)}
                            className="bg-white hover:bg-white/80 active:scale-95 border-2 border-gray-100 hover:border-[#8D0B41] h-20 rounded-lg text-2xl font-bold transition-all shadow-sm flex items-center justify-center"
                        >
                            {num}
                        </button>
                    ))}
                    <div className="col-start-2">
                        <button
                            onClick={() => handleNumberClick(0)}
                            className="w-full bg-white hover:bg-white/80 active:scale-95 border-2 border-gray-100 hover:border-[#8D0B41] h-20 rounded-lg text-2xl font-bold transition-all shadow-sm flex items-center justify-center"
                        >
                            0
                        </button>
                    </div>
                    <div>
                        <button
                            onClick={handleDelete}
                            className="w-full h-20 flex items-center justify-center text-gray-400 hover:text-[#8D0B41] hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <Delete size={24} />
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleSubmit}
                        disabled={pin.length !== 4}
                        className={`
                            w-full py-4 text-sm font-bold uppercase tracking-widest rounded-sm transition-all shadow-lg
                            ${pin.length === 4
                                ? 'bg-[#8D0B41] text-white hover:bg-[#7a0a38] hover:shadow-xl'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                        `}
                    >
                        {isConfirming ? 'Confirm & Set' : 'Continue'}
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.2s ease-in-out 0.2s 2;
                }
            `}</style>
        </div>
    );
}
