import styles from "../../css/OwnerPendingRequestsDetails.module.css";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getRequest } from "../../services/api";
import { getRequestPermissions } from "../../utils/policyParser";

// components
import LoadingSpinner from "../LoadingSpinner";

interface Refinement {
  attribute: string;
  instance: string;
  value: string;
}

interface Permission {
  dataset: string;
  datasetRefinements: Refinement[];
  action: string;
  actionRefinements: Refinement[];
  purpose: string;
  purposeRefinements: Refinement[];
  constraintRefinements: Refinement[];
  constraints?: Array<{
    leftOperand: string;
    operator: string;
    rightOperand: any;
    description: string;
  }>;
  assignees?: Array<{
    source: string;
    refinements?: Array<{
      leftOperand: string;
      operator: string;
      rightOperand: any;
      description: string;
    }>;
  }>;
}

interface Request {
  id: string;
  requestName: string;
  requester: {
    requesterName: string;
    requesterEmail: string;
  };
  policy?: any;
  status: string;
  owners: string[];
  contractId?: string;
}

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
      contract_type: "consent_contract",
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
        "https://dips.soton.ac.uk/consent-manager-api/api";

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

        {(() => {
          // Parse permissions from ODRL policy or fallback to legacy permissions
          const parsedPermissions = getRequestPermissions(requestDetails);

          return parsedPermissions.map((permission, ruleIndex) => (
            <div key={ruleIndex} className="mb-4 mt-4">
              <h5>Permission {ruleIndex + 1}</h5>
              <h5 className="mt-4">What’s being requested</h5>
              <p>
                <strong>Dataset:</strong> The requester wants access to data
                from <strong>{permission.dataset}</strong>.
              </p>
              <p>
                <strong>Action:</strong> The requester wants to{" "}
                <strong>{permission.action}</strong> to this dataset.
              </p>
              <p>
                <strong>Purpose:</strong> This request is for{" "}
                <strong>{permission.purpose}</strong> reasons.
              </p>

              {/* Show generic ODRL constraints */}
              {permission.constraints && permission.constraints.length > 0 && (
                <div className="mt-3">
                  <h6>Policy Constraints:</h6>
                  <ul className="list-unstyled ms-3">
                    {permission.constraints.map((constraint, i) => (
                      <li key={i} className="mb-1">
                        <small className="text-muted">
                          • {constraint.description}
                        </small>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Show generic ODRL assignees */}
              {permission.assignees && permission.assignees.length > 0 && (
                <div className="mt-3">
                  <h6>Assigned To:</h6>
                  {permission.assignees.map((assignee, i) => (
                    <div key={i} className="ms-3">
                      <p className="mb-1">
                        <strong>{assignee.source}</strong>
                      </p>
                      {assignee.refinements &&
                        assignee.refinements.map((ref, j) => (
                          <p key={j} className="mb-1 ms-2">
                            <small className="text-muted">
                              └ {ref.description}
                            </small>
                          </p>
                        ))}
                    </div>
                  ))}
                </div>
              )}

              {permission.datasetRefinements?.length > 0 && (
                <div>
                  <h5>Dataset conditions:</h5>
                  <ul className="list-unstyled">
                    {permission.datasetRefinements.map((ref, i) => (
                      <li key={i}>
                        Data about <strong>{ref.attribute}</strong> items
                        greater than <strong>{ref.value}</strong>.
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {permission.actionRefinements?.length > 0 && (
                <div>
                  <h5>Action conditions:</h5>
                  <ul className="list-unstyled">
                    {permission.actionRefinements.map((ref, i) => (
                      <li key={i}>
                        Write access to <strong>{ref.attribute}</strong> items
                        greater than <strong> {ref.value}</strong>.
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {permission.purposeRefinements?.length > 0 && (
                <div>
                  <h5>Purpose conditions:</h5>
                  <ul className="list-unstyled">
                    {permission.purposeRefinements.map((ref, i) => (
                      <li key={i}>
                        Data will be used for <strong>{ref.attribute}</strong>{" "}
                        items greater than <strong>{ref.value}</strong>.
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {permission.constraintRefinements?.length > 0 && (
                <div>
                  <h5>Constraints:</h5>
                  <ul className="list-unstyled">
                    {permission.constraintRefinements.map((ref, i) => (
                      <li key={i}>
                        Data should meet the constraint:{" "}
                        <strong>{ref.attribute}</strong> {ref.instance}{" "}
                        <strong>{ref.value}</strong>.
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ));
        })()}

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
            onClick={() => setShowContract(!showContract)}
          >
            {showContract ? "Hide Contract" : "Show Contract"}
          </button>
        </div>

        {showContract && (
          <pre className="mt-3 bg-light p-3 rounded border">
            {JSON.stringify(buildContract(), null, 2)}
          </pre>
        )}
      </div>
    </>
  );
}

export default OwnerApprovedRequestsDetails;
