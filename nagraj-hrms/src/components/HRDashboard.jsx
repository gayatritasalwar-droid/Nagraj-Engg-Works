import React, { useState, useEffect } from 'react';
import './CommonStyles.css';
import WorkerRegistration from './WorkerRegistration';

// API Base URL
const API_BASE_URL = 'https://backend-nagraj.onrender.com/api';

const HRDashboard = ({ session, activeMenu, setActiveMenu }) => {
  // Helper functions
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const showToast = (msg, isError = false) => {
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:20px;right:20px;background:${isError ? '#dc2626' : '#1e3a8a'};color:white;padding:12px 20px;border-radius:8px;z-index:10000;box-shadow:0 4px 12px rgba(0,0,0,0.15);`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // Save to MongoDB
  const saveToMongoDB = async (workerData) => {
    try {
      const { _id, ...dataToSave } = workerData;
      const response = await fetch(`${API_BASE_URL}/workers/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });
      const result = await response.json();
      if (result.success) {
        console.log('✅ Saved to MongoDB:', workerData.fullName);
        return true;
      }
      return false;
    } catch (err) {
      console.log('MongoDB save failed:', err);
      return false;
    }
  };

  // ✅ FIXED: Update worker using correct endpoint
  const updateWorkerInMongoDB = async (workerId, updatedData) => {
    try {
      const { _id, ...dataToUpdate } = updatedData;
      const response = await fetch(`${API_BASE_URL}/workers/${workerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToUpdate)
      });
      const result = await response.json();
      return result.success;
    } catch (err) {
      console.log('MongoDB update failed:', err);
      return false;
    }
  };

  // Generate random punch code
  const generatePunchCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Calculate age from DOB
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // State variables
  const [workers, setWorkers] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showStaffRegistrationModal, setShowStaffRegistrationModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [enteredPunchCode, setEnteredPunchCode] = useState('');
  const [punchError, setPunchError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ageAlert, setAgeAlert] = useState({ show: false, message: '', isValid: false });
  const [activeStatusTab, setActiveStatusTab] = useState('all');

  // Worker Registration Form State (legacy, kept for compatibility)
  const [formData, setFormData] = useState({
    fullName: '',
    department: '',
    designation: '',
    workerType: 'Worker',
    perDayRate: '',
    otRate: '',
    aadhar: '',
    dateOfBirth: '',
    joiningDate: '',
    mobile: '',
    aadharFile: null
  });

  // Staff Registration Form State
  const [staffFormData, setStaffFormData] = useState({
    fullName: '',
    aadhar: '',
    phone: '',
    dateOfBirth: '',
    gender: 'Male',
    department: '',
    subDepartment: '',
    designation: '',
    monthlySalary: '',
    bondYears: '2',
    applyESI: false,
    address: '',
    aadharFile: null
  });

  // Department list
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

  // Designation list
  const designationList = [
    "-- Select --", "Worker", "Helper", "Operator", "Supervisor", "Welder", "Painter",
    "Packing Helper", "Fitter", "Electrician", "Mechanic", "Driver", "Office Staff",
    "Manager", "Engineer", "Sr. Engineer", "Team Lead", "Executive", "Sr. Executive",
    "Assistant Manager", "Deputy Manager", "Sr. Manager", "Head of Department"
  ];

  // Fetch all employees from MongoDB
  const fetchAllEmployees = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/workers`);
      const data = await response.json();
      if (Array.isArray(data)) {
        const mappedEmployees = data.map(w => ({
          ...w,
          id: w._id || w.id,
          _id: w._id
        }));
        setAllEmployees(mappedEmployees);
        
        const approvedWorkers = mappedEmployees.filter(employee => 
          employee.status === 'pending_hr' || employee.status === 'finalized'
        );
        setWorkers(approvedWorkers);
        
        // Also update localStorage as backup
        localStorage.setItem('Nagraj_workers', JSON.stringify(mappedEmployees));
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem('Nagraj_workers');
        if (stored) {
          const allEmployees_data = JSON.parse(stored);
          setAllEmployees(allEmployees_data);
          const approvedWorkers = allEmployees_data.filter(employee => 
            employee.status === 'pending_hr' || employee.status === 'finalized'
          );
          setWorkers(approvedWorkers);
        }
      }
    } catch (err) {
      console.error('Error loading employees:', err);
      // Fallback to localStorage
      const stored = localStorage.getItem('Nagraj_workers');
      if (stored) {
        const allEmployees_data = JSON.parse(stored);
        setAllEmployees(allEmployees_data);
        const approvedWorkers = allEmployees_data.filter(employee => 
          employee.status === 'pending_hr' || employee.status === 'finalized'
        );
        setWorkers(approvedWorkers);
      }
      showToast("Error loading employees", true);
    } finally {
      setLoading(false);
    }
  };

  // Generate Joining Letter PDF
  const generateJoiningLetterPDF = (employee) => {
    const printWindow = window.open('', '_blank');
    const today = new Date().toLocaleDateString('en-IN');
    const joiningDate = employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString('en-IN') : today;
    
    const esiPfPercentage = employee.esiPfPercentage || 3.25;
    const monthlySalary = employee.salary || 0;
    const esiPfDeduction = (monthlySalary * esiPfPercentage) / 100;
    const netSalary = monthlySalary - esiPfDeduction;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Joining Letter - ${employee.fullName}</title>
        <meta charset="utf-8">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Arial', 'Helvetica', sans-serif; background: #e2e8f0; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 40px 20px; }
          .letter-container { max-width: 900px; width: 100%; background: white; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border-radius: 12px; overflow: hidden; }
          .letter-header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; }
          .company-name { font-size: 28px; font-weight: bold; margin-bottom: 5px; }
          .company-tagline { font-size: 13px; opacity: 0.9; }
          .letter-title { background: #f1f5f9; padding: 15px; text-align: center; border-bottom: 2px solid #f39c12; }
          .letter-title h2 { color: #1e3a8a; font-size: 24px; margin: 0; }
          .letter-body { padding: 30px; }
          .date-section { text-align: right; margin-bottom: 30px; color: #475569; }
          .subject-section { background: #fef3c7; padding: 12px 15px; border-left: 4px solid #f59e0b; margin-bottom: 25px; border-radius: 4px; }
          .subject-section strong { color: #92400e; }
          .salutation { margin-bottom: 20px; }
          .content { line-height: 1.8; color: #334155; margin-bottom: 25px; }
          .content p { margin-bottom: 12px; }
          .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 8px; overflow: hidden; }
          .details-table td { padding: 12px; border: 1px solid #e2e8f0; }
          .details-table td:first-child { font-weight: bold; width: 35%; background: #f1f5f9; }
          .signature-section { margin-top: 40px; display: flex; justify-content: space-between; gap: 40px; }
          .signature-box { text-align: center; flex: 1; }
          .signature-line { width: 200px; border-top: 2px solid #1e3a8a; margin: 0 auto 15px auto; border-radius: 2px; }
          .signature-name { font-family: 'Dancing Script', 'Courier New', cursive; font-size: 20px; font-weight: 600; color: #1e3a8a; margin: 8px 0; }
          .signature-title { font-size: 14px; font-weight: 600; color: #333; margin: 5px 0; }
          .signature-role { font-size: 12px; color: #666; margin: 3px 0; }
          .signature-designation { font-size: 11px; color: #999; margin-top: 3px; }
          .signature-date { font-size: 11px; color: #999; margin-top: 8px; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; margin-top: 20px; }
          .footer p:first-child { font-size: 14px; font-weight: 700; color: #1e3a8a; }
          .btn-print { background: #3b82f6; color: white; padding: 10px 20px; margin: 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; }
          .btn-print:hover { background: #2563eb; }
          @media print {
            body { background: white; padding: 0; }
            .letter-container { box-shadow: none; border-radius: 0; }
            .btn-print { display: none; }
          }
          @media (max-width: 600px) {
            .signature-section { flex-direction: column; gap: 30px; }
            .signature-line { width: 180px; }
          }
          @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap');
        </style>
      </head>
      <body>
        <div class="letter-container">
          <div class="letter-header">
            <div class="company-name">NAGRAJ INDUSTRIES</div>
            <div class="company-tagline">Excellence in Manufacturing & Engineering</div>
          </div>
          <div class="letter-title"><h2>JOINING LETTER</h2></div>
          <div class="letter-body">
            <div class="date-section"><strong>Date:</strong> ${today}</div>
            <div class="subject-section"><strong>Subject:</strong> Confirmation of Joining as ${employee.designation || 'Employee'}</div>
            <div class="salutation"><strong>To,</strong><br/>${employee.fullName}<br/>${employee.address || 'Address on file'}<br/>Mobile: ${employee.mobile || 'Not provided'}</div>
            <div class="content">
              <p>Dear <strong>${employee.fullName}</strong>,</p>
              <p>We are pleased to confirm your joining with <strong>NAGRAJ INDUSTRIES</strong> as <strong>${employee.designation || 'Employee'}</strong> in the <strong>${employee.department || 'General'}</strong> department.</p>
              <p>Based on your application and subsequent approvals, you have been appointed with the following details:</p>
            </div>
            <table class="details-table">
              <tr><td style="padding:12px;border:1px solid #e2e8f0;font-weight:bold;width:35%;background:#f1f5f9">Employee Name</td>
              <td><strong>${employee.fullName} ${employee.userType === 'staff' ? '(Staff)' : '(Worker)'}</strong></td>
              </tr>
              <tr><td style="padding:12px;border:1px solid #e2e8f0;font-weight:bold;background:#f1f5f9">Punch Code</td>
              <td><strong style="font-size:16px;color:#1e3a8a;">${employee.punchCode || 'Will be provided'}</strong></td>
              </tr>
              <tr><td style="padding:12px;border:1px solid #e2e8f0;font-weight:bold;background:#f1f5f9">Department</td>
              <td>${employee.department || 'Not specified'}</td>
              </tr>
              <tr><td style="padding:12px;border:1px solid #e2e8f0;font-weight:bold;background:#f1f5f9">Designation</td>
              <td>${employee.designation || 'Worker'}</td>
              </tr>
              <tr><td style="padding:12px;border:1px solid #e2e8f0;font-weight:bold;background:#f1f5f9">Monthly Salary</td>
              <td><strong>₹ ${employee.salary?.toLocaleString() || '0'}</strong></td>
              </tr>
              ${employee.applyESI ? `
              <tr><td style="padding:12px;border:1px solid #e2e8f0;font-weight:bold;background:#f1f5f9">ESI/PF Deduction (${employee.esiPfPercentage || 3.25}%)</td>
              <td>₹ ${Math.round(esiPfDeduction).toLocaleString()}</td>
              </tr>
              <tr><td style="padding:12px;border:1px solid #e2e8f0;font-weight:bold;background:#f1f5f9">Net Monthly Salary</td>
              <td><strong>₹ ${Math.round(netSalary).toLocaleString()}</strong></td>
              </tr>` : ''}
              <tr><td style="padding:12px;border:1px solid #e2e8f0;font-weight:bold;background:#f1f5f9">Bond Period</td>
              <td>${employee.bondYears || 2} years</td>
              </tr>
            </table>
            <div class="content"><p>We welcome you to the NAGRAJ INDUSTRIES family and look forward to a long and mutually beneficial association.</p></div>
            <div class="signature-section">
              <div class="signature-box"><br/><br/><div class="signature-line"></div><div class="signature-title">Employee Signature</div></div>
              <div class="signature-box"><div class="signature-name">Nagraj S.Reddy</div><div class="signature-line"></div><div class="signature-title">For NAGRAJ INDUSTRIES</div><div class="signature-role">Authorized Signatory</div><div class="signature-designation">Managing Director</div></div>
            </div>
          </div>
        </div>
        <div style="text-align: center;">
          <button onclick="window.print()" class="btn-print"><i class="fas fa-print"></i> Print / Save as PDF</button>
          <button onclick="window.close()" class="btn-print" style="background: #64748b;">Close</button>
        </div>
        <script>window.onload = function() { setTimeout(() => { window.print(); }, 500); };</script>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    showToast(`📄 Joining letter generated for ${employee.fullName}`);
  };

  // View Aadhar function
  const viewAadhar = (employee) => {
    if (employee.aadharBase64 && employee.aadharBase64.length > 100) {
      const win = window.open();
      win.document.write(`
        <html>
          <head><title>Aadhar - ${employee.fullName}</title></head>
          <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f0f0f0;">
            <img src="${employee.aadharBase64}" style="max-width:95%;max-height:95vh;box-shadow:0 0 10px rgba(0,0,0,0.2);" />
            <p style="position:fixed;bottom:10px;background:white;padding:5px 10px;border-radius:5px;">
              📄 ${employee.aadharFileName || 'Aadhar Card'}
            </p>
          </body>
        </html>
      `);
    } else if (employee.aadharFileName && !employee.aadharBase64) {
      alert(`❌ Aadhar file name found: ${employee.aadharFileName}\n\nBut image data is missing!\n\nPlease re-upload Aadhar for this employee.`);
    } else {
      alert('❌ No Aadhar file uploaded for ' + employee.fullName + '\n\nPlease register again with Aadhar file upload.');
    }
  };

  // Register Worker (kept for legacy, but worker registration uses WorkerRegistration component)
  const handleRegisterWorkerLegacy = async () => {
    // ... (kept as is, but not used)
  };

  // Register Staff
  const handleRegisterStaff = async () => {
    const age = calculateAge(staffFormData.dateOfBirth);
    if (age < 18) {
      showToast('❌ Staff must be at least 18 years old!', true);
      return;
    }

    if (!staffFormData.fullName || !staffFormData.aadhar || !staffFormData.phone || !staffFormData.dateOfBirth || !staffFormData.department || !staffFormData.designation || !staffFormData.monthlySalary) {
      showToast('❌ Please fill all required fields', true);
      return;
    }

    let aadharBase64 = '';
    let aadharFileName = '';
    if (staffFormData.aadharFile) {
      aadharBase64 = await fileToBase64(staffFormData.aadharFile);
      aadharFileName = staffFormData.aadharFile.name;
    }

    const appId = `LXC-STF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const punchCode = generatePunchCode();
    
    const newStaff = {
      id: Date.now(),
      applicationId: appId,
      fullName: staffFormData.fullName,
      userType: 'staff',
      displayName: `${staffFormData.fullName} (Staff)`,
      aadhar: staffFormData.aadhar,
      aadharBase64: aadharBase64,
      aadharFileName: aadharFileName,
      mobile: staffFormData.phone,
      dateOfBirth: staffFormData.dateOfBirth,
      gender: staffFormData.gender,
      department: staffFormData.department,
      subDept: staffFormData.subDepartment,
      designation: staffFormData.designation,
      salary: parseInt(staffFormData.monthlySalary),
      dailyRate: Math.floor(parseInt(staffFormData.monthlySalary) / 26),
      bondYears: parseInt(staffFormData.bondYears),
      applyESI: staffFormData.applyESI,
      esiPfPercentage: staffFormData.applyESI ? 3.25 : 0,
      address: staffFormData.address,
      joiningDate: new Date().toISOString().slice(0, 10),
      status: 'pending_production',
      stage: 'Pending Production Review',
      registeredBy: session.userName,
      registeredByRole: 'HR',
      registeredDate: new Date().toISOString().slice(0, 10),
      category: 'Staff',
      punchCode: punchCode,
      createdAt: new Date().toISOString(),
      company: 'NAGRAJ INDUSTRIES'
    };

    try {
      const saved = await saveToMongoDB(newStaff);
      
      if (saved) {
        showToast(`✅ Staff ${staffFormData.fullName} registered with Punch Code: ${punchCode}`);
      } else {
        const stored = localStorage.getItem('Nagraj_workers');
        const allWorkers = stored ? JSON.parse(stored) : [];
        allWorkers.push(newStaff);
        localStorage.setItem('Nagraj_workers', JSON.stringify(allWorkers));
        showToast(`✅ Staff ${staffFormData.fullName} registered (Local backup) with Punch Code: ${punchCode}`);
      }
      
      setShowStaffRegistrationModal(false);
      setStaffFormData({
        fullName: '', aadhar: '', phone: '', dateOfBirth: '', gender: 'Male',
        department: '', subDepartment: '', designation: '', monthlySalary: '',
        bondYears: '2', applyESI: false, address: '', aadharFile: null
      });
      setAgeAlert({ show: false, message: '', isValid: false });
      fetchAllEmployees();
    } catch (err) {
      console.error(err);
      showToast('Error registering staff', true);
    }
  };

  // Finalize Employee (updated to use correct endpoint)
  const finalizeEmployee = async (employee, punchInput) => {
    const expectedPunchCode = employee.punchCode;
    
    if (expectedPunchCode !== punchInput) {
      setPunchError(`❌ Invalid punch code! Expected: ${expectedPunchCode}`);
      showToast(`Invalid punch code`, true);
      return false;
    }

    try {
      const updatedEmployee = {
        ...employee,
        status: "finalized",
        finalizedDate: new Date().toISOString().slice(0, 10),
        finalizedBy: session.userName,
        stage: "Finalized"
      };
      
      // ✅ Use generic PUT endpoint (works for any update)
      const updated = await updateWorkerInMongoDB(employee._id || employee.id, updatedEmployee);
      
      if (updated) {
        showToast(`✅ ${employee.fullName} finalized successfully!`);
        // Generate joining letter after successful finalization
        generateJoiningLetterPDF(employee);
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem('Nagraj_workers');
        if (stored) {
          const allWorkers = JSON.parse(stored);
          const updatedWorkers = allWorkers.map(w => {
            if (w.id === employee.id || w.id === employee._id) {
              return updatedEmployee;
            }
            return w;
          });
          localStorage.setItem('Nagraj_workers', JSON.stringify(updatedWorkers));
          showToast(`✅ ${employee.fullName} finalized (Local backup)!`);
          generateJoiningLetterPDF(employee);
        }
      }
      
      setEnteredPunchCode('');
      setPunchError('');
      await fetchAllEmployees(); // Refresh data
      setShowFinalizeModal(false);
      setSelectedWorker(null);
      return true;
    } catch (err) {
      console.error('Finalization error:', err);
      showToast("Error finalizing employee", true);
      return false;
    }
  };

  const handleConfirmFinalize = () => {
    if (selectedWorker) {
      finalizeEmployee(selectedWorker, enteredPunchCode);
    }
  };

  const handleDobChange = (e, type = 'worker') => {
    const dob = e.target.value;
    if (type === 'worker') {
      setFormData(prev => ({ ...prev, dateOfBirth: dob }));
    } else {
      setStaffFormData(prev => ({ ...prev, dateOfBirth: dob }));
    }
    if (dob) {
      const age = calculateAge(dob);
      if (age !== null && age < 18) {
        setAgeAlert({
          show: true,
          message: `⚠️ Age is ${age} years. Must be at least 18 years old!`,
          isValid: false
        });
      } else if (age !== null) {
        setAgeAlert({
          show: true,
          message: `✓ Age is ${age} years. Eligible for employment.`,
          isValid: true
        });
      }
    } else {
      setAgeAlert({ show: false, message: '', isValid: false });
    }
  };

  const handleWorkerInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStaffInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setStaffFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e, type = 'worker') => {
    if (type === 'worker') {
      setFormData(prev => ({ ...prev, aadharFile: e.target.files[0] }));
    } else {
      setStaffFormData(prev => ({ ...prev, aadharFile: e.target.files[0] }));
    }
  };

  useEffect(() => {
    fetchAllEmployees();
    const interval = setInterval(fetchAllEmployees, 10000);
    return () => clearInterval(interval);
  }, []);

  const pendingFinalization = workers.filter(w => w.status === "pending_hr");
  const finalizedWorkers = workers.filter(w => w.status === "finalized");

  const getStatusCount = (status) => {
    return allEmployees.filter(e => e.status === status).length;
  };

  const getFilteredEmployeesByStatus = () => {
    if (activeStatusTab === 'all') return allEmployees;
    return allEmployees.filter(e => e.status === activeStatusTab);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending_production': { color: '#f59e0b', text: 'Pending Production' },
      'pending_ceo': { color: '#8b5cf6', text: 'Pending CEO' },
      'pending_hr': { color: '#3b82f6', text: 'Pending HR' },
      'finalized': { color: '#10b981', text: 'Finalized' },
      'rejected_by_production': { color: '#dc2626', text: 'Rejected by Production' },
      'rejected_by_ceo': { color: '#dc2626', text: 'Rejected by CEO' },
      'on_hold_ceo': { color: '#f59e0b', text: 'On Hold - CEO' }
    };
    return badges[status] || { color: '#6b7280', text: status };
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'tachometer-alt' },
    { id: 'worker_registration', label: 'Worker Registration', icon: 'user-plus' },
    { id: 'staff_registration', label: 'Staff Registration', icon: 'user-tie' },
    { id: 'pending_finalization', label: 'Pending Finalization', icon: 'clock', badge: pendingFinalization.length },
    { id: 'finalized', label: 'Finalized', icon: 'users', badge: finalizedWorkers.length },
    { id: 'logout', label: 'Logout', icon: 'sign-out-alt' }
  ];

  // ✅ FIXED LOGOUT
  const handleMenuClick = (id) => {
    if (id === 'logout') { 
      localStorage.removeItem('nagraj_session');
      window.location.href = '/login';
      return; 
    }
    if (id === 'worker_registration') { 
      setShowRegistrationModal(true); 
      return; 
    }
    if (id === 'staff_registration') { 
      setShowStaffRegistrationModal(true); 
      return; 
    }
    setActiveMenu(id);
  };

  // CLICKABLE STAT CARD COMPONENT
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
    // PENDING FINALIZATION VIEW
    if (activeMenu === 'pending_finalization') {
      const filteredWorkers = pendingFinalization.filter(w => 
        w.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (w.punchCode && w.punchCode.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      return (
        <div className="content-card">
          <div className="card-header">
            <h3><i className="fas fa-clock"></i> Pending Finalization ({pendingFinalization.length})</h3>
            <div className="search-box">
              <input type="text" placeholder="Search by name or punch code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={fetchAllEmployees} className="btn-primary-sm">Refresh</button>
          </div>
          {pendingFinalization.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <i className="fas fa-check-circle" style={{ fontSize: 48, color: '#10b981', marginBottom: 16 }}></i>
              <h4>No Pending Finalizations</h4>
              <p>Workers/Staff approved by CEO will appear here for finalization.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Name</th><th>Type</th><th>Department</th><th>Designation</th><th>Punch Code</th><th>Monthly Salary</th><th>Action</th></tr></thead>
              <tbody>
                {filteredWorkers.map(w => (
                  <tr key={w._id || w.id}>
                    <td><strong>{w.fullName}</strong><br/><small>{w.userType === 'staff' ? 'Staff' : 'Worker'}</small></td>
                    <td>{w.userType === 'staff' ? '👔 Staff' : '👷 Worker'}</td>
                    <td>{w.department}</td>
                    <td>{w.designation}</td>
                    <td><code>{w.punchCode}</code></td>
                    <td>₹{w.salary?.toLocaleString() || 0}</td>
                    <td><button className="btn-finalize" onClick={() => { setSelectedWorker(w); setEnteredPunchCode(''); setPunchError(''); setShowFinalizeModal(true); }}>Finalize</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );
    }

    // FINALIZED VIEW
    if (activeMenu === 'finalized') {
      const filteredWorkers = finalizedWorkers.filter(w => 
        w.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (w.punchCode && w.punchCode.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      return (
        <div className="content-card">
          <div className="card-header">
            <h3><i className="fas fa-users"></i> Finalized ({finalizedWorkers.length})</h3>
            <div className="search-box">
              <input type="text" placeholder="Search by name or punch code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          {filteredWorkers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>No finalized records found</div>
          ) : (
            <div className="finalized-grid">
              {filteredWorkers.map(w => (
                <div key={w._id || w.id} className="finalized-card">
                  <div className="finalized-card-header">
                    <i className="fas fa-user-circle"></i>
                    <h4>{w.fullName} {w.userType === 'staff' && <span style={{ fontSize: '12px', background: '#8b5cf6', padding: '2px 8px', borderRadius: '12px' }}>Staff</span>}</h4>
                  </div>
                  <div className="finalized-card-body">
                    <p><strong>Department:</strong> {w.department}</p>
                    <p><strong>Designation:</strong> {w.designation}</p>
                    <p><strong>Punch Code:</strong> <code>{w.punchCode}</code></p>
                    <p><strong>Salary:</strong> ₹{w.salary?.toLocaleString()}</p>
                    <p><strong>Joined:</strong> {w.joiningDate}</p>
                  </div>
                  <div className="finalized-card-footer">
                    <button className="btn-pdf" onClick={() => generateJoiningLetterPDF(w)}>Download Joining Letter</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // DASHBOARD VIEW
    const filteredEmployees = getFilteredEmployeesByStatus();
    
    return (
      <>
        <div className="welcome-banner">
          <div className="welcome-content">
            <h2><i className="fas fa-chart-line"></i> HR Dashboard</h2>
            <p>Manage all workers & staff, track their status</p>
          </div>
          <div className="date-display">
            <i className="fas fa-calendar-alt"></i>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard title="TOTAL EMPLOYEES" value={allEmployees.length} icon="users" color="#3b82f6" onClick={() => {setActiveMenu('dashboard');setActiveStatusTab('all')}} />
          <StatCard title="PENDING PRODUCTION" value={getStatusCount('pending_production')} icon="clock" color="#f59e0b" onClick={() => setActiveStatusTab('pending_production')} />
          <StatCard title="PENDING CEO" value={getStatusCount('pending_ceo')} icon="chart-line" color="#8b5cf6" onClick={() => setActiveStatusTab('pending_ceo')} />
          <StatCard title="PENDING HR" value={getStatusCount('pending_hr')} icon="user-check" color="#3b82f6" onClick={() => setActiveMenu('pending_finalization')} />
          <StatCard title="FINALIZED" value={getStatusCount('finalized')} icon="check-circle" color="#10b981" onClick={() => setActiveMenu('finalized')} />
        </div>

        <div className="content-card">
          <div className="card-header">
            <h3><i className="fas fa-list"></i> All Employees - {activeStatusTab.toUpperCase()} View</h3>
            <div className="status-tabs">
              <button className={`status-tab-btn ${activeStatusTab === 'all' ? 'active' : ''}`} onClick={() => setActiveStatusTab('all')}>All</button>
              <button className={`status-tab-btn ${activeStatusTab === 'pending_production' ? 'active' : ''}`} onClick={() => setActiveStatusTab('pending_production')}>Production</button>
              <button className={`status-tab-btn ${activeStatusTab === 'pending_ceo' ? 'active' : ''}`} onClick={() => setActiveStatusTab('pending_ceo')}>CEO</button>
              <button className={`status-tab-btn ${activeStatusTab === 'pending_hr' ? 'active' : ''}`} onClick={() => setActiveStatusTab('pending_hr')}>HR</button>
              <button className={`status-tab-btn ${activeStatusTab === 'finalized' ? 'active' : ''}`} onClick={() => setActiveStatusTab('finalized')}>Finalized</button>
            </div>
            <div className="search-box">
              <input type="text" placeholder="Search by name or punch code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={fetchAllEmployees} className="btn-primary-sm">Refresh</button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
          ) : filteredEmployees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <i className="fas fa-inbox" style={{ fontSize: 48, color: '#cbd5e1', marginBottom: 16 }}></i>
              <p>No employees found with status: {activeStatusTab}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead><tr><th>Name</th><th>Type</th><th>Department</th><th>Designation</th><th>Punch Code</th><th>Salary</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {filteredEmployees.filter(e => e.fullName?.toLowerCase().includes(searchTerm.toLowerCase())).map(emp => {
                    const statusBadge = getStatusBadge(emp.status);
                    return (
                      <tr key={emp._id || emp.id}>
                        <td><strong>{emp.fullName}</strong>{emp.userType === 'staff' && <span style={{ marginLeft: '8px', fontSize: '11px', background: '#8b5cf6', color: 'white', padding: '2px 6px', borderRadius: '10px' }}>Staff</span>}<br/><small>ID: {emp.applicationId || emp.id}</small></td>
                        <td>{emp.userType === 'staff' ? '👔 Staff' : '👷 Worker'}</td>
                        <td>{emp.department || '-'}</td>
                        <td>{emp.designation || '-'}</td>
                        <td><code>{emp.punchCode || 'Not assigned'}</code></td>
                        <td>₹{emp.salary?.toLocaleString() || 0}</td>
                        <td><span style={{ background: statusBadge.color + '20', color: statusBadge.color, padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>{statusBadge.text}</span></td>
                        <td>
                          {emp.status === 'finalized' && <button className="btn-pdf-sm" onClick={() => generateJoiningLetterPDF(emp)} style={{ background: '#dc2626', color: 'white', padding: '4px 12px', border: 'none', borderRadius: 4 }}>Letter</button>}
                          <button 
                            className="btn-view" 
                            onClick={() => viewAadhar(emp)}
                            style={{ background: '#8b5cf6', color: 'white', padding: '4px 12px', border: 'none', borderRadius: 4, marginLeft: '5px', cursor: 'pointer' }}
                          >
                            👁️ View Aadhar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="dashboard-layout">
      <div className="side-menu">
        <div className="menu-header"><i className="fas fa-user-shield"></i><div><h3>HR Portal</h3><p>{session.userName}</p></div></div>
        {menuItems.map(item => (
          <div key={item.id} className={`menu-item ${activeMenu === item.id ? 'active' : ''}`} onClick={() => handleMenuClick(item.id)}>
            <i className={`fas fa-${item.icon}`}></i><span>{item.label}</span>
            {item.badge > 0 && <span className="menu-badge">{item.badge}</span>}
          </div>
        ))}
        <div className="menu-footer"><i className="fas fa-check-double"></i> HR Authority</div>
      </div>
      <div className="dashboard-content">{renderContent()}</div>

      {/* WORKER REGISTRATION MODAL - Using WorkerRegistration Component */}
      {showRegistrationModal && (
        <WorkerRegistration 
          onClose={() => setShowRegistrationModal(false)}
          onSuccess={() => {
            setShowRegistrationModal(false);
            fetchAllEmployees();
          }}
          session={session}
        />
      )}

      {/* STAFF REGISTRATION MODAL */}
      {showStaffRegistrationModal && (
        <div className="modal-overlay" onClick={() => setShowStaffRegistrationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header" style={{ background: '#8b5cf6', color: 'white' }}>
              <h3><i className="fas fa-user-tie"></i> Staff Registration</h3>
              <button className="modal-close" onClick={() => setShowStaffRegistrationModal(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group"><label>Full Name *</label><input type="text" name="fullName" value={staffFormData.fullName} onChange={handleStaffInputChange} required /></div>
                <div className="form-group"><label>Aadhar (12 Digit) *</label><input type="text" name="aadhar" value={staffFormData.aadhar} onChange={handleStaffInputChange} maxLength="12" required /></div>
                <div className="form-group"><label>Aadhar File</label><input type="file" onChange={(e) => handleFileChange(e, 'staff')} accept="image/*,application/pdf" /></div>
                <div className="form-group"><label>Phone (10 Digit) *</label><input type="tel" name="phone" value={staffFormData.phone} onChange={handleStaffInputChange} maxLength="10" required /></div>
                <div className="form-group"><label>Date of Birth *</label><input type="date" name="dateOfBirth" value={staffFormData.dateOfBirth} onChange={(e) => handleDobChange(e, 'staff')} required /></div>
                <div className="form-group"><label>Gender</label><select name="gender" value={staffFormData.gender} onChange={handleStaffInputChange}><option>Male</option><option>Female</option></select></div>
                <div className="form-group"><label>Department *</label><select name="department" value={staffFormData.department} onChange={handleStaffInputChange} required>{departmentList.map(dept => <option key={dept} value={dept === "-- Select --" ? "" : dept}>{dept}</option>)}</select></div>
                <div className="form-group"><label>Sub Department</label><input type="text" name="subDepartment" value={staffFormData.subDepartment} onChange={handleStaffInputChange} placeholder="Optional" /></div>
                <div className="form-group"><label>Designation *</label><select name="designation" value={staffFormData.designation} onChange={handleStaffInputChange} required>{designationList.map(des => <option key={des} value={des === "-- Select --" ? "" : des}>{des}</option>)}</select></div>
                <div className="form-group"><label>Monthly Salary (₹) *</label><input type="number" name="monthlySalary" value={staffFormData.monthlySalary} onChange={handleStaffInputChange} required /></div>
                <div className="form-group"><label>Bond Years</label><input type="number" name="bondYears" value={staffFormData.bondYears} onChange={handleStaffInputChange} /></div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <span><i className="fas fa-shield-alt"></i> Apply ESI/PF Benefit?</span>
                    <div onClick={() => setStaffFormData(prev => ({ ...prev, applyESI: !prev.applyESI }))} style={{ width: '50px', height: '26px', background: staffFormData.applyESI ? '#10b981' : '#cbd5e1', borderRadius: '13px', display: 'flex', alignItems: 'center', padding: '2px', cursor: 'pointer' }}>
                      <div style={{ width: '22px', height: '22px', background: 'white', borderRadius: '11px', transform: staffFormData.applyESI ? 'translateX(24px)' : 'translateX(0)', transition: 'transform 0.3s ease' }}></div>
                    </div>
                  </label>
                  <small>{staffFormData.applyESI ? '✅ ESI/PF benefits will be applied (3.25% deduction)' : '❌ No ESI/PF benefits'}</small>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Address</label><textarea name="address" value={staffFormData.address} onChange={handleStaffInputChange} rows="2"></textarea></div>
              </div>
              {ageAlert.show && <div style={{ fontSize: '12px', marginTop: '10px', color: ageAlert.isValid ? '#10b981' : '#dc2626' }}>{ageAlert.message}</div>}
              <div className="info-box"><i className="fas fa-info-circle"></i> Punch code will be auto-generated and Staff will go to Production → CEO → HR for finalization <strong>(Staff)</strong> tag will appear</div>
            </div>
            <div className="modal-footer"><button className="btn-secondary" onClick={() => setShowStaffRegistrationModal(false)}>Cancel</button><button className="btn-primary" onClick={handleRegisterStaff} style={{ background: '#8b5cf6' }}>Submit Staff</button></div>
          </div>
        </div>
      )}

      {/* FINALIZE MODAL */}
      {showFinalizeModal && selectedWorker && (
        <div className="modal-overlay" onClick={() => setShowFinalizeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="modal-header" style={{ background: '#1e3a8a', color: 'white' }}>
              <h3><i className="fas fa-check-circle"></i> Finalize {selectedWorker.userType === 'staff' ? 'Staff' : 'Worker'}</h3>
              <button className="modal-close" onClick={() => setShowFinalizeModal(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '12px', color: '#1e3a8a', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
                  <i className="fas fa-user-circle"></i> Worker Details
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><p style={{ margin: '0 0 5px', fontSize: '11px', color: '#64748b' }}>Full Name</p><p style={{ margin: '0', fontWeight: '600', color: '#1f2937' }}>{selectedWorker.fullName} {selectedWorker.userType === 'staff' && '(Staff)'}</p></div>
                  <div><p style={{ margin: '0 0 5px', fontSize: '11px', color: '#64748b' }}>Application ID</p><p style={{ margin: '0', fontWeight: '500', color: '#1f2937' }}>{selectedWorker.applicationId || 'N/A'}</p></div>
                  <div><p style={{ margin: '0 0 5px', fontSize: '11px', color: '#64748b' }}>Department</p><p style={{ margin: '0', fontWeight: '500', color: '#1f2937' }}>{selectedWorker.department || 'Not Assigned'}</p></div>
                  <div><p style={{ margin: '0 0 5px', fontSize: '11px', color: '#64748b' }}>Designation</p><p style={{ margin: '0', fontWeight: '500', color: '#1f2937' }}>{selectedWorker.designation || 'Worker'}</p></div>
                  <div><p style={{ margin: '0 0 5px', fontSize: '11px', color: '#64748b' }}>Daily Rate (₹)</p><p style={{ margin: '0', fontWeight: '600', color: '#10b981' }}>₹ {selectedWorker.dailyRate?.toLocaleString() || '0'}</p></div>
                  <div><p style={{ margin: '0 0 5px', fontSize: '11px', color: '#64748b' }}>Monthly Salary (₹)</p><p style={{ margin: '0', fontWeight: '600', color: '#10b981' }}>₹ {selectedWorker.salary?.toLocaleString() || '0'}</p></div>
                  
                  <div><p style={{ margin: '0 0 5px', fontSize: '11px', color: '#64748b' }}>Punch Code</p><p style={{ margin: '0', fontWeight: '700', fontSize: '16px', color: '#1e3a8a', fontFamily: 'monospace' }}>{selectedWorker.punchCode}</p></div>
                  <div><p style={{ margin: '0 0 5px', fontSize: '11px', color: '#64748b' }}>Bond Period</p><p style={{ margin: '0', fontWeight: '500', color: '#1f2937' }}>{selectedWorker.bondYears || 2} years</p></div>
                </div>
              </div>
              
              <div className="form-group">
                <label><strong>Enter Punch Code to Confirm Finalization</strong></label>
                <input 
                  type="text" 
                  className={punchError ? 'error' : ''}
                  value={enteredPunchCode} 
                  onChange={(e) => { setEnteredPunchCode(e.target.value); setPunchError(''); }} 
                  placeholder="Enter 6-digit punch code" 
                  autoFocus 
                  maxLength="6" 
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    fontSize: '16px', 
                    borderRadius: '8px', 
                    border: punchError ? '1px solid #dc2626' : '1px solid #ccc',
                    textAlign: 'center',
                    letterSpacing: '2px',
                    fontFamily: 'monospace',
                    fontWeight: '600'
                  }} 
                />
                {punchError && <div className="error-message" style={{ color: '#dc2626', marginTop: '8px', fontSize: '13px' }}>{punchError}</div>}
                <small style={{ display: 'block', marginTop: '8px', color: '#666' }}>
                  <i className="fas fa-info-circle"></i> Punch code was generated at registration time: <strong style={{ fontSize: '14px' }}>{selectedWorker.punchCode}</strong>
                </small>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '15px', borderTop: '1px solid #e2e8f0' }}>
              <button className="btn-secondary" onClick={() => { 
                setShowFinalizeModal(false); 
                setSelectedWorker(null); 
                setEnteredPunchCode(''); 
                setPunchError(''); 
              }}>Cancel</button>
              <button 
                className="btn-success" 
                onClick={handleConfirmFinalize}
                style={{ background: '#10b981', color: 'white', padding: '10px 24px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
              >
                <i className="fas fa-check"></i> Confirm Finalize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRDashboard;