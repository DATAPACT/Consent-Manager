import { useEffect, useState } from "react";
import styles from "../../css/OwnerPendingRequestsDetails.module.css";
import { Link } from "react-router-dom";
import { db, auth } from "../../firebase"; // Firebase setup
import { collection, query, where, getDocs } from "firebase/firestore";

// components
import LoadingSpinner from "../LoadingSpinner";

// Define the type for the request object
interface Request {
  id: string;
  requestName: string;
  status: string;
  ownersPending: string[]; // Array of owner IDs pending approval
  sentAt: string;
}

function OwnerPendingRequests() {
  const [pendingRequests, setPendingRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const requestsRef = collection(db, "requests");
        const q = query(requestsRef, where("status", "==", "sent")); // Modify this to check for "sent" status
        const querySnapshot = await getDocs(q);
        const allRequests: Request[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Request[];

        const userId = auth.currentUser?.uid; // Get logged-in user's ID
        if (!userId) {
          setError("User not logged in.");
          setLoading(false);
          return;
        }

        // Filter requests based on ownersPending array
        const userRequests = allRequests.filter((request) =>
          request.ownersPending.includes(userId)
        );

        setPendingRequests(userRequests); // Set the filtered requests
        setLoading(false);
      } catch (error) {
        setError("An error occurred while fetching the requests.");
        setLoading(false);
      }
    };

    fetchRequests();
  }, []); // Empty dependency array ensures the effect runs once when the component mounts

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-danger">{error}</div>;
  }

  return (
    <div className={`${styles.dashboard} container w-50`}>
      <Link className="text-decoration-none" to="/ownerBase/ownerDashboard">
        <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;Back
      </Link>

      <h3 className="mt-4">Pending requests</h3>
      <p>Manage and organize your requests for seamless integration and use.</p>

      <hr />

      {pendingRequests.length === 0 ? (
        <div className="text-center mt-5">
          <h4>No pending requests</h4>
          <p className="mt-2">
            Once you receive a request, it will appear here.
          </p>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Date received</th>
              <th scope="col" className="text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {pendingRequests.map((request) => (
              <tr key={request.id}>
                <td className="py-3">{request.requestName}</td>
                <td className="py-3">{request.sentAt}</td>
                <td className="py-3 text-center">
                  <Link
                    to={`/ownerBase/ownerPendingRequestsDetails/${request.id}`}
                    className={`${styles.primaryButton} btn btn-sm`}
                  >
                    See details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default OwnerPendingRequests;
