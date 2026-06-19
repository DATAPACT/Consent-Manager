import styles from "../../css/OwnerPendingRequestsDetails.module.css";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getRequest } from "../../services/api";
import { getRequestPermissions } from "../../utils/policyParser";
import { Request, Permission } from "../Interfaces/Requests";

// components
import LoadingSpinner from "../LoadingSpinner";
import renderPermissions from "../../utils/renderPermissions";

// ✅ Helper: sanitize ODRL -> flatten rdf:value, @id, remove odrl:/rdf: prefixes
function sanitizeODRL(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeODRL);
  } else if (obj && typeof obj === "object") {
    if ("@id" in obj && Object.keys(obj).length === 1) {
      return obj["@id"];
    }
    if ("rdf:value" in obj && Object.keys(obj).length === 1) {
      return sanitizeODRL(obj["rdf:value"]);
    }

    const newObj: any = {};
    Object.entries(obj).forEach(([key, value]) => {
      const cleanKey = key.replace(/^odrl:/, "").replace(/^rdf:/, "");
      newObj[cleanKey] = sanitizeODRL(value);
    });
    return newObj;
  }
  return obj;
}

function OwnerApprovedRequestsDetails() {
  const { requestId } = useParams<{ requestId: string }>();
  const [requestDetails, setRequestDetails] = useState<Request | null>(null);
  const [, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [showContract, setShowContract] = useState<boolean>(false);
  const [contractDetails, setContractDetails] = useState<any | null>(null);
  const [contractLoading, setContractLoading] = useState<boolean>(false);
  const [contractError, setContractError] = useState<string>("");

  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (!requestId) {
        setError("Invalid request ID.");
        setLoading(false);
        return;
      }

      try {
        const result = await getRequest(requestId);

        if (result.success) {
          const req = result.data as Request;
          setRequestDetails(req);

          const parsed = getRequestPermissions(req);
          setPermissions(parsed);
        } else {
          setError("Request not found.");
        }

        setLoading(false);
      } catch (error) {
        setError("Error fetching request details.");
        setLoading(false);
      }
    };

    fetchRequestDetails();
  }, [requestId]);

  const buildContract = () => {
    if (!requestDetails) return null;

    const sanitizedPolicy = sanitizeODRL(requestDetails.policy);

    return {
      contract_type: "pda",
      effective_date: "2025-09-11",
      validity_period: 24,
      contacts: {
        consumer: {
          name: "upcast_david",
          type: "consumer",
          email: "david@example.com",
          organization: "Consumer GmbH",
          incorporation: "Germany",
          address: "2 Verbraucherplatz, Berlin, DE",
          vat_no: "DE999999999",
          position_title: "Head of Data",
          phone: "+49 30 9876 5432",
        },
        provider: {
          name: "upcast_miao",
          citizenship: "United Kingdom",
          passport_id: "P-TEST-0001",
          type: "provider",
          email: "miao@example.com",
          address: "1 Provider Way, London, UK",
          phone: "+44 20 1234 5678",
        },
      },
      resource_description: {
        title: "dafa",
        price: "59.99",
        uri: "Data",
        policy_url: "",
        environmental_cost_of_generation: {
          additionalProp1: "",
          additionalProp2: "",
        },
        environmental_cost_of_serving: {
          additionalProp1: "",
          additionalProp2: "",
        },
        description: "This is a description of Product ABC.",
        type_of_data: "",
        data_format: "",
        data_size: "",
        tags: "electronics, gadgets, technology",
      },
      odrl: sanitizedPolicy,
    };
  };

  const downloadContract = async (contractId: string | undefined) => {
    if (!contractId) {
      alert(
        "Contract ID not found. Please ensure the contract has been created."
      );
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL ||
        "http://localhost:8019/api";

      const response = await fetch(
        `${API_BASE_URL}/requests/${requestId}/downloadContract/${contractId}`,
        {
          method: "GET",
          headers: {
            "x-api-token": token || "",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to download contract: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `contract_${contractId}.pdf`; // filename
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log("Contract downloaded successfully.");
    } catch (err) {
      console.error("Error downloading contract:", err);
    }
  };

  const handleToggleContract = async () => {
    if (showContract) {
      setShowContract(false);
      return;
    }

    const contractId = requestDetails?.contractId;
    if (!contractId) {
      alert(
        "Contract ID not found. Please ensure the contract has been created."
      );
      return;
    }

    setShowContract(true);
    setContractLoading(true);
    setContractError("");

    try {
      const token = localStorage.getItem("token");
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL ||
        "http://localhost:8019/api";
      console.log("api base url is: ", API_BASE_URL);

      const response = await fetch(
        `${API_BASE_URL}/requests/${requestId}/GetContract/${contractId}`,
        {
          method: "GET",
          headers: {
            "x-api-token": token || "",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch contract: ${response.status}`);
      }

      const data = await response.json();
      setContractDetails(data);
    } catch (err: any) {
      console.error("Error fetching contract details:", err);
      setContractError(err.message || "Failed to fetch contract details.");
    } finally {
      setContractLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-danger">{error}</div>;
  if (!requestDetails)
    return <div className="text-danger">No request details available.</div>;

  return (
    <>
      <div className={`${styles.dashboard} container w-50`}>
        <Link
          className="text-decoration-none"
          to="/ownerBase/ownerApprovedRequests"
          role="button"
        >
          <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;Back
        </Link>
        <h3 className="mt-4">{requestDetails.requestName}</h3>
        <h5 className="mt-4 mb-3">Requester details</h5>
        <p>
          <i className="fa-solid fa-user me-3"></i>
          {requestDetails.requester.requesterName}
        </p>
        <p className="mb-4">
          <i className="fa-solid fa-envelope me-3"></i>
          {requestDetails.requester.requesterEmail}
        </p>

        <text>
          {requestDetails.extraText ? requestDetails.extraText : ""}
        </text>

        {renderPermissions(requestDetails)}

        <hr />
        <div className="d-flex gap-3">
          <button
            className={`${styles.primaryButton} btn`}
            onClick={() => downloadContract(requestDetails?.contractId)}
          >
            Download Contract
          </button>

          <button
            className="btn btn-outline-secondary"
            onClick={handleToggleContract}
          >
            {showContract ? "Hide Contract" : "Show Contract"}
          </button>
        </div>

        {showContract && (
          <div className="mt-3 bg-light p-3 rounded border">
            {contractLoading && <p>Loading contract...</p>}
            {contractError && <p className="text-danger">{contractError}</p>}
            {!contractLoading && !contractError && (
              <pre style={{ whiteSpace: "pre-wrap" }}>
                {JSON.stringify(contractDetails || buildContract(), null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default OwnerApprovedRequestsDetails;
