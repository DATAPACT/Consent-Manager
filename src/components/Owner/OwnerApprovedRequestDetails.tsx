import styles from "../../css/OwnerPendingRequestsDetails.module.css";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import jsPDF from "jspdf";

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
}

interface Request {
  id: string;
  requestName: string;
  requester: {
    requesterName: string;
    requesterEmail: string;
  };
  permissions: Permission[];
  status: string;
  owners: string[];
}

function OwnerApprovedRequestsDetails() {
  const { requestId } = useParams<{ requestId: string }>();
  const [requestDetails, setRequestDetails] = useState<Request | null>(null);
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
        const requestDocRef = doc(db, "requests", requestId);
        const docSnap = await getDoc(requestDocRef);

        if (docSnap.exists()) {
          setRequestDetails({ id: docSnap.id, ...docSnap.data() } as Request);
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

  const handleDownload = () => {
    if (!requestDetails) return;

    const pdf = new jsPDF();
    const lineHeight = 10;
    let y = 10;

    const addLine = (text: string = "") => {
      if (y > 270) {
        pdf.addPage();
        y = 10;
      }
      pdf.text(text, 10, y);
      y += lineHeight;
    };

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    addLine(`Request: ${requestDetails.requestName}`);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    addLine(`Requester Name: ${requestDetails.requester.requesterName}`);
    addLine(`Requester Email: ${requestDetails.requester.requesterEmail}`);
    addLine("");

    requestDetails.permissions.forEach((perm, index) => {
      addLine(`--- Requirement ${index + 1} ---`);
      addLine(`Dataset: ${perm.dataset}`);
      addLine(`Action: ${perm.action}`);
      addLine(`Purpose: ${perm.purpose}`);

      if (perm.datasetRefinements.length > 0) {
        addLine("Dataset Conditions:");
        perm.datasetRefinements.forEach((ref) => {
          addLine(`- ${ref.attribute} > ${ref.value}`);
        });
      }

      if (perm.actionRefinements.length > 0) {
        addLine("Action Permissions:");
        perm.actionRefinements.forEach((ref) => {
          addLine(`- ${ref.attribute} > ${ref.value}`);
        });
      }

      if (perm.purposeRefinements.length > 0) {
        addLine("Purpose Permissions:");
        perm.purposeRefinements.forEach((ref) => {
          addLine(`- ${ref.attribute} > ${ref.value}`);
        });
      }

      if (perm.constraintRefinements.length > 0) {
        addLine("Constraints:");
        perm.constraintRefinements.forEach((ref) => {
          addLine(`- ${ref.attribute} ${ref.instance} ${ref.value}`);
        });
      }

      addLine("");
    });

    pdf.save(`${requestDetails.requestName || "request"}.pdf`);
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

        {requestDetails.permissions?.map((permission, ruleIndex) => (
          <div key={ruleIndex} className="mb-4 mt-4">
            <h5>Requirement {ruleIndex + 1}</h5>
            <h5 className="mt-4">What’s being requested</h5>
            <p>
              <strong>Dataset:</strong> The requester has access to data from{" "}
              <strong>{permission.dataset}</strong>.
            </p>
            <p>
              <strong>Action:</strong> The requester can{" "}
              <strong>{permission.action}</strong> to this dataset.
            </p>
            <p>
              <strong>Purpose:</strong> This request is for{" "}
              <strong>{permission.purpose}</strong> reasons.
            </p>

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
                <h5>Action permissions:</h5>
                <ul className="list-unstyled">
                  {permission.actionRefinements.map((ref, i) => (
                    <li key={i}>
                      Write access to <strong>{ref.attribute}</strong> items
                      greater than <strong>{ref.value}</strong>.
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {permission.purposeRefinements?.length > 0 && (
              <div>
                <h5>Purpose permissions:</h5>
                <ul className="list-unstyled">
                  {permission.purposeRefinements.map((ref, i) => (
                    <li key={i}>
                      Data are used for <strong>{ref.attribute}</strong> items
                      greater than <strong>{ref.value}</strong>.
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
                      Data meet the constraint: <strong>{ref.attribute}</strong>{" "}
                      {ref.instance} <strong>{ref.value}</strong>.
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        <button
          className={`${styles.primaryButton} btn mt-3`}
          onClick={handleDownload}
        >
          Download request
        </button>
      </div>
    </>
  );
}

export default OwnerApprovedRequestsDetails;
