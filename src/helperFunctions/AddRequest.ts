import { createRequest } from "../services/api";
import { Refinement } from "./PermissionsUtils";

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
}

interface UserContext {
  uid: string;
  email: string | null;
  userData: {
    name: string;
    [key: string]: any;
  };
}

export const addRequest = async (data: RequestData, user: UserContext) => {
  try {
    if (!user) {
      throw new Error("User not authenticated");
    }

    const requestWithRequester = {
      ...data,
      requester: {
        requesterId: user.uid,
        requesterName: user.userData.name || "Unknown",
        requesterEmail: user.email || "Unknown",
      },
    };

    const result = await createRequest(requestWithRequester);
    return result;
  } catch (error) {
    console.error("Error adding request:", error);
    return { error, success: false };
  }
};
