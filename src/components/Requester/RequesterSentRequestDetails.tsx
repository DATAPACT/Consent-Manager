import styles from "../../css/CreateRequest.module.css";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

// components
import LoadingSpinner from "../LoadingSpinner";

interface Refinement {
  attribute: string;
  instance: string;
  value: string;
}

interface Permission {
  dataset: string;
  datasetRefinements: Refinement[];
  action: string;
  actionRefinements: Refinement[];
  purpose: string;
  purposeRefinements: Refinement[];
  constraintRefinements: Refinement[];
}

interface Request {
  id: string;
  requestName: string;
  requester: {
    requesterName: string;
    requesterEmail: string;
  };
  permissions: Permission[];
  status: string;
  owners: string[];
  ownersPending: string[];
  ownersAccepted: string[];
  ownersRejected: string[];
}

function RequesterSentRequestsDetails() {
  const { requestId } = useParams<{ requestId: string }>();
  const [requestDetails, setRequestDetails] = useState<Request | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [ownerDetails, setOwnerDetails] = useState<
    { name: string; email: string; status: string }[]
  >([]); // Add status to store the status of each owner

  // Fetching the owners' details
  useEffect(() => {
    const fetchOwnerDetails = async () => {
      if (!requestDetails?.owners) return;

      const owners = requestDetails.owners;
      const ownerDetailsPromises = owners.map(async (ownerId) => {
        try {
          // Fetch user details for each owner ID from the "owners" collection
          const userDocRef = doc(db, "owners", ownerId);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            // Determine the status based on the owner's arrays
            let status = "Waiting for response"; // Default status
            if (requestDetails.ownersAccepted.includes(ownerId)) {
              status = "Accepted";
            } else if (requestDetails.ownersRejected.includes(ownerId)) {
              status = "Rejected";
            } else if (requestDetails.ownersPending.includes(ownerId)) {
              status = "Pending";
            }

            // Return the user details (name, email, and status)
            return {
              name: userDocSnap.data().name,
              email: userDocSnap.data().email,
              status,
            };
          } else {
            // If user doesn't exist, return mock data or handle accordingly
            return { name: "Unknown", email: "N/A", status: "Unknown" };
          }
        } catch (error) {
          console.error("Error fetching owner details:", error);
          return { name: "Unknown", email: "N/A", status: "Unknown" };
        }
      });

      // Wait for all user details to be fetched
      const ownersDetails = await Promise.all(ownerDetailsPromises);
      setOwnerDetails(ownersDetails); // Set the fetched owner details in state
    };

    fetchOwnerDetails();
  }, [requestDetails]); // Re-fetch when requestDetails change

  // Fetching request details
  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (!requestId) {
        setError("Invalid request ID.");
        setLoading(false);
        return;
      }

      try {
        const requestDocRef = doc(db, "requests", requestId);
        const docSnap = await getDoc(requestDocRef);

        if (docSnap.exists()) {
          setRequestDetails({ id: docSnap.id, ...docSnap.data() } as Request);
        } else {
          setError("Request not found.");
        }

        setLoading(false);
      } catch (error) {
        setError("Error fetching request details.");
        setLoading(false);
      }
    };

    fetchRequestDetails();
  }, [requestId]);

  const filteredOwners = ownerDetails.filter((owner) => {
    const matchesStatus =
      statusFilter === "All" || owner.status === statusFilter;
    const matchesSearch = owner.email
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredOwners.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOwners = filteredOwners.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-danger">{error}</div>;
  if (!requestDetails)
    return <div className="text-danger">No request details available.</div>;
  return (
    <>
      <div className={`${styles.dashboard} container w-50`}>
        <Link
          className="text-decoration-none"
          to="/requesterBase/requesterRequests"
          role="button"
        >
          <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;Back
        </Link>
        <h3 className="mt-4">{requestDetails.requestName}</h3>

        <ul className="nav nav-tabs mt-4" id="myTab" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              className="nav-link active"
              id="home-tab"
              data-bs-toggle="tab"
              data-bs-target="#home-tab-pane"
              type="button"
              role="tab"
              aria-controls="home-tab-pane"
              aria-selected="true"
            >
              Request details
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className="nav-link"
              id="profile-tab"
              data-bs-toggle="tab"
              data-bs-target="#profile-tab-pane"
              type="button"
              role="tab"
              aria-controls="profile-tab-pane"
              aria-selected="false"
            >
              Status
            </button>
          </li>
        </ul>

        <div className="tab-content" id="myTabContent">
          {/* request details tab */}
          <div
            className="tab-pane fade show active"
            id="home-tab-pane"
            role="tabpanel"
            aria-labelledby="home-tab"
          >
            {requestDetails.permissions?.map((permission, ruleIndex) => (
              <div key={ruleIndex} className="mb-4 mt-4">
                <h5>Permission {ruleIndex + 1}</h5>
                <h5 className="mt-4">What’s being requested</h5>
                <p>
                  <strong>Dataset:</strong> The requester has access to data
                  from <strong>{permission.dataset}</strong>.
                </p>
                <p>
                  <strong>Action:</strong> The requester can{" "}
                  <strong>{permission.action}</strong> to this dataset.
                </p>
                <p>
                  <strong>Purpose:</strong> This request is for{" "}
                  <strong>{permission.purpose}</strong> reasons.
                </p>

                {permission.datasetRefinements?.length > 0 && (
                  <div>
                    <h5>Dataset permissions:</h5>
                    <ul className="list-unstyled">
                      {permission.datasetRefinements.map((ref, i) => (
                        <li key={i}>
                          Data about <strong>{ref.attribute}</strong> items
                          greater than <strong>{ref.value}</strong>.
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {permission.actionRefinements?.length > 0 && (
                  <div>
                    <h5>Action permissions:</h5>
                    <ul className="list-unstyled">
                      {permission.actionRefinements.map((ref, i) => (
                        <li key={i}>
                          Write access to <strong>{ref.attribute}</strong> items
                          greater than <strong>{ref.value}</strong>.
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {permission.purposeRefinements?.length > 0 && (
                  <div>
                    <h5>Purpose permissions:</h5>
                    <ul className="list-unstyled">
                      {permission.purposeRefinements.map((ref, i) => (
                        <li key={i}>
                          Data are used for <strong>{ref.attribute}</strong>{" "}
                          items greater than <strong>{ref.value}</strong>.
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {permission.constraintRefinements?.length > 0 && (
                  <div>
                    <h5>Constraints:</h5>
                    <ul className="list-unstyled">
                      {permission.constraintRefinements.map((ref, i) => (
                        <li key={i}>
                          Data meet the constraint:{" "}
                          <strong>{ref.attribute}</strong> {ref.instance}{" "}
                          <strong>{ref.value}</strong>.
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}

            <button className={`${styles.primaryButton} btn mt-3`}>
              Download request
            </button>
          </div>
          {/* status tab */}
          <div
            className="tab-pane fade"
            id="profile-tab-pane"
            role="tabpanel"
            aria-labelledby="profile-tab"
          >
            {/* filters */}
            <div className="d-flex align-items-center gap-3 mt-4 mb-2">
              <div>
                <label
                  htmlFor="statusFilter"
                  className={`${styles.formLabel} form-label me-2`}
                >
                  Filter by status:
                </label>
                <select
                  id="statusFilter"
                  className={`${styles.formInput} form-select w-auto d-inline-block`}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div className="ms-auto w-25">
                <input
                  type="text"
                  className={`${styles.formInput} form-control`}
                  placeholder="Search by owner email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <button
                  data-bs-toggle="modal"
                  data-bs-target="#exampleModal"
                  className={`${styles.primaryButton} btn w-100`}
                >
                  Request summary
                </button>
              </div>
            </div>

            {filteredOwners.length === 0 ? (
              <div className="text-center mt-5">
                <h4> No matching requests</h4>
                <p className="mt-2">
                  Try changing your filter options or search for another data
                  owner
                </p>
              </div>
            ) : (
              <table className="table mt-4">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Email</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOwners.map((owner, index) => (
                    <tr key={index}>
                      <td className="py-3">{owner.name}</td>
                      <td className="py-3">{owner.email}</td>
                      <td
                        className={`py-3 text-${
                          owner.status === "Accepted"
                            ? "success"
                            : owner.status === "Rejected"
                            ? "danger"
                            : "warning"
                        }`}
                      >
                        {owner.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {totalPages > 1 && (
              <nav className="mt-3 d-flex justify-content-center">
                <ul className="pagination">
                  <li
                    className={`page-item ${
                      currentPage === 1 ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, i) => (
                    <li
                      key={i}
                      className={`page-item ${
                        currentPage === i + 1 ? "active" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    </li>
                  ))}
                  <li
                    className={`page-item ${
                      currentPage === totalPages ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        </div>

        {/* summary modal */}
        <div
          className="modal fade"
          id="exampleModal"
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h1 className="modal-title fs-5" id="exampleModalLabel">
                  Request summary
                </h1>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <p>Total owners sent: {requestDetails?.owners.length ?? 0}</p>
                <p>Pending: {requestDetails?.ownersPending.length ?? 0}</p>
                <p>Accepted: {requestDetails?.ownersAccepted.length ?? 0}</p>
                <p>Rejected: {requestDetails?.ownersRejected.length ?? 0}</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className={`${styles.secondaryButton} btn`}
                  data-bs-dismiss="modal"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default RequesterSentRequestsDetails;
