import { NextResponse } from 'next/server';

// POST /api/auth/login - Verify passcode
export async function POST(request) {
  try {
    const body = await request.json();
    const { passcode } = body;

    // Get passcode from environment variable
    const correctPasscode = process.env.PASSCODE || '1234';

    // Validate passcode
    if (!passcode) {
      return NextResponse.json(
        { error: 'Passcode is required' },
        { status: 400 }
      );
    }

    // Check if passcode matches
    if (passcode === correctPasscode) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Invalid passcode' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error verifying passcode:', error);
    return NextResponse.json(
      { error: 'Failed to verify passcode', details: error.message },
      { status: 500 }
    );
  }
}
