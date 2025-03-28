import { useEffect, useState } from "react";
import styles from "../../css/OwnerPendingRequestsDetails.module.css";
import { useParams, Link } from "react-router-dom";
import { db } from "../../firebase"; // Firebase setup
import { doc, getDoc } from "firebase/firestore";

// Define the type for the request object
interface Request {
  id: string;
  requestName: string;
  status: string;
  owners: string[]; // Array of owner IDs
  createdAt: { seconds: number }; // Firebase timestamp
  senderName: string;
  startDate: { seconds: number };
  endDate: { seconds: number };
  moreInfo: string;
}

function OwnerPendingRequestsDetails() {
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
          setRequestDetails(docSnap.data() as Request);
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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-danger">{error}</div>;
  }

  if (!requestDetails) {
    return <div>No request details found.</div>;
  }

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
              to="/ownerBase/ownerPendingRequestModify"
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
    </>
  );
}

export default OwnerPendingRequestsDetails;
