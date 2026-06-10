import express from "express";
import { db } from "../../src/services/database.service.ts";
import { Collection, ObjectId } from "mongodb";
import { permissionsToODRLPolicy } from "../../src/utils/policyParser.js";
import { verify } from "../config/keycloak.ts";
import { RequestEmail } from "../../emails/templates/requestDetails.tsx";
import { sendTestEmail } from "../config/nodemailer.ts";
import { jwtVerify, SignJWT } from "jose";

const router = express.Router();
const secret = new TextEncoder().encode(process.env.EMAIL_LINK_SECRET!);

interface PolicyPermission {
  dataset: string;
  action: string;
  purpose: string;
  datasetRefinements: any[];
  actionRefinements: any[];
  purposeRefinements: any[];
  constraintRefinements: any[];
  constraints?: Array<{
    leftOperand: string;
    operator: string;
    rightOperand: any;
    description: string;
  }>;
  assignees?: Array<{
    source: string;
    refinements?: Array<{
      leftOperand: string;
      operator: string;
      rightOperand: any;
      description: string;
    }>;
  }>;
}

interface RequestData {
  _id: ObjectId;
  requestName: string;
  description?: string;
  extraTerms?: string;
  extraText?: string;
  permissions: PolicyPermission[];
  selectedOntologies: {
    _id: string;
    name: string;
  }[];
  requester?: {
    requesterId: string;
    requesterName: string;
    requesterEmail: string;
  };
  policy?: any; // ODRL policy JSON
  metadata?: any; // Additional metadata like audit request ID
  createdAt?: string;
  sentAt?: string;
  status?: string;
  owners: string[];
  ownersPending: string[];
  ownersAccepted: string[];
  ownersRejected: string[];
}

// POST /api/requests - Create a new request
router.post("/", async (req, res) => {
  try {
    const data: RequestData = req.body;
    const now = new Date();

    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    if (!req.headers.authorization?.startsWith("Bearer ")) {
          return res.status(401).json({
            success: false,
            error: "Missing bearer token",
          });
        }
    
    const token = req.headers.authorization.substring(7);
    const verification = await verify(token);

    if (!verification) {
      return res.status(401).json({
        error: "Invalid token",
        success: false,
      });
    }

    // If requester info is not provided in the request body,
    // you'll need to implement authentication middleware
    if (!data.requester) {
      return res.status(400).json({
        error: "Requester information is required",
        success: false,
      });
    }

    let odrlPolicy = null;
    if (data.policy) {
      odrlPolicy = data.policy;
    }
    else {
      odrlPolicy = permissionsToODRLPolicy("", "", data.requester.requesterId, data.permissions);
    }
  
    const requestWithDefaults = {
      ...data,
      selectedOntologies: data.selectedOntologies.map(({ _id, name }) => ({
        _id,
        name,
      })),
      createdAt: `${days[now.getDay()]} ${now
        .getDate()
        .toString()
        .padStart(2, "0")} ${months[now.getMonth()]} ${now.getFullYear()} ${now
        .getHours()
        .toString()
        .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
      sentAt: "",
      status: "draft",
      policy: odrlPolicy,
      owners: [],
      ownersAccepted: [],
      ownersRejected: [],
      ownersPending: [],
    };

    const docRef = await db.collection("requests").insertOne(requestWithDefaults);

    res.status(201).json({
      id: docRef.insertedId,
      success: true,
      message: "Request created successfully",
    });
  } catch (error) {
    console.error("Error adding request:", error);
    res.status(500).json({
      error: "Failed to create request",
      success: false,
    });
  }
});

// GET /api/requests/:id - Get a specific request
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("GET /api/requests/:id called with id:", id);
    const docRef = db.collection("requests");
    const docSnap = await docRef.findOne({'_id':new ObjectId(id)});

    if (!docSnap) {
      console.error("Request document NOT found for id:", id);
      return res.status(404).json({
        error: "Request not found",
        success: false,
      });
    }

    const requestData = docSnap;

    res.json({
      id: docSnap._id,
      data: requestData,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching request:", error);
    res.status(500).json({
      error: "Failed to fetch request",
      success: false,
    });
  }
});

// PUT /api/requests/:id - Update a request
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {_id, ...updateData} = req.body;

    // Check if request exists
    const docRef = db.collection("requests");
    const docSnap = await docRef.updateOne({'_id':new ObjectId(id)}, {$set: updateData});

    if (!docSnap) {
      return res.status(404).json({
        error: "Request not found",
        success: false,
      });
    }

    res.json({
      id,
      success: true,
      message: "Request updated successfully",
    });
  } catch (error) {
    console.error("Error updating request:", error);
    res.status(500).json({
      error: "Failed to update request",
      success: false,
    });
  }
});

//GET /api/requests/:id/accept/:uid Accept a request through an email link.
router.get("/:id/accept/:uid" , async (req, res) => {
  try {
    const { id, uid } = req.params;
    let token = null;
    let verification = null;

    if (req.query && req.query.token) {
      token = req.query.token.toString();
      try {
        const { payload } = await jwtVerify(token, secret);
        if (!payload) {
          return res.status(401).json({
            error: "Invalid token",
            success: false,
          });
        }
        if (payload.userId !== uid) {
          return res.status(403).json({
            error: "Token user id mismatch.",
            success: false,
          });
        }
        if (payload.requestId !== id) {
          return res.status(403).json({
            error: "Token request id mismatch.",
            success: false,
          });
        }
        verification = {_id: payload.userId, requestId: payload.requestId };
      }
      catch (error) {
        return res.status(401).json({
          error: "Invalid token",
          success: false,
        });
      }  
    }

    if (!verification) {
      return res.status(401).json({
        error: "Invalid token",
        success: false,
      });
    }

    const userId = verification._id;

    // Check if request exists
    const docRef = db.collection("requests");
    const requestDoc = await docRef.findOne({'_id':new ObjectId(id)});

    if (!requestDoc) {
      return res.status(404).json({
        error: "Request not found",
        success: false,
      });
    }

    let owners : Array<string> = requestDoc.owners;
    let ownersPending : Array<string> = requestDoc.ownersPending;
    let ownersAccepted : Array<string> = requestDoc.ownersAccepted;
    let ownersRejected : Array<string> = requestDoc.ownersRejected;

    const validOwner = owners.some((owner: { toString: () => string; }) => owner === userId);
    const ownerPending = ownersPending.some((owner: { toString: () => string; }) => owner === userId);
    const ownerAccepted = ownersAccepted.some((owner: { toString: () => string; }) => owner === userId);
    const ownerRejected = ownersRejected.some((owner: { toString: () => string; }) => owner === userId);

    if (!validOwner || !ownerPending) {
      console.log(`User not valid`);
      return res
        .status(403)
        .json({ success: false, error: "User not pending" });
    }

    if (ownerAccepted || ownerRejected) { // This logic could change if we want to allow owners who rejected to then accept.
      console.log(`User not pending`);
      return res
        .status(409)
        .json({ success: false, error: "User not pending, or has already accepted or rejected" });
    }

    ownersPending = ownersPending.filter((owner) => owner !== userId);
    ownersAccepted.push(userId);

    const update = await docRef.updateOne({'_id': new ObjectId(id)}, {$set: {owners, ownersPending, ownersAccepted, ownersRejected}});

    if (update){
      return res.json({
        id,
        success: true,
        message: "Request updated successfully",
      });
    }
    else {
      return res.status(500).json({
        error: "Failed to update request",
        success: false,
      });
    }
    
  } catch (error) {
    console.error("Error updating request:", error);
    res.status(500).json({
      error: "Failed to update request",
      success: false,
    });
  }
});

//GET /api/requests/:id/reject/:uid Reject a request through an email link.
router.get("/:id/accept/:uid" , async (req, res) => {
  try {
    const { id, uid } = req.params;
    let token = null;
    let verification = null;

    if (req.query && req.query.token) {
      token = req.query.token.toString();
      try {
        const { payload } = await jwtVerify(token, secret);
        if (!payload) {
          return res.status(401).json({
            error: "Invalid token",
            success: false,
          });
        }
        console.log("Token payload is:");
        console.log(payload.userId);
        console.log(payload.requestId);
        console.log(payload.action);
        if (payload.userId !== uid) {
          return res.status(403).json({
            error: `Token user id mismatch. Token has ${payload.userId}, expected ${uid}`,
            success: false,
          });
        }
        if (payload.requestId !== id) {
          return res.status(403).json({
            error: `Token request id mismatch. Token ${payload.requestId}, expected ${id}`,
            success: false,
          });
        }
        
        verification = {_id: payload.userId, requestId: payload.requestId };
      }
      catch (error) {
        return res.status(401).json({
          error: "Invalid token",
          success: false,
        });
      }  
    }

    if (!verification) {
      return res.status(401).json({
        error: "Invalid token",
        success: false,
      });
    }

    const userId = verification._id;

    // Check if request exists
    const docRef = db.collection("requests");
    const requestDoc = await docRef.findOne({'_id':new ObjectId(id)});

    if (!requestDoc) {
      return res.status(404).json({
        error: "Request not found",
        success: false,
      });
    }

    let owners : Array<string> = requestDoc.owners;
    let ownersPending : Array<string> = requestDoc.ownersPending;
    let ownersAccepted : Array<string> = requestDoc.ownersAccepted;
    let ownersRejected : Array<string> = requestDoc.ownersRejected;

    const validOwner = owners.some((owner: { toString: () => string; }) => owner === userId);
    const ownerPending = ownersPending.some((owner: { toString: () => string; }) => owner === userId);
    const ownerAccepted = ownersAccepted.some((owner: { toString: () => string; }) => owner === userId);
    const ownerRejected = ownersRejected.some((owner: { toString: () => string; }) => owner === userId);

    if (!validOwner || ownerRejected ) {
      console.log(`User not found`);
      return res
        .status(403)
        .json({ success: false, error: "User not associated with this request." });
    }
    else if (ownerRejected) {
      return res
      .status(409)
      .json({ success: false, error: "User has already rejected this request."})
    }

    if (ownerPending || ownerAccepted) { //REJECT or REVOKE cases
      ownersPending = ownersPending.filter((owner) => owner !== userId);
      ownersAccepted = ownersAccepted.filter((owner) => owner !== userId);
      ownersRejected.push(userId);
    }
    else {
      return res
      .status(500)
      .json({ success: false, error: "Inconsistency error"})
    }

    const update = await docRef.updateOne({'_id': new ObjectId(id)}, {$set: {owners, ownersPending, ownersAccepted, ownersRejected}});

    if (update){
      return res.json({
        id,
        success: true,
        message: "Request updated successfully",
      });
    }
    else {
      return res.status(500).json({
        error: "Failed to update request",
        success: false,
      });
    }
    
  } catch (error) {
    console.error("Error updating request:", error);
    res.status(500).json({
      error: "Failed to update request",
      success: false,
    });
  }
});

//POST /api/requests/:id/accept - Accept a specific request
router.post("/:id/accept", async (req, res) => {
  try {
    const { id } = req.params;
    let token = null;
    let verification = null;
    let user_email = null;

    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.substring(7);
      const verification = await verify(token);

      if (!verification) {
        return res.status(401).json({
          error: "Invalid token",
          success: false,
        });
      }

      user_email = verification.email;
    }
    
    if (!req.headers.authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Missing bearer token",
      });
    }

    if (!verification) {
      return res.status(401).json({
        error: "Invalid token",
        success: false,
      });
    }

    const userDoc = await db.collection("users").findOne({'username_email': {$eq: user_email}});

    if (!userDoc) {
      return res.status(404).json({
        error: "User not found",
        success: false,
      });
    }
    const userId = userDoc._id.toString();

    // Check if request exists
    const docRef = db.collection("requests");
    const requestDoc = await docRef.findOne({'_id':new ObjectId(id)});

    if (!requestDoc) {
      return res.status(404).json({
        error: "Request not found",
        success: false,
      });
    }

    let owners : Array<string> = requestDoc.owners;
    let ownersPending : Array<string> = requestDoc.ownersPending;
    let ownersAccepted : Array<string> = requestDoc.ownersAccepted;
    let ownersRejected : Array<string> = requestDoc.ownersRejected;

    const validOwner = owners.some((owner: { toString: () => string; }) => owner === userId);
    const ownerPending = ownersPending.some((owner: { toString: () => string; }) => owner === userId);
    const ownerAccepted = ownersAccepted.some((owner: { toString: () => string; }) => owner === userId);
    const ownerRejected = ownersRejected.some((owner: { toString: () => string; }) => owner === userId);

    if (!validOwner || !ownerPending) {
      console.log(`User not valid`);
      return res
        .status(403)
        .json({ success: false, error: "User not pending" });
    }

    if (ownerAccepted || ownerRejected) { // This logic could change if we want to allow owners who rejected to then accept.
      console.log(`User not pending`);
      return res
        .status(409)
        .json({ success: false, error: "User not pending, or has already accepted or rejected" });
    }

    ownersPending = ownersPending.filter((owner) => owner !== userId);
    ownersAccepted.push(userId);

    const update = await docRef.updateOne({'_id': new ObjectId(id)}, {$set: {owners, ownersPending, ownersAccepted, ownersRejected}});

    if (update){
      return res.json({
        id,
        success: true,
        message: "Request updated successfully",
      });
    }
    else {
      return res.status(500).json({
        error: "Failed to update request",
        success: false,
      });
    }
    
  } catch (error) {
    console.error("Error updating request:", error);
    res.status(500).json({
      error: "Failed to update request",
      success: false,
    });
  }
});

//POST /api/requests/:id/reject - Reject a specific request
router.post("/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.headers.authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Missing bearer token",
      });
    }

    const token = req.headers.authorization.substring(7);

    const verification = await verify(token);

    if (!verification) {
      return res.status(401).json({
        error: "Invalid token",
        success: false,
      });
    }

    const userDoc = await db.collection("users").findOne({'username_email': {$eq: verification.email}});

    if (!userDoc) {
      return res.status(404).json({
        error: "User not found",
        success: false,
      });
    }
    const userId = userDoc._id.toString();

    // Check if request exists
    const docRef = db.collection("requests");
    const requestDoc = await docRef.findOne({'_id':new ObjectId(id)});

    if (!requestDoc) {
      return res.status(404).json({
        error: "Request not found",
        success: false,
      });
    }

    let owners : Array<string> = requestDoc.owners;
    let ownersPending : Array<string> = requestDoc.ownersPending;
    let ownersAccepted : Array<string> = requestDoc.ownersAccepted;
    let ownersRejected : Array<string> = requestDoc.ownersRejected;

    const validOwner = owners.some((owner: { toString: () => string; }) => owner === userId);
    const ownerPending = ownersPending.some((owner: { toString: () => string; }) => owner === userId);
    const ownerAccepted = ownersAccepted.some((owner: { toString: () => string; }) => owner === userId);
    const ownerRejected = ownersRejected.some((owner: { toString: () => string; }) => owner === userId);

    if (!validOwner || ownerRejected ) {
      console.log(`User not found`);
      return res
        .status(403)
        .json({ success: false, error: "User not associated with this request." });
    }
    else if (ownerRejected) {
      return res
      .status(409)
      .json({ success: false, error: "User has already rejected this request."})
    }

    if (ownerPending || ownerAccepted) { //REJECT or REVOKE cases
      ownersPending = ownersPending.filter((owner) => owner !== userId);
      ownersAccepted = ownersAccepted.filter((owner) => owner !== userId);
      ownersRejected.push(userId);
    }
    else {
      return res
      .status(500)
      .json({ success: false, error: "Inconsistency error"})
    }

    const update = await docRef.updateOne({'_id': new ObjectId(id)}, {$set: {owners, ownersPending, ownersAccepted, ownersRejected}});

    if (update){
      return res.json({
        id,
        success: true,
        message: "Request rejected successfully",
      });
    }
    else {
      return res.status(500).json({
        error: "Failed to update request",
        success: false,
      });
    }
    
  } catch (error) {
    console.error("Error updating request:", error);
    res.status(500).json({
      error: "Failed to update request",
      success: false,
    });
  }
});

//POST /api/requests/:id/send - Send a request to users
router.post("/:id/send", async (req, res) => {
  try {
    const { id } = req.params;
    let userDocs = null;

    if (!req.headers.authorization?.startsWith("Bearer ")) {
      console.error("Missing bearer token.")
      return res.status(401).json({
        success: false,
        error: "Missing bearer token",
      });
    }

    if (req.body.ownersPending) {
      const ownersPendingIds = req.body.ownersPending.map((o : string) => new ObjectId(o));
      userDocs = await db.collection("users").find({_id: {$in: ownersPendingIds}}).toArray();
    }
    else if (req.body.user_emails) {
      const user_emails = req.body.user_emails;
      userDocs = await db.collection("users").find({'username_email': {$in: user_emails}}).toArray();
    }
    else {
      console.error("Request body has no owners pending or user emails.")
      return res.status(400).json({
        success: false,
        error: "Bad request",
      });
    }

    const token = req.headers.authorization.substring(7);

    const verification = await verify(token);
    console.log("verification is:",verification);

    if (!verification) {
      console.error("Invalid token.")
      return res.status(401).json({
        error: "Invalid token",
        success: false,
      });
    }

    if (verification.type !== "consumer") {
      return res.status(403).json({
        error: "User is not a requester",
        success: false,
      });
    }

    if (!userDocs) {
      console.error("User not found.")
      return res.status(404).json({
        error: "User not found",
        success: false,
      });
    }

    const requestDoc = await db.collection<RequestData>("requests").findOne({_id: {$eq: new ObjectId(id)}}) as RequestData;
    
    if (!requestDoc) {
      return res.status(404).json({
        error: "Request not found",
        success: false,
      });
    }

    let owners : Array<string> = requestDoc.owners;
    let ownersPending : Array<string> = requestDoc.ownersPending;
    let ownersAccepted : Array<string> = requestDoc.ownersAccepted;
    let ownersRejected : Array<string> = requestDoc.ownersRejected;

    for (const userDoc of userDocs) {
      const userId = userDoc._id.toString();

      const validOwner = owners.some((owner: { toString: () => string; }) => owner === userId);
      const ownerPending = ownersPending.some((owner: { toString: () => string; }) => owner === userId);
      const ownerAccepted = ownersAccepted.some((owner: { toString: () => string; }) => owner === userId);
      const ownerRejected = ownersRejected.some((owner: { toString: () => string; }) => owner === userId);

      if (validOwner) {
        console.log(`User ${userId} already a valid owner. Skipping`);
        continue;
      }
      else if (ownerPending) {
        console.log(`User ${userId} already pending. Skipping`);
        continue;
      }
      else if (ownerAccepted) {
        console.log(`User ${userId} already accepted this request. Skipping`);
        continue;
      }
      else if (ownerRejected) {
        console.log(`User ${userId} already rejected this request. Skipping`);
        continue;
      }
      else {
        const email_token = await new SignJWT({
          userId,
          requestId: id,
          action: "decide"
        }).setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(secret);

        const email_content = RequestEmail(requestDoc, userId, email_token);

        const email_details = {
            from: 'DIPS Consent Manager <dips-consent-manager@soton.ac.uk>',
            to: userDoc.username_email,
            subject: 'Consent Request',
            html: email_content,
          }
        const email_result = await sendTestEmail(email_details);
        console.log("Email result:", email_result.url);
        owners.push(userId);
        ownersPending.push(userId);
      }
    }

    const update = await db.collection("requests").updateOne({'_id': new ObjectId(id)}, {$set: {owners, ownersPending, ownersAccepted, ownersRejected}});

    if (update){
      return res.json({
        id,
        success: true,
        message: "Request sent successfully",
      });
    }
    else {
      return res.status(500).json({
        error: "Failed to update request",
        success: false,
      });
    }
    
  } catch (error) {
    console.error("Error updating request:", error);
    res.status(500).json({
      error: "Failed to update request",
      success: false,
    });
  }
});

// GET /api/requests - Get requests with filters
router.get("/", async (req, res) => {
  try {
    const { uid, role, status } = req.query;

    console.log("Request is:",`${uid}, ${role}, ${status}`);

    let requestsCollection: Collection = db.collection("requests");
    let requestsQuery = {};

    if (!req.headers.authorization?.startsWith("Bearer ")) {
      console.error("Missing bearer token.")
      return res.status(401).json({
        success: false,
        error: "Missing bearer token",
      });
    }

    const token = req.headers.authorization.substring(7);

    const verification = await verify(token);

    if (!verification) {
      console.error("Invalid token.")
      return res.status(401).json({
        error: "Invalid token",
        success: false,
      });
    }

    if (verification.uid !== uid) {
      console.error("Invalid token.")
      return res.status(401).json({
        error: "Token not valid for this user.",
        success: false,
      });
    }

    const consent_role = verification.type === "provider" ? "owner" : "requester";

    if (consent_role !== role) {
      console.error(`Token role and given role mismatch: got ${role} expected ${consent_role}`);
      return res.status(401).json({
        error: "Token role and given role mismatch.",
        success: false,
      });
    }

    if (uid && role === "requester") {
      //requestsQuery = requestsQuery.find("requester.requesterId", "==", uid);
      requestsQuery = { 'requester.requesterId': {$eq: uid}}
    }
    if (uid && role === "owner") {
      //requestsQuery = requestsQuery.where("owners", "array-contains", uid);
      requestsQuery = { 'owners': {$in: [uid]}}
    }
    if (status) {
      //requestsQuery = requestsQuery.where("status", "==", status);
      requestsQuery = { 'status': {$eq: status}}
    }

    const querySnapshot = requestsCollection.find(requestsQuery);
    const requests = await querySnapshot.toArray();

    res.json({ requests, success: true });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ error: "Failed to fetch requests", success: false });
  }
});

// DELETE /api/requests/:id - Delete a request
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.headers.authorization?.startsWith("Bearer ")) {
      console.error("Missing bearer token.")
      return res.status(401).json({
        success: false,
        error: "Missing bearer token",
      });
    }

    const token = req.headers.authorization.substring(7);

    const verification = await verify(token);

    if (!verification) {
      console.error("Invalid token.")
      return res.status(401).json({
        error: "Invalid token",
        success: false,
      });
    }

    // Check if request exists
    const docRef = db.collection("requests");
    const docSnap = await docRef.findOne({'_id':new ObjectId(id)});

    if (!docSnap) {
      return res.status(404).json({
        error: "Request not found",
        success: false,
      });
    }

    if (docSnap._id.toString() !== verification.uid) {
      return res.status(403).json({
        error: "Request does not belong to this user.",
        success: false,
      });
    }

    // Delete the request
    await docRef.deleteOne({'_id':new ObjectId(id)})

    res.json({
      success: true,
      message: "Request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting request:", error);
    res.status(500).json({
      error: "Failed to delete request",
      success: false,
    });
  }
});

export default router;
