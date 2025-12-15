import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { getRequests } from "../../services/api";

// css
import styles from "../../css/Ontology.module.css";

interface Request {
  id: string;
  requestName: string;
  status: string;
  sentAt: string;
  negotiationId?: string;
}

function OwnerOtherRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const { user } = useAuth();

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

  return (
    <div className={`${styles.dashboard} container w-50`}>
      <Link
        className="text-decoration-none"
        to="/ownerBase/ownerDashboard"
        role="button"
      >
        <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;Back
      </Link>

      <h3 className="mt-4">Other Requests</h3>
      <p>View details of the requests under negotiation or rejected.</p>
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
                    <span className="badge bg-warning text-dark mb-2">
                      Under Negotiation
                    </span>
                  ) : (
                    <span className="badge bg-danger mb-2">Rejected</span>
                  )}
                  <br />
                  {request.requestName}
                </td>
                <td className="py-3">{request.sentAt}</td>
                <td className="py-3">
                  <Link
                    to={`/ownerBase/ownerOtherRequestsDetails/${request.id}`}
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
  );
}

export default OwnerOtherRequests;
