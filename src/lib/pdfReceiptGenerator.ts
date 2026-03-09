import PDFDocument from 'pdfkit';
import https from 'https';

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

/**
 * Download image from URL and return as buffer
 */
async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      const chunks: Buffer[] = [];
      response.on('data', (chunk) => {
        chunks.push(chunk);
      });

      response.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Generate PDF receipt buffer using pdfkit
 */
export async function generatePDFReceiptBuffer(data: ReceiptData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        bufferPages: true,
        margin: 40,
        size: 'A4'
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });

      doc.on('error', (err: Error) => {
        reject(err);
      });

      // Colors
      const primaryColor = '#667eea';
      const textDark = '#333333';
      const textGray = '#666666';
      const bgLight = '#f8f9fa';

      // Try to download and embed logo
      let logoBuffer: Buffer | null = null;
      try {
        logoBuffer = await downloadImage('https://nitminer.com/logo_img/logo-rbg.png');
      } catch (error) {
        console.warn('Failed to download logo, continuing without it:', error);
      }

      // Header with logo and company info
      let currentX = 40;
      
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, 40, 30, { width: 70, height: 70 });
          currentX = 125;
        } catch (error) {
          console.warn('Failed to embed logo image:', error);
        }
      }

      // Company info next to logo
      doc.fillColor(primaryColor)
        .fontSize(28)
        .font('Helvetica-Bold')
        .text('TrustInn', currentX, 40);

      doc.fillColor(textGray)
        .fontSize(11)
        .font('Helvetica')
        .text('Security Tools & Testing Platform', currentX, 75)
        .text('www.trustinn.com | support@trustinn.com', currentX, 92);

      // Divider line
      doc.strokeColor('#ddd')
        .lineWidth(2)
        .moveTo(40, 125)
        .lineTo(555, 125)
        .stroke();

      // Receipt title and meta
      doc.fillColor(textDark)
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('PAYMENT RECEIPT', 40, 155, { align: 'center' })
        .fontSize(12)
        .font('Helvetica')
        .text(`Receipt #: ${data.receiptNumber}`, 40, 195)
        .text(`Date: ${data.receiptDate}`, 40, 215);

      // Customer Information Section
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .fillColor(textDark)
        .text('Customer Information', 40, 255);

      // Customer info box background
      doc.rect(40, 280, 515, 80)
        .fillColor(bgLight)
        .fill();

      doc.fillColor(primaryColor)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Name:', 50, 290)
        .text('Email:', 50, 315)
        .text('Customer ID:', 50, 340);

      doc.fillColor(textDark)
        .font('Helvetica')
        .text(data.customerName, 150, 290)
        .text(data.customerEmail, 150, 315)
        .text(data.customerId, 150, 340);

      // Payment Details Section
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .fillColor(textDark)
        .text('Payment Details', 40, 385);

      // Table header
      const tableTop = 415;
      const col1 = 50;
      const col2 = 300;

      doc.rect(40, tableTop, 515, 25)
        .fillColor(primaryColor)
        .fill();

      doc.fillColor('white')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Description', col1, tableTop + 6)
        .text('Details', col2, tableTop + 6);

      // Table rows
      const rowHeight = 25;
      let currentY = tableTop + 25;
      const rows = [
        ['Service Description', data.serviceDescription],
        ['Payment Amount', `₹${(data.amountInRupees / 100).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`],
        ['Payment Method', data.paymentMethod],
        ['Transaction ID', data.transactionId],
        ['Service Start Date', data.serviceStartDate],
        ['Service End Date', data.serviceEndDate],
        ['Duration', `${data.duration} Year${data.duration > 1 ? 's' : ''} (${data.duration * 6} Months)`],
        ['Payment Status', `✓ ${data.paymentStatus}`]
      ];

      doc.fillColor(textGray);

      rows.forEach((row, index) => {
        // Alternate row background
        if (index % 2 === 0) {
          doc.rect(40, currentY, 515, rowHeight)
            .fillColor(bgLight)
            .fill();
        }

        doc.fillColor(textDark)
          .fontSize(10)
          .font(index === rows.length - 1 ? 'Helvetica-Bold' : 'Helvetica')
          .text(row[0], col1, currentY + 7);

        if (index === rows.length - 1) {
          doc.fillColor('#22c55e'); // Green for paid status
        }

        doc.text(row[1], col2, currentY + 7);

        currentY += rowHeight;
      });

      // Total section
      const totalY = currentY + 30;
      const totalBoxWidth = 200;
      const totalBoxHeight = 70;
      const totalBoxX = 555 - 50 - totalBoxWidth;

      doc.rect(totalBoxX, totalY, totalBoxWidth, totalBoxHeight)
        .fillColor(primaryColor)
        .fill();

      doc.fillColor('white')
        .fontSize(11)
        .font('Helvetica')
        .text('Total Amount Paid', totalBoxX + 15, totalY + 15)
        .fontSize(22)
        .font('Helvetica-Bold')
        .text(`₹${(data.amountInRupees / 100).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`, totalBoxX + 15, totalY + 35);

      // Footer
      const footerY = totalY + 100;
      doc.moveTo(40, footerY)
        .strokeColor('#ddd')
        .lineWidth(1)
        .lineTo(555, footerY)
        .stroke();

      doc.fillColor(primaryColor)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Thank you for your business!', 40, footerY + 20, { align: 'center' });

      doc.fillColor(textGray)
        .fontSize(10)
        .font('Helvetica')
        .text('This is an official payment receipt from TrustInn', 40, footerY + 45, { align: 'center' })
        .text('For any queries, please contact: support@trustinn.com', 40, footerY + 65, { align: 'center' })
        .text('© 2026 NITMiner Technologies Private Limited. All rights reserved.', 40, footerY + 85, { align: 'center' });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
