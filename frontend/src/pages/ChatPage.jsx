import { useEffect, useRef, useState } from 'react';
import { Bot, Send, User } from 'lucide-react';
import { explainWithAI } from '../api';

const starterPrompts = [
  'Explain demographic parity in this context',
  'How do I reduce disparate impact?',
  'Which metrics should I prioritize?',
];

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Hi, I can help interpret fairness metrics, explain bias signals, and suggest remediation steps for your dataset.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const nextMessageId = useRef(2);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage = { id: nextMessageId.current, sender: 'user', text: trimmed };
    nextMessageId.current += 1;
    setMessages((previous) => [...previous, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await explainWithAI(trimmed);
      const aiMessage = {
        id: nextMessageId.current,
        sender: 'ai',
        text: response,
      };
      nextMessageId.current += 1;
      setMessages((previous) => [...previous, aiMessage]);
    } catch (err) {
      console.error(err);
      const errorMessageId = nextMessageId.current;
      nextMessageId.current += 1;
      setMessages((previous) => [
        ...previous,
        {
          id: errorMessageId,
          sender: 'ai',
          text: 'I could not reach the AI service. Please check the backend connection and try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = (event) => {
    event.preventDefault();
    sendMessage(input);
  };

  return (
    <main className="page-container chat-page">
      <div className="page-header">
        <div>
          <div className="page-kicker">
            <Bot size={16} />
            Fairness assistant
          </div>
          <h1 className="page-title">AI Explainer Chat</h1>
          <p className="page-description">
            Ask for metric interpretation, remediation ideas, or plain-language explanations.
          </p>
        </div>
      </div>

      <section className="card chat-shell">
        <div className="prompt-row">
          {starterPrompts.map((prompt) => (
            <button
              className="prompt-chip"
              type="button"
              key={prompt}
              disabled={isLoading}
              onClick={() => sendMessage(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="chat-messages">
          {messages.map((message) => (
            <div className={`message-row ${message.sender}`} key={message.id}>
              <div className="message-avatar">
                {message.sender === 'ai' ? <Bot size={19} /> : <User size={19} />}
              </div>
              <div className="message-bubble">
                {message.text}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message-row ai">
              <div className="message-avatar">
                <Bot size={19} />
              </div>
              <div className="message-bubble">Thinking...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-composer">
          <form onSubmit={handleSend}>
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about fairness metrics or mitigation"
            />
            <button className="btn-icon" type="submit" disabled={!input.trim() || isLoading} aria-label="Send message">
              <Send size={19} />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
