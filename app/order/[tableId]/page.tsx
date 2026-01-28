import CustomerOrderClient from './CustomerOrderClient';

export async function generateStaticParams() {
    return Array.from({ length: 20 }, (_, i) => ({
        tableId: `T-${String(i + 1).padStart(2, '0')}`,
    }));
}

export default async function CustomerOrderPage({ params }: { params: Promise<{ tableId: string }> }) {
    const { tableId } = await params;
    return <CustomerOrderClient tableId={tableId} />;
}
