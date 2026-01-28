'use client';

import React, { useState } from 'react';
import { ChevronLeft, Save, MapPin, Phone, Building2 } from 'lucide-react';

interface RestaurantSettingsProps {
    onBack: () => void;
}

export default function RestaurantSettings({ onBack }: RestaurantSettingsProps) {
    const [formData, setFormData] = useState({
        name: 'The Grand Bistro',
        address: '123 Culinary Avenue, Food District',
        city: 'Metropolis',
        phone: '+1 (555) 0123-4567',
        email: 'manager@grandbistro.com',
        taxRate: '5.0'
    });

    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setSaved(false);
    };

    const handleSave = () => {
        setIsSaving(true);
        // Mock API call
        setTimeout(() => {
            setIsSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-[#FFFFF0] text-[#1F1F1F] font-mono selection:bg-[#8D0B41] selection:text-white">

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
                    <h1 className="text-lg font-bold tracking-widest uppercase">Configuration</h1>
                    <span className="text-[10px] text-gray-500 font-bold">RESTAURANT SETTINGS</span>
                </div>

                <div className="w-20"></div>
            </nav>

            <main className="max-w-2xl mx-auto pt-12 pb-20 px-6">

                <div className="bg-white p-8 rounded-sm shadow-sm border border-gray-200">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-8 pb-4 border-b border-gray-100 flex items-center gap-2">
                        <Building2 size={16} /> Venue Information
                    </h2>

                    <div className="space-y-6">

                        {/* Name */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Restaurant Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full bg-[#f8f8f8] border-2 border-gray-100 focus:border-[#8D0B41] focus:bg-white px-4 py-3 text-lg font-bold text-[#1F1F1F] outline-none transition-all rounded-sm"
                            />
                        </div>

                        {/* Address Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-2 flex items-center gap-1">
                                    <MapPin size={12} /> Address Line
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full bg-[#f8f8f8] border-2 border-gray-100 focus:border-[#8D0B41] focus:bg-white px-4 py-3 text-sm font-bold text-[#1F1F1F] outline-none transition-all rounded-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">City / Area</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="w-full bg-[#f8f8f8] border-2 border-gray-100 focus:border-[#8D0B41] focus:bg-white px-4 py-3 text-sm font-bold text-[#1F1F1F] outline-none transition-all rounded-sm"
                                />
                            </div>
                        </div>

                        {/* Contact & Tax */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-2 flex items-center gap-1">
                                    <Phone size={12} /> Contact Phone
                                </label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full bg-[#f8f8f8] border-2 border-gray-100 focus:border-[#8D0B41] focus:bg-white px-4 py-3 text-sm font-bold text-[#1F1F1F] outline-none transition-all rounded-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Service Tax (%)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="taxRate"
                                        value={formData.taxRate}
                                        onChange={handleChange}
                                        className="w-full bg-[#f8f8f8] border-2 border-gray-100 focus:border-[#8D0B41] focus:bg-white px-4 py-3 text-sm font-bold text-[#1F1F1F] outline-none transition-all rounded-sm text-right pr-8"
                                    />
                                    <span className="absolute right-3 top-3.5 text-gray-400 font-bold">%</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Actions */}
                    <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between">
                        <span className={`text-xs font-bold uppercase tracking-wider transition-opacity ${saved ? 'text-green-600 opacity-100' : 'opacity-0'}`}>
                            Changes Saved Successfully
                        </span>

                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`
                                flex items-center gap-2 px-8 py-3 rounded-sm font-bold uppercase tracking-widest text-xs transition-all
                                ${isSaving
                                    ? 'bg-gray-300 text-gray-500 cursor-wait'
                                    : 'bg-[#8D0B41] text-white hover:bg-[#7a0a38] shadow-lg hover:shadow-xl'}
                            `}
                        >
                            <Save size={16} />
                            {isSaving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>

                </div>

            </main>
        </div>
    );
}
