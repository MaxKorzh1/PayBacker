// server.js (Backend - Node.js & Express)
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect("mongodb://localhost:27017/referralApp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const ReferralSchema = new mongoose.Schema({
  referrer: String,
  client: String,
  business: String,
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

const Referral = mongoose.model("Referral", ReferralSchema);

// Create referral link
app.post("/create", async (req, res) => {
  const { referrer, client, business } = req.body;
  const referral = new Referral({ referrer, client, business });
  await referral.save();
  res.json({ success: true, referral });
});

// Confirm referral
app.post("/confirm/:id", async (req, res) => {
  const { id } = req.params;
  await Referral.findByIdAndUpdate(id, { status: "confirmed" });
  res.json({ success: true });
});

// Get all referrals
app.get("/referrals", async (req, res) => {
  const referrals = await Referral.find();
  res.json(referrals);
});

app.listen(5000, () => console.log("Server running on port 5000"));

// Frontend will be built using Next.js (React)