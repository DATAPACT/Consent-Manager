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
}

function OwnerApprovedRequestsDetails() {
  const { requestId } = useParams<{ requestId: string }>();
  const [requestDetails, setRequestDetails] = useState<Request | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

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

        {permissions.map((permission, ruleIndex) => (
          <div key={ruleIndex} className="mb-4 mt-4">
            <h5>Requirement {ruleIndex + 1}</h5>
            <h5 className="mt-4">What’s being requested</h5>
            <p>
              <strong>Dataset:</strong> The requester wants access to data from{" "}
              <strong>{permission.dataset}</strong>.
            </p>
            <p>
              <strong>Action:</strong> The requester wants to{" "}
              <strong>{permission.action}</strong> to this dataset.
            </p>
            <p>
              <strong>Purpose:</strong> This request is for{" "}
              <strong>{permission.purpose}</strong> reasons.
            </p>

            {/* constraints */}
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

            {/* assignees */}
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
                      Data about <strong>{ref.attribute}</strong> items greater
                      than <strong>{ref.value}</strong>.
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
        ))}

        <div>
          <button className={`${styles.primaryButton} btn`}>
            Download Contract
          </button>
        </div>
      </div>
    </>
  );
}

export default OwnerApprovedRequestsDetails;
