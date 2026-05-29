import express from "express";
import { db } from "../../src/services/database.service.ts";
import { Collection, ObjectId } from "mongodb";
import { permissionsToODRLPolicy } from "../../src/utils/policyParser.js";

const router = express.Router();

interface Refinement {
  name: string;
  value: string;
}

interface RequestData {
  requestName: string;
  description?: string;
  extraTerms?: string;
  extraText?: string;
  permissions: {
    dataset: string;
    action: string;
    purpose: string;
    datasetRefinements: Refinement[];
    purposeRefinements: Refinement[];
    actionRefinements: Refinement[];
    constraintRefinements: Refinement[];
  }[];
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

// GET /api/requests - Get requests with filters
router.get("/", async (req, res) => {
  try {
    const { uid, role, status } = req.query;

    let requestsCollection: Collection = db.collection("requests");
    let requestsQuery = {};

    if (uid && role === "requester") {
      //requestsQuery = requestsQuery.find("requester.requesterId", "==", uid);
      requestsQuery = { 'requester.requesterId': {$eq: uid}}
    }
    if (uid && role === "owner") {
      //requestsQuery = requestsQuery.where("owners", "array-contains", uid);
      requestsQuery = { 'owners': {$elemMatch: { $eq: uid }}}
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

    // Check if request exists
    const docRef = db.collection("requests");
    const docSnap = docRef.find({'_id':new ObjectId(id)});

    if (!docSnap) {
      return res.status(404).json({
        error: "Request not found",
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
