import dotenv from "dotenv";
import mongoose from "mongoose";
import Classroom from "../models/Classroom.js";
import fs from "fs";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const data = JSON.parse(fs.readFileSync("./seed/smartboard.json", "utf8"));
  // data format matches your upload (branch + classrooms + smartboards) :contentReference[oaicite:2]{index=2}
  const toInsert = [];
  for (const b of data) {
    for (const c of b.classrooms) {
      toInsert.push({
        branch: b.branch,
        number: c.number,
        smartboards: c.smartboards
      });
    }
  }
  await Classroom.deleteMany({});
  await Classroom.insertMany(toInsert);
  console.log("Seeded classrooms:", toInsert.length);
  await mongoose.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
