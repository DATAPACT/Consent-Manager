import styles from "../../css/Ontology.module.css";

// components
import Footer from "../Footer/Footer";

// libraries
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import React, { useState } from "react";
import { db } from "../../firebase"; // Ensure your Firestore instance is imported
import { doc, setDoc } from "firebase/firestore";
import { auth } from "../../firebase";

const UploadOntology: React.FC = () => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Initialize navigate

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      setError("Ontology name is required");
      return;
    }

    try {
      setLoading(true);
      const requesterId = auth.currentUser?.uid;

      if (requesterId) {
        // Reference to the ontologies collection
        const docRef = doc(db, "ontologies", requesterId + "-" + name);

        // Add the ontology name to Firestore
        await setDoc(docRef, {
          name: name,
        });

        setName("");
        setError("");
        alert("Ontology uploaded successfully!");

        // Navigate to /requesterBase/Ontologies after successful upload
        navigate("/requesterBase/Ontologies");
      }
    } catch (error) {
      setError("Error uploading ontology");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={`${styles.dashboard} container w-50`}>
        <Link
          className="text-decoration-none"
          to="/requesterBase/Ontologies"
          role="button"
        >
          <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;Back
        </Link>

        <h3 className="mt-4">Send request</h3>
        <p>Submit requests to data owners for review and action</p>

        <hr />

        <form className="w-50" onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>
              Ontology name
            </label>
            <input
              type="text"
              className={`${styles.formInput} form-control`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="mt-4">
            <button
              type="submit"
              className={`${styles.primaryButton} btn`}
              disabled={loading}
            >
              {loading ? "Uploading..." : "Upload Ontology"}
            </button>
          </div>
        </form>

        {error && <p className="text-danger">{error}</p>}

        <h5 className="mt-5">Uploading an ontology</h5>
        <p>
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Corporis
          nemo sint non tenetur delectus officiis reiciendis eos vitae quisquam?
          Fugit rem culpa minus, quae et nulla eius ratione veniam itaque.
        </p>

        <h5 className="mt-4">What happens next?</h5>
        <p>
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Corporis
          nemo sint non tenetur delectus officiis reiciendis eos vitae quisquam?
          Fugit rem culpa minus, quae et nulla eius ratione veniam itaque.
        </p>
      </div>

      <Footer />
    </>
  );
};

export default UploadOntology;
