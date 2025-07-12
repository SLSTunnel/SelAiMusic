const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
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
    required: function() { return !this.googleId; },
    minlength: 6
  },
  
  // OAuth Information
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  googleEmail: String,
  googlePicture: String,
  
  // Profile Information
  firstName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  
  // Statistics
  musicGenerated: {
    type: Number,
    default: 0
  },
  totalPlayTime: {
    type: Number,
    default: 0
  },
  playlistsCreated: {
    type: Number,
    default: 0
  },
  trainingSubmissions: {
    type: Number,
    default: 0
  },
  
  // Subscription Information
  subscription: {
    status: {
      type: String,
      enum: ['free', 'monthly', 'annual'],
      default: 'free'
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    }
  },
  
  // Preferences
  preferences: {
    defaultGenre: {
      type: String,
      default: 'pop'
    },
    defaultMood: {
      type: String,
      default: 'happy'
    },
    defaultBPM: {
      type: Number,
      default: 120
    },
    defaultKey: {
      type: String,
      default: 'C'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // Account Status
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  
  // API Usage
  apiUsage: {
    dailyRequests: {
      type: Number,
      default: 0
    },
    monthlyRequests: {
      type: Number,
      default: 0
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'subscription.status': 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

// Virtual for subscription status
userSchema.virtual('hasActiveSubscription').get(function() {
  return this.subscription.status !== 'free' && 
         this.subscription.currentPeriodEnd > new Date();
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    username: this.username,
    firstName: this.firstName,
    lastName: this.lastName,
    avatar: this.avatar,
    bio: this.bio,
    musicGenerated: this.musicGenerated,
    playlistsCreated: this.playlistsCreated,
    subscription: {
      status: this.subscription.status,
      hasActiveSubscription: this.hasActiveSubscription
    },
    preferences: this.preferences,
    createdAt: this.createdAt
  };
};

// Method to update usage statistics
userSchema.methods.updateUsage = function() {
  this.musicGenerated += 1;
  this.apiUsage.dailyRequests += 1;
  this.apiUsage.monthlyRequests += 1;
  
  // Reset daily usage if it's a new day
  const now = new Date();
  const lastReset = new Date(this.apiUsage.lastResetDate);
  if (now.getDate() !== lastReset.getDate() || now.getMonth() !== lastReset.getMonth()) {
    this.apiUsage.dailyRequests = 1;
    this.apiUsage.lastResetDate = now;
  }
  
  return this.save();
};

// Static method to find by email or username
userSchema.statics.findByEmailOrUsername = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier }
    ]
  });
};

module.exports = mongoose.model('User', userSchema); 