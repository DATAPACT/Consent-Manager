import express from "express";
import { db } from "../config/firebase.js";
import fs from "fs";
import path from "path";

const router = express.Router();

// GET /api/external/users - Proxy to external API for user list
router.get("/users", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        error: "Authorization token required",
        success: false,
      });
    }

    const response = await fetch(
      "https://dips.soton.ac.uk/negotiation-api/users_list",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const users = await response.json();

    res.json({
      success: true,
      users,
    });
  } catch (error: any) {
    console.error("Error fetching external users:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch users from external API",
      success: false,
    });
  }
});

// GET /api/external/user-details - Proxy to external API for user details
router.get("/user-details", async (req, res) => {
  try {
    const { user_id } = req.query;
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        error: "Authorization token required",
        success: false,
      });
    }

    const url = user_id
      ? `https://dips.soton.ac.uk/negotiation-api/user/details/?user_id=${user_id}`
      : "https://dips.soton.ac.uk/negotiation-api/user/details/";

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const userDetails = await response.json();

    res.json({
      success: true,
      user: userDetails,
    });
  } catch (error: any) {
    console.error("Error fetching external user details:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch user details from external API",
      success: false,
    });
  }
});

// Interfaces for request transformation
interface Refinement {
  name: string;
  value: string;
}

interface RequestData {
  requestName: string;
  description?: string;
  extraTerms?: string;
  extraText?: string;
  additionalInfo?: string;
  notes?: string;
  text?: string;
  permissions: {
    dataset: string;
    datasetRefinements: Refinement[];
    purposeRefinements: Refinement[];
    actionRefinements: Refinement[];
    constraintRefinements: Refinement[];
  }[];
  selectedOntologies: {
    id: string;
    name: string;
  }[];
  requester?: {
    requesterId: string;
    requesterName: string;
    requesterEmail: string;
  };
  policy?: any;
  metadata?: any;
}

// Get MongoDB user ID from Firebase user data
async function getMongoUserIdFromFirebase(
  firebaseUid: string
): Promise<string | null> {
  console.log(`🔍 Looking up MongoDB user ID for Firebase UID: ${firebaseUid}`);

  try {
    // Check both owners and requesters collections
    console.log("📋 Checking owners collection...");
    const ownerDoc = await db.collection("owners").doc(firebaseUid).get();
    if (ownerDoc.exists) {
      const data = ownerDoc.data();
      const mongoUserId = data?.mongoUserId || null;
      console.log(`✅ Found in owners collection:`, {
        firebaseUid,
        mongoUserId,
        hasMongoUserId: !!mongoUserId,
        userData: {
          name: data?.name,
          email: data?.email,
          role: data?.role,
        },
      });
      return mongoUserId;
    }

    console.log("📋 Not found in owners, checking requesters collection...");
    const requesterDoc = await db
      .collection("requesters")
      .doc(firebaseUid)
      .get();
    if (requesterDoc.exists) {
      const data = requesterDoc.data();
      const mongoUserId = data?.mongoUserId || null;
      console.log(`✅ Found in requesters collection:`, {
        firebaseUid,
        mongoUserId,
        hasMongoUserId: !!mongoUserId,
        userData: {
          name: data?.name,
          email: data?.email,
          role: data?.role,
        },
      });
      return mongoUserId;
    }

    console.log(
      `❌ Firebase UID ${firebaseUid} not found in either owners or requesters collections`
    );
    return null;
  } catch (error) {
    console.error(
      `❌ Error fetching MongoDB user ID for ${firebaseUid}:`,
      error
    );
    return null;
  }
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
    requestData.additionalInfo,
    requestData.notes,
    requestData.text,
  ].filter(Boolean);

  const naturalLanguageDoc = additionalTextFields.join("\n\n");

  // Transform to ODRL policy
  const odrlPermissions = permissions.map((perm) => {
    const permission: any = {
      action:
        perm.actionRefinements?.[0]?.value || "http://www.w3.org/ns/odrl/2/use",
      target: perm.dataset,
    };

    if (perm.constraintRefinements?.length > 0) {
      permission.constraint = perm.constraintRefinements.map((ref) => ({
        leftOperand: ref.name,
        operator: "http://www.w3.org/ns/odrl/2/eq",
        rightOperand: ref.value,
      }));
    }

    if (requestData.requester?.requesterId) {
      permission.assignee = requestData.requester.requesterId;
    }

    return permission;
  });

  let odrlPolicy;

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

  // Generate generic URI based on request name and timestamp
  const sanitizedTitle = requestData.requestName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Remove multiple consecutive hyphens
    .trim();

  // Extract data type from permissions or ODRL policy if available
  let dataTypeHints = [];
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
  let tags = [];
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
    data_processing_workflow_object: {},
    natural_language_document: naturalLanguageDoc,
    resource_description_object: {
      title: requestData.requestName,
      price: 0,
      price_unit: "EUR/Month",
      uri: `http://upcast-project.eu/dataset/${sanitizedTitle}`,
      policy_url: "",
      environmental_cost_of_generation: {},
      environmental_cost_of_serving: {},
      description: requestData.description || "",
      type_of_data: dataTypeHints.length > 0 ? dataTypeHints.join(", ") : "",
      data_format: "", // Could be extracted from metadata if available
      data_size: "", // Could be extracted from metadata if available
      geographic_scope: geographicScope,
      tags: tags.length > 0 ? tags.join(", ") : "consent-request",
      publisher: requestData.requester?.requesterName || null,
      theme: null, // Could be inferred from purpose refinements
      distribution: null, // Could be extracted from action refinements
    },
    odrl_policy: {
      odrl: odrlPolicy,
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

// POST /api/external/negotiation/create-with-initial - Create negotiation from consent request
router.post("/negotiation/create-with-initial", async (req, res) => {
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

    // Fetch the consent request from Firebase
    const docRef = await db.collection("requests").doc(requestId).get();

    if (!docRef.exists) {
      return res.status(404).json({
        error: "Request not found",
        success: false,
      });
    }

    const requestData = docRef.data() as RequestData;

    // Transform consent request to negotiation format
    const negotiationRequest = transformConsentToNegotiation(
      requestData,
      consumerId,
      providerId
    );

    // Send to negotiation API
    const response = await fetch(
      "https://dips.soton.ac.uk/negotiation-api/negotiation/create-with-initial",
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

    const result = await response.json();

    const negotiationId = result.id || result.negotiation_id;

    // Update the request status to indicate it's been sent to negotiation
    await db.collection("requests").doc(requestId).update({
      negotiationId: negotiationId,
      negotiationStatus: "sent",
      sentToNegotiationAt: new Date().toISOString(),
    });

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

// POST /api/external/negotiation/create-accepted - Create negotiation in accepted state
router.post("/negotiation/create-accepted", async (req, res) => {
  console.log("\n🚀 === STARTING ACCEPTED NEGOTIATION CREATION ===");
  console.log("⏰ Timestamp:", new Date().toISOString());

  try {
    const { requestId, consumerId, providerId } = req.body;
    const token = req.headers.authorization?.replace("Bearer ", "");

    console.log("📥 Received request parameters:", {
      requestId,
      consumerId,
      providerId,
      hasToken: !!token,
      tokenLength: token?.length || 0,
    });

    if (!token) {
      console.log("❌ VALIDATION FAILED: No authorization token provided");
      return res.status(401).json({
        error: "Authorization token required",
        success: false,
      });
    }

    if (!requestId || !consumerId || !providerId) {
      console.log("❌ VALIDATION FAILED: Missing required parameters", {
        hasRequestId: !!requestId,
        hasConsumerId: !!consumerId,
        hasProviderId: !!providerId,
      });
      return res.status(400).json({
        error: "requestId, consumerId, and providerId are required",
        success: false,
      });
    }

    console.log("✅ VALIDATION PASSED: All required parameters present");

    // Fetch the consent request from Firebase
    console.log("🔍 STEP 1: Fetching consent request from Firebase...");
    const docRef = await db.collection("requests").doc(requestId).get();

    if (!docRef.exists) {
      console.log("❌ FIREBASE ERROR: Request document not found in Firebase");
      return res.status(404).json({
        error: "Request not found",
        success: false,
      });
    }

    const requestData = docRef.data() as RequestData;
    console.log("✅ FIREBASE SUCCESS: Request found:", {
      requestName: requestData.requestName,
      // status: requestData.status,
      // existingNegotiationId: requestData.negotiationId || "NONE",
      hasPolicy: !!requestData.policy,
      hasPermissions: !!requestData.permissions?.length,
      hasRequester: !!requestData.requester,
    });

    // Get MongoDB user IDs from Firebase
    console.log("🔍 STEP 2: Converting Firebase UIDs to MongoDB ObjectIds...");
    const mongoConsumerId = consumerId;
    const mongoProviderId = providerId;

    console.log("🔄 User ID conversion results:", {
      originalConsumerId: consumerId,
      originalProviderId: providerId,
      mongoConsumerId,
      mongoProviderId,
      consumerConversionSuccessful: !!mongoConsumerId,
      providerConversionSuccessful: !!mongoProviderId,
    });

    if (!mongoConsumerId) {
      console.log("❌ USER ID ERROR: MongoDB user ID not found for consumer");
      return res.status(400).json({
        error: `MongoDB user ID not found for consumer (Mongo UID: ${consumerId}). User may not be registered with the negotiation API.`,
        success: false,
      });
    }

    if (!mongoProviderId) {
      console.log("❌ USER ID ERROR: MongoDB user ID not found for provider");
      return res.status(400).json({
        error: `MongoDB user ID not found for provider (Mongo UID: ${providerId}. User may not be registered with the negotiation API.`,
        success: false,
      });
    }

    console.log("✅ USER ID SUCCESS: Both MongoDB user IDs found");

    // Transform consent request to negotiation format
    console.log(
      "🔍 STEP 3: Transforming consent request to negotiation format..."
    );
    const negotiationRequest = transformConsentToNegotiation(
      requestData,
      mongoConsumerId,
      mongoProviderId
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
    console.log("📤 STEP 4: Preparing API request...");
    console.log(
      "🔑 Token being used:",
      token
        ? `${token.substring(0, 20)}...${token.slice(-10)}`
        : "No token provided"
    );
    console.log(
      "🌐 API endpoint: https://dips.soton.ac.uk/negotiation-api/negotiation/create-with-initial"
    );
    console.log(
      "📋 Request payload size:",
      JSON.stringify(finalNegotiationRequest).length,
      "bytes"
    );

    // Send to negotiation API with accepted status
    console.log("📡 STEP 5: Sending request to external negotiation API...");
    const response = await fetch(
      "https://dips.soton.ac.uk/negotiation-api/negotiation/create-with-initial",
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

    console.log("📡 EXTERNAL API RESPONSE:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      url: response.url,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ EXTERNAL API ERROR:", {
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

    const result = await response.json();
    console.log("✅ EXTERNAL API SUCCESS:", {
      responseBody: result,
      negotiationId:
        result.id || result.negotiation_id || "NOT_FOUND_IN_RESPONSE",
      hasId: !!(result.id || result.negotiation_id),
    });

    // Update the request status to indicate it's been sent to negotiation as accepted
    console.log("🔍 STEP 6: Updating Firebase with negotiation result...");
    const negotiationId = result.id || result.negotiation_id;

    if (!negotiationId) {
      console.log(
        "⚠️  WARNING: No negotiation ID found in API response, but proceeding with update"
      );
    } else {
    }

    const updateData = {
      negotiationId: negotiationId,
      negotiationStatus: "requested",
      acceptedNegotiationAt: new Date().toISOString(),
    };

    console.log("📝 Firebase update data:", updateData);

    await db.collection("requests").doc(requestId).update(updateData);

    console.log(
      "✅ FIREBASE UPDATE SUCCESS: Request document updated with negotiation info"
    );

    const finalResponse = {
      success: true,
      negotiation: result,
      message: "Accepted negotiation created successfully",
    };

    console.log("🎉 === NEGOTIATION CREATION COMPLETED SUCCESSFULLY ===");
    console.log("📤 Final response:", finalResponse);
    console.log("⏰ End timestamp:", new Date().toISOString());

    res.json(finalResponse);
  } catch (error: any) {
    console.error("💥 === NEGOTIATION CREATION FAILED ===");
    console.error("❌ Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
    });
    console.error("⏰ Error timestamp:", new Date().toISOString());

    res.status(500).json({
      error: error.message || "Failed to create accepted negotiation",
      success: false,
    });
  }
});

// GET /api/external/negotiation/by-request/:requestId - Get negotiation ID by consent request ID
router.get("/negotiation/by-request/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;

    if (!requestId) {
      return res.status(400).json({
        error: "requestId is required",
        success: false,
      });
    }

    // Fetch the consent request from Firebase
    const docRef = await db.collection("requests").doc(requestId).get();

    if (!docRef.exists) {
      return res.status(404).json({
        error: "Request not found",
        success: false,
      });
    }

    const requestData = docRef.data();

    res.json({
      success: true,
      requestId: requestId,
      negotiationId: requestData?.negotiationId || null,
      negotiationStatus: requestData?.negotiationStatus || null,
      sentToNegotiationAt: requestData?.sentToNegotiationAt || null,
      acceptedNegotiationAt: requestData?.acceptedNegotiationAt || null,
    });
  } catch (error: any) {
    console.error("Error fetching negotiation by request ID:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch negotiation information",
      success: false,
    });
  }
});

export default router;
