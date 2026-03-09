/**
 * Client-side PDF generation utility
 * Uses html2pdf library for generating PDF from receipt HTML
 */

/**
 * Generate and download PDF receipt
 * @param receiptHTML - The HTML content of the receipt
 * @param filename - Optional filename for the downloaded PDF
 */
export async function downloadReceiptPDF(receiptHTML: string, filename: string = 'receipt.pdf'): Promise<void> {
  // First, load html2pdf library if not already loaded
  if (typeof (window as any).html2pdf === 'undefined') {
    // Load the library from CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => {
      generatePDF(receiptHTML, filename);
    };
    document.head.appendChild(script);
  } else {
    generatePDF(receiptHTML, filename);
  }
}

/**
 * Internal function to generate PDF using html2pdf
 */
function generatePDF(receiptHTML: string, filename: string): void {
  const { html2pdf } = (window as any);
  
  // Create a temporary container for the HTML
  const element = document.createElement('div');
  element.innerHTML = receiptHTML;
  
  const options = {
    margin: 0,
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
  };

  html2pdf().set(options).from(element).save();
}

/**
 * Open receipt in a new window for printing
 */
export function printReceipt(receiptHTML: string): void {
  const printWindow = window.open('', '', 'height=600,width=800');
  if (printWindow) {
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.print();
  }
}

/**
 * Send receipt to email via API
 */
export async function emailReceipt(
  email: string,
  receiptHTML: string,
  firstName: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/payments/send-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        receiptHTML,
        firstName
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending receipt email:', error);
    return false;
  }
}
