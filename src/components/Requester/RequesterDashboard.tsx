import styles from "../../css/Dashboard.module.css";

// libraries
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getRequesterDashboard } from "../../services/api";
import { useAuth } from "../../AuthContext";

function RequesterDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const result = await getRequesterDashboard(user.uid);
        if (result.success) {
          setDashboardData(result.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className={`${styles.dashboard} container w-50`}>
        <h3>Dashboard</h3>
        <p>
          Monitor and manage your data requests, ontologies, and consent
          settings.
        </p>
        <hr />
        <div className="row row-cols-1 row-cols-md-3 g-4">
          <div className="col">
            <div className="card h-100">
              <div className="card-body">
                <h4 className="card-title">Ontologies</h4>
                <small className="text-muted">You have</small>
                <h3 className="mt-2">{dashboardData?.statistics?.ontologiesCount || 0}</h3>
                <small className="text-muted">ontologies.</small>
                <p className="card-text mt-2">
                  View, edit, and organize your ontologies. Upload new ones to
                  expand your data structure and maintain control.
                </p>
                <Link
                  className={`${styles.primaryButton} btn`}
                  to="/requesterBase/ontologies"
                >
                  Manage
                </Link>
              </div>
            </div>
          </div>
          <div className="col">
            <div className="card h-100">
              <div className="card-body">
                <h4 className="card-title">Requests</h4>
                <small className="text-muted">You have</small>
                <h3 className="mt-2">{dashboardData?.statistics?.totalRequests || 0}</h3>
                <small className="text-muted">requests.</small>
                <p className="card-text mt-2">
                  Send new requests, review approved ones, or create a new
                  access request to manage data permissions effectively.
                </p>
                <Link
                  className={`${styles.primaryButton} btn`}
                  to="/requesterBase/requesterRequests"
                >
                  Manage
                </Link>
              </div>
            </div>
          </div>
          <div className="col">
            <Link
              to=""
              className={`${styles.documentationCard} card h-100 text-dark text-decoration-none`}
            >
              <div className="card-body">
                <h4 className="card-title">How it works</h4>
                <i className="fa-solid fa-book fa-lg mt-4"></i>
                <p className="card-text mt-2">
                  Access detailed guides and resources to help you navigate the
                  platform. Find information on managing data requests,
                  configuring ontologies, and understanding consent management
                  workflows.
                </p>
                <div className="alert alert-success" role="alert">
                  <small>
                    <i className="fa-solid fa-lightbulb me-2"></i>Recommended
                    for new users.
                  </small>
                </div>
              </div>
            </Link>
          </div>
        </div>
        <div className="alert alert-primary mt-5" role="alert">
          Please ensure that all data access requests are reviewed promptly.
          Pending requests must be addressed to maintain compliance and ensure
          proper data sharing practices.
        </div>
      </div>
    </>
  );
}

export default RequesterDashboard;
