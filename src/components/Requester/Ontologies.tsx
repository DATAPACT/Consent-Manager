import styles from "../../css/Ontology.module.css";

// libraries
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../AuthContext";
import { getOntologies, deleteOntology, getRequests } from "../../services/api";
import { useTranslation } from "react-i18next";

const Ontologies: React.FC = () => {
  const [ontologies, setOntologies] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [ontologyToDelete, setOntologyToDelete] = useState<string | null>(null);
  const [ontologyNameToDelete, setOntologyNameToDelete] = useState<
    string | null
  >(null);
  const [isOntologyInUse, setIsOntologyInUse] = useState<boolean>(false);
  const { user } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchOntologies = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const result = await getOntologies(user.uid);
        
        if (result.success) {
          // Filter out default ontology and any ontologies without names
          const userOntologies = result.ontologies
            .filter((ontology: any) => ontology._id !== "default" && ontology.name);
          
          setOntologies(userOntologies);
        } else {
          console.error("Failed to fetch ontologies:", result.error);
          setOntologies([]);
        }
      } catch (error) {
        console.error("Error fetching user ontologies:", error);
        setOntologies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOntologies();
  }, [user]);

  const checkIfOntologyIsUsed = async (ontologyId: string) => {
    try {
      if (!user) return false;
      
      const result = await getRequests({ uid: user.uid, role: 'requester' });
      
      if (result.success) {
        // Check if any request uses this ontology
        return result.requests.some((request: any) => 
          request.selectedOntologies?.some((ont: any) => ont.id === ontologyId)
        );
      }
      return false;
    } catch (error) {
      console.error("Error checking ontology usage:", error);
      return false;
    }
  };

  const handleDeleteOntology = async (ontologyId: string) => {
    if (!user) return;
    
    const isUsed = await checkIfOntologyIsUsed(ontologyId);
    if (isUsed) {
      setIsOntologyInUse(true);
    } else {
      try {
        const result = await deleteOntology(ontologyId, user.uid);
        
        if (result.success) {
          setOntologies(
            ontologies.filter((ontology) => ontology._id !== ontologyId)
          );
          alert(t("ontology_deleted_successfully"));
        } else {
          alert(`${t("error_deleting_ontology")}: ${result.error}`);
        }
      } catch (error: any) {
        console.error("Error deleting ontology:", error);
        alert(`${t("error_deleting_ontology")}: ${error.message}`);
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
            <h3 className="mt-4">{t("ontologies")}</h3>
            <p>
              {t("ontologies_text_1")}
            </p>
          </div>
          <div className="align-self-center">
            <Link
              className={`${styles.primaryButton} btn`}
              to="/requesterBase/uploadOntology"
            >
              {t("upload_ontology")}
            </Link>
          </div>
        </div>

        <hr />

        {loading ? (
          <p>{t("loading_ontologies")}...</p>
        ) : ontologies.length === 0 ? (
          <div className="text-center mt-5">
            <h4>{t("no_ontologies_found")}</h4>
            <p className="mt-3">
              {t("upload_an_ontology_text_1")}
            </p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th scope="col">{t("name")}</th>
                <th scope="col">{t("date_uploaded")}</th>
                <th scope="col" className="text-center">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {ontologies.map((ontology) => (
                <tr key={ontology._id}>
                  <td className="py-4">{ontology.name}</td>
                  <td className="py-4">
                    {ontology.uploadedAt ? new Date(ontology.uploadedAt).toLocaleString() : t("unknown")}
                  </td>
                  <td className="py-4 text-center">
                    <button
                      className="btn btn-sm text-dark"
                      data-bs-toggle="modal"
                      data-bs-target="#deleteOntologyModal"
                      onClick={async () => {
                        setOntologyToDelete(ontology._id);
                        setOntologyNameToDelete(ontology.name);
                        const isUsed = await checkIfOntologyIsUsed(ontology._id);
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
                {t("confirm_deletion")}
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
                  <h5 className="text-danger mb-2">{t("warning")}</h5>
                  {t("confirm_deletion_warning")}
                </p>
              ) : (
                <p>
                  {t("confirm_deletion_confirmation")}{" "}
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
                {t("cancel")}
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
                  {t("delete")}
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
