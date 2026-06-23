import React, { useState, useEffect } from 'react';
import './CommonStyles.css';

const API_BASE_URL = 'https://backend-nagraj.onrender.com/api';

const AdminDashboard = ({ session, activeMenu, setActiveMenu }) => {
  const [workers, setWorkers] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('workers');
  const [workerStatusTab, setWorkerStatusTab] = useState('all'); // filter by status

  // Modals for workers
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedWorkerForReset, setSelectedWorkerForReset] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [newWorker, setNewWorker] = useState({
    fullName: '', email: '', phone: '', department: '', designation: '',
    gender: '', address: '', experience: '', salary: 0, aadhar: '', dateOfBirth: ''
  });

  // Admin management modals
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [showManualAdminModal, setShowManualAdminModal] = useState(false);
  const [manualAdmin, setManualAdmin] = useState({ fullName: '', email: '', phone: '', password: '' });

  const showToast = (msg, isError = false) => {
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:20px;right:20px;background:${isError ? '#dc2626' : '#1e3a8a'};color:white;padding:12px 20px;border-radius:8px;z-index:100000`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // ==================== API CALLS ====================
  const fetchWorkersFromMongoDB = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/workers`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setWorkers(data);
        localStorage.setItem('Nagraj_workers', JSON.stringify(data));
        return data;
      }
    } catch (err) { console.log(err); }
    return null;
  };

  const saveToMongoDB = async (workerData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/workers/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workerData)
      });
      const result = await response.json();
      return result.success;
    } catch (err) { return false; }
  };

  // ✅ FIXED: Use generic PUT endpoint
  const updateWorkerInMongoDB = async (workerId, updatedData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/workers/${workerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      const result = await response.json();
      return result.success;
    } catch (err) { return false; }
  };

  // ✅ FIXED: Use generic DELETE endpoint
  const deleteWorkerFromMongoDB = async (workerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/workers/${workerId}`, { method: 'DELETE' });
      const result = await response.json();
      return result.success;
    } catch (err) { return false; }
  };

  // Admin users API – using existing /api/users
  const fetchAdminUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      const data = await response.json();
      const mapped = data.map(u => ({
        _id: u._id,
        id: u._id,
        fullName: u.name,
        email: u.email,
        phone: u.phone || 'N/A',
        role: u.role,
        source: u.source || 'system',
        addedOn: u.createdAt || new Date().toISOString()
      }));
      setAdminUsers(mapped);
      localStorage.setItem('Nagraj_admin_users', JSON.stringify(mapped));
    } catch (err) {
      console.error('Failed to fetch admin users', err);
    }
  };

  const addAdminUserAPI = async (adminData) => {
    try {
      const payload = {
        name: adminData.fullName,
        email: adminData.email,
        password: adminData.password || 'admin123',
        role: 'admin',
        phone: adminData.phone,
        source: adminData.source || 'manual',
        isActive: true
      };
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        await fetchAdminUsers();
        return true;
      } else {
        showToast(result.error || 'Failed to add admin', true);
        return false;
      }
    } catch (err) {
      showToast('Server error', true);
      return false;
    }
  };

  const removeAdminUserAPI = async (adminId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${adminId}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        await fetchAdminUsers();
        showToast('Admin access removed');
      } else {
        showToast(result.error || 'Failed to remove', true);
      }
    } catch (err) {
      showToast('Server error', true);
    }
  };

  // ==================== Data Loading ====================
  useEffect(() => {
    loadAllData();
    fetchAdminUsers();
  }, []);

  const loadAllData = async () => {
    try {
      const mongoWorkers = await fetchWorkersFromMongoDB();
      if (!mongoWorkers || mongoWorkers.length === 0) {
        const storedWorkers = localStorage.getItem('Nagraj_workers');
        if (storedWorkers) setWorkers(JSON.parse(storedWorkers));
      }
      const storedContractors = localStorage.getItem('Nagraj_contractors');
      if (storedContractors) {
        setContractors(JSON.parse(storedContractors));
      } else {
        const defaultContractors = [
          { id: 'cont_001', name: 'ABC Contractors', email: 'abc@contractor.com', phone: '9876543210', company: 'ABC Constructions', workersCount: 5, status: 'active' },
          { id: 'cont_002', name: 'XYZ Services', email: 'xyz@contractor.com', phone: '9876543211', company: 'XYZ Solutions', workersCount: 3, status: 'active' }
        ];
        setContractors(defaultContractors);
        localStorage.setItem('Nagraj_contractors', JSON.stringify(defaultContractors));
      }
      showToast('Data loaded successfully');
    } catch (error) {
      showToast('Error loading data', true);
    }
  };

  // Add worker
  const addNewWorker = async () => {
    if (!newWorker.fullName || !newWorker.email || !newWorker.phone || !newWorker.department || !newWorker.designation) {
      showToast('Please fill all required fields', true);
      return;
    }
    const punchCode = newWorker.phone.slice(-6);
    const newId = Date.now();
    const appId = `LXC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const worker = {
      id: newId, applicationId: appId, fullName: newWorker.fullName, email: newWorker.email,
      phone: newWorker.phone, mobile: newWorker.phone, department: newWorker.department,
      designation: newWorker.designation, gender: newWorker.gender || 'Not specified',
      address: newWorker.address || '', experience: newWorker.experience || 'Fresher',
      salary: newWorker.salary || 0, dailyRate: Math.floor((newWorker.salary || 0) / 26),
      punchCode: punchCode, password: newWorker.phone, aadhar: newWorker.aadhar || '',
      dateOfBirth: newWorker.dateOfBirth || '', status: 'pending_production', userType: 'worker',
      appliedDate: new Date().toISOString().slice(0,10), registeredBy: 'admin', company: 'NAGRAJ INDUSTRIES'
    };
    const saved = await saveToMongoDB(worker);
    if (saved) {
      const updatedWorkers = [...workers, worker];
      setWorkers(updatedWorkers);
      localStorage.setItem('Nagraj_workers', JSON.stringify(updatedWorkers));
      showToast(`✅ Worker ${newWorker.fullName} added! Punch Code: ${punchCode}`);
    } else {
      const updatedWorkers = [...workers, worker];
      setWorkers(updatedWorkers);
      localStorage.setItem('Nagraj_workers', JSON.stringify(updatedWorkers));
      showToast(`✅ Worker ${newWorker.fullName} added! (Local backup)`);
    }
    setShowAddWorkerModal(false);
    setNewWorker({ fullName: '', email: '', phone: '', department: '', designation: '', gender: '', address: '', experience: '', salary: 0, aadhar: '', dateOfBirth: '' });
  };

  const updateWorker = async (id, updatedData) => {
    const workerToUpdate = workers.find(w => (w.id === id || w._id === id));
    if (!workerToUpdate) { showToast("Worker not found", true); return; }
    const mergedData = { ...workerToUpdate, ...updatedData };
    const updated = await updateWorkerInMongoDB(id, mergedData);
    if (updated) {
      setWorkers(workers.map(w => (w.id === id || w._id === id) ? mergedData : w));
      showToast('✅ Worker details updated successfully');
    } else {
      setWorkers(workers.map(w => (w.id === id || w._id === id) ? mergedData : w));
      showToast('✅ Worker details updated (Local backup)');
    }
    setShowEditModal(false);
    setEditingWorker(null);
  };

  const deleteWorker = async (id) => {
    if (window.confirm('⚠️ Delete this worker?')) {
      const deleted = await deleteWorkerFromMongoDB(id);
      if (deleted) {
        setWorkers(workers.filter(w => (w.id !== id && w._id !== id)));
        showToast('✅ Worker deleted');
      } else {
        setWorkers(workers.filter(w => (w.id !== id && w._id !== id)));
        showToast('✅ Worker deleted (Local)');
      }
    }
  };

  const resetPassword = async (id, newPwd) => {
    if (!newPwd) { showToast('Enter new password', true); return; }
    const workerToReset = workers.find(w => (w.id === id || w._id === id));
    const updatedWorker = { ...workerToReset, password: newPwd };
    const updated = await updateWorkerInMongoDB(id, updatedWorker);
    if (updated) {
      setWorkers(workers.map(w => (w.id === id || w._id === id) ? updatedWorker : w));
      showToast(`✅ Password reset! New: ${newPwd}`);
    } else {
      setWorkers(workers.map(w => (w.id === id || w._id === id) ? updatedWorker : w));
      showToast(`✅ Password reset! New: ${newPwd} (Local)`);
    }
    setShowResetPasswordModal(false);
    setSelectedWorkerForReset(null);
    setNewPassword('');
  };

  const deleteContractor = (id) => {
    if (window.confirm('⚠️ Delete contractor?')) {
      const updated = contractors.filter(c => c.id !== id);
      setContractors(updated);
      localStorage.setItem('Nagraj_contractors', JSON.stringify(updated));
      showToast('Contractor deleted');
    }
  };

  const getEligibleContractorsForAdmin = () => {
    const adminEmails = adminUsers.map(ad => ad.email);
    return contractors
      .filter(c => !adminEmails.includes(c.email))
      .map(c => ({
        id: c.id,
        fullName: c.name,
        email: c.email,
        phone: c.phone,
        source: 'contractor'
      }));
  };

  const promoteToAdmin = async (user) => {
    const success = await addAdminUserAPI({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: 'admin',
      source: user.source
    });
    if (success) {
      showToast(`${user.fullName} is now an admin!`);
      setShowAddAdminModal(false);
    }
  };

  const addManualAdmin = async () => {
    if (!manualAdmin.fullName || !manualAdmin.email || !manualAdmin.phone) {
      showToast('Please fill all fields', true);
      return;
    }
    const success = await addAdminUserAPI({
      fullName: manualAdmin.fullName,
      email: manualAdmin.email,
      phone: manualAdmin.phone,
      role: 'admin',
      source: 'manual',
      password: manualAdmin.password || 'admin123'
    });
    if (success) {
      showToast(`Admin ${manualAdmin.fullName} created`);
      setShowManualAdminModal(false);
      setManualAdmin({ fullName: '', email: '', phone: '', password: '' });
    }
  };

  // Statistics for counts
  const pendingProductionCount = workers.filter(w => w.status === "pending_production").length;
  const pendingCEOCount = workers.filter(w => w.status === "pending_ceo").length;
  const pendingHRCount = workers.filter(w => w.status === "pending_hr").length;
  const finalizedCount = workers.filter(w => w.status === "finalized").length;

  // Filtered workers based on search term AND status tab
  const filteredWorkers = workers.filter(w => {
    const matchesSearch = w.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.applicationId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.phone?.includes(searchTerm);
    if (!matchesSearch) return false;
    if (workerStatusTab === 'all') return true;
    return w.status === workerStatusTab;
  });

  const filteredContractors = contractors.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredAdmins = adminUsers.filter(ad =>
    ad.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ad.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalWorkers: workers.length,
    pendingProduction: pendingProductionCount,
    pendingCEO: pendingCEOCount,
    pendingHR: pendingHRCount,
    finalized: finalizedCount,
    rejected: workers.filter(w => w.status === "rejected_by_production" || w.status === "rejected_by_ceo").length,
    totalContractors: contractors.length,
    totalAdmins: adminUsers.length
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'tachometer-alt' },
    { id: 'workers', label: 'Workers Management', icon: 'users' },
    { id: 'contractors', label: 'Contractors', icon: 'handshake' },
    { id: 'admins', label: 'User Management', icon: 'user-shield' },
    { id: 'logout', label: 'Logout', icon: 'sign-out-alt' }
  ];

  // ✅ FIXED LOGOUT
  const handleMenuClick = (id) => {
    if (id === 'logout') {
      localStorage.removeItem('nagraj_session');
      window.location.href = '/login';
      return;
    }
    setActiveMenu(id);
    if (id !== 'dashboard') setActiveTab(id);
  };

  const StatCard = ({ title, value, icon, color, onClick }) => (
    <div className="stat-card" style={{ borderLeftColor: color, cursor: 'pointer' }} onClick={onClick}>
      <div className="stat-icon" style={{ background: `${color}15` }}><i className={`fas fa-${icon}`} style={{ color }}></i></div>
      <div className="stat-info"><h3>{value}</h3><p>{title}</p></div>
    </div>
  );

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'finalized': return 'status-finalized';
      case 'pending_ceo': return 'status-pending_ceo';
      case 'pending_hr': return 'status-pending_hr';
      case 'pending_production': return 'status-pending-production';
      default: return 'status-pending-hr';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'pending_production': return 'Pending Production';
      case 'pending_ceo': return 'Pending CEO';
      case 'pending_hr': return 'Pending HR';
      case 'finalized': return 'Finalized';
      default: return status;
    }
  };

  const renderContent = () => {
    // Workers Management
    if (activeMenu === 'workers' || activeTab === 'workers') {
      return (
        <div className="content-card">
          <div className="card-header">
            <h3><i className="fas fa-users"></i> Workers Management ({workers.length} Total)</h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div className="search-box">
                <i className="fas fa-search"></i>
                <input type="text" placeholder="Search by name, ID, email or phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <button className="btn-primary" onClick={() => setShowAddWorkerModal(true)}><i className="fas fa-plus"></i> Add Worker</button>
              <button onClick={loadAllData} style={{ padding: '8px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}><i className="fas fa-sync-alt"></i> Refresh</button>
            </div>
          </div>

          {/* Status filter tabs */}
          <div className="employee-filters" style={{ marginTop: '16px', marginBottom: '16px' }}>
            <div className="filter-tabs">
              <button className={`filter-tab ${workerStatusTab === 'all' ? 'active' : ''}`} onClick={() => setWorkerStatusTab('all')}>All ({stats.totalWorkers})</button>
              <button className={`filter-tab ${workerStatusTab === 'pending_production' ? 'active' : ''}`} onClick={() => setWorkerStatusTab('pending_production')}>Pending Production ({stats.pendingProduction})</button>
              <button className={`filter-tab ${workerStatusTab === 'pending_ceo' ? 'active' : ''}`} onClick={() => setWorkerStatusTab('pending_ceo')}>Pending CEO ({stats.pendingCEO})</button>
              <button className={`filter-tab ${workerStatusTab === 'pending_hr' ? 'active' : ''}`} onClick={() => setWorkerStatusTab('pending_hr')}>Pending HR ({stats.pendingHR})</button>
              <button className={`filter-tab ${workerStatusTab === 'finalized' ? 'active' : ''}`} onClick={() => setWorkerStatusTab('finalized')}>Finalized ({stats.finalized})</button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>App ID</th><th>Name</th><th>Contact</th>
                  <th>Department</th><th>Designation</th><th>Punch Code</th>
                  <th>Salary</th><th>Status</th><th style={{ textAlign: 'center', minWidth: '200px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.map(w => (
                  <tr key={w._id || w.id}>
                    <td><strong>{w.applicationId}</strong></td>
                    <td>{w.fullName}<br/><small style={{ color: '#666' }}>{w.userType === 'staff' ? '👔 Staff' : '👷 Worker'}</small></td>
                    <td>{w.email || w.mobile}<br/><small>{w.phone || w.mobile}</small></td>
                    <td>{w.department}</td>
                    <td>{w.designation}</td>
                    <td><code className="punch-code">{w.punchCode}</code></td>
                    <td>₹{w.salary?.toLocaleString() || 0}</td>
                    <td><span className={`status-badge ${getStatusBadgeClass(w.status)}`}>{getStatusText(w.status)}</span></td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="action-buttons">
                        <button className="action-btn edit" onClick={() => { setEditingWorker(w); setShowEditModal(true); }}><i className="fas fa-edit"></i><span className="btn-label">Edit</span></button>
                        <button className="action-btn delete" onClick={() => deleteWorker(w._id || w.id)}><i className="fas fa-trash-alt"></i><span className="btn-label">Delete</span></button>
                        <button className="action-btn key" onClick={() => { setSelectedWorkerForReset(w); setShowResetPasswordModal(true); }}><i className="fas fa-key"></i><span className="btn-label">Reset Pwd</span></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredWorkers.length === 0 && (
                  <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>No workers found for this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // Contractors Management (unchanged)
    if (activeMenu === 'contractors') {
      return (
        <div className="content-card">
          <div className="card-header">
            <h3><i className="fas fa-handshake"></i> Contractors Management ({contractors.length} Total)</h3>
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input type="text" placeholder="Search contractors..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Company</th><th>Contact Person</th>
                  <th>Email</th><th>Phone</th><th>Workers</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContractors.map(c => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td><strong>{c.company}</strong></td>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.phone}</td>
                    <td>{c.workersCount || 0} workers</td>
                    <td><span className="status-badge status-finalized">{c.status || 'Active'}</span></td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn edit" title="Edit Contractor Details"><i className="fas fa-edit"></i><span className="btn-label">Edit</span></button>
                        <button className="action-btn delete" onClick={() => deleteContractor(c.id)} title="Delete Contractor"><i className="fas fa-trash-alt"></i><span className="btn-label">Delete</span></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // User Management (Admins)
    if (activeMenu === 'admins') {
      return (
        <div className="content-card">
          <div className="card-header">
            <h3><i className="fas fa-user-shield"></i> Admin Users Management ({adminUsers.length} Admins)</h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div className="search-box">
                <i className="fas fa-search"></i>
                <input type="text" placeholder="Search admin by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <button className="btn-primary" onClick={() => setShowAddAdminModal(true)}><i className="fas fa-plus"></i> Add Admin</button>
            </div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Added On</th><th>Source</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map(ad => (
                  <tr key={ad._id || ad.id}>
                    <td><strong>{ad.fullName}</strong></td>
                    <td>{ad.email}</td>
                    <td>{ad.phone}</td>
                    <td><span className="status-badge" style={{ background: ad.role === 'super_admin' ? '#8b5cf6' : '#3b82f6' }}>{ad.role === 'super_admin' ? 'Super Admin' : 'Admin'}</span></td>
                    <td>{new Date(ad.addedOn).toLocaleDateString()}</td>
                    <td>{ad.source || 'system'}</td>
                    <td>
                      {ad.role !== 'super_admin' && (
                        <button className="action-btn delete" onClick={() => removeAdminUserAPI(ad._id || ad.id)}>
                          <i className="fas fa-trash-alt"></i> Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // Dashboard (default)
    return (
      <>
        <div className="welcome-banner">
          <div className="welcome-content">
            <h2><i className="fas fa-shield-alt"></i> Admin Dashboard</h2>
          </div>
          <div className="date-display">
            <i className="fas fa-calendar-alt"></i>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard title="Total Workers" value={stats.totalWorkers} icon="users" color="#1e4a6e" onClick={() => setActiveMenu('workers')} />
          <StatCard title="Pending Production" value={stats.pendingProduction} icon="clock" color="#f59e0b" onClick={() => { setActiveMenu('workers'); setWorkerStatusTab('pending_production'); }} />
          <StatCard title="Pending CEO" value={stats.pendingCEO} icon="hourglass-half" color="#ef4444" onClick={() => { setActiveMenu('workers'); setWorkerStatusTab('pending_ceo'); }} />
          <StatCard title="Pending HR" value={stats.pendingHR} icon="user-check" color="#8b5cf6" onClick={() => { setActiveMenu('workers'); setWorkerStatusTab('pending_hr'); }} />
          <StatCard title="Active Employees" value={stats.finalized} icon="check-circle" color="#10b981" onClick={() => { setActiveMenu('workers'); setWorkerStatusTab('finalized'); }} />
          <StatCard title="Contractors" value={stats.totalContractors} icon="handshake" color="#3b82f6" onClick={() => setActiveMenu('contractors')} />
          <StatCard title="Admins" value={stats.totalAdmins} icon="user-shield" color="#f97316" onClick={() => setActiveMenu('admins')} />
          <StatCard title="Rejected" value={stats.rejected} icon="times-circle" color="#6b7280" onClick={() => setActiveMenu('workers')} />
        </div>

        <div className="content-card">
          <div className="card-header">
            <h3><i className="fas fa-clock"></i> Recent Registrations</h3>
            <button className="btn-primary-sm" onClick={() => setActiveMenu('workers')}>View All</button>
          </div>
          <div className="activity-list">
            {workers.slice(0, 5).map(w => (
              <div key={w._id || w.id} className="activity-item">
                <div className="activity-details">
                  <p><strong>{w.fullName}</strong> {w.userType === 'staff' && <span style={{ fontSize: '11px', background: '#8b5cf6', color: 'white', padding: '2px 6px', borderRadius: '10px' }}>Staff</span>} - {w.designation}</p>
                  <small>Applied: {w.appliedDate || w.registeredDate} • Department: {w.department} • Punch Code: {w.punchCode}</small>
                </div>
                <span className={`status-badge ${getStatusBadgeClass(w.status)}`}>{getStatusText(w.status)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <h3><i className="fas fa-bolt"></i> Quick Actions</h3>
          </div>
          <div style={{ padding: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => setShowAddWorkerModal(true)}><i className="fas fa-user-plus"></i> Add New Worker</button>
            <button className="btn-primary" onClick={() => setActiveMenu('contractors')}><i className="fas fa-handshake"></i> Manage Contractors</button>
            <button className="btn-primary" onClick={() => setActiveMenu('admins')}><i className="fas fa-user-shield"></i> Manage Admins</button>
            <button className="btn-primary" onClick={loadAllData} style={{ background: '#3b82f6' }}><i className="fas fa-sync-alt"></i> Refresh Data</button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="dashboard-layout">
      <div className="side-menu">
        <div className="menu-header">
          <i className="fas fa-shield-alt"></i>
          <div>
            <h3>Admin Panel</h3>
            <p>{session.userName}</p>
          </div>
        </div>
        {menuItems.map(item => (
          <div key={item.id} className={`menu-item ${activeMenu === item.id ? 'active' : ''}`} onClick={() => handleMenuClick(item.id)}>
            <i className={`fas fa-${item.icon}`}></i>
            <span>{item.label}</span>
            {item.id === 'workers' && stats.pendingProduction + stats.pendingCEO + stats.pendingHR > 0 && (
              <span className="menu-badge">{stats.pendingProduction + stats.pendingCEO + stats.pendingHR}</span>
            )}
          </div>
        ))}
        <div className="menu-footer">
          <i className="fas fa-database"></i> Full System Control<br/>
          <small>NAGRAJ INDUSTRIES v2.0 | Enterprise Edition</small>
        </div>
      </div>

      <div className="dashboard-content">
        {renderContent()}
      </div>

      {/* Add Worker Modal - unchanged */}
      {showAddWorkerModal && (
        <div className="modal-overlay" onClick={() => setShowAddWorkerModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header" style={{ background: '#1e3a8a', color: 'white' }}>
              <h3><i className="fas fa-user-plus"></i> Add New Worker</h3>
              <button className="modal-close" onClick={() => setShowAddWorkerModal(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <div className="form-group"><label>Full Name *</label><input type="text" value={newWorker.fullName} onChange={(e) => setNewWorker({...newWorker, fullName: e.target.value})} /></div>
              <div className="form-group"><label>Email *</label><input type="email" value={newWorker.email} onChange={(e) => setNewWorker({...newWorker, email: e.target.value})} /></div>
              <div className="form-group"><label>Phone (10 digit) *</label><input type="text" maxLength="10" value={newWorker.phone} onChange={(e) => setNewWorker({...newWorker, phone: e.target.value.replace(/\D/g, '').slice(0,10)})} /></div>
              <div className="form-group"><label>Aadhar Number</label><input type="text" maxLength="12" value={newWorker.aadhar} onChange={(e) => setNewWorker({...newWorker, aadhar: e.target.value})} /></div>
              <div className="form-group"><label>Date of Birth</label><input type="date" value={newWorker.dateOfBirth} onChange={(e) => setNewWorker({...newWorker, dateOfBirth: e.target.value})} /></div>
              <div className="form-group"><label>Department *</label><input type="text" value={newWorker.department} onChange={(e) => setNewWorker({...newWorker, department: e.target.value})} /></div>
              <div className="form-group"><label>Designation *</label><input type="text" value={newWorker.designation} onChange={(e) => setNewWorker({...newWorker, designation: e.target.value})} /></div>
              <div className="form-group"><label>Monthly Salary</label><input type="number" value={newWorker.salary} onChange={(e) => setNewWorker({...newWorker, salary: parseInt(e.target.value)})} /></div>
              <div className="info-note" style={{ background: '#dbeafe', padding: '12px', borderRadius: '8px', marginTop: '15px' }}>
                <i className="fas fa-info-circle"></i> Punch code will be generated from last 6 digits of phone number. Worker will go to Production for review.
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '15px', borderTop: '1px solid #e2e8f0' }}>
              <button className="btn-secondary" onClick={() => setShowAddWorkerModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={addNewWorker}><i className="fas fa-save"></i> Add Worker</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - unchanged */}
      {showEditModal && editingWorker && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header" style={{ background: '#1e3a8a', color: 'white' }}>
              <h3><i className="fas fa-edit"></i> Edit Worker Details</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <div className="form-group"><label>Full Name</label><input type="text" value={editingWorker.fullName} onChange={(e) => setEditingWorker({...editingWorker, fullName: e.target.value})} /></div>
              <div className="form-group"><label>Email</label><input type="email" value={editingWorker.email} onChange={(e) => setEditingWorker({...editingWorker, email: e.target.value})} /></div>
              <div className="form-group"><label>Phone</label><input type="text" value={editingWorker.phone || editingWorker.mobile} onChange={(e) => setEditingWorker({...editingWorker, phone: e.target.value, mobile: e.target.value})} /></div>
              <div className="form-group"><label>Department</label><input type="text" value={editingWorker.department} onChange={(e) => setEditingWorker({...editingWorker, department: e.target.value})} /></div>
              <div className="form-group"><label>Designation</label><input type="text" value={editingWorker.designation} onChange={(e) => setEditingWorker({...editingWorker, designation: e.target.value})} /></div>
              <div className="form-group"><label>Salary</label><input type="number" value={editingWorker.salary || 0} onChange={(e) => setEditingWorker({...editingWorker, salary: parseInt(e.target.value)})} /></div>
              <div className="form-group"><label>Punch Code</label><input type="text" value={editingWorker.punchCode} onChange={(e) => setEditingWorker({...editingWorker, punchCode: e.target.value})} /></div>
              <div className="form-group"><label>Status</label>
                <select value={editingWorker.status} onChange={(e) => setEditingWorker({...editingWorker, status: e.target.value})}>
                  <option value="pending_production">Pending Production</option>
                  <option value="pending_ceo">Pending CEO Approval</option>
                  <option value="pending_hr">Pending HR Finalization</option>
                  <option value="finalized">Finalized - Active</option>
                  <option value="rejected_by_production">Rejected by Production</option>
                  <option value="rejected_by_ceo">Rejected by CEO</option>
                </select>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '15px', borderTop: '1px solid #e2e8f0' }}>
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => updateWorker(editingWorker._id || editingWorker.id, editingWorker)}><i className="fas fa-save"></i> Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal - unchanged */}
      {showResetPasswordModal && selectedWorkerForReset && (
        <div className="modal-overlay" onClick={() => setShowResetPasswordModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header" style={{ background: '#1e3a8a', color: 'white' }}>
              <h3><i className="fas fa-key"></i> Reset Password</h3>
              <button className="modal-close" onClick={() => setShowResetPasswordModal(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <div className="worker-info" style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <p><strong>Worker:</strong> {selectedWorkerForReset.fullName}</p>
                <p><strong>Email:</strong> {selectedWorkerForReset.email}</p>
                <p><strong>Current Password:</strong> <code>{selectedWorkerForReset.password || selectedWorkerForReset.phone}</code></p>
              </div>
              <div className="form-group"><label>New Password</label><input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" /></div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '15px', borderTop: '1px solid #e2e8f0' }}>
              <button className="btn-secondary" onClick={() => setShowResetPasswordModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => resetPassword(selectedWorkerForReset._id || selectedWorkerForReset.id, newPassword)}><i className="fas fa-sync-alt"></i> Reset Password</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Admin Modal - unchanged */}
      {showAddAdminModal && (
        <div className="modal-overlay" onClick={() => setShowAddAdminModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header" style={{ background: '#1e3a8a', color: 'white' }}>
              <h3><i className="fas fa-user-plus"></i> Add New Admin</h3>
              <button className="modal-close" onClick={() => setShowAddAdminModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '20px' }}>
                <button className="btn-primary" onClick={() => { setShowAddAdminModal(false); setShowManualAdminModal(true); }} style={{ background: '#10b981' }}>
                  <i className="fas fa-user-plus"></i> Create Brand New Admin
                </button>
              </div>
              <hr />
              <p><strong>Or promote an existing contractor (only contractors can become admin):</strong></p>
              <div className="search-box" style={{ marginBottom: '20px' }}>
                <i className="fas fa-search"></i>
                <input type="text" placeholder="Search contractor by name, email, phone..." value={adminSearchTerm} onChange={(e) => setAdminSearchTerm(e.target.value)} />
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {getEligibleContractorsForAdmin().filter(c =>
                  c.fullName.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
                  c.email.toLowerCase().includes(adminSearchTerm.toLowerCase())
                ).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>No eligible contractors found.</div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr><th>Name</th><th>Email</th><th>Phone</th><th>Type</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {getEligibleContractorsForAdmin().filter(c =>
                        c.fullName.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
                        c.email.toLowerCase().includes(adminSearchTerm.toLowerCase())
                      ).map(contractor => (
                        <tr key={contractor.id}>
                          <td>{contractor.fullName}</td>
                          <td>{contractor.email}</td>
                          <td>{contractor.phone}</td>
                          <td><span className="status-badge" style={{ background: '#10b981' }}>Contractor</span></td>
                          <td><button className="btn-primary-sm" onClick={() => promoteToAdmin(contractor)}>Make Admin</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddAdminModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Admin Creation Modal - unchanged */}
      {showManualAdminModal && (
        <div className="modal-overlay" onClick={() => setShowManualAdminModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header" style={{ background: '#1e3a8a', color: 'white' }}>
              <h3><i className="fas fa-user-plus"></i> Create New Admin</h3>
              <button className="modal-close" onClick={() => setShowManualAdminModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label>Full Name</label><input type="text" value={manualAdmin.fullName} onChange={(e) => setManualAdmin({...manualAdmin, fullName: e.target.value})} /></div>
              <div className="form-group"><label>Email</label><input type="email" value={manualAdmin.email} onChange={(e) => setManualAdmin({...manualAdmin, email: e.target.value})} /></div>
              <div className="form-group"><label>Phone</label><input type="text" value={manualAdmin.phone} onChange={(e) => setManualAdmin({...manualAdmin, phone: e.target.value})} /></div>
              <div className="form-group"><label>Password</label><input type="text" value={manualAdmin.password} onChange={(e) => setManualAdmin({...manualAdmin, password: e.target.value})} placeholder="Default: admin123" /></div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowManualAdminModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={addManualAdmin}>Create Admin</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;