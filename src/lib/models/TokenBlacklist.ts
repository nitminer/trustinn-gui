import mongoose from 'mongoose';

const tokenBlacklistSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    email: {
      type: String,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
      // Auto-delete 30 days after expiration
      expires: 2592000,
    },
    reason: {
      type: String,
      enum: ['user_logout', 'user_deleted', 'manual_revoke', 'other'],
      default: 'user_logout',
    },
  },
  { timestamps: true }
);

// Create hash index for token field to save space
tokenBlacklistSchema.index({ token: 1, expiresAt: 1 });

const TokenBlacklist = mongoose.models.TokenBlacklist || mongoose.model('TokenBlacklist', tokenBlacklistSchema);

export default TokenBlacklist;
