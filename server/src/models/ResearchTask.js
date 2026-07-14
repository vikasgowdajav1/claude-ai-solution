import mongoose from 'mongoose';

const researchTaskSchema = new mongoose.Schema({
  query: { type: String, required: true },
  status: {
    type: String,
    enum: ['queued', 'researching', 'analyzing', 'publishing', 'completed', 'failed', 'awaiting-approval'],
    default: 'queued'
  },
  pipeline: {
    researcher: {
      status: { type: String, enum: ['pending', 'running', 'done', 'failed'], default: 'pending' },
      startedAt: Date,
      completedAt: Date,
      results: { type: mongoose.Schema.Types.Mixed, default: {} }
    },
    analyst: {
      status: { type: String, enum: ['pending', 'running', 'done', 'failed'], default: 'pending' },
      startedAt: Date,
      completedAt: Date,
      analysis: { type: String, default: '' }
    },
    publisher: {
      status: { type: String, enum: ['pending', 'running', 'done', 'failed'], default: 'pending' },
      startedAt: Date,
      completedAt: Date,
      output: { type: String, default: '' },
      approvalId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalRequest' }
    }
  },
  settings: {
    searchWeb: { type: Boolean, default: true },
    searchRss: { type: Boolean, default: true },
    searchKnowledgeBase: { type: Boolean, default: true },
    requireApproval: { type: Boolean, default: true }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

researchTaskSchema.index({ status: 1 });
researchTaskSchema.index({ createdBy: 1 });
researchTaskSchema.index({ createdAt: -1 });

export default mongoose.model('ResearchTask', researchTaskSchema);
