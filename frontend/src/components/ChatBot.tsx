import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Sparkles, User, Bot, Loader } from 'lucide-react';
import { api } from '../utils/api';
import type { ChatMessage } from '../utils/api';

interface ChatBotProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export const ChatBot: React.FC<ChatBotProps> = ({ messages, setMessages }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.chatWithInvoice(textToSend, messages);
      setMessages(response.history);
    } catch (error: any) {
      const errorAnswer = {
        role: 'assistant' as const,
        content: "I'm sorry, I couldn't process that request. Make sure you've uploaded and extracted invoice data first."
      };
      setMessages((prev) => [...prev, errorAnswer]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend(input);
    }
  };

  const suggestions = [
    "Who is the supplier?",
    "What is the total invoice amount?",
    "When is the payment due?",
    "What is the tax amount?"
  ];

  return (
    <div className="glass rounded-2xl p-5 flex flex-col h-full min-h-[500px] justify-between">
      {/* Panel Header */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
        <MessageSquare className="w-5 h-5 text-brand-400" />
        <h2 className="text-lg font-semibold text-slate-100">AI Finance Assistant</h2>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[280px] max-h-[350px]">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="p-3 bg-slate-800/40 rounded-full border border-slate-700/60">
              <Bot className="w-8 h-8 text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-300">Ask about this invoice</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Ask specific questions like line items, due dates, billing details or total amounts.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div className={`p-2 rounded-full border flex-shrink-0 ${
                isUser ? 'bg-brand-950/40 border-brand-850' : 'bg-slate-850/60 border-slate-800'
              }`}>
                {isUser ? <User className="w-3.5 h-3.5 text-brand-400" /> : <Bot className="w-3.5 h-3.5 text-brand-400" />}
              </div>
              <div className={`p-3 rounded-2xl text-xs max-w-[80%] leading-relaxed ${
                isUser
                  ? 'bg-brand-600 text-white rounded-tr-none'
                  : 'bg-slate-900/60 text-slate-200 border border-slate-800 rounded-tl-none'
              }`}>
                {msg.content}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-full border bg-slate-850/60 border-slate-800 flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-brand-400" />
            </div>
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-2xl rounded-tl-none flex items-center gap-2">
              <Loader className="w-3.5 h-3.5 text-brand-400 animate-spin" />
              <span className="text-[10px] text-slate-500 font-mono">Analyzing invoice...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length === 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold tracking-wider uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Suggested Queries</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s)}
                className="text-[10px] font-medium text-slate-300 bg-slate-900/40 hover:bg-brand-950/20 border border-slate-800 hover:border-brand-800/40 py-1.5 px-3 rounded-lg transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input Box */}
      <div className="mt-4 flex gap-2 border-t border-slate-800/60 pt-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about the invoice..."
          disabled={isLoading}
          className="flex-1 glass-input rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
        />
        <button
          onClick={() => handleSend(input)}
          disabled={isLoading || !input.trim()}
          className="p-2 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl transition text-white shadow-lg shadow-brand-900/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
