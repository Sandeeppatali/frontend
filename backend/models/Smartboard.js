import mongoose from "mongoose";

const smartboardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  room: { type: String, required: true },
  department: { type: String, required: true },
});

// ✅ Prevent OverwriteModelError (important with nodemon restarts)
const Smartboard =
  mongoose.models.Smartboard || mongoose.model("Smartboard", smartboardSchema);

export default Smartboard;
