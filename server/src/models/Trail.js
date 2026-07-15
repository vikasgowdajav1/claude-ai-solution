import mongoose from 'mongoose';

const stepSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  title: { type: String, required: true },
  description: String,
  commands: {
    windows: { type: String, default: '' },
    mac: { type: String, default: '' },
    linux: { type: String, default: '' }
  },
  checkQuestion: { type: String, default: '' }, // Yes/No question to verify step worked
  onFailHint: { type: String, default: '' },    // What to check if step failed
  cornerCases: [String],                         // Known edge cases/gotchas
  isOptional: { type: Boolean, default: false }
}, { _id: true });

const trailRecordSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['developer', 'tester', 'ba', 'devops', 'other'], required: true },
  platform: { type: String, enum: ['windows', 'mac', 'linux'], required: true },
  completedSteps: [{ type: Number }],       // step orders completed successfully
  failedAt: Number,                          // step order where they got stuck (null = all passed)
  failReason: String,
  success: { type: Boolean, default: false },
  duration: Number,                          // total minutes taken
  notes: String,
  completedAt: { type: Date, default: Date.now }
}, { _id: true, timestamps: true });

const trailSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Trail title is required'],
    trim: true,
    index: true
  },
  slug: { type: String, unique: true, lowercase: true, index: true },
  description: { type: String, default: '' },
  category: {
    type: String,
    enum: ['setup', 'build', 'deploy', 'test', 'debug', 'migrate', 'onboard', 'other'],
    default: 'setup'
  },
  targetRoles: [{
    type: String,
    enum: ['developer', 'tester', 'ba', 'devops', 'other']
  }],
  platforms: [{
    type: String,
    enum: ['windows', 'mac', 'linux']
  }],
  steps: [stepSchema],
  records: [trailRecordSchema],
  prerequisites: [String],
  tags: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublished: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Virtual: success rate
trailSchema.virtual('successRate').get(function () {
  if (!this.records || this.records.length === 0) return 0;
  const successes = this.records.filter(r => r.success).length;
  return Math.round((successes / this.records.length) * 100);
});

// Virtual: verified platforms (at least one success)
trailSchema.virtual('verifiedPlatforms').get(function () {
  if (!this.records) return [];
  return [...new Set(this.records.filter(r => r.success).map(r => r.platform))];
});

trailSchema.set('toJSON', { virtuals: true });
trailSchema.set('toObject', { virtuals: true });

trailSchema.index({ title: 'text', description: 'text', tags: 'text' });
trailSchema.index({ category: 1, isPublished: 1 });

export default mongoose.model('Trail', trailSchema);
