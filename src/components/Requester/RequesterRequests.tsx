import styles from "../../css/Ontology.module.css";
import Footer from "../Footer/Footer";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { db, auth } from "../../firebase"; // Make sure Firebase instance is correctly imported
import { collection, query, where, getDocs } from "firebase/firestore"; // Firestore methods to fetch data

function RequesterRequests() {
  const [draftRequests, setDraftRequests] = useState<any[]>([]); // State to store draft requests
  const [loading, setLoading] = useState<boolean>(true); // State to track loading status
  const [error, setError] = useState<string>(""); // State to store error message

  // Fetch draft requests from Firestore on component mount
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        // Reference to the requests collection
        const requestsRef = collection(db, "requests");

        // Query to get draft requests (assuming 'status' field is set to 'draft' for drafts)
        const q = query(
          requestsRef,
          where("requesterId", "==", auth.currentUser?.uid),
          where("status", "==", "draft")
        );

        // Fetch the data
        const querySnapshot = await getDocs(q);

        // Map over the documents to extract data
        const requests = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setDraftRequests(requests); // Set the draft requests state
        setLoading(false); // Stop loading
      } catch (error) {
        console.error("Error fetching requests:", error);
        setError("An error occurred while fetching the requests.");
        setLoading(false);
      }
    };

    fetchRequests(); // Call fetch function
  }, []);

  // Render loading state
  if (loading) {
    return <div>Loading...</div>;
  }

  // Render error state
  if (error) {
    return <div className="text-danger">{error}</div>;
  }

  return (
    <>
      <div className={`${styles.dashboard} container w-50`}>
        <Link
          className="text-decoration-none"
          to="/requesterBase/requesterDashboard"
          role="button"
        >
          <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;Back
        </Link>

        <div className="d-flex mb-3">
          <div className="me-auto">
            <h3 className="mt-4">Requests</h3>
            <p>
              Manage and organize your ontologies for seamless integration and
              use.
            </p>
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

        <nav>
          <div className="nav nav-tabs" id="nav-tab" role="tablist">
            <button
              className="nav-link active"
              id="nav-home-tab"
              data-bs-toggle="tab"
              data-bs-target="#nav-home"
              type="button"
              role="tab"
              aria-controls="nav-home"
              aria-selected="true"
            >
              Drafts
            </button>
            <button
              className="nav-link"
              id="nav-profile-tab"
              data-bs-toggle="tab"
              data-bs-target="#nav-profile"
              type="button"
              role="tab"
              aria-controls="nav-profile"
              aria-selected="false"
            >
              Pending
            </button>
            <button
              className="nav-link"
              id="nav-contact-tab"
              data-bs-toggle="tab"
              data-bs-target="#nav-contact"
              type="button"
              role="tab"
              aria-controls="nav-contact"
              aria-selected="false"
            >
              Approved
            </button>
          </div>
        </nav>

        <div className="tab-content" id="nav-tabContent">
          <div
            className="tab-pane fade show active"
            id="nav-home"
            role="tabpanel"
            aria-labelledby="nav-home-tab"
          >
            {/* Display draft requests */}
            <table className="table mt-4">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Date created</th>
                  <th scope="col" className="text-center">
                    Actions
                  </th>
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
                      <td className="py-4">{request.requestName}</td>
                      <td className="py-4">
                        {new Date(
                          request.createdAt.seconds * 1000
                        ).toLocaleString()}
                      </td>
                      <td className="py-4 text-center">
                        <Link
                          className="btn btn-sm text-dark"
                          to={`/requesterBase/editDraftRequest/${request.id}`}
                        >
                          <i className="fa-solid fa-pen-to-square fa-lg"></i>
                        </Link>
                        <button
                          className="btn btn-sm text-dark"
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

          {/* Repeat similar structures for Pending and Approved tabs if needed */}
        </div>
      </div>

      {/* Delete request modal */}
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
                aria-label="Close"
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
              <button type="button" className={`${styles.dangerButton} btn`}>
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
