'use client';

import React, { useState } from 'react';
import { ChevronLeft, Printer, Volume2, Bug, Wifi, Save, Server } from 'lucide-react';

interface SystemPreferencesProps {
    onBack: () => void;
}

export default function SystemPreferences({ onBack }: SystemPreferencesProps) {
    const [config, setConfig] = useState({
        autoPrintKitchen: true,
        autoPrintCustomer: false,
        soundNotifications: true,
        debugMode: false,
        kdsSyncMode: 'realtime'
    });

    // Mock Printer Status
    const [printers] = useState([
        { name: 'Kitchen Thermal 1', status: 'Online', ip: '192.168.1.50' },
        { name: 'Bar Printer', status: 'Offline', ip: '192.168.1.51' },
        { name: 'Receipt Counter', status: 'Online', ip: '192.168.1.52' }
    ]);

    const toggle = (key: keyof typeof config) => {
        // Safe toggle using functional update and known boolean keys
        setConfig(prev => {
            const val = prev[key];
            if (typeof val === 'boolean') {
                return { ...prev, [key]: !val };
            }
            return prev;
        });
    };

    return (
        <div className="min-h-screen bg-[#1F1F1F] text-gray-300 font-mono selection:bg-[#8D0B41] selection:text-white">

            {/* Top Bar */}
            <nav className="sticky top-0 left-0 right-0 h-16 bg-[#2a2a2a] text-white z-50 shadow-md flex items-center justify-between px-6 border-b border-gray-800">
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
                    <h1 className="text-lg font-bold tracking-widest uppercase">System Core</h1>
                    <span className="text-[10px] text-[#8D0B41] font-bold">PREFERENCES & HARDWARE</span>
                </div>

                <div className="w-20"></div>
            </nav>

            <main className="max-w-4xl mx-auto pt-12 pb-20 px-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Left: Toggles */}
                    <div className="space-y-8">

                        {/* Printing Section */}
                        <div className="bg-[#2A2A2A] p-6 rounded-sm border border-gray-800">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-6 flex items-center gap-2">
                                <Printer size={14} /> Auto-Print Behavior
                            </h2>
                            <div className="space-y-4">
                                <ToggleRow
                                    label="Kitchen Tickets"
                                    desc="Auto-print new confirmed orders"
                                    active={config.autoPrintKitchen}
                                    onClick={() => toggle('autoPrintKitchen')}
                                />
                                <ToggleRow
                                    label="Customer Receipts"
                                    desc="Print upon payment completion"
                                    active={config.autoPrintCustomer}
                                    onClick={() => toggle('autoPrintCustomer')}
                                />
                            </div>
                        </div>

                        {/* General Section */}
                        <div className="bg-[#2A2A2A] p-6 rounded-sm border border-gray-800">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-6 flex items-center gap-2">
                                <Server size={14} /> System Behavior
                            </h2>
                            <div className="space-y-4">
                                <ToggleRow
                                    label="Sound Alerts"
                                    desc="Play chimes for new orders/notifications"
                                    active={config.soundNotifications}
                                    onClick={() => toggle('soundNotifications')}
                                    icon={Volume2}
                                />
                                <ToggleRow
                                    label="Debug Mode"
                                    desc="Show verbose error logs and network stats"
                                    active={config.debugMode}
                                    onClick={() => toggle('debugMode')}
                                    icon={Bug}
                                    warn
                                />
                            </div>
                        </div>

                    </div>

                    {/* Right: Hardware Status */}
                    <div className="bg-[#2A2A2A] p-6 rounded-sm border border-gray-800 h-fit">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                <Wifi size={14} /> Networked Printers
                            </h2>
                            <button className="text-[10px] font-bold uppercase text-[#8D0B41] hover:text-white transition-colors">
                                Refresh
                            </button>
                        </div>

                        <div className="space-y-3">
                            {printers.map((p, i) => (
                                <div key={i} className="bg-[#1f1f1f] p-4 flex items-center justify-between border-l-2 border-transparent hover:border-[#8D0B41] transition-all group">
                                    <div>
                                        <div className="text-sm font-bold text-gray-300 group-hover:text-white">{p.name}</div>
                                        <div className="text-[10px] font-mono text-gray-600">{p.ip}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${p.status === 'Online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500'}`}></span>
                                        <span className={`text-[10px] uppercase font-bold ${p.status === 'Online' ? 'text-green-600' : 'text-red-600'}`}>
                                            {p.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-800 text-center">
                            <p className="text-[10px] text-gray-600 font-mono">
                                TapTable Core v1.2.4 (Build 8903)
                            </p>
                        </div>
                    </div>

                </div>

            </main>
        </div>
    );
}

// Sub-component for uniform toggle rows
function ToggleRow({ label, desc, active, onClick, icon: Icon, warn }: any) {
    return (
        <div
            onClick={onClick}
            className="flex items-center justify-between p-3 rounded-sm hover:bg-[#333] cursor-pointer transition-colors group"
        >
            <div className="flex items-start gap-3">
                {Icon && <Icon size={16} className={`mt-0.5 ${warn && active ? 'text-yellow-500' : 'text-gray-500'}`} />}
                <div>
                    <div className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">{label}</div>
                    <div className="text-[10px] text-gray-500">{desc}</div>
                </div>
            </div>

            <div className={`
                w-10 h-5 rounded-full relative transition-colors duration-200
                ${active ? (warn ? 'bg-yellow-600' : 'bg-[#8D0B41]') : 'bg-gray-700'}
            `}>
                <div className={`
                    absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200
                    ${active ? 'left-6' : 'left-1'}
                `}></div>
            </div>
        </div>
    );
}
