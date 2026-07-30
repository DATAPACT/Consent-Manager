import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { getRequests } from "../../services/api";

// css
import styles from "../../css/Ontology.module.css";
import { useTranslation } from "react-i18next";

interface Request {
  _id: string;
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
  const { t } = useTranslation();

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
        <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;{t("back")}
      </Link>

      <h3 className="mt-4">{t("other_requests")}</h3>
      <p>{t("other_requests_details")}</p>
      <hr />

      {loading ? (
        <div className="text-center mt-5">${t("loading")}...</div>
      ) : error ? (
        <div className="text-danger text-center mt-5">{error}</div>
      ) : requests.length === 0 ? (
        <div className="text-center mt-5">
          <h4>{t("no_other_requests")}</h4>
          <p className="mt-2">
            {t("no_other_requests_text_1")}
          </p>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th scope="col">{t("name")}</th>
              <th scope="col">{t("date_received")}</th>
              <th scope="col">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request._id}>
                <td className="py-3">
                  {request.negotiationId ? (
                    <span className="badge bg-warning text-dark mb-2">
                      {t("under_negotiation")}
                    </span>
                  ) : (
                    <span className="badge bg-danger mb-2">{t("rejected")}</span>
                  )}
                  <br />
                  {request.requestName}
                </td>
                <td className="py-3">{request.sentAt}</td>
                <td className="py-3">
                  <Link
                    to={`/ownerBase/ownerOtherRequestsDetails/${request._id}`}
                    className={`${styles.primaryButton} btn`}
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

export default OwnerOtherRequests;
