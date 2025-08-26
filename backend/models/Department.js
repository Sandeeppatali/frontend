import { Schema, model } from "mongoose";

const DepartmentSchema = new Schema(
  {
    code: { type: String, required: true, unique: true }, // e.g., CSE
    name: { type: String, required: true }                 // e.g., Computer Science & Engineering
  },
  { timestamps: true }
);

export default model("Department", DepartmentSchema);
