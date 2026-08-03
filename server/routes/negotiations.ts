import express from "express";
import { db } from "../config/database.service.ts";
import { Document, ObjectId, WithId } from "mongodb";
import { RequestData } from "../../src/components/Interfaces/Requests.ts";

interface NegotiationCreationResponse{
  message: string,
  negotiation_id: string,
  offer_id: string,
  request_id: string,
  status: string,
}

interface NegotiationResponse{
  _id: string,
  title: string,
  user_id: string,
  consumer_id: string,
  provider_id: string,
  negotiation_status: string,
  resource_description?: any,
  dpw?: any,
  nlp?: string,
  conflict_status: string,
  negotiations?: string[],
  negotiation_contracts?: string[]
  created_at?: string,
  updated_at?: string,
  original_offer_id?: string
}

const router = express.Router();

const NEGOTIATION_API_BASE_URL = process.env.NEGOTIATION_API_BASE_URL || "https://dips.soton.ac.uk/negotiation-api"
  
const mongoDBObjectToRequest = (docRef: WithId<Document>) => {
    const requestData : RequestData = {
      _id: docRef._id,
      requestName: docRef.requestName,
      description: docRef.description || "",
      extraTerms: docRef.extraTerms || "",
      extraText: docRef.extraText || "",
      emailText: docRef.emailText || "",
      permissions: docRef.permissions,
      selectedOntologies: docRef.selectedOntologies,
      requester: docRef.requester,
      policy: docRef.policy,
      metadata: docRef.metadata || "",
      owners: docRef.owners || [],
      ownersPending: docRef.ownersPending || [],
      ownersAccepted: docRef.ownersAccepted || [],
      ownersRejected: docRef.ownersRejected || []
    }
    return requestData;
}

// Transform consent request to negotiation format
function transformConsentToNegotiation(
  requestData: RequestData,
  consumerId: string,
  providerId: string
) {
  const permissions = requestData.permissions || [];

  // Generate natural language document - use only extra terms text
  const additionalTextFields = [
    requestData.extraTerms,
    requestData.extraText,
  ].filter(Boolean);

  const naturalLanguageDoc = additionalTextFields.join("\n\n");

  // Build custom_clauses from extraTerms and extraText
  const customClauses: { [key: string]: string[] } = {};

  if (requestData.extraTerms) {
    customClauses["data_usage_restrictions"] = requestData.extraTerms
      .split("\n")
      .filter((line: string) => line.trim())
      .map((line: string) => line.trim());
  }

  if (requestData.extraText) {
    customClauses["additional_terms_and_conditions"] = requestData.extraText
      .split("\n\n")
      .filter((para: string) => para.trim())
      .map((para: string) => para.trim().replace(/\n/g, " "));
  }

  // Transform to ODRL policy
  const odrlPermissions = permissions.map((perm) => {
    const permission: any = {
      action:
        perm.actionRefinements?.[0]?.rightOperand || "http://www.w3.org/ns/odrl/2/use",
      target: perm.dataset,
    };

    if (perm.constraintRefinements?.length > 0) {
      permission.constraint = perm.constraintRefinements.map((ref) => ({
        leftOperand: ref.leftOperand,
        operator: "http://www.w3.org/ns/odrl/2/eq",
        rightOperand: ref.rightOperand,
      }));
    }

    if (requestData.requester?.requesterId) {
      permission.assignee = requestData.requester.requesterId;
    }

    return permission;
  });

  let odrlPolicy;
    // Generate generic URI based on request name and timestamp
  const sanitizedTitle = requestData.requestName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Remove multiple consecutive hyphens
    .trim();

  // Use existing ODRL policy if available, otherwise create new one
  if (
    requestData.policy?.["odrl:permission"] ||
    requestData.policy?.permission ||
    requestData.policy?.odrl
  ) {
    // Handle different ODRL policy structures
    let existingPolicy = requestData.policy;

    // If policy is nested under 'odrl' key, extract it
    if (requestData.policy.odrl && !requestData.policy["odrl:permission"]) {
      existingPolicy = requestData.policy.odrl;
    }

    // Use the existing ODRL policy, preserving all original structure
    odrlPolicy = {
      ...existingPolicy,
      // Only merge if we have generated permissions and they don't conflict
      ...(odrlPermissions.length > 0 &&
      !existingPolicy["odrl:permission"] &&
      !existingPolicy.permission
        ? {
            permission: odrlPermissions,
          }
        : {}),
    };
  } else {
    // Create new ODRL policy from consent request data
    odrlPolicy = {
      permission: odrlPermissions,
      prohibition: [],
      uid: `http://upcast-project.eu/policy/${sanitizedTitle}-${Date.now()}`,
      "@context": "http://www.w3.org/ns/odrl.jsonld",
      "@type": "http://www.w3.org/ns/odrl/2/Policy",
    };
  }

  // Extract data type from permissions or ODRL policy if available
  let dataTypeHints: any[] = [];
  if (requestData.policy?.["odrl:permission"]) {
    // Extract action types from ODRL policy
    requestData.policy["odrl:permission"].forEach((perm: any) => {
      const action =
        perm["odrl:action"]?.["rdf:value"]?.["@id"] ||
        perm["odrl:action"]?.["@id"] ||
        perm.action;
      if (action && typeof action === "string") {
        const actionName = action
          .split(/[:#\/]/)
          .pop()
          ?.replace(/_/g, " ");
        if (actionName) dataTypeHints.push(actionName);
      }
    });
  } else if (requestData.permissions?.length > 0) {
    // Extract from legacy permissions
    requestData.permissions.forEach((perm: any) => {
      if (perm.dataset) dataTypeHints.push("dataset");
      if (perm.actionRefinements?.length > 0) {
        perm.actionRefinements.forEach((ref: any) => {
          if (ref.value) dataTypeHints.push(ref.value);
        });
      }
    });
  }

  // Extract geographic scope from constraints if available
  let geographicScope = null;
  if (requestData.policy?.["odrl:permission"]) {
    for (const perm of requestData.policy["odrl:permission"]) {
      if (perm["odrl:constraint"]) {
        for (const constraint of perm["odrl:constraint"]) {
          const leftOp = constraint["odrl:leftOperand"]?.["@id"];
          if (
            leftOp &&
            (leftOp.includes("location") ||
              leftOp.includes("geographic") ||
              leftOp.includes("region"))
          ) {
            geographicScope = constraint["odrl:rightOperand"];
            break;
          }
        }
      }
      if (geographicScope) break;
    }
  }

  // Generate tags from ontologies and data types
  let tags: any[] = [];
  if (requestData.selectedOntologies?.length > 0) {
    tags = requestData.selectedOntologies.map((o) => o.name);
  }
  if (dataTypeHints.length > 0) {
    // Add unique data type hints
    const uniqueHints = [...new Set(dataTypeHints)];
    tags = tags.concat(uniqueHints);
  }

  const basePolicy = {
    title: requestData.requestName,
    type: "request",
    consumer_id: consumerId,
    provider_id: providerId,
    request_id: requestData._id,
    data_processing_workflow_object: {},
    natural_language_document: naturalLanguageDoc,
    resource_description_object: {
      // title: requestData.requestName,
      price: 0,
      // price_unit: "EUR/Month",
      // uri: `http://upcast-project.eu/dataset/${sanitizedTitle}`,
      // policy_url: "",
      // environmental_cost_of_generation: {},
      // environmental_cost_of_serving: {},
      // description: requestData.description || "",
      // type_of_data: dataTypeHints.length > 0 ? dataTypeHints.join(", ") : "",
      // data_format: "", // Could be extracted from metadata if available
      // data_size: "", // Could be extracted from metadata if available
      // geographic_scope: geographicScope,
      // tags: tags.length > 0 ? tags.join(", ") : "consent-request",
      // publisher: requestData.requester?.requesterName || null,
      // theme: null, // Could be inferred from purpose refinements
      // distribution: null, // Could be extracted from action refinements
    },
    odrl_policy: {
      odrl: odrlPolicy,
      ...(Object.keys(customClauses).length > 0 ? customClauses : {}),
    },
  };

  const offerPolicy = {
    ...basePolicy,
    type: "offer",
  };

  return {
    initial_offer: offerPolicy,
    initial_request: basePolicy,
    negotiation_status: "pending",
    title: requestData.requestName,
    consumer_id: consumerId,
    provider_id: providerId,
    data_processing_workflow_object: {},
    natural_language_document: naturalLanguageDoc,
    resource_description_object: basePolicy.resource_description_object,
  };
}

// POST /api/negotiations/create-with-initial - Create negotiation from consent request
router.post("/create-with-initial", async (req, res) => {
  try {
    const { requestId, consumerId, providerId } = req.body;
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        error: "Authorization token required",
        success: false,
      });
    }

    if (!requestId || !consumerId || !providerId) {
      return res.status(400).json({
        error: "requestId, consumerId, and providerId are required",
        success: false,
      });
    }

    // Fetch the consent request from MongoDB
    const docRef = await db.collection("requests").findOne({_id: {$eq: requestId}});

    if (!docRef) {
      return res.status(404).json({
        error: "Request not found",
        success: false,
      });
    }

    const requestData = mongoDBObjectToRequest(docRef);

    // Transform consent request to negotiation format
    const negotiationRequest = transformConsentToNegotiation(
      requestData,
      consumerId,
      providerId
    );

    // Send to negotiation API
    const response = await fetch(
      `${NEGOTIATION_API_BASE_URL}/negotiation/create-with-initial`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(negotiationRequest),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Negotiation API error: ${response.status} - ${errorText}`
      );
    }

    const result = (await response.json()) as NegotiationCreationResponse;

    const negotiationId = result.negotiation_id;

    // Update the request status to indicate it's been sent to negotiation
    const update = await docRef.updateOne({'_id':new ObjectId(requestId)}, {$set: {
      negotiationId: negotiationId,
      negotiationStatus: "sent",
      sentToNegotiationAt: new Date().toISOString(),
    }});

    if (!update) {
      console.log("Failed to update request: ", requestData._id);
    }

    res.json({
      success: true,
      negotiation: result,
      message: "Negotiation created successfully",
    });
  } catch (error: any) {
    console.error("Error creating negotiation:", error);
    res.status(500).json({
      error: error.message || "Failed to create negotiation",
      success: false,
    });
  }
});

// POST /api/negotiations/create-accepted - Create negotiation in accepted state
router.post("/create-accepted", async (req, res) => {
  console.log("=== STARTING ACCEPTED NEGOTIATION CREATION ===");
  console.log("Timestamp:", new Date().toISOString());

  try {
    const { requestId, consumerId, providerId } = req.body;
    const token = req.headers.authorization?.replace("Bearer ", "");

    console.log("Received request parameters:", {
      requestId,
      consumerId,
      providerId,
      hasToken: !!token,
      tokenLength: token?.length || 0,
    });

    if (!token) {
      console.log("VALIDATION FAILED: No authorization token provided");
      return res.status(401).json({
        error: "Authorization token required",
        success: false,
      });
    }

    if (!requestId || !consumerId || !providerId) {
      console.log("VALIDATION FAILED: Missing required parameters", {
        hasRequestId: !!requestId,
        hasConsumerId: !!consumerId,
        hasProviderId: !!providerId,
      });
      return res.status(400).json({
        error: "requestId, consumerId, and providerId are required",
        success: false,
      });
    }

    console.log("VALIDATION PASSED: All required parameters present");

    const docRef = await db.collection("requests").findOne({_id: {$eq: new ObjectId(requestId)}});

    if (!docRef) {
      console.log("MONGODB ERROR: Request document not found in MongoDB");
      return res.status(404).json({
        error: "Request not found",
        success: false,
      });
    }

    const requestData = mongoDBObjectToRequest(docRef);

    const negotiationRequest = transformConsentToNegotiation(
      requestData,
      consumerId,
      providerId
    );

    // Add accepted status to the negotiation request
    const finalNegotiationRequest = {
      ...negotiationRequest,
      negotiation_status: "requested",
    };

    console.log("✅ TRANSFORMATION SUCCESS: Negotiation request created:", {
      title: finalNegotiationRequest.title,
      type: finalNegotiationRequest.initial_request?.type,
      consumerId: finalNegotiationRequest.consumer_id,
      providerId: finalNegotiationRequest.provider_id,
      negotiationStatus: finalNegotiationRequest.negotiation_status,
      hasInitialOffer: !!finalNegotiationRequest.initial_offer,
      hasInitialRequest: !!finalNegotiationRequest.initial_request,
      hasOdrlPolicy:
        !!finalNegotiationRequest.initial_request?.odrl_policy?.odrl,
    });

    // Log the complete request body (but mask sensitive data)
    const apiUrl = `${NEGOTIATION_API_BASE_URL}/negotiation/create-with-initial`;

    // Send to negotiation API with accepted status
    console.log("STEP 5: Sending request to external negotiation API...");
    const response = await fetch(apiUrl,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalNegotiationRequest),
      }
    );

    // console.log("📦 === FULL NEGOTIATION PAYLOAD ===");
    // console.log(JSON.stringify(finalNegotiationRequest, null, 2));
    // console.log("📦 === END OF PAYLOAD ===");

    // const payloadPath = path.join(process.cwd(), "negotiation_payload.txt");
    // fs.writeFileSync(
    //   payloadPath,
    //   JSON.stringify(finalNegotiationRequest, null, 2),
    //   "utf8"
    // );

    // console.log(`💾 Payload saved to: ${payloadPath}`);

    console.log("EXTERNAL API RESPONSE:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      url: response.url,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("EXTERNAL API ERROR:", {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText,
        requestPayload: JSON.stringify(finalNegotiationRequest, null, 2),
      });

      return res.status(response.status).json({
        success: false,
        error: "Negotiation API failed",
        details: errorText, // 👈 include raw API response
      });
    }

    const result = (await response.json()) as NegotiationCreationResponse;
    console.log("EXTERNAL API SUCCESS:", {
      responseBody: result,
      negotiationId: result.negotiation_id || "NOT_FOUND_IN_RESPONSE",
      hasId: !!result.negotiation_id,
    });

    // Update the request status to indicate it's been sent to negotiation as accepted
    console.log("🔍 STEP 6: Updating Firebase with negotiation result...");
    const negotiationId = result.negotiation_id;

    if (!negotiationId) {
      console.log(
        "WARNING: No negotiation ID found in API response, but proceeding with update"
      );
    } else {
    }

    const updateData = {
      negotiationId: negotiationId,
      negotiationStatus: "requested",
      acceptedNegotiationAt: new Date().toISOString(),
    };

    const update = await db.collection("requests").updateOne({_id: {$eq: new ObjectId(requestId)}},{$set: updateData});

    if (update) {
      console.log(
        "Request document updated with negotiation info"
      );
    }
    else {
      console.log("Failed to update request.")
    }
    

    const finalResponse = {
      success: true,
      negotiation: result,
      message: "Accepted negotiation created successfully",
    };

    console.log("=== NEGOTIATION CREATION COMPLETED SUCCESSFULLY ===");
    console.log("Final response:", finalResponse);
    console.log("End timestamp:", new Date().toISOString());

    res.json(finalResponse);
  } catch (error: any) {
    console.error("=== NEGOTIATION CREATION FAILED ===");
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
    });
    console.error("Error timestamp:", new Date().toISOString());

    res.status(500).json({
      error: error.message || "Failed to create accepted negotiation",
      success: false,
    });
  }
});

// GET /api/negotiations/by-request/:requestId - Get negotiation ID and provider info by consent request ID
router.get("/by-request/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;

    if (!requestId) {
      return res.status(400).json({
        error: "requestId is required",
        success: false,
      });
    }

    // Fetch the consent request from Firebase
    const docRef = await db.collection("requests").findOne({_id: {$eq: new ObjectId(requestId)}});

    if (!docRef) {
      return res.status(404).json({
        error: "Request not found",
        success: false,
      });
    }

    const requestData = docRef;
    const negotiationId = requestData?.negotiationId;

    // If negotiation exists, fetch provider details from negotiation API
    let providerMongoId = null;
    let providerEmail = null;

    if (negotiationId) {
      try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        const negotiationResponse = await fetch(
          `${NEGOTIATION_API_BASE_URL}/negotiation/${negotiationId}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (negotiationResponse.ok) {
          const negotiationData = (await negotiationResponse.json()) as NegotiationResponse;
          providerMongoId = negotiationData.provider_id;

          // Get provider Firebase ID and email from requesters collection
          if (providerMongoId) {
            const requestersSnapshot = await db
              .collection("users")
              .findOne({_id: {$eq: new ObjectId(providerMongoId)}});

            if (requestersSnapshot) {
              providerEmail = requestersSnapshot.email;
            }
          }
        }
      } catch (error) {
        console.warn("Could not fetch provider details from negotiation:", error);
      }
    }

    res.json({
      success: true,
      requestId: requestId,
      negotiationId: negotiationId || null,
      negotiationStatus: requestData?.negotiationStatus || null,
      sentToNegotiationAt: requestData?.sentToNegotiationAt || null,
      acceptedNegotiationAt: requestData?.acceptedNegotiationAt || null,
      providerMongoId: providerMongoId,
      providerEmail: providerEmail,
    });
  } catch (error: any) {
    console.error("Error fetching negotiation by request ID:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch negotiation information",
      success: false,
    });
  }
});

router.get("/get-requests/:ownerId", async (req, res) => {
  try {
    const { ownerId } = req.params;
    let token = null;

    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.substring(7);
    }
    const requests = await fetch(`${NEGOTIATION_API_BASE_URL}/providers/${ownerId}/negotiations`,
      {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token},`
          },
        }
    )
    res.json(
      {
        "status": requests.ok,
        ...requests.json()
      }
    )
  } catch (apiError: any) {
      console.error("Request retrieval from Negotiation API failed:", {
        error: apiError.message,
        stack: apiError.stack,
      });
  } 
});

export default router;