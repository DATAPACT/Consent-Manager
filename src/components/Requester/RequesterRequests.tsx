import styles from "../../css/Ontology.module.css";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getRequests, deleteRequest } from "../../services/api";
import { useAuth } from "../../AuthContext";

// components
import LoadingSpinner from "../LoadingSpinner";
import { useTranslation } from "react-i18next";

function RequesterRequests() {
  const { user } = useAuth();
  const [draftRequests, setDraftRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [, setApprovedRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        if (!user) {
          setError("User not logged in.");
          setLoading(false);
          return;
        }

        // Fetch all requests for this user via Express API
        const result = await getRequests({
          uid: user.uid,
          role: "requester",
        });

        if (result.success) {
          const allRequests = result.requests;

          // Separate requests by status
          const drafts = allRequests.filter(
            (req: any) => req.status === "draft"
          );
          const sent = allRequests.filter((req: any) =>
            ["sent", "accepted", "rejected"].includes(req.status)
          );

          const approved = allRequests.filter(
            (req: any) => req.status === "approved"
          );

          setDraftRequests(drafts);
          setSentRequests(sent);
          setApprovedRequests(approved);
        } else {
          setError("Failed to fetch requests.");
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching requests:", error);
        setError("An error occurred while fetching the requests.");
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user]);

  const handleDelete = async () => {
    if (requestToDelete) {
      try {
        const result = await deleteRequest(requestToDelete);
        if (result.success) {
          setDraftRequests((prev) =>
            prev.filter((request) => request._id !== requestToDelete)
          );
          setRequestToDelete(null);
        } else {
          setError("Failed to delete the request.");
        }
      } catch (error) {
        console.error("Error deleting request:", error);
        setError("An error occurred while deleting the request.");
      }
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-danger">{error}</div>;

  return (
    <>
      <div className={`${styles.dashboard} container w-50`}>
        <Link
          className="text-decoration-none"
          to="/requesterBase/requesterDashboard"
        >
          <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;{t("back")}
        </Link>

        <div className="d-flex mb-3">
          <div className="me-auto">
            <h3 className="mt-4">{t("requests")}</h3>
            <p>{t("requester_requests_text_1")}</p>
          </div>
          <div className="align-self-center">
            <Link
              className={`${styles.primaryButton} btn`}
              to="/requesterBase/createRequest"
            >
              {t("new_request")}
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <nav>
          <div className="nav nav-tabs" id="nav-tab" role="tablist">
            <button
              className="nav-link active"
              data-bs-toggle="tab"
              data-bs-target="#nav-drafts"
            >
              {t("drafts")} ({draftRequests.length})
            </button>
            <button
              className="nav-link"
              data-bs-toggle="tab"
              data-bs-target="#nav-sent"
            >
              {t("sent")} ({sentRequests.length})
            </button>
          </div>
        </nav>

        {/* Tab Content */}
        <div className="tab-content" id="nav-tabContent">
          {/* Draft Requests */}
          <div className="tab-pane fade show active" id="nav-drafts">
            {draftRequests.length === 0 ? (
              <div className="text-center mt-5">
                <h4>{t("no_draft_requests")}</h4>
                <p className="mt-2">
                  {t("no_draft_requests_text_1")}
                </p>
              </div>
            ) : (
              <div className="mt-4">
                {draftRequests.map((request) => (
                  <div className="border mt-3" key={request._id}>
                    <div className="d-flex p-3">
                      <div
                        className="me-auto p-2"
                        style={{ fontWeight: "500" }}
                      >
                        {request.requestName}
                      </div>
                      <div className="p-2">{request.createdAt}</div>
                      <div className="p-2">
                        <div className="dropdown d-inline">
                          <button
                            className="btn btn-sm text-dark"
                            type="button"
                            id={`dropdownMenu-${request._id}`}
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            <i className="fa-solid fa-ellipsis-vertical"></i>
                          </button>

                          <ul
                            className="dropdown-menu"
                            aria-labelledby={`dropdownMenu-${request._id}`}
                          >
                            <li>
                              <Link
                                className="dropdown-item"
                                to={`/requesterBase/editDraftRequest/${request._id}`}
                              >
                                <i className="fa-solid fa-edit me-2"></i>
                                {t("edit_request")}
                              </Link>
                            </li>
                            <li>
                              <Link
                                className="dropdown-item"
                                to={`/requesterBase/sendDraftRequest/${request._id}`}
                              >
                                <i className="fa-solid fa-file-import me-2"></i>
                                {t("send_request")}
                              </Link>
                            </li>
                            <li>
                              <button
                                className="dropdown-item"
                                onClick={() => setRequestToDelete(request._id)}
                                data-bs-toggle="modal"
                                data-bs-target="#deleteRequestModal"
                              >
                                <i className="fa-solid fa-trash me-2"></i>
                                {t("delete")}
                              </button>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sent Requests */}
          <div className="tab-pane fade" id="nav-sent">
            {sentRequests.length === 0 ? (
              <div className="text-center mt-5">
                <h4>{t("no_sent_requests")}</h4>
                <p className="mt-2">
                  {t("no_sent_requests_text_!")}
                </p>
              </div>
            ) : (
              <table className="table mt-4">
                <thead>
                  <tr>
                    <th>{t("name")}</th>
                    <th>{t("date_sent")}</th>
                    <th>{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {sentRequests.map((request) => (
                    <tr key={request._id}>
                      <td className="py-3">{request.requestName}</td>
                      <td className="py-3">{request.sentAt}</td>
                      <td className="py-3">
                        <Link
                          to={`/requesterBase/requesterSentRequestsDetails/${request._id}`}
                          className={`${styles.primaryButton} btn btn-sm`}
                        >
                          {t("view_details")}
                        </Link>
                        <Link
                          to={`/requesterBase/sendDraftRequest/${request._id}`}
                          className={`${styles.secondaryButton} btn btn-sm ms-2`}
                        >
                          {t("send_to_more")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <div
        className="modal fade"
        id="deleteRequestModal"
        tabIndex={-1}
        aria-labelledby="deleteRequestModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="deleteRequestModalLabel">
                {t("confirm_deletion")}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              {t("delete_request_confirmation")}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className={`${styles.secondaryButton} btn`}
                data-bs-dismiss="modal"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                className={`${styles.dangerButton} btn`}
                onClick={handleDelete}
                data-bs-dismiss="modal"
              >
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default RequesterRequests;
