import React, { useState } from 'react';
import './WorkerRegistration.css';

const API_BASE_URL = 'https://backend-nagraj.onrender.com/api';

const WorkerRegistration = ({ onClose, onSuccess, session }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    gender: '',
    designation: '',
    dateOfBirth: '',
    mobile: '',
    department: '',
    aadharNumber: '',
    address: '',
    aadharFile: null
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [ageAlert, setAgeAlert] = useState({ show: false, message: '', isValid: false });
  const [fileName, setFileName] = useState('');

  const departmentList = [
    "Select Department",
    "Accounts", "Data Entry Operator", "Development", "Drilling & Tapping & Eicher",
    "Executive Assistant", "Firewall", "Floore Pannel", "Grinding Section", "HR",
    "Inspection & Packing-K2", "Inspection & Packing-Regular",
    "Laser Cut Section", "Logistics Driver & Helper", "Maintenance", "Maintenance Engineer",
    "Management Information System (MIS)", "Production", "Plant Head", "Quality Head", 
    "Tool Room", "Welding Section", "Priming Section", "Powder Coating", "Phospheting", 
    "Press Section", "Shearing"
  ];

  const designationList = [
    "Select Designation", "Worker", "Helper", "Operator", "Supervisor", "Welder", "Painter",
    "Packing Helper", "Fitter", "Electrician", "Mechanic", "Driver", "Office Staff",
    "Manager", "Engineer", "Sr. Engineer", "Team Lead"
  ];

  const showToast = (msg, isError = false) => {
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:20px;right:20px;background:${isError ? '#dc2626' : '#10b981'};color:white;padding:12px 20px;border-radius:8px;z-index:100000;box-shadow:0 4px 12px rgba(0,0,0,0.15);`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // Check if Aadhar already exists (in MongoDB)
  const checkDuplicateAadhar = async (aadharNumber) => {
    if (!aadharNumber) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/workers`);
      const workers = await response.json();
      return workers.some(w => w.aadhar === aadharNumber);
    } catch (err) {
      console.error('Duplicate check error:', err);
      // Fallback to localStorage
      const stored = localStorage.getItem('Nagraj_workers');
      if (stored) {
        const workers = JSON.parse(stored);
        return workers.some(w => w.aadhar === aadharNumber);
      }
      return false;
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
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
    } catch (err) {
      console.log('MongoDB save failed:', err);
      return false;
    }
  };

  const generatePunchCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

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

  const handleDobChange = (e) => {
    const dob = e.target.value;
    setFormData(prev => ({ ...prev, dateOfBirth: dob }));
    if (dob) {
      const age = calculateAge(dob);
      if (age !== null && age < 18) {
        setAgeAlert({ show: true, message: `⚠️ Age is ${age} years. Must be at least 18 years old!`, isValid: false });
        setErrors(prev => ({ ...prev, dateOfBirth: 'Worker must be at least 18 years old' }));
      } else if (age !== null) {
        setAgeAlert({ show: true, message: `✓ Age is ${age} years. Eligible for employment.`, isValid: true });
        setErrors(prev => ({ ...prev, dateOfBirth: '' }));
      }
    } else {
      setAgeAlert({ show: false, message: '', isValid: false });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        showToast('❌ Please upload PDF, JPG, JPEG, or PNG file only', true);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast('❌ File size must be less than 5MB', true);
        return;
      }
      setFormData(prev => ({ ...prev, aadharFile: file }));
      setFileName(file.name);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.gender) newErrors.gender = 'Please select gender';
    if (!formData.designation || formData.designation === 'Select Designation') newErrors.designation = 'Please select designation';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    else if (calculateAge(formData.dateOfBirth) < 18) newErrors.dateOfBirth = 'Worker must be at least 18 years old';
    if (!formData.mobile) newErrors.mobile = 'Mobile number is required';
    else if (!/^\d{10}$/.test(formData.mobile)) newErrors.mobile = 'Mobile number must be 10 digits';
    if (!formData.department || formData.department === 'Select Department') newErrors.department = 'Please select department';
    if (formData.aadharNumber && !/^\d{12}$/.test(formData.aadharNumber)) newErrors.aadharNumber = 'Aadhar number must be 12 digits';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('❌ Please fill all required fields correctly', true);
      return;
    }
    
    const age = calculateAge(formData.dateOfBirth);
    if (age < 18) {
      showToast('❌ Worker must be at least 18 years old!', true);
      return;
    }

    // --- DUPLICATE AADHAR CHECK ---
    if (formData.aadharNumber) {
      const isDuplicate = await checkDuplicateAadhar(formData.aadharNumber);
      if (isDuplicate) {
        showToast(`❌ Aadhar number ${formData.aadharNumber} is already registered! Duplicate entries not allowed.`, true);
        setErrors(prev => ({ ...prev, aadharNumber: 'This Aadhar number is already registered' }));
        return;
      }
    }
    
    setLoading(true);
    
    try {
      let aadharBase64 = '';
      let aadharFileName = '';
      if (formData.aadharFile) {
        aadharBase64 = await fileToBase64(formData.aadharFile);
        aadharFileName = formData.aadharFile.name;
      }
      
      const dailyRate = 500;
      const monthlySalary = dailyRate * 26;
      const appId = `LXC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const punchCode = generatePunchCode();
      
      const workerData = {
        fullName: formData.fullName,
        email: formData.email,
        gender: formData.gender,
        designation: formData.designation,
        dateOfBirth: formData.dateOfBirth,
        mobile: formData.mobile,
        phone: formData.mobile,
        department: formData.department,
        aadhar: formData.aadharNumber,
        aadharBase64: aadharBase64,
        aadharFileName: aadharFileName,
        address: formData.address,
        userType: 'worker',
        dailyRate: dailyRate,
        salary: monthlySalary,
        status: 'pending_production',
        stage: 'Pending Production Review',
        punchCode: punchCode,
        password: formData.mobile,
        registeredBy: session?.userName || 'HR',
        registeredByRole: session?.userRole || 'hr',
        registeredDate: new Date().toISOString().slice(0, 10),
        joiningDate: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
        company: 'NAGRAJ INDUSTRIES'
      };
      
      const saved = await saveToMongoDB(workerData);
      
      if (saved) {
        showToast(`✅ Worker ${formData.fullName} registered successfully! Punch Code: ${punchCode}`);
        if (onSuccess) onSuccess();
        setTimeout(() => onClose(), 1500);
      } else {
        showToast('❌ Registration failed. Please try again.', true);
      }
    } catch (err) {
      console.error('Registration error:', err);
      showToast('❌ Error registering worker', true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="worker-registration-overlay" onClick={onClose}>
      <div className="worker-registration-modal" onClick={(e) => e.stopPropagation()}>
        <div className="registration-header">
          <h2><i className="fas fa-user-plus"></i> Worker Registration</h2>
          <button className="close-btn" onClick={onClose}><i className="fas fa-times"></i></button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="registration-body">
            <div className="form-row">
              <div className="form-group full-width">
                <label>FULL NAME <span className="required">*</span></label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Enter full name" className={errors.fullName ? 'error' : ''} />
                {errors.fullName && <span className="error-text">{errors.fullName}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>EMAIL <span className="required">*</span></label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Enter email" className={errors.email ? 'error' : ''} />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label>GENDER <span className="required">*</span></label>
                <select name="gender" value={formData.gender} onChange={handleInputChange} className={errors.gender ? 'error' : ''}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <span className="error-text">{errors.gender}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>DESIGNATION <span className="required">*</span></label>
                <select name="designation" value={formData.designation} onChange={handleInputChange} className={errors.designation ? 'error' : ''}>
                  {designationList.map(des => <option key={des} value={des}>{des}</option>)}
                </select>
                {errors.designation && <span className="error-text">{errors.designation}</span>}
              </div>
              <div className="form-group">
                <label>AADHAR NUMBER</label>
                <input type="text" name="aadharNumber" value={formData.aadharNumber} onChange={handleInputChange} placeholder="12 digit Aadhar" maxLength="12" className={errors.aadharNumber ? 'error' : ''} />
                {errors.aadharNumber && <span className="error-text">{errors.aadharNumber}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>UPLOAD AADHAR (OPTIONAL)</label>
                <div className="file-upload-area">
                  <input type="file" id="aadharFile" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} />
                  <label htmlFor="aadharFile" className="file-upload-label">
                    <i className="fas fa-cloud-upload-alt"></i>
                    <span>{fileName || 'Click to upload Aadhar card'}</span>
                  </label>
                  <small className="field-hint">Supported: PDF, JPG, JPEG, PNG (Max 5MB)</small>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>DATE OF BIRTH <span className="required">*</span></label>
                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleDobChange} className={errors.dateOfBirth ? 'error' : ''} />
                {ageAlert.show && <div className={`age-alert ${ageAlert.isValid ? 'valid' : 'invalid'}`}>{ageAlert.message}</div>}
                {errors.dateOfBirth && <span className="error-text">{errors.dateOfBirth}</span>}
              </div>
              <div className="form-group">
                <label>MOBILE (10 digit) <span className="required">*</span></label>
                <input type="tel" name="mobile" value={formData.mobile} onChange={handleInputChange} placeholder="9876543210" maxLength="10" className={errors.mobile ? 'error' : ''} />
                <small className="field-hint">This will be your login password</small>
                {errors.mobile && <span className="error-text">{errors.mobile}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>DEPARTMENT <span className="required">*</span></label>
                <select name="department" value={formData.department} onChange={handleInputChange} className={errors.department ? 'error' : ''}>
                  {departmentList.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
                {errors.department && <span className="error-text">{errors.department}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label>ADDRESS</label>
                <textarea name="address" value={formData.address} onChange={handleInputChange} rows="3" placeholder="Full address"></textarea>
              </div>
            </div>
          </div>

          <div className="registration-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? <><i className="fas fa-spinner fa-spin"></i> Submitting...</> : <><i className="fas fa-paper-plane"></i> Submit Application</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkerRegistration;