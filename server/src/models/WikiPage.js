import mongoose from 'mongoose';

const wikiPageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Page title is required'],
    unique: true,
    trim: true,
    index: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  content: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: [
      'infrastructure',
      'deployment',
      'security',
      'database',
      'monitoring',
      'troubleshooting',
      'application',
      'other'
    ],
    default: 'other'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastEditedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [String],
  version: {
    type: Number,
    default: 1
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  },
  versions: [{
    versionNumber: Number,
    content: String,
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    editedAt: Date,
    changeDescription: String
  }],
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: Date
  }],
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate slug from title
wikiPageSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Increment view count
wikiPageSchema.methods.incrementViewCount = async function() {
  this.viewCount += 1;
  return await this.save();
};

// Add version history
wikiPageSchema.methods.addVersion = function(editedBy, changeDescription) {
  this.versions.push({
    versionNumber: this.version,
    content: this.content,
    editedBy: editedBy,
    editedAt: new Date(),
    changeDescription: changeDescription
  });
  this.version += 1;
};

// Search in content
wikiPageSchema.index({
  title: 'text',
  content: 'text',
  tags: 'text'
});

export default mongoose.model('WikiPage', wikiPageSchema);
