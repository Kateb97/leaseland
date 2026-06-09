import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { assistantApi } from '../utils/api';
import StateSelector from '../components/StateSelector';

export default function Assistant() {
  const { user, isSubscribed, canUseFeature } = useAuth();
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

  const renderAssistantMessage = (content) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('# ')) return <h2 key={i} className="analysis-h2">{line.replace('# ', '')}</h2>;
      if (line.startsWith('## ')) return <h3 key={i} className="analysis-h3">{line.replace('## ', '')}</h3>;
      if (line.startsWith('- ')) return <li key={i} className="analysis-li">{line.replace('- ', '')}</li>;
      if (line.startsWith('> ')) return <blockquote key={i} className="analysis-quote">{line.replace('> ', '')}</blockquote>;
      if (line.startsWith('---')) return <hr key={i} className="analysis-hr" />;
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} className="analysis-p">{line}</p>;
    });
  };

  const EXAMPLE_QUESTIONS = [
    'How much bond can my landlord ask for?',
    'What if my landlord won\'t fix the hot water?',
    'How do I get my bond back?',
    'Can my landlord enter without notice?',
    'What happens if I break my lease early?',
    'Can I have a pet in my rental?',
  ];

  return (
    <div className="page-container assistant-page">
      <div className="page-header">
        <h1>💬 Tenancy Assistant</h1>
        <p className="text-muted">Ask any question about renting in Australia — in plain English</p>
        <div className="page-state">
          <StateSelector onStateChange={(s) => setState(s)} />
        </div>
      </div>

      {!isSubscribed && (
        <div className="usage-banner">
          <span>💡</span>
          <span>You have <strong>{user?.free_questions_remaining || 1} free question{(user?.free_questions_remaining || 1) !== 1 ? 's' : ''}</strong> remaining. 
          <a href="/pricing" className="banner-link"> Subscribe for unlimited questions →</a></span>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <div className="assistant-layout">
        <div className="chat-container">
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-welcome">
                <div className="welcome-icon">🏠</div>
                <h3>Ask me anything about renting!</h3>
                <p>I can help with:</p>
                <div className="welcome-topics">
                  <span>💰 Bonds & deposits</span>
                  <span>🔧 Repairs & maintenance</span>
                  <span>📋 Condition reports</span>
                  <span>📅 Breaking a lease</span>
                  <span>🔍 Inspections</span>
                  <span>🐾 Pets</span>
                  <span>📈 Rent increases</span>
                  <span>⚖️ Disputes</span>
                </div>
                <p className="welcome-hint">Try one of the example questions below!</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`chat-message ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === 'user' ? '👤' : '🏠'}
                  </div>
                  <div className="message-content">
                    {msg.role === 'user' ? (
                      <p>{msg.content}</p>
                    ) : (
                      <div className="assistant-response">
                        {renderAssistantMessage(msg.content)}
                      </div>
                    )}
                    <div className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="chat-message assistant">
                <div className="message-avatar">🏠</div>
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
                placeholder="Type your question here..."
                disabled={loading}
                className="chat-input"
                autoFocus
              />
              <button 
                type="submit" 
                className="btn btn-primary chat-send"
                disabled={loading || !message.trim()}
              >
                {loading ? '...' : 'Send'}
              </button>
            </form>
          </div>
        </div>

        <div className="suggestions-panel">
          <h3>Example Questions</h3>
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
            <p>Answers are based on {state.toUpperCase()} tenancy laws</p>
          </div>
        </div>
      </div>
    </div>
  );
}