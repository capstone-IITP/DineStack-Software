'use client';

import React, { useState, useEffect } from 'react';
import {
    Terminal,
    LayoutGrid,
    Upload,
    CheckCircle2,
    Power,
    Cpu,
    Users,
    ChefHat,
    Wifi,
    Plus,
    Minus,
    AlertCircle,
    Lock,
    KeyRound,
    X,
    Delete
} from 'lucide-react';

// Sub-component for Status Items to keep code clean
function StatusItem({ label, status, active = true, icon }: { label: string; status: string; active?: boolean; icon: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-[#6A6A6A]">
                {icon}
                <span>{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-[#8D0B41]' : 'bg-gray-300'}`}></div>
                <span className={`font-medium ${active ? 'text-[#1F1F1F]' : 'text-gray-400'}`}>{status}</span>
            </div>
        </div>
    );
}

export default function TapTableInit({ restaurantId, adminPin, onComplete }: { restaurantId: string; adminPin: string; onComplete?: () => void }) {
    // --- State Management ---
    const [restaurantName, setRestaurantName] = useState('');
    const [tableCount, setTableCount] = useState(12); // Start with some visual density
    const [logoUploaded, setLogoUploaded] = useState(false);
    const [systemStatus, setSystemStatus] = useState('STANDBY'); // STANDBY, CHECKING, READY, ACTIVE
    const [isAnimating, setIsAnimating] = useState(false);

    // Kitchen Access State
    const [kitchenPinConfigured, setKitchenPinConfigured] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [kitchenPin, setKitchenPin] = useState('');
    const [confirmKitchenPin, setConfirmKitchenPin] = useState('');
    const [pinStep, setPinStep] = useState<'create' | 'confirm'>('create');
    const [pinError, setPinError] = useState('');

    // --- Constants & Config ---
    const MAX_TABLES = 48;
    const MIN_TABLES = 1;
    const BRAND_ACCENT = '#8D0B41';
    const SURFACE_COLOR = '#FFFFF0';
    const BG_COLOR = '#FFFFFF';
    const TEXT_PRIMARY = '#1F1F1F';
    const TEXT_SECONDARY = '#6A6A6A';

    // --- Handlers ---
    const handleLogoUpload = () => {
        // Simulate upload
        setLogoUploaded(true);
    };

    const handleTableChange = (delta: number) => {
        setTableCount((prev) => {
            const newVal = prev + delta;
            if (newVal > MAX_TABLES) return MAX_TABLES;
            if (newVal < MIN_TABLES) return MIN_TABLES;
            return newVal;
        });
    };

    // Kitchen PIN Handlers
    const openPinModal = () => {
        setShowPinModal(true);
        setKitchenPin('');
        setConfirmKitchenPin('');
        setPinStep('create');
        setPinError('');
    };

    const closePinModal = () => {
        setShowPinModal(false);
        setKitchenPin('');
        setConfirmKitchenPin('');
        setPinStep('create');
        setPinError('');
    };

    const handlePinKeyPress = (num: number) => {
        if (pinStep === 'create' && kitchenPin.length < 4) {
            setKitchenPin(prev => prev + num);
            setPinError('');
        } else if (pinStep === 'confirm' && confirmKitchenPin.length < 4) {
            setConfirmKitchenPin(prev => prev + num);
            setPinError('');
        }
    };

    const handlePinDelete = () => {
        if (pinStep === 'create') {
            setKitchenPin(prev => prev.slice(0, -1));
        } else {
            setConfirmKitchenPin(prev => prev.slice(0, -1));
        }
        setPinError('');
    };

    const handlePinSubmit = () => {
        if (pinStep === 'create') {
            if (kitchenPin.length === 4) {
                setPinStep('confirm');
            }
        } else {
            if (confirmKitchenPin === kitchenPin) {
                setKitchenPinConfigured(true);
                localStorage.setItem('taptable_kitchen_pin', kitchenPin);
                closePinModal();
            } else {
                setPinError('PIN does not match');
                setConfirmKitchenPin('');
            }
        }
    };

    const handleResetKitchenPin = () => {
        setKitchenPinConfigured(false);
        openPinModal();
    };

    const handleActivate = async () => {
        if (!restaurantName || !kitchenPinConfigured) return;

        setSystemStatus('CHECKING');
        setIsAnimating(true);

        try {
            console.log('Activating...', {
                restaurantId,
                adminPin,
                kitchenPin: localStorage.getItem('taptable_kitchen_pin')
            });
            // Persist PINs to backend
            const response = await fetch('http://localhost:5001/api/setup-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    restaurantId,
                    adminPin,
                    kitchenPin: localStorage.getItem('taptable_kitchen_pin')
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Setup failed');
            }

            // Simulate system initialization sequence
            setTimeout(() => setSystemStatus('READY'), 800);
            setTimeout(() => {
                setSystemStatus('ACTIVE');
                setIsAnimating(false);
                setTimeout(() => {
                    onComplete?.();
                }, 1000);
            }, 2000);
        } catch (error) {
            console.error('Activation Error:', error);
            setSystemStatus('STANDBY');
            setIsAnimating(false);
            alert('Initialization Error: ' + (error as Error).message);
        }
    };

    // Check if system can be initialized
    const canInitialize = restaurantName && kitchenPinConfigured;

    // --- Render Helpers ---
    const renderTableGrid = () => {
        // We create a fixed grid and fill it based on count
        const slots = Array.from({ length: MAX_TABLES });

        return (
            <div className="grid grid-cols-6 gap-3 w-full h-full content-start">
                {slots.map((_, i) => {
                    const isActive = i < tableCount;
                    return (
                        <div
                            key={i}
                            className={`
                aspect-square rounded-md transition-all duration-300 ease-out flex items-center justify-center
                ${isActive
                                    ? 'bg-[#8D0B41] shadow-sm scale-100 opacity-100'
                                    : 'bg-[#FFFFF0] scale-90 opacity-50 border border-dashed border-[#6A6A6A]/20'
                                }
              `}
                        >
                            {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full opacity-50" />}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div
            className="h-screen w-screen overflow-hidden font-sans select-none flex flex-col"
            style={{ backgroundColor: BG_COLOR, color: TEXT_PRIMARY }}
        >
            {/* --- Top System Bar --- */}
            <header className="h-16 flex items-center justify-between px-8 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                    <Terminal size={20} color={BRAND_ACCENT} />
                    <span className="font-bold tracking-tight text-sm uppercase text-[#6A6A6A]">
                        TapTable OS <span className="text-[#1F1F1F] mx-2">|</span> Initialization Mode
                    </span>
                </div>

                {/* Live Name Reflection */}
                <div className="flex items-center gap-4">
                    <div className={`text-xl font-bold transition-opacity duration-300 ${restaurantName ? 'opacity-100' : 'opacity-0'}`} style={{ color: BRAND_ACCENT }}>
                        {restaurantName || '...'}
                    </div>
                    <div className="h-2 w-2 rounded-full bg-[#1F1F1F] animate-pulse"></div>
                </div>
            </header>

            {/* --- Main Dashboard Canvas --- */}
            <main className="flex-1 p-8 grid grid-cols-12 gap-8 h-full overflow-hidden">

                {/* ZONE 1: Identity & Branding (Left Col - 4/12) */}
                <div className="col-span-4 flex flex-col gap-8 h-full">

                    {/* Identity Block */}
                    <section className="flex-1 flex flex-col justify-center p-8 rounded-xl border border-transparent transition-all hover:border-gray-100" style={{ backgroundColor: SURFACE_COLOR }}>
                        <div className="flex items-center gap-2 mb-6 text-[#6A6A6A]">
                            <ChefHat size={18} />
                            <span className="text-xs font-bold tracking-wider uppercase">Establishment Identity</span>
                        </div>

                        <label className="block text-sm font-medium mb-2 text-[#6A6A6A]">Restaurant Name</label>
                        <input
                            type="text"
                            value={restaurantName}
                            onChange={(e) => setRestaurantName(e.target.value)}
                            placeholder="Enter Name"
                            className="w-full bg-transparent text-4xl font-bold outline-none placeholder:text-gray-300 border-b-2 border-transparent focus:border-[#8D0B41] transition-colors pb-2"
                            style={{ color: TEXT_PRIMARY }}
                            autoFocus
                        />
                        <p className="mt-4 text-xs text-[#6A6A6A]">
                            This will be the unique identifier for your POS network.
                        </p>
                    </section>

                    {/* Branding Block */}
                    <section className="h-1/3 p-8 rounded-xl relative overflow-hidden group" style={{ backgroundColor: SURFACE_COLOR }}>
                        <div className="flex items-center justify-between mb-4 text-[#6A6A6A]">
                            <div className="flex items-center gap-2">
                                <LayoutGrid size={18} />
                                <span className="text-xs font-bold tracking-wider uppercase">Brand Asset</span>
                            </div>
                        </div>

                        <div
                            onClick={handleLogoUpload}
                            className="absolute inset-0 top-12 m-4 border-2 border-dashed border-[#6A6A6A]/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-[#8D0B41] transition-all duration-300"
                        >
                            {logoUploaded ? (
                                <div className="relative w-full h-full flex items-center justify-center bg-white">
                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-[#8D0B41]"></div>
                                    {/* Placeholder for uploaded logo */}
                                    <div className="text-2xl font-black tracking-tighter" style={{ color: BRAND_ACCENT }}>
                                        {restaurantName ? restaurantName.substring(0, 2).toUpperCase() : 'LOGO'}
                                    </div>
                                    <div className="absolute top-2 right-2">
                                        <CheckCircle2 size={16} color={BRAND_ACCENT} />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <Upload size={24} className="mb-2 text-[#6A6A6A] group-hover:text-[#8D0B41]" />
                                    <span className="text-xs font-medium text-[#6A6A6A]">Tap to Load Vector</span>
                                </>
                            )}
                        </div>
                    </section>
                </div>

                {/* ZONE 2: Spatial Configuration (Center Col - 5/12) */}
                <div className="col-span-5 flex flex-col h-full rounded-2xl p-1" style={{ backgroundColor: BG_COLOR }}>
                    <div className="flex items-center justify-between mb-6 px-2">
                        <div className="flex items-center gap-2 text-[#6A6A6A]">
                            <Users size={18} />
                            <span className="text-xs font-bold tracking-wider uppercase">Floor Capacity</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => handleTableChange(-1)}
                                className="w-8 h-8 rounded flex items-center justify-center hover:bg-[#FFFFF0] text-[#6A6A6A] hover:text-[#8D0B41] transition-colors"
                            >
                                <Minus size={18} />
                            </button>
                            <span className="text-2xl font-bold w-12 text-center" style={{ color: TEXT_PRIMARY }}>
                                {tableCount}
                            </span>
                            <button
                                onClick={() => handleTableChange(1)}
                                className="w-8 h-8 rounded flex items-center justify-center hover:bg-[#FFFFF0] text-[#6A6A6A] hover:text-[#8D0B41] transition-colors"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>

                    {/* The Visual Grid Container */}
                    <div className="flex-1 rounded-xl p-6 relative overflow-hidden" style={{ backgroundColor: SURFACE_COLOR }}>
                        <div className="absolute inset-0 p-6 overflow-y-auto no-scrollbar">
                            {renderTableGrid()}
                        </div>

                        {/* Overlay Gradient for bottom fade if needed, though we aim for fit */}
                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#FFFFF0] to-transparent pointer-events-none"></div>
                    </div>

                    <div className="mt-4 px-2 flex justify-between items-center">
                        <span className="text-xs text-[#6A6A6A]">Visual representation of active nodes.</span>
                        <span className="text-xs font-medium" style={{ color: BRAND_ACCENT }}>Max Capacity: {MAX_TABLES}</span>
                    </div>
                </div>

                {/* ZONE 3: System Status & Activation (Right Col - 3/12) */}
                <div className="col-span-3 flex flex-col justify-between h-full">

                    {/* Status Display */}
                    <div className="rounded-xl p-6 flex flex-col gap-4" style={{ backgroundColor: SURFACE_COLOR }}>
                        <div className="flex items-center gap-2 mb-2 text-[#6A6A6A]">
                            <Cpu size={18} />
                            <span className="text-xs font-bold tracking-wider uppercase">System Diagnostics</span>
                        </div>

                        <div className="space-y-3">
                            <StatusItem label="Network" status="Secure" icon={<Wifi size={14} />} />
                            <StatusItem label="Database" status="Connected" icon={<Terminal size={14} />} />
                            <StatusItem
                                label="Config"
                                status={restaurantName && logoUploaded ? "Valid" : "Incomplete"}
                                active={!!(restaurantName && logoUploaded)}
                                icon={<AlertCircle size={14} />}
                            />
                        </div>
                    </div>

                    {/* Kitchen Access Block */}
                    <div className="rounded-xl p-6 flex flex-col gap-4 mt-4" style={{ backgroundColor: SURFACE_COLOR }}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[#1F1F1F]">
                                <KeyRound size={18} />
                                <span className="text-xs font-bold tracking-wider uppercase">Kitchen Access</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${kitchenPinConfigured ? 'bg-[#8D0B41]' : 'bg-gray-300'}`}></div>
                                <span className={`text-xs font-medium ${kitchenPinConfigured ? 'text-[#8D0B41]' : 'text-[#6A6A6A]'}`}>
                                    {kitchenPinConfigured ? 'Configured' : 'Not Configured'}
                                </span>
                            </div>
                        </div>

                        {kitchenPinConfigured ? (
                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] text-[#6A6A6A]">Kitchen access secured</span>
                                <button
                                    onClick={handleResetKitchenPin}
                                    className="w-full py-2 text-xs font-bold tracking-wider uppercase text-[#6A6A6A] hover:text-[#1F1F1F] transition-colors"
                                >
                                    Reset Kitchen PIN
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={openPinModal}
                                className="w-full py-3 text-xs font-bold tracking-wider uppercase text-white transition-all hover:opacity-90"
                                style={{ backgroundColor: BRAND_ACCENT }}
                            >
                                Create Kitchen PIN
                            </button>
                        )}
                    </div>

                    {/* Activation Zone */}
                    <div className="mt-auto">
                        <div className="mb-4 text-right">
                            <div className="text-xs text-[#6A6A6A] mb-1">Total Active Nodes</div>
                            <div className="text-4xl font-bold" style={{ color: TEXT_PRIMARY }}>{tableCount}</div>
                        </div>

                        <button
                            onClick={handleActivate}
                            disabled={systemStatus === 'ACTIVE' || !canInitialize}
                            className={`
                 w-full h-24 rounded-none relative overflow-hidden group transition-all duration-500
                 flex flex-col items-center justify-center
                 ${!canInitialize && systemStatus !== 'ACTIVE' ? 'opacity-60 cursor-not-allowed' : ''}
               `}
                            style={{
                                backgroundColor: systemStatus === 'ACTIVE' ? '#1F1F1F' : BRAND_ACCENT,
                            }}
                        >
                            {/* Hover/Active Effect Overlay */}
                            <div className="absolute inset-0 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>

                            {/* Loading Bar */}
                            {systemStatus === 'CHECKING' && (
                                <div className="absolute bottom-0 left-0 h-1 bg-white animate-[width_2s_ease-in-out_forwards]" style={{ width: '100%' }}></div>
                            )}

                            <div className="relative z-10 flex flex-col items-center gap-1">
                                {systemStatus === 'ACTIVE' ? (
                                    <>
                                        <CheckCircle2 size={32} className="text-white mb-1" />
                                        <span className="text-white font-bold tracking-widest uppercase text-sm">System Online</span>
                                    </>
                                ) : systemStatus === 'CHECKING' ? (
                                    <span className="text-white font-mono uppercase text-sm animate-pulse">Initializing Sequence...</span>
                                ) : (
                                    <>
                                        <Power size={24} className="text-white mb-1 group-hover:scale-110 transition-transform" />
                                        <span className="text-white font-bold tracking-widest uppercase text-sm">Initialize TapTable</span>
                                        {!restaurantName && <span className="text-[10px] text-white/60">Requires Restaurant Name</span>}
                                        {restaurantName && !kitchenPinConfigured && <span className="text-[10px] text-white/60">Kitchen access must be configured</span>}
                                    </>
                                )}
                            </div>
                        </button>

                        <div className="mt-2 text-center">
                            <span className="text-[10px] uppercase tracking-widest text-[#6A6A6A]">
                                {systemStatus === 'ACTIVE' ? 'Ready for Service' : 'Wait for setup completion'}
                            </span>
                        </div>
                    </div>
                </div>

            </main>

            {/* Kitchen PIN Creation Modal */}
            {showPinModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#FFFFF0] w-full max-w-sm mx-4 rounded-xl overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 pb-4">
                            <div className="flex items-center gap-2">
                                <Lock size={18} className="text-[#1F1F1F]" />
                                <span className="text-sm font-bold tracking-wider uppercase text-[#1F1F1F]">
                                    {pinStep === 'create' ? 'Create Kitchen PIN' : 'Confirm Kitchen PIN'}
                                </span>
                            </div>
                            <button onClick={closePinModal} className="text-[#6A6A6A] hover:text-[#1F1F1F] transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* PIN Display */}
                        <div className="px-6 pb-4">
                            <p className="text-xs text-[#6A6A6A] mb-4 text-center">
                                {pinStep === 'create' ? 'Enter a 4-digit PIN for kitchen access' : 'Re-enter PIN to confirm'}
                            </p>
                            <div className="flex justify-center gap-3 mb-2">
                                {[0, 1, 2, 3].map((i) => {
                                    const currentPin = pinStep === 'create' ? kitchenPin : confirmKitchenPin;
                                    return (
                                        <div
                                            key={i}
                                            className={`w-12 h-14 flex items-center justify-center border-2 transition-all duration-150 ${i < currentPin.length
                                                ? 'border-[#1F1F1F] bg-[#1F1F1F]'
                                                : 'border-[#D1D1C7] bg-transparent'
                                                }`}
                                        >
                                            {i < currentPin.length && (
                                                <div className="w-2.5 h-2.5 bg-[#FFFFF0] rounded-sm" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            {pinError && (
                                <p className="text-xs text-[#8D0B41] text-center font-medium mt-2">{pinError}</p>
                            )}
                        </div>

                        {/* Keypad */}
                        <div className="px-6 pb-4">
                            <div className="grid grid-cols-3 gap-2">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => handlePinKeyPress(num)}
                                        className="aspect-[4/3] bg-white text-[#1F1F1F] text-xl font-bold border-2 border-[#1F1F1F] border-b-4 rounded-md active:border-b-2 active:translate-y-[2px] transition-all"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <div />
                                <button
                                    onClick={() => handlePinKeyPress(0)}
                                    className="aspect-[4/3] bg-white text-[#1F1F1F] text-xl font-bold border-2 border-[#1F1F1F] border-b-4 rounded-md active:border-b-2 active:translate-y-[2px] transition-all"
                                >
                                    0
                                </button>
                                <button
                                    onClick={handlePinDelete}
                                    className="aspect-[4/3] flex items-center justify-center text-[#6A6A6A] hover:text-[#1F1F1F] transition-colors"
                                >
                                    <Delete size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="p-6 pt-2">
                            <button
                                onClick={handlePinSubmit}
                                disabled={(pinStep === 'create' ? kitchenPin.length : confirmKitchenPin.length) !== 4}
                                className={`w-full py-4 text-sm font-bold tracking-wider uppercase transition-all ${(pinStep === 'create' ? kitchenPin.length : confirmKitchenPin.length) === 4
                                    ? 'bg-[#8D0B41] text-white'
                                    : 'bg-[#D1D1C7] text-[#6A6A6A] cursor-not-allowed'
                                    }`}
                            >
                                {pinStep === 'create' ? 'Continue' : 'Confirm PIN'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
