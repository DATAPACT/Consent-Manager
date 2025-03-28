import styles from "../../css/CreateRequest.module.css";

// Libraries
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../../firebase"; // Firebase import
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore"; // Firestore functions

function CreateRequest() {
  const [ontologies, setOntologies] = useState<any[]>([]); // State to store fetched ontologies
  const [requestName, setRequestName] = useState(""); // State for request name
  const [selectedOntologies, setSelectedOntologies] = useState<string[]>([]); // State for selected ontologies (checkboxes)
  const [startDate, setStartDate] = useState(""); // State for start date
  const [endDate, setEndDate] = useState(""); // State for end date
  const [loading, setLoading] = useState(false); // State to track form submission
  const navigate = useNavigate(); // Initialize navigate

  useEffect(() => {
    const fetchOntologies = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const ontologiesQuery = collection(db, "ontologies");
        const querySnapshot = await getDocs(ontologiesQuery);
        const ontologiesData: any[] = [];
        querySnapshot.forEach((doc) => {
          ontologiesData.push({
            id: doc.id,
            name: doc.data().name,
          });
        });
        setOntologies(ontologiesData);
      } catch (error) {
        console.error("Error fetching ontologies:", error);
      }
    };

    fetchOntologies();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !requestName ||
      !startDate ||
      !endDate ||
      selectedOntologies.length === 0
    ) {
      alert("Please fill out all fields and select at least one ontology.");
      return;
    }

    setLoading(true);

    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Create a new request object with an empty owners array
      const requestData = {
        requesterId: user.uid,
        requestName,
        ontologies: selectedOntologies, // List of selected ontology IDs
        startDate: Timestamp.fromDate(new Date(startDate)),
        endDate: Timestamp.fromDate(new Date(endDate)),
        createdAt: Timestamp.fromDate(new Date()), // Timestamp when the request was created
        status: "draft", // Add this status field to the request data
        owners: [], // Empty array to store owner IDs in the future
      };

      // Store the request in Firestore (under 'requests' collection)
      const docRef = await addDoc(collection(db, "requests"), requestData);

      alert("Request created successfully!");
      // Reset form fields after submission
      setRequestName("");
      setSelectedOntologies([]);
      setStartDate("");
      setEndDate("");

      // Navigate to /requesterBase/requesterRequests after successful upload
      navigate("/requesterBase/requesterRequests");
    } catch (error) {
      console.error("Error creating request:", error);
      alert("Error creating request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (ontologyId: string) => {
    setSelectedOntologies((prev) =>
      prev.includes(ontologyId)
        ? prev.filter((id) => id !== ontologyId)
        : [...prev, ontologyId]
    );
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

        <h3 className="mt-4">Create request</h3>
        <p>
          Create and submit a new request by specifying the necessary details,
          including relevant parameters and requirements.
        </p>

        <hr />

        <form className="w-50" onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>
              Request name
            </label>
            <input
              type="text"
              className={`${styles.formInput} form-control`}
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>
              Choose one or more ontologies
            </label>
            {ontologies.length === 0 ? (
              <p>No ontologies available.</p>
            ) : (
              ontologies.map((ontology) => (
                <div className="form-check mt-2" key={ontology.id}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={selectedOntologies.includes(ontology.id)}
                    value={ontology.id}
                    id={`flexCheck${ontology.id}`}
                    onChange={() => handleCheckboxChange(ontology.id)}
                  />
                  <label
                    className="form-check-label"
                    htmlFor={`flexCheck${ontology.id}`}
                  >
                    {ontology.name}
                  </label>
                </div>
              ))
            )}
            <div id="emailHelp" className="form-text mt-3">
              * Choosing an ontology is an optional step.
            </div>
          </div>

          <div className="row mb-3">
            <div className="col">
              <label className={`${styles.formLabel} form-label`}>
                Start date
              </label>
              <input
                type="date"
                className={`${styles.formInput} form-control`}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="col">
              <label className={`${styles.formLabel} form-label`}>
                End date
              </label>
              <input
                type="date"
                className={`${styles.formInput} form-control`}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            className={`${styles.primaryButton} btn mt-3`}
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating request..." : "Create request"}
          </button>
        </form>
      </div>
    </>
  );
}

export default CreateRequest;
