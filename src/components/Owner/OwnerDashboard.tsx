import { useState, useEffect } from "react";
import styles from "../../css/Dashboard.module.css";
import { Link } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { getRequests } from "../../services/api";

function OwnerDashboard() {
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);
  const [approvedRequestsCount, setApprovedRequestsCount] = useState<number>(0);
  const [otherRequestsCount, setOtherRequestsCount] = useState<number>(0);
  const { user } = useAuth();

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) {
        console.log("User not logged in");
        return;
      }

      try {
        const result = await getRequests({
          uid: user.uid,
          role: "owner",
        });

        if (result.success) {
          const requests = result.requests;

          // ✅ Pending requests → status is "sent", no negotiationId, user in ownersPending
          const pendingRequests = requests.filter(
            (request: any) =>
              request.status === "sent" &&
              !request.negotiationId &&
              request.ownersPending?.includes(user.uid)
          );

          // ✅ Approved requests → user in ownersAccepted
          const approvedRequests = requests.filter((request: any) =>
            request.ownersAccepted?.includes(user.uid)
          );

          // ✅ Other requests → rejected OR negotiation
          const otherRequests = requests.filter(
            (request: any) =>
              request.ownersRejected?.includes(user.uid) ||
              request.negotiationId
          );

          setPendingRequestsCount(pendingRequests.length);
          setApprovedRequestsCount(approvedRequests.length);
          setOtherRequestsCount(otherRequests.length);
        } else {
          console.error("Failed to fetch requests:", result.error);
        }
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };

    fetchRequests();
  }, [user]);

  return (
    <div className={`${styles.dashboard} container w-50`}>
      <h3>Dashboard</h3>
      <p>
        Review pending, approved, negotiation, and rejected requests to ensure
        compliance and security.
      </p>
      <hr />
      <div className="row row-cols-1 row-cols-md-3 g-4">
        {/* Pending card */}
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

        {/* Approved card */}
        <div className="col">
          <div className="card h-100">
            <div className="card-body">
              <h4 className="card-title">Approved requests</h4>
              <small className="text-muted">You have</small>
              <h3 className="mt-2 text-success">{approvedRequestsCount}</h3>
              <small className="text-muted">approved requests.</small>
              <p className="card-text mt-2">
                Requests you have approved. Review, revoke and manage them
                anytime to maintain control over data access.
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

        {/* Other card */}
        <div className="col">
          <div className="card h-100">
            <div className="card-body">
              <h4 className="card-title">Other requests</h4>
              <small className="text-muted">You have</small>
              <h3 className="mt-2 text-primary">{otherRequestsCount}</h3>
              <small className="text-muted">
                negotiation or rejected requests.
              </small>
              <p className="card-text mt-2">
                Requests that are under negotiation or have been rejected. These
                may require your attention if you wish to renew, modify, or
                review them.
              </p>
              <Link
                className={`${styles.primaryButton} btn`}
                to="/ownerBase/ownerOtherRequests"
              >
                View
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="alert alert-primary mt-5" role="alert">
        You might have pending, approved, and other data access requests. Review
        and take action to ensure permissions align with user consent. Approve,
        reject, negotiate, or revoke access as needed to maintain data security
        and compliance.
      </div>
    </div>
  );
}

export default OwnerDashboard;
