import { useEffect, useState } from "react";
import styles from "../../css/OwnerPendingRequestsDetails.module.css";
import { Link } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { getRequests } from "../../services/api";

// components
import LoadingSpinner from "../LoadingSpinner";
import { useTranslation } from "react-i18next";

// Define the type for the request object
interface Request {
  _id: string;
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
  const { t } = useTranslation();

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
          // 1. no negotiationId
          // 2. user is in ownersPending
          const userPendingRequests = result.requests.filter(
            (request: any) =>
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
        <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;{t("back")}
      </Link>

      <h3 className="mt-4">{t("pending_requests")}</h3>
      <p>{t("owner_pending_requests_text_1")}</p>

      <hr />

      {pendingRequests.length === 0 ? (
        <div className="text-center mt-5">
          <h4>{t("no_pending_requests")}</h4>
          <p className="mt-2">
            {t("owner_pending_requests_text_2")}
          </p>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th scope="col">{t("name")}</th>
              <th scope="col">{t("date_received")}</th>
              <th scope="col" className="text-center">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {pendingRequests.map((request) => (
              <tr key={request._id}>
                <td className="py-3">{request.requestName}</td>
                <td className="py-3">{request.sentAt}</td>
                <td className="py-3 text-center">
                  <Link
                    to={`/ownerBase/ownerPendingRequestsDetails/${request._id}`}
                    className={`${styles.primaryButton} btn btn-sm`}
                  >
                    {t("view_details")}
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
