'use client';

import React, { useState } from 'react';
import { Shield, Lock, X, ChevronRight, Loader } from 'lucide-react';

interface ResetKitchenPinProps {
    onCancel: () => void;
    onConfirmed: (adminPin: string) => void;
}

export default function ResetKitchenPin({ onCancel, onConfirmed }: ResetKitchenPinProps) {
    const [pin, setPin] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleVerify = async () => {
        if (!pin || pin.length < 4) {
            setError('Enter a valid Admin PIN');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // We verify the PIN via the API here to fail fast,
            // but we also pass it to the parent for the final secure update call.

            // NOTE: We assume page.tsx provides an API method or we fetch relative.
            const API_BASE = 'http://localhost:5001';
            const res = await fetch(`${API_BASE}/api/security/verify-admin-pin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('dinestack_token')}` // Ensure token is present
                },
                body: JSON.stringify({ adminPin: pin })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Verification failed');
            }

            // Success -> Proceed to next step
            onConfirmed(pin);

        } catch (err: any) {
            setError(err.message || 'Verification failed');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#1F1F1F] text-white font-mono flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Tech Grid */}
            <div className="absolute inset-0 pointer-events-none opacity-5"
                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            <div className="max-w-md w-full relative z-10 bg-[#2A2A2A] border-l-4 border-[#8D0B41] p-10 rounded-lg shadow-2xl">

                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-[#8D0B41]/20 rounded-full flex items-center justify-center">
                        <Shield size={32} className="text-[#8D0B41]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold uppercase tracking-wider">Admin Verification</h1>
                        <p className="text-gray-400 text-xs">Security Clearance Required</p>
                    </div>
                </div>

                <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                    Please enter your <strong className="text-white">Admin PIN</strong> to authorize this security change.
                </p>

                <div className="space-y-6">
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} // Numbers only, max 6
                            placeholder="Enter Admin PIN"
                            className="w-full bg-[#1F1F1F] border border-gray-700 focus:border-[#8D0B41] rounded-sm py-4 pl-12 pr-4 text-white placeholder-gray-600 outline-none tracking-widest text-lg transition-all"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-900/20 border border-red-900/50 text-red-400 text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                            <X size={14} /> {error}
                        </div>
                    )}

                    <button
                        onClick={handleVerify}
                        disabled={isLoading || pin.length < 4}
                        className={`
                            w-full py-4 font-bold uppercase tracking-widest text-sm rounded-sm transition-all shadow-lg flex items-center justify-center gap-2
                            ${isLoading || pin.length < 4 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-[#8D0B41] hover:bg-[#7a0a38] text-white hover:shadow-xl'}
                        `}
                    >
                        {isLoading ? (
                            <>
                                <Loader size={16} className="animate-spin" /> Verifying...
                            </>
                        ) : (
                            <>
                                Verify & Proceed <ChevronRight size={16} />
                            </>
                        )}
                    </button>

                    <div className="text-center">
                        <button onClick={onCancel} className="text-gray-500 hover:text-white text-xs uppercase tracking-widest font-bold">
                            Cancel
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
