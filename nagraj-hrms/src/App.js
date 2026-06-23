import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import CEODashboard from './components/CEODashboard';
import HRDashboard from './components/HRDashboard';
import ProductionDashboard from './components/ProductionHeadDashboard';
import ContractorDashboard from './components/ContractorDashboard';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [activeMenu, setActiveMenu] = useState('dashboard');

  // Normalize role to match component names
  const normalizeRole = (role) => {
    if (!role) return null;
    const r = role.toLowerCase().trim();
    if (r === 'production_head' || r === 'production') return 'production_head';
    if (r === 'super_admin' || r === 'admin') return 'admin';
    if (r === 'ceo') return 'ceo';
    if (r === 'hr') return 'hr';
    if (r === 'contractor') return 'contractor';
    return r;
  };

  useEffect(() => {
    const savedSession = localStorage.getItem('nagraj_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        let role = session.userRole || session.role;
        role = normalizeRole(role);
        if (role) {
          console.log('✅ Restored session with role:', role);
          setIsAuthenticated(true);
          setUserRole(role);
          setUserData({
            userId: session.userId || session.loginId,
            userName: session.userName || session.name,
            userRole: role
          });
        } else {
          console.warn('No valid role in saved session, clearing...');
          localStorage.removeItem('nagraj_session');
        }
      } catch (e) {
        console.error('Error parsing session:', e);
        localStorage.removeItem('nagraj_session');
      }
    }
  }, []);

  const handleLogin = (user) => {
    console.log('🔐 Login received user:', user);
    let role = user.role;
    role = normalizeRole(role);
    if (!role) {
      console.error('❌ No valid role provided in login response!');
      return;
    }
    const session = {
      userId: user.email || user.loginId,
      userName: user.name,
      userRole: role,
      role: role,
      loginTime: new Date().toISOString()
    };
    localStorage.setItem('nagraj_session', JSON.stringify(session));
    setIsAuthenticated(true);
    setUserRole(role);
    setUserData({
      userId: session.userId,
      userName: session.userName,
      userRole: role
    });
    setActiveMenu('dashboard');
  };

  const renderDashboard = () => {
    const session = {
      userId: userData?.userId,
      userName: userData?.userName,
      userRole: userData?.userRole,
      role: userData?.userRole
    };
    console.log('🎯 Rendering dashboard for normalized role:', userRole);
    switch (userRole) {
      case 'admin':
        return <AdminDashboard session={session} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />;
      case 'ceo':
        return <CEODashboard session={session} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />;
      case 'hr':
        return <HRDashboard session={session} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />;
      case 'production_head':
        return <ProductionDashboard session={session} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />;
      case 'contractor':
        return <ContractorDashboard session={session} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />;
      default:
        console.error('❌ Unknown role after normalization:', userRole);
        return (
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h2>Unknown Role: {userRole}</h2>
            <p>Please contact administrator.</p>
            <button onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}>Logout</button>
          </div>
        );
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      {renderDashboard()}
    </div>
  );
}

export default App;