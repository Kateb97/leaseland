import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { assistantApi } from '../utils/api';
import StateSelector from '../components/StateSelector';
import Markdown from '../components/Markdown';
import { Send, Info, MessageSquareText } from 'lucide-react';

const EXAMPLE_QUESTIONS = [
  'How much bond can my landlord ask for?',
  "What if my landlord won't fix the hot water?",
  'How do I get my bond back?',
  'Can my landlord enter without notice?',
  'What happens if I break my lease early?',
  'Can I have a pet in my rental?',
];

export default function Assistant() {
  const { user, isSubscribed, canUseFeature, setUser } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [state, setState] = useState(user?.state || 'nsw');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (!canUseFeature) {
      navigate('/pricing');
      return;
    }

    const userMessage = message.trim();
    setMessage('');
    setError('');

    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date().toISOString() }]);
    setLoading(true);

    try {
      const data = await assistantApi.ask({
        message: userMessage,
        conversationId,
        state,
      });

      setConversationId(data.conversationId);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        timestamp: new Date().toISOString(),
      }]);
      // Update user's remaining questions so paywall state refreshes
      if (data.free_questions_remaining !== undefined) {
        setUser(prev => ({ ...prev, free_questions_remaining: data.free_questions_remaining }));
      }
    } catch (err) {
      if (err.message?.includes('402') || err.message?.includes('No credits')) {
        navigate('/pricing');
      } else {
        setError(err.message || 'Error getting answer. Please try again.');
        // Remove the user message since it failed
        setMessages(prev => prev.slice(0, -1));
      }
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Tenancy assistant</h1>
        <p className="page-sub">Ask anything about renting in Australia, in plain English.</p>
        <StateSelector onStateChange={(s) => setState(s)} />
      </div>

      {!isSubscribed && (
        <div className="usage-banner">
          <Info size={17} />
          <span>
            You have <strong>{user?.free_questions_remaining ?? 1} free question{(user?.free_questions_remaining ?? 1) !== 1 ? 's' : ''}</strong> left.{' '}
            <a href="/pricing">See pricing</a>
          </span>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <div className="assistant-layout">
        <div className="chat-container">
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-welcome">
                <MessageSquareText size={28} />
                <h3>Ask your first question</h3>
                <p>Common topics:</p>
                <div className="welcome-topics">
                  <span>Bonds and deposits</span>
                  <span>Repairs</span>
                  <span>Condition reports</span>
                  <span>Breaking a lease</span>
                  <span>Inspections</span>
                  <span>Pets</span>
                  <span>Rent increases</span>
                  <span>Disputes</span>
                </div>
                <p className="welcome-hint">Or pick an example question.</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`chat-message ${msg.role}`}>
                  <div className="message-content">
                    {msg.role === 'user' ? (
                      <p>{msg.content}</p>
                    ) : (
                      <Markdown content={msg.content} />
                    )}
                    <div className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="chat-message assistant">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <form onSubmit={handleSubmit} className="chat-form">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your question"
                disabled={loading}
                autoFocus
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !message.trim()}
                aria-label="Send"
              >
                <Send size={16} />
                Send
              </button>
            </form>
          </div>
        </div>

        <div className="suggestions-panel">
          <h3>Example questions</h3>
          <div className="suggestions-list">
            {EXAMPLE_QUESTIONS.map((q, i) => (
              <button
                key={i}
                className="suggestion-chip"
                onClick={() => {
                  setMessage(q);
                  inputRef.current?.focus();
                }}
              >
                {q}
              </button>
            ))}
          </div>
          <div className="suggestions-footer">
            <p>Answers are based on {state.toUpperCase()} tenancy laws.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
