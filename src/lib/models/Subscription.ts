import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    plan: {
      type: String,
      enum: ['basic', 'premium', 'pro'],
      required: true
    },

    amountPaid: {
      type: Number,
      required: true,
      min: 0
    },

    currency: {
      type: String,
      default: 'USD'
    },

    isActive: {
      type: Boolean,
      default: true
    },

    startDate: {
      type: Date,
      default: Date.now
    },

    endDate: {
      type: Date,
      required: true
    },

    autoRenew: {
      type: Boolean,
      default: true
    },

    paymentId: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Ensure unique index on email
subscriptionSchema.index({ email: 1 }, { unique: true });

const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
