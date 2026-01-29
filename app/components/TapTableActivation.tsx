'use client';

import React, { useState } from 'react';
import { Terminal, ShieldCheck, Lock, Cpu, Server } from 'lucide-react';

export default function TapTableActivation({ onSuccess }: { onSuccess?: (restaurantId: string) => void }) {
    const [code, setCode] = useState('');
    const [status, setStatus] = useState('idle'); // idle, validating, error, success
    const [statusMessage, setStatusMessage] = useState('AWAITING INPUT');

    // Hardcoded valid code for demonstration (format: XXXX-XXXX-XXXX-XXXX)
    const VALID_CODE = 'TAP8-8842-SYSA-CT00';

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.toUpperCase();

        // Remove all non-alphanumeric characters first
        const cleanVal = value.replace(/[^A-Z0-9]/g, '');

        // Auto-format with dashes every 4 characters (XXXX-XXXX-XXXX-XXXX)
        const formatted = cleanVal
            .slice(0, 16) // Max 16 characters (4 groups of 4)
            .replace(/(.{4})/g, '$1-')
            .replace(/-$/, ''); // Remove trailing dash

        setCode(formatted);

        if (status !== 'idle') {
            setStatus('idle');
            setStatusMessage('AWAITING INPUT');
        }
    };

    const handleActivate = async () => {
        if (!code) return;

        setStatus('validating');
        setStatusMessage('VERIFYING LICENSE SIGNATURE...');

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
            const response = await fetch(`${apiUrl}/api/activate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activationCode: code }),
            });

            if (!response.ok) {
                const text = await response.text();
                console.error(`API Error (${response.status}):`, text.slice(0, 200));
                setStatus('error');
                setStatusMessage(`SERVER ERROR: ${response.status}`);
                return;
            }

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                // Log what we actually got
                console.error("Received non-JSON response:", text.slice(0, 200));
                setStatus('error');
                setStatusMessage("INVALID SERVER RESPONSE (NOT JSON)");
                return;
            }

            // Parse JSON only after verification
            const data = await response.json();

            if (data.success) {
                setStatus('success');
                setStatusMessage('LICENSE VERIFIED. INITIALIZING CORE...');
                // Navigate to next screen after a short delay
                setTimeout(() => {
                    onSuccess?.(data.restaurantId);
                }, 1000);
            } else {
                setStatus('error');
                setStatusMessage(data.error?.toUpperCase() || 'ACTIVATION FAILED.');
            }
        } catch (error) {
            console.error('Activation error:', error);
            setStatus('error');
            setStatusMessage('CONNECTION ERROR. RETRY.');
        }
    };

    // Keyboard support for Enter
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleActivate();
        }
    };

    return (
        <div className="h-screen w-screen bg-[#FFFFFF] flex flex-col items-center justify-center overflow-hidden font-sans select-none text-[#1F1F1F]">

            {/* Top Status Bar (Decoration) */}
            <div className="absolute top-0 left-0 w-full px-8 py-6 flex justify-between items-end border-b border-[#F0F0F0]">
                <div className="flex items-center gap-3">
                    <img src="/assets/TapTable-Bg.png" alt="TapTable" className="h-6 w-auto object-contain" />
                    <span className="tracking-[0.2em] text-xs font-bold text-[#6A6A6A]">
                        TAPTABLE // SYS_INIT_V1.0
                    </span>
                </div>
                <div className="flex items-center gap-4 text-[#6A6A6A] text-xs font-mono">
                    <div className="flex items-center gap-2">
                        <Server size={14} />
                        <span>NODE_UNLINKED</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Lock size={14} />
                        <span>SECURE_BOOT</span>
                    </div>
                </div>
            </div>

            {/* Main Content Zone */}
            <div className="w-full max-w-2xl flex flex-col items-center z-10">

                {/* Identity */}
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-bold tracking-tighter text-[#1F1F1F] mb-2 flex items-center justify-center gap-3">
                        <img src="/assets/TapTable-Bg.png" alt="TapTable" className="h-15 w-auto object-contain" />
                        TAPTABLE
                    </h1>
                    <p className="text-sm tracking-[0.3em] text-[#6A6A6A] uppercase font-medium">
                        System Activation Interface
                    </p>
                </div>

                {/* Input Zone */}
                <div className="w-full max-w-lg mb-8">
                    <label
                        htmlFor="activation-code"
                        className="block text-xs font-bold tracking-[0.15em] text-[#1F1F1F] mb-3 uppercase pl-1"
                    >
                        Activation Code
                    </label>

                    <div className="relative group">
                        <input
                            id="activation-code"
                            type="text"
                            value={code}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="XXXX-XXXX-XXXX-XXXX"
                            autoComplete="off"
                            autoFocus
                            className={`
                w-full bg-[#FFFFF0] border-2 text-center text-2xl font-mono tracking-[0.2em] py-6 px-4
                outline-none transition-colors duration-200 uppercase placeholder-[#E0E0D0]
                ${status === 'error' ? 'border-[#6A6A6A] text-[#1F1F1F]' : 'border-transparent focus:border-[#8D0B41]'}
                ${status === 'success' ? 'text-[#8D0B41] border-[#8D0B41]' : 'text-[#1F1F1F]'}
              `}
                        />

                        {/* Corner Indicators for "Technical" feel */}
                        <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-[#8D0B41] opacity-50 pointer-events-none" />
                        <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-[#8D0B41] opacity-50 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-[#8D0B41] opacity-50 pointer-events-none" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-[#8D0B41] opacity-50 pointer-events-none" />
                    </div>

                    {/* Status Feedback Line */}
                    <div className="h-8 mt-4 flex items-center justify-center">
                        {status === 'validating' && (
                            <span className="text-xs font-mono text-[#6A6A6A] animate-pulse">
                                [{statusMessage}]
                            </span>
                        )}
                        {status === 'error' && (
                            <span className="text-xs font-mono text-[#1F1F1F] font-bold">
                                ⚠ {statusMessage}
                            </span>
                        )}
                        {status === 'success' && (
                            <span className="text-xs font-mono text-[#8D0B41] font-bold flex items-center gap-2">
                                <ShieldCheck size={14} /> {statusMessage}
                            </span>
                        )}
                        {status === 'idle' && (
                            <span className="text-xs font-mono text-[#CCCCCC]">
                                {code.length === 0 ? "WAITING FOR INPUT..." : "ENTER 16-DIGIT LICENSE KEY"}
                            </span>
                        )}
                    </div>
                </div>

                {/* Primary Action */}
                <button
                    onClick={handleActivate}
                    disabled={status === 'validating' || status === 'success'}
                    className={`
            relative overflow-hidden group px-12 py-4 bg-[#8D0B41] text-white
            font-bold tracking-[0.1em] uppercase text-sm transition-all duration-300
            disabled:opacity-80 disabled:cursor-not-allowed
            hover:shadow-lg active:scale-[0.98]
            w-64 flex justify-center items-center
          `}
                >
                    {status === 'validating' ? (
                        <span className="animate-pulse">PROCESSING...</span>
                    ) : status === 'success' ? (
                        <span>ACTIVATED</span>
                    ) : (
                        <span>ACTIVATE SYSTEM</span>
                    )}

                    {/* Button Hover Shine Effect (subtle) */}
                    <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                </button>

            </div>

            {/* Footer / Device ID */}
            <div className="absolute bottom-8 text-center">
                <div className="text-[10px] text-[#6A6A6A] font-mono mb-2">
                    DEVICE_HASH: 8F:2A:CC:11:09
                </div>
                <div className="w-full h-px bg-[#F0F0F0] w-32 mx-auto" />
            </div>

            <style>{`
        /* Custom subtle animation for hover shine */
        @keyframes shine {
          100% {
            left: 125%;
          }
        }
        .animate-shine {
          animation: shine 1s;
        }
      `}</style>
        </div>
    );
}
