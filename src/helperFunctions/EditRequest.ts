import { getRequest, updateRequest as updateRequestAPI } from "../services/api";

interface RequestData {
  name: string;
  ontologies: any[];
  permissions: any[];
}

export async function getRequestById(
  id: string
): Promise<RequestData & { id: string }> {
  try {
    const result = await getRequest(id);
    if (result.success) {
      return { id: result.id, ...result.data };
    } else {
      throw new Error("Request not found");
    }
  } catch (error) {
    console.error("Error fetching request:", error);
    throw new Error("Request not found");
  }
}

export async function updateRequest(id: string, payload: RequestData) {
  try {
    const result = await updateRequestAPI(id, payload);
    if (result.success) {
      return { success: true };
    } else {
      throw new Error("Update failed");
    }
  } catch (error) {
    console.error("Error updating request:", error);
    throw error;
  }
}
