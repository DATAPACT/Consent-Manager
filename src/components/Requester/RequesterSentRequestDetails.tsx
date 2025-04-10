import styles from "../../css/OwnerPendingRequestsDetails.module.css";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

// components
import LoadingSpinner from "../LoadingSpinner";

interface Refinement {
  attribute: string;
  instance: string;
  value: string;
}

interface Rule {
  dataset: string;
  datasetRefinements: Refinement[];
  action: string;
  actionRefinements: Refinement[];
  purpose: string;
  purposeRefinements: Refinement[];
  constraintRefinements: Refinement[];
}

interface Request {
  id: string;
  requestName: string;
  requester: {
    requesterName: string;
    requesterEmail: string;
  };
  rules: Rule[];
  status: string;
  owners: string[];
}

function RequesterSentRequestsDetails() {
  const { requestId } = useParams<{ requestId: string }>();
  const [requestDetails, setRequestDetails] = useState<Request | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  // Inside your component
  const [ownerDetails, setOwnerDetails] = useState<
    { name: string; email: string }[]
  >([]); // Store the owner details

  // fetching the owners detials
  useEffect(() => {
    const fetchOwnerDetails = async () => {
      if (!requestDetails?.owners) return;

      const owners = requestDetails.owners;
      const ownerDetailsPromises = owners.map(async (ownerId) => {
        try {
          // Fetch user details for each owner ID from the "users" collection
          const userDocRef = doc(db, "owners", ownerId); // Assuming "users" collection
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            // Return the user details (name and email)
            return {
              name: userDocSnap.data().name,
              email: userDocSnap.data().email,
            };
          } else {
            // If user doesn't exist, return mock data or handle accordingly
            return { name: "Unknown", email: "N/A" };
          }
        } catch (error) {
          console.error("Error fetching owner details:", error);
          return { name: "Unknown", email: "N/A" };
        }
      });

      // Wait for all user details to be fetched
      const ownersDetails = await Promise.all(ownerDetailsPromises);
      setOwnerDetails(ownersDetails); // Set the fetched owner details in state
    };

    fetchOwnerDetails();
  }, [requestDetails]); // Re-fetch when requestDetails change

  //  fetching request details
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

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-danger">{error}</div>;
  if (!requestDetails)
    return <div className="text-danger">No request details available.</div>;

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
        <h3 className="mt-4">{requestDetails.requestName}</h3>

        <ul className="nav nav-tabs mt-4" id="myTab" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              className="nav-link active"
              id="home-tab"
              data-bs-toggle="tab"
              data-bs-target="#home-tab-pane"
              type="button"
              role="tab"
              aria-controls="home-tab-pane"
              aria-selected="true"
            >
              Request details
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className="nav-link"
              id="profile-tab"
              data-bs-toggle="tab"
              data-bs-target="#profile-tab-pane"
              type="button"
              role="tab"
              aria-controls="profile-tab-pane"
              aria-selected="false"
            >
              Status
            </button>
          </li>
        </ul>

        <div className="tab-content" id="myTabContent">
          <div
            className="tab-pane fade show active"
            id="home-tab-pane"
            role="tabpanel"
            aria-labelledby="home-tab"
          >
            <h5 className="mt-4 mb-3">Requester details</h5>
            <p>
              <i className="fa-solid fa-user me-3"></i>
              {requestDetails.requester.requesterName}
            </p>
            <p className="mb-4">
              <i className="fa-solid fa-envelope me-3"></i>
              {requestDetails.requester.requesterEmail}
            </p>

            {requestDetails.rules?.map((rule, ruleIndex) => (
              <div key={ruleIndex} className="mb-4 mt-4">
                <h5>Requirement {ruleIndex + 1}</h5>
                <h5 className="mt-4">What’s being requested</h5>
                <p>
                  <strong>Dataset:</strong> The requester has access to data
                  from <strong>{rule.dataset}</strong>.
                </p>
                <p>
                  <strong>Action:</strong> The requester can{" "}
                  <strong>{rule.action}</strong> to this dataset.
                </p>
                <p>
                  <strong>Purpose:</strong> This request is for{" "}
                  <strong>{rule.purpose}</strong> reasons.
                </p>

                {rule.datasetRefinements?.length > 0 && (
                  <div>
                    <h5>Dataset conditions:</h5>
                    <ul className="list-unstyled">
                      {rule.datasetRefinements.map((ref, i) => (
                        <li key={i}>
                          Data about <strong>{ref.attribute}</strong> items
                          greater than <strong>{ref.value}</strong>.
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {rule.actionRefinements?.length > 0 && (
                  <div>
                    <h5>Action conditions:</h5>
                    <ul className="list-unstyled">
                      {rule.actionRefinements.map((ref, i) => (
                        <li key={i}>
                          Write access to <strong>{ref.attribute}</strong> items
                          greater than <strong>{ref.value}</strong>.
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {rule.purposeRefinements?.length > 0 && (
                  <div>
                    <h5>Purpose conditions:</h5>
                    <ul className="list-unstyled">
                      {rule.purposeRefinements.map((ref, i) => (
                        <li key={i}>
                          Data are used for <strong>{ref.attribute}</strong>{" "}
                          items greater than <strong>{ref.value}</strong>.
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {rule.constraintRefinements?.length > 0 && (
                  <div>
                    <h5>Constraints:</h5>
                    <ul className="list-unstyled">
                      {rule.constraintRefinements.map((ref, i) => (
                        <li key={i}>
                          Data meet the constraint:{" "}
                          <strong>{ref.attribute}</strong> {ref.instance}{" "}
                          <strong>{ref.value}</strong>.
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}

            <button className={`${styles.primaryButton} btn mt-3`}>
              Download request
            </button>
          </div>
          <div
            className="tab-pane fade"
            id="profile-tab-pane"
            role="tabpanel"
            aria-labelledby="profile-tab"
          >
            <table className="table mt-4">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {ownerDetails.map((owner, index) => (
                  <tr key={index}>
                    <td className="py-3">{owner.name}</td>
                    <td className="py-3">{owner.email}</td>
                    <td className="py-3">Waiting for response</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default RequesterSentRequestsDetails;
