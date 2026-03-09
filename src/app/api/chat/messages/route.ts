import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, message, sender, userId } = body;

    console.log('💬 Saving message:', { sessionId, sender, userId, messageLength: message?.length });

    // TODO: Save to database
    // Example: await ChatMessage.create({ sessionId, message, sender, userId, timestamp: new Date() })

    return NextResponse.json({
      success: true,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      message,
      sender,
      userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error saving message:', error);
    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    console.log('📖 Fetching messages for session:', sessionId);

    // TODO: Fetch from database
    // Example: const messages = await ChatMessage.find({ sessionId })

    return NextResponse.json({
      success: true,
      sessionId,
      messages: [],
    });
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
