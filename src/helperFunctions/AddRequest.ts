import { db } from "../firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Refinement } from "./RulesUtils";

interface RequestData {
  request_name: string;
  rules: {
    dataset: string;
    datasetRefinements: Refinement[];
    purposeRefinements: Refinement[];
    actionRefinements: Refinement[];
    constraintRefinements: Refinement[];
  }[];
}

export const addRequest = async (data: RequestData) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Fetch requester name from Firestore using UID
    const requesterDoc = await getDoc(doc(db, "requesters", user.uid));
    const requesterData = requesterDoc.exists() ? requesterDoc.data() : null;

    const requesterName = requesterData?.name || user.displayName || "Unknown";

    const requestWithDefaults = {
      ...data,
      requester: {
        requesterId: user.uid,
        requesterName: requesterName,
        requesterEmail: user.email || "Unknown",
      },
      createdAt: new Date().toISOString(),
      status: "draft",
    };

    const docRef = await addDoc(
      collection(db, "requests"),
      requestWithDefaults
    );

    return { id: docRef.id, success: true };
  } catch (error) {
    console.error("Error adding request:", error);
    return { error, success: false };
  }
};
