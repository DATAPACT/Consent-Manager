import styles from "../../css/Dashboard.module.css";

// libraries
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getRequesterDashboard } from "../../services/api";
import { useAuth } from "../../AuthContext";
import { useTranslation } from "react-i18next";

function RequesterDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

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
    return <div>{t("loading")}...</div>;
  }

  return (
    <>
      <div className={`${styles.dashboard} container w-50`}>
        <h3>{t("dashboard")}</h3>
        <p>
          {t("requester_dashboard_text_1")}
        </p>
        <hr />
        <div className="row row-cols-1 row-cols-md-3 g-4">
          <div className="col">
            <div className="card h-100">
              <div className="card-body">
                <h4 className="card-title">{t("ontologies")}</h4>
                <small className="text-muted">{t("you_have_ontologies_1")}</small>
                <h3 className="mt-2">{dashboardData?.statistics?.ontologiesCount || 0}</h3>
                <small className="text-muted">{t("you_have_ontologies_2")}</small>
                <p className="card-text mt-2">
                  {t("requester_dashboard_text_2")}
                </p>
                <Link
                  className={`${styles.primaryButton} btn`}
                  to="/requesterBase/ontologies"
                >
                  {t("manage")}
                </Link>
              </div>
            </div>
          </div>
          <div className="col">
            <div className="card h-100">
              <div className="card-body">
                <h4 className="card-title">{t("requests")}</h4>
                <small className="text-muted">{t("you_have_ontologies_1")}</small>
                <h3 className="mt-2">{dashboardData?.statistics?.totalRequests || 0}</h3>
                <small className="text-muted">{t("you_have_requests_2")}</small>
                <p className="card-text mt-2">
                  {t("requester_dashboard_text_3")}
                </p>
                <Link
                  className={`${styles.primaryButton} btn`}
                  to="/requesterBase/requesterRequests"
                >
                  {t("manage")}
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
                <h4 className="card-title">{t("how_it_works")}</h4>
                <i className="fa-solid fa-book fa-lg mt-4"></i>
                <p className="card-text mt-2">
                  {t("requester_dashboard_text_4")}
                </p>
                <div className="alert alert-success" role="alert">
                  <small>
                    <i className="fa-solid fa-lightbulb me-2"></i>{t("recommended_for_new_users")}
                  </small>
                </div>
              </div>
            </Link>
          </div>
        </div>
        <div className="alert alert-primary mt-5" role="alert">
          {t("requester_dashboard_text_5")}
        </div>
      </div>
    </>
  );
}

export default RequesterDashboard;
