import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { getRequests, deleteRequest } from "../../services/api";

// css
import styles from "../../css/Ontology.module.css";

interface Request {
  id: string;
  requestName: string;
  status: string;
  ownersAccepted: string[];
  sentAt: string;
  negotiationId?: string;
}

function OwnerOtherRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const { user } = useAuth();

  // State for selected request to delete
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) {
        setError("User not logged in.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        // Get all requests for owners (no status filter here so we get both negotiation + rejected)
        const result = await getRequests({
          uid: user.uid,
          role: "owner",
        });

        if (result.success) {
          // Keep only negotiation or rejected requests
          const filteredRequests = result.requests.filter(
            (request: any) =>
              request.negotiationId || request.status === "rejected"
          );

          setRequests(filteredRequests);
        } else {
          setError("Failed to fetch requests.");
        }
      } catch (err) {
        setError("Error fetching requests.");
      }

      setLoading(false);
    };

    fetchRequests();
  }, [user]);

  const handleRevokeRequest = async () => {
    if (!selectedRequestId) return;

    try {
      const result = await deleteRequest(selectedRequestId);

      if (result.success) {
        setRequests(requests.filter((req) => req.id !== selectedRequestId)); // Update UI
        setSelectedRequestId(null); // Clear selected request
      } else {
        setError("Failed to revoke the request.");
      }
    } catch (error) {
      console.error("Error deleting request:", error);
      setError("Failed to revoke the request.");
    }
  };

  return (
    <>
      <div className={`${styles.dashboard} container w-50`}>
        <Link
          className="text-decoration-none"
          to="/ownerBase/ownerDashboard"
          role="button"
        >
          <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;Back
        </Link>

        <h3 className="mt-4">Other Requests</h3>
        <p>
          View details of the requests under negotiation, expired, or rejected,
          or revoke them.
        </p>
        <hr />

        {loading ? (
          <div className="text-center mt-5">Loading...</div>
        ) : error ? (
          <div className="text-danger text-center mt-5">{error}</div>
        ) : requests.length === 0 ? (
          <div className="text-center mt-5">
            <h4>No negotiation or rejected requests</h4>
            <p className="mt-2">
              Requests under negotiation or rejected will appear here.
            </p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Date received</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="py-3">
                    {request.negotiationId ? (
                      <span className="badge bg-warning text-dark mb-3">
                        Under Negotiation
                      </span>
                    ) : request.status === "rejected" ? (
                      <span className="badge bg-danger mb-3">Rejected</span>
                    ) : (
                      <span className="badge bg-secondary mb-3">Other</span>
                    )}
                    <br />
                    {request.requestName}
                  </td>
                  <td className="py-3">{request.sentAt}</td>

                  <td className="py-3">
                    <Link
                      to={`/ownerBase/ownerApprovedRequestsDetails/${request.id}`}
                      className={`${styles.primaryButton} btn`}
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default OwnerOtherRequests;
