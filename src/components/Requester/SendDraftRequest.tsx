import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getRequest, updateRequest, getAllOwners } from "../../services/api";
import styles from "../../css/Ontology.module.css";

function SendDraftRequest() {
  const { requestId } = useParams();
  const [emailInput, setEmailInput] = useState<string>("");
  const [allOwners, setAllOwners] = useState<
    { email: string; id: string; name?: string }[]
  >([]);
  const [selectedOwners, setSelectedOwners] = useState<
    { email: string; id: string; name?: string }[]
  >([]);
  const [owners, setOwners] = useState<string[]>([]);
  const [ownersPending, setOwnersPending] = useState<string[]>([]);
  const [ownersAccepted, setOwnersAccepted] = useState<string[]>([]);
  const [ownersRejected, setOwnersRejected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [filteredOwners, setFilteredOwners] = useState<
    { email: string; id: string; name?: string }[]
  >([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const now = new Date();
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Get owner details by ID
  const getOwnerById = (ownerId: string) => {
    return allOwners.find((owner) => owner.id === ownerId);
  };

  // Get status for an owner
  const getOwnerStatus = (ownerId: string) => {
    if (ownersAccepted.includes(ownerId)) return "Accepted";
    if (ownersRejected.includes(ownerId)) return "Rejected";
    if (ownersPending.includes(ownerId)) return "Pending";
    return "Unknown";
  };

  // Get all sent owners with their status
  const getSentOwnersWithStatus = () => {
    const allSentOwnerIds = [
      ...new Set([...ownersPending, ...ownersAccepted, ...ownersRejected]),
    ];
    return allSentOwnerIds.map((ownerId) => {
      const owner = getOwnerById(ownerId);
      return {
        id: ownerId,
        name: owner?.name || "Unknown",
        email: owner?.email || "Unknown",
        status: getOwnerStatus(ownerId),
      };
    });
  };

  // Fetch owners and request state
  useEffect(() => {
    const fetchOwnersAndRequest = async () => {
      try {
        // Fetch all owners using the API endpoint
        const ownersResult = await getAllOwners();
        if (ownersResult.success) {
          setAllOwners(ownersResult.owners);
        } else {
          console.error("Failed to fetch owners:", ownersResult.error);
          setAllOwners([]);
        }

        if (requestId) {
          const result = await getRequest(requestId);
          console.log("=== FULL REQUEST RESULT ===");
          console.log(result);
          console.log("=========================");

          // FIX: Check for result.data instead of result.request
          if (result.success && result.data) {
            const requestData = result.data;
            console.log("Request owners:", requestData.owners);
            console.log("Request ownersPending:", requestData.ownersPending);
            console.log("Request ownersAccepted:", requestData.ownersAccepted);
            console.log("Request ownersRejected:", requestData.ownersRejected);

            setOwners(requestData.owners || []);
            setOwnersPending(requestData.ownersPending || []);
            setOwnersAccepted(requestData.ownersAccepted || []);
            setOwnersRejected(requestData.ownersRejected || []);
          } else {
            console.warn("Request data not found or invalid structure");
            setOwners([]);
            setOwnersPending([]);
            setOwnersAccepted([]);
            setOwnersRejected([]);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setAllOwners([]);
        setOwners([]);
        setOwnersPending([]);
        setOwnersAccepted([]);
        setOwnersRejected([]);
      }
    };

    fetchOwnersAndRequest();
  }, [requestId]);

  // Handle input change and filter owners
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmailInput(value);

    if (value.trim() === "") {
      setFilteredOwners([]);
      setShowDropdown(false);
      return;
    }

    // Filter owners based on name or email
    const searchTerm = value.toLowerCase();
    const sentOwnerIds = [
      ...ownersPending,
      ...ownersAccepted,
      ...ownersRejected,
    ];
    const selectedOwnerIds = selectedOwners.map((o) => o.id);
    const alreadyAddedIds = new Set([...sentOwnerIds, ...selectedOwnerIds]);

    const filtered = allOwners.filter((owner) => {
      // Skip already added owners
      if (alreadyAddedIds.has(owner.id)) return false;

      const nameMatch = owner.name?.toLowerCase().includes(searchTerm);
      const emailMatch = owner.email.toLowerCase().includes(searchTerm);
      return nameMatch || emailMatch;
    });

    setFilteredOwners(filtered);
    setShowDropdown(filtered.length > 0);
  };

  // Handle selecting an owner from dropdown
  const handleSelectOwner = (owner: {
    email: string;
    id: string;
    name?: string;
  }) => {
    setSelectedOwners((prev) => [...prev, owner]);
    setEmailInput("");
    setFilteredOwners([]);
    setShowDropdown(false);
  };

  const removeOwner = (email: string) => {
    setSelectedOwners(selectedOwners.filter((o) => o.email !== email));
  };

  const handleSendRequest = async () => {
    if (selectedOwners.length === 0) {
      alert("Please add at least one valid owner.");
      return;
    }

    if (!requestId) {
      alert("Request ID is missing.");
      return;
    }

    setLoading(true);

    try {
      const newOwnerIds = selectedOwners.map((o) => o.id);

      console.log("=== BEFORE SENDING ===");
      console.log("Current owners state:", owners);
      console.log("Current ownersPending state:", ownersPending);
      console.log("New owner IDs to add:", newOwnerIds);

      // Combine existing owners with new owners (avoid duplicates)
      const allOwnerIds = [...new Set([...owners, ...newOwnerIds])];
      const allPendingIds = [...new Set([...ownersPending, ...newOwnerIds])];

      console.log("Combined owner IDs to send:", allOwnerIds);
      console.log("Combined pending IDs to send:", allPendingIds);
      console.log("=====================");

      const updatePayload = {
        owners: allOwnerIds,
        ownersPending: allPendingIds,
        status: "sent",
        sentAt: `${days[now.getDay()]} ${now
          .getDate()
          .toString()
          .padStart(2, "0")} ${
          months[now.getMonth()]
        } ${now.getFullYear()} ${now
          .getHours()
          .toString()
          .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
      };

      console.log("=== SENDING PAYLOAD ===");
      console.log(updatePayload);
      console.log("consumer dashboard", updatePayload);
      console.log("======================");

      const result = await updateRequest(requestId, updatePayload);

      console.log("=== UPDATE RESULT ===");
      console.log(result);
      console.log("====================");

      if (result.success) {
        alert("Request sent successfully!");
        // Clear selected owners after sending
        setSelectedOwners([]);

        // Refresh the request data to show updated status
        console.log("=== REFRESHING DATA ===");
        const updatedResult = await getRequest(requestId);
        console.log("Updated result:", updatedResult);

        // FIX: Check for updatedResult.data instead of updatedResult.request
        if (updatedResult.success && updatedResult.data) {
          const requestData = updatedResult.data;
          console.log("New owners from DB:", requestData.owners);
          console.log("New ownersPending from DB:", requestData.ownersPending);

          setOwners(requestData.owners || []);
          setOwnersPending(requestData.ownersPending || []);
          setOwnersAccepted(requestData.ownersAccepted || []);
          setOwnersRejected(requestData.ownersRejected || []);
        }
        console.log("======================");
      } else {
        alert("Error sending request. Please try again.");
      }
    } catch (error) {
      console.error("Error sending request:", error);
      alert("Error sending request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sentOwners = getSentOwnersWithStatus();

  return (
    <div className={`${styles.dashboard} container w-50`}>
      <Link
        className="text-decoration-none"
        to="/requesterBase/requesterRequests"
      >
        <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;Back
      </Link>

      <h3 className="mt-4">Send Request</h3>
      <p>Submit requests to data owners for review and action.</p>
      <hr />

      {/* Show already sent requests */}
      {sentOwners.length > 0 && (
        <div className="mb-4">
          <h5>Already sent to</h5>
          <table className="table table-bordered table-sm">
            <thead>
              <tr>
                <th className="px-2">Name</th>
                <th className="px-2">Email</th>
                <th className="px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {sentOwners.map((owner) => (
                <tr key={owner.id}>
                  <td className="px-2">{owner.name}</td>
                  <td className="px-2">{owner.email}</td>
                  <td className="px-2">
                    {owner.status === "Accepted" && (
                      <span className="badge bg-success">Accepted</span>
                    )}
                    {owner.status === "Rejected" && (
                      <span className="badge bg-danger">Rejected</span>
                    )}
                    {owner.status === "Pending" && (
                      <span className="badge bg-warning text-dark">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form className="w-50" onSubmit={(e) => e.preventDefault()}>
        <div className="mb-3">
          <label className={`${styles.formLabel} form-label`}>
            Add New Recipients
          </label>
          <div className="position-relative">
            <input
              type="text"
              className={`${styles.formInput} form-control`}
              value={emailInput}
              onChange={handleInputChange}
              onFocus={() =>
                emailInput && setShowDropdown(filteredOwners.length > 0)
              }
              placeholder="Type name or email to search..."
            />

            {/* Dropdown for autocomplete */}
            {showDropdown && filteredOwners.length > 0 && (
              <div
                className="position-absolute w-100 bg-white border rounded-0 shadow-sm mt-1"
                style={{ maxHeight: "200px", overflowY: "auto", zIndex: 1000 }}
              >
                {filteredOwners.map((owner) => (
                  <div
                    key={owner.id}
                    className="p-2 cursor-pointer"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSelectOwner(owner)}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f8f9fa")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "white")
                    }
                  >
                    <strong>{owner.name || "Unknown"}</strong> &lt;{owner.email}
                    &gt;
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedOwners.length > 0 && (
            <div className="mt-3">
              <p className="mb-2">
                <strong>
                  New Recipients to Add ({selectedOwners.length}):
                </strong>
              </p>
              <table className="table table-bordered table-sm">
                <thead>
                  <tr>
                    <th className="px-2">Name</th>
                    <th className="px-2">Email</th>
                    <th className="px-2">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOwners.map((owner) => (
                    <tr key={owner.email}>
                      <td className="px-2">{owner.name || "Unknown"}</td>
                      <td className="px-2">{owner.email}</td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-sm text-center"
                          onClick={() => removeOwner(owner.email)}
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </form>

      <div className="alert alert-warning" role="alert">
        <strong>Note:</strong> If you search for someone and they don't appear,
        it means you've already sent this request to them.
      </div>

      <h5 className="mt-4">Sending a request</h5>
      <p>
        The recipient's email is required. If they don't have an account in the
        system, they will be notified by email. However, they must create an
        account to view your request and take action.
      </p>

      <h5 className="mt-4">What happens next?</h5>
      <p>
        Once the request is sent, the recipient will be notified. Please note
        that it may take some time for them to get back to you with a decision.
      </p>

      <div className="mt-4">
        <button
          className={`${styles.primaryButton} btn`}
          onClick={handleSendRequest}
          disabled={loading || selectedOwners.length === 0}
        >
          {loading ? "Sending..." : `Send Request`}
        </button>
      </div>
    </div>
  );
}

export default SendDraftRequest;
