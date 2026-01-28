'use client';

import React, { useEffect, useState } from 'react';
import { ChefHat, CheckCircle2, Clock } from 'lucide-react';

interface OrderStatusProps {
    tableId: string;
}

export default function OrderStatus({ tableId }: OrderStatusProps) {
    const [step, setStep] = useState(1);

    // Mock progress
    useEffect(() => {
        const t1 = setTimeout(() => setStep(2), 3000);
        const t2 = setTimeout(() => setStep(3), 8000);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">

            <div className="mb-12 relative">
                {/* Ripples */}
                <div className={`absolute inset-0 bg-[#8D0B41] rounded-full opacity-20 animate-ping duration-[3s] ${step < 3 ? 'block' : 'hidden'}`}></div>
                <div className="relative w-24 h-24 bg-[#1F1F1F] rounded-full flex items-center justify-center text-white shadow-2xl z-10">
                    {step === 1 && <Clock size={32} className="animate-pulse" />}
                    {step === 2 && <ChefHat size={32} className="animate-bounce" />}
                    {step === 3 && <CheckCircle2 size={32} className="text-green-400" />}
                </div>
            </div>

            <h1 className="text-2xl font-bold text-[#1F1F1F] mb-2">
                {step === 1 && 'Order Received'}
                {step === 2 && 'Kitchen is Preparing'}
                {step === 3 && 'Order Ready!'}
            </h1>

            <p className="text-gray-500 max-w-xs mx-auto mb-12">
                {step === 1 && 'We have sent your order to the kitchen. Sit tight!'}
                {step === 2 && 'Our chefs are working their magic on your dishes.'}
                {step === 3 && 'Head over to the counter or wait for service.'}
            </p>

            <div className="w-full max-w-xs bg-gray-100 rounded-full h-1.5 overflow-hidden mb-4">
                <div
                    className="bg-[#8D0B41] h-full transition-all duration-1000 ease-out"
                    style={{ width: `${(step / 3) * 100}%` }}
                ></div>
            </div>

            <div className="flex justify-between w-full max-w-xs text-[10px] font-bold uppercase text-gray-400 tracking-widest">
                <span className={step >= 1 ? 'text-[#8D0B41]' : ''}>Received</span>
                <span className={step >= 2 ? 'text-[#8D0B41]' : ''}>Cooking</span>
                <span className={step >= 3 ? 'text-green-600' : ''}>Ready</span>
            </div>

        </div>
    );
}
