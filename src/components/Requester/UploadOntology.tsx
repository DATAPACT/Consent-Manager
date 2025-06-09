import styles from "../../css/Ontology.module.css";

// libraries
import { Link, useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { db, storage, auth } from "../../firebase"; // Make sure auth and storage are exported
import {
  doc,
  setDoc,
  Timestamp,
  collection,
  updateDoc,
  getDoc,
  arrayUnion,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const UploadOntology: React.FC = () => {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !file) {
      setError("Ontology name and file are required");
      return;
    }

    try {
      setLoading(true);
      const requesterId = auth.currentUser?.uid;

      if (!requesterId) {
        setError("User not authenticated");
        return;
      }

      const docRef = doc(collection(db, "ontologies"));
      const storageRef = ref(storage, `ontologies/${docRef.id}/${file.name}`);

      // Upload file to Firebase Storage
      await uploadBytes(storageRef, file);

      // Get file download URL
      const fileURL = await getDownloadURL(storageRef);

      // Save ontology metadata
      await setDoc(docRef, {
        name,
        fileURL,
        uploadedAt: Timestamp.fromDate(new Date()),
      });

      // Update user's ontologies array
      const userDocRef = doc(db, "requesters", requesterId);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        await updateDoc(userDocRef, {
          ontologies: arrayUnion(docRef.id),
        });
      } else {
        setError("User document not found");
        return;
      }

      setName("");
      setFile(null);
      setError("");
      alert("Ontology uploaded successfully!");
      navigate("/requesterBase/Ontologies");
    } catch (err) {
      setError("Error uploading ontology");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.dashboard} container w-50`}>
      <Link
        className="text-decoration-none"
        to="/requesterBase/Ontologies"
        role="button"
      >
        <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;Back
      </Link>

      <h3 className="mt-4">Upload ontology</h3>
      <p>
        Upload your ontology to seamlessly integrate data and enhance analysis.
      </p>

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

        <div className="mb-3">
          <label className={`${styles.formLabel} form-label`}>
            Ontology file
          </label>
          <input
            type="file"
            accept=".rdf,.owl,.ttl,.xml,.jsonld,.json"
            className={`${styles.formInput} form-control`}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
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

      {error && <p className="text-danger mt-3">{error}</p>}

      <h5 className="mt-5">Uploading an ontology</h5>
      <p>
        Please ensure your ontology is in a compatible format (e.g., OWL, RDF)
        to easily integrate it into our system.
      </p>

      <h5 className="mt-4">What happens next?</h5>
      <p>
        You can include your ontologies in your requests. This allows you to
        leverage your ontology for structured data processing.
      </p>
    </div>
  );
};

export default UploadOntology;
