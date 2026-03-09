'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, X, Send, Sparkles, AlertCircle, 
  Bot, Headphones, Clock, Info, ChevronRight, Copy 
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-toastify';

// --- Types & Constants ---
interface Message {
  role: 'user' | 'assistant' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  agentName?: string;
}

interface TrainingQA {
  question: string;
  answer: string;
}

const TRAINING_DATA: TrainingQA[] = [
  { question: "What is conditional coverage?", answer: "Conditional Coverage is a software testing metric that measures whether each Boolean condition inside control structures has been evaluated to both TRUE and FALSE during execution." },
  { question: "What are the features of TRUSTINN?", answer: "TRUSTINN features include syntax checking, program execution, assertion analysis, conditional coverage measurement, visual chart generation, and report exports in ZIP format." },
  { question: "What are the special features in TRUSTINN?", answer: "TRUSTINN special features include fuzzing for test case generation, automated assertion testing, conditional coverage visualization with pie and bar charts, one-click ZIP export, and support for multiple programming languages like C, Java, Python, and Solidity." },
  { question: "What does the ZIP button do?", answer: "The ZIP button downloads a compressed file that includes your Python program and the output text document with analysis results." },
  { question: "What zip files contain?", answer: "ZIP files contain your Python source program and the complete output analysis report with execution results, assertions summary, and coverage percentage." },
  { question: "What is the copy button?", answer: "The Copy button copies the terminal output to your clipboard so you can paste it elsewhere." },
  { question: "How do I test my Python program?", answer: "Select Python from the language options, select Condition Coverage Fuzzing tool, upload or write your Python program, click Execute, and review the coverage result." },
  { question: "What are the benefits of conditional coverage?", answer: "Conditional Coverage detects hidden logical bugs, improves test quality, helps refactor legacy code safely, builds confidence in business logic, and reduces production failures." }
];

const API_BASE = process.env.NEXT_PUBLIC_NITMINER_API_URL || '';
const SOCKET_URL = API_BASE ? API_BASE.replace('/api', '') : (typeof window !== 'undefined' ? window.location.origin : '');

// --- Component Start ---
export default function UnifiedTrustInnChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am TrustInn AI. I can answer questions about the tool or connect you to a live agent. How can I help?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [agentConnected, setAgentConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string>(`session-${Date.now()}`);

  // --- AI Knowledge Base Logic ---
  const getAIResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    const match = TRAINING_DATA.find(item => 
      lowerQuery.includes(item.question.toLowerCase().split(' ').slice(-2).join(' ')) ||
      item.question.toLowerCase().split(' ').some(word => word.length > 4 && lowerQuery.includes(word))
    );
    
    if (match) return match.answer;
    if (lowerQuery.includes('agent') || lowerQuery.includes('help') || lowerQuery.includes('support')) {
      return "If you'd like to speak with a human, click the 'Connect to Agent' button above!";
    }
    return "I'm not quite sure about that. Try asking about features, ZIP exports, or conditional coverage—or connect to a live agent!";
  };

  // --- Socket.IO Logic ---
  useEffect(() => {
    if (isAgentMode && !socketRef.current) {
      socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });

      socketRef.current.on('agent:connected', (data) => {
        setAgentConnected(true);
        toast.success("Support agent connected!");
        setMessages(prev => [...prev, { role: 'system', content: `${data.agentName || 'Agent'} joined the chat.`, timestamp: new Date() }]);
      });

      socketRef.current.on('agent:message', (data) => {
        if (data.sender === 'admin') {
          setMessages(prev => [...prev, { 
            role: 'agent', 
            content: data.message, 
            agentName: data.agentName || 'Support', 
            timestamp: new Date() 
          }]);
        }
      });

      socketRef.current.on('agent:disconnected', () => {
        setAgentConnected(false);
        setMessages(prev => [...prev, { role: 'system', content: "Agent disconnected.", timestamp: new Date() }]);
      });
    }
  }, [isAgentMode]);

  const handleConnectAgent = () => {
    setIsAgentMode(true);
    setLoading(true);
    // Mimic the request logic from your LiveChatWidget
    setTimeout(() => {
        socketRef.current?.emit('user:request-agent', {
            sessionId: sessionIdRef.current,
            userName: 'User_' + sessionIdRef.current.slice(-4),
        });
        setLoading(false);
    }, 1000);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');

    if (isAgentMode && agentConnected) {
      socketRef.current?.emit('user:message', {
        sessionId: sessionIdRef.current,
        message: currentInput,
      });
    } else {
      setIsTyping(true);
      setTimeout(() => {
        const aiMsg: Message = { role: 'assistant', content: getAIResponse(currentInput), timestamp: new Date() };
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
      }, 600);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full p-4 shadow-2xl hover:scale-110 transition-transform flex items-center gap-2"
        >
          <Bot className="w-6 h-6" />
          <span className="font-semibold px-1">TrustInn Help</span>
        </button>
      )}

      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl w-[400px] h-[600px] flex flex-col overflow-hidden animate-in zoom-in-95">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-purple-800 p-4 text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  {isAgentMode ? <Headphones className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">TrustInn Support</h3>
                  <div className="flex items-center gap-1 text-xs opacity-80">
                    <span className={`w-2 h-2 rounded-full ${agentConnected || !isAgentMode ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                    {isAgentMode ? (agentConnected ? 'Live with Agent' : 'Waiting for Agent...') : 'AI Knowledge Base'}
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Quick Actions / Mode Toggle */}
          {!isAgentMode && (
            <div className="bg-blue-50 p-3 border-b flex justify-between items-center">
              <span className="text-xs font-medium text-blue-700 flex items-center gap-1">
                <Info className="w-3 h-3" /> Can't find what you need?
              </span>
              <button 
                onClick={handleConnectAgent}
                disabled={loading}
                className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full hover:bg-blue-700 transition flex items-center gap-1"
              >
                <Headphones className="w-3 h-3" /> {loading ? 'Connecting...' : 'Live Agent'}
              </button>
            </div>
          )}

          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : msg.role === 'system'
                    ? 'bg-gray-200 text-gray-600 text-[10px] uppercase tracking-wider mx-auto rounded-md'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                }`}>
                  {(msg.role === 'assistant' || msg.role === 'agent') && (
                    <div className="flex items-center gap-1.5 mb-1">
                      {msg.role === 'assistant' ? <Sparkles className="w-3 h-3 text-purple-600" /> : <Headphones className="w-3 h-3 text-blue-600" />}
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        {msg.role === 'assistant' ? 'TrustInn Bot' : (msg.agentName || 'Support Agent')}
                      </span>
                    </div>
                  )}
                  <p className="text-sm">{msg.content}</p>
                  <span className={`text-[9px] block mt-1 opacity-60 ${msg.role === 'user' ? 'text-right' : ''}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-1 p-2">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isAgentMode && !agentConnected ? "Waiting for agent..." : "Type your question..."}
                disabled={isAgentMode && !agentConnected}
                className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || (isAgentMode && !agentConnected)}
                className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              {isAgentMode ? 'Secure Live Session Active' : 'Powered by TrustInn Semantic Search'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}