import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { leaseApi } from '../utils/api';
import StateSelector from '../components/StateSelector';
import Markdown from '../components/Markdown';
import {
  ClipboardList, Upload, FileText, MapPin, Info, Loader2, MessageSquareText,
} from 'lucide-react';

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

  return (
    <div className="page-container page-narrow">
      <div className="page-header">
        <h1>Lease check</h1>
        <p className="page-sub">
          Paste your lease or upload the PDF. We'll review it against {state.toUpperCase()} tenancy laws.
        </p>
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

      <div className="lease-check-form">
        <div className="mode-tabs">
          <button
            className={`mode-tab ${mode === 'paste' ? 'active' : ''}`}
            onClick={() => setMode('paste')}
            type="button"
          >
            <ClipboardList size={16} />
            Paste text
          </button>
          <button
            className={`mode-tab ${mode === 'upload' ? 'active' : ''}`}
            onClick={() => setMode('upload')}
            type="button"
          >
            <Upload size={16} />
            Upload PDF
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'paste' ? (
            <div className="form-group">
              <label htmlFor="leaseText">Lease agreement</label>
              <textarea
                id="leaseText"
                value={leaseText}
                onChange={(e) => setLeaseText(e.target.value)}
                placeholder="Paste the full text of your rental lease agreement here"
                rows={12}
              />
              <p className="field-hint">Include the full lease text for the most complete review.</p>
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
                    <FileText size={18} />
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">({(file.size / 1024).toFixed(0)} KB)</span>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={26} />
                    <p>Click to upload or drag a PDF here</p>
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
            className="btn btn-primary btn-block btn-lg"
            disabled={loading || (mode === 'paste' && leaseText.trim().length < 10) || (mode === 'upload' && !file)}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin-icon" style={{ animation: 'spin 0.8s linear infinite' }} />
                Reviewing your lease…
              </>
            ) : 'Review lease'}
          </button>
        </form>
      </div>

      {result && (
        <div className="lease-result" ref={resultRef}>
          <div className="result-header">
            <h2>Review</h2>
            <span className="result-state">
              <MapPin size={13} />
              {state.toUpperCase()}
            </span>
          </div>
          <div className="result-body">
            <Markdown content={result.analysis} />
          </div>
          <div className="result-footer">
            <p>
              {result.free_questions_remaining !== undefined && result.free_questions_remaining < 900
                ? `Free questions remaining: ${result.free_questions_remaining}`
                : 'Unlimited questions on your plan'}
            </p>
            <button className="btn btn-ghost" onClick={() => navigate('/assistant')}>
              <MessageSquareText size={16} />
              Ask a follow-up question
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
