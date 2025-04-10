import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom"; // Import useNavigate
import { db } from "../../firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"; // Import updateDoc and deleteDoc

// css
import styles from "../../css/Ontology.module.css";

// components
import LoadingSpinner from "../LoadingSpinner";

interface Refinement {
  attribute: string;
  instance: string;
  value: string;
}

interface Rule {
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
  rules: Rule[];
  status: string;
  owners: string[];
}

function OwnerPendingRequestsDetails() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate(); // Initialize useNavigate
  const [requestDetails, setRequestDetails] = useState<Request | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [updating, setUpdating] = useState<boolean>(false);

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

  // Approve request function
  const approveRequest = async () => {
    if (!requestDetails) return;

    setUpdating(true);
    try {
      const requestDocRef = doc(db, "requests", requestId!);
      await updateDoc(requestDocRef, { status: "approved" });

      setRequestDetails((prev) => prev && { ...prev, status: "approved" });

      closeModal("approveRequestModal");

      navigate("/ownerBase/ownerDashboard");
    } catch (error) {
      setError("Error approving request.");
    }
    setUpdating(false);
  };

  // Reject request function (delete instead of updating status)
  const rejectRequest = async () => {
    if (!requestDetails) return;

    setUpdating(true);
    try {
      const requestDocRef = doc(db, "requests", requestId!);
      await deleteDoc(requestDocRef); // Delete the request from Firestore

      setRequestDetails(null); // Clear the request details from the state

      closeModal("rejectRequestModal");

      navigate("/ownerBase/ownerDashboard"); // Navigate to the pending requests page
    } catch (error) {
      setError("Error deleting the request.");
    }
    setUpdating(false);
  };

  // Function to close Bootstrap modal manually
  const closeModal = (modalId: string) => {
    const modal = document.getElementById(modalId) as any;
    if (modal) {
      modal.classList.remove("show");
      document.body.classList.remove("modal-open");
      document.getElementsByClassName("modal-backdrop")[0]?.remove();
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-danger">{error}</div>;
  if (!requestDetails) return <div>No request details found.</div>;

  return (
    <>
      <div className={`${styles.dashboard} container w-50`}>
        <Link
          className="text-decoration-none"
          to="/ownerBase/ownerPendingRequests"
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

        {requestDetails.rules?.map((rule, ruleIndex) => (
          <div key={ruleIndex} className="mb-4 mt-4">
            <h5>Requirement {ruleIndex + 1}</h5>
            <h5 className="mt-4">What’s being requested</h5>
            <p>
              <strong>Dataset:</strong> The requester wants access to data from{" "}
              <strong>{rule.dataset}</strong>.
            </p>
            <p>
              <strong>Action:</strong> The requester wants to{" "}
              <strong>{rule.action}</strong> to this dataset.
            </p>
            <p>
              <strong>Purpose:</strong> This request is for{" "}
              <strong>{rule.purpose}</strong> reasons.
            </p>

            {rule.datasetRefinements?.length > 0 && (
              <div>
                <h5>Dataset conditions:</h5>
                <ul className="list-unstyled">
                  {rule.datasetRefinements.map((ref, i) => (
                    <li key={i}>
                      Data about <strong>{ref.attribute}</strong> items greater
                      than <strong>{ref.value}</strong>.
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {rule.actionRefinements?.length > 0 && (
              <div>
                <h5>Action conditions:</h5>
                <ul className="list-unstyled">
                  {rule.actionRefinements.map((ref, i) => (
                    <li key={i}>
                      Write access to <strong>{ref.attribute}</strong> items
                      greater than <strong> {ref.value}</strong>.
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {rule.purposeRefinements?.length > 0 && (
              <div>
                <h5>Purpose conditions:</h5>
                <ul className="list-unstyled">
                  {rule.purposeRefinements.map((ref, i) => (
                    <li key={i}>
                      Data will be used for <strong>{ref.attribute}</strong>{" "}
                      items greater than <strong>{ref.value}</strong>.
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {rule.constraintRefinements?.length > 0 && (
              <div>
                <h5>Constraints:</h5>
                <ul className="list-unstyled">
                  {rule.constraintRefinements.map((ref, i) => (
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

        <div className="alert alert-warning" role="alert">
          If you are unsure whether to accept, reject or make any modifications
          to the request, please contact the requester.
        </div>
        <div className="d-flex mt-4">
          <div>
            <button
              className={`${styles.primaryButton} btn`}
              data-bs-toggle="modal"
              data-bs-target="#approveRequestModal"
            >
              Approve
            </button>
          </div>
          <div className="ms-3">
            <Link
              className={`${styles.secondaryButton} btn`}
              to={`/ownerBase/ownerPendingRequestModify/${requestId}`}
            >
              Modify
            </Link>
          </div>
          <div className="ms-auto">
            <button
              className={`${styles.dangerButton} btn`}
              data-bs-toggle="modal"
              data-bs-target="#rejectRequestModal"
            >
              Reject
            </button>
          </div>
        </div>
      </div>

      {/* Approval Confirmation Modal */}
      <div
        className="modal fade"
        id="approveRequestModal"
        tabIndex={-1}
        aria-labelledby="approveRequestModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirm Approval</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              ></button>
            </div>
            <div className="modal-body">
              Are you sure you want to approve this request?
            </div>
            <div className="modal-footer">
              <button
                className={`${styles.secondaryButton} btn`}
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                className={`${styles.primaryButton} btn`}
                onClick={approveRequest}
                disabled={updating}
              >
                {updating ? "Approving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Confirmation Modal */}
      <div
        className="modal fade"
        id="rejectRequestModal"
        tabIndex={-1}
        aria-labelledby="rejectRequestModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirm Rejection</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              ></button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to reject this request? Please explain
                below the reason for rejecting this request so we can notify the
                Requester about your decision.
              </p>

              <div className="mb-3">
                <label className={`${styles.formLabel} form-label`}>
                  Describe your decision
                </label>
                <textarea
                  className={`${styles.formInput} form-control`}
                  id="exampleFormControlTextarea1"
                  rows={4}
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className={`${styles.secondaryButton} btn`}
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                className={`${styles.dangerButton} btn`}
                onClick={rejectRequest}
                disabled={updating}
              >
                {updating ? "Rejecting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default OwnerPendingRequestsDetails;
