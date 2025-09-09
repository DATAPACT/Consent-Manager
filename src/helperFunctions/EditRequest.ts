import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

interface RequestData {
  name: string;
  ontologies: any[];
  permissions: any[];
}

export async function getRequestById(
  id: string
): Promise<RequestData & { id: string }> {
  const ref = doc(db, "requests", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) throw new Error("Request not found");

  const data = snap.data() as RequestData; // ✅ explicitly tell TypeScript the shape

  return { id: snap.id, ...data };
}

export async function updateRequest(id: string, payload: RequestData) {
  const ref = doc(db, "requests", id);
  await updateDoc(ref, payload as any); // ✅ fix type mismatch
  return { success: true };
}
