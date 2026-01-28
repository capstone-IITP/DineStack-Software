export interface OrderItem {
    name: string;
    quantity: number;
    notes?: string;
}

export interface KitchenOrder {
    id: string;
    table: string;
    timeElapsed: string; // e.g., "12:45"
    items: OrderItem[];
    status: 'Pending' | 'Preparing' | 'Ready' | 'Served';
    timestamp: Date; // For sorting
}
