import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['web-development', 'mobile-development', 'design', 'writing', 'marketing', 'admin-support', 'other']
  },
  budget: {
    type: Number,
    required: true
  },
  budgetType: {
    type: String,
    enum: ['fixed', 'hourly'],
    default: 'fixed'
  },
  location: {
    type: String,
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'completed'],
    default: 'open'
  },
  skillsRequired: [String],
  proposals: [{
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    coverLetter: String,
    bidAmount: Number,
    estimatedTime: String,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

jobSchema.virtual('proposalCount').get(function() {
  return this.proposals.length;
});

export default mongoose.model('Job', jobSchema);