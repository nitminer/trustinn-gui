/**
 * PDF Receipt Generator using jsPDF (Next.js compatible)
 * Generates receipt PDFs without fontkit dependency issues
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface ReceiptData {
  receiptNumber: string;
  receiptDate: string;
  customerName: string;
  customerEmail: string;
  customerId: string;
  serviceDescription: string;
  amountInRupees: number;
  paymentMethod: string;
  transactionId: string;
  serviceStartDate: string;
  serviceEndDate: string;
  paymentStatus: string;
  duration: number;
}

export async function generatePDFReceiptBuffer(data: ReceiptData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = 20;

      // Add header background
      doc.setFillColor(79, 70, 229); // Indigo color
      doc.rect(0, 0, pageWidth, 40, 'F');

      // Add logo placeholder (text-based since we can't easily embed images with jsPDF)
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('TrustInn', margin, 20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Premium Receipt', margin, 28);

      // Add company info on right side
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text('NITMiner Technologies', pageWidth - margin - 50, 20);
      doc.text('Private Limited', pageWidth - margin - 50, 26);
      doc.text('www.trustinn.com', pageWidth - margin - 50, 32);

      // Reset position after header
      yPosition = 50;
      doc.setTextColor(0, 0, 0);

      // Receipt Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT RECEIPT', margin, yPosition);
      yPosition += 10;

      // Divider line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;

      // Receipt Number and Date in two columns
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Receipt #: ${data.receiptNumber}`, margin, yPosition);
      doc.text(`Date: ${data.receiptDate}`, pageWidth / 2, yPosition);
      yPosition += 8;

      // Customer Details Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('CUSTOMER DETAILS', margin, yPosition);
      yPosition += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Name: ${data.customerName}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Email: ${data.customerEmail}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Customer ID: ${data.customerId}`, margin, yPosition);
      yPosition += 8;

      // Service Details Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('SERVICE DETAILS', margin, yPosition);
      yPosition += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Service: ${data.serviceDescription}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Start Date: ${data.serviceStartDate}`, margin, yPosition);
      yPosition += 5;
      doc.text(`End Date: ${data.serviceEndDate}`, margin, yPosition);
      yPosition += 8;

      // Amount Section (Highlighted)
      doc.setFillColor(240, 249, 255); // Light blue background
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 20, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(79, 70, 229); // Indigo text
      doc.text('AMOUNT', margin + 5, yPosition + 7);
      doc.setFontSize(16);
      doc.text(`₹${(data.amountInRupees / 100).toLocaleString('en-IN')}`, margin + 5, yPosition + 16);

      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`INR (Indian Rupees)`, pageWidth - margin - 40, yPosition + 16);

      yPosition += 25;
      doc.setTextColor(0, 0, 0);

      // Payment Details Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('PAYMENT INFORMATION', margin, yPosition);
      yPosition += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Payment Method: ${data.paymentMethod}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Transaction ID: ${data.transactionId}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Payment Status: ${data.paymentStatus}`, margin, yPosition);
      yPosition += 8;

      // Terms and Conditions
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('IMPORTANT INFORMATION', margin, yPosition);
      yPosition += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const termsText = [
        '✓ This receipt is a proof of payment and subscription activation.',
        '✓ Your premium access is valid from the start date to end date mentioned above.',
        '✓ Subscription auto-renewal policies apply. Check account settings for details.',
        '✓ For any issues or queries, contact support@trustinn.com',
        '✓ Keep this receipt for your records.'
      ];

      termsText.forEach((term) => {
        doc.text(term, margin + 2, yPosition);
        yPosition += 4;
      });

      // Footer
      yPosition = pageHeight - 15;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);

      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(
        `© 2026 NITMiner Technologies Private Limited. All rights reserved.`,
        margin,
        yPosition + 5
      );
      doc.text(
        `Generated on ${new Date().toLocaleString('en-IN')}`,
        pageWidth - margin - 50,
        yPosition + 5
      );

      // Convert PDF to buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      resolve(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(error);
    }
  });
}
