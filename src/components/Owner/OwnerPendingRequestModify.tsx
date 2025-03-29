// css
import styles from "../../css/CreateRequest.module.css";

// libraries
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { db } from "../../firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"; // Import updateDoc and deleteDoc

interface Request {
  id: string;
  requestName: string;
  status: string;
  owners: string[];
  createdAt: { seconds: number };
  senderName: string;
  startDate: { seconds: number };
  endDate: { seconds: number };
  moreInfo: string;
}

function OwnerPendingRequestModify() {
  const { requestId } = useParams<{ requestId: string }>();
  const [requestDetails, setRequestDetails] = useState<Request | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (!requestId) {
        setError("Invalid request ID.");
        setLoading(false);
        return;
      }

      try {
        const requestDocRef = doc(db, "requests", requestId);
        const docSnap = await getDoc(requestDocRef);

        if (docSnap.exists()) {
          setRequestDetails({ id: docSnap.id, ...docSnap.data() } as Request);
        } else {
          setError("Request not found.");
        }

        setLoading(false);
      } catch (error) {
        setError("Error fetching request details.");
        setLoading(false);
      }
    };

    fetchRequestDetails();
  }, [requestId]);

  return (
    <>
      <div className={`${styles.dashboard} container w-50`}>
        <Link
          className="text-decoration-none"
          to={`/ownerBase/ownerPendingRequestsDetails/${requestId}`}
          role="button"
        >
          <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;Back
        </Link>

        <h3 className="mt-4">Modify request</h3>
        <p>
          Create and submit a new request by specifying the necessary details,
          including relevant parameters and requirements.
        </p>
        <div className="alert alert-warning" role="alert">
          By modifying this request, the updated version will be considered the
          approved request. Please review the changes carefully before
          proceeding. If you're unsure, contact the requester before submitting.
        </div>

        <hr />

        <form className="w-50">
          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>
              Request name
            </label>

            <input
              type="text"
              className={`${styles.formInput} form-control`}
              id="exampleInputEmail1"
              aria-describedby="emailHelp"
              defaultValue={"Request 1"}
              disabled
            />
          </div>

          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>
              Choose one ore more ontologies
            </label>
            <div className="form-check mt-2">
              <input
                className="form-check-input"
                type="checkbox"
                value=""
                id="flexCheckDefault"
              />
              <label className="form-check-label">Ontology 1</label>
            </div>
            <div className="form-check mt-2">
              <input
                className="form-check-input"
                type="checkbox"
                value=""
                id="flexCheckChecked"
              />
              <label className="form-check-label">Ontology 2</label>
            </div>
            <div className="form-check mt-2">
              <input
                className="form-check-input"
                type="checkbox"
                value=""
                id="flexCheckChecked"
              />
              <label className="form-check-label">Ontology 3</label>
            </div>
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
                aria-label="First name"
              />
            </div>
            <div className="col">
              <label className={`${styles.formLabel} form-label`}>
                End date
              </label>
              <input
                type="date"
                className={`${styles.formInput} form-control`}
                aria-label="Last name"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>
              Phylli's editor goes here...
            </label>

            <input
              type="text"
              className={`${styles.formInput} form-control`}
              id="exampleInputEmail1"
              aria-describedby="emailHelp"
              required
            />
          </div>
          <button className={`${styles.primaryButton} btn mt-3`}>
            Submit modification
          </button>
        </form>
      </div>
    </>
  );
}

export default OwnerPendingRequestModify;
