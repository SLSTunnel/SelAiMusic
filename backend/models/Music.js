const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500,
    default: ''
  },
  
  // Creator Information
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Generation Parameters
  prompt: {
    type: String,
    required: true,
    maxlength: 1000
  },
  mood: {
    type: String,
    required: true,
    enum: [
      'happy', 'sad', 'energetic', 'calm', 'romantic', 'mysterious',
      'uplifting', 'melancholic', 'aggressive', 'peaceful', 'nostalgic',
      'dramatic', 'playful', 'serious', 'dreamy', 'powerful'
    ]
  },
  genre: {
    type: String,
    required: true,
    enum: [
      'pop', 'rock', 'jazz', 'classical', 'electronic', 'hip-hop',
      'country', 'blues', 'folk', 'reggae', 'r&b', 'metal',
      'punk', 'indie', 'ambient', 'lofi', 'house', 'techno'
    ]
  },
  
  // Musical Properties
  bpm: {
    type: Number,
    required: true,
    min: 60,
    max: 200
  },
  key: {
    type: String,
    required: true,
    enum: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
    max: 600 // 10 minutes max
  },
  
  // AI Model Information
  aiModel: {
    type: String,
    required: true,
    default: 'selai-music-v1'
  },
  generationParams: {
    temperature: {
      type: Number,
      default: 0.8,
      min: 0,
      max: 1
    },
    topP: {
      type: Number,
      default: 0.9,
      min: 0,
      max: 1
    },
    seed: {
      type: Number,
      default: null
    }
  },
  
  // File Information
  files: {
    main: {
      url: String,
      key: String,
      format: {
        type: String,
        enum: ['mp3', 'wav', 'flac'],
        default: 'mp3'
      },
      bitrate: {
        type: Number,
        default: 320
      },
      size: Number
    },
    stems: {
      vocals: { url: String, key: String, size: Number },
      drums: { url: String, key: String, size: Number },
      bass: { url: String, key: String, size: Number },
      melody: { url: String, key: String, size: Number },
      harmony: { url: String, key: String, size: Number }
    },
    midi: {
      url: String,
      key: String,
      size: Number
    },
    waveform: {
      url: String,
      key: String
    }
  },
  
  // Processing Status
  status: {
    type: String,
    enum: ['generating', 'processing', 'completed', 'failed'],
    default: 'generating'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Generation Details
  generationTime: {
    type: Number, // in seconds
    default: 0
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  
  // Analytics
  plays: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  
  // Tags and Categories
  tags: [{
    type: String,
    trim: true,
    maxlength: 20
  }],
  
  // Privacy and Sharing
  isPublic: {
    type: Boolean,
    default: true
  },
  isRemixable: {
    type: Boolean,
    default: true
  },
  license: {
    type: String,
    enum: ['all-rights-reserved', 'creative-commons', 'public-domain'],
    default: 'all-rights-reserved'
  },
  
  // Remix Information
  originalTrack: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Music',
    default: null
  },
  remixes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Music'
  }],
  
  // Error Information
  error: {
    message: String,
    code: String,
    details: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes
musicSchema.index({ creator: 1, createdAt: -1 });
musicSchema.index({ genre: 1, mood: 1 });
musicSchema.index({ status: 1 });
musicSchema.index({ isPublic: 1, createdAt: -1 });
musicSchema.index({ tags: 1 });
musicSchema.index({ 'files.main.url': 1 });

// Virtual for full duration in minutes
musicSchema.virtual('durationMinutes').get(function() {
  return (this.duration / 60).toFixed(2);
});

// Virtual for generation time in minutes
musicSchema.virtual('generationTimeMinutes').get(function() {
  return (this.generationTime / 60).toFixed(2);
});

// Method to update play count
musicSchema.methods.incrementPlays = function() {
  this.plays += 1;
  return this.save();
};

// Method to update download count
musicSchema.methods.incrementDownloads = function() {
  this.downloads += 1;
  return this.save();
};

// Method to update like count
musicSchema.methods.toggleLike = function(userId) {
  // This would typically interact with a separate likes collection
  // For now, just increment the counter
  this.likes += 1;
  return this.save();
};

// Method to get public music data
musicSchema.methods.getPublicData = function() {
  return {
    id: this._id,
    title: this.title,
    description: this.description,
    creator: this.creator,
    prompt: this.prompt,
    mood: this.mood,
    genre: this.genre,
    bpm: this.bpm,
    key: this.key,
    duration: this.duration,
    durationMinutes: this.durationMinutes,
    files: {
      main: this.files.main,
      waveform: this.files.waveform
    },
    status: this.status,
    plays: this.plays,
    likes: this.likes,
    tags: this.tags,
    isPublic: this.isPublic,
    isRemixable: this.isRemixable,
    license: this.license,
    createdAt: this.createdAt,
    completedAt: this.completedAt
  };
};

// Static method to find popular music
musicSchema.statics.findPopular = function(limit = 10) {
  return this.find({ isPublic: true, status: 'completed' })
    .sort({ plays: -1, likes: -1 })
    .limit(limit)
    .populate('creator', 'username avatar');
};

// Static method to find by genre and mood
musicSchema.statics.findByGenreAndMood = function(genre, mood, limit = 20) {
  return this.find({
    genre: genre,
    mood: mood,
    isPublic: true,
    status: 'completed'
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('creator', 'username avatar');
};

module.exports = mongoose.model('Music', musicSchema); 