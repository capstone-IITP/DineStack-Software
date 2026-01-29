'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ActivationGuard() {
    const router = useRouter();

    useEffect(() => {
        const checkSystemStatus = async () => {
            try {
                const res = await fetch('http://localhost:5001/api/device/status');
                const data = await res.json();

                if (data.forceActivation) {
                    // If the backend forces activation (e.g., revoked or not set up),
                    // check if we have any local state that implies we think we are logged in/setup.
                    // If so, wipe it and reload triggers the main Page to show Activation screen.

                    const hasLocalState = localStorage.getItem('taptable_admin_pin') || localStorage.getItem('taptable_kitchen_pin');

                    if (hasLocalState) {
                        console.warn('⚠️ System Revoked or Reset. Forcing cleanup and reload.');
                        localStorage.clear();

                        // Redirect to root/reload to reset internal state of the SPA
                        window.location.href = '/';
                    }
                }
            } catch (error) {
                console.error('Failed to check system status:', error);
            }
        };

        checkSystemStatus();
    }, []); // Run once on mount

    return null;
}
