import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            email,
            customerName,
            designTitle,
            basePrice,
            includeMeasurements,
            paymentMethod
        } = body;

        const totalAmount = basePrice + (includeMeasurements ? 500 : 0);

        // Mock Order Data
        const mockOrderId = crypto.randomUUID();
        const mockOrder = {
            id: mockOrderId,
            customer_name: customerName,
            email: email,
            design_title: designTitle,
            amount: totalAmount,
            status: 'pending',
            payment_status: paymentMethod === 'cod' ? 'pending_cod' : 'paid',
            payment_method: paymentMethod,
        };

        // Return success with order ID
        return NextResponse.json({
            success: true,
            orderId: mockOrderId,
            url: `${request.headers.get('origin')}/track?order_id=${mockOrderId}`
        });

    } catch (err: any) {
        console.error('Order creation error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
