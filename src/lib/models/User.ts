import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: false,
      minlength: 8,
      default: null
    },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },

    isPremium: {
      type: Boolean,
      default: false
    },

    trialCount: {
      type: Number,
      default: 5
    },

    subscriptionExpiry: {
      type: Date,
      default: null
    },

    subscription: {
      plan: {
        type: String,
        enum: ['1_month', '3_month', '6_month', '12_month', '1_months', '3_months', '6_months', '12_months', 'lifetime', null],
        default: null
      },
      status: {
        type: String,
        enum: ['active', 'expired', 'cancelled', null],
        default: null
      },
      startDate: {
        type: Date,
        default: null
      },
      endDate: {
        type: Date,
        default: null
      },
      paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
      }
    },

    settings: {
      type: Object,
      default: {}
    },

    // OTP verification fields
    otpCode: {
      type: String,
      default: null
    },
    otpExpiresAt: {
      type: Date,
      default: null
    },
    isEmailVerified: {
      type: Boolean,
      default: true
    },
    lastOtpSentAt: {
      type: Date,
      default: null
    },

    // Token version for invalidating tokens on logout
    // When user logs out, this value is incremented
    // Tokens contain this version, and logout invalidates old versions
    tokenVersion: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;