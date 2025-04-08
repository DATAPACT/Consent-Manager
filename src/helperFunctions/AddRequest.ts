import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

interface RequestData {
  title: string;
  description: string;
}

export const addRequest = async (data: RequestData) => {
  try {
    const requestWithDefaults = {
      ...data,
      status: "draft",
      createdAt: new Date().toISOString(),
      creator: "george",
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
