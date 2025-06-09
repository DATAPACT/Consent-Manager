import styles from "../../css/Ontology.module.css";

// libraries
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";

const Ontologies: React.FC = () => {
  const [ontologies, setOntologies] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [ontologyToDelete, setOntologyToDelete] = useState<string | null>(null);
  const [ontologyNameToDelete, setOntologyNameToDelete] = useState<
    string | null
  >(null);
  const [isOntologyInUse, setIsOntologyInUse] = useState<boolean>(false);

  useEffect(() => {
    const fetchOntologies = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const requesterRef = doc(db, "requesters", user.uid);
        const requesterSnap = await getDoc(requesterRef);

        if (!requesterSnap.exists()) {
          setOntologies([]);
          setLoading(false);
          return;
        }

        const requesterData = requesterSnap.data();
        const ontologyIds: string[] = requesterData.ontologies || [];

        const ontologyDocs = await Promise.all(
          ontologyIds.map(async (id) => {
            const ontRef = doc(db, "ontologies", id);
            const ontSnap = await getDoc(ontRef);
            if (!ontSnap.exists()) return null;

            return {
              id,
              ...ontSnap.data(),
            };
          })
        );

        setOntologies(
          ontologyDocs
            .filter((ontology): ontology is { id: string } => ontology !== null)
            .filter((ontology) => ontology.id !== "default")
        );
      } catch (error) {
        console.error("Error fetching user ontologies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOntologies();
  }, []);

  const checkIfOntologyIsUsed = async (ontologyId: string) => {
    try {
      const q = query(
        collection(db, "requests"),
        where("ontologies", "array-contains", ontologyId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.size > 0;
    } catch (error) {
      console.error("Error checking ontology usage:", error);
      return false;
    }
  };

  const handleDeleteOntology = async (ontologyId: string) => {
    const isUsed = await checkIfOntologyIsUsed(ontologyId);
    if (isUsed) {
      setIsOntologyInUse(true);
    } else {
      try {
        await deleteDoc(doc(db, "ontologies", ontologyId));
        setOntologies(
          ontologies.filter((ontology) => ontology.id !== ontologyId)
        );
        alert("Ontology deleted successfully!");
      } catch (error) {
        console.error("Error deleting ontology:", error);
        alert("Error deleting ontology.");
      }
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
                      onClick={async () => {
                        setOntologyToDelete(ontology.id);
                        setOntologyNameToDelete(ontology.name);
                        const isUsed = await checkIfOntologyIsUsed(ontology.id);
                        setIsOntologyInUse(isUsed);
                      }}
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
              {isOntologyInUse ? (
                <p>
                  <h5 className="text-danger mb-2">Warning</h5>
                  This ontology is currently used in one or more requests.
                  Please delete the associated requests first.
                </p>
              ) : (
                <p>
                  Are you sure you want to delete{" "}
                  <strong>{ontologyNameToDelete}</strong>?
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className={`${styles.secondaryButton} btn`}
                data-bs-dismiss="modal"
                onClick={() => setIsOntologyInUse(false)}
              >
                Cancel
              </button>
              {!isOntologyInUse && (
                <button
                  type="button"
                  className={`${styles.dangerButton} btn`}
                  onClick={async () => {
                    if (ontologyToDelete) {
                      await handleDeleteOntology(ontologyToDelete);
                    }
                  }}
                  data-bs-dismiss="modal"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Ontologies;
