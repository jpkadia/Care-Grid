const mongoose = require('mongoose');

const OtpChallengeSchema = new mongoose.Schema({
  accountType: { type: String, enum: ['doctor', 'superadmin'], required: true, index: true },
  purpose: { type: String, enum: ['login', 'registration', 'password-reset'], required: true, index: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, index: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  otpHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  lastSentAt: { type: Date, required: true }
}, { timestamps: true });

OtpChallengeSchema.index({ accountType: 1, purpose: 1, accountId: 1, email: 1 });

module.exports = mongoose.model('OtpChallenge', OtpChallengeSchema);
