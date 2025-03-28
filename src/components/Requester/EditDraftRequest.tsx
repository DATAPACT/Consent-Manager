import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
} from "firebase/firestore"; // Import Firestore methods
import { db } from "../../firebase"; // Ensure Firebase instance is correctly imported

// css
import styles from "../../css/CreateRequest.module.css";

// components
import Footer from "../Footer/Footer";

function EditDraftRequest() {
  const { requestId } = useParams(); // Get the request ID from the URL
  const [requestData, setRequestData] = useState<any>(null); // State to hold the fetched request data
  const [ontologies, setOntologies] = useState<any[]>([]); // State to hold the fetched ontology names and ids
  const [selectedOntologyIds, setSelectedOntologyIds] = useState<string[]>([]); // State for selected ontology IDs
  const [loading, setLoading] = useState(true); // State to handle loading status
  const [error, setError] = useState<string>(""); // State for error messages
  const [updatedRequestData, setUpdatedRequestData] = useState<any>({}); // State to hold updated request data

  const navigate = useNavigate(); // Replacing history with useNavigate

  useEffect(() => {
    const fetchRequestData = async () => {
      try {
        const requestRef = doc(db, "requests", requestId!); // Reference to the specific draft request
        const requestSnapshot = await getDoc(requestRef); // Fetch the request data
        if (requestSnapshot.exists()) {
          const requestData = requestSnapshot.data();
          setRequestData(requestData); // Set the fetched request data into state
          fetchOntologyNames(requestData?.ontologies || []); // Fetch ontology names if IDs are present
        } else {
          setError("Request not found");
        }
      } catch (error) {
        setError("An error occurred while fetching the request");
        console.error(error);
      }
      setLoading(false); // Set loading to false once the data is fetched
    };

    // Fetch ontology names based on IDs
    const fetchOntologyNames = async (ontologyIds: string[]) => {
      try {
        const ontologyRef = collection(db, "ontologies"); // Reference to the ontologies collection
        const ontologySnapshot = await getDocs(ontologyRef); // Fetch all ontology documents
        const ontologyMap = ontologySnapshot.docs.reduce((map: any, doc) => {
          map[doc.id] = doc.data().name; // Map ID to name
          return map;
        }, {});

        const allOntologies = ontologySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        })); // Map all ontologies with both ID and Name

        const selectedOntologyIds = ontologyIds; // The selected ontologies are based on their IDs from the request data

        setOntologies(allOntologies); // Set the full list of ontologies
        setSelectedOntologyIds(selectedOntologyIds); // Set the selected ontology IDs
        setUpdatedRequestData((prevData: any) => ({
          ...prevData,
          ontologies: selectedOntologyIds, // Initialize selected ontology IDs
        }));
      } catch (error) {
        setError("An error occurred while fetching ontology names");
        console.error(error);
      }
    };

    if (requestId) {
      fetchRequestData(); // Fetch data if 'id' is present
    }
  }, [requestId]);

  if (loading) {
    return <div>Loading...</div>; // Show loading state while data is being fetched
  }

  if (error) {
    return <div className="text-danger">{error}</div>; // Show error if any occurs during fetching
  }

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUpdatedRequestData((prevData: any) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle ontology selection changes
  const handleOntologyChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    ontologyId: string
  ) => {
    const isChecked = e.target.checked;
    setUpdatedRequestData((prevData: any) => {
      const updatedOntologyIds = isChecked
        ? [...(prevData.ontologies || []), ontologyId] // Add ID if checked
        : prevData.ontologies?.filter((id: string) => id !== ontologyId); // Remove ID if unchecked

      setSelectedOntologyIds(updatedOntologyIds); // Update selected ontology IDs
      return {
        ...prevData,
        ontologies: updatedOntologyIds,
      };
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent the form from reloading the page

    try {
      const requestRef = doc(db, "requests", requestId!); // Reference to the specific draft request
      await updateDoc(requestRef, updatedRequestData); // Update the request document with the updated data
      navigate("/requesterBase/requesterRequests"); // Redirect to the requester requests page
    } catch (error) {
      setError("An error occurred while updating the request");
      console.error(error);
    }
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

        <h3 className="mt-4">Edit request</h3>
        <p>
          Update your request by specifying the necessary details, including
          relevant parameters and requirements.
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
              id="requestName"
              name="requestName"
              defaultValue={requestData?.requestName}
              onChange={handleChange} // Track changes to the input
              required
            />
          </div>

          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>
              Choose one or more ontologies
            </label>
            {ontologies.length > 0 ? (
              ontologies.map(
                (ontology: { id: string; name: string }, index: number) => (
                  <div className="form-check mt-2" key={index}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      value={ontology.id}
                      id={`ontology-${index}`}
                      checked={selectedOntologyIds.includes(ontology.id)} // Check if this ontology is selected by ID
                      onChange={(e) => handleOntologyChange(e, ontology.id)} // Handle checkbox changes
                    />
                    <label className="form-check-label">{ontology.name}</label>
                  </div>
                )
              )
            ) : (
              <div>No ontologies found.</div>
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
                aria-label="Start Date"
                name="startDate"
                defaultValue={requestData?.startDate}
                onChange={handleChange} // Track changes to the start date
              />
            </div>
            <div className="col">
              <label className={`${styles.formLabel} form-label`}>
                End date
              </label>
              <input
                type="date"
                className={`${styles.formInput} form-control`}
                aria-label="End Date"
                name="endDate"
                defaultValue={requestData?.endDate}
                onChange={handleChange} // Track changes to the end date
              />
            </div>
          </div>

          <button className={`${styles.primaryButton} btn mt-3`}>
            Update request
          </button>
        </form>
      </div>

      <Footer />
    </>
  );
}

export default EditDraftRequest;
