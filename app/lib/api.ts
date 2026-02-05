export const API_BASE = 'http://localhost:5001';

export interface ApiResponse<T = any> {
    success?: boolean;
    error?: string;
    message?: string;
    [key: string]: any;
}

// API Helper
export const apiCall = async (endpoint: string, method: string = 'GET', body?: any): Promise<ApiResponse> => {
    const headers: any = { 'Content-Type': 'application/json' };
    const storedToken = localStorage.getItem('dinestack_token');
    if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });

        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await res.json();
        } else {
            // Handle non-JSON response gracefully
            const text = await res.text();
            if (!res.ok) return { success: false, error: text || res.statusText };
            return { success: true, message: text };
        }
    } catch (error: any) {
        console.error("API Call Error:", error);
        return { success: false, error: error.message || 'Network Error' };
    }
};
