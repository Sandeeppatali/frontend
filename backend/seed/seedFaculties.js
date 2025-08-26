import dotenv from "dotenv";
import mongoose from "mongoose";
import Faculty from "../models/Faculty.js";
import fs from "fs";
import bcrypt from "bcryptjs";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const raw = JSON.parse(fs.readFileSync("./seed/faculty_cleaned.json", "utf8"));
  // This file has facultyId, name, branch, email, phone (no passwords) :contentReference[oaicite:3]{index=3}
  const docs = raw.map(x => ({
    facultyId: x.facultyId,
    name: x.name,
    branch: x.branch.replace("AI & ML", "AIML").replace("Basic Science ", "Basic Science"),
    email: x.email.trim().toLowerCase(),
    phone: x.phone || "",
    role: "faculty",
    passwordHash: bcrypt.hashSync("Sahyadri@123", 10) // default password; ask users to change
  }));
  await Faculty.deleteMany({});
  await Faculty.insertMany(docs);
  console.log("Seeded faculties:", docs.length);
  await mongoose.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
