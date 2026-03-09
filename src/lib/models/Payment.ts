import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    currency: {
      type: String,
      default: 'USD'
    },

    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'razorpay'],
      required: true
    },

    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },

    transactionId: {
      type: String,
      unique: true,
      required: true
    },

    description: {
      type: String,
      default: null
    },

    plan: {
      type: String,
      enum: ['basic', 'premium', 'pro'],
      required: true
    },

    billingPeriod: {
      type: String,
      enum: ['monthly', 'yearly', '1-years', '2-years', '6-months', '12-months', 'lifetime'],
      default: 'monthly'
    },

    metadata: {
      type: Object,
      default: {}
    },

    receiptPdfUrl: {
      type: String,
      default: null
    },

    receiptNumber: {
      type: String,
      default: null
    },

    pdfUploadedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
paymentSchema.index({ email: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

export default Payment;
