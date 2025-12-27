'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Send,
    Mic,
    MicOff,
    Sparkles,
    Loader,
    Calendar,
    Users,
    CreditCard,
    MessageSquare,
    Check,
    X,
    Clock,
    RefreshCw,
} from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    action?: {
        type: 'schedule_update' | 'member_lookup' | 'payment_action' | 'confirmation';
        data?: any;
        pending?: boolean;
    };
}

// Quick action suggestions
const QUICK_ACTIONS = [
    { icon: Calendar, label: 'Move a class', prompt: 'I want to reschedule a class' },
    { icon: Users, label: 'Find a member', prompt: 'Look up member information for' },
    { icon: CreditCard, label: 'Check payments', prompt: 'Show me overdue payments' },
    { icon: Clock, label: "Today's schedule", prompt: "What's on the schedule today?" },
];

export default function AssistantClient() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hi! I'm your Flow State AI assistant. I can help you manage the gym - update schedules, look up members, handle payments, and more. What would you like to do?",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Initialize speech recognition
    useEffect(() => {
        if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-AU';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = () => {
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const handleSend = async (text?: string) => {
        const messageText = text || input.trim();
        if (!messageText || isLoading) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: messageText,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageText,
                    history: messages.slice(-10),
                }),
            });

            const data = await response.json();

            const assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: data.response,
                timestamp: new Date(),
                action: data.action,
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (err) {
            const errorMessage: Message = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: "Sorry, I couldn't process that request. Please try again.",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        }

        setIsLoading(false);
    };

    const handleConfirmAction = async (messageId: string, confirmed: boolean) => {
        setMessages((prev) =>
            prev.map((m) => {
                if (m.id === messageId && m.action) {
                    return {
                        ...m,
                        action: { ...m.action, pending: true },
                    };
                }
                return m;
            })
        );

        if (confirmed) {
            // Execute the confirmed action
            const message = messages.find((m) => m.id === messageId);
            if (message?.action) {
                try {
                    await fetch('/api/assistant/execute', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(message.action),
                    });

                    const successMessage: Message = {
                        id: `success-${Date.now()}`,
                        role: 'assistant',
                        content: '✅ Done! The action has been completed.',
                        timestamp: new Date(),
                    };
                    setMessages((prev) => [...prev, successMessage]);
                } catch (err) {
                    const errorMessage: Message = {
                        id: `error-${Date.now()}`,
                        role: 'assistant',
                        content: "❌ Sorry, there was an error executing that action.",
                        timestamp: new Date(),
                    };
                    setMessages((prev) => [...prev, errorMessage]);
                }
            }
        } else {
            const cancelMessage: Message = {
                id: `cancel-${Date.now()}`,
                role: 'assistant',
                content: 'No problem, action cancelled. What else can I help with?',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, cancelMessage]);
        }

        // Remove pending state
        setMessages((prev) =>
            prev.map((m) => {
                if (m.id === messageId && m.action) {
                    return {
                        ...m,
                        action: undefined,
                    };
                }
                return m;
            })
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] p-4 lg:p-8">
            {/* Header */}
            <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Sparkles className="w-6 h-6" />
                </div>
                <div className="ml-4">
                    <h1 className="text-2xl font-bold text-slate-900">AI Assistant</h1>
                    <p className="text-slate-500 text-sm">Powered by Gemini</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 text-slate-900'
                                    }`}
                            >
                                <p className="whitespace-pre-wrap">{message.content}</p>

                                {/* Action confirmation */}
                                {message.action?.type === 'confirmation' && (
                                    <div className="mt-3 flex gap-2">
                                        {message.action.pending ? (
                                            <div className="flex items-center text-slate-500">
                                                <Loader className="w-4 h-4 animate-spin mr-2" />
                                                Processing...
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleConfirmAction(message.id, true)}
                                                    className="flex items-center px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                                                >
                                                    <Check className="w-4 h-4 mr-1" />
                                                    Confirm
                                                </button>
                                                <button
                                                    onClick={() => handleConfirmAction(message.id, false)}
                                                    className="flex items-center px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors"
                                                >
                                                    <X className="w-4 h-4 mr-1" />
                                                    Cancel
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}

                                <p className="text-xs opacity-50 mt-2">
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-100 rounded-2xl px-4 py-3 flex items-center">
                                <Loader className="w-5 h-5 animate-spin text-slate-500" />
                                <span className="ml-2 text-slate-500">Thinking...</span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions */}
                {messages.length <= 2 && (
                    <div className="px-4 pb-4">
                        <p className="text-xs text-slate-500 mb-2">Quick actions:</p>
                        <div className="flex flex-wrap gap-2">
                            {QUICK_ACTIONS.map((action) => (
                                <button
                                    key={action.label}
                                    onClick={() => handleSend(action.prompt)}
                                    className="flex items-center px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm text-slate-700 transition-colors"
                                >
                                    <action.icon className="w-4 h-4 mr-2" />
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input */}
                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleListening}
                            className={`p-3 rounded-xl transition-colors ${isListening
                                    ? 'bg-red-500 text-white animate-pulse'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>

                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={isListening ? 'Listening...' : 'Type a message or use voice...'}
                            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            disabled={isListening}
                        />

                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading}
                            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
