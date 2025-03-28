import { useEffect, useState } from "react";
import styles from "../../css/OwnerPendingRequestsDetails.module.css";
import Footer from "../Footer/Footer";
import { Link } from "react-router-dom";
import { db, auth } from "../../firebase"; // Import Firebase configuration
import { collection, query, where, getDocs } from "firebase/firestore"; // Firestore methods

// Define the type for the request object
interface Request {
  id: string;
  requestName: string;
  status: string;
  owners: string[]; // Array of owner IDs
  createdAt: { seconds: number }; // Assuming createdAt is a Firebase Timestamp
}

function OwnerPendingRequests() {
  const [pendingRequests, setPendingRequests] = useState<Request[]>([]); // State to store filtered requests
  const [loading, setLoading] = useState<boolean>(true); // State for loading status
  const [error, setError] = useState<string>(""); // Error handling state

  // Fetch requests on component mount
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const requestsRef = collection(db, "requests"); // Reference to the requests collection
        const q = query(
          requestsRef,
          where("status", "==", "sent") // Only fetch "sent" requests
        );

        const querySnapshot = await getDocs(q);
        const allRequests: Request[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Request[]; // Cast the data to match the Request type

        // Ensure auth.currentUser?.uid is defined before using it
        const userId = auth.currentUser?.uid;

        if (!userId) {
          setError("User not logged in.");
          setLoading(false);
          return; // Stop execution if there's no user
        }

        // Filter requests where the logged-in user is in the "owners" array
        const userRequests = allRequests.filter(
          (request) => request.owners.includes(userId) // Safe to use userId now
        );

        setPendingRequests(userRequests); // Update state with filtered requests
        setLoading(false); // Stop loading
      } catch (error) {
        console.error("Error fetching requests:", error);
        setError("An error occurred while fetching the requests.");
        setLoading(false); // Stop loading
      }
    };

    fetchRequests(); // Call the fetch function
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Loading state
  }

  if (error) {
    return <div className="text-danger">{error}</div>; // Error state
  }

  return (
    <>
      <div className={`${styles.dashboard} container w-50`}>
        <Link
          className="text-decoration-none"
          to="/ownerBase/ownerDashboard"
          role="button"
        >
          <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;Back
        </Link>

        <h3 className="mt-4">Pending requests</h3>
        <p>
          Manage and organize your ontologies for seamless integration and use.
        </p>

        <hr />

        <table className="table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Timestamp</th>
              <th scope="col" className="text-center">
                View
              </th>
            </tr>
          </thead>
          <tbody>
            {pendingRequests.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-4">
                  No pending requests
                </td>
              </tr>
            ) : (
              pendingRequests.map((request) => (
                <tr key={request.id}>
                  <td className="py-4">{request.requestName}</td>
                  <td className="py-4">
                    {new Date(
                      request.createdAt.seconds * 1000
                    ).toLocaleString()}
                  </td>
                  <td className="py-4 text-center">
                    <Link
                      className="btn btn-sm text-dark"
                      to={`/ownerBase/ownerPendingRequestsDetails/${request.id}`}
                    >
                      <i className="fa-solid fa-arrow-right"></i>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Footer />
    </>
  );
}

export default OwnerPendingRequests;
