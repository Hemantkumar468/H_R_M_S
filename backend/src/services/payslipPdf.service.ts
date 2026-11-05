import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { IPayrollItemDocument } from '../models/PayrollItem';
import { IEmployeeDocument } from '../models/Employee';
import { env } from '../config/env.config';

const getMonthName = (month: number): string => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return months[month - 1] || `${month}`;
};

export const generatePayslipPdf = async (
  payroll: IPayrollItemDocument,
  employee: IEmployeeDocument,
  departmentName = 'General',
  designationName = 'Employee',
): Promise<string> => {
  const payslipsDir = path.resolve(process.cwd(), env.UPLOAD_DIR, 'payslips');
  if (!fs.existsSync(payslipsDir)) {
    fs.mkdirSync(payslipsDir, { recursive: true });
  }

  const fileName = `payslip-${employee.employeeId}-${payroll.month}-${payroll.year}.pdf`;
  const filePath = path.join(payslipsDir, fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    // 1. Header
    doc
      .fontSize(20)
      .fillColor('#1e40af')
      .text('HRMS ENTERPRISE INC.', { align: 'center', bold: true } as any);
    doc
      .fontSize(10)
      .fillColor('#4b5563')
      .text('123 Enterprise Avenue, Tech Park, Bangalore, Karnataka - 560100', { align: 'center' });
    doc.moveDown(0.5);

    doc
      .fontSize(14)
      .fillColor('#111827')
      .text(`PAYSLIP FOR ${getMonthName(payroll.month).toUpperCase()} ${payroll.year}`, {
        align: 'center',
        underline: true,
      });
    doc.moveDown(1);

    // Divider
    doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.8);

    // 2. Employee Details
    const startY = doc.y;
    doc.fontSize(9).fillColor('#374151');

    // Left Column
    doc.text(`Employee ID: ${employee.employeeId}`, 45, startY);
    doc.text(`Employee Name: ${employee.firstName} ${employee.lastName}`, 45, startY + 15);
    doc.text(`Department: ${departmentName}`, 45, startY + 30);
    doc.text(`Designation: ${designationName}`, 45, startY + 45);
    doc.text(`Joining Date: ${employee.joiningDate}`, 45, startY + 60);

    // Right Column
    doc.text(`Bank Name: ${employee.bankDetails?.bankName || 'N/A'}`, 320, startY);
    doc.text(`Account No: ${employee.bankDetails?.accountNumber || 'N/A'}`, 320, startY + 15);
    doc.text(`IFSC Code: ${employee.bankDetails?.ifscCode || 'N/A'}`, 320, startY + 30);
    doc.text(`PAN: ${employee.bankDetails?.panNumber || 'N/A'}`, 320, startY + 45);
    doc.text(`UAN: ${employee.bankDetails?.uanNumber || 'N/A'}`, 320, startY + 60);

    doc.moveDown(5);

    // Attendance Summary
    const attY = doc.y;
    doc.rect(40, attY, 515, 25).fill('#f3f4f6');
    doc.fillColor('#1f2937').fontSize(9);
    doc.text(
      `Total Days: ${payroll.totalWorkingDays}    |    Present Days: ${payroll.presentDays}    |    Paid Leaves: ${payroll.paidLeaves}    |    Payable Days: ${payroll.payableDays}`,
      50,
      attY + 7,
    );

    doc.moveDown(2);

    // 3. Earnings & Deductions Table
    const tableTop = doc.y + 10;
    // Table Headers
    doc.rect(40, tableTop, 257, 20).fill('#1e40af');
    doc.rect(298, tableTop, 257, 20).fill('#1e40af');

    doc.fillColor('#ffffff').fontSize(10);
    doc.text('EARNINGS', 50, tableTop + 5);
    doc.text('AMOUNT (INR)', 210, tableTop + 5);
    doc.text('DEDUCTIONS', 310, tableTop + 5);
    doc.text('AMOUNT (INR)', 470, tableTop + 5);

    let rowY = tableTop + 25;
    doc.fillColor('#111827').fontSize(9);

    const earningsItems = [
      { label: 'Basic Salary', val: payroll.earnings.basic },
      { label: 'House Rent Allowance (HRA)', val: payroll.earnings.hra },
      { label: 'Conveyance Allowance', val: payroll.earnings.conveyance },
      { label: 'Special Allowance', val: payroll.earnings.specialAllowance },
      { label: 'Medical Allowance', val: payroll.earnings.medicalAllowance },
    ];

    const deductionsItems = [
      { label: 'Provident Fund (PF)', val: payroll.deductions.pfEmployee },
      { label: 'Employee State Insurance (ESI)', val: payroll.deductions.esiEmployee },
      { label: 'Professional Tax (PT)', val: payroll.deductions.professionalTax },
      { label: 'TDS (Income Tax)', val: payroll.deductions.tds },
    ];

    const maxRows = Math.max(earningsItems.length, deductionsItems.length);

    for (let i = 0; i < maxRows; i++) {
      const earn = earningsItems[i];
      const ded = deductionsItems[i];

      if (earn) {
        doc.text(earn.label, 50, rowY);
        doc.text(earn.val.toFixed(2), 210, rowY, { width: 75, align: 'right' });
      }

      if (ded) {
        doc.text(ded.label, 310, rowY);
        doc.text(ded.val.toFixed(2), 470, rowY, { width: 75, align: 'right' });
      }

      rowY += 18;
    }

    // Totals Row
    doc.rect(40, rowY, 257, 22).fill('#f9fafb');
    doc.rect(298, rowY, 257, 22).fill('#f9fafb');

    doc.fillColor('#111827').fontSize(9);
    doc.text('Total Gross Earnings', 50, rowY + 6);
    doc.text(payroll.earnings.grossEarnings.toFixed(2), 210, rowY + 6, {
      width: 75,
      align: 'right',
    });

    doc.text('Total Deductions', 310, rowY + 6);
    doc.text(payroll.deductions.totalDeductions.toFixed(2), 470, rowY + 6, {
      width: 75,
      align: 'right',
    });

    rowY += 35;

    // 4. Net Salary Highlight
    doc.rect(40, rowY, 515, 35).fill('#ecfdf5');
    doc.strokeColor('#10b981').lineWidth(1).rect(40, rowY, 515, 35).stroke();

    doc.fillColor('#065f46').fontSize(12);
    doc.text(`NET TAKE HOME PAY: INR ${payroll.netSalary.toFixed(2)}`, 50, rowY + 11);

    // 5. Footer & Disclaimer
    const footerY = 750;
    doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(40, footerY).lineTo(555, footerY).stroke();
    doc
      .fontSize(8)
      .fillColor('#6b7280')
      .text(
        'Note: This document is electronically generated from the HRMS Enterprise portal and does not require a signature.',
        40,
        footerY + 10,
        { align: 'center', width: 515 },
      );

    doc.end();

    writeStream.on('finish', () => {
      resolve(`/uploads/payslips/${fileName}`);
    });

    writeStream.on('error', (err) => {
      reject(err);
    });
  });
};
