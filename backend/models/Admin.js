import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  adminId: String,
  name: String,
  position: String,
  branch: String,
  email: String,
  phone: String,
  password: String,
  role: String
}, { collection: "admin-data" });  // <--- Add this line

export default mongoose.model("Admin", adminSchema);
