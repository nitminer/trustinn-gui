/**
 * Test script to verify PDF generation and Cloudinary upload
 */

import { generatePDFReceiptBuffer } from './src/lib/pdfReceiptGeneratorV2';
import { uploadReceiptPDFToCloudinary } from './src/lib/cloudinaryUpload';

async function testPDFGeneration() {
  console.log('\n=== Testing PDF Generation ===\n');

  try {
    const testData = {
      receiptNumber: 'RCP-TEST-12345',
      receiptDate: 'January 24, 2026',
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerId: '507f1f77bcf86cd799439011',
      serviceDescription: 'TrustInn Premium Subscription (1 Year - Unlimited Access)',
      amountInRupees: 599400,
      paymentMethod: 'Razorpay (Card/UPI/Net Banking)',
      transactionId: 'pay_TEST123456',
      serviceStartDate: 'January 24, 2026',
      serviceEndDate: 'January 24, 2027',
      paymentStatus: 'Paid',
      duration: 1
    };

    console.log('📝 Generating PDF with data:', testData);
    const pdfBuffer = await generatePDFReceiptBuffer(testData);
    console.log('✅ PDF generated successfully');
    console.log(`   Size: ${pdfBuffer.length} bytes`);

    // Try to upload to Cloudinary
    console.log('\n🔄 Testing Cloudinary upload...');
    console.log('   Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
    console.log('   API Key available:', !!process.env.CLOUDINARY_API_KEY);

    const uploadUrl = await uploadReceiptPDFToCloudinary(
      pdfBuffer,
      'test-receipt',
      'RCP-TEST-12345'
    );
    console.log('✅ Upload successful!');
    console.log('   URL:', uploadUrl);

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    return false;
  }
}

// Run test
testPDFGeneration().then((success) => {
  console.log('\n' + (success ? '✅ All tests passed!' : '❌ Tests failed'));
  process.exit(success ? 0 : 1);
});
