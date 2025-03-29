import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom"; // Import useNavigate
import { db } from "../../firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"; // Import updateDoc and deleteDoc

// css
import styles from "../../css/Ontology.module.css";

// components
import LoadingSpinner from "../LoadingSpinner";

interface Request {
  id: string;
  requestName: string;
  status: string;
  owners: string[];
  createdAt: { seconds: number };
  senderName: string;
  startDate: { seconds: number };
  endDate: { seconds: number };
  moreInfo: string;
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

        <h5 className="mt-4">Sender</h5>
        <p>{requestDetails.senderName}</p>

        <h5 className="mt-4">Date requested</h5>
        <p>
          {new Date(requestDetails.createdAt.seconds * 1000).toLocaleString()}
        </p>

        <div className="d-flex flex-row mt-4">
          <div>
            <h5>Start date</h5>
            <p>
              {new Date(
                requestDetails.startDate.seconds * 1000
              ).toLocaleString()}
            </p>
          </div>
          <div className="ms-5">
            <h5>End date</h5>
            <p>
              {new Date(requestDetails.endDate.seconds * 1000).toLocaleString()}
            </p>
          </div>
        </div>

        <h5 className="mt-3">More info</h5>
        <p>{requestDetails.moreInfo}</p>

        <div className="d-flex mt-5">
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
