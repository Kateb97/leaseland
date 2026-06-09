import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('leaseLandToken'));

  useEffect(() => {
    if (token) {
      authApi.me()
        .then(data => {
          setUser(data.user);
        })
        .catch(() => {
          localStorage.removeItem('leaseLandToken');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password });
    localStorage.setItem('leaseLandToken', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(async (data) => {
    const result = await authApi.signup(data);
    localStorage.setItem('leaseLandToken', result.token);
    setToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('leaseLandToken');
    setToken(null);
    setUser(null);
  }, []);

  const updateState = useCallback(async (state, country) => {
    const data = await authApi.updateState({ state, country: country || 'australia' });
    setUser(data.user);
    return data.user;
  }, []);

  // Check if user has active subscription or free questions
  const isSubscribed = user?.subscription_status === 'active';
  const freeRemaining = user?.free_questions_remaining;
  const hasFreeQuestions = freeRemaining !== undefined ? freeRemaining > 0 : true;
  const canUseFeature = isSubscribed || hasFreeQuestions;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      signup,
      logout,
      updateState,
      isSubscribed,
      hasFreeQuestions,
      canUseFeature,
      setUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}