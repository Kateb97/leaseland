import { useAuth } from '../utils/AuthContext';
import { authApi } from '../utils/api';
import { useState, useEffect } from 'react';

const STATE_OPTIONS = [
  { key: 'nsw', name: 'New South Wales' },
  { key: 'vic', name: 'Victoria' },
  { key: 'qld', name: 'Queensland' },
  { key: 'wa', name: 'Western Australia' },
  { key: 'sa', name: 'South Australia' },
  { key: 'act', name: 'ACT' },
];

export default function StateSelector({ onStateChange, compact }) {
  const { user, updateState } = useAuth();
  const [states, setStates] = useState(STATE_OPTIONS);
  const [selectedState, setSelectedState] = useState(user?.state || 'nsw');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    authApi.getStates().then(data => {
      if (data.states) {
        setStates(data.states.map(s => ({ key: s.stateKey, name: s.stateName })));
      }
    }).catch(() => {});
  }, []);

  const handleChange = async (stateKey) => {
    setSelectedState(stateKey);
    setIsOpen(false);
    if (user) {
      await updateState(stateKey, 'australia');
    }
    if (onStateChange) onStateChange(stateKey);
  };

  const currentState = states.find(s => s.key === selectedState);
  const stateLabel = compact ? selectedState.toUpperCase() : (currentState?.name || selectedState.toUpperCase());

  return (
    <div className={`state-selector ${compact ? 'compact' : ''}`}>
      <label className="state-label">
        <span className="state-icon">📍</span>
        {!compact && <span>Your State:</span>}
      </label>
      <div className="state-dropdown">
        <button 
          className="state-dropdown-trigger"
          onClick={() => setIsOpen(!isOpen)}
          title="Select your state for accurate tenancy information"
        >
          {stateLabel}
          <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
        </button>
        {isOpen && (
          <div className="state-dropdown-menu">
            {states.map(s => (
              <button
                key={s.key}
                className={`state-option ${s.key === selectedState ? 'active' : ''}`}
                onClick={() => handleChange(s.key)}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}