import CustomerOrderClient from './CustomerOrderClient';

export const dynamic = 'force-dynamic';

export default async function CustomerOrderPage({ params }: { params: Promise<{ tableId: string }> }) {
    const { tableId } = await params;
    return <CustomerOrderClient tableId={tableId} />;
}
