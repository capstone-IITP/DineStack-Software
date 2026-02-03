// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';

/**
 * ActivationGuard - Absolute Reset Logic & Continuous Protection
 * 
 * - Checks status on MOUNT
 * - Checks status on VISIBILITY CHANGE (Foreground)
 * - Checks status on POLLED INTERVAL (30s)
 * - Blocks rendering (returns loading) until validated
 */
export default function ActivationGuard() {
    const [isVerifying, setIsVerifying] = useState(true);

    const checkSystemStatus = async () => {
        try {
            // Check if we are even logged in/activated locally
            const restaurantId = typeof window !== 'undefined' ? localStorage.getItem('dinestack_restaurant_id') : null;

            // If we don't have a restaurant ID, we assume we are in 'Setup/Activation' mode 
            // so we don't need to force reset, but we also stop verifying.
            // If the user navigates randomly, the page components should handle auth, 
            // but this guard ensures GLOBAL license validity.
            if (!restaurantId) {
                setIsVerifying(false);
                return;
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';

            // ALWAYS ask the backend: "Am I authorized?"
            const res = await fetch(`${apiUrl}/api/system/status`);

            if (!res.ok) {
                // Network error or backend down? 
                // We might choose to fail open or closed. 
                // For now, fail OPEN (allow access) if backend is unreachable to avoid offline lockout,
                // UNLESS we want strict online requirement.
                setIsVerifying(false);
                return;
            }

            const data = await res.json();

            if (data.forceActivation) {
                console.warn(`⚠️ Force Activation Triggered. Reason: ${data.resetReason}`);
                performAbsoluteReset(data.resetReason);
            } else {
                // All good
                setIsVerifying(false);
            }
        } catch (error) {
            console.error('Failed to check system status:', error);
            // On network error in strict mode, we might want to block?
            // Current decision: Allow offline usage, backend will sync eventually.
            setIsVerifying(false);
        }
    };

    const performAbsoluteReset = (reason: string) => {
        // =========================================================
        // ABSOLUTE RESET - Nothing Survives
        // =========================================================
        console.log('🔥 INITIATING TOTAL SYSTEM WIPE 🔥');

        // 1. Clear localStorage
        localStorage.clear();

        // 2. Clear sessionStorage
        sessionStorage.clear();

        // 3. Clear Cookies (helper)
        document.cookie.split(";").forEach((c) => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        // 4. Clear IndexedDB
        if (window.indexedDB) {
            try {
                indexedDB.deleteDatabase('dinestack');
                indexedDB.deleteDatabase('dinestack-cache');
            } catch (e) { console.warn(e); }
        }

        // 5. Force hard reload to root
        window.location.href = `/?reason=${encodeURIComponent(reason || 'Session Expired')}`;
    };

    useEffect(() => {
        // 1. Initial Check
        checkSystemStatus();

        // 2. Foreground Check
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('👁️ App returned to foreground, re-verifying...');
                checkSystemStatus();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // 3. Polling Check (every 30s)
        const intervalId = setInterval(() => {
            // Only poll if we are visible to save resources, or just poll always
            if (document.visibilityState === 'visible') {
                checkSystemStatus();
            }
        }, 30000);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearInterval(intervalId);
        };
    }, []);

    // While verifying initial status, we could block UI or just render null.
    // Making it invisible for now to prevent flicker if it's fast.
    // If it takes long, a spinner might be better.
    if (isVerifying) {
        return (
            <div className="fixed inset-0 z-[9999] bg-white dark:bg-neutral-950 flex items-center justify-center">
                {/* Minimal loader */}
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-4 w-4 bg-orange-500 rounded-full mb-2"></div>
                    <p className="text-xs text-neutral-500 font-mono">Verifying License...</p>
                </div>
            </div>
        );
    }

    return null;
}
