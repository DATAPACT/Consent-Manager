import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
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
  const [ownersPending, setOwnersPending] = useState<string[]>([]);
  const [ownersAccepted, setOwnersAccepted] = useState<string[]>([]);
  const [ownersRejected, setOwnersRejected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
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

  const navigate = useNavigate();

  // Fetch owners and request state
  useEffect(() => {
    const fetchOwnersAndRequest = async () => {
      try {
        const ownersSnapshot = await getDocs(collection(db, "owners"));
        const owners: { email: string; id: string; name?: string }[] = [];
        ownersSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.email) {
            owners.push({
              email: data.email,
              id: doc.id,
              name: data.name || "Unknown",
            });
          }
        });
        setAllOwners(owners);

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

  const handleEmailSelect = () => {
    const inputs = emailInput
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email !== "");

    if (inputs.length === 0) return;

    const sentOwnerEmails = allOwners
      .filter((owner) =>
        [...ownersPending, ...ownersAccepted, ...ownersRejected].includes(
          owner.id
        )
      )
      .map((owner) => owner.email.toLowerCase());

    const selectedEmails = selectedOwners.map((o) => o.email.toLowerCase());
    const alreadySent = new Set([...sentOwnerEmails, ...selectedEmails]);

    const newOwners = inputs
      .filter((email) => !alreadySent.has(email))
      .map((email) => {
        const owner = allOwners.find((o) => o.email.toLowerCase() === email);
        return {
          email,
          id: owner ? owner.id : "",
          name: owner?.name || "",
        };
      });

    if (newOwners.length > 0) {
      setSelectedOwners((prev) => [...prev, ...newOwners]);
    }

    setEmailInput("");
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
        sentAt: `${days[now.getDay()]} ${now
          .getDate()
          .toString()
          .padStart(2, "0")} ${
          months[now.getMonth()]
        } ${now.getFullYear()} ${now
          .getHours()
          .toString()
          .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
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
          <div className="d-flex">
            <textarea
              rows={5}
              className={`${styles.formInput} form-control me-2`}
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Enter one or more emails, separated by commas"
            />
          </div>
          <button
            type="button"
            className={`${styles.primaryButton} btn btn-sm mt-2 mb-3`}
            onClick={handleEmailSelect}
          >
            Add email(s)
          </button>

          {selectedOwners.length > 0 && (
            <table className="table table-bordered table-sm mt-3">
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
          )}
        </div>
      </form>

      <div className="alert alert-warning" role="alert">
        <strong>Note:</strong> If you add one or more emails and they don't
        appear above, it means you've already sent this request to those
        recipients.
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
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Request"}
        </button>
      </div>
    </div>
  );
}

export default SendDraftRequest;
