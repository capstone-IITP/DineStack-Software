'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Delete, ShieldCheck, ChevronLeft } from 'lucide-react';

interface ConfirmAdminPinProps {
    originalPin?: string;
    onBack?: () => void;
    onSuccess?: () => void;
}

export default function ConfirmAdminPin({ originalPin = '123456', onBack, onSuccess }: ConfirmAdminPinProps) {
    const [pin, setPin] = useState('');
    const [status, setStatus] = useState('idle'); // idle, error, success
    const PIN_LENGTH = 6;

    const handlePress = useCallback((num: number | string) => {
        if (pin.length < PIN_LENGTH && status !== 'success') {
            setPin((prev) => prev + num);
            if (status === 'error') {
                setStatus('idle');
            }
        }
    }, [pin.length, status]);

    const handleDelete = useCallback(() => {
        setPin((prev) => prev.slice(0, -1));
        if (status === 'error') {
            setStatus('idle');
        }
    }, [status]);

    const handleSubmit = useCallback(() => {
        if (pin === originalPin) {
            setStatus('success');
            console.log('Admin PIN Confirmed:', pin);
            // Navigate to next screen after animation
            setTimeout(() => {
                onSuccess?.();
            }, 800);
        } else {
            setStatus('error');
            setTimeout(() => {
                setPin('');
            }, 500);
        }
    }, [pin, originalPin, onSuccess]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (/^[0-9]$/.test(e.key)) {
                handlePress(e.key);
            } else if (e.key === 'Backspace') {
                handleDelete();
            } else if (e.key === 'Enter' && pin.length === PIN_LENGTH) {
                handleSubmit();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [pin, handlePress, handleDelete, handleSubmit]);

    return (
        <div className="h-screen w-screen bg-[#F3F3E3] flex flex-col items-center overflow-hidden font-mono selection:bg-transparent relative">

            {/* Back Button */}
            <button
                onClick={() => onBack?.()}
                className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-2 text-[#6A6A6A] hover:text-[#1F1F1F] transition-colors z-20"
            >
                <ChevronLeft size={20} strokeWidth={2} />
                <span className="text-xs font-bold tracking-wider uppercase">Back</span>
            </button>

            {/* Decorative Background Elements */}
            <div className="absolute top-12 left-4 md:top-16 md:left-8 text-[10px] text-[#6A6A6A]/40 tracking-widest pointer-events-none z-0">
                SYS_ROOT::ACCESS_LEVEL_0
            </div>
            <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 text-[10px] text-[#6A6A6A]/40 tracking-widest pointer-events-none z-0">
                SECURE_KEY_VERIFY_V.2.0
            </div>

            {/* Main Content Container - Uses justify-evenly to fit any screen height */}
            <div className="flex flex-col items-center w-full max-w-sm px-6 h-full justify-evenly py-4 z-10">

                {/* Context Header */}
                <div className="flex flex-col items-center space-y-3 shrink-0">
                    <div className={`w-8 h-8 rounded-sm flex items-center justify-center mb-1 shadow-sm transition-colors duration-300 ${status === 'success' ? 'bg-[#8D0B41]' : 'bg-[#1F1F1F]'} text-[#F3F3E3]`}>
                        <ShieldCheck size={14} strokeWidth={3} />
                    </div>
                    <h2 className="text-[#1F1F1F] text-xs tracking-[0.3em] font-bold uppercase text-center">
                        Confirm Master Key
                    </h2>
                    <p className="text-[10px] text-[#6A6A6A] tracking-wider text-center">
                        Re-enter your PIN to verify
                    </p>
                </div>

                {/* Mechanical PIN Indicators */}
                <div className="flex gap-2 sm:gap-3 shrink-0">
                    {[...Array(PIN_LENGTH)].map((_, i) => (
                        <div
                            key={i}
                            className={`
                w-8 h-10 sm:w-10 sm:h-12 flex items-center justify-center border-2 transition-all duration-150
                ${status === 'error'
                                    ? 'border-[#8D0B41] bg-[#8D0B41] animate-pulse'
                                    : status === 'success'
                                        ? 'border-[#1F1F1F] bg-[#1F1F1F]'
                                        : i < pin.length
                                            ? 'border-[#1F1F1F] bg-[#1F1F1F] text-[#F3F3E3]'
                                            : 'border-[#D1D1C7] bg-transparent'
                                }
              `}
                        >
                            {(i < pin.length || status === 'error') && (
                                <div className={`w-2 h-2 rounded-sm ${status === 'error' ? 'bg-[#F3F3E3]' : 'bg-[#F3F3E3]'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Status Message */}
                <div className="h-6 flex items-center justify-center shrink-0">
                    {status === 'error' && (
                        <span className="text-xs text-[#8D0B41] font-bold tracking-wider animate-pulse">
                            PIN DOES NOT MATCH
                        </span>
                    )}
                    {status === 'success' && (
                        <span className="text-xs text-[#1F1F1F] font-bold tracking-wider">
                            ✓ PIN VERIFIED SUCCESSFULLY
                        </span>
                    )}
                </div>

                {/* Industrial Keypad - Flex grow to take available space, but clamped max height */}
                <div className="w-full max-h-[400px] shrink-0">
                    <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full h-full">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <button
                                key={num}
                                onClick={() => handlePress(num)}
                                disabled={status === 'success'}
                                className="
                  group relative flex items-center justify-center aspect-[4/3] w-full 
                  bg-[#FFFFF0] text-[#1F1F1F] 
                  border-2 border-[#1F1F1F] border-b-[4px] sm:border-b-[6px] rounded-md
                  active:border-b-2 active:translate-y-[2px] sm:active:translate-y-[4px]
                  transition-all duration-75 outline-none focus:ring-0 tap-highlight-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                            >
                                <span className="text-xl sm:text-2xl font-bold group-active:scale-95 transition-transform">
                                    {num}
                                </span>
                            </button>
                        ))}

                        {/* Empty Slot */}
                        <div className="w-full aspect-[4/3]" />

                        {/* Zero Key */}
                        <button
                            onClick={() => handlePress(0)}
                            disabled={status === 'success'}
                            className="
                group relative flex items-center justify-center aspect-[4/3] w-full 
                bg-[#FFFFF0] text-[#1F1F1F] 
                border-2 border-[#1F1F1F] border-b-[4px] sm:border-b-[6px] rounded-md
                active:border-b-2 active:translate-y-[2px] sm:active:translate-y-[4px]
                transition-all duration-75 outline-none focus:ring-0 tap-highlight-transparent
                disabled:opacity-50 disabled:cursor-not-allowed
              "
                        >
                            <span className="text-xl sm:text-2xl font-bold group-active:scale-95 transition-transform">
                                0
                            </span>
                        </button>

                        {/* Delete Key */}
                        <button
                            onClick={handleDelete}
                            disabled={status === 'success'}
                            className="
                flex items-center justify-center aspect-[4/3] w-full 
                text-[#1F1F1F] opacity-60 hover:opacity-100
                active:scale-95 transition-all outline-none
                disabled:opacity-30 disabled:cursor-not-allowed
              "
                        >
                            <Delete size={24} strokeWidth={2} />
                        </button>
                    </div>
                </div>

                {/* Primary Action Button */}
                <button
                    onClick={handleSubmit}
                    disabled={pin.length !== PIN_LENGTH || status === 'success'}
                    className={`
            w-full h-12 sm:h-14 shrink-0 rounded-md text-xs sm:text-sm font-bold tracking-[0.2em] uppercase transition-all duration-200
            flex items-center justify-center border-2
            ${status === 'success'
                            ? 'bg-[#1F1F1F] text-[#FFFFF0] border-[#1F1F1F] cursor-default'
                            : pin.length === PIN_LENGTH
                                ? 'bg-[#8D0B41] text-[#FFFFF0] border-[#8D0B41] shadow-[0_4px_0_0_#590628] translate-y-0 active:translate-y-[2px] sm:active:translate-y-[4px] active:shadow-none'
                                : 'bg-transparent text-[#D1D1C7] border-[#D1D1C7] cursor-not-allowed'
                        }
          `}
                >
                    {status === 'success' ? 'PIN Confirmed ✓' : pin.length === PIN_LENGTH ? 'Verify Access Key' : 'Re-enter 6 Digits'}
                </button>

            </div>
        </div>
    );
}
