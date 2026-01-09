import { useEffect, useState } from "react";
import styles from "../../css/OwnerPendingRequestsDetails.module.css";
import { Link } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { getRequests } from "../../services/api";

// components
import LoadingSpinner from "../LoadingSpinner";

// Define the type for the request object
interface Request {
  id: string;
  requestName: string;
  status: string;
  ownersPending: string[]; // Array of owner IDs pending approval
  sentAt: string;
  negotiationId?: string;
}

function OwnerPendingRequests() {
  const [pendingRequests, setPendingRequests] = useState<Request[]>([]);
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

      try {
        // ✅ Get all requests for this owner (no status filter)
        const result = await getRequests({
          uid: user.uid,
          role: "owner",
        });

        if (result.success) {
          // ✅ Only show requests where:
          // 1. status is "sent"
          // 2. no negotiationId
          // 3. user is in ownersPending
          const userPendingRequests = result.requests.filter(
            (request: any) =>
              request.status === "sent" &&
              !request.negotiationId &&
              request.ownersPending?.includes(user.uid)
          );

          setPendingRequests(userPendingRequests);
        } else {
          setError("Failed to fetch requests.");
        }
        setLoading(false);
      } catch (error) {
        setError("An error occurred while fetching the requests.");
        console.error("Error fetching requests:", error);
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user]); // Depend on user to reload when auth state changes

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-danger">{error}</div>;
  }

  return (
    <div className={`${styles.dashboard} container w-50`}>
      <Link className="text-decoration-none" to="/ownerBase/ownerDashboard">
        <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;Back
      </Link>

      <h3 className="mt-4">Pending requests</h3>
      <p>Manage and organize your requests for seamless integration and use.</p>

      <hr />

      {pendingRequests.length === 0 ? (
        <div className="text-center mt-5">
          <h4>No pending requests</h4>
          <p className="mt-2">
            Once you receive a request, it will appear here.
          </p>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Date received</th>
              <th scope="col" className="text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {pendingRequests.map((request) => (
              <tr key={request.id}>
                <td className="py-3">{request.requestName}</td>
                <td className="py-3">{request.sentAt}</td>
                <td className="py-3 text-center">
                  <Link
                    to={`/ownerBase/ownerPendingRequestsDetails/${request.id}`}
                    className={`${styles.primaryButton} btn btn-sm`}
                  >
                    See details
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

export default OwnerPendingRequests;
