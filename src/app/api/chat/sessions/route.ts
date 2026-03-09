import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, userId, userEmail, userName } = body;

    console.log('📝 Creating chat session:', { sessionId, userId, userEmail, userName });

    // TODO: Save to database
    // Example: await ChatSession.create({ sessionId, userId, userEmail, userName })

    return NextResponse.json({
      success: true,
      sessionId,
      userId,
      userEmail,
      userName,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error creating chat session:', error);
    return NextResponse.json(
      { error: 'Failed to create chat session' },
      { status: 500 }
    );
  }
}
