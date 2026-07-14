import mongoose from 'mongoose';

const approvalRequestSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['publish', 'research', 'critical-update', 'dependency-check'],
    required: true
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'auto-approved'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  agentOutput: { type: String, default: '' },
  sources: [{
    type: { type: String },
    title: String,
    url: String,
    snippet: String
  }],
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewNote: String,
  reviewedAt: Date,
  expiresAt: Date
}, {
  timestamps: true
});

approvalRequestSchema.index({ status: 1, type: 1 });
approvalRequestSchema.index({ submittedBy: 1 });
approvalRequestSchema.index({ createdAt: -1 });

export default mongoose.model('ApprovalRequest', approvalRequestSchema);
