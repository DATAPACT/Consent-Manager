import styles from "../../css/Ontology.module.css";

// components
import Footer from "../Footer/Footer";

// libraries
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../../firebase"; // Ensure your Firebase instance is imported
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore"; // Import Firestore queries

const Ontologies: React.FC = () => {
  const [ontologies, setOntologies] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [ontologyToDelete, setOntologyToDelete] = useState<string | null>(null);

  // Fetch ontologies from Firestore
  useEffect(() => {
    const fetchOntologies = async () => {
      const user = auth.currentUser;

      if (!user) {
        return; // If user is not logged in, do nothing
      }

      try {
        const q = query(
          collection(db, "ontologies"),
          where("requesterId", "==", user.uid) // Filter ontologies by requesterId
        );

        const querySnapshot = await getDocs(q);
        const ontologiesData: any[] = [];
        querySnapshot.forEach((doc) => {
          ontologiesData.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        setOntologies(ontologiesData);
      } catch (error) {
        console.error("Error fetching ontologies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOntologies();
  }, []);

  // Function to handle the deletion of an ontology
  const handleDeleteOntology = async (ontologyId: string) => {
    try {
      // Get a reference to the ontology document
      const docRef = doc(db, "ontologies", ontologyId);

      // Delete the document
      await deleteDoc(docRef);

      // Remove the deleted ontology from state
      setOntologies(
        ontologies.filter((ontology) => ontology.id !== ontologyId)
      );

      alert("Ontology deleted successfully!");
    } catch (error) {
      console.error("Error deleting ontology:", error);
      alert("Error deleting ontology.");
    }
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

        {loading ? (
          <p>Loading ontologies...</p>
        ) : ontologies.length === 0 ? (
          <div className="text-center mt-5">
            <h4>No ontologies found</h4>
            <p className="mt-3">
              Upload an Ontology file to define and manage data structures.
            </p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Date uploaded</th>
                <th scope="col" className="text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {ontologies.map((ontology) => (
                <tr key={ontology.id}>
                  <td className="py-4">{ontology.name}</td>
                  <td className="py-4">
                    {ontology.uploadedAt?.toDate().toLocaleString()}
                  </td>
                  <td className="py-4 text-center">
                    <button
                      className="btn btn-sm text-dark"
                      data-bs-toggle="modal"
                      data-bs-target="#deleteOntologyModal"
                      onClick={() => setOntologyToDelete(ontology.id)} // Set ontology to delete
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for Confirm Deletion */}
      <div
        className="modal fade"
        id="deleteOntologyModal"
        tabIndex={-1}
        aria-labelledby="deleteOntologyModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="deleteOntologyModalLabel">
                Confirm Deletion
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              Are you sure you want to delete this ontology?
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  if (ontologyToDelete) {
                    handleDeleteOntology(ontologyToDelete); // Delete the selected ontology
                  }
                }}
                data-bs-dismiss="modal"
              >
                Delete
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
