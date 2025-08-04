import jsPDF from 'jspdf';
import { Payslip } from '@/lib/payroll-service';

interface CompanyInfo {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export const generatePayslipPDF = (payslip: Payslip, companyInfo?: CompanyInfo): jsPDF => {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYSLIP', 105, 20, { align: 'center' });
  
  // Company Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  // Use company info if provided, otherwise use workspace name or default
  const companyName = companyInfo?.name || payslip.workspaceName || 'Company Name';
  const companyAddress = companyInfo?.address || 'Business Address';
  const companyLocation = companyInfo?.city && companyInfo?.state 
    ? `${companyInfo.city}, ${companyInfo.state} ${companyInfo.zipCode || ''}`.trim()
    : 'City, State';
  
  doc.text(companyName, 20, 35);
  doc.text(companyAddress, 20, 42);
  doc.text(companyLocation, 20, 49);
  
  // Add additional company info if available
  let yOffset = 56;
  if (companyInfo?.phone) {
    doc.text(`Phone: ${companyInfo.phone}`, 20, yOffset);
    yOffset += 7;
  }
  if (companyInfo?.email) {
    doc.text(`Email: ${companyInfo.email}`, 20, yOffset);
    yOffset += 7;
  }
  if (companyInfo?.website) {
    doc.text(`Website: ${companyInfo.website}`, 20, yOffset);
    yOffset += 7;
  }
  
  // Period Information
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Pay Period Information', 20, yOffset + 14);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Period: ${payslip.period}`, 20, yOffset + 24);
  doc.text(`Start Date: ${payslip.startDate}`, 20, yOffset + 31);
  doc.text(`End Date: ${payslip.endDate}`, 20, yOffset + 38);
  doc.text(`Generated: ${payslip.generatedDate}`, 20, yOffset + 45);
  
  // Employee Information
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Employee Information', 20, yOffset + 64);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${payslip.employeeName}`, 20, yOffset + 74);
  doc.text(`Employee ID: ${payslip.employeeId}`, 20, yOffset + 81);
  doc.text(`Email: ${payslip.employeeEmail}`, 20, yOffset + 88);
  
  // Earnings Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Earnings', 20, yOffset + 107);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  let yPosition = yOffset + 117;
  doc.text('Base Salary:', 20, yPosition);
  doc.text(`${payslip.currency} ${payslip.baseSalary.toFixed(2)}`, 150, yPosition, { align: 'right' });
  yPosition += 7;
  
  doc.text('Housing Allowance:', 20, yPosition);
  doc.text(`${payslip.currency} ${payslip.allowances.housing.toFixed(2)}`, 150, yPosition, { align: 'right' });
  yPosition += 7;
  
  doc.text('Transport Allowance:', 20, yPosition);
  doc.text(`${payslip.currency} ${payslip.allowances.transport.toFixed(2)}`, 150, yPosition, { align: 'right' });
  yPosition += 7;
  
  doc.text('Medical Allowance:', 20, yPosition);
  doc.text(`${payslip.currency} ${payslip.allowances.medical.toFixed(2)}`, 150, yPosition, { align: 'right' });
  yPosition += 7;
  
  doc.text('Meal Allowance:', 20, yPosition);
  doc.text(`${payslip.currency} ${payslip.allowances.meal.toFixed(2)}`, 150, yPosition, { align: 'right' });
  yPosition += 7;
  
  doc.text('Other Allowance:', 20, yPosition);
  doc.text(`${payslip.currency} ${payslip.allowances.other.toFixed(2)}`, 150, yPosition, { align: 'right' });
  yPosition += 7;
  
  doc.text('Overtime:', 20, yPosition);
  doc.text(`${payslip.currency} ${payslip.overtime.toFixed(2)}`, 150, yPosition, { align: 'right' });
  yPosition += 7;
  
  doc.text('Bonus:', 20, yPosition);
  doc.text(`${payslip.currency} ${payslip.bonus.toFixed(2)}`, 150, yPosition, { align: 'right' });
  yPosition += 10;
  
  // Gross Pay
  doc.setFont('helvetica', 'bold');
  doc.text('Gross Pay:', 20, yPosition);
  doc.text(`${payslip.currency} ${payslip.grossPay.toFixed(2)}`, 150, yPosition, { align: 'right' });
  yPosition += 15;
  
  // Deductions Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Deductions', 20, yPosition);
  yPosition += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Tax:', 20, yPosition);
  doc.text(`${payslip.currency} ${payslip.deductions.tax.toFixed(2)}`, 150, yPosition, { align: 'right' });
  yPosition += 7;
  
  doc.text('Social Security:', 20, yPosition);
  doc.text(`${payslip.currency} ${payslip.deductions.socialSecurity.toFixed(2)}`, 150, yPosition, { align: 'right' });
  yPosition += 7;
  
  doc.text('Pension:', 20, yPosition);
  doc.text(`${payslip.currency} ${payslip.deductions.pension.toFixed(2)}`, 150, yPosition, { align: 'right' });
  yPosition += 7;
  
  doc.text('Insurance:', 20, yPosition);
  doc.text(`${payslip.currency} ${payslip.deductions.insurance.toFixed(2)}`, 150, yPosition, { align: 'right' });
  yPosition += 7;
  
  doc.text('Other Deductions:', 20, yPosition);
  doc.text(`${payslip.currency} ${payslip.deductions.other.toFixed(2)}`, 150, yPosition, { align: 'right' });
  yPosition += 10;
  
  // Total Deductions
  const totalDeductions = Object.values(payslip.deductions).reduce((sum, value) => sum + value, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Deductions:', 20, yPosition);
  doc.text(`${payslip.currency} ${totalDeductions.toFixed(2)}`, 150, yPosition, { align: 'right' });
  yPosition += 15;
  
  // Net Pay
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('NET PAY:', 20, yPosition);
  doc.text(`${payslip.currency} ${payslip.netPay.toFixed(2)}`, 150, yPosition, { align: 'right' });
  
  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('This is a computer generated payslip. No signature required.', 105, 280, { align: 'center' });
  
  return doc;
};

export const downloadPayslipPDF = (payslip: Payslip, companyInfo?: CompanyInfo, filename?: string) => {
  const doc = generatePayslipPDF(payslip, companyInfo);
  const defaultFilename = `payslip-${payslip.employeeName}-${payslip.period}.pdf`;
  doc.save(filename || defaultFilename);
}; 