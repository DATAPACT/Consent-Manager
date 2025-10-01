import express from "express";
import { db } from "../config/firebase.js";

const router = express.Router();

// GET contractId for a request (requires request id)
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

// GET /api/requests/:id/downloadContract
router.get("/:id/downloadContract", async (req, res) => {
  try {
    const { id } = req.params;

    // Call the external API to fetch the contract
    const externalApiUrl = `http://152.78.17.144:8006/contract/download/${id}`;

    const response = await fetch(externalApiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Add auth header if required, e.g.
        // Authorization: `Bearer ${process.env.CONTRACT_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `External API error: ${errorText}`,
        success: false,
      });
    }

    // Get contract content as a buffer
    const contractBuffer = await response.arrayBuffer();

    // Set headers for download
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=contract_${id}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");

    // Send the file
    res.send(Buffer.from(contractBuffer));
  } catch (error) {
    console.error("Error downloading contract:", error);
    res.status(500).json({
      error: "Failed to download contract",
      success: false,
    });
  }
});

export default router;
