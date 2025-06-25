// API service to interact with the Express backend
const API_BASE_URL = 'http://localhost:3001/api';

interface Refinement {
  name: string;
  value: string;
}

interface RequestData {
  requestName: string;
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
}

// Authentication API
export const login = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error logging in:', error);
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
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error registering:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error logging out:', error);
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
    console.error('Error fetching user details:', error);
    throw error;
  }
};

// Requests API
export const createRequest = async (data: RequestData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating request:', error);
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
    console.error('Error fetching request:', error);
    throw error;
  }
};

export const updateRequest = async (id: string, data: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/requests/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating request:', error);
    throw error;
  }
};

export const getRequests = async (filters: {
  uid?: string;
  role?: string;
  status?: string;
} = {}) => {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const response = await fetch(`${API_BASE_URL}/requests?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching requests:', error);
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
    formData.append('requesterUid', data.requesterUid);
    formData.append('ontologyName', data.ontologyName);
    formData.append('ontologyDescription', data.ontologyDescription);
    formData.append('ontologyFile', data.ontologyFile);

    const response = await fetch(`${API_BASE_URL}/ontologies`, {
      method: 'POST',
      body: formData, // Don't set Content-Type, let browser set it for multipart/form-data
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading ontology:', error);
    throw error;
  }
};

export const getOntologies = async (requesterUid?: string) => {
  try {
    const params = requesterUid ? `?requesterUid=${requesterUid}` : '';
    const response = await fetch(`${API_BASE_URL}/ontologies${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching ontologies:', error);
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
    console.error('Error fetching ontology:', error);
    throw error;
  }
};

export const deleteOntology = async (id: string, requesterUid: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ontologies/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requesterUid }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting ontology:', error);
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
    console.error('Error fetching requester dashboard:', error);
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
    console.error('Error fetching owner dashboard:', error);
    throw error;
  }
};

export const getPendingRequestsForOwner = async (uid: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/requests/pending-owner/${uid}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    throw error;
  }
};

export const getApprovedRequestsForOwner = async (uid: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/requests/approved-owner/${uid}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching approved requests:', error);
    throw error;
  }
};

export const deleteRequest = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/requests/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting request:', error);
    throw error;
  }
};