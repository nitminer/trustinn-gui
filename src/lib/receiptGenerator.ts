import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

interface ReceiptData {
  receiptNumber: string;
  receiptDate: string;
  customerName: string;
  customerEmail: string;
  customerId: string;
  serviceDescription: string;
  amountInRupees: number;
  amountInPaise: number;
  paymentMethod: string;
  transactionId: string;
  serviceStartDate: string;
  serviceEndDate: string;
  paymentStatus: string;
  duration: number; // in years
}

/**
 * Generate HTML receipt from template
 */
export function generateReceiptHTML(data: ReceiptData): string {
  const formattedAmount = (data.amountInRupees / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Receipt - TrustInn</title>
    <style>
        @page {
            size: A4;
            margin: 0;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        
        .receipt {
            width: 210mm;
            min-height: 297mm;
            background: white;
            margin: 0 auto;
            padding: 20mm;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        .header {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #667eea;
        }
        
        .logo {
            width: 80px;
            height: 80px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .logo img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }
        
        .company-info h1 {
            color: #667eea;
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .company-info p {
            color: #666;
            font-size: 14px;
        }
        
        .receipt-title {
            text-align: center;
            margin: 30px 0;
        }
        
        .receipt-title h2 {
            font-size: 28px;
            color: #333;
            margin-bottom: 10px;
        }
        
        .receipt-meta {
            display: flex;
            justify-content: space-between;
            color: #666;
            font-size: 12px;
        }
        
        .divider {
            height: 2px;
            background: #e0e0e0;
            margin: 25px 0;
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #667eea;
        }
        
        .customer-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
        }
        
        .customer-info p {
            font-size: 14px;
            color: #333;
            margin-bottom: 5px;
        }
        
        .customer-info strong {
            color: #667eea;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        
        thead {
            background: #667eea;
            color: white;
        }
        
        thead th {
            padding: 12px;
            text-align: left;
            font-size: 14px;
            font-weight: bold;
        }
        
        tbody tr {
            border-bottom: 1px solid #e0e0e0;
        }
        
        tbody tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        tbody td {
            padding: 12px;
            font-size: 14px;
            color: #333;
        }
        
        tbody td:first-child {
            color: #666;
        }
        
        tbody td:last-child {
            font-weight: bold;
            color: #333;
        }
        
        .total-section {
            margin-top: 30px;
            text-align: right;
        }
        
        .total-box {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 20px 40px;
            border-radius: 8px;
        }
        
        .total-box p {
            font-size: 14px;
            margin-bottom: 5px;
        }
        
        .total-box h3 {
            font-size: 24px;
            font-weight: bold;
        }
        
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
        }
        
        .footer p {
            color: #666;
            font-size: 14px;
            margin-bottom: 5px;
        }
        
        .footer .thank-you {
            font-size: 16px;
            color: #667eea;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .receipt {
                box-shadow: none;
                margin: 0;
            }
        }
    </style>
</head>
<body>
    <div class="receipt">
        <!-- Header -->
        <div class="header">
            <div class="logo">
                <img src="https://nitminer.com/logo_img/logo-rbg.png" alt="TrustInn Logo" />
            </div>
            <div class="company-info">
                <h1>TrustInn</h1>
                <p>Security Tools & Testing Platform</p>
                <p>www.trustinn.com | support@trustinn.com</p>
            </div>
        </div>
        
        <!-- Receipt Title -->
        <div class="receipt-title">
            <h2>PAYMENT RECEIPT</h2>
            <div class="receipt-meta">
                <span>Receipt #: ${data.receiptNumber}</span>
                <span>Date: ${data.receiptDate}</span>
            </div>
        </div>
        
        <div class="divider"></div>
        
        <!-- Customer Information -->
        <div class="section">
            <div class="section-title">Customer Information</div>
            <div class="customer-info">
                <p><strong>Name:</strong> ${data.customerName}</p>
                <p><strong>Email:</strong> ${data.customerEmail}</p>
                <p><strong>Customer ID:</strong> ${data.customerId}</p>
            </div>
        </div>
        
        <!-- Payment Details -->
        <div class="section">
            <div class="section-title">Payment Details</div>
            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Service Description</td>
                        <td>${data.serviceDescription}</td>
                    </tr>
                    <tr>
                        <td>Payment Amount</td>
                        <td>₹${formattedAmount}</td>
                    </tr>
                    <tr>
                        <td>Payment Method</td>
                        <td>${data.paymentMethod}</td>
                    </tr>
                    <tr>
                        <td>Transaction ID</td>
                        <td>${data.transactionId}</td>
                    </tr>
                    <tr>
                        <td>Service Start Date</td>
                        <td>${data.serviceStartDate}</td>
                    </tr>
                    <tr>
                        <td>Service End Date</td>
                        <td>${data.serviceEndDate}</td>
                    </tr>
                    <tr>
                        <td>Duration</td>
                        <td>${data.duration} Year${data.duration > 1 ? 's' : ''} (${data.duration * 6} Months)</td>
                    </tr>
                    <tr>
                        <td>Payment Status</td>
                        <td><strong style="color: #22c55e;">✓ ${data.paymentStatus}</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <!-- Total -->
        <div class="total-section">
            <div class="total-box">
                <p>Total Amount Paid</p>
                <h3>₹${formattedAmount}</h3>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p class="thank-you">Thank you for your business!</p>
            <p>This is an official payment receipt from TrustInn</p>
            <p>For any queries, please contact: support@trustinn.com</p>
            <p>© 2026 NITMiner Technologies Private Limited. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate PDF from HTML using a buffer-based approach
 * This uses html2pdf npm package or similar
 */
export async function generatePDFBuffer(html: string): Promise<Buffer> {
  try {
    // For server-side PDF generation without external dependencies,
    // we'll use a simple approach with html2pdf or puppeteer via command line
    // Since we want to minimize dependencies, let's use a fallback approach
    
    const tempHtmlPath = path.join('/tmp', `receipt-${Date.now()}.html`);
    const tempPdfPath = path.join('/tmp', `receipt-${Date.now()}.pdf`);
    
    // Write HTML to temp file
    fs.writeFileSync(tempHtmlPath, html);
    
    try {
      // Try using wkhtmltopdf if available
      execSync(`wkhtmltopdf "${tempHtmlPath}" "${tempPdfPath}"`, { 
        stdio: 'pipe',
        timeout: 30000 
      });
      
      if (fs.existsSync(tempPdfPath)) {
        const pdfBuffer = fs.readFileSync(tempPdfPath);
        fs.unlinkSync(tempHtmlPath);
        fs.unlinkSync(tempPdfPath);
        return pdfBuffer;
      } else {
        // PDF file was not created
        if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
        return Buffer.from('PDF generation failed. Please try again.');
      }
    } catch (error) {
      // Fallback: If wkhtmltopdf not available, try using Node's built-in or return HTML as alternative
      console.warn('wkhtmltopdf not available, attempting alternative PDF generation');
      
      // Clean up temp files
      if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
      if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
      
      // Return a buffer containing a simple text representation as fallback
      return Buffer.from('PDF generation requires additional setup. Contact support.');
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    return Buffer.from('Error generating PDF. Please contact support.');
  }
}

/**
 * Alternative: Use a simple approach with html2pdf client library
 * This returns HTML that can be converted client-side
 */
export function getReceiptHTML(data: ReceiptData): string {
  return generateReceiptHTML(data);
}
