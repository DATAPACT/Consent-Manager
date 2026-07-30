import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getRequest, getAllOwners, sendRequest } from "../../services/api";
import styles from "../../css/Ontology.module.css";
import { t } from "i18next";

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

// Source - https://stackoverflow.com/a/46181
// Posted by John Rutherford, modified by community. See post 'Timeline' for change history
// Retrieved 2026-03-20, License - CC BY-SA 4.0

const validateEmail = (email: string) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

  // const sendEmailToUnregisteredUser = (email: string) => {
  //   const actionCodeSettings = {
  //     // URL you want to redirect back to. The domain (www.example.com) for this
  //     // URL must be in the authorized domains list in the Firebase Console.
  //     url: "https://dips.soton.ac.uk/consent-manager/login",
  //     // This must be true.
  //     handleCodeInApp: true,
  //     iOS: {
  //       bundleId: 'com.example.ios'
  //     },
  //     android: {
  //       packageName: 'com.example.android',
  //       installApp: true,
  //       minimumVersion: '12'
  //     },
  //     // The domain must be configured in Firebase Hosting and owned by the project.
  //     linkDomain: 'custom-domain.com'
  //   };
  // }

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

  const addOwner = (owner: {
    email: string;
    id: string;
    name?: string;
  }) => {
    if (validateEmail(owner.email)){
      setSelectedOwners((prev) => [...prev, owner]);
      setEmailInput("");
      setFilteredOwners([]);
      setShowDropdown(false);
    }
    else{
      alert(t("invalid_email_warning"));
      return;
    }
  };

  const removeOwner = (email: string) => {
    setSelectedOwners(selectedOwners.filter((o) => o.email !== email));
  };

  const handleSendRequest = async () => {
    if (selectedOwners.length === 0) {
      alert(t("send_request_warning_1"));
      return;
    }

    if (!requestId) {
      alert(t("request_id_missing"));
      return;
    }

    setLoading(true);

    try {
      const newOwnerIds = selectedOwners.filter((o) => o.id != "").map((o) => o.id);
      const unregisteredOwners = selectedOwners.filter((o) => o.id === "").map((o) => o.email);

      console.log("=== BEFORE SENDING ===");
      console.log("Current owners state:", owners);
      console.log("Current ownersPending state:", ownersPending);
      console.log("New owner IDs to add:", newOwnerIds);
      console.log("Unregistered users:", unregisteredOwners);

      //TODO: Register new users for each unregistered user.
      // for (let owner of unregisteredOwners) {
      //   let tempResponse = await registerTemporaryUser(
      //     {
      //       email: owner.email,
      //       name: "default",
      //       role: "owner",
      //       emailVerified: false
      //     }
      //   );
      //   if (tempResponse.success && tempResponse.user.uid) {
      //     newOwnerIds.push(tempResponse.user.uid);
      //   }
      //   else {
      //     console.error("Unable to register email: ", owner.email);
      //   }
      // }
      // Combine existing owners with new owners (avoid duplicates)
      const allOwnerIds = [...new Set([...owners, ...newOwnerIds])];
      const allPendingIds = [...new Set([...ownersPending, ...newOwnerIds])];

      console.log("Combined owner IDs to send:", allOwnerIds);
      console.log("Combined pending IDs to send:", allPendingIds);
      console.log("=====================");

      const updatePayload = {
        owners: allOwnerIds,
        ownersPending: allPendingIds,
        user_emails: unregisteredOwners,
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

      const result = await sendRequest(requestId, updatePayload);

      console.log("=== UPDATE RESULT ===");
      console.log(result);
      console.log("====================");

      if (result.success) {
        alert(t("request_sent_successfully"));
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
        alert(t("error_sending_request"));
      }
    } catch (error) {
      console.error("Error sending request:", error);
      alert("Error sending request. Please try again.");
    } finally {
      setLoading(false);
      location.reload();
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

      <h3 className="mt-4">{t("send_request")}</h3>
      <p>{t("send_request_desc")}</p>
      <hr />

      {/* Show already sent requests */}
      {sentOwners.length > 0 && (
        <div className="mb-4">
          <h5>{t("already_sent_to")}</h5>
          <table className="table table-bordered table-sm">
            <thead>
              <tr>
                <th className="px-2">{t("name")}</th>
                <th className="px-2">{t("email")}</th>
                <th className="px-2">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {sentOwners.map((owner) => (
                <tr key={owner.id}>
                  <td className="px-2">{owner.name}</td>
                  <td className="px-2">{owner.email}</td>
                  <td className="px-2">
                    {owner.status === "Accepted" && (
                      <span className="badge bg-success">{t("accepted")}</span>
                    )}
                    {owner.status === "Rejected" && (
                      <span className="badge bg-danger">{t("rejected")}</span>
                    )}
                    {owner.status === "Pending" && (
                      <span className="badge bg-warning text-dark">
                        {t("pending")}
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
            {t("add_new_recipients")}
          </label>
          <div className="position-relative w-75" style={{display: "inline-block"}}>
            <input
              type="text"
              className={`${styles.formInput} form-control`}
              value={emailInput}
              onChange={handleInputChange}
              onFocus={() =>
                emailInput && setShowDropdown(filteredOwners.length > 0)
              }
              placeholder={t("type_name_email_to_search")}
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
                    <strong>{owner.name || t("unknown")}</strong> &lt;{owner.email}
                    &gt;
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="position-relative w-25" style={{display: "inline-block"}}>
            <button
              type="button"
              className="btn btn-sm text-center"
              onClick={() => addOwner({email: emailInput, id: ""})}
            >
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>

          {selectedOwners.length > 0 && (
            <div className="mt-3">
              <p className="mb-2">
                <strong>
                  {t("new_recipients_to_add")} ({selectedOwners.length}):
                </strong>
              </p>
              <table className="table table-bordered table-sm">
                <thead>
                  <tr>
                    <th className="px-2">{t("name")}</th>
                    <th className="px-2">{t("email")}</th>
                    <th className="px-2">{t("remove")}</th>
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
        <strong>{t("note")}:</strong> {t("sending_a_request_alert")}
      </div>

      <h5 className="mt-4">{t("sending_a_request")}</h5>
      <p>
        {t("sending_a_request_msg")}
      </p>

      <h5 className="mt-4">{t("what_happens_next")}</h5>
      <p>
        {t("what_happens_next_desc")}
      </p>

      <div className="mt-4">
        <button
          className={`${styles.primaryButton} btn`}
          onClick={handleSendRequest}
          disabled={loading || selectedOwners.length === 0}
        >
          {loading ? `${t("sending")}...` : t("send_request")}
        </button>
      </div>
    </div>
  );
}

export default SendDraftRequest;
