import { useState, useEffect } from "react";
import styles from "../../css/Dashboard.module.css";
import { Link } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { getRequests } from "../../services/api";

// interface Request {
//   id: string;
//   status: string;
//   ownersPending: string[]; // Added ownersPending
//   ownersAccepted: string[]; // Added ownersApproved
// }

function OwnerDashboard() {
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);
  const [approvedRequestsCount, setApprovedRequestsCount] = useState<number>(0);
  const [expiredRequestsCount, setExpiredRequestsCount] = useState<number>(0);
  const { user } = useAuth();

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) {
        console.log("User not logged in");
        return;
      }

      try {
        // Get all sent requests for owners
        const result = await getRequests({
          uid: user.uid,
          role: "owner",
          status: "sent",
        });

        if (result.success) {
          // Filter for pending requests (user is in ownersPending array)
          const pendingRequests = result.requests.filter(
            (request: any) =>
              request.ownersPending && request.ownersPending.includes(user.uid)
          );

          // Filter for approved requests (user is in ownersAccepted array)
          const approvedRequests = result.requests.filter(
            (request: any) =>
              request.ownersAccepted &&
              request.ownersAccepted.includes(user.uid)
          );

          // Filter for expired/rejected requests (user is in ownersRejected array)
          const expiredRequests = result.requests.filter(
            (request: any) =>
              request.ownersRejected &&
              request.ownersRejected.includes(user.uid)
          );

          setPendingRequestsCount(pendingRequests.length);
          setApprovedRequestsCount(approvedRequests.length);
          setExpiredRequestsCount(expiredRequests.length);
        } else {
          console.error("Failed to fetch requests:", result.error);
        }
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
          Review pending, approved, negotiation, and revoked requests to ensure
          compliance and security.
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
                  Review and manage incoming requests. Approve, reject, or
                  negotiate based on consent preferences.
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
                  Requests you have been granted. Review, revoke and manage your
                  contracts at any time to maintain control over data access.
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
                <h4 className="card-title">Other requests</h4>
                <small className="text-muted">You have</small>
                <h3 className="mt-2 text-primary">{expiredRequestsCount}</h3>
                <small className="text-muted">expired requests.</small>
                <p className="card-text mt-2">
                  Requests that are pending negotiation or have expired. These
                  may require your attention if you wish to renew, modify, or
                  close them.
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
