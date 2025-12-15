// API service to interact with the Express backend

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://dips.soton.ac.uk/consent-manager-api/api";

interface ContractRequest {
  id: string; // required for contract creation
  policy?: any; // ODRL policy JSON
}

interface Refinement {
  id: number;
  attribute?: string;
  instance?: string;
  value?: string;
  label?: string;
}

interface RequestData {
  requestName: string;
  description?: string;
  extraTerms?: string;
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
  requester: {
    requesterId: string;
    requesterName: string;
    requesterEmail: string;
  };
  policy?: any; // ODRL policy JSON
  metadata?: any; // Additional metadata like audit request ID
}

// Authentication API
export const login = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-login-source": "ui",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export const register = async (userData: {
  email: string;
  password: string;
  name: string;
  role: string;
  [key: string]: any;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error registering:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};

export const getUserDetails = async (uid: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/user/${uid}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw error;
  }
};

export const getAllOwners = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/owners`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching all owners:", error);
    throw error;
  }
};

// Requests API
export const createRequest = async (data: RequestData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating request:", error);
    throw error;
  }
};

export const getRequest = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/requests/${id}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching request:", error);
    throw error;
  }
};

export const updateRequest = async (id: string, data: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/requests/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating request:", error);
    throw error;
  }
};

export const getRequests = async (
  filters: {
    uid?: string;
    role?: string;
    status?: string;
  } = {}
) => {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const response = await fetch(
      `${API_BASE_URL}/requests?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching requests:", error);
    throw error;
  }
};

// Ontologies API
export const uploadOntology = async (data: {
  requesterUid: string;
  ontologyName: string;
  ontologyDescription: string;
  ontologyFile: File;
}) => {
  try {
    const formData = new FormData();
    formData.append("requesterUid", data.requesterUid);
    formData.append("ontologyName", data.ontologyName);
    formData.append("ontologyDescription", data.ontologyDescription);
    formData.append("ontologyFile", data.ontologyFile);

    const response = await fetch(`${API_BASE_URL}/ontologies`, {
      method: "POST",
      body: formData, // Don't set Content-Type, let browser set it for multipart/form-data
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error uploading ontology:", error);
    throw error;
  }
};

export const getOntologies = async (requesterUid?: string) => {
  try {
    const params = requesterUid ? `?requesterUid=${requesterUid}` : "";
    const response = await fetch(`${API_BASE_URL}/ontologies${params}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching ontologies:", error);
    throw error;
  }
};

export const getOntology = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ontologies/${id}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching ontology:", error);
    throw error;
  }
};

export const deleteOntology = async (id: string, requesterUid: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ontologies/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requesterUid }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting ontology:", error);
    throw error;
  }
};

// Dashboard API
export const getRequesterDashboard = async (uid: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/requester/${uid}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching requester dashboard:", error);
    throw error;
  }
};

export const getOwnerDashboard = async (uid: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/owner/${uid}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching owner dashboard:", error);
    throw error;
  }
};

export const getPendingRequestsForOwner = async (uid: string) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/dashboard/requests/pending-owner/${uid}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    throw error;
  }
};

export const getApprovedRequestsForOwner = async (uid: string) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/dashboard/requests/approved-owner/${uid}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching approved requests:", error);
    throw error;
  }
};

export const deleteRequest = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/requests/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting request:", error);
    throw error;
  }
};

// External API integration for negotiation
export const createNegotiationFromRequest = async (
  requestId: string,
  consumerId: string,
  providerId: string,
  token: string
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/external/negotiation/create-with-initial`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId, consumerId, providerId }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.log("request id: ", requestId);
    console.log("consumer id: ", consumerId);
    console.log("provider id: ", providerId);
    console.log("token: ", token);

    console.error("Error creating negotiation:", error);
    throw error;
  }
};

// Create negotiation in accepted state when consent is approved
export const createAcceptedNegotiationFromRequest = async (
  requestId: string,
  consumerId: string,
  providerId: string,
  token: string
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/external/negotiation/create-accepted`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId, consumerId, providerId }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating accepted negotiation:", error);
    throw error;
  }
};

// Get external users list
export const getExternalUsers = async (token: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/external/users`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching external users:", error);
    throw error;
  }
};

// Get external user details
export const getExternalUserDetails = async (
  token: string,
  userId?: string
) => {
  try {
    const url = userId
      ? `${API_BASE_URL}/external/user-details?user_id=${userId}`
      : `${API_BASE_URL}/external/user-details`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching external user details:", error);
    throw error;
  }
};

// Get negotiation ID by consent request ID
export const getNegotiationByRequestId = async (requestId: string) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/external/negotiation/by-request/${requestId}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching negotiation by request ID:", error);
    throw error;
  }
};

// Redirect to negotiation display page
export const redirectToNegotiationDisplay = async (
  negotiationId: string,
  accessToken: string,
  userId: string,
  userType: string
) => {
  console.log("🔗 Opening negotiation dashboard:", {
    negotiationId,
    userId,
    userType,
    hasToken: !!accessToken,
  });

  // Build URL with authentication parameters
  const negotiationUrl =
    `https://dips.soton.ac.uk/negotiation/organization/negotiation?` +
    `negotiation_id=${negotiationId}&` +
    `access_token=${encodeURIComponent(accessToken)}&` +
    `user_id=${userId}&` +
    `user_type=${userType}`;

  console.log("🌐 Opening URL with auth parameters:", negotiationUrl);

  const newTab = window.open(negotiationUrl, "_blank");

  if (newTab) {
    newTab.focus();
    console.log("✅ Negotiation dashboard opened in new tab");
    console.log("✅ Django will verify token and set session automatically");
  } else {
    console.warn("⚠️ New tab blocked - user needs to manually open");
    console.log("🔗 URL to open manually:", negotiationUrl);
    throw new Error("New tab blocked");
  }
};

export async function createContractAPI(request: ContractRequest) {
  try {
    console.log("📝 Request object received:", request);
    console.log("📄 ODRL policy:", request.policy);

    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_BASE_URL}/requests/${request.id}/createContract`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-token": token || "",
        },
        body: JSON.stringify({ policy: request.policy }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to create contract");
    }

    return data;
  } catch (error) {
    console.error("❌ Error creating contract:", error);
    throw error;
  }
}
