import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { getRequests, revokeRequest } from "../../services/api";

// css
import styles from "../../css/Ontology.module.css";
import { useTranslation } from "react-i18next";

interface Request {
  _id: string;
  requestName: string;
  status: string;
  ownersAccepted: string[];
  sentAt: string;
}

function OwnerApprovedRequests() {
  const [approvedRequests, setApprovedRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const { user } = useAuth();
  const { t } = useTranslation();

  // State for selected request to delete
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );

  useEffect(() => {
    const fetchApprovedRequests = async () => {
      if (!user) {
        setError("User not logged in.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        // Get all sent requests for owners
        const result = await getRequests({
          uid: user.uid,
          role: "owner",
          status: "accepted",
        });

        if (result.success) {
          // Filter requests where the logged-in user is in the 'ownersAccepted' array
          const filteredRequests = result.requests.filter(
            (request: any) =>
              request.ownersAccepted &&
              request.ownersAccepted.includes(user.uid)
          );

          setApprovedRequests(filteredRequests);
        } else {
          setError("Failed to fetch approved requests.");
        }
      } catch (err) {
        setError("Error fetching approved requests.");
      }

      setLoading(false);
    };

    fetchApprovedRequests();
  }, [user]); // Run when user is set

  const handleRevokeRequest = async () => {
    if (!selectedRequestId) return;

    try {
      const result = await revokeRequest(selectedRequestId);

      if (result.success) {
        setApprovedRequests(
          approvedRequests.filter((req) => req._id !== selectedRequestId)
        ); // Update UI
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
          <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;{t("back")}
        </Link>

        <h3 className="mt-4">{t("approved_requests")}</h3>
        <p>{t("approved_requests_text_1")}</p>
        <hr />

        {loading ? (
          <div className="text-center mt-5">${t("loading")}...</div>
        ) : error ? (
          <div className="text-danger text-center mt-5">{error}</div>
        ) : approvedRequests.length === 0 ? (
          <div className="text-center mt-5">
            <h4>{t("no_approved_requests")}</h4>
            <p className="mt-2">
              {t("no_approved_requests_text_1")}
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
              {approvedRequests.map((request) => (
                <tr key={request._id}>
                  <td className="py-3">{request.requestName}</td>
                  <td className="py-3">{request.sentAt}</td>
                  <td className="py-3">
                    <Link
                      to={`/ownerBase/ownerApprovedRequestsDetails/${request._id}`}
                      className={`${styles.primaryButton} btn`}
                    >
                      {t("view_details")}
                    </Link>
                    <button
                      className={`${styles.dangerButton} btn ms-3`}
                      data-bs-toggle="modal"
                      data-bs-target={`#revokeRequestModal-${request._id}`}
                      onClick={() => setSelectedRequestId(request._id)} // Set selected request to be deleted
                    >
                      {t("revoke")}
                    </button>

                    {/* Revoke Modal */}
                    <div
                      className="modal fade"
                      id={`revokeRequestModal-${request._id}`}
                      tabIndex={-1}
                      aria-labelledby={`revokeRequestLabel-${request._id}`}
                      aria-hidden="true"
                    >
                      <div className="modal-dialog">
                        <div className="modal-content">
                          <div className="modal-header">
                            <h5 className="modal-title">{t("revoke_request")}</h5>
                            <button
                              type="button"
                              className="btn-close"
                              data-bs-dismiss="modal"
                            ></button>
                          </div>
                          <div className="modal-body">
                            <p>
                              {t("revoke_request_text_1")}
                            </p>

                            <div className="mb-3">
                              <label
                                className={`${styles.formLabel} form-label`}
                              >
                                {t("describe_your_decision")}
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
                              {t("cancel")}
                            </button>
                            <button
                              className={`${styles.dangerButton} btn`}
                              data-bs-dismiss="modal"
                              onClick={handleRevokeRequest} // Call revoke handler on confirmation
                            >
                              {t("revoke")}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
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

export default OwnerApprovedRequests;
