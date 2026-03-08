import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './Chatbot.module.css';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ text: string; role: string }[]>([]);
  const [status, setStatus] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    const text = message.trim();
    if (!text) return;

    setMessage('');
    setMessages(prev => [...prev, { text, role: 'user' }]);
    setStatus('');
    setIsTyping(true);

    try {
      const { data, error } = await supabase.functions.invoke('chatbot', {
        body: { message: text }
      });

      if (error) throw error;

      const reply = data?.reply || 'No response received.';
      setIsTyping(false);
      setMessages(prev => [...prev, { text: reply, role: 'bot' }]);
      setStatus('');
    } catch (error) {
      setIsTyping(false);
      setStatus(`Chatbot error: ${String(error)}`);
      setMessages(prev => [
        ...prev,
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
        <div className={styles.chatbotAccent} />

        <div className={styles.chatbotHeader}>
          <div className={styles.chatbotAvatar}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
          </div>
          <div className={styles.chatbotHeaderInfo}>
            <div className={styles.chatbotTitle}>BackTrack Assistant</div>
            <div className={styles.chatbotSubtitle}>
              <span className={styles.chatbotOnlineDot}></span>
              AI-powered help
            </div>
          </div>
          <button
            className={styles.chatbotClose}
            onClick={() => setIsOpen(false)}
            aria-label="Close chat"
          >
            &times;
          </button>
        </div>

        <div className={styles.chatbotMessages}>
          {messages.length === 0 && (
            <div className={styles.welcomeMessage}>
              <span className={styles.welcomeEmoji}>&#x1F44B;</span>
              <p className={styles.welcomeText}>
                Ask me about submitting items, browsing, claims, or any BackTrack features.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`${styles.chatbotMessage} ${msg.role === 'user' ? styles.user : ''}`}>
              {msg.text}
            </div>
          ))}

          {isTyping && (
            <div className={styles.typingIndicator}>
              <span className={styles.typingDot}></span>
              <span className={styles.typingDot}></span>
              <span className={styles.typingDot}></span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className={styles.chatbotHint}>
          Only answers BackTrack-related questions.
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
          <button className={styles.chatbotSend} onClick={sendMessage} aria-label="Send message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
