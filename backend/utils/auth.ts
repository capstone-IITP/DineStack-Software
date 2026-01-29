import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_EXPIRY = '30d'; // Long-lived token as requested

export interface DeviceTokenPayload {
    deviceId: string;
    role: 'ADMIN' | 'KITCHEN';
    restaurantId: string;
}

export const generateToken = (payload: DeviceTokenPayload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

export const verifyToken = (token: string): DeviceTokenPayload | null => {
    try {
        return jwt.verify(token, JWT_SECRET) as DeviceTokenPayload;
    } catch (error) {
        return null;
    }
};
