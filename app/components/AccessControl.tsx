'use client';

import React, { useState } from 'react';
import { ChevronLeft, Shield, Lock, Key, CheckCircle, AlertTriangle } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import ConfirmAdminPin from './ConfirmAdminPin';
import { apiCall } from '../lib/api';
import { useRouter } from 'next/navigation';

interface AccessControlProps {
    isKitchenPinSet: boolean;
    onBack: () => void;
    onResetKitchenPin: () => void;
    onCreateKitchenPin: () => void;
}

export default function AccessControl({ isKitchenPinSet, onBack, onResetKitchenPin, onCreateKitchenPin }: AccessControlProps) {
    const router = useRouter();
    const [showRevokeWarning, setShowRevokeWarning] = useState(false);
    const [showRevokePin, setShowRevokePin] = useState(false);
    const [revokeError, setRevokeError] = useState<string | null>(null);

    // Revoke Handlers
    const handleRevokeConfirm = () => {
        setShowRevokeWarning(false);
        setShowRevokePin(true);
    };

    const handleRevokeFinal = async (pin: string) => {
        try {
            const res = await apiCall('/api/security/revoke-activation', 'POST', { adminPin: pin });
            if (res.success) {
                // Force a hard reload to ensure all application state is reset
                window.location.href = '/';
            } else {
                setRevokeError(res.error || 'Failed to revoke');
                alert(res.error || 'Failed to revoke activation. Please check PIN.');
                // We keep the PIN screen open or close it?
                // Let's keep it open so they can retry, but usually security UI closes on fail.
                // For now, let's close it to reset.
                setShowRevokePin(false);
            }
        } catch (e) {
            console.error(e);
            alert('Error during revocation');
            setShowRevokePin(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#E5E5E5] text-[#1F1F1F] font-mono selection:bg-[#8D0B41] selection:text-white">

            {/* Modals */}
            <ConfirmationModal
                isOpen={showRevokeWarning}
                title="Deactivate Device"
                message="Are you sure you want to REVOKE ACTIVATION for this device? This will unlink it from the restaurant, delete local data (Orders, Settings), and reset the application. This action cannot be undone."
                confirmLabel="Revoke & Reset"
                cancelLabel="Cancel"
                isDestructive={true}
                onConfirm={handleRevokeConfirm}
                onCancel={() => setShowRevokeWarning(false)}
            />

            {showRevokePin && (
                <div className="fixed inset-0 z-[60] bg-[#F3F3E3]">
                    <ConfirmAdminPin
                        onBack={() => setShowRevokePin(false)}
                        onComplete={handleRevokeFinal}
                    />
                </div>
            )}

            {/* Background Tech Grid */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'linear-gradient(#111 1px, transparent 1px), linear-gradient(90deg, #111 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            {/* Top Bar */}
            <nav className="sticky top-0 left-0 right-0 h-16 bg-[#1F1F1F] text-white z-50 shadow-2xl flex items-center justify-between px-6 border-b-4 border-[#8D0B41]">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span className="text-xs font-bold uppercase">Back</span>
                    </button>
                </div>

                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-bold tracking-widest uppercase">System Security</h1>
                    <span className="text-[10px] text-gray-500 font-bold">ACCESS CONTROL</span>
                </div>

                <div className="w-20"></div> {/* Spacer for balance */}
            </nav>

            <main className="pt-24 pb-20 max-w-4xl mx-auto px-4 md:px-8">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Left: Admin Status Card */}
                    <div className="bg-white p-8 rounded-lg shadow-sm border-l-4 border-gray-800 relative overflow-hidden flex flex-col">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Shield size={120} />
                        </div>

                        <div className="relative z-10 flex-grow">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-6 flex items-center gap-2">
                                <Shield size={14} /> Admin Privileges
                            </h2>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                    <Lock size={32} className="text-gray-800" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-[#1F1F1F]">Root Access</h3>
                                    <span className="text-xs font-bold text-green-600 uppercase flex items-center gap-1">
                                        <CheckCircle size={12} /> Active
                                    </span>
                                </div>
                            </div>

                            <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">
                                Admin access is secured via Master PIN. This grants full control over menu, inventory, tables, and security settings.
                            </p>
                        </div>

                        <div className="relative z-10 pt-6 border-t border-gray-100">
                            <button
                                onClick={() => setShowRevokeWarning(true)}
                                className="w-full py-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold uppercase tracking-widest text-sm rounded-sm transition-all flex items-center justify-center gap-2"
                            >
                                <AlertTriangle size={16} />
                                Revoke Activation
                            </button>
                            <p className="text-[10px] text-red-400 text-center mt-2">
                                Unlinks device & deletes local data
                            </p>
                        </div>
                    </div>

                    {/* Right: Kitchen Access Card */}
                    <div className="bg-[#FFFFF0] p-8 rounded-lg shadow-sm border-l-4 border-[#8D0B41] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Key size={120} className="text-[#8D0B41]" />
                        </div>

                        <div className="relative z-10 h-full flex flex-col">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-[#8D0B41] mb-6 flex items-center gap-2">
                                <Key size={14} /> Kitchen Terminal
                            </h2>

                            <div className="flex items-center gap-4 mb-6">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isKitchenPinSet ? 'bg-[#8D0B41]/10' : 'bg-orange-100'}`}>
                                    {isKitchenPinSet ? (
                                        <CheckCircle size={32} className="text-[#8D0B41]" />
                                    ) : (
                                        <AlertTriangle size={32} className="text-orange-500" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-[#1F1F1F]">Kitchen Access</h3>
                                    <span className={`text-xs font-bold uppercase flex items-center gap-1 ${isKitchenPinSet ? 'text-[#8D0B41]' : 'text-orange-600'}`}>
                                        {isKitchenPinSet ? 'Configured & Online' : 'Not Configured'}
                                    </span>
                                </div>
                            </div>

                            <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">
                                Kitchen staff use this PIN to access the Kitchen Display System (KDS), view incoming orders, and manage item availability in real-time.
                            </p>

                            <div className="mt-auto">
                                {!isKitchenPinSet ? (
                                    <button
                                        onClick={onCreateKitchenPin}
                                        className="w-full py-4 bg-[#8D0B41] hover:bg-[#7a0a38] text-white font-bold uppercase tracking-widest text-sm rounded-sm transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                    >
                                        <Key size={16} />
                                        Initialize Kitchen PIN
                                    </button>
                                ) : (
                                    <button
                                        onClick={onResetKitchenPin}
                                        className="w-full py-4 bg-white border-2 border-[#8D0B41] text-[#8D0B41] hover:bg-[#8D0B41] hover:text-white font-bold uppercase tracking-widest text-sm rounded-sm transition-all flex items-center justify-center gap-2"
                                    >
                                        <AlertTriangle size={16} />
                                        Reset Kitchen PIN
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

            </main>
        </div>
    );
}
