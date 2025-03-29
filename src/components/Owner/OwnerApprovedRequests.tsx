import { useEffect, useState } from "react";
import styles from "../../css/OwnerPendingRequestsDetails.module.css";
import { Link } from "react-router-dom";
import { db, auth } from "../../firebase"; // Import Firebase Auth
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Footer from "../Footer/Footer";

interface Request {
  id: string;
  requestName: string;
  status: string;
  owners: string[];
  createdAt: { seconds: number };
}

function OwnerApprovedRequests() {
  const [approvedRequests, setApprovedRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  useEffect(() => {
    const fetchApprovedRequests = async () => {
      if (!userId) return;

      setLoading(true);
      setError("");

      try {
        const requestsRef = collection(db, "requests");
        const q = query(requestsRef, where("status", "==", "approved"));
        const querySnapshot = await getDocs(q);

        const filteredRequests: Request[] = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Request))
          .filter((req) => req.owners.includes(userId)); // Filter requests for the logged-in owner

        setApprovedRequests(filteredRequests);
      } catch (err) {
        setError("Error fetching approved requests.");
      }

      setLoading(false);
    };

    fetchApprovedRequests();
  }, [userId]); // Run when userId is set

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
        <p>
          Manage and organize your ontologies for seamless integration and use.
        </p>
        <hr />

        {loading ? (
          <div className="text-center mt-5">Loading...</div>
        ) : error ? (
          <div className="text-danger text-center mt-5">{error}</div>
        ) : approvedRequests.length === 0 ? (
          <div className="text-center mt-5">
            <h4>No approved requests</h4>
            <p className="mt-3">
              Once you approve a request, it will appear here.
            </p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Timestamp</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {approvedRequests.map((request) => (
                <tr key={request.id}>
                  <td className="py-4">{request.requestName}</td>
                  <td className="py-4">
                    {new Date(
                      request.createdAt.seconds * 1000
                    ).toLocaleString()}
                  </td>
                  <td className="py-4">
                    <Link
                      to={`/ownerBase/ownerApprovedRequestsDetails/${request.id}`}
                      className={`${styles.primaryButton} btn`}
                    >
                      View
                    </Link>
                    <button
                      className={`${styles.dangerButton} btn ms-3`}
                      data-bs-toggle="modal"
                      data-bs-target={`#revokeRequestModal-${request.id}`}
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
                            <p>Are you sure you want to revoke this request?</p>
                          </div>
                          <div className="modal-footer">
                            <button
                              className="btn btn-secondary"
                              data-bs-dismiss="modal"
                            >
                              Cancel
                            </button>
                            <button
                              className="btn btn-danger"
                              data-bs-dismiss="modal"
                              onClick={() =>
                                console.log(`Revoke request: ${request.id}`)
                              }
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

      <Footer />
    </>
  );
}

export default OwnerApprovedRequests;
