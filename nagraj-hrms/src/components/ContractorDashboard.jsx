import React, { useState, useEffect } from 'react';
import './CommonStyles.css';
import WorkerRegistration from './WorkerRegistration';
const API_BASE_URL = 'https://backend-nagraj.onrender.com/api';

const ContractorDashboard = ({ session, activeMenu, setActiveMenu }) => {
  const [workers, setWorkers] = useState([]);
  const [myWorkers, setMyWorkers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    finalized: 0,
    pending: 0,
    pendingProduction: 0,
    pendingHR: 0,
    pendingCEO: 0
  });

  const showToast = (msg, isError = false) => {
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:20px;right:20px;background:${isError ? '#dc2626' : '#1e3a8a'};color:white;padding:12px 20px;border-radius:8px;z-index:10000;box-shadow:0 4px 12px rgba(0,0,0,0.15);`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const getStatusGroup = (worker) => {
    const status = worker.status;
    if (status === 'finalized') return 'finalized';
    if (status === 'pending_production' || status === 'pending_hr' || status === 'pending_ceo' || status === 'pending')
      return 'pending';
    return 'other';
  };

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/workers`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        const allWorkers = data.map(w => ({ ...w, id: w._id }));
        setWorkers(allWorkers);
        const contractorName = session.userName;
        const myWorkersFiltered = allWorkers.filter(w =>
          w.contractor === contractorName ||
          w.contractorName === contractorName ||
          w.registeredBy === contractorName ||
          (w.contractor && w.contractor.toLowerCase() === contractorName.toLowerCase()) ||
          (w.contractorName && w.contractorName.toLowerCase() === contractorName.toLowerCase())
        );
        setMyWorkers(myWorkersFiltered);
        calculateStats(myWorkersFiltered);
      } else {
        setMyWorkers([]);
      }
    } catch (err) {
      console.error('Error fetching workers:', err);
      showToast('Failed to load workers. Check backend.', true);
      setMyWorkers([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (workersList = myWorkers) => {
    const total = workersList.length;
    const finalized = workersList.filter(w => getStatusGroup(w) === 'finalized').length;
    const pending = workersList.filter(w => getStatusGroup(w) === 'pending').length;
    const pendingProduction = workersList.filter(w => w.status === 'pending_production').length;
    const pendingHR = workersList.filter(w => w.status === 'pending_hr').length;
    const pendingCEO = workersList.filter(w => w.status === 'pending_ceo').length;
    setStats({ total, finalized, pending, pendingProduction, pendingHR, pendingCEO });
  };

  useEffect(() => {
    fetchWorkers();
    const interval = setInterval(fetchWorkers, 10000);
    return () => clearInterval(interval);
  }, []);

  const getFilteredWorkers = () => {
    let filtered = [...myWorkers];
    if (selectedStage !== 'all') {
      filtered = filtered.filter(w => getStatusGroup(w) === selectedStage);
    }
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(w => w.department === selectedDepartment);
    }
    if (searchTerm) {
      filtered = filtered.filter(w =>
        w.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.applicationId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (w.punchCode && w.punchCode.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    filtered.sort((a, b) => {
      const aGroup = getStatusGroup(a);
      const bGroup = getStatusGroup(b);
      if (aGroup === 'pending' && bGroup !== 'pending') return -1;
      if (aGroup !== 'pending' && bGroup === 'pending') return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return filtered;
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'tachometer-alt' },
    { id: 'worker_registration', label: 'Worker Registration', icon: 'user-plus' },
    { id: 'my_list', label: 'My Workers', icon: 'list', badge: myWorkers.length },
    { id: 'logout', label: 'Logout', icon: 'sign-out-alt' }
  ];

  const handleMenuClick = (id) => {
    if (id === 'logout') {
      localStorage.clear();
      window.location.href = '/login';
      return;
    }
    if (id === 'worker_registration') {
      setShowRegistrationModal(true);
      return;
    }
    setActiveMenu(id);
  };

  const StatCard = ({ title, value, icon, color, onClick }) => (
    <div className="stat-card-enhanced" style={{ borderLeftColor: color }} onClick={onClick}>
      <div className="stat-icon" style={{ background: `${color}15` }}>
        <i className={`fas fa-${icon}`} style={{ color }}></i>
      </div>
      <div className="stat-info">
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
    </div>
  );

  const EmployeeFilters = () => {
    const departments = ['all', ...new Set(myWorkers.map(w => w.department).filter(Boolean))];
    return (
      <div className="employee-filters">
        <div className="filter-tabs">
          <button className={`filter-tab ${selectedStage === 'all' ? 'active' : ''}`} onClick={() => setSelectedStage('all')}>All ({stats.total})</button>
          <button className={`filter-tab ${selectedStage === 'finalized' ? 'active' : ''}`} onClick={() => setSelectedStage('finalized')}>Finalized ({stats.finalized})</button>
          <button className={`filter-tab ${selectedStage === 'pending' ? 'active' : ''}`} onClick={() => setSelectedStage('pending')}>Pending ({stats.pending})</button>
        </div>
        <select className="filter-select" value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
          <option value="all">All Departments</option>
          {departments.filter(d => d !== 'all').map(dept => <option key={dept} value={dept}>{dept}</option>)}
        </select>
        <div className="search-box">
          <input type="text" placeholder="Search by name or punch code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>
    );
  };

  const EmployeeTable = () => {
    const filteredWorkers = getFilteredWorkers();
    const getStageBadgeClass = (worker) => {
      const status = worker.status;
      if (status === 'finalized') return 'stage-finalized';
      if (status === 'pending_production') return 'stage-production';
      if (status === 'pending_hr') return 'stage-hr';
      if (status === 'pending_ceo') return 'stage-ceo';
      return 'stage-pending';
    };
    const getDisplayStage = (worker) => {
      const status = worker.status;
      if (status === 'finalized') return 'Finalized';
      if (status === 'pending_production') return 'Production';
      if (status === 'pending_hr') return 'HR';
      if (status === 'pending_ceo') return 'CEO';
      return 'Pending';
    };

    if (loading) {
      return (
        <div className="employee-table-container">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: '#1e3a8a' }}></i>
            <p>Loading workers...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="employee-table-container">
        <div className="table-header">
          <h4><i className="fas fa-users"></i> My Workers ({filteredWorkers.length})</h4>
          {myWorkers.length === 0 && !loading && (
            <button className="btn-primary-sm" onClick={() => setShowRegistrationModal(true)}>
              <i className="fas fa-plus"></i> Register First Worker
            </button>
          )}
        </div>
        <div className="table-responsive">
          <table className="employee-table">
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>DEPARTMENT</th>
                <th>DESIGNATION</th>
                <th>PUNCH CODE</th>
                <th>TYPE</th>
                <th>STAGE</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkers.map(worker => (
                <tr key={worker._id}>
                  <td>
                    <div className="employee-info">
                      <div className="employee-avatar">{worker.fullName?.charAt(0) || 'W'}</div>
                      <div className="employee-details">
                        <strong>{worker.fullName}</strong>
                        <small>ID: {worker.applicationId || worker.punchCode || worker.id?.slice(-6) || 'N/A'}</small>
                      </div>
                    </div>
                  </td>
                  <td>{worker.department || 'N/A'}</td>
                  <td>{worker.designation || 'Worker'}</td>
                  <td><code style={{ fontSize: '12px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{worker.punchCode || 'N/A'}</code></td>
                  <td>{worker.userType === 'staff' ? '👔 Staff' : '👷 Worker'}</td>
                  <td><span className={`stage-badge ${getStageBadgeClass(worker)}`}>{getDisplayStage(worker)}</span></td>
                </tr>
              ))}
              {filteredWorkers.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="no-data">
                    <i className="fas fa-inbox" style={{ fontSize: 32, color: '#cbd5e1', marginBottom: 12, display: 'block' }}></i>
                    <p>No workers found in this category.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (activeMenu === 'my_list') {
      return (
        <div className="content-card">
          <div className="card-header">
            <h3><i className="fas fa-list"></i> My Workers ({myWorkers.length})</h3>
            <button className="btn-primary-sm" onClick={fetchWorkers}><i className="fas fa-sync-alt"></i> Refresh</button>
          </div>
          <EmployeeFilters />
          <EmployeeTable />
        </div>
      );
    }

    return (
      <>
        <div className="welcome-banner">
          <div className="welcome-content">
            <h2><i className="fas fa-handshake"></i> NAGRAJ INDUSTRIES</h2>
            <p>Contractor Dashboard</p>
            <small>Welcome back, {session.userName}</small>
          </div>
          <div className="date-display">
            <i className="fas fa-calendar-alt"></i>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        <div className="stats-grid-enhanced">
          <StatCard title="TOTAL REGISTERED" value={stats.total} icon="users" color="#1ff796" onClick={() => setActiveMenu('my_list')} />
          <StatCard title="FINALIZED" value={stats.finalized} icon="check-circle" color="#0fdc98" onClick={() => { setSelectedStage('finalized'); setActiveMenu('my_list'); }} />
          <StatCard title="PENDING" value={stats.pending} icon="clock" color="#f6ac2d" onClick={() => { setSelectedStage('pending'); setActiveMenu('my_list'); }} />
        </div>
        <EmployeeFilters />
        <EmployeeTable />
      </>
    );
  };

  return (
    <div className="dashboard-layout">
      <div className="side-menu">
        <div className="menu-header">
          <i className="fas fa-handshake"></i>
          <div>
            <h3>NAGRAJ INDUSTRIES</h3>
            <p>{session.userName}</p>
          </div>
        </div>
        {menuItems.map(item => (
          <div key={item.id} className={`menu-item ${activeMenu === item.id ? 'active' : ''}`} onClick={() => handleMenuClick(item.id)}>
            <i className={`fas fa-${item.icon}`}></i>
            <span>{item.label}</span>
            {item.badge > 0 && <span className="menu-badge">{item.badge}</span>}
          </div>
        ))}
        <div className="menu-footer">
          <i className="fas fa-building"></i> NAGRAJ INDUSTRIES<br/>
          <small>Contractor Portal v1.0</small>
        </div>
      </div>
      <div className="dashboard-content">{renderContent()}</div>

      {showRegistrationModal && (
        <WorkerRegistration
          onClose={() => setShowRegistrationModal(false)}
          onSuccess={() => { setShowRegistrationModal(false); fetchWorkers(); }}
          session={session}
        />
      )}
    </div>
  );
};

export default ContractorDashboard;