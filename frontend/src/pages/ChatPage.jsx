import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { explainWithAI } from '../api';

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: 'Hello! I am your FairLens AI assistant. You can ask me questions about your dataset bias results, how to fix disparate impact, or general AI fairness concepts.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { id: Date.now(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await explainWithAI(userMessage.text);
      const aiMessage = { id: Date.now() + 1, sender: 'ai', text: response };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: 'Sorry, I encountered an error processing your request.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>AI Explainer Chat</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Get context-aware explanations and remediation strategies for your models.</p>
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        {/* Chat Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ 
              display: 'flex', 
              gap: '1rem',
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%'
            }}>
              {msg.sender === 'ai' && (
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255, 152, 0, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={20} color="var(--primary-amber)" />
                </div>
              )}
              
              <div style={{
                backgroundColor: msg.sender === 'user' ? 'var(--primary-amber)' : 'var(--bg-dark)',
                color: msg.sender === 'user' ? '#000' : 'var(--text-primary)',
                padding: '1rem 1.5rem',
                borderRadius: msg.sender === 'user' ? '20px 20px 0 20px' : '20px 20px 20px 0',
                lineHeight: 1.5,
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}>
                {msg.text}
              </div>

              {msg.sender === 'user' && (
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={20} color="var(--text-secondary)" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div style={{ display: 'flex', gap: '1rem', alignSelf: 'flex-start', maxWidth: '80%' }}>
               <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255, 152, 0, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={20} color="var(--primary-amber)" />
                </div>
                <div style={{ backgroundColor: 'var(--bg-dark)', padding: '1rem 1.5rem', borderRadius: '20px 20px 20px 0', color: 'var(--text-secondary)' }}>
                  Thinking...
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about fixing disparate impact..."
              style={{ flex: 1, padding: '1rem 1.5rem', borderRadius: '30px', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)' }}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              style={{ width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
