import styles from "../../css/OwnerPendingRequestsDetails.module.css";
import Footer from "../Footer/Footer";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

// components
import LoadingSpinner from "../LoadingSpinner";

function OwnerApprovedRequestsDetails() {
  const { requestId } = useParams<{ requestId: string }>(); // Extract requestId from URL params
  const [request, setRequest] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (!requestId) {
        setError("Request ID is missing.");
        setLoading(false);
        return;
      }

      try {
        const requestRef = doc(db, "requests", requestId); // Reference to the request document
        const requestSnapshot = await getDoc(requestRef);

        if (requestSnapshot.exists()) {
          const requestData = requestSnapshot.data();
          console.log("Fetched Request Data:", requestData); // Log the data for debugging
          setRequest(requestData);
        } else {
          setError("Request not found.");
        }
      } catch (error) {
        console.error("Error fetching request:", error);
        setError("An error occurred while fetching the request.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequestDetails();
  }, [requestId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-danger">{error}</div>;

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
        <h3 className="mt-4">{request?.requestName}</h3>
        <h5 className="mt-4">Sender</h5>
        <p>{request?.senderName || "Sender name not available"}</p>{" "}
        {/* Added fallback text */}
        <h5 className="mt-4">Date requested</h5>
        <p>
          {new Date(request?.createdAt.seconds * 1000).toLocaleDateString()}
        </p>
        <div className="d-flex flex-row mt-4">
          <div>
            <h5>Start date</h5>
            <p>
              {new Date(request?.startDate.seconds * 1000).toLocaleDateString()}
            </p>
          </div>
          <div className="ms-5">
            <h5>End date</h5>
            <p>
              {new Date(request?.endDate.seconds * 1000).toLocaleDateString()}
            </p>
          </div>
        </div>
        <h5 className="mt-3">More info</h5>
        <p>{request?.moreInfo}</p>
        <div className="mt-5">
          <button
            className={`${styles.primaryButton} btn`}
            data-bs-toggle="modal"
            data-bs-target="#approveRequestModal"
          >
            Download request
          </button>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default OwnerApprovedRequestsDetails;
