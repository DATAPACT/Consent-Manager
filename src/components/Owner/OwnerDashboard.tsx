import { useState, useEffect } from "react";
import styles from "../../css/Dashboard.module.css";
import { Link } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { getRequests } from "../../services/api";
import { useTranslation } from "react-i18next";

function OwnerDashboard() {
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);
  const [approvedRequestsCount, setApprovedRequestsCount] = useState<number>(0);
  const [otherRequestsCount, setOtherRequestsCount] = useState<number>(0);
  const { user } = useAuth();
  const { t } = useTranslation();

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
      <h3>{t("dashboard")}</h3>
      <p>
        {t("dashboard_text_1")}
      </p>
      <hr />
      <div className="row row-cols-1 row-cols-md-3 g-4">
        {/* Pending card */}
        <div className="col">
          <div className="card h-100">
            <div className="card-body">
              <h4 className="card-title">{t("pending_requests")}</h4>
              <small className="text-muted">{t("you_have_pending_requests_1")}</small>
              <h3 className="mt-2 text-warning">{pendingRequestsCount}</h3>
              <small className="text-muted">{t("you_have_pending_requests_2")}</small>
              <p className="card-text mt-2">
                {t("dashboard_text_2")}
              </p>
              <Link
                className={`${styles.primaryButton} btn`}
                to="/ownerBase/ownerPendingRequests"
              >
                {t("manage")}
              </Link>
            </div>
          </div>
        </div>

        {/* Approved card */}
        <div className="col">
          <div className="card h-100">
            <div className="card-body">
              <h4 className="card-title">{t("approved_requests")}</h4>
              <small className="text-muted">{t("you_have_pending_requests_1")}</small>
              <h3 className="mt-2 text-success">{approvedRequestsCount}</h3>
              <small className="text-muted">{t("you_have_approved_requests_2")}</small>
              <p className="card-text mt-2">
                {t("approved_requests_text_2")}
              </p>
              <Link
                className={`${styles.primaryButton} btn`}
                to="/ownerBase/ownerApprovedRequests"
              >
                {t("view")}
              </Link>
            </div>
          </div>
        </div>

        {/* Other card */}
        <div className="col">
          <div className="card h-100">
            <div className="card-body">
              <h4 className="card-title">{t("other_requests")}</h4>
              <small className="text-muted">{t("you_have_pending_requests_1")}</small>
              <h3 className="mt-2 text-primary">{otherRequestsCount}</h3>
              <small className="text-muted">
                {t("you_have_other_requests_2")}
              </small>
              <p className="card-text mt-2">
                {t("other_requests_text_1")}
              </p>
              <Link
                className={`${styles.primaryButton} btn`}
                to="/ownerBase/ownerOtherRequests"
              >
                {t("view")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="alert alert-primary mt-5" role="alert">
        {t("dashboard_text_3")}
      </div>
    </div>
  );
}

export default OwnerDashboard;
