import mongoose from 'mongoose';
const { Schema, model, Types: { ObjectId } } = mongoose;

/**
 * HomeVisit — an appointment where an AdminChef visits the HomeChef applicant's kitchen,
 * tastes their food, and submits a formal evaluation.
 *
 * Status flow:
 *   scheduled → completed (with decision: selected|rejected)
 *             → cancelled
 */
const homeVisitSchema = new Schema({
  homeChef:    { type: ObjectId, ref: 'HomeChef', required: true },
  adminChef:   { type: ObjectId, ref: 'AdminChefProfile', required: true },

  // Appointment details
  scheduledDate: { type: Date, required: true },
  scheduledTime: { type: String, default: '' },    // e.g. "10:30 AM"
  address:       { type: String, default: '' },    // full address for the visit
  notes:         { type: String, default: '' },    // any pre-visit notes by admin

  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled',
  },

  // Post-visit evaluation (filled by adminChef after the visit)
  visitedAt:       { type: Date, default: null },
  foodRating:      { type: Number, min: 1, max: 5, default: null },
  hygieneRating:   { type: Number, min: 1, max: 5, default: null },
  overallRating:   { type: Number, min: 1, max: 5, default: null },
  feedback:        { type: String, default: '' },  // tasting notes / observations

  decision: {
    type: String,
    enum: ['pending', 'selected', 'rejected'],
    default: 'pending',
  },
  rejectionReason: { type: String, default: '' },

  // Dishes the admin chef approved (if selected)
  approvedDishes:  { type: [String], default: [] },

  // Certificate info (generated after selection)
  certNumber:      { type: String, default: null, uppercase: true },
  certPdfUrl:      { type: String, default: null },   // Cloudinary URL of PDF
  certEmailSentAt: { type: Date, default: null },

  // Scheduled by (super admin / ops)
  scheduledBy: { type: ObjectId, ref: 'User' },
}, { timestamps: true, versionKey: false });

homeVisitSchema.index({ homeChef: 1 });
homeVisitSchema.index({ adminChef: 1 });
homeVisitSchema.index({ status: 1 });

export default model('HomeVisit', homeVisitSchema);
