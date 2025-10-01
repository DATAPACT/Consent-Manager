import express from "express";
import { db } from "../config/firebase.js";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

interface JwtPayload {
  sub: string; // user email or id
  exp: number;
  [key: string]: any;
}

// Middleware to check API token
function requireToken(req: Request, res: Response, next: NextFunction) {
  const token = req.headers["x-api-token"] as string | undefined;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: "API token is required" });
  }

  // Token exists, continue to the route
  next();
}

// GET contractId for a request (requires request id)
router.get(
  "/:id/contract",
  requireToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const docSnap = await db.collection("requests").doc(id).get();

      if (!docSnap.exists) {
        return res
          .status(404)
          .json({ success: false, error: "Request not found" });
      }

      res.json({
        success: true,
        contractId: docSnap.data()?.contractId || null,
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch contractId" });
    }
  }
);

// GET /api/requests/:id/downloadContract (requires contract id)
router.get(
  "/:id/downloadContract",
  requireToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const externalApiUrl = `http://152.78.17.144:8006/contract/download/${id}`;

      const response = await fetch(externalApiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Add auth header for external API if needed
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

      const contractBuffer = await response.arrayBuffer();

      res.setHeader(
        "Content-Disposition",
        `attachment; filename=contract_${id}.pdf`
      );
      res.setHeader("Content-Type", "application/pdf");

      res.send(Buffer.from(contractBuffer));
    } catch (error) {
      console.error("Error downloading contract:", error);
      res.status(500).json({
        error: "Failed to download contract",
        success: false,
      });
    }
  }
);

export default router;
