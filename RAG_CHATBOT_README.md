# TrustInn Chatbot - RAG-Powered Assistant

## Overview

The TrustInn chatbot has been completely redesigned with a Retrieval Augmented Generation (RAG) system powered by actual knowledge base documents.

## Key Features

### 1. Dynamic Q&A System
- Users type any question about TrustInn
- Automatically searches knowledge base (9 documents)
- Returns answers with source attribution
- No hard-coded FAQ categories

### 2. Live Agent Connection with Timeout
- "Live Agent" button initiates contact with support team
- 5-minute timeout period for agent availability
- If no agent connects within 5 minutes:
  - Shows "Agent Unavailable" status (red indicator)
  - Displays message: "Our support team is currently unavailable. Please try again later or send us an email"
  - Input field becomes disabled

### 3. Smart Status Indicators
- **Blue**: AI Help Center (RAG) mode
- **Yellow (pulsing)**: Attempting to connect to agent
- **Green**: Agent is online and connected
- **Red**: Support team unavailable (timeout reached)

### 4. Seamless Message Routing
- If agent connected: messages go to live agent
- If agent not connected: messages queried against knowledge base
- Users always get responses (either from RAG or agent)

## Implementation Details

### Frontend Component
- **File**: `/root/trustinn/client/src/components/AIChatbot.tsx`
- **Views**: 
  - `search` - Main interface for questions
  - `chat` - Active agent conversation
- **States**:
  - `isAgentMode` - Whether actively requesting agent
  - `agentConnected` - Agent status
  - `isAgentUnavailable` - Timeout triggered
  - `messages` - Conversation history
  - `loading` - Request processing state

### Backend Services
- **RAG Engine**: `/root/nitminer/src/lib/rag.ts`
- **API Routes**: 
  - `/api/rag/query` - Search knowledge base
  - `/api/rag/chat` - Save chat sessions
- **Knowledge Base**: `/root/nitminer/public/data/extracted_data.json`

## Usage Flow

### Asking a Question
```
1. User opens chatbot
2. Types question in search view
3. Presses Enter or clicks Send
4. RAG queries knowledge base
5. Answer displayed with sources
```

### Connecting with Agent
```
1. User clicks "Live Agent" button
2. Connection request sent to server
3. 5-minute countdown starts
4. If agent responds:
   - Green status indicator
   - Message input enabled for agent chat
5. If no response in 5 minutes:
   - Red status indicator
   - "Support unavailable" message
   - Input field disabled
```

## Configuration

### Timeout Settings
- Agent connection timeout: **5 minutes** (300,000 ms)
- Located in `handleRequestAgent()` function

### Backend URL
- Default: `https://nitminer.com`
- Used for all API calls and WebSocket connections

### RAG Parameters
- Top-K results: 5 (configurable per request)
- Similarity algorithm: Word-overlap based
- Snippet length: 200 characters

## Error Handling

### RAG Failures
- Network error → Shows error toast
- No results → "Couldn't find information" message
- Server error → Generic error response

### Agent Connection Failures
- Connection timeout → "Support unavailable" message
- Network error → Error toast with actionable message
- Session save failures → Logged to console

## Performance Considerations

- Knowledge base loaded once (cached in memory)
- WebSocket for real-time agent communication
- Axios with fallback for HTTP requests
- Debounced input validation
- Lazy scroll to new messages

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires WebSocket support
- Uses localStorage for session persistence

## Future Enhancements

- Vector-based similarity search (replacing word-overlap)
- Conversation context awareness
- Feedback mechanism for RAG accuracy
- Multi-language support
- Chat history persistence
- Agent availability status
