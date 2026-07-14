import mongoose from 'mongoose';

const chunkSchema = new mongoose.Schema({
  content: { type: String, required: true },
  chunkIndex: { type: Number, required: true },
  pageNumber: Number,
  tokenCount: Number,
  embedding: { type: [Number], default: [] },
  metadata: { type: Map, of: String, default: {} }
}, { _id: true });

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true,
    index: true
  },
  originalFilename: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  filePath: { type: String, required: true },
  category: {
    type: String,
    enum: [
      'infrastructure', 'deployment', 'security', 'database',
      'monitoring', 'troubleshooting', 'application', 'runbook',
      'architecture', 'api-docs', 'onboarding', 'other'
    ],
    default: 'other'
  },
  tags: [String],
  rawText: { type: String, default: '' },
  chunks: [chunkSchema],
  embeddingModel: { type: String, default: 'nomic-embed-text' },
  embeddingDimension: { type: Number, default: 768 },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'embedded', 'failed'],
    default: 'uploaded'
  },
  processingError: String,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

documentSchema.index({ title: 'text', rawText: 'text', tags: 'text' });
documentSchema.index({ status: 1, isActive: 1 });
documentSchema.index({ category: 1 });

export default mongoose.model('Document', documentSchema);
