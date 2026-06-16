import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';

export default function Insights() {
  const { insights, isLoading, fetchInsights } = useStore();
  const [activeTab, setActiveTab] = useState<'tips' | 'chat'>('tips');
  
  // Chat States
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: 'Hello! I am your GreenTrace AI Assistant. Ask me anything about tracking, understanding, or reducing your carbon footprint.' }
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!insights && activeTab === 'tips') {
      fetchInsights();
    }
  }, [activeTab]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatLoading, activeTab]);

  const handleRegenerate = () => {
    fetchInsights(true);
  };

  const handleSendChat = async (textToSend: string) => {
    if (!textToSend.trim() || chatLoading) return;

    const userMessage = textToSend.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setChatLoading(true);

    try {
      // Send message along with history (excluding the first welcome message to keep prompt clean)
      const historyToSend = messages.slice(1);
      const res = await api.sendChatMessage(userMessage, historyToSend);
      setMessages((prev) => [...prev, { role: 'model', text: res.reply }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Sorry, I failed to process that request. Please try again.' }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'hard':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">AI Carbon Coaching</h1>
        <p className="text-slate-500 text-sm">
          Personalized advice and interactive AI chat to help you make eco-friendly changes.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-green-100">
        <button
          onClick={() => setActiveTab('tips')}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'tips'
              ? 'border-green-600 text-green-700'
              : 'border-transparent text-slate-500 hover:text-green-600'
          }`}
        >
          💡 Reduction Tips
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'chat'
              ? 'border-green-600 text-green-700'
              : 'border-transparent text-slate-500 hover:text-green-600'
          }`}
        >
          💬 GreenTrace Chat AI
        </button>
      </div>

      {/* Recommendations Tab */}
      {activeTab === 'tips' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={handleRegenerate}
              disabled={isLoading}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 text-sm"
            >
              <span>🔄</span> {isLoading ? 'Generating...' : 'Refresh Tips'}
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-4" aria-live="polite" aria-busy="true">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm animate-pulse space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                  <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {insights && insights.length > 0 ? (
                insights.map((tip, index) => (
                  <div
                    key={index}
                    className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between hover:border-green-300 transition-all hover:shadow-md"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-slate-100 text-slate-700">
                          {tip.category === 'transport' && '🚗'}
                          {tip.category === 'food' && '🍲'}
                          {tip.category === 'energy' && '⚡'}
                          {tip.category === 'shopping' && '🛍️'}
                          {tip.category === 'waste' && '🗑️'}
                          <span className="ml-1">{tip.category}</span>
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border ${getDifficultyColor(tip.difficulty)}`}>
                          {tip.difficulty} Action
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">{tip.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">{tip.description}</p>
                    </div>

                    <div className="bg-green-50 px-6 py-4 rounded-xl border border-green-100 text-center w-full md:w-fit min-w-[150px]">
                      <div className="text-xs text-green-700 font-semibold uppercase tracking-wider mb-1">Est. Savings</div>
                      <div className="text-3xl font-extrabold text-green-800 font-mono">
                        -{tip.estimatedSavingKg}
                        <span className="text-xs font-normal text-green-600 block">kg CO₂e / month</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white p-12 rounded-2xl border border-green-100 shadow-sm text-center space-y-4">
                  <span className="text-5xl block" role="img" aria-label="empty bulb">💡</span>
                  <h2 className="text-lg font-bold text-slate-800">No suggestions available</h2>
                  <p className="text-slate-500 max-w-sm mx-auto text-sm">
                    Log some activities first, then click "Refresh Tips" to let Gemini calculate personalized recommendations for you.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="bg-white border border-green-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[520px]">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-green-600 text-white self-end ml-auto rounded-tr-none'
                    : 'bg-white border border-green-100 text-slate-700 self-start mr-auto rounded-tl-none shadow-sm'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {chatLoading && (
              <div className="bg-white border border-green-100 text-slate-700 self-start mr-auto rounded-2xl rounded-tl-none p-4 shadow-sm max-w-[80%] flex items-center gap-1.5" aria-live="polite">
                <span className="w-2.5 h-2.5 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2.5 h-2.5 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2.5 h-2.5 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestions Panel */}
          <div className="px-6 py-2 bg-slate-50 border-t border-green-50 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-slate-400 font-medium">Suggestions:</span>
            {[
              'How can I cut my transport emissions?',
              'Why is mutton high footprint?',
              'Easy wins for home energy?',
            ].map((suggest) => (
              <button
                key={suggest}
                onClick={() => handleSendChat(suggest)}
                disabled={chatLoading}
                className="text-[11px] bg-white hover:bg-green-50 hover:text-green-700 text-slate-600 px-3 py-1 rounded-full border border-slate-200 hover:border-green-200 transition-all font-medium disabled:opacity-50"
              >
                {suggest}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat(input);
            }}
            className="p-4 border-t border-green-100 flex gap-2 items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about footprint calculator factors, offset targets..."
              disabled={chatLoading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || chatLoading}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 text-sm"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
