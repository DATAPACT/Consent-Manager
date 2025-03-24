// css
import styles from "../../css/Ontology.module.css";

// components
import Footer from "../Footer/Footer";

// libraries
import { Link } from "react-router-dom";
import React, { useState } from "react";
import { auth, db, storage } from "../../firebase"; // Import Firebase services
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";

const Ontologies: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<string>("");

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent page reload

    if (!name || !file) {
      setError("Please provide a name and select a file.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setError("You must be logged in to upload an ontology.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Upload file to Firebase Storage
      const storageRef = ref(storage, `ontologies/${user.uid}/${file.name}`);
      await uploadBytes(storageRef, file);

      // Get the file URL
      const fileUrl = await getDownloadURL(storageRef);

      // Save ontology data to Firestore
      await addDoc(collection(db, "ontologies"), {
        name,
        fileUrl,
        requesterId: user.uid,
        createdAt: new Date(),
      });

      setSuccess("Ontology uploaded successfully!");
      setFile(null);
      setName("");
    } catch (err: any) {
      setError("Error uploading ontology: " + err.message);
    }

    setLoading(false);
  };

  return (
    <>
      <div className={`${styles.dashboard} container w-50`}>
        <Link
          className="text-decoration-none"
          to="/requesterBase/requesterDashboard"
          role="button"
        >
          <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;Back
        </Link>

        <div className="d-flex mb-3">
          <div className="me-auto">
            <h3 className="mt-4">Ontologies</h3>
            <p>
              Manage and organize your ontologies for seamless integration and
              use.
            </p>
          </div>
          <div className="align-self-center">
            <Link
              className={`${styles.primaryButton} btn`}
              to="/requesterBase/uploadOntology"
            >
              Upload ontology
            </Link>
          </div>
        </div>

        <hr />
        {/* no ontologies */}
        {/* <div className="text-center mt-5">
          <h4>No ontologies found</h4>
          <p className="mt-3">
            Upload an Ontology file to define and manage data structures.
          </p>
          <button
            className="btn mt-2"
            data-bs-toggle="modal"
            data-bs-target="#uploadOntologyModal"
          >
            <i className="fa-solid fa-cloud-arrow-up fa-xl"></i>
          </button>
          <br />
          <small>Upload Ontology</small>
        </div> */}

        <table className="table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Timestamp</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-4">Ontology 1</td>
              <td className="py-4">Thursday 21 October 2025</td>
              <td className="py-4">
                <button
                  className="btn btn-sm text-dark"
                  data-bs-toggle="modal"
                  data-bs-target="#editOntologyModal"
                >
                  <i className="fa-solid fa-pen-to-square"></i>
                </button>
                <button
                  className="btn btn-sm text-dark"
                  data-bs-toggle="modal"
                  data-bs-target="#deleteOntologyModal"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </td>
            </tr>
            <tr>
              <td className="py-4">Ontology 2</td>
              <td className="py-4">Thursday 21 October 2025</td>
              <td className="py-4">
                <button
                  className="btn btn-sm text-dark"
                  data-bs-toggle="modal"
                  data-bs-target="#editOntologyModal"
                >
                  <i className="fa-solid fa-pen-to-square"></i>
                </button>
                <button
                  className="btn btn-sm text-dark"
                  data-bs-toggle="modal"
                  data-bs-target="#deleteOntologyModal"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </td>
            </tr>
            <tr>
              <td className="py-4">Ontology 3</td>
              <td className="py-4">Thursday 21 October 2025</td>
              <td className="py-4">
                <button
                  className="btn btn-sm text-dark"
                  data-bs-toggle="modal"
                  data-bs-target="#editontOlogyModal"
                >
                  <i className="fa-solid fa-pen-to-square"></i>
                </button>
                <button
                  className="btn btn-sm text-dark"
                  data-bs-toggle="modal"
                  data-bs-target="#deleteOntologyModal"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* delete ontology modal */}
      <div
        className="modal fade"
        id="deleteOntologyModal"
        aria-labelledby="deleteOntologyLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="deleteOntologyLabel">
                Are you sure?
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete this ontology? This action
                cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className={`${styles.secondaryButton} btn`}
                data-bs-dismiss="modal"
              >
                Close
              </button>
              <button type="button" className={`${styles.dangerButton} btn`}>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* edit ontology modal */}
      <div
        className="modal fade"
        id="editOntologyModal"
        aria-labelledby="editOntologyLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="editOntologyLabel">
                Edit ontology
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <p>
                Upload your ontology file in TXT, XML, or TTL format. Supported
                file types ensure compatibility with our system.
              </p>
              <form>
                <div className="mb-3">
                  <label className={`${styles.formLabel} form-label`}>
                    Ontology name
                  </label>
                  <input
                    type="text"
                    className={`${styles.formInput} form-control`}
                    id="exampleInputEmail1"
                    aria-describedby="emailHelp"
                    defaultValue={"Ontology 1"}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className={`${styles.formLabel} form-label`}>
                    Ontology file
                  </label>
                  <div className="input-group">
                    <input
                      type="file"
                      className={`${styles.formInput} form-control`}
                      id="inputGroupFile01"
                      required
                    />
                  </div>
                  <div id="emailHelp" className="form-text mt-2">
                    Accepted files: .txt, .xml, .ttl
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className={`${styles.secondaryButton} btn`}
                data-bs-dismiss="modal"
              >
                Close
              </button>
              <button type="button" className={`${styles.primaryButton} btn`}>
                Update
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Ontologies;
