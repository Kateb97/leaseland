import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { leaseApi } from '../utils/api';
import StateSelector from '../components/StateSelector';
import Disclaimer from '../components/Disclaimer';

export default function LeaseCheck() {
  const { user, isSubscribed, canUseFeature, setUser } = useAuth();
  const navigate = useNavigate();
  const [leaseText, setLeaseText] = useState('');
  const [file, setFile] = useState(null);
  const [state, setState] = useState(user?.state || 'nsw');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('paste'); // 'paste' or 'upload'
  const fileInputRef = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
        setError('Please upload a PDF file');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File is too large. Maximum 10MB.');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!canUseFeature) {
      navigate('/pricing');
      return;
    }

    if (mode === 'paste' && leaseText.trim().length < 10) {
      setError('Please enter your lease text (at least 10 characters)');
      return;
    }

    if (mode === 'upload' && !file) {
      setError('Please select a PDF file to upload');
      return;
    }

    setLoading(true);
    try {
      let data;
      if (mode === 'paste') {
        data = await leaseApi.check({ leaseText, state });
      } else {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('state', state);
        data = await leaseApi.upload(formData);
      }
      setResult(data);
      // Update user's remaining questions so paywall state refreshes
      if (data.free_questions_remaining !== undefined) {
        setUser(prev => ({ ...prev, free_questions_remaining: data.free_questions_remaining }));
      }
      // Scroll to results
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      if (err.message?.includes('402') || err.message?.includes('No credits')) {
        navigate('/pricing');
      } else {
        setError(err.message || 'Error analyzing lease. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderAnalysis = (analysis) => {
    if (!analysis) return null;
    
    // Split into sections and render with proper formatting
    const lines = analysis.split('\n');
    return (
      <div className="analysis-content">
        {lines.map((line, i) => {
          if (line.startsWith('# ')) return <h2 key={i} className="analysis-h2">{line.replace('# ', '')}</h2>;
          if (line.startsWith('## ')) return <h3 key={i} className="analysis-h3">{line.replace('## ', '')}</h3>;
          if (line.startsWith('- ')) return <li key={i} className="analysis-li">{line.replace('- ', '')}</li>;
          if (line.startsWith('> ')) return <blockquote key={i} className="analysis-quote">{line.replace('> ', '')}</blockquote>;
          if (line.trim() === '') return <br key={i} />;
          if (line.startsWith('---')) return <hr key={i} className="analysis-hr" />;
          return <p key={i} className="analysis-p">{line}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📄 Lease Checker</h1>
        <p className="text-muted">Paste your lease or upload a PDF. We'll analyze it against {state.toUpperCase()} tenancy laws.</p>
        <div className="page-state">
          <StateSelector onStateChange={(s) => setState(s)} />
        </div>
      </div>

      {!isSubscribed && (
        <div className="usage-banner">
          <span>💡</span>
          <span>You have <strong>{user?.free_questions_remaining || 1} free question{(user?.free_questions_remaining || 1) !== 1 ? 's' : ''}</strong> remaining. 
          <a href="/pricing" className="banner-link"> Subscribe for unlimited checks →</a></span>
        </div>
      )}

      <div className="lease-check-form">
        <div className="mode-tabs">
          <button 
            className={`mode-tab ${mode === 'paste' ? 'active' : ''}`}
            onClick={() => setMode('paste')}
          >
            📝 Paste Text
          </button>
          <button 
            className={`mode-tab ${mode === 'upload' ? 'active' : ''}`}
            onClick={() => setMode('upload')}
          >
            📎 Upload PDF
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'paste' ? (
            <div className="form-group">
              <label htmlFor="leaseText">Paste your lease agreement here</label>
              <textarea
                id="leaseText"
                value={leaseText}
                onChange={(e) => setLeaseText(e.target.value)}
                placeholder="Paste the full text of your rental lease agreement here..."
                rows={12}
                className="lease-textarea"
              />
              <p className="field-hint">Include the full lease text for best results. Minimum 10 characters.</p>
            </div>
          ) : (
            <div className="upload-area">
              <div 
                className="upload-box"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const droppedFile = e.dataTransfer.files[0];
                  if (droppedFile) {
                    setFile(droppedFile);
                  }
                }}
              >
                {file ? (
                  <div className="file-selected">
                    <span className="file-icon">📎</span>
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">({(file.size / 1024).toFixed(0)} KB)</span>
                    <button type="button" className="btn btn-small" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="upload-icon">📄</div>
                    <p>Click to upload or drag & drop a PDF</p>
                    <p className="upload-hint">Maximum 10MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}

          <button 
            type="submit" 
            className="btn btn-primary btn-full btn-large" 
            disabled={loading || (mode === 'paste' && leaseText.trim().length < 10) || (mode === 'upload' && !file)}
          >
            {loading ? '🔍 Analyzing your lease...' : '🔍 Analyze Lease'}
          </button>
        </form>
      </div>

      {result && (
        <div className="lease-result" ref={resultRef}>
          <div className="result-header">
            <h2>Analysis Results</h2>
            <span className="result-state">📍 {state.toUpperCase()}</span>
          </div>
          <div className="result-body">
            {renderAnalysis(result.analysis)}
          </div>
          <div className="result-footer">
            <p>⚡ <strong>Free questions remaining:</strong> {result.free_questions_remaining !== undefined ? result.free_questions_remaining : 'unlimited'}</p>
            <button className="btn btn-secondary" onClick={() => navigate('/assistant')}>
              💬 Ask Follow-up Questions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}