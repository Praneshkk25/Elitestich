import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Mock successful insertion
        const data = [{ id: crypto.randomUUID(), ...body }];
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to submit review' }, { status: 500 });
    }
}

export async function GET() {
    try {
        // Return empty mock array or a fake review
        const data = [
            {
                id: crypto.randomUUID(),
                created_at: new Date().toISOString(),
                name: 'Mock User',
                rating: 5,
                comment: 'This is a mock review since Supabase was removed.',
                image_url: null
            }
        ];
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch reviews' }, { status: 500 });
    }
}
