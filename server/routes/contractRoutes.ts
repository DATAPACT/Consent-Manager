import express from "express";
import { db } from "../config/firebase.js";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";

const router = express.Router();

interface AuthRequest extends Request {
  user?: any;
}

// Middleware to check API token
export async function authorizeRequest(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.headers["x-api-token"] as string | undefined;
  const { requestId } = req.params;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: "API token is required" });
  }

  try {
    // --- Find user by token ---
    const ownersSnap = await db
      .collection("owners")
      .where("apiToken.access_token", "==", token)
      .get();
    const requestersSnap = await db
      .collection("requesters")
      .where("apiToken.access_token", "==", token)
      .get();

    let userDoc = null;
    let role: "owner" | "requester" | null = null;

    if (!ownersSnap.empty) {
      userDoc = ownersSnap.docs[0];
      role = "owner";
    } else if (!requestersSnap.empty) {
      userDoc = requestersSnap.docs[0];
      role = "requester";
    } else {
      return res
        .status(401)
        .json({ success: false, error: "Invalid API token" });
    }

    const userData = userDoc.data();

    // --- Decode JWT to get email ---
    let tokenPayload: any;
    try {
      tokenPayload = jwt.decode(token);
    } catch {
      return res
        .status(400)
        .json({ success: false, error: "Invalid token format" });
    }

    if (!tokenPayload?.sub || tokenPayload.sub !== userData.email) {
      return res
        .status(403)
        .json({ success: false, error: "Token email mismatch" });
    }

    // --- Check if request belongs to this user ---
    const requestSnap = await db.collection("requests").doc(requestId).get();
    if (!requestSnap.exists) {
      return res
        .status(404)
        .json({ success: false, error: "Request not found" });
    }

    const requestData = requestSnap.data();
    const ownsRequest =
      (role === "owner" &&
        requestData?.ownerEmails?.includes(userData.email)) ||
      (role === "requester" && requestData?.requesterEmail === userData.email);

    if (!ownsRequest) {
      return res
        .status(403)
        .json({ success: false, error: "Not authorized for this request" });
    }

    // --- Attach user info to request ---
    req.user = { uid: userDoc.id, email: userData.email, role };

    next();
  } catch (err) {
    console.error("Authorization error:", err);
    res.status(500).json({ success: false, error: "Authorization failed" });
  }
}

// POST /api/requests/:requestId/createContract
router.post(
  "/:requestId/createContract",
  authorizeRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const { requestId } = req.params;
      const { policy } = req.body;

      // --- Fetch the request to verify existence ---
      const requestSnap = await db.collection("requests").doc(requestId).get();
      if (!requestSnap.exists) {
        return res
          .status(404)
          .json({ success: false, error: "Request not found" });
      }

      const requestData = requestSnap.data();

      // --- Collect natural language document from extraText and extraTerms ---
      const naturalLanguageFields = [
        requestData?.extraTerms,
        requestData?.extraText,
      ].filter(Boolean);

      const naturalLanguageDocument = naturalLanguageFields.join("\n\n");

      // --- Prepare payload for external contract API ---
      const payload = {
        _id: requestId,
        client_optional_info: {
          consent_id: requestId,
        },
        cactus_format: 1,
        contract_type: "consent_contract",
        validity_period: 0,
        notice_period: 0,
        contacts: {},
        resource_description: {},
        definitions: {},
        custom_clauses: {},
        dpw: {},
        odrl: policy || {},
        natural_language_document: naturalLanguageDocument || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log("the payload is: ", payload);

      // --- Call external contract creation API ---
      const externalApiUrl =
        process.env.CONTRACT_SERVICE_URL ||
        "https://dips.soton.ac.uk/contract-service-api";
      const response = await fetch(`${externalApiUrl}/contract/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: any = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: data.message || "Failed to create contract",
        });
      }

      res.json(data);
    } catch (err: any) {
      console.error("Error creating contract:", err);
      res.status(500).json({
        success: false,
        error: "Failed to create contract",
        details: err.message || String(err),
      });
    }
  }
);

// GET /api/requests/:requestId/contract
router.get(
  "/:requestId/contract",
  authorizeRequest,
  async (req: AuthRequest, res) => {
    const { requestId } = req.params; // matches middleware
    const requestSnap = await db.collection("requests").doc(requestId).get();
    const contractId = requestSnap.data()?.contractId || null;

    res.json({ success: true, contractId });
  }
);

// GET /api/requests/:requestId/downloadContract/:contractId
router.get(
  "/:requestId/downloadContract/:contractId",
  authorizeRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const { requestId, contractId } = req.params;

      // --- Fetch the request to verify existence and ownership ---
      const requestSnap = await db.collection("requests").doc(requestId).get();
      if (!requestSnap.exists) {
        return res
          .status(404)
          .json({ success: false, error: "Request not found" });
      }

      // Optional: re-check ownership if middleware does not already enforce it
      const requestData = requestSnap.data();
      const userEmail = req.user?.email;
      const ownsRequest =
        (req.user?.role === "owner" &&
          requestData?.ownerEmails?.includes(userEmail)) ||
        (req.user?.role === "requester" &&
          requestData?.requesterEmail === userEmail);

      if (!ownsRequest) {
        return res.status(403).json({
          success: false,
          error: "Not authorized to download this contract",
        });
      }

      // --- Download the contract from external API ---
      const contractServiceUrl =
        process.env.CONTRACT_SERVICE_URL ||
        "https://dips.soton.ac.uk/contract-service-api";
      const response = await fetch(
        `${contractServiceUrl}/contract/download/${contractId}`,
        {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          success: false,
          error: `External API error: ${errorText}`,
        });
      }

      const contractBuffer = await response.arrayBuffer();

      // --- Send the file ---
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=contract_${contractId}.pdf`
      );
      res.setHeader("Content-Type", "application/pdf");
      res.send(Buffer.from(contractBuffer));
    } catch (err) {
      console.error("Error downloading contract:", err);
      res
        .status(500)
        .json({ success: false, error: "Failed to download contract" });
    }
  }
);

export default router;
