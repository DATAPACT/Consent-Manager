import express from "express";
import { db } from "../config/firebase.js";

const router = express.Router();

// GET contractId for a request
router.get("/:id/contract", async (req, res) => {
  try {
    const { id } = req.params;
    const docSnap = await db.collection("requests").doc(id).get();

    if (!docSnap.exists)
      return res
        .status(404)
        .json({ success: false, error: "Request not found" });

    res.json({ success: true, contractId: docSnap.data()?.contractId || null });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch contractId" });
  }
});

// PUT contractId for a request
router.put("/:id/contract", async (req, res) => {
  try {
    const { id } = req.params;
    const { contractId } = req.body;
    if (!contractId)
      return res
        .status(400)
        .json({ success: false, error: "contractId required" });

    const docRef = db.collection("requests").doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists)
      return res
        .status(404)
        .json({ success: false, error: "Request not found" });

    await docRef.update({ contractId });
    res.json({ success: true, message: "contractId updated successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update contractId" });
  }
});

export default router;
