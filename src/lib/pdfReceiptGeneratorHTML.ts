/**
 * HTML-based PDF Receipt Generator
 * Generates professional receipts using HTML/CSS templates
 */

import puppeteer from 'puppeteer';

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

function generateReceiptHTML(data: ReceiptData): string {
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
            padding: 0;
        }
        
        .receipt {
            width: 100%;
            max-width: 900px;
            background: white;
            padding: 30px;
            box-sizing: border-box;
        }
        
        .header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #667eea;
        }
        
        .logo {
            width: 70px;
            height: 70px;
            background: #667eea;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 24px;
        }
        
        .company-info h1 {
            color: #667eea;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .company-info p {
            color: #666;
            font-size: 13px;
            margin: 2px 0;
        }
        
        .receipt-title {
            text-align: center;
            margin: 30px 0;
        }
        
        .receipt-title h2 {
            font-size: 26px;
            color: #333;
            margin-bottom: 10px;
        }
        
        .receipt-meta {
            display: flex;
            justify-content: space-between;
            color: #666;
            font-size: 12px;
            gap: 30px;
        }
        
        .divider {
            height: 2px;
            background: #e0e0e0;
            margin: 25px 0;
        }
        
        .section {
            margin-bottom: 25px;
        }
        
        .section-title {
            font-size: 15px;
            font-weight: bold;
            color: #333;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #667eea;
        }
        
        .customer-info {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 6px;
        }
        
        .customer-info p {
            font-size: 13px;
            color: #333;
            margin-bottom: 4px;
        }
        
        .customer-info strong {
            color: #667eea;
            font-weight: bold;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
        }
        
        thead {
            background: #667eea;
            color: white;
        }
        
        thead th {
            padding: 10px;
            text-align: left;
            font-size: 12px;
            font-weight: bold;
        }
        
        tbody tr {
            border-bottom: 1px solid #e0e0e0;
        }
        
        tbody tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        tbody td {
            padding: 10px;
            font-size: 12px;
            color: #333;
        }
        
        tbody td:first-child {
            color: #666;
            font-weight: 500;
        }
        
        tbody td:last-child {
            font-weight: bold;
            color: #333;
        }
        
        .total-section {
            margin-top: 25px;
            text-align: right;
        }
        
        .total-box {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 15px 35px;
            border-radius: 6px;
        }
        
        .total-box p {
            font-size: 12px;
            margin-bottom: 5px;
            opacity: 0.9;
        }
        
        .total-box h3 {
            font-size: 22px;
            font-weight: bold;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
        }
        
        .footer p {
            color: #666;
            font-size: 12px;
            margin-bottom: 4px;
        }
        
        .footer .thank-you {
            font-size: 14px;
            color: #667eea;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .footer .company-contact {
            font-size: 11px;
            color: #999;
        }
    </style>
</head>
<body>
    <div class="receipt">
        <!-- Header -->
        <div class="header">
            <div class="logo">
            <img src="https://www.nitminer.com/logo_img/logo-rbg.png" alt="NIT Miner Logo" class="logo">
            </div>
            <div class="company-info">
                <h1>TRUSTINN</h1>
                <p>Premium Tool Platform</p>
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
                        <td>Payment Status</td>
                        <td><strong style="color: #4CAF50;">${data.paymentStatus}</strong></td>
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
            <p class="thank-you">Thank you for upgrading to Premium!</p>
            <p>This is an official payment receipt from TrustInn</p>
            <p>Your premium access is now active and ready to use</p>
            <p class="company-contact">For support: support@trustinn.com | © 2026 NITMiner Technologies Private Limited</p>
        </div>
    </div>
</body>
</html>`;
}

export async function generateHTMLPDFReceiptBuffer(data: ReceiptData): Promise<Buffer> {
  let browser;
  try {
    console.log('🎨 Generating HTML receipt...');
    const htmlContent = generateReceiptHTML(data);
    console.log('✅ HTML generated');

    // Launch headless browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    
    // Set content
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    console.log('✅ Content loaded in browser');

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px',
      },
    });

    console.log(`✅ PDF buffer created: ${pdfBuffer.length} bytes`);
    
    await browser.close();
    return Buffer.from(pdfBuffer);
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    console.error('❌ Error generating PDF:', error);
    throw error;
  }
}
