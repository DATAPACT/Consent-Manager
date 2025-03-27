import styles from "../../css/Ontology.module.css";

// components
import Footer from "../Footer/Footer";

// libraries
import { Link } from "react-router-dom"; // Import useNavigate
import { useEffect, useState } from "react";
import { auth, db } from "../../firebase"; // Ensure your Firebase instance is imported
import { collection, query, where, getDocs } from "firebase/firestore"; // Import Firestore queries

const Ontologies: React.FC = () => {
  const [ontologies, setOntologies] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ontologies.map((ontology) => (
                <tr key={ontology.id}>
                  <td className="py-4">{ontology.name}</td>
                  <td className="py-4">
                    {ontology.uploadedAt?.toDate().toLocaleString()}
                  </td>
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
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Footer />
    </>
  );
};

export default Ontologies;
