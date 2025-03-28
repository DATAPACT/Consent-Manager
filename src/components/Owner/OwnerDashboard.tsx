import { useState, useEffect } from "react";
import styles from "../../css/Dashboard.module.css";
import Footer from "../Footer/Footer";
import { Link } from "react-router-dom";
import { db, auth } from "../../firebase"; // Import Firebase configuration
import { collection, query, where, getDocs } from "firebase/firestore"; // Firestore methods

// Define the type for your request document
interface Request {
  id: string;
  status: string;
  owners: string[]; // owners is an array of user IDs
}

function OwnerDashboard() {
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);

  useEffect(() => {
    const fetchPendingRequests = async () => {
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
        })) as Request[]; // Type the requests to match the Request interface

        const userId = auth.currentUser?.uid;

        if (!userId) {
          console.log("User not logged in");
          return; // Stop execution if no user is logged in
        }

        // Filter requests where the user is in the "owners" array and count them
        const userPendingRequests = allRequests.filter((request) =>
          request.owners.includes(userId)
        );

        setPendingRequestsCount(userPendingRequests.length); // Set the count of pending requests
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };

    fetchPendingRequests(); // Fetch pending requests
  }, []);

  return (
    <>
      <div className={`${styles.dashboard} container w-50`}>
        <h3>Dashboard</h3>
        <p>
          Review pending, approved, and revoked requests to ensure compliance
          and security.
        </p>
        <hr />
        <div className="row row-cols-1 row-cols-md-3 g-4">
          <div className="col">
            <div className="card h-100">
              <div className="card-body">
                <h4 className="card-title">Pending requests</h4>
                <small className="text-muted">You have</small>
                <h3 className="mt-2 text-warning">{pendingRequestsCount}</h3>
                <small className="text-muted">pending requests.</small>
                <p className="card-text mt-2">
                  Review and manage incoming requests. You can approve, deny, or
                  revoke permissions based on user consent preferences.
                </p>
                <Link
                  className={`${styles.primaryButton} btn`}
                  to="/ownerBase/ownerPendingRequests"
                >
                  Manage
                </Link>
              </div>
            </div>
          </div>
          <div className="col">
            <div className="card h-100">
              <div className="card-body">
                <h4 className="card-title">Approved requests</h4>
                <small className="text-muted">You have</small>
                <h3 className="mt-2 text-success">3</h3>
                <small className="text-muted">approved requests.</small>
                <p className="card-text mt-2">
                  Requests you have been granted. You can review, modify, or
                  revoke permissions at any time to maintain control over data
                  access.
                </p>
                <Link
                  className={`${styles.primaryButton} btn`}
                  to="/ownerBase/ownerApprovedRequests"
                >
                  View
                </Link>
              </div>
            </div>
          </div>
          <div className="col">
            <div className="card h-100">
              <div className="card-body">
                <h4 className="card-title">Expired requests</h4>
                <small className="text-muted">You have</small>
                <h3 className="mt-2 text-danger">3</h3>
                <small className="text-muted">expired requests.</small>
                <p className="card-text mt-2">
                  Requests you have been granted. You can review, modify, or
                  revoke permissions at any time to maintain control over data
                  access.
                </p>
                <Link className={`${styles.primaryButton} btn`} to="/">
                  View
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="alert alert-primary mt-5" role="alert">
          You might have pending, approved, and potentially expired data access
          requests. Review and take action to ensure permissions align with user
          consent. Approve, deny, or revoke access as needed to maintain data
          security and compliance.
        </div>
      </div>
      <Footer />
    </>
  );
}

export default OwnerDashboard;
