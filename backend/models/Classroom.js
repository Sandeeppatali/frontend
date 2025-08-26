import mongoose from "mongoose";

const SmartboardSchema = new mongoose.Schema({
  Number: { type: String, required: true },
  Status: { type: String, enum: ["Available", "Unavailable"], default: "Available" }
}, { _id: false });

const ClassroomSchema = new mongoose.Schema({
  Branch: { type: String, required: true },
  Classroom: { type: String, required: true },
  Smartboards: { type: [SmartboardSchema], default: [] }
}, { timestamps: true });

ClassroomSchema.index({ Branch: 1, Classroom: 1 }, { unique: true });

export default mongoose.model("Classroom", ClassroomSchema, "classroom");
