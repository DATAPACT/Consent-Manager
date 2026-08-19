import styles from "../../css/CreateRequest.module.css";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getRequest, getAllOwners } from "../../services/api";
import { useIframe } from "../../IframeContext";
import { Request } from "../Interfaces/Requests";
import { ODRLPolicy } from "../Interfaces/ODRL";

// components
import LoadingSpinner from "../LoadingSpinner";
import renderPermissions from "../../utils/renderPermissions";
import { useTranslation } from "react-i18next";
import { getAttributeDropdownValue, getFeatureDropdownValue, loadGraph } from "../../helperFunctions/RequestDropdowns";

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
  const { t, i18n } = useTranslation();
  const [labels, setLabels] = useState<any>();
    
    useEffect(() => {
      const loadDropdownValues = async () => {
        if (requestDetails?.selectedOntologies) {
          const store = await loadGraph(requestDetails?.selectedOntologies);
          const actions = await getFeatureDropdownValue(
            store,
            "action"
          );
          const purposes = await getFeatureDropdownValue(
            store,
            "purpose"
          );
          // NOTE: Currently, we load all left operands for all refinements. In the future, we might want to retrieve left operands that are valid with respect to the current ODRL element.
          const refinements = await getAttributeDropdownValue(store);
          const labels = actions.concat(purposes).concat(refinements);
          setLabels(labels);
        }
      };
      loadDropdownValues();
    },[requestDetails, i18n.language]);

  const downloadODRL = async (policy: ODRLPolicy | undefined, owner: {name: string, email: string, status: string}) => {
    if (!policy) {
      alert(
        t("policy_data_not_found")
      );
      return;
    }

    try {
      policy["odrl:permission"].forEach(permission => {
        delete permission["odrl:assignee"];
        if (owner) {
          if (permission["odrl:assigner"]){
            permission["odrl:assigner"]["odrl:source"]["@id"] = owner.email;
          }
          else{
            permission["odrl:assigner"] = {"odrl:source": {"@id": owner.email}};
          }
        }
      })
      console.log("policy is: ", policy);
      const json = JSON.stringify(policy, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `odrl_policy_${owner.name}.json`; // filename
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log("ODRL downloaded successfully.");
    } catch (err) {
      console.error("Error downloading ODRL:", err);
    }
  };

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
    return <div className="text-danger">{t("no_request_details_available")}</div>;

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
            <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;{t("back")}
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
              {t("request_details")}
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
              {t("status")}
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

            <text>
              {requestDetails.extraText ? requestDetails.extraText : ""}
            </text>

            {renderPermissions(requestDetails, t, labels)}
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
                  {t("filter_by_status")}:
                </label>
                <select
                  id="statusFilter"
                  className={`${styles.formInput} form-select w-auto d-inline-block`}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">{t("all")}</option>
                  <option value="Accepted">{t("accepted")}</option>
                  <option value="Rejected">{t("rejected")}</option>
                  <option value="Pending">{t("pending")}</option>
                </select>
              </div>

              <div className="ms-auto w-25 flex-grow-1 align-self-center">
                <div className="input-group">
                  <input
                    type="text"
                    className={`${styles.formInput} form-control`}
                    placeholder={t("search_owner_placeholder")}
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
                <h4>{t("no_matching_requests")}</h4>
                <p className="mt-2">
                  {t("no_matching_requests_text_1")}
                </p>
              </div>
            ) : (
              <table className="table mt-4">
                <thead>
                  <tr>
                    <th scope="col">{t("name")}</th>
                    <th scope="col">{t("email")}</th>
                    <th scope="col">{t("status")}</th>
                    <th scope="col"></th>
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
                      {owner.status === "Accepted" ? 
                        <td>
                        <button
                          className={`${styles.primaryButton} btn`}
                          onClick={() => downloadODRL(requestDetails?.policy, owner)}
                        >
                          {t("download_ODRL")}
                        </button>
                      </td>
                      : <td></td>}           
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
                      {t("previous")}
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
                      {t("next")}
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
