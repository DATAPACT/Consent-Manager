import { useState, useEffect } from "react";
import styles from "../../css/Dashboard.module.css";
import { Link } from "react-router-dom";
import { db, auth } from "../../firebase"; // Firebase config
import { collection, query, where, getDocs } from "firebase/firestore"; // Firestore methods

interface Request {
  id: string;
  status: string;
  ownersPending: string[]; // Added ownersPending
  ownersAccepted: string[]; // Added ownersApproved
}

function OwnerDashboard() {
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);
  const [approvedRequestsCount, setApprovedRequestsCount] = useState<number>(0);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          console.log("User not logged in");
          return;
        }

        const requestsRef = collection(db, "requests");

        // Query for all requests with the status "sent" (for pending requests)
        const pendingQuery = query(requestsRef, where("status", "==", "sent"));
        const pendingSnapshot = await getDocs(pendingQuery);
        const pendingRequests = pendingSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Request))
          .filter((request) => request.ownersPending.includes(userId)); // Filter by ownersPending

        setPendingRequestsCount(pendingRequests.length);

        // Query for all requests with the status "approved"
        const approvedQuery = query(requestsRef, where("status", "==", "sent"));
        const approvedSnapshot = await getDocs(approvedQuery);
        const approvedRequests = approvedSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Request))
          .filter((request) => request.ownersAccepted.includes(userId)); // Filter by ownersApproved

        setApprovedRequestsCount(approvedRequests.length);
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };

    fetchRequests();
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
                <h3 className="mt-2 text-success">{approvedRequestsCount}</h3>
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
                <Link className={`${styles.primaryButton} btn`} to="">
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
    </>
  );
}

export default OwnerDashboard;
