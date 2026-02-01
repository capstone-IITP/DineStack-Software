'use client';

import { useEffect } from 'react';

/**
 * ActivationGuard - Absolute Reset Logic
 * 
 * This component runs on every app boot and checks with the backend
 * whether the current device/restaurant is authorized. If forceActivation
 * is returned AND there is local state, it performs a COMPLETE local state wipe.
 */
export default function ActivationGuard() {

    useEffect(() => {
        const checkSystemStatus = async () => {
            try {
                const restaurantId = localStorage.getItem('dinestack_restaurant_id');
                const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';

                // ALWAYS ask the backend: "Am I authorized?"
                const res = await fetch(`${apiUrl}/api/device/status?restaurantId=${restaurantId || ''}`);
                const data = await res.json();

                if (data.forceActivation) {
                    // Check if we have ANY local state that needs clearing
                    // If we have no state, we're already at activation screen - no need to reload
                    const hasLocalState =
                        localStorage.getItem('dinestack_restaurant_id') ||
                        localStorage.getItem('dinestack_admin_pin') ||
                        localStorage.getItem('dinestack_kitchen_pin') ||
                        localStorage.getItem('dinestack_jwt') ||
                        localStorage.getItem('dinestack_device_session');

                    if (!hasLocalState) {
                        // No local state to clear - we're already at activation screen
                        // Just log and return, don't reload
                        console.log('ℹ️ forceActivation received, but no local state to clear.');
                        return;
                    }

                    console.warn(`⚠️ Force Activation Triggered. Reason: ${data.resetReason}`);

                    // =========================================================
                    // ABSOLUTE RESET - Nothing Survives
                    // =========================================================

                    // 1. Clear localStorage (PINs, tokens, IDs, etc.)
                    localStorage.clear();

                    // 2. Clear sessionStorage
                    sessionStorage.clear();

                    // 3. Clear IndexedDB (often forgotten, but critical)
                    if (window.indexedDB) {
                        try {
                            indexedDB.deleteDatabase('dinestack');
                            indexedDB.deleteDatabase('dinestack-cache');
                        } catch (e) {
                            console.warn('IndexedDB clear failed:', e);
                        }
                    }

                    // 4. Clear any service worker caches
                    if ('caches' in window) {
                        try {
                            caches.keys().then(names => {
                                names.forEach(name => caches.delete(name));
                            });
                        } catch (e) {
                            console.warn('Cache clear failed:', e);
                        }
                    }

                    console.log('🧹 Complete cleanup done. Redirecting to activation...');

                    // 5. Force hard reload to show Activation screen
                    window.location.replace('/');
                }
            } catch (error) {
                console.error('Failed to check system status:', error);
                // On network error, don't force reset - allow offline mode
            }
        };

        checkSystemStatus();
    }, []); // Run once on mount

    return null;
}
