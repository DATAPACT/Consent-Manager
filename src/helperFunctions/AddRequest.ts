import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { Refinement } from "./RulesUtils";

interface RequestData {
  request_name: string;
  rules: {
    dataset: string; // Store dataset URL
    datasetRefinements: Refinement[];
    purposeRefinements: Refinement[];
    actionRefinements: Refinement[];
    constraintRefinements: Refinement[];
  }[];
}

export const addRequest = async (data: RequestData) => {
  try {
    // data that don't take values from the form
    const requestWithDefaults = {
      ...data,

      requester: {
        requester_id: "123",
        requester_name: "george",
        requester_email: "george@gmail.com",
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
