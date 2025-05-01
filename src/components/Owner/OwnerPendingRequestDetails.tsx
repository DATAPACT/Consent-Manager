import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom"; // Import useNavigate
import { db } from "../../firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"; // Import updateDoc and deleteDoc
import { getAuth } from "firebase/auth";

// css
import styles from "../../css/Ontology.module.css";

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
  ownersAccepted: string[];
  ownersRejected: string[];
  ownersPending: string[];
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

  // Approve Request
  const approveRequest = async () => {
    if (!requestDetails) return;

    setUpdating(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setError("User not authenticated.");
        setUpdating(false);
        return;
      }

      const loggedInUserId = user.uid;

      const requestDocRef = doc(db, "requests", requestId!);

      // Remove the logged-in user's ID from ownersPending array
      const updatedOwnersPending = requestDetails.ownersPending.filter(
        (ownerId) => ownerId !== loggedInUserId
      );

      // Add the logged-in user's ID to the ownersAccepted array
      const updatedOwnersAccepted = [
        ...requestDetails.ownersAccepted,
        loggedInUserId,
      ];

      // Update Firestore with the new ownersPending and ownersAccepted arrays
      await updateDoc(requestDocRef, {
        ownersPending: updatedOwnersPending, // Update ownersPending (remove user)
        ownersAccepted: updatedOwnersAccepted, // Add user to ownersAccepted
      });

      // Log success
      console.log("User moved to ownersAccepted");

      // Update the state with the new ownersPending and ownersAccepted arrays
      setRequestDetails(
        (prev) =>
          prev && {
            ...prev,
            ownersPending: updatedOwnersPending,
            ownersAccepted: updatedOwnersAccepted,
          }
      );

      closeModal("approveRequestModal");
      navigate("/ownerBase/ownerDashboard");
    } catch (error) {
      console.error("Error approving request:", error);
      setError("Error approving request.");
    }
    setUpdating(false);
  };

  // Reject Request
  const rejectRequest = async () => {
    if (!requestDetails) return;

    setUpdating(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setError("User not authenticated.");
        setUpdating(false);
        return;
      }

      const loggedInUserId = user.uid;

      const requestDocRef = doc(db, "requests", requestId!);

      // Remove the logged-in user's ID from ownersPending array
      const updatedOwnersPending = requestDetails.ownersPending.filter(
        (ownerId) => ownerId !== loggedInUserId
      );

      // Add the logged-in user's ID to the ownersRejected array
      const updatedOwnersRejected = [
        ...requestDetails.ownersRejected,
        loggedInUserId,
      ];

      // Update Firestore with the new ownersPending and ownersRejected arrays
      await updateDoc(requestDocRef, {
        ownersPending: updatedOwnersPending, // Update ownersPending (remove user)
        ownersRejected: updatedOwnersRejected, // Add user to ownersRejected
      });

      // Log success
      console.log("User moved to ownersRejected");

      // Update the state with the new ownersPending and ownersRejected arrays
      setRequestDetails(
        (prev) =>
          prev && {
            ...prev,
            ownersPending: updatedOwnersPending,
            ownersRejected: updatedOwnersRejected,
          }
      );

      closeModal("rejectRequestModal");
      navigate("/ownerBase/ownerDashboard");
    } catch (error) {
      console.error("Error rejecting request:", error);
      setError("Error rejecting request.");
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

        {requestDetails.permissions?.map((permission, ruleIndex) => (
          <div key={ruleIndex} className="mb-4 mt-4">
            <h5>Permission {ruleIndex + 1}</h5>
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
