import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  doc,
  query,
  where,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import styles from "../../css/Ontology.module.css";

function SendDraftRequest() {
  const { requestId } = useParams();
  const [emailInput, setEmailInput] = useState<string>("");
  const [suggestions, setSuggestions] = useState<
    { email: string; id: string }[]
  >([]);
  const [allOwners, setAllOwners] = useState<{ email: string; id: string }[]>(
    []
  );
  const [selectedOwners, setSelectedOwners] = useState<
    { email: string; id: string }[]
  >([]);
  const [ownersPending, setOwnersPending] = useState<string[]>([]);
  const [ownersAccepted, setOwnersAccepted] = useState<string[]>([]);
  const [ownersRejected, setOwnersRejected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Fetch owners and request state
  useEffect(() => {
    const fetchOwnersAndRequest = async () => {
      try {
        // Fetch owners
        const ownersSnapshot = await getDocs(collection(db, "owners"));
        const owners: { email: string; id: string }[] = [];
        ownersSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.email) {
            owners.push({ email: data.email, id: doc.id });
          }
        });
        setAllOwners(owners);

        // Fetch current request details
        if (requestId) {
          const requestRef = doc(db, "requests", requestId);
          const requestSnap = await getDoc(requestRef);

          if (requestSnap.exists()) {
            const requestData = requestSnap.data();
            setOwnersPending(requestData.ownersPending || []);
            setOwnersAccepted(requestData.ownersAccepted || []);
            setOwnersRejected(requestData.ownersRejected || []);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchOwnersAndRequest();
  }, [requestId]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setEmailInput(input);

    if (input.trim() === "") {
      setSuggestions([]);
    } else {
      const filtered = allOwners.filter(
        (owner) =>
          owner.email.toLowerCase().includes(input.toLowerCase()) &&
          !selectedOwners.some((sel) => sel.email === owner.email)
      );
      setSuggestions(filtered);
    }
  };

  const handleEmailSelect = (selectedEmail: string) => {
    const owner = allOwners.find((o) => o.email === selectedEmail);
    if (!owner) return;

    const alreadySent = new Set([
      ...ownersPending,
      ...ownersAccepted,
      ...ownersRejected,
    ]);

    if (alreadySent.has(owner.id)) {
      alert("You have already sent this request to this owner.");
      return;
    }

    if (!selectedOwners.some((o) => o.email === owner.email)) {
      setSelectedOwners([...selectedOwners, owner]);
    }

    setEmailInput("");
    setSuggestions([]);
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
      const ownerIds = selectedOwners.map((o) => o.id);
      const requestRef = doc(db, "requests", requestId);

      await updateDoc(requestRef, {
        owners: [...ownersPending, ...ownerIds],
        ownersPending: [...ownersPending, ...ownerIds],
        status: "sent",
      });

      alert("Request sent successfully!");
      navigate("/requesterBase/requesterRequests");
    } catch (error) {
      console.error("Error sending request:", error);
      alert("Error sending request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

      <form className="w-50" onSubmit={(e) => e.preventDefault()}>
        <div className="mb-3">
          <label className={`${styles.formLabel} form-label`}>
            Recipients' Emails
          </label>
          <input
            type="text"
            className={`${styles.formInput} form-control`}
            value={emailInput}
            onChange={handleEmailChange}
            placeholder="Enter owner email"
          />
          {suggestions.length > 0 && (
            <ul
              className={`${styles.autocomplete} list-group position-absolute`}
            >
              {suggestions.map((suggestion) => (
                <li
                  key={suggestion.email}
                  className="list-group-item"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleEmailSelect(suggestion.email)}
                >
                  {suggestion.email}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3">
            {selectedOwners.map((owner) => (
              <span key={owner.email} className="border p-2 me-2">
                {owner.email}
                <button
                  type="button"
                  className="btn btn-sm ms-1"
                  onClick={() => removeOwner(owner.email)}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </span>
            ))}
          </div>
        </div>
      </form>

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
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Request"}
        </button>
      </div>
    </div>
  );
}

export default SendDraftRequest;
