const mongoose = require("mongoose");

const SmartboardSchema = new mongoose.Schema({
  name: { type: String, required: true },       // Smartboard label (optional)
  room: { type: String, required: true },       // Classroom number (303, 307, etc.)
  department: { type: String, required: true }, // Department (CSE, MBA, Basic Science, etc.)
});

// ✅ Prevent OverwriteModelError
module.exports =
  mongoose.models.Smartboard || mongoose.model("Smartboard", SmartboardSchema);
