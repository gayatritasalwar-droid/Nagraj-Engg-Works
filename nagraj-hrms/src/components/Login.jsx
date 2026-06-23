import React, { useState } from 'react';
import './Login.css';

const API_BASE_URL = 'https://backend-nagraj.onrender.com/api';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),   // ✅ normalize
          password: password.trim()
        })
      });
      const data = await response.json();

      if (data.success) {
        // ✅ create session object for the entire app
        const session = {
          userId: data.user.email,
          userName: data.user.name,
          userRole: data.user.role,
          role: data.user.role,
          loginTime: new Date().toISOString()
        };
        localStorage.setItem('nagraj_session', JSON.stringify(session));
        onLogin(data.user);
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-icon">
          <div className="logo-text">NE</div>
        </div>
        <h1>NAGRAJ ENGINEERING WORKS</h1>
        <p className="subtitle">Enterprise Workforce Management System</p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label><i className="fas fa-envelope"></i> Email / Login ID</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="input-group">
            <label><i className="fas fa-lock"></i> Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sign-in-alt"></i>}
            {loading ? ' Logging in...' : ' Login'}
          </button>
        </form>
        {error && <div className="error-msg">{error}</div>}
        
      </div>
    </div>
  );
};

export default Login;