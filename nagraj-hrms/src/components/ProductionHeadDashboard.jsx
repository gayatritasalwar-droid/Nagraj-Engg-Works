import React, { useState, useEffect } from 'react';
import './CommonStyles.css';

const API_BASE_URL = 'https://backend-nagraj.onrender.com/api';

const ProductionDashboard = ({ session, activeMenu, setActiveMenu }) => {
  const [workers, setWorkers] = useState([]);
  const [allWorkers, setAllWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  
  const [reviewData, setReviewData] = useState({
    department: '',
    designation: '',
    category: '',
    rate: 0,
    remarks: ''
  });

  const [stats, setStats] = useState({
    totalRegistered: 0,
    inProcess: 0,
    finalized: 0,
    rejectedByProduction: 0,
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

  const departmentList = [
    "-- Select --",
    "Accounts", "Data Entry Operator", "Development", "Drilling & Tapping & Eicher",
    "Executive Assistant", "Firewall", "Floore Pannel", "Grinding Section", "HR",
    "Human Resource (HR)", "Inspection & Packing-K2", "Inspection & Packing-Regular",
    "Laser Cut Section", "Logistics Driver & Helper", "Maintenance", "Maintenance Engineer",
    "Management Information System (MIS)", "Management Reperntative (MR)", "NBF Singh",
    "Production", "Plant Head", "Quality Head", "Tool Room", "Welding Section",
    "Priming Section", "Powder Coating", "Phospheting", "Press Section", "Shearing"
  ];

  const designationList = [
    "-- Select --", "Worker", "Helper", "Operator", "Supervisor", "Welder", "Painter",
    "Packing Helper", "Fitter", "Electrician", "Mechanic", "Driver", "Office Staff",
    "Manager", "Engineer", "Sr. Engineer", "Team Lead", "Executive", "Sr. Executive",
    "Assistant Manager", "Deputy Manager", "Sr. Manager", "Head of Department"
  ];

  const categoryList = ["-- Select --", "Contractual", "Temporary", "Daily Wages"];

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/workers`);
      const data = await response.json();
      if (Array.isArray(data)) {
        const allWorkersData = data.map(w => ({
          ...w,
          id: w._id,
          _id: w._id
        }));
        setAllWorkers(allWorkersData);
        
        const pendingWorkers = allWorkersData.filter(w => w.status === 'pending_production');
        setWorkers(pendingWorkers);
        
        setStats({
          totalRegistered: allWorkersData.length,
          inProcess: allWorkersData.filter(w => w.status !== 'finalized' && w.status !== 'rejected_by_production' && w.status !== 'rejected_by_ceo').length,
          finalized: allWorkersData.filter(w => w.status === 'finalized').length,
          rejectedByProduction: allWorkersData.filter(w => w.status === 'rejected_by_production').length,
          pendingProduction: allWorkersData.filter(w => w.status === 'pending_production').length,
          pendingHR: allWorkersData.filter(w => w.status === 'pending_hr').length,
          pendingCEO: allWorkersData.filter(w => w.status === 'pending_ceo').length
        });
      } else {
        setWorkers([]);
        setAllWorkers([]);
      }
    } catch (err) {
      console.error('Error fetching workers:', err);
      setWorkers([]);
      setAllWorkers([]);
      showToast('Error loading workers', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
    const interval = setInterval(fetchWorkers, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleReview = (worker) => {
    setSelectedWorker(worker);
    setReviewData({
      department: worker.department || '',
      designation: worker.designation || '',
      category: worker.category || '',
      rate: worker.dailyRate || (worker.salary ? Math.floor(worker.salary / 26) : 0),
      remarks: ''
    });
    setShowReviewModal(true);
  };

  // ✅ CORRECTED: Send back to contractor
  const handleSendBack = async () => {
    if (!selectedWorker) return;
    if (!reviewData.remarks.trim()) {
      showToast('Please provide remarks for sending back', true);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/workers/production-sendback/${selectedWorker._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productionHeadName: session.userName,
          remarks: reviewData.remarks
        })
      });
      const result = await response.json();
      if (result.success) {
        showToast(`↩️ ${selectedWorker.fullName} sent back to contractor`);
        setShowReviewModal(false);
        fetchWorkers();
      } else {
        showToast(`⚠️ Failed to send back: ${result.error || 'Unknown error'}`, true);
      }
    } catch (err) {
      console.error('Error sending back worker:', err);
      showToast("Error sending back worker", true);
    } finally {
      setLoading(false);
    }
  };

  // ✅ CORRECTED: Reject worker
  const handleReject = async () => {
    if (!selectedWorker) return;
    if (!reviewData.remarks.trim()) {
      showToast('Please provide rejection reason', true);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/workers/production-reject/${selectedWorker._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productionHeadName: session.userName,
          rejectionReason: reviewData.remarks
        })
      });
      const result = await response.json();
      if (result.success) {
        showToast(`❌ ${selectedWorker.fullName} rejected`);
        setShowReviewModal(false);
        fetchWorkers();
      } else {
        showToast(`⚠️ Failed to reject: ${result.error || 'Unknown error'}`, true);
      }
    } catch (err) {
      console.error('Error rejecting worker:', err);
      showToast("Error rejecting worker", true);
    } finally {
      setLoading(false);
    }
  };

  // ✅ CORRECTED: Approve worker and send to CEO
  const handleApprove = async () => {
    if (!selectedWorker) return;
    if (!reviewData.department || reviewData.department === "-- Select --") {
      showToast('❌ Please select a department', true);
      return;
    }
    if (!reviewData.designation || reviewData.designation === "-- Select --") {
      showToast('❌ Please select a designation', true);
      return;
    }
    if (!reviewData.category || reviewData.category === "-- Select --") {
      showToast('❌ Please select a category', true);
      return;
    }
    if (!reviewData.rate || reviewData.rate <= 0) {
      showToast('❌ Please enter a valid daily rate', true);
      return;
    }
    setLoading(true);
    try {
      const monthlySalary = reviewData.rate * 26;
      const response = await fetch(`${API_BASE_URL}/workers/production-approve/${selectedWorker._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productionHeadName: session.userName,
          department: reviewData.department,
          designation: reviewData.designation,
          category: reviewData.category,
          dailyRate: reviewData.rate
        })
      });
      const result = await response.json();
      if (result.success) {
        showToast(`✅ ${selectedWorker.fullName} sent to CEO for approval`);
        setShowReviewModal(false);
        fetchWorkers();
      } else {
        showToast(`❌ Approval failed: ${result.error || 'Unknown error'}`, true);
      }
    } catch (err) {
      console.error('Error approving worker:', err);
      showToast("Error approving worker", true);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'tachometer-alt' },
    { id: 'pending_list', label: 'Pending List', icon: 'clock', badge: workers.length },
    { id: 'logout', label: 'Logout', icon: 'sign-out-alt' }
  ];

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
      case 'pending_production': return <span className="stage-badge production">Pending Production</span>;
      case 'pending_ceo': return <span className="stage-badge ceo">Pending CEO</span>;
      case 'pending_hr': return <span className="stage-badge hr">Pending HR</span>;
      case 'finalized': return <span className="stage-badge finalized">Finalized</span>;
      case 'rejected_by_production': return <span className="stage-badge rejected">Rejected by Production</span>;
      case 'rejected_by_ceo': return <span className="stage-badge rejected">Rejected by CEO</span>;
      case 'send_back_to_contractor': return <span className="stage-badge warning">Sent Back</span>;
      default: return <span className="stage-badge">{status || 'Pending'}</span>;
    }
  };

  const getFilteredWorkersByTab = () => {
    if (activeTab === 'all') return allWorkers;
    if (activeTab === 'production') return allWorkers.filter(w => w.status === 'pending_production');
    if (activeTab === 'ceo') return allWorkers.filter(w => w.status === 'pending_ceo');
    if (activeTab === 'hr') return allWorkers.filter(w => w.status === 'pending_hr');
    if (activeTab === 'finalized') return allWorkers.filter(w => w.status === 'finalized');
    return allWorkers;
  };

  const displayWorkers = getFilteredWorkersByTab();

  const StatCard = ({ title, value, icon, color, filterTab }) => (
    <div 
      className="stat-card" 
      style={{ borderLeftColor: color, cursor: 'pointer' }} 
      onClick={() => { setActiveTab(filterTab); setActiveMenu('dashboard'); }}
    >
      <div className="stat-icon" style={{ background: `${color}20` }}>
        <i className={`fas fa-${icon}`} style={{ color }}></i>
      </div>
      <div className="stat-info">
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
    </div>
  );

  // Pending List View
  if (activeMenu === 'pending_list') {
    const filteredWorkers = workers.filter(w =>
      w.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.punchCode && w.punchCode.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
      <div className="dashboard-layout">
        <div className="side-menu">
          <div className="menu-header">
            <i className="fas fa-industry"></i>
            <div>
              <h3>NAGRAJ INDUSTRIES</h3>
              <p>Production Head Portal</p>
              <small>{session.userName}</small>
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
            <i className="fas fa-check-circle"></i> Production Authority
          </div>
        </div>

        <div className="dashboard-content">
          <div className="welcome-banner">
            <div className="welcome-content">
              <h2><i className="fas fa-clipboard-list"></i> Pending Applications</h2>
              <p>Review and process worker applications from HR/Contractor</p>
            </div>
            <div className="date-display">
              <i className="fas fa-calendar-alt"></i>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          <div className="content-card">
            <div className="card-header">
              <h3><i className="fas fa-clock"></i> Pending Production Review ({workers.length})</h3>
              <div className="search-box">
                <i className="fas fa-search"></i>
                <input type="text" placeholder="Search by name, department, punch code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <button onClick={fetchWorkers} className="btn-primary-sm"><i className="fas fa-sync-alt"></i> Refresh</button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: '#1e3a8a' }}></i>
                <p>Loading workers...</p>
              </div>
            ) : workers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <i className="fas fa-check-circle" style={{ fontSize: 48, color: '#10b981', marginBottom: 16 }}></i>
                <h4>No Pending Applications</h4>
                <p>All workers have been processed. Check back later for new registrations.</p>
              </div>
            ) : (
              <div className="employee-grid">
                {filteredWorkers.map(worker => (
                  <div key={worker._id} className="employee-card" onClick={() => handleReview(worker)}>
                    <div className="employee-avatar" style={{ background: '#3b82f6' }}>
                      {worker.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'WK'}
                    </div>
                    <div className="employee-info">
                      <h4>{worker.fullName}</h4>
                      <p className="employee-dept"><i className="fas fa-building"></i> {worker.department || 'Not Assigned'}</p>
                      <p className="employee-designation"><i className="fas fa-briefcase"></i> {worker.designation || 'Worker'}</p>
                      <p className="employee-type">{worker.userType === 'staff' ? '👔 Staff' : '👷 Worker'}</p>
                      {worker.punchCode && <p className="employee-punch"><i className="fas fa-qrcode"></i> Punch: <code>{worker.punchCode}</code></p>}
                      <p className="employee-status pending"><i className="fas fa-hourglass-half"></i> Pending Production Review</p>
                    </div>
                    <button className="btn-review-small" onClick={(e) => { e.stopPropagation(); handleReview(worker); }}>Review <i className="fas fa-arrow-right"></i></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Review Modal with Remarks for Reject/Sendback */}
        {showReviewModal && selectedWorker && (
          <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
            <div className="modal-content production-review-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
              <div className="modal-header" style={{ background: '#1e3a8a', color: 'white' }}>
                <h3><i className="fas fa-clipboard-list"></i> Production Review - {selectedWorker.fullName}</h3>
                <button className="modal-close" onClick={() => setShowReviewModal(false)}>&times;</button>
              </div>
              <div className="modal-body" style={{ padding: '20px' }}>
                {/* Worker Info */}
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
                  <h4 style={{ marginBottom: '12px', color: '#1e3a8a', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}><i className="fas fa-user-circle"></i> Worker Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div><p style={{ margin: '0 0 5px', fontSize: '11px', color: '#64748b' }}>Full Name</p><p style={{ margin: '0', fontWeight: '600' }}>{selectedWorker.fullName}</p></div>
                    <div><p style={{ margin: '0 0 5px', fontSize: '11px', color: '#64748b' }}>Application ID</p><p style={{ margin: '0', fontWeight: '500' }}>{selectedWorker.applicationId || 'N/A'}</p></div>
                    <div><p style={{ margin: '0 0 5px', fontSize: '11px', color: '#64748b' }}>Mobile</p><p style={{ margin: '0' }}>{selectedWorker.mobile || selectedWorker.phone || 'Not provided'}</p></div>
                    <div><p style={{ margin: '0 0 5px', fontSize: '11px', color: '#64748b' }}>Aadhar</p><p style={{ margin: '0' }}>{selectedWorker.aadhar || 'Not provided'}</p></div>
                    <div><p style={{ margin: '0 0 5px', fontSize: '11px', color: '#64748b' }}>Type</p><p style={{ margin: '0' }}>{selectedWorker.userType === 'staff' ? '👔 Staff' : '👷 Worker'}</p></div>
                    <div><p style={{ margin: '0 0 5px', fontSize: '11px', color: '#64748b' }}>Current Status</p><p style={{ margin: '0', color: '#f59e0b', fontWeight: '600' }}>Pending Production Review</p></div>
                  </div>
                </div>

                {/* Production Entry Fields */}
                <div className="production-fields">
                  <h4 style={{ marginBottom: '16px', color: '#1e3a8a' }}><i className="fas fa-industry"></i> Production Entry Fields</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group">
                      <label>DEPARTMENT *</label>
                      <select value={reviewData.department} onChange={(e) => setReviewData({ ...reviewData, department: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <option value="">-- Select --</option>
                        {departmentList.filter(d => d !== "-- Select --").map(dept => <option key={dept} value={dept}>{dept}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>DESIGNATION *</label>
                      <select value={reviewData.designation} onChange={(e) => setReviewData({ ...reviewData, designation: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <option value="">-- Select --</option>
                        {designationList.filter(d => d !== "-- Select --").map(des => <option key={des} value={des}>{des}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>CATEGORY *</label>
                      <select value={reviewData.category} onChange={(e) => setReviewData({ ...reviewData, category: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        {categoryList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>DAILY RATE (₹) *</label>
                      <input type="number" value={reviewData.rate} onChange={(e) => setReviewData({ ...reviewData, rate: parseInt(e.target.value) || 0 })} placeholder="Daily rate in ₹" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                      <small style={{ fontSize: '11px', color: '#64748b' }}>Monthly Salary: ₹{(reviewData.rate * 26).toLocaleString()}</small>
                    </div>
                  </div>
                  <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span><strong>MONTHLY SALARY (₹)</strong></span>
                      <input type="text" value={reviewData.rate ? `₹${(reviewData.rate * 26).toLocaleString()}` : '₹0'} readOnly style={{ width: '200px', background: '#e2e8f0', padding: '8px', borderRadius: '6px', border: 'none', textAlign: 'right', fontWeight: 'bold' }} />
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '8px', textAlign: 'right', color: '#64748b' }}>Daily Rate: ₹{reviewData.rate || 0} × 26 days = Monthly Salary</div>
                  </div>
                  <div style={{ marginTop: '20px' }}>
  <label>REMARKS (required for Reject / Send Back)</label>
  <textarea 
    rows="2"
    value={reviewData.remarks}
    onChange={(e) => setReviewData({ ...reviewData, remarks: e.target.value })}
    placeholder="Enter remarks or rejection reason..."
    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '5px' }}
  />
</div>

                  

                  <div style={{ marginTop: '15px', padding: '10px', background: '#dbeafe', borderRadius: '8px' }}>
                    <i className="fas fa-info-circle" style={{ color: '#1e3a8a' }}></i>
                    <strong style={{ marginLeft: '8px' }}>Next Step:</strong> After approval, worker will go to <strong style={{ color: '#8b5cf6' }}>CEO</strong> for final approval, then to <strong style={{ color: '#3b82f6' }}>HR</strong> for finalization.
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 20px', borderTop: '1px solid #e2e8f0' }}>
                <button className="btn-sendback" onClick={handleSendBack} disabled={loading} style={{ background: '#f59e0b', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}><i className="fas fa-undo"></i> Send Back</button>
                <button className="btn-reject" onClick={handleReject} disabled={loading} style={{ background: '#dc2626', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}><i className="fas fa-times"></i> Reject</button>
                <button className="btn-approve" onClick={handleApprove} disabled={loading} style={{ background: '#10b981', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>{loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>} {loading ? ' Processing...' : ' Approve & Send to CEO'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="dashboard-layout">
      <div className="side-menu">
        <div className="menu-header">
          <i className="fas fa-industry"></i>
          <div>
            <h3>NAGRAJ INDUSTRIES</h3>
            <p>Production Head Portal</p>
            <small>{session.userName}</small>
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
          <i className="fas fa-check-circle"></i> Production Authority
        </div>
      </div>

      <div className="dashboard-content">
        <div className="welcome-banner">
          <div className="welcome-content">
            <h2><i className="fas fa-chart-line"></i> Production Dashboard</h2>
            <p>Review and manage worker applications</p>
            <small>Workflow: Production → CEO → HR → Finalized</small>
          </div>
          <div className="date-display">
            <i className="fas fa-calendar-alt"></i>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard title="TOTAL REGISTERED" value={stats.totalRegistered} icon="users" color="#3b82f6" filterTab="all" />
          <StatCard title="PENDING PRODUCTION" value={stats.pendingProduction} icon="clock" color="#f59e0b" filterTab="production" />
          <StatCard title="PENDING CEO" value={stats.pendingCEO} icon="user-tie" color="#8b5cf6" filterTab="ceo" />
          <StatCard title="PENDING HR" value={stats.pendingHR} icon="users" color="#10b981" filterTab="hr" />
          <StatCard title="FINALIZED" value={stats.finalized} icon="check-circle" color="#28c95b" filterTab="finalized" />
        </div>

        <div className="content-card">
          <div className="card-header">
            <h3><i className="fas fa-users"></i> All Employee Tracking</h3>
            <div className="tab-filters">
              <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All ({stats.totalRegistered})</button>
              <button className={`tab-btn ${activeTab === 'production' ? 'active' : ''}`} onClick={() => setActiveTab('production')}>Production ({stats.pendingProduction})</button>
              <button className={`tab-btn ${activeTab === 'ceo' ? 'active' : ''}`} onClick={() => setActiveTab('ceo')}>CEO ({stats.pendingCEO})</button>
              <button className={`tab-btn ${activeTab === 'hr' ? 'active' : ''}`} onClick={() => setActiveTab('hr')}>HR ({stats.pendingHR})</button>
              <button className={`tab-btn ${activeTab === 'finalized' ? 'active' : ''}`} onClick={() => setActiveTab('finalized')}>Finalized ({stats.finalized})</button>
            </div>
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input type="text" placeholder="Search by name, punch code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={fetchWorkers} className="btn-primary-sm"><i className="fas fa-sync-alt"></i> Refresh</button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: '#1e3a8a' }}></i>
              <p>Loading workers...</p>
            </div>
          ) : displayWorkers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <i className="fas fa-inbox" style={{ fontSize: 48, color: '#cbd5e1', marginBottom: 16 }}></i>
              <p>No employees found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>NAME</th>
                    <th>DEPT/DESIG</th>
                    <th>TYPE</th>
                    <th>PUNCH CODE</th>
                    <th>SALARY</th>
                    <th>STAGE</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {displayWorkers
                    .filter(w => w.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || (w.punchCode && w.punchCode.toLowerCase().includes(searchTerm.toLowerCase())))
                    .map(worker => (
                      <tr key={worker._id}>
                        <td>
                          <strong>{worker.fullName}</strong><br/>
                          <small style={{ color: '#64748b' }}>ID: {worker.applicationId || worker.id?.slice(-6)}</small>
                        </td>
                        <td>
                          {worker.department || 'N/A'}<br/>
                          <small>{worker.designation || 'Worker'}</small>
                        </td>
                        <td>{worker.userType === 'staff' ? '👔 Staff' : '👷 Worker'}</td>
                        <td><code>{worker.punchCode || 'N/A'}</code></td>
                        <td>₹{worker.salary?.toLocaleString() || 0}</td>
                        <td>{getStageBadge(worker.status)}</td>
                        <td>
                          {worker.status === 'pending_production' && (
                            <button className="btn-review-small" onClick={() => handleReview(worker)} style={{ background: '#f59e0b', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Review</button>
                          )}
                          {worker.status === 'pending_ceo' && <span style={{ color: '#8b5cf6', fontSize: '12px' }}><i className="fas fa-hourglass-half"></i> With CEO</span>}
                          {worker.status === 'pending_hr' && <span style={{ color: '#3b82f6', fontSize: '12px' }}><i className="fas fa-hourglass-half"></i> With HR</span>}
                          {worker.status === 'finalized' && <span style={{ color: '#10b981', fontSize: '12px' }}><i className="fas fa-check-circle"></i> Finalized</span>}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductionDashboard;