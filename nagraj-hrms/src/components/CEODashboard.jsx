import React, { useState, useEffect } from 'react';
import './CommonStyles.css';

const API_BASE_URL = 'https://backend-nagraj.onrender.com/api';

const CEODashboard = ({ session, activeMenu, setActiveMenu }) => {
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [bondYears, setBondYears] = useState(2);
  const [esiPfPercentage, setEsiPfPercentage] = useState(3.25);
  const [applyESI, setApplyESI] = useState(false);
  const [subDept, setSubDept] = useState('Others');
  const [category, setCategory] = useState('Non-Muster');
  const [rate, setRate] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const showToast = (msg, isError = false) => {
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:20px;right:20px;background:${isError ? '#dc2626' : '#1e3a8a'};color:white;padding:12px 20px;border-radius:8px;z-index:9999`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  useEffect(() => {
    const savedBondYears = localStorage.getItem('laxmi_bondYears');
    const savedEsiPf = localStorage.getItem('laxmi_esiPfPercentage');
    if (savedBondYears) setBondYears(parseInt(savedBondYears));
    if (savedEsiPf) setEsiPfPercentage(parseFloat(savedEsiPf));
  }, []);

  const savePolicy = () => {
    localStorage.setItem('laxmi_bondYears', bondYears);
    localStorage.setItem('laxmi_esiPfPercentage', esiPfPercentage);
    showToast('✅ Policy updated!');
  };

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/workers`);
      const data = await response.json();
      if (Array.isArray(data)) {
        const allWorkers = data.map(w => ({ ...w, id: w._id, _id: w._id }));
        setWorkers(allWorkers);
      } else {
        setWorkers([]);
      }
    } catch (err) {
      console.error(err);
      showToast('⚠️ Error loading workers', true);
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
    const interval = setInterval(fetchWorkers, 5000);
    return () => clearInterval(interval);
  }, []);

  const pendingProduction = workers.filter(w => w.status === 'pending_production');
  const pendingCEO = workers.filter(w => w.status === 'pending_ceo');
  const pendingHR = workers.filter(w => w.status === 'pending_hr');
  const finalizedWorkers = workers.filter(w => w.status === 'finalized');

  const getFilteredWorkers = () => {
    switch (activeTab) {
      case 'pending_production':
        return pendingProduction;
      case 'pending_ceo':
        return pendingCEO;
      case 'pending_hr':
        return pendingHR;
      case 'finalized':
        return finalizedWorkers;
      default:
        return workers;
    }
  };

  const handleApprove = async () => {
    if (!selectedWorker) return;
    if (!rate) {
      showToast('❌ Please enter daily rate', true);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/workers/ceo-approve/${selectedWorker._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyRate: parseInt(rate),
          joiningDate: new Date().toISOString().split('T')[0],
          bondYears: bondYears,
          esiPfPercentage: esiPfPercentage,
          applyESI: applyESI,
          subDept: subDept,
          category: category,
          ceoName: session.userName
        })
      });
      const result = await response.json();
      if (result.success) {
        showToast(`✅ ${selectedWorker.fullName} approved and sent to HR`);
        setShowApprovalModal(false);
        setSelectedWorker(null);
        setRate('');
        fetchWorkers();
      } else {
        showToast(`❌ Approval failed: ${result.error}`, true);
      }
    } catch (err) {
      showToast('❌ Error approving worker', true);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWorker) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/workers/ceo-reject/${selectedWorker._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ceoName: session.userName })
      });
      const result = await response.json();
      if (result.success) {
        showToast(`❌ ${selectedWorker.fullName} rejected`);
        setShowApprovalModal(false);
        setSelectedWorker(null);
        fetchWorkers();
      } else {
        showToast(`❌ Rejection failed`, true);
      }
    } catch (err) {
      showToast('❌ Error rejecting worker', true);
    } finally {
      setLoading(false);
    }
  };

  const handleHold = async () => {
    if (!selectedWorker) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/workers/ceo-hold/${selectedWorker._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ceoName: session.userName })
      });
      const result = await response.json();
      if (result.success) {
        showToast(`⏸️ ${selectedWorker.fullName} put on hold`);
        setShowApprovalModal(false);
        setSelectedWorker(null);
        fetchWorkers();
      } else {
        showToast(`❌ Hold failed`, true);
      }
    } catch (err) {
      showToast('❌ Error putting worker on hold', true);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'tachometer-alt' },
    { id: 'pending_actions', label: 'Pending CEO Actions', icon: 'clock', badge: pendingCEO.length },
    { id: 'logout', label: 'Logout', icon: 'sign-out-alt' }
  ];

  // ✅ FIXED LOGOUT: Use nagraj_session and redirect to /login
  const handleMenuClick = (id) => {
    if (id === 'logout') {
      localStorage.removeItem('nagraj_session');
      window.location.href = '/login';
      return;
    }
    setActiveMenu(id);
  };

  const getStageBadge = (status) => {
    switch(status) {
      case 'pending_production':
        return <span className="stage-badge production">Pending Production</span>;
      case 'pending_ceo':
        return <span className="stage-badge ceo">Pending CEO</span>;
      case 'pending_hr':
        return <span className="stage-badge hr">Pending HR</span>;
      case 'finalized':
        return <span className="stage-badge finalized">Finalized</span>;
      case 'rejected_by_production':
        return <span className="stage-badge rejected">Rejected by Production</span>;
      case 'rejected_by_ceo':
        return <span className="stage-badge rejected">Rejected by CEO</span>;
      case 'sent_back_to_contractor':
        return <span className="stage-badge warning">Sent Back</span>;
      default:
        return <span className="stage-badge">{status || 'Pending'}</span>;
    }
  };

  const StatCard = ({ title, value, icon, color, onClick }) => (
    <div className="stat-card" style={{ borderLeftColor: color }} onClick={onClick}>
      <div className="stat-icon" style={{ background: `${color}20` }}>
        <i className={`fas fa-${icon}`} style={{ color }}></i>
      </div>
      <div className="stat-info">
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
    </div>
  );

  const renderContent = () => {
    if (activeMenu === 'pending_actions') {
      const filtered = pendingCEO.filter(w =>
        w.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (loading) return <div className="content-card"><div style={{textAlign:'center',padding:40}}>Loading...</div></div>;
      return (
        <div className="content-card">
          <div className="card-header">
            <h3>Pending CEO Approvals ({pendingCEO.length})</h3>
            <div className="search-box">
              <input type="text" placeholder="Search by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={fetchWorkers} className="btn-primary-sm"><i className="fas fa-sync-alt"></i> Refresh</button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr><th>NAME</th><th>APPLICATION ID</th><th>DEPARTMENT</th><th>DESIGNATION</th><th>TYPE</th><th>PROPOSED RATE</th><th>ACTION</th></tr>
              </thead>
              <tbody>
                {filtered.map(w => (
                  <tr key={w._id}>
                    <td><strong>{w.fullName}</strong></td>
                    <td>{w.applicationId || `LXC-${w.id}`}</td>
                    <td>{w.department || 'Not Assigned'}</td>
                    <td>{w.designation || 'Worker'}</td>
                    <td>{w.userType === 'staff' ? '👔 Staff' : '👷 Worker'}</td>
                    <td>₹{w.dailyRate || 'Not set'}/day</td>
                    <td>
                      <button
                        className="btn-review"
                        onClick={() => {
                          setSelectedWorker(w);
                          setShowApprovalModal(true);
                          if (w.dailyRate) setRate(w.dailyRate.toString());
                        }}
                      >
                        Review & Approve
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan="7" style={{textAlign:'center',padding:40}}><i className="fas fa-check-circle" style={{fontSize:48,color:'#10b981',marginBottom:16}}></i><p>No pending approvals found</p></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="welcome-banner">
          <div className="welcome-content">
            <h2><i className="fas fa-chart-line"></i> CEO Portal</h2>
            <p>{session.userName} (CEO)</p>
            <small>Workflow: Production → CEO → HR → Finalized</small>
          </div>
          <div className="date-display"><i className="fas fa-calendar-alt"></i><span>{new Date().toLocaleDateString()}</span></div>
        </div>

        <div className="content-card" style={{ marginBottom: '20px', background: '#f0fdf4' }}>
          <div className="card-header"><h3><i className="fas fa-file-contract"></i> Company Policy Settings</h3></div>
          <div style={{ padding: '16px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div><label>Bond (Years)</label><input type="number" value={bondYears} onChange={e => setBondYears(parseInt(e.target.value))} style={{ width: '100px', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} /></div>
            <div><label>ESI/PF (%)</label><input type="number" step="0.01" value={esiPfPercentage} onChange={e => setEsiPfPercentage(parseFloat(e.target.value))} style={{ width: '100px', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} /></div>
            <button className="btn-primary" onClick={savePolicy}><i className="fas fa-save"></i> Save Policy</button>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard title="Pending Production" value={pendingProduction.length} icon="industry" color="#3b82f6" onClick={() => setActiveTab('pending_production')} />
          <StatCard title="Pending CEO Approval" value={pendingCEO.length} icon="user-tie" color="#d48a1a" onClick={() => setActiveTab('pending_ceo')} />
          <StatCard title="Pending HR" value={pendingHR.length} icon="users" color="#10b981" onClick={() => setActiveTab('pending_hr')} />
          <StatCard title="Finalized" value={finalizedWorkers.length} icon="check-circle" color="#8b5cf6" onClick={() => setActiveTab('finalized')} />
          <StatCard title="Total Workers" value={workers.length} icon="file-alt" color="#6b7280" onClick={() => setActiveTab('all')} />
        </div>

        <div className="employee-filters" style={{ marginTop: '20px', marginBottom: '20px' }}>
          <div className="filter-tabs">
            <button className={`filter-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All ({workers.length})</button>
            <button className={`filter-tab ${activeTab === 'pending_production' ? 'active' : ''}`} onClick={() => setActiveTab('pending_production')}>Production ({pendingProduction.length})</button>
            <button className={`filter-tab ${activeTab === 'pending_ceo' ? 'active' : ''}`} onClick={() => setActiveTab('pending_ceo')}>CEO ({pendingCEO.length})</button>
            <button className={`filter-tab ${activeTab === 'pending_hr' ? 'active' : ''}`} onClick={() => setActiveTab('pending_hr')}>HR ({pendingHR.length})</button>
            <button className={`filter-tab ${activeTab === 'finalized' ? 'active' : ''}`} onClick={() => setActiveTab('finalized')}>Finalized ({finalizedWorkers.length})</button>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <h3><i className="fas fa-users"></i> Workers - {activeTab.replace('_', ' ').toUpperCase()}</h3>
            <button className="btn-primary-sm" onClick={fetchWorkers}><i className="fas fa-sync-alt"></i> Refresh</button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr><th>NAME</th><th>APPLICATION ID</th><th>DEPARTMENT</th><th>DESIGNATION</th><th>TYPE</th><th>STATUS</th><th>ACTION</th></tr>
              </thead>
              <tbody>
                {getFilteredWorkers().map(w => (
                  <tr key={w._id}>
                    <td><strong>{w.fullName}</strong></td>
                    <td>{w.applicationId || `LXC-${w.id}`}</td>
                    <td>{w.department || 'Not Assigned'}</td>
                    <td>{w.designation || 'Worker'}</td>
                    <td>{w.userType === 'staff' ? '👔 Staff' : '👷 Worker'}</td>
                    <td>{getStageBadge(w.status)}</td>
                    <td>
                      {w.status === 'pending_ceo' && (
                        <button
                          className="btn-review-sm"
                          style={{ backgroundColor: '#f59e0b', border: '2px solid #d97706', color: '#fff' }}
                          onClick={() => {
                            setSelectedWorker(w);
                            setShowApprovalModal(true);
                            if (w.dailyRate) setRate(w.dailyRate.toString());
                          }}
                        >
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {getFilteredWorkers().length === 0 && (
                  <tr><td colSpan="7" style={{textAlign:'center',padding:40}}>No workers found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="dashboard-layout">
      <div className="side-menu">
        <div className="menu-header"><i className="fas fa-chart-line"></i><div><h3>CEO Portal</h3><p>{session.userName}</p></div></div>
        {menuItems.map(item => (
          <div key={item.id} className={`menu-item ${activeMenu === item.id ? 'active' : ''}`} onClick={() => handleMenuClick(item.id)}>
            <i className={`fas fa-${item.icon}`}></i><span>{item.label}</span>
            {item.badge > 0 && <span className="menu-badge">{item.badge}</span>}
          </div>
        ))}
      </div>
      <div className="dashboard-content">{renderContent()}</div>

      {/* CEO Approval Modal */}
      {showApprovalModal && selectedWorker && (
        <div className="modal-overlay" onClick={() => setShowApprovalModal(false)}>
          <div className="modal-content ceo-approval-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-gavel"></i> CEO Approval Panel</h3>
              <button className="modal-close" onClick={() => setShowApprovalModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="info-section">
                <h4>📋 Worker Information</h4>
                <div className="info-grid">
                  <div><label>NAME:</label><p><strong>{selectedWorker.fullName}</strong></p></div>
                  <div><label>APPLICATION ID:</label><p><strong>{selectedWorker.applicationId || `LXC-${selectedWorker.id}`}</strong></p></div>
                  <div><label>DEPARTMENT:</label><p><strong>{selectedWorker.department || 'Not Assigned'}</strong></p></div>
                  <div><label>DESIGNATION:</label><p><strong>{selectedWorker.designation || 'Worker'}</strong></p></div>
                  <div><label>TYPE:</label><p><strong>{selectedWorker.userType === 'staff' ? 'Staff' : 'Worker'}</strong></p></div>
                  <div><label>PRODUCTION RATE:</label><p><strong>₹{selectedWorker.dailyRate || 'Not set'}/day</strong></p></div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>📌 CATEGORY *</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}>
                    <option>Muster</option>
                    <option>Non-Muster</option>
                    <option>Contract</option>
                    <option>Regular</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>🏭 SUB DEPARTMENT *</label>
                  <select value={subDept} onChange={e => setSubDept(e.target.value)}>
                    <option>Others</option>
                    <option>Laser Cut Section</option>
                    <option>Production</option>
                    <option>Quality</option>
                    <option>Maintenance</option>
                    <option>Welding</option>
                    <option>Packing</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>💰 DAILY RATE (₹) *</label>
                <input 
                  type="number" 
                  value={rate} 
                  onChange={e => setRate(e.target.value)} 
                  placeholder="Enter daily rate" 
                  required 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>🔗 BOND YEARS</label>
                  <input type="number" value={bondYears} onChange={e => setBondYears(parseInt(e.target.value))} />
                </div>
                <div className="form-group">
                  <label>📊 ESI/PF (%)</label>
                  <input type="number" step="0.01" value={esiPfPercentage} onChange={e => setEsiPfPercentage(parseFloat(e.target.value))} />
                </div>
              </div>

              <div className="checkbox-group">
                <label>
                  <input type="checkbox" checked={applyESI} onChange={e => setApplyESI(e.target.checked)} />
                  Apply ESI/PF Benefits ({esiPfPercentage}% deduction)
                </label>
              </div>

              <div className="salary-summary">
                <div className="salary-row">
                  <span><strong>📅 MONTHLY SALARY (₹)</strong></span>
                  <span className="salary-amount">{rate ? `₹${parseInt(rate) * 26}` : '₹0'}</span>
                </div>
                <div className="salary-detail">Daily Rate: ₹{rate || 0} × 26 days = Monthly Salary</div>
                {applyESI && (
                  <div className="salary-deduction">
                    ESI/PF Deduction: ₹{rate ? Math.floor((parseInt(rate) * 26 * esiPfPercentage) / 100) : 0}
                  </div>
                )}
              </div>

              <div className="next-step-info">
                <i className="fas fa-info-circle"></i>
                <strong> Next Step:</strong> After approval, worker will go to HR for finalization.
              </div>
            </div>
            
            <div className="modal-footer ceo-modal-footer">
              <button className="btn-warning" onClick={handleHold} disabled={loading}>
                <i className="fas fa-pause"></i> Hold
              </button>
              <button className="btn-danger" onClick={handleReject} disabled={loading}>
                <i className="fas fa-times"></i> Reject
              </button>
              <button className="btn-success" onClick={handleApprove} disabled={!rate || loading}>
                <i className="fas fa-check"></i> Approve & Send to HR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CEODashboard;