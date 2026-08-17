import express from "express";
import { db } from "../config/database.service.ts";
import { Request, Response, NextFunction } from "express";
import { verify } from "../config/keycloak";
import fetch from "node-fetch";
import { ObjectId } from "mongodb";

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
  const input_accesstoken = req.headers["x-api-token"] as string | undefined;

  const { requestId } = req.params;

  if (!input_accesstoken) {
    return res
      .status(401)
      .json({ success: false, error: "API token is required" });
  }

  try {
    let verification = null;
    let request_user = null;
    let request_user_id: string = "";
    let role = "unknown";

    try {
      verification = await verify(input_accesstoken);

      if (verification?.success){
        console.log("Verified:",verification);
        if (req.body) {
          request_user = req.body["user"];
          request_user_id = req.body["user"]["uid"];
          if (verification.email != request_user.email) {
            console.log("User data:", request_user);
            return res.status(403).json({ success: false, error: `Token email mismatch: ${verification.email} vs. ${request_user.email}` });
          }
        }
        else {
          let userDoc = await db
          .collection("users")
          .findOne({email: {$eq: verification.email}})//look for user id
          if (userDoc) {
            request_user_id = userDoc._id.toString();
          }
          else {
            return res
            .status(401)
            .json({ success: false, error: "User not found." });
          }
          
        }
        if (verification?.type === "consumer") {
          role = "requester";
        }
        else if (verification?.type === "provider") {
          role = "owner";
        }
        const requestData = await db.collection("requests").findOne({_id: {$eq: new ObjectId(requestId)}});
        if (!requestData) {
          return res
            .status(404)
            .json({ success: false, error: "Request not found" });
        }

        const exists = requestData.owners.some((owner: { toString: () => string; }) => owner.toString() === request_user_id);

        if (!exists) {
          console.log(`${request_user_id} missing in ${requestData.owners}`);
          return res
            .status(403)
            .json({ success: false, error: "Not authorized for this request" });
        }
        //--- Attach user info to request ---
        req.user = { uid: request_user_id, email: verification.email, role, token: input_accesstoken };
        next();
      }
    }    
    catch(error) {
      console.error(error);
      return res.status(500).json({ success: false, error: "Authorization failed" });
    }
  } catch(error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Authorization failed" });
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

      console.log("Fetching request to verify existence.");
      // --- Fetch the request to verify existence ---
      const requestData = await db.collection("requests").findOne({_id: {$eq: new ObjectId(requestId)}});
      if (!requestData) {
        return res
          .status(404)
          .json({ success: false, error: "Request not found" });
      }

      console.log("Collecting natural language document.");

      // --- Collect natural language document from extraText and extraTerms ---
      const naturalLanguageFields = [
        requestData?.extraTerms,
        requestData?.extraText,
      ].filter(Boolean);

      const naturalLanguageDocument = naturalLanguageFields.join("\n\n");
      console.log("Preparing payload");

      // const odrlPolicy = permissionsToODRLPolicy(requestId, req.user.uid, requestData?.requester.requesterId, policy);
      // console.log("This is the ODRL policy: ", JSON.stringify(odrlPolicy));

      const requesterUid = requestData?.requester?.requesterId;
      const providerUid = req.user?.uid;
      if (!requesterUid || !providerUid) {
        return res.status(500).json({
          success: false,
          error: "Requester or provider id undefined.",
        });
      }
      console.log("Contract contacts lookup:", {
        requesterUid,
        providerUid,
        hasRequesterUid: !!requesterUid,
        hasProviderUid: !!providerUid,
      });

      const contacts: Record<string, any> = {};

      //add another items, which is not retrieved form Negotiation!
      contacts.provider = {
        ...contacts.provider,
        citizen: "UK (this is a fixed value, need to be set according to payload, will be fixing)",
        passport_id: "NO222222 (this is a fixed value, need to be set according to payload)",
      };

      // Assign the provider's unique id to the policy as an ODRL assigner.
      if (policy["odrl:permission"] instanceof Array) {
          policy["odrl:permission"].forEach(permission => {
          permission["odrl:assigner"] = {"odrl:source": {"@id": providerUid}}
        });
      }

      console.log("Resolved contacts for contract payload:", contacts);

      // --- Prepare payload for external contract API ---
      const payload = {
        _id: requestId,
        client_optional_info: {
          consent_id: requestId,
        },
        cactus_format: 1,
        contract_type: "pda",
        validity_period: 12,
        notice_period: 0,
        contacts: contacts,
        resource_description: {},
        definitions: {},
        custom_clauses: {},
        dpw: {},
        odrl: policy,
        nlp: naturalLanguageDocument || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log("the payload is: ", payload);
      console.log("contract payload JSON:", JSON.stringify(payload, null, 2));

      // --- Call external contract creation API ---
      const externalApiUrl =
        process.env.CONTRACT_SERVICE_URL ||
        "https://dips.soton.ac.uk/contract-service-api";
      console.log("the external api is: ", externalApiUrl);
      const response = await fetch(`${externalApiUrl}/contract/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" ,
          "Authorization": `Bearer ${req.user.token}` ,
        },
        body: JSON.stringify(payload),
      });

      const data: any = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: data.message || "Failed to create contract at: " + externalApiUrl + " " + response.statusText,
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
    const requestSnap = await db.collection("requests").findOne({_id: {$eq: new ObjectId(requestId)}});
    const contractId = requestSnap?.contractId || null;

    res.json({ success: true, contractId });
  }
);

// GET /api/requests/:requestId/GetContract/:contractId
router.get(
  "/:requestId/GetContract/:contractId",
  authorizeRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const { requestId, contractId } = req.params;

      // --- Fetch the request to verify existence and ownership ---
      const requestData = await db.collection("requests").findOne({_id: {$eq: new ObjectId(requestId)}});
      if (!requestData) {
        return res
          .status(404)
          .json({ success: false, error: "Request not found" });
      }

      // --- Fetch the contract details from external API ---
      const contractServiceUrl =
        process.env.CONTRACT_SERVICE_URL ||
        "https://dips.soton.ac.uk/contract-service-api";
      const response = await fetch(
        `${contractServiceUrl}/contract/get_contract/${contractId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${req.headers["x-api-token"]}`
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Contract service URL is:",contractServiceUrl);
        return res.status(response.status).json({
          success: false,
          error: `External API error: ${errorText}`,
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (err) {
      console.error("Error fetching contract details:", err);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch contract details" });
    }
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
      const requestData = await db.collection("requests").findOne({_id: {$eq: new ObjectId(requestId)}});
      if (!requestData) {
        return res
          .status(404)
          .json({ success: false, error: "Request not found" });
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
          "Authorization": `Bearer ${req.headers["x-api-token"]}`
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
