import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    classroom: { type: String, required: true }, // store classroom name directly
    time: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

// Add the correct unique index to prevent double booking
BookingSchema.index({ classroom: 1, date: 1, time: 1 }, { unique: true });

export default mongoose.model("Booking", BookingSchema);