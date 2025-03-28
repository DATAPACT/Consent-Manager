import styles from "../../css/Ontology.module.css";
import Footer from "../Footer/Footer";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { db, auth } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

function RequesterRequests() {
  const [draftRequests, setDraftRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);

  // Fetch requests from Firestore
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const requestsRef = collection(db, "requests");

        // Draft requests
        const draftQuery = query(
          requestsRef,
          where("requesterId", "==", auth.currentUser?.uid),
          where("status", "==", "draft")
        );
        const draftSnapshot = await getDocs(draftQuery);
        const draftRequests = draftSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sent requests
        const sentQuery = query(
          requestsRef,
          where("requesterId", "==", auth.currentUser?.uid),
          where("status", "==", "sent")
        );
        const sentSnapshot = await getDocs(sentQuery);
        const sentRequests = sentSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setDraftRequests(draftRequests);
        setSentRequests(sentRequests);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching requests:", error);
        setError("An error occurred while fetching the requests.");
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  // Delete request
  const handleDelete = async () => {
    if (requestToDelete) {
      try {
        const requestRef = doc(db, "requests", requestToDelete);
        await deleteDoc(requestRef);
        setDraftRequests(
          draftRequests.filter((request) => request.id !== requestToDelete)
        );
        setRequestToDelete(null);
      } catch (error) {
        console.error("Error deleting request:", error);
        setError("An error occurred while deleting the request.");
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-danger">{error}</div>;

  return (
    <>
      <div className={`${styles.dashboard} container w-50`}>
        <Link
          className="text-decoration-none"
          to="/requesterBase/requesterDashboard"
        >
          <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;Back
        </Link>

        <div className="d-flex mb-3">
          <div className="me-auto">
            <h3 className="mt-4">Requests</h3>
            <p>Manage and organize your requests.</p>
          </div>
          <div className="align-self-center">
            <Link
              className={`${styles.primaryButton} btn`}
              to="/requesterBase/createRequest"
            >
              Create request
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <nav>
          <div className="nav nav-tabs" id="nav-tab" role="tablist">
            <button
              className="nav-link active"
              data-bs-toggle="tab"
              data-bs-target="#nav-home"
            >
              Drafts
            </button>
            <button
              className="nav-link"
              data-bs-toggle="tab"
              data-bs-target="#nav-profile"
            >
              Sent
            </button>
          </div>
        </nav>

        {/* Tab Content */}
        <div className="tab-content" id="nav-tabContent">
          {/* Draft Requests */}
          <div className="tab-pane fade show active" id="nav-home">
            <table className="table mt-4">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Date Created</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {draftRequests.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-4">
                      No draft requests available.
                    </td>
                  </tr>
                ) : (
                  draftRequests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.requestName}</td>
                      <td>
                        {new Date(
                          request.createdAt.seconds * 1000
                        ).toLocaleString()}
                      </td>
                      <td className="text-center">
                        <Link
                          className="btn btn-sm text-dark"
                          to={`/requesterBase/editDraftRequest/${request.id}`}
                        >
                          <i className="fa-solid fa-pen-to-square fa-lg"></i>
                        </Link>
                        <button
                          className="btn btn-sm text-dark"
                          onClick={() => setRequestToDelete(request.id)}
                          data-bs-toggle="modal"
                          data-bs-target="#deleteRequestModal"
                        >
                          <i className="fa-solid fa-trash fa-lg"></i>
                        </button>
                        <Link
                          className="btn btn-sm text-dark"
                          to={`/requesterBase/sendDraftRequest/${request.id}`}
                        >
                          <i className="fa-solid fa-file-import fa-lg"></i>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Sent Requests */}
          <div className="tab-pane fade" id="nav-profile">
            <table className="table mt-4">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Date Sent</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sentRequests.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-4">
                      No sent requests available.
                    </td>
                  </tr>
                ) : (
                  sentRequests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.requestName}</td>
                      <td>
                        {new Date(
                          request.createdAt.seconds * 1000
                        ).toLocaleString()}
                      </td>
                      <td className="text-warning">Waiting for response</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <div
        className="modal fade"
        id="deleteRequestModal"
        aria-labelledby="deleteRequestLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="deleteRequestLabel">
                Are you sure?
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              ></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this request?</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className={`${styles.secondaryButton} btn`}
                data-bs-dismiss="modal"
              >
                Close
              </button>
              <button
                type="button"
                className={`${styles.dangerButton} btn`}
                onClick={handleDelete}
                data-bs-dismiss="modal"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default RequesterRequests;
