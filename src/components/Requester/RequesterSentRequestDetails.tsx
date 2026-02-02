import styles from "../../css/CreateRequest.module.css";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getRequest, getAllOwners } from "../../services/api";
import { useIframe } from "../../IframeContext";
import { getRequestPermissions } from "../../utils/policyParser";

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
  constraints?: Array<{
    leftOperand: string;
    operator: string;
    rightOperand: any;
    description: string;
  }>;
  assignees?: Array<{
    source: string;
    refinements?: Array<{
      leftOperand: string;
      operator: string;
      rightOperand: any;
      description: string;
    }>;
  }>;
}

interface Request {
  id: string;
  requestName: string;
  requester: {
    requesterName: string;
    requesterEmail: string;
  };
  permissions: Permission[];
  policy?: any; // ODRL policy
  status: string;
  owners: string[];
  ownersPending: string[];
  ownersAccepted: string[];
  ownersRejected: string[];
}

function RequesterSentRequestsDetails() {
  const { requestId } = useParams<{ requestId: string }>();
  const { isIframeMode } = useIframe();
  const [requestDetails, setRequestDetails] = useState<Request | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [allOwners, setAllOwners] = useState<
    { email: string; id: string; name?: string }[]
  >([]);

  const [ownerDetails, setOwnerDetails] = useState<
    { name: string; email: string; status: string }[]
  >([]);

  // Fetching all owners from the database
  useEffect(() => {
    const fetchAllOwners = async () => {
      try {
        const ownersResult = await getAllOwners();
        if (ownersResult.success) {
          setAllOwners(ownersResult.owners);
        } else {
          console.error("Failed to fetch owners:", ownersResult.error);
          setAllOwners([]);
        }
      } catch (error) {
        console.error("Error fetching all owners:", error);
        setAllOwners([]);
      }
    };

    fetchAllOwners();
  }, []);

  // Fetching the owners' details
  useEffect(() => {
    const fetchOwnerDetails = () => {
      if (!requestDetails?.owners || allOwners.length === 0) return;

      const owners = requestDetails.owners;
      const ownersDetails = owners.map((ownerId) => {
        // Find the owner in allOwners by ID
        const owner = allOwners.find((o) => o.id === ownerId);

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
          name: owner?.name || "Unknown",
          email: owner?.email || "N/A",
          status,
        };
      });

      setOwnerDetails(ownersDetails);
    };

    fetchOwnerDetails();
  }, [requestDetails, allOwners]); // Re-fetch when requestDetails or allOwners change

  // Fetching request details
  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (!requestId) {
        setError("Invalid request ID.");
        setLoading(false);
        return;
      }

      try {
        const result = await getRequest(requestId);

        if (result.success) {
          setRequestDetails(result.data as Request);
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

    const matchesSearch =
      owner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.name.toLowerCase().includes(searchTerm.toLowerCase());

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
      <div
        className={`${styles.dashboard} container w-50`}
        style={isIframeMode ? { marginTop: "20px" } : {}}
      >
        {!isIframeMode && (
          <Link
            className="text-decoration-none"
            to="/requesterBase/requesterRequests"
            role="button"
          >
            <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;Back
          </Link>
        )}
        <h3 className={isIframeMode ? "mt-2" : "mt-4"}>
          {requestDetails.requestName}
        </h3>

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
            className="tab-pane fade show active mt-5"
            id="home-tab-pane"
            role="tabpanel"
            aria-labelledby="home-tab"
          >
            {(() => {
              // Parse permissions from ODRL policy or fallback to legacy permissions
              const parsedPermissions = getRequestPermissions(requestDetails);

              return parsedPermissions.map((permission, ruleIndex) => (
                <div key={ruleIndex} className="mb-4">
                  <h4>Permission {ruleIndex + 1}</h4>

                  <h5>Dataset:</h5>
                  <p>{permission.dataset}</p>

                  {permission.datasetRefinements?.length > 0 && (
                    <div>
                      <h5>Dataset permissions:</h5>
                      <ul className="list-unstyled">
                        {permission.datasetRefinements.map((ref, i) => (
                          <li key={i}>
                            Read access to <strong>{ref.attribute}</strong>{" "}
                            items greater than <strong>{ref.value}</strong>.
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <h5>Action:</h5>
                  <p>{permission.action}</p>

                  {permission.actionRefinements?.length > 0 && (
                    <div>
                      <h5>Action permissions:</h5>
                      <ul className="list-unstyled">
                        {permission.actionRefinements.map((ref, i) => (
                          <li key={i}>
                            Write access to <strong>{ref.attribute}</strong>{" "}
                            items greater than <strong>{ref.value}</strong>.
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
              ));
            })()}
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
              <div className="align-self-center">
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

              <div className="ms-auto w-25 flex-grow-1 align-self-center">
                <div className="input-group">
                  <input
                    type="text"
                    className={`${styles.formInput} form-control`}
                    placeholder="Search owner by name or email..."
                    aria-label="Recipient’s username"
                    aria-describedby="basic-addon2"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <span className="input-group-text" id="basic-addon2">
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </span>
                </div>
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
      </div>
    </>
  );
}

export default RequesterSentRequestsDetails;
