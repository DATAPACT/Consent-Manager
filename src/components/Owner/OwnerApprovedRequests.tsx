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
}

function OwnerApprovedRequests() {
  const [approvedRequests, setApprovedRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const { user } = useAuth();

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
      const result = await deleteRequest(selectedRequestId);

      if (result.success) {
        setApprovedRequests(
          approvedRequests.filter((req) => req.id !== selectedRequestId)
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
          <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;Back
        </Link>

        <h3 className="mt-4">Approved requests</h3>
        <p>View details of the requests you have approved or revoke them.</p>
        <hr />

        {loading ? (
          <div className="text-center mt-5">Loading...</div>
        ) : error ? (
          <div className="text-danger text-center mt-5">{error}</div>
        ) : approvedRequests.length === 0 ? (
          <div className="text-center mt-5">
            <h4>No approved requests</h4>
            <p className="mt-2">
              Once you approve a request, it will appear here.
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
              {approvedRequests.map((request) => (
                <tr key={request.id}>
                  <td className="py-3">{request.requestName}</td>
                  <td className="py-3">{request.sentAt}</td>
                  <td className="py-3">
                    <Link
                      to={`/ownerBase/ownerApprovedRequestsDetails/${request.id}`}
                      className={`${styles.primaryButton} btn`}
                    >
                      View Details
                    </Link>
                    <button
                      className={`${styles.dangerButton} btn ms-3`}
                      data-bs-toggle="modal"
                      data-bs-target={`#revokeRequestModal-${request.id}`}
                      onClick={() => setSelectedRequestId(request.id)} // Set selected request to be deleted
                    >
                      Revoke
                    </button>

                    {/* Revoke Modal */}
                    <div
                      className="modal fade"
                      id={`revokeRequestModal-${request.id}`}
                      tabIndex={-1}
                      aria-labelledby={`revokeRequestLabel-${request.id}`}
                      aria-hidden="true"
                    >
                      <div className="modal-dialog">
                        <div className="modal-content">
                          <div className="modal-header">
                            <h5 className="modal-title">Revoke request</h5>
                            <button
                              type="button"
                              className="btn-close"
                              data-bs-dismiss="modal"
                            ></button>
                          </div>
                          <div className="modal-body">
                            <p>
                              Are you sure you want to revoke this request?
                              Please explain below the reason for revoking this
                              request so we can notify the Requester about your
                              decision.
                            </p>

                            <div className="mb-3">
                              <label
                                className={`${styles.formLabel} form-label`}
                              >
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
                              data-bs-dismiss="modal"
                              onClick={handleRevokeRequest} // Call revoke handler on confirmation
                            >
                              Revoke
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
