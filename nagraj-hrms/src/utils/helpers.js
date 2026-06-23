import { jsPDF } from 'jspdf';

// Simple toast function without any dependencies
export const showToast = (message) => {
  try {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) existingToast.remove();
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.innerHTML = `<i class="fas fa-bell"></i> ${message}`;
    toast.style.cssText = 'position:fixed;bottom:30px;right:30px;background:#1e4a6e;color:white;padding:12px 20px;border-radius:10px;z-index:1100;animation:slideInRight 0.3s ease;box-shadow:0 4px 12px rgba(0,0,0,0.2);';
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (toast && toast.remove) toast.remove();
    }, 3000);
  } catch (error) {
    console.error('Toast error:', error);
    alert(message); // Fallback to alert
  }
};

export const generateJoiningLetterPDF = (worker) => {
  if (!worker || worker.status !== 'finalized') {
    showToast('Worker finalized successfully 😊!');
    return false;
  }
  
  try {
    const doc = new jsPDF();
    let policy = {};
    
    try {
      const storedPolicy = localStorage.getItem('nagraj_policy');
      policy = storedPolicy ? JSON.parse(storedPolicy) : {};
    } catch (e) {
      console.error('Error parsing policy:', e);
      policy = {};
    }
    
    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('NAGRAJ ENGINEERING WORKS', 105, 25, { align: 'center' });
    doc.setFontSize(9);
    doc.text('MIDC Area, Hingna Road, Nagpur - 440024', 105, 33, { align: 'center' });
    doc.setDrawColor(244, 162, 97);
    doc.line(20, 40, 190, 40);
    doc.setFontSize(14);
    doc.text('JOINING ADVICE FORM', 105, 52, { align: 'center' });
    
    // Employee details
    doc.setFontSize(10);
    let y = 70;
    doc.text(`Employee ID: ${worker.applicationId || 'N/A'}`, 20, y);
    doc.text(`Name: ${worker.fullName || 'N/A'}`, 20, y + 8);
    doc.text(`Department: ${worker.department || 'N/A'}`, 20, y + 16);
    doc.text(`Designation: ${worker.designation || 'N/A'}`, 20, y + 24);
    doc.text(`Punch Code: ${worker.punchCode || 'N/A'}`, 20, y + 32);
    doc.text(`Joining Date: ${worker.joiningDate || new Date().toLocaleDateString()}`, 20, y + 40);
    doc.text(`Monthly Salary: ₹${worker.salary?.toLocaleString() || 25000}`, 20, y + 48);
    
    // Signatures
    doc.line(20, y + 65, 190, y + 65);
    doc.text('Employee Signature', 40, y + 78);
    doc.text('Authorized Signatory', 140, y + 78);
    
    // Save PDF
    doc.save(`Joining_Letter_${worker.applicationId}.pdf`);
    showToast(`Joining letter generated for ${worker.fullName}`);
    return true;
  } catch (error) {
    console.error('PDF generation error:', error);
    showToast('Error generating PDF');
    return false;
  }
};