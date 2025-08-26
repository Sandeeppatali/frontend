import express from "express";
import auth from "../middleware/auth.js";
import Faculty from "../models/Faculty.js";

const router = express.Router();

router.get("/me", auth, async (req, res) => {
  const me = await Faculty.findById(req.user.id).select("-passwordHash");
  res.json(me);
});

// optional helper to list branches
router.get("/branches", async (_req, res) => {
  const branches = await Faculty.distinct("branch");
  res.json(branches);
});

export default router;
