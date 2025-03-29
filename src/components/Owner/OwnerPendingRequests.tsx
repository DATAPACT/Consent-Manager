import { useEffect, useState } from "react";
import styles from "../../css/OwnerPendingRequestsDetails.module.css";
import { Link } from "react-router-dom";
import { db, auth } from "../../firebase"; // Firebase setup
import { collection, query, where, getDocs } from "firebase/firestore";

// Define the type for the request object
interface Request {
  id: string;
  requestName: string;
  status: string;
  owners: string[]; // Array of owner IDs
  createdAt: { seconds: number }; // Firebase timestamp
}

function OwnerPendingRequests() {
  const [pendingRequests, setPendingRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const requestsRef = collection(db, "requests");
        const q = query(requestsRef, where("status", "==", "sent"));
        const querySnapshot = await getDocs(q);
        const allRequests: Request[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Request[];

        const userId = auth.currentUser?.uid;
        if (!userId) {
          setError("User not logged in.");
          setLoading(false);
          return;
        }

        const userRequests = allRequests.filter((request) =>
          request.owners.includes(userId)
        );

        setPendingRequests(userRequests);
        setLoading(false);
      } catch (error) {
        setError("An error occurred while fetching the requests.");
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
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
                View
              </th>
            </tr>
          </thead>
          <tbody>
            {pendingRequests.map((request) => (
              <tr key={request.id}>
                <td className="py-3">{request.requestName}</td>
                <td className="py-3">
                  {new Date(request.createdAt.seconds * 1000).toLocaleString()}
                </td>
                <td className="py-3 text-center">
                  <Link
                    className="btn btn-sm text-dark"
                    to={`/ownerBase/ownerPendingRequestsDetails/${request.id}`}
                  >
                    <i className="fa-solid fa-arrow-right"></i>
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
