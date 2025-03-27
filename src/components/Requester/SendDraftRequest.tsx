import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../../firebase"; // Make sure the firebase configuration is correct
import { collection, getDocs } from "firebase/firestore"; // Import necessary Firestore queries
import styles from "../../css/Ontology.module.css";
import Footer from "../Footer/Footer";

function SendDraftRequest() {
  const [email, setEmail] = useState<string>(""); // To store the user's email input
  const [suggestions, setSuggestions] = useState<
    { email: string; name: string }[]
  >([]); // To store the autocomplete suggestions
  const [allEmails, setAllEmails] = useState<{ email: string; name: string }[]>(
    []
  ); // To store all emails and names from the database

  // Fetch stored owner emails and names from Firestore
  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "owners"));
        const emails: { email: string; name: string }[] = [];
        querySnapshot.forEach((doc) => {
          const ownerEmail = doc.data().email; // Assuming email field is stored as 'email'
          const ownerName = doc.data().name; // Assuming name field is stored as 'name'
          if (ownerEmail && ownerName) {
            emails.push({ email: ownerEmail, name: ownerName });
          }
        });
        setAllEmails(emails); // Store all emails and names in state
      } catch (error) {
        console.error("Error fetching emails:", error);
      }
    };

    fetchEmails();
  }, []);

  // Handle the change in the email input field
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setEmail(input);

    if (input.trim() === "") {
      // If input is empty, clear the suggestions (no matching emails)
      setSuggestions([]);
    } else {
      // Filter the suggestions based on the input
      const filteredEmails = allEmails.filter(
        (owner) => owner.email.toLowerCase().includes(input.toLowerCase()) // Matching input (case-insensitive)
      );
      setSuggestions(filteredEmails); // Update suggestions
    }
  };

  // Handle selection of an email from suggestions
  const handleEmailSelect = (email: string) => {
    setEmail(email); // Set the selected email to the input field
    setSuggestions([]); // Clear the suggestions after selection
  };

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

        <h3 className="mt-4">Send request</h3>
        <p>Submit requests to data owners for review and action</p>

        <hr />

        <form className="w-50">
          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>
              Recipient's email
            </label>
            <input
              type="email"
              className={`${styles.formInput} form-control`}
              id="exampleInputEmail1"
              aria-describedby="emailHelp"
              value={email}
              onChange={handleEmailChange}
              required
            />
            {/* Autocomplete dropdown */}
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
                    {suggestion.email} ({suggestion.name}){" "}
                    {/* Display email and name */}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </form>

        <h5 className="mt-4">Sending a request</h5>
        <p>
          The recipient's email is required. If they don't have an account in
          the system, they will be notified by email. However, they must create
          an account to view your request and take action.
        </p>

        <h5 className="mt-4">What happens next?</h5>
        <p>
          Once the request is sent, the recipient will be notified. Please note
          that it may take some time for them to get back to you with a
          decision. If the matter is urgent or requires immediate attention,
          contact them directly.
        </p>

        <div className="mt-4">
          <button className={`${styles.primaryButton} btn`}>
            Send request
          </button>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default SendDraftRequest;
