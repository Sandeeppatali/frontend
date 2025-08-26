// backend/models/Faculty.js
import mongoose from "mongoose";

const facultySchema = new mongoose.Schema({
  facultyId: String,
  name: String,
  branch: String,
  email: String,
  phone: String,
  password: String,
});

// ✅ third argument = exact collection name ("faculty")
export default mongoose.model("Faculty", facultySchema, "faculty");
