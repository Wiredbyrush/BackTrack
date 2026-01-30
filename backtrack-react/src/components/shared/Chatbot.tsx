import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './Chatbot.module.css';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { text: "Ask me about BackTrack's features, how to submit items, or how browsing works.", role: 'bot' }
  ]);
  const [status, setStatus] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = message.trim();
    if (!text) return;

    setMessage('');
    setMessages(prev => [...prev, { text, role: 'user' }]);
    setStatus('');

    setMessages(prev => [...prev, { text: 'Thinking...', role: 'bot' }]);

    try {
      const { data, error } = await supabase.functions.invoke('chatbot', {
        body: { message: text }
      });

      if (error) throw error;

      const reply = data?.reply || 'No response received.';
      setMessages(prev => [...prev.slice(0, -1), { text: reply, role: 'bot' }]);
      setStatus('');
    } catch (error) {
      setStatus(`Chatbot error: ${String(error)}`);
      setMessages(prev => [
        ...prev.slice(0, -1),
        { text: 'Sorry, something went wrong. Please try again.', role: 'bot' }
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className={styles.chatbotWidget}>
      <button
        className={styles.chatbotToggle}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open chat assistant"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <circle cx="9" cy="10" r="1" fill="#ffffff"/>
          <circle cx="12" cy="10" r="1" fill="#ffffff"/>
          <circle cx="15" cy="10" r="1" fill="#ffffff"/>
        </svg>
      </button>

      <div className={`${styles.chatbotPanel} ${isOpen ? styles.open : ''}`}>
        <div className={styles.chatbotHeader}>
          <div className={styles.chatbotTitle}>BackTrack Assistant</div>
          <button
            className={styles.chatbotClose}
            onClick={() => setIsOpen(false)}
          >
            &times;
          </button>
        </div>

        <div className={styles.chatbotMessages}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`${styles.chatbotMessage} ${msg.role === 'user' ? styles.user : ''}`}>
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.chatbotHint}>
          Questions outside the website won't be answered.
        </div>

        {status && (
          <div className={`${styles.chatbotStatus} ${status.startsWith('Chatbot error') ? styles.error : ''}`}>
            {status}
          </div>
        )}

        <div className={styles.chatbotFooter}>
          <input
            className={styles.chatbotInput}
            type="text"
            placeholder="Ask about BackTrack..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className={styles.chatbotSend} onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
