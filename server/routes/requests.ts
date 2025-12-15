import express from "express";
import { collection, query, where, getDocs, Query } from "firebase/firestore";
import { db } from "../config/firebase.js";

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

    const requestWithDefaults = {
      ...data,
      selectedOntologies: data.selectedOntologies.map(({ id, name }) => ({
        id,
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
      owners: [],
      ownersAccepted: [],
      ownersRejected: [],
      ownersPending: [],
    };

    const docRef = await db.collection("requests").add(requestWithDefaults);

    res.status(201).json({
      id: docRef.id,
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
    console.log("📥 GET /api/requests/:id called with id:", id);
    const docRef = await db.collection("requests").doc(id).get();

    if (!docRef.exists) {
      console.error("❌ Request document NOT found for id:", id);
      return res.status(404).json({
        error: "Request not found",
        success: false,
      });
    }

    const requestData = docRef.data();
    console.log("📄 Request document found:", {
      id: docRef.id,
      requester: requestData?.requester,
      requesterId: requestData?.requester?.requesterId,
      requesterEmail: requestData?.requester?.requesterEmail,
    });

    res.json({
      id: docRef.id,
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
    const updateData = req.body;

    // Check if request exists
    const docRef = db.collection("requests").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({
        error: "Request not found",
        success: false,
      });
    }

    // Update the request
    await docRef.update(updateData);

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

    let requestsQuery: FirebaseFirestore.Query = db.collection("requests");

    if (uid && role === "requester") {
      requestsQuery = requestsQuery.where("requester.requesterId", "==", uid);
    }
    if (uid && role === "owner") {
      requestsQuery = requestsQuery.where("owners", "array-contains", uid);
    }
    if (status) {
      requestsQuery = requestsQuery.where("status", "==", status);
    }

    const querySnapshot = await requestsQuery.get();
    const requests = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

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
    const docRef = db.collection("requests").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({
        error: "Request not found",
        success: false,
      });
    }

    // Delete the request
    await docRef.delete();

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
