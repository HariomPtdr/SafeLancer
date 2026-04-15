const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  proposal:   { type: String, required: true },
  status: {
    type: String,
    enum: ['applied', 'shortlisted', 'interview_scheduled', 'interviewed', 'negotiating', 'hired', 'rejected'],
    default: 'applied'
  },
  appliedAt:            { type: Date, default: Date.now },
  shortlistedAt:        Date,
  interviewScheduledAt: Date,
  meetingRoomId:        String,
  interviewDoneAt:      Date,
  rejectionReason:      String,
  hiredAt:              Date,
}, { timestamps: true });

const jobSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  budget: { type: Number, required: true },
  skills: [{ type: String }],
  deadline: { type: Date, required: true },
  status: { type: String, enum: ['open', 'in_progress', 'completed', 'cancelled'], default: 'open' },
  bids: [bidSchema]
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
