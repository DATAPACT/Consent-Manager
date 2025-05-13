import { db } from "../firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Refinement } from "./PermissionsUtils";

interface RequestData {
  requestName: string;
  permissions: {
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

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Fetch requester name from Firestore using UID
    const requesterDoc = await getDoc(doc(db, "requesters", user.uid));
    const requesterData = requesterDoc.exists() ? requesterDoc.data() : null;

    const requesterName = requesterData?.name || user.displayName || "Unknown";

    // default request values
    const requestWithDefaults = {
      ...data,
      requester: {
        requesterId: user.uid,
        requesterName: requesterName,
        requesterEmail: user.email || "Unknown",
      },
      createdAt: `${days[now.getDay()]} ${now
        .getDate()
        .toString()
        .padStart(2, "0")} ${months[now.getMonth()]} ${now.getFullYear()} ${now
        .getHours()
        .toString()
        .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
      sentAt: "",
      decisionDate: "",
      status: "draft",
      owners: [],
      ownersAccepted: [],
      ownersRejected: [],
      ownersPending: [],
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
