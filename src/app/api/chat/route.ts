import { NextRequest, NextResponse } from 'next/server';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

// Platform-specific knowledge base with page URLs
const PLATFORM_CONTEXT = `You are a friendly and helpful AI assistant for the TrustInn Security Testing Platform. You are conversational, understanding, and contextually aware.

TrustInn is a comprehensive security testing platform that offers:
- CBMC (C Bounded Model Checker) - for C code verification
- KLEE & KLEEMA - symbolic execution tools
- gMCov & gMutant - code coverage and mutation testing
- Solc & VeriSol - smart contract verification
- Java verification tools
- Python testing tools

Key Features:
- Free trial period with limited executions
- Premium membership with unlimited access
- Payment integration via Razorpay
- OTP-based login
- PDF receipt generation via Cloudinary
- Download results as ZIP files

IMPORTANT PAGE URLS TO REFERENCE:
- Homepage: /
- Login/Signup: /login
- Pricing/Premium: /pricing
- Dashboard: /dashboard
- Tools Page: /dashboard/tools
- Account Settings: /dashboard/settings
- Payment/Subscription: /dashboard/subscription

Your Behavior:
1. Handle greetings naturally - if user says "hi", "hey", "hy", "hello", etc., respond warmly with "Hi! How can I help you today?" or similar
2. Interpret typos and short phrases contextually instead of asking for clarification
3. Be conversational and friendly while maintaining professionalism
4. Provide helpful responses even for ambiguous or very short inputs
5. Guide users toward TrustInn features naturally
6. Do NOT use markdown syntax like **, ##, etc. in your responses - use plain text only
7. When suggesting a page or feature, ALWAYS include the URL in parentheses (e.g., visit our pricing page at /pricing)

Help users with:
- How to use the tools
- Account setup and login (direct to /login)
- Payment and subscription information (direct to /pricing or /dashboard/subscription)
- Tool selection and parameters (direct to /dashboard/tools)
- Result interpretation
- Account management (direct to /dashboard/settings)
- General platform guidance

For general greetings, typos, or unclear inputs: respond naturally and helpfully. For questions genuinely unrelated to TrustInn (like weather, sports, random facts), politely redirect to platform topics while remaining friendly.`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400 }
      );
    }

    if (!PERPLEXITY_API_KEY) {
      console.error('PERPLEXITY_API_KEY is not set');
      return NextResponse.json(
        { error: 'AI service is not configured' },
        { status: 500 }
      );
    }

    // Prepare conversation history - validate and clean
    let messages: Message[] = [];

    // Add system message as first message
    messages.push({
      role: 'user',
      content: PLATFORM_CONTEXT
    });
    messages.push({
      role: 'assistant',
      content: 'I understand. I am an AI assistant for the TrustInn Security Testing Platform. I will help users with platform-related questions and stay within the scope of TrustInn features and services.'
    });

    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      // Filter out invalid messages and ensure proper alternation
      const validMessages: Message[] = [];
      let lastRole: string | null = 'assistant'; // We just added an assistant message

      for (const msg of conversationHistory) {
        if (msg.role && msg.content && typeof msg.content === 'string') {
          // Only add if it doesn't have same role as last message
          if (msg.role !== lastRole) {
            validMessages.push(msg);
            lastRole = msg.role;
          }
        }
      }

      messages = messages.concat(validMessages);
    }

    // Ensure last message in history is not a user message (to avoid duplication)
    // We need the last message before adding new user message to be 'assistant'
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      messages.pop();
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message
    });

    // Log for debugging
    console.log('Sending messages to Perplexity:', messages.map(m => ({ role: m.role, length: m.content.length })));

    // Call Perplexity API
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: messages,
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Perplexity API error:', errorData);
      
      return NextResponse.json(
        {
          error: 'Failed to get response from AI service',
          details: errorData
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return NextResponse.json(
        { error: 'Invalid response format from AI service' },
        { status: 500 }
      );
    }

    const aiResponse = data.choices[0].message.content;

    // Check if response is about platform scope
    const isRelevant = checkPlatformRelevance(message, aiResponse);
    
    let finalResponse = aiResponse;
    if (!isRelevant && isOffTopicQuestion(message)) {
      finalResponse = `I appreciate your question, but it's not related to the TrustInn Security Testing Platform. I'm specifically trained to help with:

• Account management and authentication (Login, OTP, Signup)
• Tool usage (CBMC, KLEE, KLEEMA, gMCov, gMutant, Solc, VeriSol, Java, Python tools)
• Subscription and payment information
• Result interpretation and file management
• Feature explanations

For general assistance outside TrustInn, please visit other resources. How can I help you with TrustInn today?`;
    }

    return NextResponse.json({
      response: finalResponse,
      model: data.model,
      usage: data.usage
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    return NextResponse.json(
      {
        error: 'An error occurred while processing your request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to check if response is platform-related
function checkPlatformRelevance(question: string, response: string): boolean {
  const platformKeywords = [
    'trustinn', 'cbmc', 'klee', 'kleema', 'gmcov', 'gmutant', 'solc', 'verisol',
    'verification', 'testing', 'security', 'premium', 'trial', 'login', 'otp',
    'payment', 'razorpay', 'receipt', 'zip', 'download', 'execution', 'tool',
    'subscription', 'account', 'dashboard', 'tools page'
  ];

  const combinedText = `${question} ${response}`.toLowerCase();
  
  return platformKeywords.some(keyword => combinedText.includes(keyword));
}

// Helper function to detect off-topic questions
function isOffTopicQuestion(question: string): boolean {
  const offTopicKeywords = [
    'weather', 'sports', 'politics', 'movie', 'recipe', 'joke',
    'music', 'game', 'history fact', 'wikipedia', 'translate',
    'what is', 'who is', 'when did', 'where is'
  ];

  const lowerQuestion = question.toLowerCase();
  
  return offTopicKeywords.some(keyword => lowerQuestion.includes(keyword));
}
