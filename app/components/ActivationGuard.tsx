'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ActivationGuard() {
    const router = useRouter();

    useEffect(() => {
        const checkSystemStatus = async () => {
            try {
                // Get the ID to validate identity
                const restaurantId = localStorage.getItem('taptable_restaurant_id');
                const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';

                // We send the ID. If backend sees it's missing or invalid/revoked, it returns forceActivation: true
                // If it's empty locally (null), the backend will also return forceActivation: true (per our new logic),
                // but if we handle the null case here ourselves, we might save a call. 
                // However, a secure boot should probably ask the server "Am I okay?".
                // If we have NO local state, we are likely already at Activation, so clearing is harmless.

                const res = await fetch(`${apiUrl}/api/device/status?restaurantId=${restaurantId || ''}`);
                const data = await res.json();

                if (data.forceActivation) {
                    // If the backend forces activation (e.g., revoked or not set up),
                    // check if we have any local state that implies we think we are logged in/setup.
                    // If so, wipe it and reload triggers the main Page to show Activation screen.

                    const hasLocalState = localStorage.getItem('taptable_admin_pin') ||
                        localStorage.getItem('taptable_kitchen_pin') ||
                        localStorage.getItem('taptable_restaurant_id');

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
